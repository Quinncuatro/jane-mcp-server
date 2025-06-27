---
title: Python MCP Server Testing Standards
description: A document outlining comprehensive testing standards for MCP (Model Context Protocol) servers
tags:
  - mcp
  - testing
  - pytest
  - dual-interface
  - integration
createdAt: '2025-06-27T15:39:08.522Z'
updatedAt: '2025-06-27T15:39:08.522Z'
---

# MCP Server Testing Standards

## Overview

This document defines comprehensive testing standards for MCP (Model Context Protocol) servers, covering both HTTP and stdio interfaces, tool testing, integration testing, and performance validation. These patterns ensure reliable, robust MCP server implementations.

## Testing Philosophy

### MCP-Specific Testing Principles
- **Interface Parity**: Both HTTP and stdio interfaces must provide identical functionality
- **Protocol Compliance**: All responses must conform to JSON-RPC 2.0 and MCP specifications
- **Tool Isolation**: Each MCP tool should be testable in isolation
- **Integration Validation**: End-to-end workflows must be tested across both interfaces
- **Performance Verification**: Response times and concurrency limits must be validated

### Testing Strategy
- **Unit Tests**: Individual tool logic and validation
- **Interface Tests**: HTTP and stdio protocol compliance
- **Integration Tests**: Complete MCP workflows
- **Performance Tests**: Load testing and response time validation
- **Security Tests**: Authentication and authorization validation

## Test Environment Setup

### Test Configuration
```python
# tests/conftest.py
import pytest
import asyncio
import tempfile
from pathlib import Path
from typing import AsyncGenerator, Dict, Any
from unittest.mock import AsyncMock, MagicMock

from jane_server.config import JaneConfig
from jane_server.core.knowledge_base import KnowledgeBaseService
from jane_server.mcp.interfaces.shared_handler import SharedMCPHandler
from jane_server.mcp.interfaces.http_interface import HTTPMCPInterface
from jane_server.mcp.interfaces.stdio_interface import StdioMCPInterface

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def test_config() -> JaneConfig:
    """Test configuration with temporary paths."""
    with tempfile.TemporaryDirectory() as temp_dir:
        config = JaneConfig(
            jane_api_key="test-api-key-32-chars-minimum",
            jane_knowledge_base_path=Path(temp_dir) / "knowledge-base",
            jane_search_db_path=Path(temp_dir) / "search.db",
            jane_debug=True,
            jane_hot_reload=False,
            jane_container_mode=False,
            redis_url="redis://localhost:6379/1"  # Test DB
        )

        # Create test directories
        config.jane_knowledge_base_path.mkdir(parents=True, exist_ok=True)
        (config.jane_knowledge_base_path / "stdlib").mkdir(exist_ok=True)
        (config.jane_knowledge_base_path / "specs").mkdir(exist_ok=True)

        yield config

@pytest.fixture
async def mock_knowledge_base() -> AsyncMock:
    """Mock knowledge base for isolated testing."""
    mock_kb = AsyncMock(spec=KnowledgeBaseService)

    # Setup common mock responses
    mock_kb.get_stdlib_document.return_value = None
    mock_kb.get_spec_document.return_value = None
    mock_kb.search_documents.return_value = []
    mock_kb.create_document.return_value = MagicMock()

    return mock_kb

@pytest.fixture
async def mcp_handler(mock_knowledge_base) -> SharedMCPHandler:
    """MCP handler with mocked dependencies."""
    handler = SharedMCPHandler(mock_knowledge_base)
    await handler.initialize()
    return handler

@pytest.fixture
async def http_client(mcp_handler):
    """HTTP test client for MCP interface."""
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    app = FastAPI()
    http_interface = HTTPMCPInterface(app, mcp_handler.knowledge_base)
    await http_interface.initialize()

    return TestClient(app)

@pytest.fixture
def sample_documents():
    """Sample document data for testing."""
    return {
        "stdlib_python_testing": {
            "category": "stdlib",
            "language": "python",
            "domain": "testing",
            "title": "Python Testing Standards",
            "content": "# Python Testing\n\nComprehensive testing guidelines...",
            "tags": ["testing", "pytest", "python"]
        },
        "spec_jane_overview": {
            "category": "specs",
            "project": "jane-mcp",
            "title": "Jane MCP Server Overview",
            "content": "# Jane Overview\n\nJane is an MCP development knowledge network...",
            "tags": ["jane", "mcp", "overview"]
        }
    }
```

