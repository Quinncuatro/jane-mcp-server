---
title: Python Testing Standards
description: A document outlining comprehensive testing standards for Python applications
tags:
  - testing
  - pytest
  - async
  - mocking
  - coverage
createdAt: '2025-06-27T15:39:08.522Z'
updatedAt: '2025-06-27T15:39:08.522Z'
---

# Python Testing Standards

## Overview

This document defines comprehensive testing standards for Python applications, focusing on pytest patterns, async testing, test organization, and the critical build-test-debug cycle that enables rapid development iteration.

## Testing Philosophy

### Testing Principles
- **Test-Driven Development**: Write tests before implementation when possible
- **Fast Feedback Loop**: Tests should run quickly to enable rapid iteration
- **Comprehensive Coverage**: Aim for >80% code coverage with meaningful tests
- **Isolated Tests**: Each test should be independent and deterministic
- **Clear Test Intent**: Tests should clearly express what they're verifying

### The Magic Build-Test-Debug Loop
```bash
# The iterative development cycle
pytest --tb=short -v  # Run tests with concise error output
# Read errors and failures
# Fix code
# Repeat until green
```

## Test Organization

### Directory Structure
```
tests/
├── __init__.py
├── conftest.py                 # Shared fixtures
├── unit/                       # Unit tests
│   ├── test_models.py
│   ├── test_services.py
│   └── test_utils.py
├── integration/                # Integration tests
│   ├── test_api_endpoints.py
│   ├── test_database.py
│   └── test_external_services.py
├── e2e/                        # End-to-end tests
│   ├── test_user_workflows.py
│   └── test_api_flows.py
├── fixtures/                   # Test data
│   ├── sample_data.json
│   └── test_files/
└── performance/                # Performance tests
    └── test_load.py
```

### Test File Naming
```python
# Test file naming conventions
test_*.py           # Standard pytest discovery
test_models.py      # Testing models module
test_auth_service.py    # Testing specific service
test_api_*.py       # API endpoint tests
test_integration_*.py   # Integration tests
```

## Pytest Configuration

### pyproject.toml Configuration
```toml
[tool.pytest.ini_options]
# Test discovery
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]

# Output configuration
addopts = [
    "--strict-markers",
    "--strict-config",
    "--verbose",
    "--tb=short",           # Concise tracebacks for quick debugging
    "--cov=src",           # Coverage for src directory
    "--cov-report=term-missing",  # Show missing lines
    "--cov-report=html",    # HTML coverage report
    "--cov-fail-under=80",  # Fail if coverage below 80%
    "--durations=10",       # Show 10 slowest tests
]

# Markers for test categorization
markers = [
    "unit: Unit tests",
    "integration: Integration tests",
    "e2e: End-to-end tests",
    "slow: Slow running tests",
    "external: Tests that require external services",
    "security: Security-related tests",
]

# Async test configuration
asyncio_mode = "auto"

# Test filtering
filterwarnings = [
    "ignore::UserWarning",
    "ignore::DeprecationWarning",
]
```

### conftest.py - Shared Fixtures
```python
# tests/conftest.py
import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import tempfile
from pathlib import Path

# Event loop fixture for async tests
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# Database fixtures
@pytest.fixture
async def test_db():
    """Create test database with clean state."""
    # Use in-memory SQLite for fast tests
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False  # Set to True for SQL debugging
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session factory
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session

    await engine.dispose()

# HTTP client fixtures
@pytest.fixture
async def test_client():
    """Create test HTTP client for API testing."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

# Authentication fixtures
@pytest.fixture
def test_user_data():
    """Sample user data for testing."""
    return {
        "id": 1,
        "email": "test@example.com",
        "username": "testuser",
        "role": "user",
        "is_active": True
    }

@pytest.fixture
async def authenticated_user(test_db, test_user_data):
    """Create authenticated user for testing."""
    user = User(**test_user_data)
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user

@pytest.fixture
def auth_headers(authenticated_user):
    """Generate auth headers for API requests."""
    token = create_access_token({"sub": str(authenticated_user.id)})
    return {"Authorization": f"Bearer {token}"}

# File system fixtures
@pytest.fixture
def temp_dir():
    """Create temporary directory for file tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)

@pytest.fixture
def sample_markdown_file(temp_dir):
    """Create sample markdown file for testing."""
    content = """---
title: Test Document
category: stdlib
---

# Test Document

This is test content.
"""
    file_path = temp_dir / "test.md"
    file_path.write_text(content)
    return file_path
```

