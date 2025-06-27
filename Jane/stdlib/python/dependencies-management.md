---
title: Python Dependency Management Standards
description: A document that outlines standards for managing Python dependencies, virtual environments, and package installation
tags:
  - packages
  - virtual-environments
  - security
  - reproducibility
createdAt: '2025-06-27T15:39:08.522Z'
updatedAt: '2025-06-27T15:39:08.522Z'
---

# Python Dependency Management Standards

## Overview

This document defines standards for managing Python dependencies, virtual environments, and package installation to ensure reproducible builds, security, and maintainability across all Python projects.

## Package Management Strategy

### Primary Tools
- **uv**: Fast Python package installer and resolver (preferred)
- **pip**: Fallback package installer
- **pyproject.toml**: Modern Python project configuration
- **requirements.txt**: Legacy support and deployment

### Project Configuration with pyproject.toml
```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "my-project"
version = "1.0.0"
description = "Project description"
readme = "README.md"
license = {file = "LICENSE"}
authors = [
    {name = "Your Name", email = "your.email@example.com"}
]
classifiers = [
    "Development Status :: 4 - Beta",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]
requires-python = ">=3.9"

dependencies = [
    "fastapi>=0.104.0,<1.0.0",
    "uvicorn[standard]>=0.24.0",
    "pydantic>=2.0.0,<3.0.0",
    "httpx>=0.25.0",
    "sqlalchemy[asyncio]>=2.0.0,<3.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "black>=23.0.0",
    "isort>=5.12.0",
    "flake8>=6.0.0",
    "mypy>=1.5.0",
    "pre-commit>=3.4.0",
]
test = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "pytest-cov>=4.1.0",
    "httpx>=0.25.0",
]
docs = [
    "mkdocs>=1.5.0",
    "mkdocs-material>=9.2.0",
]

[project.scripts]
my-cli = "my_project.cli:main"

[tool.hatch.build.targets.wheel]
packages = ["src/my_project"]
```

## Virtual Environment Management

### Using uv (Recommended)
```bash
# Create and activate virtual environment
uv venv
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate  # Windows

# Install dependencies
uv pip install -e ".[dev,test]"

# Install specific package
uv pip install "fastapi>=0.104.0"

# Generate requirements.txt for deployment
uv pip freeze > requirements.txt
```

### Alternative: Traditional venv
```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip

# Install project in development mode
pip install -e ".[dev,test]"
```

## Dependency Versioning Strategy

### Version Pinning Rules
```toml
# Production dependencies: compatible release
dependencies = [
    "fastapi>=0.104.0,<1.0.0",  # Allow patch updates
    "pydantic>=2.5.0,<3.0.0",   # Allow minor updates within major
    "httpx>=0.25.0",             # Minimum version only for stable packages
]

# Development dependencies: more flexible
[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",     # Minimum version for stable tools
    "black>=23.0.0",     # Latest for formatting tools
    "mypy>=1.5.0",       # Stay current with type checking
]
```

### Package Categories
```toml
# Core runtime dependencies (strict versioning)
dependencies = [
    "fastapi>=0.104.0,<1.0.0",
    "pydantic>=2.5.0,<3.0.0",
    "sqlalchemy[asyncio]>=2.0.0,<3.0.0",
]

# Infrastructure dependencies (moderate versioning)
[project.optional-dependencies]
prod = [
    "uvicorn[standard]>=0.24.0",
    "gunicorn>=21.2.0",
    "psycopg2-binary>=2.9.0",
]

# Development tools (flexible versioning)
dev = [
    "pytest>=7.4.0",
    "black>=23.0.0",
    "isort>=5.12.0",
    "flake8>=6.0.0",
    "mypy>=1.5.0",
]

# Testing dependencies
test = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "pytest-cov>=4.1.0",
    "factory-boy>=3.3.0",
    "freezegun>=1.2.0",
]
```

## Security and Vulnerability Management

### Security Scanning
```bash
# Install security tools
uv pip install safety bandit semgrep

# Scan dependencies for known vulnerabilities
safety check

# Scan code for security issues
bandit -r src/

# Advanced security scanning
semgrep scan --config=auto
```