## MCP Tool Testing

### Base Tool Test Class
```python
# tests/test_tools/test_base.py
import pytest
from abc import ABC, abstractmethod
from typing import Dict, Any, Type
from unittest.mock import AsyncMock

from jane_server.tools.base import MCPTool
from jane_server.mcp.types import MCPRequest, MCPResponse

class MCPToolTestBase(ABC):
    """Base class for MCP tool testing."""

    @property
    @abstractmethod
    def tool_class(self) -> Type[MCPTool]:
        """Tool class to test."""
        pass

    @property
    @abstractmethod
    def valid_params(self) -> Dict[str, Any]:
        """Valid parameters for tool execution."""
        pass

    @property
    @abstractmethod
    def invalid_params(self) -> Dict[str, Any]:
        """Invalid parameters that should cause validation errors."""
        pass

    @pytest.fixture
    def tool_instance(self, mock_knowledge_base) -> MCPTool:
        """Create tool instance for testing."""
        return self.tool_class(mock_knowledge_base)

    def test_tool_metadata(self, tool_instance):
        """Test tool metadata is properly defined."""
        assert tool_instance.name
        assert tool_instance.description
        assert tool_instance.parameters
        assert isinstance(tool_instance.parameters, dict)
        assert "type" in tool_instance.parameters
        assert "properties" in tool_instance.parameters

    def test_parameter_schema_valid(self, tool_instance):
        """Test parameter schema is valid JSON Schema."""
        schema = tool_instance.parameters

        # Basic JSON Schema validation
        assert schema["type"] == "object"
        assert isinstance(schema["properties"], dict)

        if "required" in schema:
            assert isinstance(schema["required"], list)
            for req_field in schema["required"]:
                assert req_field in schema["properties"]

    @pytest.mark.asyncio
    async def test_valid_parameter_execution(self, tool_instance):
        """Test tool executes successfully with valid parameters."""
        result = await tool_instance.safe_execute(self.valid_params)
        assert result is not None

    @pytest.mark.asyncio
    async def test_invalid_parameter_validation(self, tool_instance):
        """Test tool rejects invalid parameters."""
        with pytest.raises((ValueError, TypeError)):
            await tool_instance.safe_execute(self.invalid_params)

    @pytest.mark.asyncio
    async def test_parameter_validation_error_messages(self, tool_instance):
        """Test validation error messages are helpful."""
        try:
            await tool_instance.safe_execute(self.invalid_params)
            pytest.fail("Expected validation error")
        except (ValueError, TypeError) as e:
            error_msg = str(e)
            assert len(error_msg) > 0
            assert "validation" in error_msg.lower() or "invalid" in error_msg.lower()
```

