---
description:  GHIS - Perform a security review of the FastAPI application.
agent: plan 
---

# Security Review


Check:

## Authentication

- authentication implementation
- token handling
- password handling
- session handling

## Authorization

- missing authorization checks
- privilege escalation
- insecure object access

## Input

Check:

- SQL injection
- command injection
- path traversal
- unsafe file handling
- malicious input
- validation bypass

## API

Check:

- sensitive endpoints
- excessive data exposure
- insecure defaults
- CORS
- rate limiting where appropriate

## Secrets

Look for:

- passwords
- API keys
- tokens
- connection strings

Do not expose discovered secrets in the final response.

## Dependencies

Identify potentially risky or outdated dependencies if dependency information is available.

## Output

Provide:

Severity:
Location:
Risk:
Explanation:
Recommended mitigation:

Do not modify files.