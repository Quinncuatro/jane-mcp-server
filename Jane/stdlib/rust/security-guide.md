---
title: 'Rust Security Guide: Memory Safety and Exploit Mitigations'
description: >-
  Comprehensive guide to security features and best practices when writing
  secure Rust code
author: Claude Code
tags:
  - rust
  - security
  - memory-safety
  - exploit-mitigation
  - unsafe-code
createdAt: '2025-06-30T01:34:08.968Z'
updatedAt: '2025-06-30T01:34:08.968Z'
---
# Rust Security Guide: Memory Safety and Exploit Mitigations

## Table of Contents
1. [Introduction](#introduction)
2. [Memory Safety Fundamentals](#memory-safety-fundamentals)
3. [Exploit Mitigations](#exploit-mitigations)
4. [Control Flow Integrity (CFI)](#control-flow-integrity-cfi)
5. [TrustZone-M Security Features](#trustzone-m-security-features)
6. [Unsafe Code Guidelines](#unsafe-code-guidelines)
7. [Security Best Practices](#security-best-practices)
8. [Compiler Security Flags](#compiler-security-flags)

## Introduction

Rust provides memory safety guarantees through its ownership system, but when writing systems code or interfacing with external libraries, developers often need to use `unsafe` code. This guide covers Rust's security features, exploit mitigations, and best practices for writing secure Rust applications.

## Memory Safety Fundamentals

### Ownership and Borrowing
Rust's ownership system prevents many common security vulnerabilities:
- **Use-after-free**: Prevented by ownership rules
- **Double-free**: Prevented by move semantics
- **Buffer overflows**: Prevented by bounds checking
- **Data races**: Prevented by the borrow checker

### Integer Overflow Protection

Rust provides integer overflow protection in debug builds:

```rust
fn main() {
    let mut u: u8 = 255;
    u += 1; // This will panic in debug builds
    println!("u: {}", u);
}
```

In release builds, integer overflow wraps around by default for performance. For security-critical applications, consider using:
- `checked_add()`, `checked_sub()`, etc. for explicit overflow handling
- `saturating_add()`, `saturating_sub()` for saturating arithmetic
- `wrapping_add()`, `wrapping_sub()` for explicit wrapping behavior

## Exploit Mitigations

### Position-Independent Executables (PIE)

Rust enables PIE by default, which enhances security through Address Space Layout Randomization (ASLR):

```bash
$ readelf -h target/release/hello-rust | grep Type:
  Type:                              DYN (Shared object file)
```

### Non-Executable Memory Regions

Rust ensures stack memory is non-executable:

```bash
$ readelf -l target/release/hello-rust | grep -A 1 GNU_STACK
  GNU_STACK      0x0000000000000000 0x0000000000000000 0x0000000000000000
                 0x0000000000000000 0x0000000000000000  RW     0x10
```

The `RW` flags (Read/Write without Execute) prevent code execution from the stack.

### Read-Only Relocations (RELRO)

Rust enables partial RELRO by default:

```bash
$ readelf -l target/release/hello-rust | grep GNU_RELRO
  GNU_RELRO      0x000000000002ee00 0x000000000002fe00 0x000000000002fe00
```

For full RELRO, check for immediate binding:

```bash
$ readelf -d target/release/hello-rust | grep BIND_NOW
 0x000000000000001e (FLAGS)              BIND_NOW
```

### Control Flow Guard (Windows)

Enable Control Flow Guard on Windows targets:

```bash
rustc -C control-flow-guard=y source.rs
```

Options:
- `y`, `yes`, `on`, `true`, `checks`: Enable Control Flow Guard
- `nochecks`: Emit metadata without runtime checks (testing only)
- `n`, `no`, `off`, `false`: Disable (default)

### Branch Protection (ARM)

For AArch64 targets, enable branch protection features:

```bash
rustc -Z branch-protection=bti,pac-ret,leaf source.rs
```

This enables:
- **BTI**: Branch Target Identification
- **pac-ret**: Pointer Authentication for return addresses
- **leaf**: Extend pointer authentication to leaf functions

## Control Flow Integrity (CFI)

### What is CFI?

Control Flow Integrity prevents control flow hijacking attacks by ensuring indirect calls only target valid destinations.

### Enabling CFI

Enable CFI with the sanitizer flag:

```bash
RUSTFLAGS="-C target-cpu=native -C link-arg=-fuse-ld=lld -Z sanitizer=cfi -Z sanitizer-cfi-normalize-integers" cargo build --release --target x86_64-unknown-linux-gnu
```

### CFI Example: Preventing Type Confusion

```rust
use std::mem;

fn add_one(x: i32) -> i32 {
    x + 1
}

fn add_two(x: i64) -> i64 {
    x + 2
}

fn do_twice(f: fn(i32) -> i32, arg: i32) -> i32 {
    f(arg) + f(arg)
}

fn main() {
    let answer = do_twice(add_one, 5);
    println!("The answer is: {}", answer);

    // This will be caught by CFI
    let f: fn(i32) -> i32 = 
        unsafe { mem::transmute::<*const u8, fn(i32) -> i32>(add_two as *const u8) };
    let next_answer = do_twice(f, 5); // CFI will terminate here
    println!("The next answer is: {}", next_answer);
}
```

Without CFI, this code would execute the type-confused function call. With CFI enabled, the program terminates when the invalid indirect call is detected.

## TrustZone-M Security Features

### Non-Secure Entry Functions

For ARM Cortex-M with TrustZone-M, define secure entry points:

```rust
#![no_std]
#![feature(cmse_nonsecure_entry)]

#[no_mangle]
pub extern "C-cmse-nonsecure-entry" fn entry_function(input: u32) -> u32 {
    input + 6
}
```

### Non-Secure Function Calls

Call non-secure functions from secure context:

```rust
#![no_std]
#![feature(abi_c_cmse_nonsecure_call)]

#[no_mangle]
pub fn call_nonsecure_function(addr: usize) -> u32 {
    let non_secure_function = 
        unsafe { core::mem::transmute::<usize, extern "C-cmse-nonsecure-call" fn() -> u32>(addr) };
    non_secure_function()
}
```

### ABI Constraints

The `C-cmse-nonsecure-call` ABI has strict constraints:
- Maximum 4 arguments fitting in registers
- Arguments must be register-sized
- Return value must fit in a single register

```rust
// This will cause an error - too many arguments
#[no_mangle]
pub fn test(
    f: extern "C-cmse-nonsecure-call" fn(u32, u32, u32, u32, u32) -> u32,
) -> u32 {
    f(1, 2, 3, 4, 5) // Error: exceeds 4 argument registers
}
```

## Unsafe Code Guidelines

### When to Use Unsafe

Use `unsafe` only when necessary:
- Raw pointer dereferencing
- Calling unsafe functions
- Accessing mutable static variables
- Implementing unsafe traits
- Accessing union fields

### Unsafe Code Patterns

```rust
fn main() {
    let x: *const usize;
    let u: Union;

    unsafe {
        // Unsafe operations
        let z = *x;              // Raw pointer dereference
        let field = u.field;     // Union field access
        MUT_GLOBAL.field;        // Mutable static access
        
        // Inline assembly
        core::arch::asm!(
            "push {base}",
            base = const 0
        );
    }
}
```

### Minimizing Unsafe Scope

Keep `unsafe` blocks as small as possible:

```rust
// Good: Minimal unsafe scope
fn read_ptr(ptr: *const u32) -> u32 {
    unsafe { *ptr }
}

// Bad: Unnecessary unsafe scope
fn read_ptr_bad(ptr: *const u32) -> u32 {
    unsafe {
        let value = *ptr;
        // ... lots of safe code
        value
    }
}
```

## Security Best Practices

### Input Validation

Always validate inputs, especially from external sources:

```rust
fn process_user_input(input: &str) -> Result<u32, &'static str> {
    let trimmed = input.trim();
    
    // Validate length
    if trimmed.len() > 10 {
        return Err("Input too long");
    }
    
    // Parse and validate range
    match trimmed.parse::<u32>() {
        Ok(num) if num <= 1000 => Ok(num),
        Ok(_) => Err("Number too large"),
        Err(_) => Err("Invalid number format"),
    }
}
```

### Secure Random Number Generation

Use cryptographically secure random number generation:

```rust
use rand::RngCore;
use rand::rngs::OsRng;

fn generate_secure_token() -> [u8; 32] {
    let mut token = [0u8; 32];
    OsRng.fill_bytes(&mut token);
    token
}
```

### Error Handling

Avoid exposing sensitive information in error messages:

```rust
pub enum AuthError {
    InvalidCredentials,
    AccountLocked,
    // Don't expose: UserNotFound, WrongPassword
}

fn authenticate(username: &str, password: &str) -> Result<User, AuthError> {
    match find_user(username) {
        Some(user) => {
            if verify_password(password, &user.password_hash) {
                Ok(user)
            } else {
                Err(AuthError::InvalidCredentials) // Generic error
            }
        }
        None => Err(AuthError::InvalidCredentials), // Same generic error
    }
}
```

### Dependency Management

Ensure dependencies are verified with hashes:

```toml
# Cargo.toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }

# In CI/production, use --locked to ensure reproducible builds
# cargo build --locked
```

## Compiler Security Flags

### Debug vs Release Builds

Security implications of build modes:

```bash
# Debug build (includes overflow checks, debug assertions)
cargo build

# Release build (optimized, no debug checks)
cargo build --release

# Custom profile with security features
# In Cargo.toml:
[profile.secure]
inherits = "release"
overflow-checks = true
debug-assertions = true
```

### Stripping Symbols

Control debug information for security:

```bash
# Strip debug info and symbols
rustc -C strip=symbols source.rs

# Options:
# - none: Keep all debug info
# - debuginfo: Strip debug info, keep symbols
# - symbols: Strip both debug info and symbols
```

### Thread Local Storage Models

Choose appropriate TLS model for your use case:

```bash
# List available TLS models
rustc --print tls-models

# Available models:
# - global-dynamic: Most flexible, higher overhead
# - local-dynamic: Optimized for libraries
# - initial-exec: Fast, limited to statically linked
# - local-exec: Fastest, main executable only
# - emulated: Fallback for unsupported targets
```

### Sanitizers

Enable various sanitizers for security testing:

```bash
# Address Sanitizer
RUSTFLAGS="-Z sanitizer=address" cargo build

# Memory Sanitizer
RUSTFLAGS="-Z sanitizer=memory" cargo build

# Control Flow Integrity
RUSTFLAGS="-Z sanitizer=cfi" cargo build

# HWAddress Sanitizer
RUSTFLAGS="-Z sanitizer=hwaddress" cargo build
```

## Testing Security

### Fuzzing

Use cargo-fuzz for security testing:

```bash
# Install cargo-fuzz
cargo install cargo-fuzz

# Initialize fuzzing
cargo fuzz init

# Run fuzzer
cargo fuzz run fuzz_target_1
```

### Static Analysis

Use Clippy with security-focused lints:

```bash
# Run Clippy with all lints
cargo clippy -- -W clippy::all

# Security-focused lints
cargo clippy -- -W clippy::suspicious
```

### Audit Dependencies

Regularly audit dependencies for security vulnerabilities:

```bash
# Install cargo-audit
cargo install cargo-audit

# Audit dependencies
cargo audit

# Generate security reports
cargo audit --json
```

## Conclusion

Rust provides strong security guarantees through its type system and ownership model, but developers must still be vigilant when writing unsafe code or designing security-critical systems. By following these guidelines and leveraging Rust's security features, you can build robust and secure applications.

Remember:
1. Minimize unsafe code and keep unsafe blocks small
2. Use Rust's built-in security features and compiler flags
3. Validate all inputs and handle errors securely
4. Regularly audit dependencies and test with sanitizers
5. Follow secure coding practices even in safe Rust code

For the most up-to-date security information, always refer to the official Rust documentation and security advisories.