## Unit Testing Patterns

### Model Testing
```python
# tests/unit/test_models.py
import pytest
from datetime import datetime
from src.models.user import User, UserCreate
from src.models.document import Document, DocumentMetadata

class TestUser:
    """Test user model functionality."""

    def test_user_creation(self):
        """Test basic user creation."""
        user_data = {
            "email": "test@example.com",
            "username": "testuser",
            "hashed_password": "hashed_pw"
        }
        user = User(**user_data)

        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.is_active is True  # Default value

    def test_user_validation(self):
        """Test user input validation."""
        # Test invalid email
        with pytest.raises(ValueError, match="Invalid email"):
            UserCreate(
                email="invalid-email",
                username="testuser",
                password="password123"
            )

        # Test password requirements
        with pytest.raises(ValueError, match="Password must contain"):
            UserCreate(
                email="test@example.com",
                username="testuser",
                password="weak"
            )

    def test_user_password_hashing(self):
        """Test password hashing functionality."""
        from src.auth.security import hash_password, verify_password

        password = "secure_password123!"
        hashed = hash_password(password)

        assert hashed != password
        assert verify_password(password, hashed)
        assert not verify_password("wrong_password", hashed)

class TestDocument:
    """Test document model functionality."""

    def test_document_metadata_validation(self):
        """Test document metadata validation."""
        metadata = DocumentMetadata(
            title="Test Document",
            category="stdlib",
            language="python",
            tags=["test", "example"]
        )

        assert metadata.title == "Test Document"
        assert metadata.category == "stdlib"
        assert "test" in metadata.tags

    def test_invalid_category_rejected(self):
        """Test that invalid categories are rejected."""
        with pytest.raises(ValueError, match="Category must be one of"):
            DocumentMetadata(
                title="Test",
                category="invalid_category"
            )
```

### Service Testing with Mocks
```python
# tests/unit/test_services.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from src.services.auth_service import AuthService
from src.services.knowledge_base import KnowledgeBaseService

class TestAuthService:
    """Test authentication service."""

    @pytest.fixture
    def auth_service(self):
        """Create auth service instance for testing."""
        return AuthService(secret_key="test-secret-key-32-chars-long")

    def test_token_creation_and_verification(self, auth_service):
        """Test JWT token creation and verification."""
        payload = {"sub": "123", "email": "test@example.com"}
        token = auth_service.create_access_token(payload)

        # Token should be created
        assert token is not None
        assert isinstance(token, str)

        # Token should be verifiable
        decoded = auth_service.verify_token(token)
        assert decoded["sub"] == "123"
        assert decoded["email"] == "test@example.com"
        assert decoded["type"] == "access"

    def test_invalid_token_rejection(self, auth_service):
        """Test that invalid tokens are rejected."""
        # Invalid token format
        assert auth_service.verify_token("invalid.token.here") is None

        # Token with wrong signature
        fake_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.invalid"
        assert auth_service.verify_token(fake_token) is None

class TestKnowledgeBaseService:
    """Test knowledge base service with mocked dependencies."""

    @pytest.fixture
    def mock_git_service(self):
        """Mock git service for testing."""
        mock = AsyncMock()
        mock.commit_changes.return_value = MagicMock(commit_hash="abc123")
        return mock

    @pytest.fixture
    def mock_search_engine(self):
        """Mock search engine for testing."""
        mock = AsyncMock()
        mock.index_document.return_value = None
        return mock

    @pytest.fixture
    def knowledge_service(self, mock_git_service, mock_search_engine, temp_dir):
        """Create knowledge base service with mocked dependencies."""
        return KnowledgeBaseService(
            base_path=temp_dir,
            git_service=mock_git_service,
            search_engine=mock_search_engine
        )

    @pytest.mark.asyncio
    async def test_create_document(self, knowledge_service, mock_git_service):
        """Test document creation with git integration."""
        metadata = {
            "title": "Test Document",
            "category": "stdlib",
            "language": "python"
        }

        document = await knowledge_service.create_document(
            category="stdlib",
            path="python/test.md",
            content="# Test Content",
            metadata=metadata,
            commit_message="Add test document"
        )

        assert document.metadata.title == "Test Document"
        assert document.content == "# Test Content"

        # Verify git operations were called
        mock_git_service.create_feature_branch.assert_called_once()
        mock_git_service.commit_changes.assert_called_once()

    @pytest.mark.asyncio
    async def test_search_documents(self, knowledge_service, mock_search_engine):
        """Test document search functionality."""
        # Mock search results
        from src.models.search import SearchResult
        mock_results = [
            SearchResult(
                path="stdlib/python/testing.md",
                title="Python Testing",
                category="stdlib",
                snippet="Testing patterns..."
            )
        ]
        mock_search_engine.search.return_value = mock_results

        results = await knowledge_service.search_documents("testing")

        assert len(results) == 1
        assert results[0].title == "Python Testing"
        mock_search_engine.search.assert_called_once_with(
            query="testing", category=None, limit=10
        )
```

