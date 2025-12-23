"""
Structured logging configuration with Loguru and Sentry integration.

This module provides production-grade logging with:
- Multi-output logging (console, file, JSON)
- Automatic log rotation and compression
- Sentry integration for error tracking
- Interception of standard logging
- Sensitive data filtering
"""

import sys
import logging
from pathlib import Path
from typing import Optional
from loguru import logger


class InterceptHandler(logging.Handler):
    """
    Intercept standard logging and route to Loguru.

    This allows us to capture logs from third-party libraries
    (like SQLAlchemy, uvicorn) and process them through Loguru.
    """

    def emit(self, record: logging.LogRecord) -> None:
        """Emit a log record to Loguru."""
        # Get corresponding Loguru level
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Find caller from where originated the logged message
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


def setup_logging(debug: bool = False, log_level: str = "INFO") -> None:
    """
    Configure Loguru for structured logging.

    Args:
        debug: Enable debug mode with more verbose output
        log_level: Minimum log level (DEBUG, INFO, WARNING, ERROR)
    """
    # Remove default handler
    logger.remove()

    # Determine log level
    level = "DEBUG" if debug else log_level

    # Console output (dev-friendly with colors)
    logger.add(
        sys.stdout,
        level=level,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level> | "
            "{extra}"
        ),
        colorize=True,
        backtrace=True,
        diagnose=debug,  # Show variables only in debug mode
    )

    # Create logs directory
    log_path = Path("logs")
    log_path.mkdir(exist_ok=True)

    # File output (production logs with daily rotation)
    logger.add(
        log_path / "app_{time:YYYY-MM-DD}.log",
        rotation="00:00",  # New file at midnight
        retention="30 days",  # Keep logs for 30 days
        compression="zip",  # Compress old logs
        level="INFO",
        format=(
            "{time:YYYY-MM-DD HH:mm:ss} | "
            "{level: <8} | "
            "{name}:{function}:{line} | "
            "{message} | "
            "{extra}"
        ),
        backtrace=True,
        diagnose=False,  # Don't leak sensitive info in prod logs
        enqueue=True,  # Async logging
    )

    # Error file (separate for critical issues)
    logger.add(
        log_path / "error_{time:YYYY-MM-DD}.log",
        rotation="10 MB",  # Rotate when file reaches 10MB
        retention="60 days",  # Keep error logs longer
        compression="zip",
        level="ERROR",
        format=(
            "{time:YYYY-MM-DD HH:mm:ss} | "
            "{level: <8} | "
            "{name}:{function}:{line} | "
            "{extra} | "
            "{message}"
        ),
        backtrace=True,
        diagnose=True,  # Full diagnosis for errors
        enqueue=True,
    )

    # JSON output for log aggregation (ELK, DataDog, CloudWatch, etc.)
    logger.add(
        log_path / "app_json_{time:YYYY-MM-DD}.log",
        rotation="100 MB",
        retention="14 days",
        compression="zip",
        level="INFO",
        serialize=True,  # JSON format
        enqueue=True,
    )

    # Intercept standard logging (for SQLAlchemy, uvicorn, etc.)
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

    # Silence noisy loggers
    logging.getLogger("uvicorn.access").handlers = [InterceptHandler()]
    logging.getLogger("uvicorn.error").handlers = [InterceptHandler()]
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    logger.info(
        "Logging system initialized",
        environment="debug" if debug else "production",
        level=level,
    )


def setup_sentry(
    sentry_dsn: Optional[str],
    environment: str = "development",
    version: str = "1.0.0",
) -> None:
    """
    Initialize Sentry for error tracking.

    Args:
        sentry_dsn: Sentry DSN URL (get from sentry.io)
        environment: Environment name (development, staging, production)
        version: Application version for release tracking
    """
    if not sentry_dsn:
        logger.warning(
            "Sentry DSN not configured, error tracking disabled. "
            "Set SENTRY_DSN environment variable to enable."
        )
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.asgi import SentryAsgiMiddleware
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration

        # Configure Sentry integrations
        sentry_logging = LoggingIntegration(
            level=logging.INFO,  # Capture info and above
            event_level=logging.ERROR  # Send errors as events
        )

        sentry_sdk.init(
            dsn=sentry_dsn,
            environment=environment,
            release=f"task-manager@{version}",
            traces_sample_rate=0.1,  # 10% performance tracing
            profiles_sample_rate=0.1,  # 10% profiling
            integrations=[
                SqlalchemyIntegration(),
                sentry_logging,
            ],
            send_default_pii=False,  # GDPR compliance - don't send user data
            before_send=_filter_sensitive_data,
            # Ignore common errors
            ignore_errors=[
                KeyboardInterrupt,
                BrokenPipeError,
            ],
        )

        logger.info(
            "Sentry initialized",
            environment=environment,
            version=version,
            dsn_preview=sentry_dsn[:25] + "...",
        )
    except ImportError:
        logger.error(
            "sentry-sdk not installed. Run: pip install sentry-sdk[fastapi]"
        )
    except Exception as e:
        logger.error(f"Failed to initialize Sentry: {str(e)}", exc_info=e)


def _filter_sensitive_data(event: dict, hint: dict) -> Optional[dict]:
    """
    Remove sensitive data from Sentry events.

    This is critical for GDPR compliance and security.

    Args:
        event: Sentry event dict
        hint: Additional context

    Returns:
        Filtered event or None to drop the event
    """
    # List of sensitive field names
    sensitive_fields = [
        "password",
        "token",
        "api_key",
        "secret",
        "authorization",
        "cookie",
        "session",
        "csrf",
        "hashed_password",
    ]

    # Filter request data
    if "request" in event:
        # Filter headers
        if "headers" in event["request"]:
            headers = event["request"]["headers"]
            for key in list(headers.keys()):
                if any(field in key.lower() for field in sensitive_fields):
                    headers[key] = "[REDACTED]"

        # Filter POST data
        if "data" in event["request"]:
            data = event["request"]["data"]
            if isinstance(data, dict):
                for key in list(data.keys()):
                    if any(field in key.lower() for field in sensitive_fields):
                        data[key] = "[REDACTED]"

        # Filter query params
        if "query_string" in event["request"]:
            qs = event["request"]["query_string"]
            for field in sensitive_fields:
                if field in qs.lower():
                    event["request"]["query_string"] = "[REDACTED]"

    # Filter user data
    if "user" in event:
        user = event["user"]
        # Keep user ID for tracking, but remove email/username
        if "email" in user:
            user["email"] = "[REDACTED]"
        if "username" in user:
            user["username"] = "[REDACTED]"

    return event
