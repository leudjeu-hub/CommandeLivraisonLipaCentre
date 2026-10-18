---
description: GHIS - Create a route/page using framework data loading
agent: build
---

Create a new route/page.

First determine:

- route URL
- loader requirements
- clientLoader requirements
- server-only data
- client-only data
- authentication
- error handling

Prefer:

loader
→ route data
→ component

Use:

clientLoader
→ only when client-side loading is justified.

Avoid:

component
→ useEffect
→ fetch()