## Async Testing Patterns

### Async Service Testing
```python
# tests/unit/test_async_services.py
import pytest
import asyncio
from unittest.mock import AsyncMock, patch
import httpx

class TestAsyncHTTPService:
    """Test async HTTP service operations."""

    @pytest.mark.asyncio
    async def test_fetch_external_data_success(self):
        """Test successful external API call."""
        from src.services.external_api import ExternalAPIService

        # Mock successful HTTP response
        with patch('httpx.AsyncClient.get') as mock_get:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"data": "test"}
            mock_get.return_value = mock_response

            service = ExternalAPIService()
            result = await service.fetch_data("test-endpoint")

            assert result == {"data": "test"}
            mock_get.assert_called_once()

    @pytest.mark.asyncio
    async def test_fetch_external_data_timeout(self):
        """Test timeout handling in external API calls."""
        from src.services.external_api import ExternalAPIService
        from src.exceptions import ExternalServiceError

        with patch('httpx.AsyncClient.get') as mock_get:
            mock_get.side_effect = httpx.TimeoutException("Request timeout")

            service = ExternalAPIService()

            with pytest.raises(ExternalServiceError, match="timeout"):
                await service.fetch_data("test-endpoint")

    @pytest.mark.asyncio
    async def test_concurrent_operations(self):
        """Test concurrent async operations."""
        from src.services.batch_processor import BatchProcessor

        processor = BatchProcessor()

        # Test processing multiple items concurrently
        items = [f"item_{i}" for i in range(10)]
        results = await processor.process_batch(items)

        assert len(results) == 10
        assert all(result.startswith("processed_") for result in results)

    @pytest.mark.asyncio
    async def test_async_context_manager(self):
        """Test async context managers."""
        from src.database.connection import DatabaseManager

        db_manager = DatabaseManager("sqlite+aiosqlite:///:memory:")

        async with db_manager.get_session() as session:
            assert session is not None
            # Session should be usable
            result = await session.execute("SELECT 1")
            assert result is not None
```

