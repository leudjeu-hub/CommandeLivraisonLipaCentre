---
description:  GHIS - Analyze the requested FastAPI functionality for performance problems.
agent: plan 
---



# Performance Review

Analyze the requested FastAPI functionality for performance problems.

Check:

## API

- unnecessary work
- excessive serialization
- large responses
- missing pagination
- inefficient dependencies

## Database

- N+1 queries
- missing indexes
- unnecessary queries
- inefficient joins
- unnecessary loading

## Python

- expensive loops
- repeated calculations
- unnecessary allocations
- inefficient data structures

## Async

Check for blocking:

- filesystem operations
- database calls
- HTTP requests
- CPU-heavy processing

## Files

Pay particular attention to large JSON files and repeated file parsing.

Do not optimize code without evidence.

For every optimization provide:

Problem:
Evidence:
Expected impact:
Recommended solution:

Do not modify files unless explicitly requested.