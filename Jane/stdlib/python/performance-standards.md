---
title: Python Performance Standards
description: A document outlining performance optimization standards for Python applications
tags:
  - optimization
  - async
  - caching
  - profiling
createdAt: '2025-06-27T15:39:08.522Z'
updatedAt: '2025-06-27T15:39:08.522Z'
---

# Python Performance Standards

## Overview

This document defines performance optimization standards for Python applications, focusing on async patterns, caching strategies, database optimization, and profiling techniques to ensure scalable and efficient applications.

## Async Performance Patterns

### Async Best Practices
```python
import asyncio
import aiohttp
from typing import List, Dict, Any

# Good: Concurrent execution with asyncio.gather
async def fetch_multiple_apis(urls: List[str]) -> List[Dict[str, Any]]:
    """Fetch multiple APIs concurrently."""
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_single_api(session, url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter successful results
        return [result for result in results if not isinstance(result, Exception)]

async def fetch_single_api(session: aiohttp.ClientSession, url: str) -> Dict[str, Any]:
    async with session.get(url) as response:
        return await response.json()

# Good: Semaphore for rate limiting
async def process_items_with_limit(items: List[str], max_concurrent: int = 10) -> List[Any]:
    """Process items with concurrency limit."""
    semaphore = asyncio.Semaphore(max_concurrent)

    async def process_with_semaphore(item: str) -> Any:
        async with semaphore:
            return await process_item(item)

    tasks = [process_with_semaphore(item) for item in items]
    return await asyncio.gather(*tasks)

# Good: Async context managers for connection pooling
from contextlib import asynccontextmanager

@asynccontextmanager
async def get_http_session():
    """Reusable HTTP session with connection pooling."""
    connector = aiohttp.TCPConnector(
        limit=100,  # Total connection pool size
        limit_per_host=30,  # Per-host connection limit
        keepalive_timeout=30,
        enable_cleanup_closed=True
    )

    session = aiohttp.ClientSession(
        connector=connector,
        timeout=aiohttp.ClientTimeout(total=30)
    )

    try:
        yield session
    finally:
        await session.close()
```

### Database Async Optimization
```python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy import select

# Connection pool configuration
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,          # Number of connections to maintain
    max_overflow=30,       # Additional connections if needed
    pool_pre_ping=True,    # Verify connections before use
    pool_recycle=3600,     # Recycle connections after 1 hour
    echo=False             # Set to True for query debugging
)

# Good: Efficient eager loading
async def get_users_with_posts(db: AsyncSession, limit: int = 100) -> List[User]:
    """Efficiently load users with their posts."""
    stmt = (
        select(User)
        .options(selectinload(User.posts))  # Avoid N+1 queries
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

# Good: Batch operations
async def create_multiple_users(db: AsyncSession, user_data: List[UserCreate]) -> List[User]:
    """Create multiple users in a single transaction."""
    users = [User(**data.dict()) for data in user_data]
    db.add_all(users)
    await db.flush()  # Get IDs without committing
    return users

# Good: Async batch processing
async def process_users_in_batches(
    db: AsyncSession,
    batch_size: int = 1000
) -> None:
    """Process users in batches to avoid memory issues."""
    offset = 0

    while True:
        stmt = select(User).offset(offset).limit(batch_size)
        result = await db.execute(stmt)
        users = result.scalars().all()

        if not users:
            break

        await process_user_batch(users)
        offset += batch_size
```

## Caching Strategies

### Redis Caching Patterns
```python
import redis.asyncio as redis
import json
import pickle
from typing import Optional, Any, Callable
from functools import wraps

class AsyncRedisCache:
    """Async Redis cache with serialization."""

    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url, decode_responses=False)

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        data = await self.redis.get(key)
        if data:
            return pickle.loads(data)
        return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int = 3600
    ) -> None:
        """Set value in cache with TTL."""
        serialized = pickle.dumps(value)
        await self.redis.setex(key, ttl, serialized)

    async def delete(self, key: str) -> None:
        """Delete key from cache."""
        await self.redis.delete(key)

# Cache decorator
def cache_result(
    cache: AsyncRedisCache,
    key_func: Callable = None,
    ttl: int = 3600
):
    """Cache function result decorator."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                cache_key = f"{func.__name__}:{hash((args, tuple(kwargs.items())))}"

            # Try to get from cache
            cached_result = await cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache.set(cache_key, result, ttl)
            return result

        return wrapper
    return decorator

# Usage
cache = AsyncRedisCache("redis://localhost:6379")

@cache_result(cache, ttl=1800)
async def get_user_profile(user_id: int) -> UserProfile:
    """Get user profile with caching."""
    return await fetch_user_profile_from_db(user_id)

# Cache invalidation patterns
async def update_user_profile(user_id: int, profile_data: dict) -> UserProfile:
    """Update user profile and invalidate cache."""
    profile = await update_profile_in_db(user_id, profile_data)

    # Invalidate related caches
    await cache.delete(f"get_user_profile:{user_id}")
    await cache.delete(f"user_dashboard:{user_id}")

    return profile
```