### Database Testing with Transactions
```python
# tests/integration/test_database.py
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.user import User
from src.repositories.user_repository import UserRepository

class TestUserRepository:
    """Test user repository with real database operations."""

    @pytest.mark.asyncio
    async def test_create_user(self, test_db: AsyncSession):
        """Test user creation in database."""
        repo = UserRepository(test_db)

        user_data = {
            "email": "test@example.com",
            "username": "testuser",
            "hashed_password": "hashed_password"
        }

        user = await repo.create(user_data)

        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.created_at is not None

    @pytest.mark.asyncio
    async def test_get_user_by_email(self, test_db: AsyncSession):
        """Test finding user by email."""
        repo = UserRepository(test_db)

        # Create test user
        user = User(
            email="find@example.com",
            username="finduser",
            hashed_password="hashed"
        )
        test_db.add(user)
        await test_db.commit()

        # Find user
        found_user = await repo.get_by_email("find@example.com")

        assert found_user is not None
        assert found_user.username == "finduser"

    @pytest.mark.asyncio
    async def test_user_not_found(self, test_db: AsyncSession):
        """Test handling of non-existent user."""
        repo = UserRepository(test_db)

        user = await repo.get_by_email("nonexistent@example.com")

        assert user is None

    @pytest.mark.asyncio
    async def test_update_user(self, test_db: AsyncSession, authenticated_user):
        """Test user update operations."""
        repo = UserRepository(test_db)

        # Update user
        updated_user = await repo.update(
            authenticated_user.id,
            {"username": "updated_username"}
        )

        assert updated_user.username == "updated_username"
        assert updated_user.email == authenticated_user.email  # Unchanged
```

## API Testing

### FastAPI Endpoint Testing
```python
# tests/integration/test_api_endpoints.py
import pytest
from httpx import AsyncClient
from fastapi import status

class TestAuthEndpoints:
    """Test authentication API endpoints."""

    @pytest.mark.asyncio
    async def test_user_registration(self, test_client: AsyncClient):
        """Test user registration endpoint."""
        user_data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "SecurePass123!"
        }

        response = await test_client.post("/auth/register", json=user_data)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["email"] == user_data["email"]
        assert "password" not in data  # Password should not be returned
        assert "id" in data

    @pytest.mark.asyncio
    async def test_user_login(self, test_client: AsyncClient, authenticated_user):
        """Test user login endpoint."""
        login_data = {
            "email": authenticated_user.email,
            "password": "original_password"  # Use unhashed password
        }

        response = await test_client.post("/auth/login", json=login_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_invalid_login(self, test_client: AsyncClient):
        """Test login with invalid credentials."""
        login_data = {
            "email": "invalid@example.com",
            "password": "wrongpassword"
        }

        response = await test_client.post("/auth/login", json=login_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

class TestProtectedEndpoints:
    """Test endpoints requiring authentication."""

    @pytest.mark.asyncio
    async def test_get_current_user(self, test_client: AsyncClient, auth_headers):
        """Test getting current user with valid token."""
        response = await test_client.get("/users/me", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "email" in data
        assert "username" in data

    @pytest.mark.asyncio
    async def test_unauthorized_access(self, test_client: AsyncClient):
        """Test accessing protected endpoint without token."""
        response = await test_client.get("/users/me")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_invalid_token(self, test_client: AsyncClient):
        """Test accessing protected endpoint with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await test_client.get("/users/me", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

class TestMCPToolsAPI:
    """Test MCP tools API endpoints."""

    @pytest.mark.asyncio
    async def test_list_tools(self, test_client: AsyncClient, auth_headers):
        """Test listing available MCP tools."""
        response = await test_client.get("/mcp/tools", headers=auth_headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "tools" in data
        assert len(data["tools"]) > 0

        # Verify tool structure
        tool = data["tools"][0]
        assert "name" in tool
        assert "description" in tool
        assert "parameters" in tool

    @pytest.mark.asyncio
    async def test_call_get_stdlib_tool(self, test_client: AsyncClient, auth_headers):
        """Test calling get_stdlib MCP tool."""
        request_data = {
            "method": "get_stdlib",
            "params": {
                "language": "python",
                "domain": "testing"
            }
        }

        response = await test_client.post(
            "/mcp/call",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "result" in data
        assert data["result"]["language"] == "python"
        assert data["result"]["domain"] == "testing"
```

## Error Testing and Debugging

