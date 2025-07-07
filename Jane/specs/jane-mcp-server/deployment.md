---
title: Jane MCP Server - Deployment Guide
description: >-
  Comprehensive deployment guide including Docker, production setup, and
  environment configuration
tags:
  - deployment
  - docker
  - production
  - containerization
  - configuration
createdAt: '2025-06-30T22:02:17.992Z'
updatedAt: '2025-06-30T22:02:17.992Z'
---
# Jane MCP Server - Deployment Guide

## Overview

This document provides comprehensive guidance for deploying the Jane MCP server in various environments, from local development to production containerized deployments.

## Deployment Options

### 1. Local Development Deployment
- Direct Node.js execution
- Suitable for development and testing
- Minimal setup requirements

### 2. Production Node.js Deployment
- Compiled TypeScript with production optimizations
- Process management with PM2 or systemd
- Environment-specific configuration

### 3. Docker Deployment
- Containerized for consistent environments
- Multi-stage build for optimization
- Volume mounting for persistent storage

### 4. Docker Compose Deployment
- Orchestrated container deployment
- Environment variable management
- Easy scaling and maintenance

## Local Development Deployment

### Prerequisites
- Node.js 18+
- npm 8+
- Git access to repository

### Setup
```bash
# Clone and setup
git clone <repository-url>
cd jane-mcp-server
npm install
npm run build

# Start server
npm start
```

### Development Mode
```bash
# Hot reload for development
npm run dev

# Custom document directory
JANE_DIR=/path/to/documents npm run dev
```

## Production Node.js Deployment

### Prerequisites
- Production server with Node.js 18+
- Process manager (PM2 recommended)
- Reverse proxy (nginx/Apache) if needed

### Build for Production
```bash
# Install dependencies (production only)
npm ci --only=production

# Build TypeScript
npm run build

# Verify build
node dist/index.js --help 2>/dev/null || echo "Server ready"
```

### Process Management with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name jane-mcp-server

# Configure auto-restart
pm2 startup
pm2 save
```

#### PM2 Configuration (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'jane-mcp-server',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      JANE_DIR: '/opt/jane/data'
    },
    error_file: '/var/log/jane/error.log',
    out_file: '/var/log/jane/out.log',
    log_file: '/var/log/jane/combined.log'
  }]
};
```

### Systemd Service
```ini
# /etc/systemd/system/jane-mcp-server.service
[Unit]
Description=Jane MCP Server
After=network.target

[Service]
Type=simple
User=jane
WorkingDirectory=/opt/jane-mcp-server
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=NODE_ENV=production
Environment=JANE_DIR=/opt/jane/data

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable jane-mcp-server
sudo systemctl start jane-mcp-server
sudo systemctl status jane-mcp-server
```

## Docker Deployment

### Single Container Deployment

#### Build Image
```bash
# Build production image
docker build -t jane-mcp-server:1.0.0 .

# Tag as latest
docker tag jane-mcp-server:1.0.0 jane-mcp-server:latest
```

#### Run Container
```bash
# Basic run
docker run -i jane-mcp-server:latest

# With persistent storage
docker run -i \
  -v /host/path/to/documents:/app/Jane \
  jane-mcp-server:latest

# With custom environment
docker run -i \
  -e JANE_DIR=/app/Jane \
  -v /host/jane-data:/app/Jane \
  jane-mcp-server:latest
```

### Docker Image Details

#### Multi-stage Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
RUN adduser -D jane
ENV NODE_ENV=production \
    JANE_DIR=/app/Jane
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
RUN mkdir -p ${JANE_DIR} && \
    chown -R jane:jane ${JANE_DIR}
USER jane
VOLUME ${JANE_DIR}
ENTRYPOINT ["node", "dist/index.js"]
```

#### Image Optimization
- **Multi-stage build**: Reduces final image size
- **Alpine Linux**: Minimal base image
- **Non-root user**: Security best practice
- **Production dependencies**: Only runtime dependencies included

## Docker Compose Deployment

### Basic Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  jane:
    build:
      context: .
      dockerfile: Dockerfile
    image: jane-mcp-server:1.0.0
    container_name: jane-mcp-server
    stdin_open: true
    tty: true
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - JANE_DIR=/app/Jane
    volumes:
      - ${JANE_DATA_DIR:-./data}:/app/Jane
    healthcheck:
      test: ["CMD", "node", "-e", "process.exit(0)"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
```

### Environment-specific Configurations

#### Development Override
```yaml
# docker-compose.override.yml
version: '3.8'

services:
  jane:
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    command: ["npm", "run", "dev"]
```

#### Production Configuration
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  jane:
    image: jane-mcp-server:1.0.0
    environment:
      - NODE_ENV=production
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Deployment Commands
```bash
# Development deployment
docker-compose up -d

# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Custom data directory
JANE_DATA_DIR=/opt/jane/data docker-compose up -d

# View logs
docker-compose logs -f jane

# Stop and cleanup
docker-compose down
```

## Environment Configuration

### Environment Variables

#### Core Configuration
- `NODE_ENV`: Environment mode (`development`|`production`)
- `JANE_DIR`: Absolute path for document storage
- `LOG_LEVEL`: Logging verbosity (`info`|`debug`|`warn`|`error`)

