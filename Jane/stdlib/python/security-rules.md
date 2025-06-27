---
title: Python Security Standards
description: A document outlining security best practices for Python applications
tags:
  - security
  - authentication
  - validation
  - authorization
createdAt: '2025-06-27T15:39:08.522Z'
updatedAt: '2025-06-27T15:39:08.522Z'
---

# Python Security Standards

## Overview

This document defines security best practices for Python applications, covering authentication, authorization, input validation, and security hardening to protect against common vulnerabilities and attacks.

## Authentication & Authorization

### Password Security
```python
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    """Secure authentication service."""

    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.access_token_expire = timedelta(minutes=30)
        self.refresh_token_expire = timedelta(days=7)

    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt."""
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash."""
        return pwd_context.verify(plain_password, hashed_password)

    def create_access_token(
        self,
        data: dict,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT access token with expiration."""
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + self.access_token_expire

        to_encode.update({
            "exp": expire,
            "type": "access",
            "iat": datetime.utcnow()
        })

        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str) -> Optional[dict]:
        """Verify JWT token and return payload."""
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm]
            )

            if payload.get("type") != "access":
                return None

            return payload
        except JWTError:
            return None
```

### FastAPI Authentication Integration
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    auth_service = get_auth_service()
    payload = auth_service.verify_token(token.credentials)

    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = await get_user_by_id(user_id)
    if user is None:
        raise credentials_exception

    return user

# Role-based authorization decorator
from enum import Enum
from functools import wraps

class UserRole(Enum):
    ADMIN = "admin"
    USER = "user"
    READONLY = "readonly"