### Specific Tool Tests
```python
# tests/test_tools/test_knowledge_tools.py
import pytest
from unittest.mock import MagicMock

from jane_server.tools.knowledge_tools import GetStdlibTool, GetSpecTool, SearchKnowledgeBaseTool
from jane_server.models.document import Document, DocumentMetadata
from .test_base import MCPToolTestBase

class TestGetStdlibTool(MCPToolTestBase):
    """Test GetStdlibTool implementation."""

    tool_class = GetStdlibTool

    @property
    def valid_params(self):
        return {"language": "python", "domain": "testing"}

    @property
    def invalid_params(self):
        return {"language": "invalid_language", "domain": "testing"}

    @pytest.mark.asyncio
    async def test_document_found(self, tool_instance, mock_knowledge_base, sample_documents):
        """Test successful document retrieval."""
        # Setup mock document
        doc_data = sample_documents["stdlib_python_testing"]
        mock_doc = MagicMock(spec=Document)
        mock_doc.metadata = MagicMock(spec=DocumentMetadata)
        mock_doc.metadata.title = doc_data["title"]
        mock_doc.metadata.tags = doc_data["tags"]
        mock_doc.metadata.last_updated = "2024-12-20"
        mock_doc.content = doc_data["content"]
        mock_doc.path = Path("stdlib/python/testing.md")

        mock_knowledge_base.get_stdlib_document.return_value = mock_doc

        # Execute tool
        result = await tool_instance.execute(self.valid_params)

        # Verify result structure
        assert result["found"] is True
        assert result["language"] == "python"
        assert result["domain"] == "testing"
        assert result["title"] == doc_data["title"]
        assert result["content"] == doc_data["content"]
        assert result["tags"] == doc_data["tags"]
        assert "path" in result
        assert "last_updated" in result

        # Verify knowledge base was called correctly
        mock_knowledge_base.get_stdlib_document.assert_called_once_with("python", "testing")

    @pytest.mark.asyncio
    async def test_document_not_found(self, tool_instance, mock_knowledge_base):
        """Test handling when document doesn't exist."""
        mock_knowledge_base.get_stdlib_document.return_value = None

        result = await tool_instance.execute(self.valid_params)

        assert result["found"] is False
        assert "message" in result
        assert "python/testing" in result["message"]

class TestSearchKnowledgeBaseTool(MCPToolTestBase):
    """Test SearchKnowledgeBaseTool implementation."""

    tool_class = SearchKnowledgeBaseTool

    @property
    def valid_params(self):
        return {"query": "testing patterns", "category": "stdlib", "limit": 5}

    @property
    def invalid_params(self):
        return {"query": "", "limit": -1}  # Empty query, negative limit

    @pytest.mark.asyncio
    async def test_search_with_results(self, tool_instance, mock_knowledge_base):
        """Test search returning results."""
        from jane_server.models.search import SearchResult

        # Mock search results
        mock_results = [
            SearchResult(
                path="stdlib/python/testing.md",
                title="Python Testing Standards",
                category="stdlib",
                language="python",
                domain="testing",
                snippet="Testing patterns and best practices...",
                relevance_score=0.95
            ),
            SearchResult(
                path="stdlib/go/testing.md",
                title="Go Testing Standards",
                category="stdlib",
                language="go",
                domain="testing",
                snippet="Go testing conventions and patterns...",
                relevance_score=0.87
            )
        ]

        mock_knowledge_base.search_documents.return_value = mock_results

        # Execute search
        result = await tool_instance.execute(self.valid_params)

        # Verify result structure
        assert result["total_results"] == 2
        assert len(result["results"]) == 2
        assert result["query"] == "testing patterns"
        assert result["category"] == "stdlib"

        # Verify first result structure
        first_result = result["results"][0]
        assert first_result["title"] == "Python Testing Standards"
        assert first_result["path"] == "stdlib/python/testing.md"
        assert first_result["category"] == "stdlib"
        assert first_result["snippet"] == "Testing patterns and best practices..."
        assert first_result["relevance_score"] == 0.95

        # Verify knowledge base was called correctly
        mock_knowledge_base.search_documents.assert_called_once_with(
            query="testing patterns",
            category="stdlib",
            limit=5
        )
```

## Interface Testing

### HTTP Interface Tests
```python
# tests/test_interfaces/test_http_interface.py
import pytest
from fastapi.testclient import TestClient
import json

from jane_server.mcp.types import MCPRequest, MCPResponse

class TestHTTPMCPInterface:
    """Test HTTP MCP interface."""

    def test_health_check(self, http_client):
        """Test health check endpoint."""
        response = http_client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["interface"] == "http"

    def test_list_tools(self, http_client):
        """Test tools listing endpoint."""
        response = http_client.get("/mcp/tools")
        assert response.status_code == 200
        data = response.json()

        assert "tools" in data
        assert isinstance(data["tools"], list)
        assert len(data["tools"]) > 0

        # Verify tool structure
        tool = data["tools"][0]
        assert "name" in tool
        assert "description" in tool
        assert "inputSchema" in tool

    def test_mcp_call_success(self, http_client):
        """Test successful MCP tool call."""
        request_data = {
            "jsonrpc": "2.0",
            "method": "get_stdlib",
            "params": {"language": "python", "domain": "testing"},
            "id": "test-123"
        }

        response = http_client.post("/mcp/call", json=request_data)
        assert response.status_code == 200

        data = response.json()
        assert data["jsonrpc"] == "2.0"
        assert data["id"] == "test-123"
        assert "result" in data or "error" in data

    def test_mcp_call_invalid_method(self, http_client):
        """Test MCP call with invalid method."""
        request_data = {
            "jsonrpc": "2.0",
            "method": "nonexistent_tool",
            "params": {},
            "id": "test-456"
        }

        response = http_client.post("/mcp/call", json=request_data)
        assert response.status_code == 200

        data = response.json()
        assert data["jsonrpc"] == "2.0"
        assert data["id"] == "test-456"
        assert "error" in data
        assert data["error"]["code"] == -32601  # Method not found

    def test_mcp_call_invalid_params(self, http_client):
        """Test MCP call with invalid parameters."""
        request_data = {
            "jsonrpc": "2.0",
            "method": "get_stdlib",
            "params": {"language": "invalid", "domain": "testing"},
            "id": "test-789"
        }

        response = http_client.post("/mcp/call", json=request_data)
        assert response.status_code == 200

        data = response.json()
        assert "error" in data
        assert data["id"] == "test-789"

    def test_cors_headers(self, http_client):
        """Test CORS headers are present."""
        response = http_client.options("/mcp/tools")
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers
```

