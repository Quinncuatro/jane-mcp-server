---
title: Test API Specification
description: Test API specification for Jane tools testing
author: Claude
tags:
  - api
  - specification
  - test
createdAt: '2025-06-30T12:53:37.415Z'
updatedAt: '2025-06-30T12:53:37.415Z'
---
# Test API Specification

This document defines the test API endpoints and their behavior.

## Authentication

All API requests require authentication via Bearer token in the Authorization header.

```
Authorization: Bearer <token>
```

## Endpoints

### GET /api/test
Returns a simple test response.

**Response:**
```json
{
    "status": "ok",
    "timestamp": "2025-06-30T12:00:00Z"
}
```

### POST /api/test/data
Accepts test data and returns validation results.

**Request Body:**
```json
{
    "name": "string",
    "value": "number",
    "active": "boolean"
}
```

**Response:**
```json
{
    "valid": true,
    "id": "generated-uuid",
    "created_at": "2025-06-30T12:00:00Z"
}
```

## Error Handling

All errors follow this format:
```json
{
    "error": "error_code",
    "message": "Human readable error message",
    "details": {}
}
```
