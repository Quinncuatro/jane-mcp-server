---
title: Go Test Example
description: A simple test document for the Go stdlib directory
tags:
  - test
  - example
  - go
createdAt: '2025-06-26T20:13:02.868Z'
updatedAt: '2025-06-26T20:13:02.868Z'
---
# Go Test Example

This is a test document for the Go standard library documentation.

## Quick Test Items

- **Package import**: `import "fmt"; fmt.Println("Hello, World!")`
- **Variable declaration**: `var name string = "Go"`
- **Slice**: `[]int{1, 2, 3, 4, 5}`
- **Map**: `map[string]int{"apple": 5, "banana": 3}`

## Common Patterns

```go
// Error handling
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("cannot divide by zero")
    }
    return a / b, nil
}

// Goroutine
go func() {
    fmt.Println("Running in goroutine")
}()
```

**Test confirmation**: If you can see this document, the Jane system is working correctly! 🐹