#### Example Configurations
```bash
# Development
export NODE_ENV=development
export JANE_DIR=$PWD/Jane
export LOG_LEVEL=debug

# Production
export NODE_ENV=production
export JANE_DIR=/opt/jane/documents
export LOG_LEVEL=info
```

### Configuration Files

#### .env File Support
```bash
# .env
NODE_ENV=production
JANE_DIR=/app/Jane
LOG_LEVEL=info
```

#### Production Configuration
```bash
# /etc/jane/config.env
NODE_ENV=production
JANE_DIR=/var/lib/jane/documents
LOG_LEVEL=warn
```

## Storage Configuration

### Document Storage Structure
```
Jane/
├── stdlib/          # Standard library documents
│   ├── javascript/
│   ├── typescript/
│   └── python/
└── specs/           # Specification documents
    ├── project1/
    └── project2/
```

### Storage Backend Options

#### Local File System
- **Path**: Configurable via `JANE_DIR`
- **Permissions**: Read/write access required
- **Backup**: Regular file system backups

#### Network File System (NFS)
```bash
# Mount NFS share
sudo mount -t nfs server:/path/to/jane /mnt/jane
export JANE_DIR=/mnt/jane
```

#### Docker Volume
```bash
# Create named volume
docker volume create jane-data

# Use in container
docker run -i -v jane-data:/app/Jane jane-mcp-server:latest
```

### Backup Strategy

#### File System Backup
```bash
# Simple backup
tar -czf jane-backup-$(date +%Y%m%d).tar.gz Jane/

# Rsync backup
rsync -av Jane/ backup-server:/backups/jane/
```

#### Docker Volume Backup
```bash
# Backup volume
docker run --rm -v jane-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/jane-backup.tar.gz /data

# Restore volume
docker run --rm -v jane-data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/jane-backup.tar.gz -C /
```

## Monitoring and Logging

### Health Checks

#### Docker Health Check
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "process.exit(0)"
```

#### Manual Health Check
```bash
# Test server responsiveness
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | \
  timeout 5s docker exec -i jane-mcp-server node dist/index.js
```

### Logging Configuration

#### Docker Logging
```yaml
services:
  jane:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"
```

#### Structured Logging
```bash
# View logs with timestamps
docker logs -t jane-mcp-server

# Follow logs
docker logs -f jane-mcp-server

# Filter logs by level
docker logs jane-mcp-server 2>&1 | grep ERROR
```

### Monitoring Metrics

#### Basic Monitoring
- **Container status**: Running/stopped
- **Memory usage**: Monitor for memory leaks
- **Disk usage**: Jane directory growth
- **Response time**: MCP request latency

#### Advanced Monitoring
```bash
# Container resource usage
docker stats jane-mcp-server

# System resource usage
docker exec jane-mcp-server ps aux
docker exec jane-mcp-server df -h
```

## Security Considerations

### Container Security

#### Non-root Execution
```dockerfile
RUN adduser -D jane
USER jane
```

#### Read-only File System
```bash
docker run -i --read-only \
  -v /host/jane-data:/app/Jane \
  jane-mcp-server:latest
```

#### Resource Limits
```yaml
services:
  jane:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### Network Security

#### Firewall Configuration
```bash
# Allow only specific ports (if needed)
sudo ufw allow from 192.168.1.0/24 to any port 3000
```

#### Container Network Isolation
```yaml
services:
  jane:
    networks:
      - jane-network

networks:
  jane-network:
    driver: bridge
    internal: true
```

## Troubleshooting

### Common Deployment Issues

#### 1. Container Won't Start
```bash
# Check logs
docker logs jane-mcp-server

# Inspect container
docker inspect jane-mcp-server

# Test image manually
docker run -it jane-mcp-server:latest sh
```

#### 2. Permission Issues
```bash
# Fix Jane directory permissions
sudo chown -R 1000:1000 /host/jane-data

# Check container user
docker exec jane-mcp-server id
```

#### 3. Volume Mount Issues
```bash
# Verify volume mount
docker exec jane-mcp-server ls -la /app/Jane

# Check host directory
ls -la /host/jane-data
```

#### 4. Memory Issues
```bash
# Check memory usage
docker stats --no-stream jane-mcp-server

# Adjust memory limits
docker update --memory=1g jane-mcp-server
```

### Diagnostic Commands

#### Container Diagnostics
```bash
# Container environment
docker exec jane-mcp-server env

# Container processes
docker exec jane-mcp-server ps aux

# Network connectivity
docker exec jane-mcp-server ping -c 3 google.com
```

#### Jane Server Diagnostics
```bash
# Run internal diagnostics
docker exec jane-mcp-server node -e "
  console.log('Node version:', process.version);
  console.log('Platform:', process.platform);
  console.log('Memory usage:', process.memoryUsage());
"
```

## Performance Optimization

### Container Performance
- **Use Alpine Linux**: Smaller image size
- **Multi-stage builds**: Reduce final image size
- **Layer caching**: Optimize Dockerfile for build speed

### Runtime Performance
- **Memory limits**: Prevent OOM kills
- **CPU limits**: Ensure fair resource sharing
- **Volume performance**: Use local storage for best I/O

### Scaling Considerations
- **Horizontal scaling**: Multiple container instances
- **Load balancing**: Distribute MCP client connections
- **Shared storage**: NFS or cloud storage for document sharing
