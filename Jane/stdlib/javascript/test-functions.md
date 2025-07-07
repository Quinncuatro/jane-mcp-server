---
title: Untitled Document
description: Updated examples of JavaScript functions including async patterns
tags:
  - test
  - functions
  - examples
  - async
createdAt: '2025-06-30T12:53:15.741Z'
updatedAt: '2025-06-30T12:53:24.299Z'
---
# JavaScript Function Examples

This document contains examples of JavaScript functions for testing purposes.

## Arrow Functions

```javascript
const add = (a, b) => a + b;
const multiply = (x, y) => x * y;
const divide = (a, b) => b !== 0 ? a / b : null;
```

## Regular Functions

```javascript
function greet(name) {
    return `Hello, ${name}!`;
}

function calculateArea(radius) {
    return Math.PI * radius * radius;
}

function factorial(n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
```

## Higher-Order Functions

```javascript
function createMultiplier(factor) {
    return function(number) {
        return number * factor;
    };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);
```

## Async Functions

```javascript
async function fetchData(url) {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}
```