### In-Memory Caching
```python
from functools import lru_cache
import time
from typing import Dict, Any, Tuple

class TTLCache:
    """Simple TTL cache for function results."""

    def __init__(self, maxsize: int = 128, ttl: int = 300):
        self.cache: Dict[str, Tuple[Any, float]] = {}
        self.maxsize = maxsize
        self.ttl = ttl

    def get(self, key: str) -> Optional[Any]:
        if key in self.cache:
            value, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return value
            else:
                del self.cache[key]
        return None

    def set(self, key: str, value: Any) -> None:
        if len(self.cache) >= self.maxsize:
            # Remove oldest entry
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k][1])
            del self.cache[oldest_key]

        self.cache[key] = (value, time.time())

# Configuration caching
@lru_cache(maxsize=None)
def get_config_value(key: str) -> str:
    """Cache configuration values (immutable)."""
    return os.environ.get(key, "")

# Database query result caching
user_cache = TTLCache(maxsize=1000, ttl=600)

async def get_user_cached(user_id: int) -> Optional[User]:
    """Get user with in-memory caching."""
    cache_key = f"user:{user_id}"

    # Check cache first
    cached_user = user_cache.get(cache_key)
    if cached_user:
        return cached_user

    # Fetch from database
    user = await db.get_user(user_id)
    if user:
        user_cache.set(cache_key, user)

    return user
```

## Database Performance

### Query Optimization
```python
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload, joinedload

# Good: Efficient filtering and pagination
async def get_users_paginated(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 50,
    filters: dict = None
) -> Tuple[List[User], int]:
    """Get paginated users with efficient counting."""

    # Build base query
    query = select(User)
    count_query = select(func.count(User.id))

    # Apply filters
    if filters:
        conditions = []
        if filters.get('status'):
            conditions.append(User.status == filters['status'])
        if filters.get('created_after'):
            conditions.append(User.created_at >= filters['created_after'])

        if conditions:
            combined_filter = and_(*conditions)
            query = query.where(combined_filter)
            count_query = count_query.where(combined_filter)

    # Execute count and data queries concurrently
    count_result, data_result = await asyncio.gather(
        db.execute(count_query),
        db.execute(
            query
            .offset((page - 1) * page_size)
            .limit(page_size)
            .options(selectinload(User.profile))  # Eager load relations
        )
    )

    total_count = count_result.scalar()
    users = data_result.scalars().all()

    return users, total_count

# Good: Bulk operations
async def bulk_update_users(
    db: AsyncSession,
    user_updates: List[Tuple[int, dict]]
) -> None:
    """Efficiently update multiple users."""
    for user_id, update_data in user_updates:
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(**update_data)
        )

    await db.commit()

# Good: Raw SQL for complex queries
async def get_user_statistics(db: AsyncSession) -> dict:
    """Get user statistics with raw SQL."""
    query = """
    SELECT
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400) as avg_days_since_creation
    FROM users
    GROUP BY status
    """

    result = await db.execute(text(query))
    return {row.status: {"count": row.count, "avg_days": row.avg_days_since_creation}
            for row in result}
```

### Connection Pool Optimization
```python
from sqlalchemy.pool import QueuePool

# Optimized database configuration
def create_optimized_engine(database_url: str):
    """Create database engine with optimized settings."""
    return create_async_engine(
        database_url,
        # Connection pool settings
        poolclass=QueuePool,
        pool_size=20,              # Base number of connections
        max_overflow=50,           # Additional connections if needed
        pool_pre_ping=True,        # Validate connections
        pool_recycle=3600,         # Recycle after 1 hour

        # Query optimization
        echo=False,                # Disable query logging in production
        future=True,               # Use 2.0 style

        # Connection arguments
        connect_args={
            "server_settings": {
                "application_name": "my_app",
                "jit": "off",      # Disable JIT for simple queries
            }
        }
    )
```

## Memory Optimization

### Memory-Efficient Data Processing
```python
from typing import Iterator, Generator
import sys

# Good: Generators for large datasets
def process_large_file(filename: str) -> Generator[dict, None, None]:
    """Process large file line by line."""
    with open(filename, 'r') as file:
        for line in file:
            yield process_line(line)

# Good: Batch processing to control memory
async def process_users_memory_efficient(
    db: AsyncSession,
    batch_size: int = 1000
) -> None:
    """Process users in memory-efficient batches."""
    offset = 0

    while True:
        # Load batch
        users = await get_user_batch(db, offset, batch_size)
        if not users:
            break

        # Process batch
        results = await process_user_batch(users)

        # Save results
        await save_results(db, results)

        # Clear references to help garbage collection
        del users, results

        offset += batch_size

# Good: Use __slots__ for memory-efficient classes
class OptimizedUser:
    """Memory-efficient user class."""
    __slots__ = ['id', 'name', 'email', 'created_at']

    def __init__(self, id: int, name: str, email: str, created_at: datetime):
        self.id = id
        self.name = name
        self.email = email
        self.created_at = created_at

# Memory profiling decorator
def memory_profile(func):
    """Decorator to profile memory usage."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        import psutil
        import gc

        # Force garbage collection
        gc.collect()

        # Get initial memory
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB

        # Execute function
        result = await func(*args, **kwargs)

        # Get final memory
        gc.collect()
        final_memory = process.memory_info().rss / 1024 / 1024  # MB

        logger.info(f"Memory usage for {func.__name__}", extra={
            "initial_mb": initial_memory,
            "final_mb": final_memory,
            "delta_mb": final_memory - initial_memory
        })

        return result

    return wrapper
```

