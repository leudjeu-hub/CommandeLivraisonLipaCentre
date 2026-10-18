---
name: react-loaders
description: Rules for designing loader and clientLoader based data loading
---

# Loader Architecture

Use `loader` for data that can be loaded on the server.

Use `clientLoader` when data specifically requires browser/client capabilities
or when client-side loading is intentionally required by the route architecture.

## Decision rules

Use loader when:

- data comes from backend APIs
- authentication is server-side
- secrets or server credentials are required
- SEO/server rendering benefits from the data
- initial route data should be available before rendering

Use clientLoader when:

- browser APIs are required
- data depends on client-only state
- localStorage/sessionStorage is required
- the request intentionally happens in the browser
- the application explicitly uses client-side route loading

## Avoid

Do not fetch the same resource in both loader and clientLoader.

Do not move server data into clientLoader just because fetch()
is easier there.

Do not put authentication secrets into clientLoader.

Do not create useEffect-based fetching when route loading is more appropriate.

## Implementation checklist

For every route ask:

1. Where does the data originate?
2. Does the server need access to it?
3. Does the browser need access to it?
4. Is authentication involved?
5. Is SSR/initial rendering affected?
6. Can the data be loaded once?
7. What happens when loading fails?
8. What happens when the data is empty?