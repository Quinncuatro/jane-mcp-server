---
title: Python Error Handling Standards
description: A document outlining standards for exception handling, error reporting, and resilient application design in Python applications
tags:
  - exceptions
  - logging
  - debugging
  - resilience
createdAt: '2025-06-27T15:39:08.522Z'
updatedAt: '2025-06-27T15:39:08.522Z'
---

# Python Error Handling Standards

## Overview

This document defines standards for exception handling, error reporting, and resilient application design in Python applications. Proper error handling ensures applications fail gracefully and provide meaningful feedback for debugging and monitoring.

## Exception Hierarchy

### Custom Exception Classes
```python
# exceptions.py
class ApplicationError(Exception):
    """Base exception for all application errors."""

    def __init__(
        self,
        message: str,
        error_code: str = None,
        details: dict = None
    ) -> None:
        self.message = message
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> dict:
        """Convert exception to dictionary for serialization."""
        return {
            "error": self.error_code,
            "message": self.message,
            "details": self.details
        }

class ValidationError(ApplicationError):
    """Data validation errors."""
    pass

class NotFoundError(ApplicationError):
    """Resource not found errors."""
    pass

class AuthenticationError(ApplicationError):
    """Authentication and authorization errors."""
    pass

class ExternalServiceError(ApplicationError):
    """External service communication errors."""
    pass

class DatabaseError(ApplicationError):
    """Database operation errors."""
    pass

class ConfigurationError(ApplicationError):
    """Application configuration errors."""
    pass
```

### Exception Usage Patterns
```python
# Good: Specific, informative exceptions
def get_user_by_id(user_id: int) -> User:
    if user_id <= 0:
        raise ValidationError(
            f"Invalid user ID: {user_id}",
            error_code="INVALID_USER_ID",
            details={"user_id": user_id, "minimum": 1}
        )

    user = database.find_user(user_id)
    if not user:
        raise NotFoundError(
            f"User not found",
            error_code="USER_NOT_FOUND",
            details={"user_id": user_id}
        )

    return user

# Good: Exception chaining for context
async def fetch_user_profile(user_id: int) -> UserProfile:
    try:
        user = get_user_by_id(user_id)
        profile_data = await external_api.get_profile(user.external_id)
        return UserProfile.parse_obj(profile_data)
    except httpx.RequestError as e:
        raise ExternalServiceError(
            "Failed to fetch user profile from external service",
            error_code="PROFILE_FETCH_FAILED",
            details={"user_id": user_id, "external_id": user.external_id}
        ) from e
```

## Error Handling Patterns

### Try-Catch Best Practices
```python
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Good: Specific exception handling
async def process_payment(payment_data: PaymentData) -> PaymentResult:
    try:
        # Validate payment data
        validated_data = validate_payment_data(payment_data)

        # Process payment
        result = await payment_gateway.process(validated_data)

        logger.info("Payment processed successfully", extra={
            "payment_id": result.payment_id,
            "amount": validated_data.amount,
            "user_id": validated_data.user_id
        })

        return result

    except ValidationError as e:
        logger.warning("Payment validation failed", extra={
            "error": str(e),
            "payment_data": payment_data.dict()
        })
        raise  # Re-raise for caller to handle

    except PaymentGatewayError as e:
        logger.error("Payment gateway error", extra={
            "error": str(e),
            "payment_data": payment_data.dict(),
            "gateway": payment_gateway.name
        }, exc_info=True)

        # Convert to application error
        raise ExternalServiceError(
            "Payment processing failed",
            error_code="PAYMENT_GATEWAY_ERROR",
            details={"gateway_error": str(e)}
        ) from e

    except Exception as e:
        logger.error("Unexpected error processing payment", extra={
            "error": str(e),
            "payment_data": payment_data.dict()
        }, exc_info=True)

        # Don't expose internal errors
        raise ApplicationError(
            "Internal error processing payment",
            error_code="INTERNAL_ERROR"
        ) from e
```

