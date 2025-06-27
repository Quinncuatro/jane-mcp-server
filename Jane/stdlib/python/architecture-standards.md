---
title: Python Architecture Standards
description: Architectural patterns and project standards for Python apps, with emphasis on FastAPI applications, async patterns, and maintainable code organization
tags:
  - fastapi
  - async
  - project-structure
  - patterns
createdAt: '2025-06-27T15:39:08.522Z'
updatedAt: '2025-06-27T15:39:08.522Z'
---

# Python Architecture Standards

## Overview

This document defines architectural patterns and project structure standards for Python applications, with emphasis on FastAPI applications, async patterns, and maintainable code organization.

## Project Structure Standards

### Standard Python Project Layout
```
my-project/
├── src/
│   └── my_project/          # Main package (use underscores)
│       ├── __init__.py
│       ├── main.py          # Application entry point
│       ├── config.py        # Configuration management
│       ├── models/          # Data models
│       ├── services/        # Business logic
│       ├── api/             # API routes (FastAPI)
│       └── utils/           # Utility functions
├── tests/                   # Test package
├── docs/                    # Documentation
├── scripts/                 # Development/deployment scripts
├── pyproject.toml          # Project configuration
├── requirements.txt        # Or use pyproject.toml dependencies
├── .env.example            # Environment template
├── Dockerfile              # Container definition
└── README.md
```

### FastAPI Application Structure
```
src/my_project/
├── __init__.py
├── main.py                 # FastAPI app creation and startup
├── config.py              # Settings with pydantic BaseSettings
├── dependencies.py        # Dependency injection
├── middleware.py          # Custom middleware
├── exceptions.py          # Custom exception handlers
├── models/
│   ├── __init__.py
│   ├── base.py           # Base model classes
│   ├── user.py           # Domain models
│   └── requests.py       # Request/response models
├── api/
│   ├── __init__.py
│   ├── router.py         # Main router assembly
│   └── v1/               # API versioning
│       ├── __init__.py
│       ├── auth.py       # Authentication routes
│       └── users.py      # User management routes
├── services/
│   ├── __init__.py
│   ├── auth_service.py   # Business logic services
│   └── user_service.py
└── utils/
    ├── __init__.py
    ├── logging.py        # Logging configuration
    └── security.py      # Security utilities
```

## Architectural Patterns

### Dependency Injection Pattern
```python
# dependencies.py
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from .database import get_async_session

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with get_async_session() as session:
        yield session

# In route handlers
@router.post("/users/")
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    return await user_service.create_user(db, user_data)
```

### Service Layer Pattern
```python
# services/user_service.py
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.user import User, UserCreate

class UserService:
    @staticmethod
    async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
        # Business logic here
        pass

    @staticmethod
    async def get_users(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[User]:
        # Query logic here
        pass
```

### Repository Pattern (Optional for Complex Apps)
```python
# repositories/user_repository.py
from abc import ABC, abstractmethod
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

class UserRepositoryInterface(ABC):
    @abstractmethod
    async def create(self, user_data: UserCreate) -> User:
        pass

class SQLAlchemyUserRepository(UserRepositoryInterface):
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_data: UserCreate) -> User:
        # Implementation
        pass
```

## Configuration Management

### Environment-Based Configuration
```python
# config.py
from pydantic import BaseSettings, Field
from typing import Optional

class Settings(BaseSettings):
    # Application settings
    app_name: str = "My Application"
    debug: bool = False
    version: str = "1.0.0"

    # Database
    database_url: str = Field(..., env="DATABASE_URL")

    # Security
    secret_key: str = Field(..., env="SECRET_KEY")
    access_token_expire_minutes: int = 30

    # External APIs
    external_api_key: Optional[str] = Field(None, env="EXTERNAL_API_KEY")

    class Config:
        env_file = ".env"
        case_sensitive = False

# Singleton pattern for settings
@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

## Async/Await Best Practices

### Async Function Guidelines
```python
# Good: Properly async all the way down
async def process_data(data: List[dict]) -> List[ProcessedData]:
    tasks = [process_item_async(item) for item in data]
    return await asyncio.gather(*tasks)

async def process_item_async(item: dict) -> ProcessedData:
    async with httpx.AsyncClient() as client:
        response = await client.post("/api/process", json=item)
        return ProcessedData.parse_obj(response.json())

# Avoid: Blocking operations in async functions
async def bad_example():
    time.sleep(1)  # DON'T DO THIS
    requests.get("http://api.com")  # DON'T DO THIS
```

### Context Managers for Resources
```python
# Database connections
from contextlib import asynccontextmanager

@asynccontextmanager
async def get_db_session():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

## Error Handling Architecture

### Structured Exception Hierarchy
```python
# exceptions.py
class ApplicationError(Exception):
    """Base application exception"""
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)

class ValidationError(ApplicationError):
    """Data validation errors"""
    pass

class NotFoundError(ApplicationError):
    """Resource not found errors"""
    pass

class AuthenticationError(ApplicationError):
    """Authentication/authorization errors"""
    pass
```

### Global Exception Handlers
```python
# In main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "message": exc.message,
            "error_code": exc.error_code
        }
    )
```

## Validation

### Architecture Checklist
- [ ] Clear separation of concerns (API, business logic, data access)
- [ ] Dependency injection used for testability
- [ ] Configuration externalized and environment-specific
- [ ] Async/await used consistently throughout async code paths
- [ ] Proper error handling with custom exceptions
- [ ] Resource management with context managers
- [ ] API versioning strategy implemented
- [ ] Health check endpoints included
- [ ] Logging configured at application startup

### Code Review Points
- Services contain business logic, not data access details
- Routes are thin and delegate to services
- Dependencies are injected, not imported directly
- Async functions don't block the event loop
- Configuration is validated at startup
- Exceptions include sufficient context for debugging
- Resource cleanup is handled properly

## Examples

### FastAPI Application Bootstrap
```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.router import api_router
from .config import get_settings
from .middleware import setup_middleware
import logging

def create_application() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        debug=settings.debug
    )

    # Middleware
    setup_middleware(app)

    # Routes
    app.include_router(api_router, prefix="/api/v1")

    # Health check
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": settings.version}

    return app

app = create_application()
```

This architecture ensures maintainable, testable, and scalable Python applications with clear separation of concerns and proper async handling.