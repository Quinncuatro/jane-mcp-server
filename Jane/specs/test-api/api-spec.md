---
title: Test API Specification
description: A simple test specification document for API development
tags:
  - test
  - api
  - specification
createdAt: '2025-06-26T20:11:10.709Z'
updatedAt: '2025-06-26T20:11:10.709Z'
---
# Test API Specification

This is a test specification document for API development.

## Overview

A simple REST API for managing user data with basic CRUD operations.

## Endpoints

**GET /users**
- Returns list of all users
- Response: `200 OK` with JSON array

**POST /users**
- Creates a new user
- Body: `{"name": "string", "email": "string"}`
- Response: `201 Created` with user object

**GET /users/{id}**
- Returns specific user by ID
- Response: `200 OK` with user object or `404 Not Found`

## Data Models

```json
{
  "id": "integer",
  "name": "string", 
  "email": "string",
  "created_at": "ISO 8601 timestamp"
}
```

**Test confirmation**: If you can see this spec, the Jane system is working correctly! 📋
