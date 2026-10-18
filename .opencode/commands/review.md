---
description: Perform a senior React code review
agent: plan
---

Review the selected code.

Check:

## Architecture
- component responsibilities
- data flow
- loader/clientLoader usage

## React
- hooks
- state
- effects
- rendering

## TypeScript
- type safety
- unnecessary any
- API types

## Performance
- renders
- requests
- waterfalls
- bundle impact

## Security
- sensitive data
- authentication
- XSS risks

## Testing
- missing important tests

Return:

1. Critical issues
2. Architectural issues
3. Maintainability issues
4. Performance issues
5. Testing gaps
6. Suggested changes