### Resource Management
```python
from contextlib import asynccontextmanager
from typing import AsyncGenerator

# Good: Context managers for resource cleanup
@asynccontextmanager
async def database_transaction() -> AsyncGenerator[AsyncSession, None]:
    """Manage database transaction with automatic rollback on error."""
    session = get_async_session()
    transaction = await session.begin()

    try:
        yield session
        await transaction.commit()
        logger.debug("Database transaction committed")
    except Exception as e:
        await transaction.rollback()
        logger.warning("Database transaction rolled back", extra={
            "error": str(e)
        })
        raise
    finally:
        await session.close()

# Usage
async def create_user_with_profile(
    user_data: UserCreate,
    profile_data: ProfileCreate
) -> User:
    async with database_transaction() as session:
        user = User(**user_data.dict())
        session.add(user)
        await session.flush()  # Get user.id

        profile = Profile(**profile_data.dict(), user_id=user.id)
        session.add(profile)

        return user
```

### Retry Mechanisms
```python
import asyncio
from functools import wraps
from typing import Callable, TypeVar, Any

T = TypeVar('T')

def retry_on_exception(
    max_attempts: int = 3,
    delay: float = 1.0,
    backoff_factor: float = 2.0,
    exceptions: tuple = (Exception,)
):
    """Decorator to retry function on specified exceptions."""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            last_exception = None

            for attempt in range(max_attempts):
                try:
                    if asyncio.iscoroutinefunction(func):
                        return await func(*args, **kwargs)
                    else:
                        return func(*args, **kwargs)

                except exceptions as e:
                    last_exception = e

                    if attempt == max_attempts - 1:
                        logger.error(f"Function {func.__name__} failed after {max_attempts} attempts", extra={
                            "attempts": max_attempts,
                            "error": str(e)
                        })
                        break

                    sleep_time = delay * (backoff_factor ** attempt)
                    logger.warning(f"Function {func.__name__} failed, retrying in {sleep_time}s", extra={
                        "attempt": attempt + 1,
                        "max_attempts": max_attempts,
                        "error": str(e)
                    })

                    await asyncio.sleep(sleep_time)

            raise last_exception

        return wrapper
    return decorator

# Usage
@retry_on_exception(
    max_attempts=3,
    delay=1.0,
    exceptions=(httpx.RequestError, ExternalServiceError)
)
async def fetch_external_data(url: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30.0)
        response.raise_for_status()
        return response.json()
```

## Logging Integration

### Structured Logging
```python
import logging
import json
from typing import Any, Dict

class StructuredFormatter(logging.Formatter):
    """JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }

        # Add extra fields
        if hasattr(record, 'extra'):
            log_data.update(record.extra)

        # Add exception info
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)

# Configure logging
def setup_logging(level: str = "INFO") -> None:
    """Configure application logging."""
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, level.upper()))

    handler = logging.StreamHandler()
    handler.setFormatter(StructuredFormatter())
    logger.addHandler(handler)

    # Suppress noisy third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
```

### Error Context Logging
```python
from contextvars import ContextVar
from typing import Optional

# Request context for correlation
request_id: ContextVar[Optional[str]] = ContextVar('request_id', default=None)
user_id: ContextVar[Optional[int]] = ContextVar('user_id', default=None)

class ContextualLogger:
    """Logger that automatically includes context information."""

    def __init__(self, name: str) -> None:
        self.logger = logging.getLogger(name)

    def _get_context(self) -> Dict[str, Any]:
        """Get current context for logging."""
        context = {}

        if req_id := request_id.get():
            context["request_id"] = req_id

        if uid := user_id.get():
            context["user_id"] = uid

        return context

    def info(self, message: str, **kwargs) -> None:
        context = self._get_context()
        context.update(kwargs)
        self.logger.info(message, extra=context)

    def error(self, message: str, **kwargs) -> None:
        context = self._get_context()
        context.update(kwargs)
        self.logger.error(message, extra=context, exc_info=True)

# Usage
logger = ContextualLogger(__name__)

async def process_request(request_data: dict) -> dict:
    request_id.set(generate_request_id())
    user_id.set(request_data.get("user_id"))

    try:
        result = await complex_operation(request_data)
        logger.info("Request processed successfully", extra={
            "operation": "complex_operation",
            "data_size": len(request_data)
        })
        return result
    except Exception as e:
        logger.error("Request processing failed", extra={
            "operation": "complex_operation",
            "error": str(e)
        })
        raise
```

