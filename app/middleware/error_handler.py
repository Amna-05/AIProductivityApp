"""
Global error handling middleware for consistent error responses.

Provides centralized error handling for:
- Unhandled exceptions
- Validation errors
- Database errors
- Custom API exceptions

All errors are logged with correlation IDs and sent to Sentry.
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from loguru import logger


async def global_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """
    Handle all unhandled exceptions.

    This is the last line of defense - it catches anything that
    wasn't handled by more specific handlers.

    Args:
        request: FastAPI request object
        exc: The exception that was raised

    Returns:
        JSON response with error details
    """
    correlation_id = getattr(request.state, "correlation_id", "unknown")

    # Log error with full context
    logger.bind(
        correlation_id=correlation_id,
        path=request.url.path,
        method=request.method,
        error_type=type(exc).__name__,
        user_id=getattr(request.state, "user_id", None),
    ).error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}",
        exc_info=exc,
    )

    # Send to Sentry (if configured)
    try:
        import sentry_sdk
        sentry_sdk.capture_exception(exc)
    except ImportError:
        pass  # Sentry not configured

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "detail": (
                "An unexpected error occurred. "
                "Please try again later or contact support."
            ),
            "correlation_id": correlation_id,
            "path": str(request.url.path),
        },
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Handle Pydantic validation errors with detailed messages.

    This provides clear feedback to API consumers about what
    went wrong with their request.

    Args:
        request: FastAPI request object
        exc: Validation exception from Pydantic

    Returns:
        JSON response with detailed validation errors
    """
    correlation_id = getattr(request.state, "correlation_id", "unknown")

    # Extract validation errors
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(x) for x in error["loc"][1:]),  # Skip 'body'
            "message": error["msg"],
            "type": error["type"],
            "input": error.get("input"),
        })

    # Log validation error (warning level - not critical)
    logger.bind(
        correlation_id=correlation_id,
        path=request.url.path,
        method=request.method,
        errors=errors,
        user_id=getattr(request.state, "user_id", None),
    ).warning(
        f"Validation error on {request.method} {request.url.path}: "
        f"{len(errors)} field(s) failed validation"
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "ValidationError",
            "detail": "Request validation failed",
            "errors": errors,
            "correlation_id": correlation_id,
        },
    )


async def database_exception_handler(
    request: Request, exc: SQLAlchemyError
) -> JSONResponse:
    """
    Handle database errors gracefully.

    Provides user-friendly error messages while logging the
    technical details for debugging.

    Args:
        request: FastAPI request object
        exc: SQLAlchemy exception

    Returns:
        JSON response with appropriate error message
    """
    correlation_id = getattr(request.state, "correlation_id", "unknown")

    # Log database error
    logger.bind(
        correlation_id=correlation_id,
        path=request.url.path,
        method=request.method,
        error_type=type(exc).__name__,
        user_id=getattr(request.state, "user_id", None),
    ).error(
        f"Database error: {type(exc).__name__}: {str(exc)}",
        exc_info=exc,
    )

    # Send to Sentry
    try:
        import sentry_sdk
        sentry_sdk.capture_exception(exc)
    except ImportError:
        pass

    # Handle specific database errors
    if isinstance(exc, IntegrityError):
        # Usually means duplicate key or foreign key constraint violation
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "error": "DatabaseIntegrityError",
                "detail": (
                    "A database constraint was violated. "
                    "The requested operation conflicts with existing data. "
                    "This usually means the resource already exists or "
                    "references invalid data."
                ),
                "correlation_id": correlation_id,
            },
        )

    # Generic database error
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": "DatabaseError",
            "detail": (
                "A database error occurred. "
                "Please try again later or contact support if the problem persists."
            ),
            "correlation_id": correlation_id,
        },
    )


async def custom_api_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """
    Handle custom API exceptions (from app.core.exceptions).

    This handler catches exceptions like TaskNotFoundException,
    TaskValidationException, etc.

    Args:
        request: FastAPI request object
        exc: Custom API exception

    Returns:
        JSON response with error details
    """
    correlation_id = getattr(request.state, "correlation_id", "unknown")

    # Get status code from exception (default to 500)
    status_code = getattr(exc, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Get detail message
    detail = getattr(exc, "detail", str(exc))

    # Log based on severity
    if status_code >= 500:
        log_level = "error"
    elif status_code >= 400:
        log_level = "warning"
    else:
        log_level = "info"

    logger.bind(
        correlation_id=correlation_id,
        path=request.url.path,
        method=request.method,
        error_type=type(exc).__name__,
        status_code=status_code,
        user_id=getattr(request.state, "user_id", None),
    ).log(
        log_level.upper(),
        f"API exception: {type(exc).__name__}: {detail}"
    )

    # Send to Sentry only if 500-level error
    if status_code >= 500:
        try:
            import sentry_sdk
            sentry_sdk.capture_exception(exc)
        except ImportError:
            pass

    return JSONResponse(
        status_code=status_code,
        content={
            "error": type(exc).__name__,
            "detail": detail,
            "correlation_id": correlation_id,
        },
    )