### Exception Testing Patterns
```python
# tests/unit/test_error_handling.py
import pytest
from src.exceptions import ValidationError, NotFoundError, ExternalServiceError
from src.services.document_service import DocumentService

class TestErrorHandling:
    """Test error handling and exception scenarios."""

    @pytest.mark.asyncio
    async def test_document_not_found(self, knowledge_service):
        """Test handling of non-existent document."""
        with pytest.raises(NotFoundError, match="Document not found"):
            await knowledge_service.get_document("nonexistent/path.md")

    @pytest.mark.asyncio
    async def test_validation_error_propagation(self, knowledge_service):
        """Test that validation errors are properly propagated."""
        invalid_metadata = {
            "title": "",  # Empty title should fail validation
            "category": "invalid_category"
        }

        with pytest.raises(ValidationError) as exc_info:
            await knowledge_service.create_document(
                category="stdlib",
                path="test.md",
                content="content",
                metadata=invalid_metadata
            )

        assert "title" in str(exc_info.value) or "category" in str(exc_info.value)

    def test_custom_exception_serialization(self):
        """Test that custom exceptions serialize properly."""
        error = ValidationError(
            "Test error message",
            error_code="TEST_ERROR",
            details={"field": "value"}
        )

        error_dict = error.to_dict()
        assert error_dict["error"] == "TEST_ERROR"
        assert error_dict["message"] == "Test error message"
        assert error_dict["details"]["field"] == "value"
```

### Debugging Test Failures
```python
# tests/debug/test_debugging_helpers.py
import pytest
import logging
from src.utils.debug import DebugCapture

class TestDebuggingHelpers:
    """Test debugging utilities and patterns."""

    def test_with_debug_logging(self, caplog):
        """Test with captured log output for debugging."""
        with caplog.at_level(logging.DEBUG):
            from src.services.complex_service import ComplexService

            service = ComplexService()
            result = service.complex_operation("test_input")

            # Check logs for debugging
            assert "Starting complex operation" in caplog.text
            assert "Operation completed" in caplog.text
            assert result == "expected_output"

    @pytest.mark.asyncio
    async def test_with_state_capture(self):
        """Test with state capture for debugging async operations."""
        debug_capture = DebugCapture()

        async with debug_capture.capture_state():
            # Perform operations that might fail
            result = await some_complex_async_operation()

            # Capture intermediate states
            debug_capture.checkpoint("after_operation", {"result": result})

        # If test fails, debug_capture.states contains all checkpoints
        assert len(debug_capture.states) > 0

    def test_parametrized_debugging(self, input_value, expected_output):
        """Test with parametrized inputs for debugging edge cases."""
        from src.utils.processor import process_input

        # Add debug info to assertion messages
        result = process_input(input_value)
        assert result == expected_output, f"Failed for input: {input_value}, got: {result}"

# Parametrized test for debugging different scenarios
@pytest.mark.parametrize("input_value,expected_output", [
    ("normal_input", "normal_output"),
    ("edge_case_1", "edge_output_1"),
    ("edge_case_2", "edge_output_2"),
    ("", "empty_output"),  # Edge case that might fail
])
def test_parametrized_processing(input_value, expected_output):
    """Test processing with various inputs to identify failure patterns."""
    from src.utils.processor import process_input
    result = process_input(input_value)
    assert result == expected_output
```

## Performance and Load Testing

