---
title: Python MCP Protocol Standards
description: A document outlining standards for implementing the Model Context Protocol (MCP) in Python applications
tags:
  - mcp
  - protocol
  - json-rpc
  - tools
  - interfaces
createdAt: '2025-06-27T15:39:08.522Z'
updatedAt: '2025-06-27T15:39:08.522Z'
---

# MCP Protocol Standards

## Overview

This document defines standards for implementing the Model Context Protocol (MCP) in Python applications, covering both HTTP and stdio interfaces, tool definitions, request/response handling, and best practices for reliable MCP server development.

## MCP Protocol Fundamentals

### JSON-RPC 2.0 Foundation
MCP is built on JSON-RPC 2.0, providing structured communication between LLM clients and servers.

```python
# Core MCP types
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Union

class MCPRequest(BaseModel):
    """Standard MCP request structure."""
    jsonrpc: str = Field(default="2.0")
    method: str = Field(..., description="Tool name to execute")
    params: Optional[Dict[str, Any]] = Field(default=None, description="Tool parameters")
    id: Optional[Union[str, int]] = Field(default=None, description="Request identifier")

class MCPResponse(BaseModel):
    """Standard MCP response structure."""
    jsonrpc: str = Field(default="2.0")
    result: Optional[Any] = Field(default=None, description="Tool execution result")
    error: Optional[Dict[str, Any]] = Field(default=None, description="Error information")
    id: Optional[Union[str, int]] = Field(default=None, description="Request identifier")

class MCPError(BaseModel):
    """MCP error structure."""
    code: int = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    data: Optional[Any] = Field(default=None, description="Additional error data")
```

### Tool Schema Standards
MCP tools must provide JSON Schema for parameter validation and LLM understanding.

```python
# Tool schema definition
class MCPToolSchema(BaseModel):
    """JSON Schema for MCP tool parameters."""
    type: str = Field(default="object")
    properties: Dict[str, Any] = Field(..., description="Parameter definitions")
    required: List[str] = Field(default=[], description="Required parameters")
    additionalProperties: bool = Field(default=False)

# Example tool schema
GET_STDLIB_SCHEMA = {
    "type": "object",
    "properties": {
        "language": {
            "type": "string",
            "description": "Programming language (python, go, javascript)",
            "enum": ["python", "go", "javascript", "typescript", "rust"]
        },
        "domain": {
            "type": "string",
            "description": "Domain area (architecture, testing, security, performance)",
            "enum": ["architecture", "testing", "security", "performance", "patterns"]
        }
    },
    "required": ["language", "domain"],
    "additionalProperties": False
}
```

## Dual Interface Implementation

### HTTP Interface Standards
HTTP interface should implement MCP over REST endpoints with proper error handling.

```python
# HTTP interface implementation
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

class HTTPMCPInterface:
    """HTTP MCP interface with FastAPI."""

    def __init__(self, app: FastAPI, handler: 'SharedMCPHandler'):
        self.app = app
        self.handler = handler
        self._setup_middleware()
        self._setup_routes()

    def _setup_middleware(self):
        """Configure CORS and other middleware."""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Configure based on security requirements
            allow_credentials=True,
            allow_methods=["GET", "POST"],
            allow_headers=["*"],
        )

    def _setup_routes(self):
        """Setup MCP HTTP endpoints."""

        @self.app.post("/mcp/call")
        async def handle_mcp_call(request: MCPRequest) -> MCPResponse:
            """Handle MCP tool execution via HTTP."""
            try:
                return await self.handler.handle_call(request)
            except Exception as e:
                # Return proper MCP error format
                return MCPResponse(
                    error=MCPError(
                        code=-32603,  # Internal error
                        message=f"Internal server error: {str(e)}"
                    ).model_dump(),
                    id=request.id
                )

        @self.app.get("/mcp/tools")
        async def list_tools() -> Dict[str, Any]:
            """List available MCP tools."""
            return await self.handler.list_tools()

        @self.app.get("/health")
        async def health_check():
            """Health check endpoint."""
            return {"status": "healthy", "interface": "http", "protocol": "mcp"}
```

### stdio Interface Standards
stdio interface handles line-based JSON communication for Claude Desktop integration.