### Regular Updates
```bash
# Check for outdated packages
uv pip list --outdated

# Update packages (with testing)
uv pip install --upgrade "fastapi>=0.104.0,<1.0.0"

# Update all development dependencies
uv pip install --upgrade -e ".[dev]"
```

## Recommended Core Packages

### Web Development Stack
```toml
dependencies = [
    # Web framework
    "fastapi>=0.104.0,<1.0.0",
    "uvicorn[standard]>=0.24.0",

    # Data validation and parsing
    "pydantic>=2.5.0,<3.0.0",
    "pydantic-settings>=2.1.0",

    # HTTP client
    "httpx>=0.25.0",

    # Database
    "sqlalchemy[asyncio]>=2.0.0,<3.0.0",
    "alembic>=1.12.0",

    # Utilities
    "python-multipart>=0.0.6",  # File uploads
    "python-jose[cryptography]>=3.3.0",  # JWT
    "passlib[bcrypt]>=1.7.4",  # Password hashing
]
```

### Development Tools
```toml
[project.optional-dependencies]
dev = [
    # Code formatting and linting
    "black>=23.0.0",
    "isort>=5.12.0",
    "flake8>=6.0.0",
    "mypy>=1.5.0",

    # Testing
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "pytest-cov>=4.1.0",

    # Development utilities
    "pre-commit>=3.4.0",
    "ipython>=8.15.0",
    "rich>=13.5.0",  # Better CLI output
]
```

### Jane MCP Server Dependencies
```toml
# Jane-specific dependency stack
[project]
name = "jane-mcp-server"
version = "2.0.0"
description = "Jane - MCP Development Knowledge Network"
requires-python = ">=3.11"

dependencies = [
    # Core MCP and web framework
    "fastapi>=0.104.0,<1.0.0",
    "uvicorn[standard]>=0.24.0",
    "pydantic>=2.5.0,<3.0.0",
    "pydantic-settings>=2.1.0",

    # HTTP client for GitHub API
    "httpx>=0.25.0",

    # Database and search
    "sqlalchemy[asyncio]>=2.0.0,<3.0.0",
    "aiosqlite>=0.19.0",

    # File operations and async I/O
    "aiofiles>=23.2.0",
    "python-multipart>=0.0.6",

    # Git integration
    "gitpython>=3.1.40",

    # Authentication and security
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",

    # Redis for caching
    "redis>=5.0.0",

    # Document processing
    "pyyaml>=6.0.1",
    "markdown>=3.5.0",

    # Utilities
    "rich>=13.5.0",  # CLI output
    "click>=8.1.0",  # CLI framework
]

[project.optional-dependencies]
# Development tools
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "pytest-cov>=4.1.0",
    "black>=23.0.0",
    "isort>=5.12.0",
    "flake8>=6.0.0",
    "mypy>=1.5.0",
    "pre-commit>=3.4.0",
    "ipython>=8.15.0",
]

# Container-specific dependencies
container = [
    "gunicorn>=21.2.0",     # Production WSGI server
    "supervisor>=4.2.0",    # Process management
]

# Documentation
docs = [
    "mkdocs>=1.5.0",
    "mkdocs-material>=9.2.0",
]

[project.scripts]
jane = "jane_server.cli:main"
jane-server = "jane_server.main:run"
```

### Async and Concurrency
```toml
dependencies = [
    "aioredis>=2.0.0",          # Redis async client
    "aiofiles>=23.2.0",         # Async file operations
    "httpx>=0.25.0",            # Async HTTP client
    "aiosqlite>=0.19.0",        # Async SQLite
]
```

## Environment-Specific Requirements

### Development Environment
```bash
# Install all dependencies including dev tools
uv pip install -e ".[dev,test,docs]"

# Or using requirements files
pip install -r requirements-dev.txt
```

### Production Environment
```bash
# Install only production dependencies
uv pip install -e .

# Or using locked requirements
pip install -r requirements.txt --no-deps
```