### Performance Testing Patterns
```python
# tests/performance/test_performance.py
import pytest
import time
import asyncio
from unittest.mock import AsyncMock

class TestPerformance:
    """Test performance characteristics of critical operations."""

    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_search_performance(self, knowledge_service):
        """Test search operation performance."""
        # Setup: Create multiple documents for realistic search
        for i in range(100):
            await knowledge_service.create_document(
                category="stdlib",
                path=f"test_{i}.md",
                content=f"Test document {i} with searchable content",
                metadata={"title": f"Test Document {i}"}
            )

        # Measure search performance
        start_time = time.time()
        results = await knowledge_service.search_documents("searchable")
        end_time = time.time()

        search_time = end_time - start_time

        # Performance assertions
        assert search_time < 1.0  # Should complete within 1 second
        assert len(results) > 0  # Should find matching documents

    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_concurrent_operations(self, knowledge_service):
        """Test performance under concurrent load."""

        async def create_document(i):
            return await knowledge_service.create_document(
                category="stdlib",
                path=f"concurrent_{i}.md",
                content=f"Concurrent document {i}",
                metadata={"title": f"Concurrent {i}"}
            )

        # Create 50 documents concurrently
        start_time = time.time()
        tasks = [create_document(i) for i in range(50)]
        results = await asyncio.gather(*tasks)
        end_time = time.time()

        total_time = end_time - start_time

        # Performance assertions
        assert len(results) == 50
        assert total_time < 10.0  # Should complete within 10 seconds
        assert all(doc.metadata.title.startswith("Concurrent") for doc in results)
```

## Test Utilities and Helpers

### Custom Test Fixtures and Helpers
```python
# tests/utils/test_helpers.py
import pytest
from typing import Dict, Any, List
from pathlib import Path
import json

class TestDataBuilder:
    """Builder pattern for creating test data."""

    def __init__(self):
        self.data = {}

    def with_user(self, **kwargs) -> 'TestDataBuilder':
        """Add user data to test scenario."""
        default_user = {
            "id": 1,
            "email": "test@example.com",
            "username": "testuser",
            "role": "user"
        }
        self.data["user"] = {**default_user, **kwargs}
        return self

    def with_document(self, **kwargs) -> 'TestDataBuilder':
        """Add document data to test scenario."""
        default_doc = {
            "title": "Test Document",
            "category": "stdlib",
            "content": "# Test Content"
        }
        self.data["document"] = {**default_doc, **kwargs}
        return self

    def build(self) -> Dict[str, Any]:
        """Build the complete test data."""
        return self.data

@pytest.fixture
def test_data_builder():
    """Provide test data builder for complex scenarios."""
    return TestDataBuilder()

# Advanced fixtures for file testing
@pytest.fixture
def sample_documents(temp_dir):
    """Create a set of sample documents for testing."""
    documents = []

    for i in range(5):
        doc_content = f"""---
title: Test Document {i}
category: stdlib
language: python
tags: ["test", "sample"]
---

# Test Document {i}

This is test content for document {i}.

## Examples

```python
def example_function_{i}():
    return "test_{i}"
```
"""
        doc_path = temp_dir / f"test_doc_{i}.md"
        doc_path.write_text(doc_content)
        documents.append(doc_path)

    return documents

# Assertion helpers
def assert_document_structure(document, expected_title: str, expected_category: str):
    """Helper to assert document structure."""
    assert document.metadata.title == expected_title
    assert document.metadata.category == expected_category
    assert document.content is not None
    assert len(document.content) > 0

def assert_api_response_structure(response_data: Dict[str, Any], required_fields: List[str]):
    """Helper to assert API response structure."""
    for field in required_fields:
        assert field in response_data, f"Missing required field: {field}"

    # Check common response patterns
    if "error" in response_data:
        assert "message" in response_data
    if "data" in response_data:
        assert response_data["data"] is not None
```

## Test Execution and CI/CD

### Running Tests Effectively
```bash
# Basic test runs
pytest                              # Run all tests
pytest -v                           # Verbose output
pytest --tb=short                   # Concise tracebacks for quick debugging
pytest -x                           # Stop on first failure
pytest --lf                         # Run last failed tests only

# Test selection
pytest tests/unit/                  # Run only unit tests
pytest -m "not slow"                # Skip slow tests
pytest -k "test_auth"               # Run tests matching pattern
pytest tests/unit/test_models.py::TestUser::test_user_creation  # Specific test

# Coverage and reporting
pytest --cov=src --cov-report=html  # HTML coverage report
pytest --cov=src --cov-report=term-missing  # Terminal with missing lines
pytest --durations=10               # Show 10 slowest tests

# Debugging
pytest -s                           # Don't capture output (show prints)
pytest --pdb                        # Drop into debugger on failure
pytest --trace                      # Drop into debugger immediately

# Parallel execution (with pytest-xdist)
pytest -n auto                      # Auto-detect CPU cores
pytest -n 4                         # Use 4 parallel workers
```

