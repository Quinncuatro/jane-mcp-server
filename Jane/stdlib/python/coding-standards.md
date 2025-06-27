---
title: Python Coding Standards
description: A document outlining coding style, naming conventions, and code organization standards for Python development
tags:
  - style
  - formatting
  - conventions
  - best-practices
createdAt: '2025-06-27T15:39:08.522Z'
updatedAt: '2025-06-27T15:39:08.522Z'
---

# Python Coding Standards

## Overview

This document defines coding style, naming conventions, and code organization standards for Python development. These standards ensure consistency, readability, and maintainability across all Python projects.

## Code Formatting

### Tools and Configuration
```toml
# pyproject.toml
[tool.black]
line-length = 88
target-version = ['py39']
include = '\.pyi?$'
exclude = '''
/(
    \.eggs
  | \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | _build
  | buck-out
  | build
  | dist
)/
'''

[tool.isort]
profile = "black"
multi_line_output = 3
line_length = 88
```

### Required Tools
- **Black**: Code formatting (non-negotiable)
- **isort**: Import sorting
- **flake8**: Linting
- **mypy**: Type checking
- **pre-commit**: Git hooks

## Naming Conventions

### Variables and Functions
```python
# Good: snake_case for variables and functions
user_count = 10
max_retry_attempts = 3

def calculate_total_price(items: List[Item]) -> Decimal:
    pass

def get_user_by_id(user_id: int) -> Optional[User]:
    pass

# Bad: camelCase or PascalCase for variables
userCount = 10  # DON'T DO THIS
maxRetryAttempts = 3  # DON'T DO THIS
```

### Classes and Types
```python
# Good: PascalCase for classes
class UserService:
    pass

class DatabaseConnection:
    pass

# Type aliases
UserId = int
UserDict = Dict[str, Any]

# Enums
class UserStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
```

### Constants and Configuration
```python
# Good: SCREAMING_SNAKE_CASE for constants
DEFAULT_TIMEOUT = 30
MAX_CONNECTIONS = 100
API_VERSION = "v1"

# Module-level "private" variables
_internal_cache = {}
_logger = logging.getLogger(__name__)
```

### Files and Packages
```python
# Good: snake_case for files and packages
user_service.py
database_connection.py
my_awesome_package/

# Bad: camelCase or PascalCase
userService.py  # DON'T DO THIS
DatabaseConnection.py  # DON'T DO THIS
```

## Type Hints

### Required Type Annotations
```python
from typing import List, Dict, Optional, Union, Any, Callable
from typing import Protocol, TypeVar

# All function signatures must have type hints
def process_users(
    users: List[User],
    max_count: int = 100,
    filter_func: Optional[Callable[[User], bool]] = None
) -> List[User]:
    pass

# Class attributes with type hints
class UserService:
    _cache: Dict[int, User]
    _logger: logging.Logger

    def __init__(self, database_url: str) -> None:
        self._cache = {}
        self._logger = logging.getLogger(__name__)
```

### Generic Types and Protocols
```python
from typing import TypeVar, Generic, Protocol

T = TypeVar('T')

class Repository(Generic[T], Protocol):
    async def get(self, id: int) -> Optional[T]:
        ...

    async def create(self, entity: T) -> T:
        ...

class UserRepository(Repository[User]):
    async def get(self, id: int) -> Optional[User]:
        # Implementation
        pass
```

## Code Organization

### Import Standards
```python
# Import order (enforced by isort)
# 1. Standard library
import asyncio
import logging
from typing import List, Optional
from pathlib import Path

# 2. Third-party packages
import httpx
from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

# 3. Local imports
from .config import get_settings
from .models.user import User
from .services.auth_service import AuthService
```

### Function and Class Organization
```python
class UserService:
    """Service for managing user operations."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._logger = logging.getLogger(__name__)

    # Public methods first
    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user."""
        self._validate_user_data(user_data)
        return await self._save_user(user_data)

    async def get_user(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return await self._fetch_user_by_id(user_id)

    # Private methods last
    def _validate_user_data(self, user_data: UserCreate) -> None:
        """Validate user creation data."""
        pass

    async def _save_user(self, user_data: UserCreate) -> User:
        """Save user to database."""
        pass

    async def _fetch_user_by_id(self, user_id: int) -> Optional[User]:
        """Fetch user from database."""
        pass
```

## Documentation Standards

### Docstrings
```python
def calculate_discount(
    price: Decimal,
    discount_rate: float,
    max_discount: Optional[Decimal] = None
) -> Decimal:
    """Calculate discount amount for a given price.

    Args:
        price: Original price of the item
        discount_rate: Discount rate as a decimal (0.1 for 10%)
        max_discount: Maximum discount amount (optional)

    Returns:
        Calculated discount amount

    Raises:
        ValueError: If discount_rate is negative or > 1.0

    Example:
        >>> calculate_discount(Decimal('100.00'), 0.15)
        Decimal('15.00')
    """
    if discount_rate < 0 or discount_rate > 1.0:
        raise ValueError("Discount rate must be between 0 and 1")

    discount = price * Decimal(str(discount_rate))

    if max_discount and discount > max_discount:
        return max_discount

    return discount
```