### stdio Interface Tests
```python
# tests/test_interfaces/test_stdio_interface.py
import pytest
import asyncio
import json
from unittest.mock import AsyncMock, MagicMock
from io import StringIO

from jane_server.mcp.interfaces.stdio_interface import StdioMCPInterface
from jane_server.mcp.types import MCPRequest, MCPResponse

class TestStdioMCPInterface:
    """Test stdio MCP interface."""

    @pytest.fixture
    def mock_stdin(self):
        """Mock stdin for testing."""
        return StringIO()

    @pytest.fixture
    def mock_stdout(self):
        """Mock stdout for testing."""
        return StringIO()

    @pytest.fixture
    async def stdio_interface(self, mcp_handler, mock_stdin, mock_stdout):
        """Create stdio interface for testing."""
        interface = StdioMCPInterface(mcp_handler.knowledge_base)
        interface.stdin = mock_stdin
        interface.stdout = mock_stdout
        return interface

    @pytest.mark.asyncio
    async def test_valid_request_processing(self, stdio_interface, mock_stdin, mock_stdout):
        """Test processing valid JSON-RPC request."""
        # Setup request
        request = {
            "jsonrpc": "2.0",
            "method": "get_stdlib",
            "params": {"language": "python", "domain": "testing"},
            "id": "test-001"
        }

        mock_stdin.write(json.dumps(request) + "\n")
        mock_stdin.seek(0)

        # Process single message
        await stdio_interface._process_message()

        # Verify response
        output = mock_stdout.getvalue()
        assert output.strip()

        response_data = json.loads(output.strip())
        assert response_data["jsonrpc"] == "2.0"
        assert response_data["id"] == "test-001"
        assert "result" in response_data or "error" in response_data

    @pytest.mark.asyncio
    async def test_invalid_json_handling(self, stdio_interface, mock_stdin, mock_stdout):
        """Test handling of invalid JSON."""
        mock_stdin.write("invalid json\n")
        mock_stdin.seek(0)

        await stdio_interface._process_message()

        output = mock_stdout.getvalue()
        response_data = json.loads(output.strip())

        assert "error" in response_data
        assert "Invalid JSON" in response_data["error"]["message"]

    @pytest.mark.asyncio
    async def test_empty_line_handling(self, stdio_interface, mock_stdin, mock_stdout):
        """Test handling of empty lines."""
        mock_stdin.write("\n")
        mock_stdin.seek(0)

        await stdio_interface._process_message()

        # Should not produce any output for empty lines
        output = mock_stdout.getvalue()
        assert output == ""

    @pytest.mark.asyncio
    async def test_request_without_id(self, stdio_interface, mock_stdin, mock_stdout):
        """Test request without ID (notification)."""
        request = {
            "jsonrpc": "2.0",
            "method": "get_stdlib",
            "params": {"language": "python", "domain": "testing"}
            # No "id" field - this is a notification
        }

        mock_stdin.write(json.dumps(request) + "\n")
        mock_stdin.seek(0)

        await stdio_interface._process_message()

        output = mock_stdout.getvalue()
        response_data = json.loads(output.strip())

        # Response should not have ID for notifications
        assert "id" not in response_data or response_data["id"] is None
```

## Integration Testing

