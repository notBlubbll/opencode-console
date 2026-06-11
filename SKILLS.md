# Skills

## API Analysis

When analyzing a frontend SPA to build a mock backend:

1. **Fetch all JS chunks** — The main bundle and route-specific chunks
2. **Find route definitions** — Look for `.add(H("name","/path",{payload,success,error}))` patterns
3. **Find schema types** — Look for `extends y("TypeName")({field:schema,...})` to discover field requirements
4. **Check branded strings** — Schemas like `UserId`, `OrgId`, `Email` often use `Schema.startsWith()` or regex filters
5. **Trace the login flow** — HRD → password form → login mutation → session check

## Key Schema Patterns

- `Xe(prefix)` = `Schema.startsWith(prefix)` — strings must start with this prefix
- `Be()` = `Schema.nonEmpty()` — non-empty strings
- `A("Brand")` = `Schema.brand("Brand")` — branded types
- `l.check(filter)` = `Schema.string.pipe(Schema.filter(...))` — string with filter validation

## Inject Script Strategy

When the frontend uses Effect Schema with strict parsing:

1. Patch `window.fetch` **before** module scripts execute (inline script at end of `<body>`)
2. For `/auth/session`: always return `{expiresAt, user: {id, email}}` with `user_` prefixed ID
3. For login redirects: use server-side `302` with `Set-Cookie` for direct navigation
4. Include `Cache-Control: no-store` to prevent stale HTML caching