### Inline Comments
```python
# Good: Explain WHY, not WHAT
def process_payment(amount: Decimal) -> bool:
    # Apply fraud detection before processing
    # (Required by compliance team as of 2024-01)
    if not fraud_detector.is_safe(amount):
        return False

    return payment_gateway.charge(amount)

# Bad: Comments that just repeat the code
def process_payment(amount: Decimal) -> bool:
    # Check if amount is safe
    if not fraud_detector.is_safe(amount):  # Call fraud detector
        return False  # Return False if not safe

    return payment_gateway.charge(amount)  # Charge the amount
```

## Error Handling Patterns

### Exception Usage
```python
# Good: Specific exception types
def get_user_by_email(email: str) -> User:
    if not email:
        raise ValueError("Email cannot be empty")

    user = database.query_user_by_email(email)
    if not user:
        raise UserNotFoundError(f"User not found: {email}")

    return user

# Good: Exception chaining
async def fetch_user_data(user_id: int) -> UserData:
    try:
        response = await api_client.get(f"/users/{user_id}")
        return UserData.parse_obj(response.json())
    except httpx.RequestError as e:
        raise DataFetchError(f"Failed to fetch user {user_id}") from e
```

### Logging Standards
```python
import logging

logger = logging.getLogger(__name__)

async def process_order(order_id: int) -> None:
    logger.info("Processing order", extra={
        "order_id": order_id,
        "action": "process_start"
    })

    try:
        order = await get_order(order_id)
        await validate_order(order)
        await fulfill_order(order)

        logger.info("Order processed successfully", extra={
            "order_id": order_id,
            "action": "process_complete"
        })
    except OrderValidationError as e:
        logger.warning("Order validation failed", extra={
            "order_id": order_id,
            "error": str(e),
            "action": "validation_failed"
        })
        raise
    except Exception as e:
        logger.error("Unexpected error processing order", extra={
            "order_id": order_id,
            "error": str(e),
            "action": "process_error"
        }, exc_info=True)
        raise
```

## Performance Considerations

### List Comprehensions vs Loops
```python
# Good: List comprehensions for simple transformations
user_ids = [user.id for user in users if user.is_active]

# Good: Generator expressions for large datasets
active_user_ids = (user.id for user in users if user.is_active)

# Avoid: Complex list comprehensions
# Bad - use regular loop instead
result = [
    complex_transformation(item)
    for item in items
    if complex_condition(item) and another_condition(item)
    for sub_item in item.sub_items
    if sub_item.meets_criteria()
]
```

### String Formatting
```python
# Good: f-strings for simple formatting
message = f"User {user.name} has {user.points} points"

# Good: .format() for complex formatting
template = "Processing {count:,} items at {rate:.2f} items/sec"
message = template.format(count=total_items, rate=processing_rate)

# Avoid: % formatting (legacy)
message = "User %s has %d points" % (user.name, user.points)  # DON'T USE
```

## Validation

### Code Quality Checklist
- [ ] All functions have type hints
- [ ] Black formatting applied
- [ ] Imports sorted with isort
- [ ] No flake8 violations
- [ ] mypy type checking passes
- [ ] Docstrings for public functions and classes
- [ ] No overly complex functions (>15 lines, consider refactoring)
- [ ] Consistent naming conventions used
- [ ] Proper exception handling with specific exception types
- [ ] Logging includes structured data where appropriate

### Pre-commit Configuration
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
  - repo: https://github.com/pycqa/isort
    rev: 5.13.2
    hooks:
      - id: isort
  - repo: https://github.com/pycqa/flake8
    rev: 7.0.0
    hooks:
      - id: flake8
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
```

## Examples

### Well-Structured Module
```python
"""User management service module.

This module provides services for creating, updating, and managing
user accounts in the application.
"""

import logging
from typing import List, Optional
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User, UserCreate, UserUpdate
from ..exceptions import UserNotFoundError, ValidationError

logger = logging.getLogger(__name__)


class UserService:
    """Service class for user management operations."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user account."""
        logger.info("Creating new user", extra={"email": user_data.email})

        if await self._email_exists(user_data.email):
            raise ValidationError(f"Email already exists: {user_data.email}")

        user = User(**user_data.dict())
        self._db.add(user)
        await self._db.commit()
        await self._db.refresh(user)

        logger.info("User created successfully", extra={
            "user_id": user.id,
            "email": user.email
        })

        return user

    async def _email_exists(self, email: str) -> bool:
        """Check if email already exists in database."""
        result = await self._db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none() is not None
```

These coding standards ensure consistent, readable, and maintainable Python code across all projects.