```python
# stdio interface implementation
import asyncio
import json
import sys
from typing import TextIO

class StdioMCPInterface:
    """stdio MCP interface for Claude Desktop."""

    def __init__(self, handler: 'SharedMCPHandler'):
        self.handler = handler
        self.running = False
        self.stdin: TextIO = sys.stdin
        self.stdout: TextIO = sys.stdout

    async def start(self):
        """Start stdio message loop."""
        await self.handler.initialize()
        self.running = True

        try:
            while self.running:
                await self._process_message()
        except KeyboardInterrupt:
            self.running = False
        except Exception as e:
            await self._send_error(f"stdio interface fatal error: {e}")

    async def _process_message(self):
        """Process single stdio message."""
        try:
            # Read line from stdin (blocking)
            line = await asyncio.get_event_loop().run_in_executor(
                None, self.stdin.readline
            )

            if not line.strip():
                return

            # Parse JSON request
            try:
                data = json.loads(line.strip())
                request = MCPRequest(**data)
            except json.JSONDecodeError as e:
                await self._send_error(f"Invalid JSON: {e}")
                return
            except Exception as e:
                await self._send_error(f"Invalid request format: {e}")
                return

            # Handle request
            response = await self.handler.handle_call(request)
            await self._send_response(response)

        except Exception as e:
            await self._send_error(f"Message processing error: {e}")

    async def _send_response(self, response: MCPResponse):
        """Send response to stdout."""
        response_json = response.model_dump_json()
        self.stdout.write(response_json + "\n")
        self.stdout.flush()

    async def _send_error(self, message: str):
        """Send error response."""
        error_response = MCPResponse(
            error=MCPError(code=-32603, message=message).model_dump()
        )
        await self._send_response(error_response)
```

## Tool Implementation Standards

### Base Tool Class
All MCP tools should inherit from a standard base class for consistency.

```python
# Base tool implementation
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

class MCPTool(ABC):
    """Base class for all MCP tools."""

    def __init__(self, knowledge_base=None):
        self.knowledge_base = knowledge_base
        self.logger = logging.getLogger(f"mcp.tool.{self.name}")

    @property
    @abstractmethod
    def name(self) -> str:
        """Tool name for MCP registration."""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Human-readable tool description."""
        pass

    @property
    @abstractmethod
    def parameters(self) -> Dict[str, Any]:
        """JSON Schema for tool parameters."""
        pass

    @abstractmethod
    async def execute(self, params: Dict[str, Any]) -> Any:
        """Execute tool with validated parameters."""
        pass

    def validate_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Validate parameters against schema."""
        # Use jsonschema for validation
        import jsonschema

        try:
            jsonschema.validate(params, self.parameters)
            return params
        except jsonschema.ValidationError as e:
            raise ValueError(f"Parameter validation failed: {e.message}")

    async def safe_execute(self, params: Dict[str, Any]) -> Any:
        """Execute with parameter validation and error handling."""
        try:
            validated_params = self.validate_params(params)
            self.logger.debug(f"Executing {self.name} with params: {validated_params}")

            result = await self.execute(validated_params)

            self.logger.debug(f"Tool {self.name} completed successfully")
            return result

        except Exception as e:
            self.logger.error(f"Tool {self.name} failed: {e}")
            raise
```

### Example Tool Implementation
Concrete tools follow the standard pattern with proper typing and validation.

```python
# Example: Get stdlib tool
class GetStdlibTool(MCPTool):
    """Tool for retrieving stdlib documents."""

    @property
    def name(self) -> str:
        return "get_stdlib"

    @property
    def description(self) -> str:
        return "Retrieve coding standards document by language and domain"

    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "language": {
                    "type": "string",
                    "description": "Programming language",
                    "enum": ["python", "go", "javascript", "typescript", "rust"]
                },
                "domain": {
                    "type": "string",
                    "description": "Domain area",
                    "enum": ["architecture", "testing", "security", "performance"]
                }
            },
            "required": ["language", "domain"],
            "additionalProperties": False
        }

    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Retrieve stdlib document."""
        language = params["language"]
        domain = params["domain"]

        # Get document from knowledge base
        document = await self.knowledge_base.get_stdlib_document(language, domain)

        if not document:
            return {
                "found": False,
                "message": f"No stdlib document found for {language}/{domain}"
            }

        return {
            "found": True,
            "language": language,
            "domain": domain,
            "title": document.metadata.title,
            "content": document.content,
            "tags": document.metadata.tags,
            "last_updated": document.metadata.last_updated,
            "path": str(document.path)
        }
```

## Error Handling Standards

### Standard Error Codes
Use consistent error codes across all MCP implementations.