## Profiling and Monitoring

### Performance Profiling
```python
import cProfile
import pstats
import time
from functools import wraps

def profile_performance(func):
    """Decorator to profile function performance."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()

        start_time = time.time()
        profiler.enable()

        try:
            result = await func(*args, **kwargs)
        finally:
            profiler.disable()
            end_time = time.time()

        # Analyze results
        stats = pstats.Stats(profiler)
        stats.sort_stats('cumulative')

        # Log performance metrics
        logger.info(f"Performance profile for {func.__name__}", extra={
            "execution_time": end_time - start_time,
            "function_calls": stats.total_calls
        })

        # Optionally save detailed profile
        if logger.isEnabledFor(logging.DEBUG):
            stats.dump_stats(f"/tmp/{func.__name__}_profile.stats")

        return result

    return wrapper

# Request timing middleware
async def timing_middleware(request: Request, call_next):
    """Middleware to time request processing."""
    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)

    # Log slow requests
    if process_time > 1.0:  # Log requests taking more than 1 second
        logger.warning("Slow request detected", extra={
            "path": request.url.path,
            "method": request.method,
            "process_time": process_time
        })

    return response
```

### Application Metrics
```python
from prometheus_client import Counter, Histogram, Gauge
import time

# Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')
ACTIVE_CONNECTIONS = Gauge('active_database_connections', 'Active database connections')

def track_metrics(func):
    """Decorator to track application metrics."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()

        try:
            result = await func(*args, **kwargs)
            REQUEST_COUNT.labels(method='GET', endpoint=func.__name__).inc()
            return result
        except Exception as e:
            REQUEST_COUNT.labels(method='GET', endpoint=f"{func.__name__}_error").inc()
            raise
        finally:
            REQUEST_DURATION.observe(time.time() - start_time)

    return wrapper

# Database connection monitoring
async def monitor_db_connections(engine):
    """Monitor database connection pool."""
    pool = engine.pool
    ACTIVE_CONNECTIONS.set(pool.checkedout())

    if pool.checkedout() > pool.size() * 0.8:  # 80% utilization
        logger.warning("High database connection usage", extra={
            "checked_out": pool.checkedout(),
            "pool_size": pool.size(),
            "overflow": pool.overflow()
        })
```

## Validation

### Performance Standards Checklist
- [ ] Async/await used consistently for I/O operations
- [ ] Connection pooling configured for databases and HTTP clients
- [ ] Caching implemented for frequently accessed data
- [ ] Database queries optimized with proper indexing
- [ ] Batch processing used for large datasets
- [ ] Memory usage monitored and optimized
- [ ] Performance profiling integrated
- [ ] Metrics collection implemented
- [ ] Slow query logging enabled
- [ ] Resource cleanup properly handled

### Performance Testing
```python
import pytest
import asyncio
import time
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_concurrent_api_calls():
    """Test that concurrent API calls perform efficiently."""
    urls = [f"https://api.example.com/data/{i}" for i in range(100)]

    start_time = time.time()
    results = await fetch_multiple_apis(urls)
    end_time = time.time()

    # Should complete in reasonable time (not sequential)
    assert end_time - start_time < 10.0  # 100 concurrent calls in <10s
    assert len(results) > 90  # Most should succeed

@pytest.mark.asyncio
async def test_database_batch_operations():
    """Test that batch operations are more efficient than individual ops."""
    user_data = [{"name": f"User {i}", "email": f"user{i}@example.com"} for i in range(100)]

    # Test batch creation
    start_time = time.time()
    users = await create_multiple_users(db, user_data)
    batch_time = time.time() - start_time

    assert len(users) == 100
    assert batch_time < 2.0  # Should be fast for batch operation

def test_memory_efficiency():
    """Test that memory usage stays within bounds."""
    import psutil

    process = psutil.Process()
    initial_memory = process.memory_info().rss

    # Process large dataset
    large_data = list(range(1000000))
    processed = [x * 2 for x in large_data]

    peak_memory = process.memory_info().rss
    memory_increase = (peak_memory - initial_memory) / 1024 / 1024  # MB

    # Memory increase should be reasonable
    assert memory_increase < 100  # Less than 100MB for this operation
```

These performance standards ensure Python applications are optimized for scalability, efficiency, and resource utilization while maintaining code clarity and maintainability.