def require_role(required_role: UserRole):
    """Decorator to require specific user role."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current user from dependency injection
            current_user = kwargs.get('current_user')

            if not current_user or current_user.role != required_role.value:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requires {required_role.value} role"
                )

            return await func(*args, **kwargs)
        return wrapper
    return decorator
```

## Input Validation & Sanitization

### Secure Input Models
```python
from pydantic import BaseModel, validator, Field
from typing import Optional, List
import re
import html

class SecureUserInput(BaseModel):
    """Secure user input validation with sanitization."""

    email: str = Field(..., max_length=254)
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)
    bio: Optional[str] = Field(None, max_length=1000)

    @validator('email')
    def validate_email(cls, v):
        """Validate email format and normalize."""
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, v):
            raise ValueError('Invalid email format')
        return v.lower().strip()

    @validator('username')
    def validate_username(cls, v):
        """Validate username format."""
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Username can only contain letters, numbers, hyphens, and underscores')
        return v.strip()

    @validator('password')
    def validate_password_strength(cls, v):
        """Enforce strong password requirements."""
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v

    @validator('bio')
    def sanitize_bio(cls, v):
        """Sanitize bio content to prevent XSS."""
        if v:
            # HTML escape and remove dangerous patterns
            v = html.escape(v.strip())
            v = re.sub(r'javascript:', '', v, flags=re.IGNORECASE)
            v = re.sub(r'data:', '', v, flags=re.IGNORECASE)
        return v
```

### SQL Injection Prevention
```python
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

# Good: Parameterized queries with SQLAlchemy ORM
async def get_user_by_email_secure(db: AsyncSession, email: str) -> Optional[User]:
    """Secure user lookup with parameterized query."""
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

# Good: Raw SQL with proper parameter binding
async def get_user_posts_secure(
    db: AsyncSession,
    user_id: int,
    limit: int = 10
) -> List[Post]:
    """Secure raw SQL with parameter binding."""
    query = text("""
        SELECT id, title, content, created_at
        FROM posts
        WHERE user_id = :user_id
        ORDER BY created_at DESC
        LIMIT :limit
    """)

    result = await db.execute(query, {
        "user_id": user_id,
        "limit": limit
    })

    return [Post(**row._asdict()) for row in result]

# Bad: String concatenation (NEVER DO THIS)
async def vulnerable_query(db: AsyncSession, email: str):
    """VULNERABLE - SQL injection risk!"""
    query = f"SELECT * FROM users WHERE email = '{email}'"  # DON'T DO THIS
    return await db.execute(text(query))
```

### File Upload Security
```python
import os
from pathlib import Path
from fastapi import UploadFile, HTTPException
import magic

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.md'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

async def secure_file_upload(file: UploadFile, upload_dir: Path) -> str:
    """Securely handle file uploads with validation."""

    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type {file_ext} not allowed")

    # Validate file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large")

    # Validate MIME type
    mime_type = magic.from_buffer(contents, mime=True)
    allowed_mimes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.pdf': 'application/pdf'
    }

    expected_mime = allowed_mimes.get(file_ext)
    if expected_mime and mime_type != expected_mime:
        raise HTTPException(400, "File content doesn't match extension")

    # Generate secure filename
    secure_filename = f"{uuid4()}{file_ext}"
    file_path = upload_dir / secure_filename

    # Ensure upload directory exists and is secure
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Write file securely
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(contents)

    return str(file_path)
```

## Security Middleware

### Rate Limiting
```python
import time
from collections import defaultdict, deque
from fastapi import Request, HTTPException
import redis.asyncio as redis

class RateLimiter:
    """Redis-based distributed rate limiter."""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    async def is_allowed(
        self,
        key: str,
        limit: int,
        window: int
    ) -> bool:
        """Check if request is within rate limit."""
        current_time = int(time.time())
        window_start = current_time - window

        pipe = self.redis.pipeline()

        # Remove expired entries
        pipe.zremrangebyscore(key, 0, window_start)

        # Count current requests
        pipe.zcard(key)

        # Add current request
        pipe.zadd(key, {str(current_time): current_time})

        # Set expiry
        pipe.expire(key, window)

        results = await pipe.execute()
        current_requests = results[1]

        return current_requests < limit

# Rate limiting middleware
class RateLimitMiddleware:
    """FastAPI middleware for rate limiting."""

    def __init__(self, app, rate_limiter: RateLimiter):
        self.app = app
        self.rate_limiter = rate_limiter

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        client_ip = request.client.host

        # Check rate limit
        allowed = await self.rate_limiter.is_allowed(
            f"rate_limit:{client_ip}",
            limit=100,
            window=3600
        )

        if not allowed:
            response = JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded"}
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)
```

### Security Headers
```python
from fastapi import Request
from fastapi.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'"

        # Remove server information
        response.headers.pop("Server", None)

        return response
```

## Secure Configuration

### Environment-Based Security Settings
```python
from pydantic import BaseSettings, Field, validator
from typing import List
import secrets

class SecuritySettings(BaseSettings):
    """Security configuration with validation."""

    # JWT Configuration
    secret_key: str = Field(..., env="SECRET_KEY", min_length=32)
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS Settings
    allowed_origins: List[str] = Field(default=["https://yourdomain.com"])
    allowed_methods: List[str] = ["GET", "POST", "PUT", "DELETE"]

    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 3600

    # File Upload Security
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: List[str] = [".jpg", ".png", ".pdf", ".txt"]
    upload_dir: str = "/secure/uploads"

    # Password Policy
    min_password_length: int = 8
    require_uppercase: bool = True
    require_lowercase: bool = True
    require_numbers: bool = True
    require_special_chars: bool = True

    @validator('secret_key')
    def validate_secret_key(cls, v):
        """Ensure secret key is cryptographically secure."""
        if len(v) < 32:
            raise ValueError('Secret key must be at least 32 characters')
        return v

    @classmethod
    def generate_secret_key(cls) -> str:
        """Generate a secure secret key."""
        return secrets.token_urlsafe(32)

    class Config:
        env_file = ".env"
        case_sensitive = False
```

## Cryptographic Operations

### Secure Data Encryption
```python
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os

class SecureDataManager:
    """Handle encryption/decryption of sensitive data."""

    def __init__(self, password: bytes):
        self.key = self._derive_key(password)
        self.cipher = Fernet(self.key)

    def _derive_key(self, password: bytes) -> bytes:
        """Derive encryption key from password using PBKDF2."""
        salt = os.urandom(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        return key

    def encrypt_data(self, data: str) -> bytes:
        """Encrypt sensitive data."""
        return self.cipher.encrypt(data.encode())

    def decrypt_data(self, encrypted_data: bytes) -> str:
        """Decrypt sensitive data."""
        return self.cipher.decrypt(encrypted_data).decode()

    def encrypt_file(self, file_path: Path) -> None:
        """Encrypt file in place."""
        with open(file_path, 'rb') as file:
            file_data = file.read()

        encrypted_data = self.cipher.encrypt(file_data)

        with open(file_path, 'wb') as file:
            file.write(encrypted_data)
```

## Security Monitoring

### Security Event Logging
```python
import logging
from typing import Dict, Any
from datetime import datetime

class SecurityLogger:
    """Dedicated security event logger."""

    def __init__(self):
        self.logger = logging.getLogger("security")
        self._setup_handler()

    def _setup_handler(self):
        """Setup security log handler."""
        handler = logging.FileHandler("logs/security.log")
        formatter = logging.Formatter(
            '%(asctime)s - SECURITY - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

    def log_auth_success(self, user_id: str, ip_address: str):
        """Log successful authentication."""
        self.logger.info("Authentication successful", extra={
            "event_type": "auth_success",
            "user_id": user_id,
            "ip_address": ip_address,
            "timestamp": datetime.utcnow().isoformat()
        })

    def log_auth_failure(self, email: str, ip_address: str, reason: str):
        """Log failed authentication attempt."""
        self.logger.warning("Authentication failed", extra={
            "event_type": "auth_failure",
            "email": email,
            "ip_address": ip_address,
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat()
        })

    def log_permission_denied(self, user_id: str, resource: str, action: str):
        """Log permission denied events."""
        self.logger.warning("Permission denied", extra={
            "event_type": "permission_denied",
            "user_id": user_id,
            "resource": resource,
            "action": action,
            "timestamp": datetime.utcnow().isoformat()
        })

    def log_suspicious_activity(self, details: Dict[str, Any]):
        """Log suspicious security events."""
        self.logger.error("Suspicious activity detected", extra={
            "event_type": "suspicious_activity",
            **details,
            "timestamp": datetime.utcnow().isoformat()
        })
```

## Validation

### Security Implementation Checklist
- [ ] Password hashing with bcrypt (never store plaintext)
- [ ] JWT tokens with proper expiration and validation
- [ ] Input validation on all user inputs with Pydantic
- [ ] SQL injection prevention with parameterized queries
- [ ] File upload validation (size, type, content)
- [ ] Rate limiting implemented per client/endpoint
- [ ] Security headers in all HTTP responses
- [ ] CORS properly configured for allowed origins
- [ ] Sensitive data encrypted at rest
- [ ] Security events logged for monitoring
- [ ] Error messages don't leak sensitive information
- [ ] Authentication required for protected endpoints

### Security Testing Points
- [ ] Authentication bypass attempts blocked
- [ ] Authorization checks prevent privilege escalation
- [ ] Input validation rejects malicious payloads
- [ ] Rate limiting prevents abuse
- [ ] File upload restrictions enforced
- [ ] SQL injection attacks prevented
- [ ] XSS attacks mitigated
- [ ] Security headers present in responses

## Examples

### Complete Secure Endpoint
```python
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

@router.post("/users/{user_id}/avatar")
@require_role(UserRole.USER)
async def upload_user_avatar(
    user_id: int,
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Securely upload user avatar with validation."""

    # Authorization: users can only update their own avatar
    if current_user.id != user_id and current_user.role != UserRole.ADMIN.value:
        raise HTTPException(403, "Cannot update another user's avatar")

    # Validate and save file securely
    try:
        file_path = await secure_file_upload(file, Path("uploads/avatars"))

        # Update user record
        user = await get_user_by_id(db, user_id)
        user.avatar_path = file_path
        await db.commit()

        # Log security event
        security_logger.log_sensitive_operation({
            "user_id": user_id,
            "operation": "avatar_upload",
            "file_size": len(await file.read()),
            "ip_address": request.client.host
        })

        return {"message": "Avatar uploaded successfully", "path": file_path}

    except Exception as e:
        security_logger.log_suspicious_activity({
            "user_id": user_id,
            "operation": "avatar_upload_failed",
            "error": str(e),
            "ip_address": request.client.host
        })
        raise HTTPException(500, "Upload failed")
```

These security standards ensure Python applications are protected against common vulnerabilities while maintaining usability and performance.