```python
# MCP error codes
class MCPErrorCodes:
    """Standard MCP error codes."""
    PARSE_ERROR = -32700      # Invalid JSON
    INVALID_REQUEST = -32600  # Invalid request object
    METHOD_NOT_FOUND = -32601 # Tool not found
    INVALID_PARAMS = -32602   # Invalid tool parameters
    INTERNAL_ERROR = -32603   # Internal server error

    # Custom error codes (>= -32000)
    TOOL_EXECUTION_ERROR = -32000    # Tool execution failed
    VALIDATION_ERROR = -32001        # Parameter validation failed
    RESOURCE_NOT_FOUND = -32002      # Requested resource not found
    PERMISSION_DENIED = -32003       # Insufficient permissions
    RATE_LIMITED = -32004            # Rate limit exceeded

def create_mcp_error(code: int, message: str, data: Any = None) -> Dict[str, Any]:
    """Create standardized MCP error."""
    error = {"code": code, "message": message}
    if data is not None:
        error["data"] = data
    return error
```

### Error Handler Implementation
Centralized error handling for consistent responses.

```python
# Error handling utilities
class MCPErrorHandler:
    """Centralized MCP error handling."""

    @staticmethod
    def handle_tool_error(e: Exception, tool_name: str, request_id: Optional[str] = None) -> MCPResponse:
        """Handle tool execution errors."""
        if isinstance(e, ValueError):
            error = create_mcp_error(
                MCPErrorCodes.INVALID_PARAMS,
                f"Invalid parameters for {tool_name}: {str(e)}"
            )
        elif isinstance(e, FileNotFoundError):
            error = create_mcp_error(
                MCPErrorCodes.RESOURCE_NOT_FOUND,
                f"Resource not found in {tool_name}: {str(e)}"
            )
        elif isinstance(e, PermissionError):
            error = create_mcp_error(
                MCPErrorCodes.PERMISSION_DENIED,
                f"Permission denied in {tool_name}: {str(e)}"
            )
        else:
            error = create_mcp_error(
                MCPErrorCodes.TOOL_EXECUTION_ERROR,
                f"Tool {tool_name} execution failed: {str(e)}"
            )

        return MCPResponse(error=error, id=request_id)
```

## Performance Optimization

### Async Best Practices
Optimize MCP servers for high-throughput async operations.

```python
# Async optimization patterns
import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache

class PerformantMCPHandler:
    """High-performance MCP handler."""

    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.cache = {}

    @lru_cache(maxsize=128)
    def get_tool_schema(self, tool_name: str) -> Dict[str, Any]:
        """Cache tool schemas for faster access."""
        tool = self.tools.get(tool_name)
        return tool.parameters if tool else {}

    async def handle_call_batch(self, requests: List[MCPRequest]) -> List[MCPResponse]:
        """Handle multiple requests concurrently."""
        tasks = [self.handle_call(request) for request in requests]
        return await asyncio.gather(*tasks, return_exceptions=True)

    async def execute_io_bound_task(self, func, *args, **kwargs):
        """Execute I/O bound tasks in thread pool."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, func, *args, **kwargs)
```

### Caching Strategies
Implement intelligent caching for frequently accessed data.

```python
# Caching implementation
import time
from typing import Optional, Tuple, Any
import hashlib
import json

class MCPCache:
    """MCP response caching system."""

    def __init__(self, ttl: int = 300):
        self.ttl = ttl
        self.cache: Dict[str, Tuple[Any, float]] = {}

    def _generate_key(self, tool_name: str, params: Dict[str, Any]) -> str:
        """Generate cache key from tool name and parameters."""
        params_str = json.dumps(params, sort_keys=True)
        return hashlib.md5(f"{tool_name}:{params_str}".encode()).hexdigest()

    def get(self, tool_name: str, params: Dict[str, Any]) -> Optional[Any]:
        """Get cached result if not expired."""
        key = self._generate_key(tool_name, params)

        if key in self.cache:
            result, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return result
            else:
                del self.cache[key]

        return None

    def set(self, tool_name: str, params: Dict[str, Any], result: Any):
        """Cache result with timestamp."""
        key = self._generate_key(tool_name, params)
        self.cache[key] = (result, time.time())

    def clear_expired(self):
        """Remove expired cache entries."""
        current_time = time.time()
        expired_keys = [
            key for key, (_, timestamp) in self.cache.items()
            if current_time - timestamp >= self.ttl
        ]
        for key in expired_keys:
            del self.cache[key]
```

## Testing Standards

### MCP Tool Testing
Comprehensive testing patterns for MCP tools and interfaces.

