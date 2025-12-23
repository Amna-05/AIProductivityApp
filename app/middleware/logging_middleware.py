"""
Request/response logging middleware with correlation IDs.

This middleware:
- Generates unique correlation IDs for request tracing
- Logs all incoming requests with metadata
- Logs all responses with status codes and duration
- Adds correlation ID to response headers
- Alerts on slow requests
"""

import time
import uuid
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from loguru import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Log all requests and responses with correlation IDs for tracing.

    Correlation IDs allow you to trace a request through all logs,
    which is critical for debugging in production.
    """

    # Performance thresholds
    SLOW_REQUEST_THRESHOLD = 1.0  # 1 second
    VERY_SLOW_REQUEST_THRESHOLD = 3.0  # 3 seconds

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Process request and log details."""

        # Generate correlation ID for request tracing
        correlation_id = str(uuid.uuid4())
        request.state.correlation_id = correlation_id

        # Start timer
        start_time = time.time()

        # Extract user info if authenticated
        user_id = getattr(request.state, "user_id", None)

        # Build log context
        log_context = {
            "correlation_id": correlation_id,
            "user_id": user_id,
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent", "unknown"),
        }

        # Log request start
        logger.bind(**log_context).info(
            f"→ {request.method} {request.url.path}"
        )

        # Process request
        try:
            response = await call_next(request)

            # Calculate duration
            duration = time.time() - start_time
            duration_ms = round(duration * 1000, 2)

            # Update log context with response info
            log_context.update({
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            })

            # Determine log level based on status code and duration
            if response.status_code >= 500:
                log_level = "error"
            elif response.status_code >= 400:
                log_level = "warning"
            elif duration > self.VERY_SLOW_REQUEST_THRESHOLD:
                log_level = "error"
            elif duration > self.SLOW_REQUEST_THRESHOLD:
                log_level = "warning"
            else:
                log_level = "info"

            # Log response
            log_message = (
                f"← {request.method} {request.url.path} "
                f"→ {response.status_code} ({duration_ms}ms)"
            )

            logger.bind(**log_context).log(log_level.upper(), log_message)

            # Add correlation ID and performance info to response headers
            response.headers["X-Correlation-ID"] = correlation_id
            response.headers["X-Response-Time"] = f"{duration_ms}ms"

            # Alert on slow requests
            if duration > self.VERY_SLOW_REQUEST_THRESHOLD:
                logger.bind(**log_context).error(
                    f"⚠️  VERY SLOW REQUEST: {request.method} {request.url.path} "
                    f"took {duration:.2f}s - investigate immediately!",
                    duration_seconds=duration,
                    threshold="very_slow",
                )
            elif duration > self.SLOW_REQUEST_THRESHOLD:
                logger.bind(**log_context).warning(
                    f"⚠️  Slow request: {request.method} {request.url.path} "
                    f"took {duration:.2f}s - consider optimization",
                    duration_seconds=duration,
                    threshold="slow",
                )

            return response

        except Exception as e:
            # Calculate duration even for failed requests
            duration = time.time() - start_time
            duration_ms = round(duration * 1000, 2)

            # Log error
            log_context.update({
                "duration_ms": duration_ms,
                "error": str(e),
                "error_type": type(e).__name__,
            })

            logger.bind(**log_context).error(
                f"✗ {request.method} {request.url.path} "
                f"→ FAILED: {type(e).__name__}: {str(e)} ({duration_ms}ms)",
                exc_info=e,
            )

            # Re-raise to let error handlers deal with it
            raise