### GitHub Actions Test Configuration
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: [3.9, 3.10, 3.11]

    steps:
    - uses: actions/checkout@v4

    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v4
      with:
        python-version: ${{ matrix.python-version }}

    - name: Install dependencies
      run: |
        pip install uv
        uv pip install -e ".[dev,test]"

    - name: Run tests
      run: |
        pytest --cov=src --cov-report=xml --cov-report=term-missing

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
        fail_ci_if_error: true
```

## Validation

### Testing Standards Checklist
- [ ] All new code has corresponding tests (>80% coverage)
- [ ] Unit tests are fast and isolated
- [ ] Integration tests cover API endpoints and database operations
- [ ] Async tests use proper async/await patterns
- [ ] Mock external dependencies in unit tests
- [ ] Test data is created using fixtures
- [ ] Error scenarios are tested with pytest.raises
- [ ] Performance tests exist for critical operations
- [ ] Tests are organized in logical directory structure
- [ ] CI/CD pipeline runs all tests on every commit

### The Build-Test-Debug Cycle
1. **Write failing test** (TDD approach)
2. **Run tests**: `pytest --tb=short -v`
3. **Read error messages carefully** - they tell you exactly what to implement
4. **Write minimal code** to make test pass
5. **Run tests again** - repeat until green
6. **Refactor** with confidence (tests protect against regressions)
7. **Commit** working code with tests

This cycle becomes addictive once you experience the rapid feedback and confidence it provides!

## Examples

### Complete Test Suite Example
```python
# tests/integration/test_mcp_tools_integration.py
import pytest
from httpx import AsyncClient

class TestMCPToolsIntegration:
    """Integration tests for MCP tools functionality."""

    @pytest.mark.asyncio
    async def test_complete_document_workflow(
        self,
        test_client: AsyncClient,
        auth_headers,
        temp_dir
    ):
        """Test complete document creation and retrieval workflow."""

        # 1. Create document via MCP tool
        create_request = {
            "method": "create_document",
            "params": {
                "category": "stdlib",
                "path": "python/workflow-test.md",
                "title": "Workflow Test Document",
                "content": "# Test\n\nThis is a test document.",
                "language": "python",
                "domain": "testing"
            }
        }

        response = await test_client.post(
            "/mcp/call",
            json=create_request,
            headers=auth_headers
        )

        assert response.status_code == 200
        create_result = response.json()
        assert create_result["result"]["message"] == "Document created successfully"

        # 2. Search for created document
        search_request = {
            "method": "search_knowledge_base",
            "params": {
                "query": "workflow test",
                "category": "stdlib"
            }
        }

        response = await test_client.post(
            "/mcp/call",
            json=search_request,
            headers=auth_headers
        )

        assert response.status_code == 200
        search_result = response.json()
        assert search_result["result"]["total_results"] > 0

        # Verify our document is in search results
        found_doc = next(
            (doc for doc in search_result["result"]["results"]
             if "workflow-test" in doc["path"]),
            None
        )
        assert found_doc is not None
        assert found_doc["title"] == "Workflow Test Document"

        # 3. Retrieve specific document
        get_request = {
            "method": "get_stdlib",
            "params": {
                "language": "python",
                "domain": "workflow-test"
            }
        }

        response = await test_client.post(
            "/mcp/call",
            json=get_request,
            headers=auth_headers
        )

        assert response.status_code == 200
        get_result = response.json()
        assert get_result["result"]["title"] == "Workflow Test Document"
        assert "This is a test document" in get_result["result"]["content"]
```

These comprehensive testing standards enable the magical build-test-debug cycle that makes Python development both fast and reliable!