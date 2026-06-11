# Agents

## Mock Server Agent

An agent that sets up a local mock of the OpenCode Console:

1. Creates an Express server that proxies frontend assets and mocks API endpoints
2. Analyzes the frontend JS bundles to extract exact Effect Schema requirements
3. Injects client-side scripts to force correct response formats when needed

## Key learnings from this project:

### The "Invalid credentials" bug
The error `"Invalid credentials"` appears client-side when the **session/response schema parsing fails**. The Effect Schema parser silently fails when:
- User ID doesn't start with `user_` (required by `Schema.startsWith("user_")`)
- Org ID doesn't start with `org_`
- Email doesn't match email regex
- Response has extra fields not in the schema

The error propagates as: session parse fail → SPA thinks unauthenticated → redirect to `/login` → login mutation also fails → catch handler defaults to `"Invalid credentials"`.

### The "Failed to load organizations" bug
The org select page calls `s.query("me","orgs",...)` which maps to `GET /api/orgs` and expects `ue(OrgView)` — an array of `OrgView` objects.

Each `OrgView` requires `_tag: "OrgView"` (tagged struct from `y("OrgView")`), plus all fields from `JS = {id: OrgId, name: OrgName, managedProvidersOnly: boolean}` and `role: $r`.

### Response intercept strategy
1. `window.fetch` wrapper — patches `.json()`/`.text()` on individual Response instances
2. `Response.prototype.json` — intercepts ALL `.json()` calls regardless of how fetch was called
3. `Response.prototype.text` — intercepts ALL `.text()` calls for HTTP clients that use text parsing

The prototype-level patches (`Response.prototype.json`/`.text`) are the most reliable because they work even when the HTTP client captures a reference to `fetch` internally, as Effect HTTP does.

### To add new API mocks
1. Find the route definition in the JS bundle (search for `.add(H(...)` or `.add(L(...)`)
2. Find the success/error schemas (search for `class X extends y(...)`)
3. Match the response fields and branded types exactly
4. Required: `_tag` field matching the tagged type name (e.g., `"OrgView"`, `"OrgContextView"`)
5. Required: branded string prefixes (`user_` for UserId, `org_` for OrgId)