## FastAPI Error Handling

### Global Exception Handlers
```python
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

app = FastAPI()

@app.exception_handler(ApplicationError)
async def application_error_handler(
    request: Request,
    exc: ApplicationError
) -> JSONResponse:
    """Handle custom application errors."""
    logger.warning("Application error occurred", extra={
        "path": request.url.path,
        "method": request.method,
        "error_code": exc.error_code,
        "error_message": exc.message
    })

    return JSONResponse(
        status_code=400,
        content=exc.to_dict()
    )

@app.exception_handler(NotFoundError)
async def not_found_error_handler(
    request: Request,
    exc: NotFoundError
) -> JSONResponse:
    """Handle not found errors."""
    return JSONResponse(
        status_code=404,
        content=exc.to_dict()
    )

@app.exception_handler(AuthenticationError)
async def auth_error_handler(
    request: Request,
    exc: AuthenticationError
) -> JSONResponse:
    """Handle authentication errors."""
    return JSONResponse(
        status_code=401,
        content=exc.to_dict()
    )

@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors."""
    return JSONResponse(
        status_code=422,
        content={
            "error": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "details": exc.errors()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """Handle unexpected exceptions."""
    logger.error("Unexpected error occurred", extra={
        "path": request.url.path,
        "method": request.method,
        "error": str(exc)
    }, exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_ERROR",
            "message": "An internal error occurred"
        }
    )
```

## Circuit Breaker Pattern

### Circuit Breaker Implementation
```python
import time
from enum import Enum
from typing import Callable, Any

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    """Circuit breaker for external service calls."""

    def __init__(
        self,
        failure_threshold: int = 5,
        timeout: float = 60.0,
        expected_exception: type = Exception
    ) -> None:
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.expected_exception = expected_exception

        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection."""
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time < self.timeout:
                raise ExternalServiceError(
                    "Circuit breaker is OPEN",
                    error_code="CIRCUIT_BREAKER_OPEN"
                )
            else:
                self.state = CircuitState.HALF_OPEN

        try:
            result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            self._on_success()
            return result
        except self.expected_exception as e:
            self._on_failure()
            raise

    def _on_success(self) -> None:
        """Handle successful call."""
        self.failure_count = 0
        self.state = CircuitState.CLOSED

    def _on_failure(self) -> None:
        """Handle failed call."""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

# Usage
payment_circuit = CircuitBreaker(
    failure_threshold=3,
    timeout=30.0,
    expected_exception=ExternalServiceError
)

async def process_payment_with_circuit_breaker(payment_data: PaymentData) -> PaymentResult:
    return await payment_circuit.call(
        payment_gateway.process_payment,
        payment_data
    )
```

## Validation

### Error Handling Checklist
- [ ] Custom exception hierarchy defined
- [ ] Specific exceptions for different error types
- [ ] Exception chaining used to preserve context
- [ ] Resource cleanup handled with context managers
- [ ] Retry mechanisms for transient failures
- [ ] Structured logging with context information
- [ ] Global exception handlers for FastAPI
- [ ] Circuit breakers for external service calls
- [ ] Error responses include actionable information
- [ ] Sensitive information not exposed in error messages

### Testing Error Scenarios
```python
import pytest
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_user_not_found_error():
    """Test that NotFoundError is raised for non-existent user."""
    with pytest.raises(NotFoundError) as exc_info:
        await get_user_by_id(999)

    assert exc_info.value.error_code == "USER_NOT_FOUND"
    assert "999" in str(exc_info.value)

@pytest.mark.asyncio
async def test_payment_retry_mechanism():
    """Test retry mechanism for transient failures."""
    mock_gateway = AsyncMock()
    mock_gateway.process_payment.side_effect = [
        ExternalServiceError("Temporary failure"),
        ExternalServiceError("Temporary failure"),
        PaymentResult(payment_id="12345")
    ]

    result = await process_payment_with_retry(payment_data)
    assert result.payment_id == "12345"
    assert mock_gateway.process_payment.call_count == 3
```

These error handling standards ensure robust, debuggable, and maintainable Python applications that fail gracefully and provide meaningful feedback for monitoring and troubleshooting.