```python
# MCP testing utilities
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock

class MCPTestCase:
    """Base class for MCP tool testing."""

    @pytest.fixture
    def mock_knowledge_base(self):
        """Mock knowledge base for testing."""
        mock_kb = AsyncMock()
        mock_kb.get_stdlib_document.return_value = None
        return mock_kb

    @pytest.fixture
    def mcp_tool(self, mock_knowledge_base):
        """Create tool instance for testing."""
        return self.tool_class(mock_knowledge_base)

    async def test_tool_schema_valid(self, mcp_tool):
        """Test that tool schema is valid JSON Schema."""
        schema = mcp_tool.parameters
        assert isinstance(schema, dict)
        assert "type" in schema
        assert "properties" in schema

    async def test_tool_execution_success(self, mcp_tool):
        """Test successful tool execution."""
        params = self.get_valid_params()
        result = await mcp_tool.safe_execute(params)
        assert result is not None

    async def test_tool_validation_failure(self, mcp_tool):
        """Test parameter validation failure."""
        invalid_params = self.get_invalid_params()
        with pytest.raises(ValueError):
            await mcp_tool.safe_execute(invalid_params)

    def get_valid_params(self) -> Dict[str, Any]:
        """Override in subclasses."""
        raise NotImplementedError

    def get_invalid_params(self) -> Dict[str, Any]:
        """Override in subclasses."""
        raise NotImplementedError

# Example test implementation
class TestGetStdlibTool(MCPTestCase):
    """Test GetStdlibTool implementation."""

    tool_class = GetStdlibTool

    def get_valid_params(self) -> Dict[str, Any]:
        return {"language": "python", "domain": "testing"}

    def get_invalid_params(self) -> Dict[str, Any]:
        return {"language": "invalid", "domain": "testing"}

    @pytest.mark.asyncio
    async def test_document_found(self, mcp_tool, mock_knowledge_base):
        """Test when document is found."""
        # Setup mock
        mock_doc = MagicMock()
        mock_doc.content = "# Test Content"
        mock_doc.metadata.title = "Test Title"
        mock_knowledge_base.get_stdlib_document.return_value = mock_doc

        # Execute tool
        result = await mcp_tool.execute(self.get_valid_params())

        # Verify result
        assert result["found"] is True
        assert result["content"] == "# Test Content"
        assert result["title"] == "Test Title"
```

## Validation

### MCP Implementation Checklist
- [ ] JSON-RPC 2.0 compliance for all requests/responses
- [ ] Proper error handling with standard error codes
- [ ] Tool schema validation using JSON Schema
- [ ] Both HTTP and stdio interfaces implemented
- [ ] Async/await used throughout for optimal performance
- [ ] Comprehensive logging for debugging and monitoring
- [ ] Parameter validation for all tools
- [ ] Error responses follow MCP standard format
- [ ] Tool registration and discovery working
- [ ] Performance optimizations (caching, connection pooling)

### Interface Testing
- [ ] HTTP interface handles MCP requests correctly
- [ ] stdio interface processes line-based JSON
- [ ] Both interfaces return identical results
- [ ] Error handling consistent across interfaces
- [ ] Tool schemas valid and complete
- [ ] Parameter validation catches invalid inputs
- [ ] Concurrent request handling works properly
- [ ] Memory usage remains stable under load

### Protocol Compliance
- [ ] All responses include jsonrpc: "2.0"
- [ ] Request IDs properly echoed in responses
- [ ] Error objects follow JSON-RPC error format
- [ ] Tool discovery returns proper schema format
- [ ] Parameter types match schema definitions
- [ ] Required parameters enforced
- [ ] Optional parameters handled correctly
- [ ] Large responses don't block other requests

## Examples

### Complete MCP Server Setup
```python
# Complete MCP server implementation
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize MCP server with dual interfaces."""
    # Initialize knowledge base
    knowledge_base = KnowledgeBaseService()
    await knowledge_base.initialize()

    # Setup shared handler
    handler = SharedMCPHandler(knowledge_base)
    await handler.initialize()

    # Setup HTTP interface
    http_interface = HTTPMCPInterface(app, handler)

    # Setup stdio interface (background task)
    stdio_interface = StdioMCPInterface(handler)
    stdio_task = asyncio.create_task(stdio_interface.start())

    try:
        yield {"handler": handler, "http": http_interface, "stdio": stdio_interface}
    finally:
        stdio_task.cancel()
        await knowledge_base.shutdown()

def create_mcp_server() -> FastAPI:
    """Create MCP server with dual interfaces."""
    app = FastAPI(
        title="MCP Development Knowledge Server",
        description="Dual HTTP/stdio MCP server for development knowledge",
        version="1.0",
        lifespan=lifespan
    )

    return app

# CLI entry point
if __name__ == "__main__":
    import sys

    if "--stdio" in sys.argv:
        # stdio-only mode for Claude Desktop
        asyncio.run(run_stdio_only())
    else:
        # HTTP mode with uvicorn
        import uvicorn
        uvicorn.run("main:create_mcp_server", factory=True, host="0.0.0.0", port=9001)
```

These MCP protocol standards ensure consistent, reliable, and performant implementation of MCP servers with proper dual interface support, comprehensive error handling, and optimal async patterns.