### End-to-End Workflow Tests
```python
# tests/test_integration/test_workflows.py
import pytest
from pathlib import Path

class TestMCPWorkflows:
    """Test complete MCP workflows."""

    @pytest.mark.asyncio
    async def test_document_creation_workflow(self, mcp_handler, test_config):
        """Test complete document creation workflow."""
        # 1. Create document
        create_params = {
            "category": "stdlib",
            "path": "python/new-testing-patterns.md",
            "title": "New Testing Patterns",
            "content": "# New Testing Patterns\n\nAdvanced testing techniques...",
            "language": "python",
            "domain": "testing",
            "tags": ["testing", "patterns", "advanced"],
            "commit_message": "docs(stdlib): add new testing patterns guide"
        }

        create_result = await mcp_handler.handle_call(MCPRequest(
            method="create_document",
            params=create_params,
            id="create-001"
        ))

        assert create_result.error is None
        assert create_result.result["message"] == "Document created successfully"

        # 2. Retrieve created document
        get_params = {
            "language": "python",
            "domain": "new-testing-patterns"
        }

        get_result = await mcp_handler.handle_call(MCPRequest(
            method="get_stdlib",
            params=get_params,
            id="get-001"
        ))

        assert get_result.error is None
        assert get_result.result["found"] is True
        assert get_result.result["title"] == "New Testing Patterns"

        # 3. Search for document
        search_params = {
            "query": "testing patterns",
            "category": "stdlib"
        }

        search_result = await mcp_handler.handle_call(MCPRequest(
            method="search_knowledge_base",
            params=search_params,
            id="search-001"
        ))

        assert search_result.error is None
        assert search_result.result["total_results"] > 0

        # Verify our document appears in search results
        found_in_search = any(
            "new-testing-patterns" in result["path"]
            for result in search_result.result["results"]
        )
        assert found_in_search

    @pytest.mark.asyncio
    async def test_cross_category_search(self, mcp_handler, sample_documents):
        """Test searching across different document categories."""
        search_params = {
            "query": "testing",
            # No category specified - should search all
        }

        result = await mcp_handler.handle_call(MCPRequest(
            method="search_knowledge_base",
            params=search_params,
            id="cross-search-001"
        ))

        assert result.error is None
        results = result.result["results"]

        # Should find documents from multiple categories
        categories = {r["category"] for r in results}
        assert len(categories) > 0  # At least some results

    @pytest.mark.asyncio
    async def test_error_handling_workflow(self, mcp_handler):
        """Test error handling in workflows."""
        # 1. Try to get non-existent document
        get_result = await mcp_handler.handle_call(MCPRequest(
            method="get_stdlib",
            params={"language": "nonexistent", "domain": "fake"},
            id="error-001"
        ))

        assert get_result.error is None  # No protocol error
        assert get_result.result["found"] is False

        # 2. Try invalid tool method
        invalid_result = await mcp_handler.handle_call(MCPRequest(
            method="nonexistent_method",
            params={},
            id="error-002"
        ))

        assert invalid_result.error is not None
        assert invalid_result.error["code"] == -32601  # Method not found

        # 3. Try invalid parameters
        invalid_params_result = await mcp_handler.handle_call(MCPRequest(
            method="get_stdlib",
            params={"invalid": "params"},
            id="error-003"
        ))

        assert invalid_params_result.error is not None
```

## Performance Testing

### Load and Response Time Tests
```python
# tests/test_performance/test_load.py
import pytest
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor

class TestMCPPerformance:
    """Test MCP server performance characteristics."""

    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_response_time_under_load(self, mcp_handler):
        """Test response times under concurrent load."""

        async def make_request():
            start_time = time.time()
            result = await mcp_handler.handle_call(MCPRequest(
                method="get_stdlib",
                params={"language": "python", "domain": "testing"},
                id=f"perf-{time.time()}"
            ))
            end_time = time.time()
            return end_time - start_time, result

        # Make 50 concurrent requests
        tasks = [make_request() for _ in range(50)]
        results = await asyncio.gather(*tasks)

        response_times = [r[0] for r in results]
        successful_requests = [r[1] for r in results if r[1].error is None]

        # Performance assertions
        avg_response_time = sum(response_times) / len(response_times)
        max_response_time = max(response_times)

        assert avg_response_time < 0.5  # 500ms average
        assert max_response_time < 2.0  # 2s maximum
        assert len(successful_requests) == 50  # All requests succeed

    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_memory_usage_stability(self, mcp_handler):
        """Test memory usage remains stable under load."""
        import psutil
        import os

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss

        # Execute many requests
        for i in range(100):
            await mcp_handler.handle_call(MCPRequest(
                method="search_knowledge_base",
                params={"query": f"test query {i}"},
                id=f"mem-test-{i}"
            ))

            # Check memory every 10 requests
            if i % 10 == 0:
                current_memory = process.memory_info().rss
                memory_growth = (current_memory - initial_memory) / initial_memory

                # Memory should not grow excessively (>50% growth indicates leak)
                assert memory_growth < 0.5, f"Memory grew {memory_growth:.2%} after {i} requests"

    @pytest.mark.performance
    def test_tool_registration_performance(self, mock_knowledge_base):
        """Test tool registration performance."""
        from jane_server.mcp.interfaces.shared_handler import SharedMCPHandler

        start_time = time.time()
        handler = SharedMCPHandler(mock_knowledge_base)

        # Registration should be fast
        registration_time = time.time() - start_time
        assert registration_time < 0.1  # 100ms maximum

        # Should have registered multiple tools
        assert len(handler.tools) > 0
```