### Docker Environments with uv
```dockerfile
# Multi-stage Dockerfile optimized for Jane container deployment
FROM python:3.11-slim as base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast package management
RUN pip install uv

WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Development stage
FROM base as development

# Install all dependencies including dev tools
RUN uv sync --frozen --all-extras

# Copy source code
COPY src/ ./src/
COPY knowledge-base/ ./knowledge-base/

# Create directories
RUN mkdir -p /app/data /app/logs

# Development command with hot reload
CMD ["uv", "run", "uvicorn", "src.jane_server.main:app", "--host", "0.0.0.0", "--port", "9001", "--reload"]

# Production stage
FROM base as production

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash --uid 1000 jane
USER jane

# Install production dependencies only
RUN uv sync --frozen --no-dev

# Copy application code
COPY --chown=jane:jane src/ ./src/
COPY --chown=jane:jane knowledge-base/ ./knowledge-base/

# Create required directories
RUN mkdir -p /app/data /app/logs

# Production command with multiple workers
CMD ["uv", "run", "uvicorn", "src.jane_server.main:app", "--host", "0.0.0.0", "--port", "9001", "--workers", "2"]
```

## Dependency Lock Files

### Creating Lock Files
```bash
# Generate requirements.txt with exact versions
uv pip freeze > requirements.txt

# Generate development requirements
uv pip freeze | grep -E "(pytest|black|mypy)" > requirements-dev.txt

# Alternative: use pip-tools for more control
pip install pip-tools
pip-compile pyproject.toml
pip-compile pyproject.toml --extra dev -o requirements-dev.txt
```

### Lock File Management
```toml
# pyproject.toml - for dependency specification
[project]
dependencies = [
    "fastapi>=0.104.0,<1.0.0",
]

# requirements.txt - for exact deployment versions
# Generated with: uv pip freeze > requirements.txt
fastapi==0.104.1
starlette==0.27.0
pydantic==2.5.2
pydantic-core==2.14.5
```

## Package Distribution

### Building Packages
```bash
# Install build tools
uv pip install build twine

# Build package
python -m build

# Check package
twine check dist/*

# Upload to PyPI (production)
twine upload dist/*

# Upload to Test PyPI (testing)
twine upload --repository testpypi dist/*
```

### Package Metadata
```toml
[project]
name = "my-package"
version = "1.0.0"
description = "A short description"
readme = "README.md"
license = {file = "LICENSE"}
authors = [
    {name = "Your Name", email = "your.email@example.com"}
]
keywords = ["api", "web", "framework"]
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]
```

## Troubleshooting Common Issues

### Dependency Conflicts
```bash
# Check for conflicts
uv pip check

# Resolve conflicts by updating pyproject.toml
# Use more specific version ranges

# Clear cache if needed
uv cache clean
pip cache purge
```

### Environment Issues
```bash
# Recreate virtual environment
rm -rf .venv
uv venv
source .venv/bin/activate
uv pip install -e ".[dev]"

# Verify installation
python -c "import my_project; print('OK')"
```

### Performance Optimization
```bash
# Use uv for faster installations
uv pip install -r requirements.txt

# Cache wheels for repeated installs
pip install --cache-dir ~/.cache/pip -r requirements.txt

# Use --no-deps for controlled installations
pip install --no-deps -r requirements.txt
```

## Validation

### Dependency Management Checklist
- [ ] pyproject.toml contains all project metadata
- [ ] Dependencies use appropriate version constraints
- [ ] Development dependencies are separated from production
- [ ] Security scanning is integrated into CI/CD
- [ ] Lock files are generated and committed
- [ ] Virtual environments are used consistently
- [ ] Package installation is reproducible
- [ ] Dependency updates are tested before deployment

### CI/CD Integration
```yaml
# GitHub Actions example
name: Dependencies
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install uv
        run: pip install uv

      - name: Install dependencies
        run: uv pip install -e ".[dev]"

      - name: Security scan
        run: |
          uv pip install safety
          safety check
```

## Examples

### Complete Development Setup
```bash
# Clone repository
git clone https://github.com/user/project.git
cd project

# Create virtual environment
uv venv
source .venv/bin/activate

# Install development dependencies
uv pip install -e ".[dev,test]"

# Set up pre-commit hooks
pre-commit install

# Verify installation
pytest
black --check src/
mypy src/
```

### Production Deployment
```bash
# In production environment
python -m venv /opt/app/.venv
source /opt/app/.venv/bin/activate

# Install exact versions
pip install -r requirements.txt --no-deps

# Verify critical imports
python -c "
import fastapi
import sqlalchemy
print('All critical dependencies loaded successfully')
"
```

These dependency management standards ensure reproducible, secure, and maintainable Python environments across all development and deployment scenarios.