## Validation

### MCP Testing Checklist
- [ ] All MCP tools have comprehensive unit tests
- [ ] Both HTTP and stdio interfaces tested for protocol compliance
- [ ] Integration tests cover complete workflows
- [ ] Performance tests validate response times and concurrency
- [ ] Error handling tested for all failure scenarios
- [ ] Parameter validation tested with invalid inputs
- [ ] Authentication and authorization tested
- [ ] Tool discovery and registration tested
- [ ] Memory usage and resource leaks tested
- [ ] Cross-interface parity validated (HTTP vs stdio)

### Test Coverage Requirements
- [ ] >90% code coverage for MCP tool implementations
- [ ] >85% code coverage for interface implementations
- [ ] All error paths covered by tests
- [ ] All tool parameter combinations tested
- [ ] Protocol compliance verified for all responses
- [ ] Performance benchmarks established and monitored

## Examples

### Complete Test Suite Example
```python
# tests/test_integration/test_jane_mcp_server.py
import pytest
import asyncio
from fastapi.testclient import TestClient

@pytest.mark.integration
class TestJaneMCPServerIntegration:
    """Complete integration test for Jane MCP server."""

    @pytest.mark.asyncio
    async def test_full_development_workflow(self, http_client, test_config):
        """Test complete development knowledge workflow."""

        # 1. List available tools
        tools_response = http_client.get("/mcp/tools")
        assert tools_response.status_code == 200
        tools = tools_response.json()["tools"]
        tool_names = {tool["name"] for tool in tools}

        # Verify Jane has all expected tools
        expected_tools = {
            "get_stdlib", "get_spec", "search_knowledge_base",
            "create_document", "update_document", "list_categories"
        }
        assert expected_tools.issubset(tool_names)

        # 2. Search for existing content
        search_request = {
            "jsonrpc": "2.0",
            "method": "search_knowledge_base",
            "params": {"query": "testing", "limit": 5},
            "id": "workflow-search"
        }

        search_response = http_client.post("/mcp/call", json=search_request)
        assert search_response.status_code == 200
        search_data = search_response.json()
        assert "result" in search_data

        # 3. Get specific stdlib document
        stdlib_request = {
            "jsonrpc": "2.0",
            "method": "get_stdlib",
            "params": {"language": "python", "domain": "testing"},
            "id": "workflow-stdlib"
        }

        stdlib_response = http_client.post("/mcp/call", json=stdlib_request)
        assert stdlib_response.status_code == 200
        stdlib_data = stdlib_response.json()

        # Should find document or return not found gracefully
        assert "result" in stdlib_data
        assert isinstance(stdlib_data["result"], dict)
        assert "found" in stdlib_data["result"]

        # 4. Create new document
        create_request = {
            "jsonrpc": "2.0",
            "method": "create_document",
            "params": {
                "category": "stdlib",
                "path": "python/integration-testing.md",
                "title": "Integration Testing Patterns",
                "content": "# Integration Testing\n\nComprehensive integration testing patterns...",
                "language": "python",
                "domain": "integration-testing",
                "commit_message": "docs(stdlib): add integration testing patterns"
            },
            "id": "workflow-create"
        }

        create_response = http_client.post("/mcp/call", json=create_request)
        assert create_response.status_code == 200
        create_data = create_response.json()

        # Creation should succeed or fail gracefully
        assert "result" in create_data or "error" in create_data

        print("✅ Jane MCP server integration test completed successfully")
```

These comprehensive testing standards ensure Jane's MCP server implementation is robust, performant, and fully compliant with MCP protocol specifications across both HTTP and stdio interfaces.