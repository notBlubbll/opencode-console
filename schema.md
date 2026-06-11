# OpenCode Console — Effect Schema Reference

All API responses are parsed through **Effect Schema**. Every field must match exactly or the frontend silently discards the response (treated as unauthenticated/error).

## Branded String Types

Each branded type is a string with a required prefix or specific validation.

| Type | Symbol | Constraint | Example |
|------|--------|------------|---------|
| `UserId` | `Ce` | `startsWith("user_")` + `nonEmpty()` | `user_k8x7m3abc123def` |
| `OrgId` | `Re` | `startsWith("org_")` | `org_abc123def` |
| `SessionId` | `Dv` | `startsWith("sess_")` | `sess_abc123` |
| `ShareId` | `Lf` | `startsWith("share_")` | `share_xyz789` |
| `ShareItemId` | — | non-negative integer branded | `0`, `1`, `2`… |
| `ShareSecret` | `Bf` | UUID branded | `550e8400-e29b-41d4-a716-446655440000` |
| `Email` | `qe` | regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | `admin@demo.local` |
| `OrgName` | `bi` | non-empty string branded | `Demo` |
| `ConnectionId` | `Fs` | `startsWith("conn_")` | `conn_abc123` |
| `DisplayName` | `Ls` | non-empty string branded | `My Provider` |
| `ServiceAccountId` | `ln` | `startsWith("svcacct_")` | `svcacct_demo001` |
| `ServiceApiKeyId` | `bf` | `startsWith("sak_")` | `sak_k01` |
| `Role` | `$r` | enum branded (`owner`, `admin`, `member`, `viewer`) | `admin` |
| `ModelId` | `Yt` | string branded | `gpt-4o` |
| `ProviderId` | `ki` | enum literal (`"openai"`, `"anthropic"`, `"google"`, `"opencode"`) | `openai` |

## Tagged Struct Schemas

Every tagged struct **must** include a `_tag` field with the exact string literal shown.

### Authentication

**`Session`** — returned by `/auth/session`, `/auth/login`, `/auth/register`, `/auth/refresh`
```ts
{
  _tag?: undefined   // no _tag on session
  expiresAt: string  // ISO 8601 date
  user: {
    id: string       // must start with "user_"
    email: string    // must match email regex
  }
}
```

### Organization

**`OrgView`** — returned by `GET /api/orgs`, `GET /api/me/orgs`
```ts
{
  _tag: "OrgView",
  id: string,                    // must start with "org_"
  name: string,                  // OrgName branded
  managedProvidersOnly: boolean,
  role: string                   // Role branded: "admin" | "member" | "viewer"
}
```

**`OrgContextView`** — returned by `GET /api/orgs/current`
```ts
{
  _tag: "OrgContextView",
  userId: string,                // must start with "user_"
  org: {
    id: string,                  // must start with "org_"
    name: string,                // OrgName branded
    managedProvidersOnly: boolean
  },
  role: string,                  // Role branded
  singleOrgMode?: boolean        // optional
}
```

**`Org`**
```ts
{ _tag: "Org", id: string, name: string, managedProvidersOnly: boolean }
```

### User / Member

**`Member`** — returned by `GET /api/members`
```ts
{
  _tag: "Member",
  userId: string,                // starts with "user_"
  email: string,                 // Email branded
  name?: string | null,          // optional nullable
  role: string,                  // Role branded ("owner" | "admin" | "member" | "viewer")
  createdAt: string              // ISO 8601
}
```

**`UserSelf`**
```ts
{
  _tag: "UserSelf",
  id: string,                    // starts with "user_"
  email: string,                 // Email branded
  role: string                   // Role branded
}
```

### Auth Status

**`AuthStatus`** — returned by `GET /api/setup/status`
```ts
{
  _tag: "AuthStatus",
  emailPassword: boolean,
  oidc: boolean,
  oidcProvider: string,
  oidcLabel: string,
  oidcCallbackPath: string,
  socialProviders: SocialAuthProvider[],
  signup: "invite" | "domain" | "invite+domain" | "locked",
  inviteCount: number,
  domainCount: number,
  signupAllowedDomainsConfigured: boolean,
  signupAllowedDomainCount: number,
  setupMode: boolean
}
```

**`SocialAuthProvider`**
```ts
{ _tag: "SocialAuthProvider", provider: string, label: string }
```

### Connections

**`Connection`** — returned by list/detail (redacted credentials)
```ts
{
  _tag: "Connection",
  id: string,                    // starts with "conn_"
  displayName: string,           // DisplayName branded
  config: RedactedProviderConfig,// provider-specific config (no secrets, redacted)
  credentialHint: string,        // ConnectionCredentialHint branded ("****" or "abc...xyz")
  updatedAt: string              // ISO 8601
}
```

#### RedactedProviderConfig (tagged union via `_tag`)

| `_tag` | Fields |
|--------|--------|
| `"openai"` | `enabledModels: string[]` |
| `"anthropic"` | `enabledModels: string[]` |
| `"google"` | `enabledModels: string[]` |
| `"azure"` | `enabledModels: string[]`, `resourceName: string`, `deploymentMap: Record<string,string>`, `apiVersion: string` |
| `"bedrock"` | `accessKeyId: string`, `region: string` |
| `"vertex"` | `projectId: string`, `region: string` |
| `"custom"` | `enabledModels: string[]`, `providerSchema: object`, `baseUrl: string`, `authMode: string`, `authHeaderName?: string` |

**`ConnectionRow`** — create/update response (full credentials)
```ts
{
  _tag: "ConnectionRow",
  id: string,                    // starts with "conn_"
  displayName: string,
  config: FullProviderConfig,    // provider-specific config WITH credentials
  credentialHint: string,
  updatedAt: string
}
```

**`ConnectionModelOption`**
```ts
{
  _tag: "ConnectionModelOption",
  id: string,                    // ModelId branded
  name: string,
  provider?: string              // optional ProviderId
}
```

**`ConnectionModelsResult`**
```ts
{ _tag: "ConnectionModelsResult", models: ConnectionModelOption[] }
```

**`ConnectionValidateResult`**
```ts
{
  _tag: "ConnectionValidateResult",
  ok: boolean,
  statusCode?: number,
  error?: string
}
```

**`ConnectionDeleteOk`**
```ts
{ _tag: "ConnectionDeleteOk", ok: true }
```

### Service Accounts

**`ServiceAccount`** — nested inside `ServiceAccountWithKeys`
```ts
{
  _tag: "ServiceAccount",
  id: string,                    // starts with "sa_"
  orgId: string,                 // starts with "org_"
  name: string,                  // ServiceAccountName branded
  createdByUserId?: string | null, // optional, starts with "user_"
  createdAt: string,             // ISO 8601
  updatedAt: string              // ISO 8601
}
```

**`ServiceAccountWithKeys`** — returned by list/detail endpoints
```ts
{
  _tag: "ServiceAccountWithKeys",
  account: ServiceAccount,        // NESTED ServiceAccount object (not flat)
  keys: ServiceApiKey[]           // array of API keys
}
```

**`ServiceApiKey`**
```ts
{
  _tag: "ServiceApiKey",
  id: string,                    // starts with "sak_"
  serviceAccountId: string,      // starts with "sa_"
  orgId: string,                 // starts with "org_"
  name: string,                  // ServiceApiKeyName branded
  tokenHint: string,             // TokenHint branded (e.g. "abc...")
  status: string,                // KeyStatus branded (e.g. "active", "revoked")
  expiresAt?: string | null,
  revokedAt?: string | null,
  lastUsedAt?: string | null,
  createdByUserId?: string | null,
  revokedByUserId?: string | null,
  createdAt: string,
  updatedAt: string
}
```

**`ServiceApiKeyCreateResult`**
```ts
{ _tag: "ServiceApiKeyCreateResult", key: string }
```

**`ServiceApiKeyRevokeOk`**
```ts
{ _tag: "ServiceApiKeyRevokeOk", ok: true }
```

### Shares

**`ShareCreateResult`**
```ts
{ _tag: "ShareCreateResult", id: string, secret: string, url: string }
```

**`ShareEmpty`**
```ts
{ _tag: "ShareEmpty" }
```

**`ShareListItem`**
```ts
{
  _tag: "ShareListItem",
  id: string,                    // starts with "share_"
  orgId: string,                 // starts with "org_"
  userId: string,                // starts with "user_"
  userEmail: string,             // Email branded
  sessionId: string,             // starts with "sess_"
  title?: string,                // optional, max 255 chars
  createdAt: string,
  updatedAt: string
}
```

**Share Content Types (tagged union via `type` field):**

`ShareSession` — `{ type: "session", data: { id, title?, version?, projectID?, directory?, time?, share? } }`
`ShareMessage` — `{ type: "message", data: { id, sessionID?, role?, time?, providerID?, modelID?, model?, parentID?, agent? } }`
`SharePart` — `{ type: "part", data: { id, messageID, sessionID?, text?, tool?, callID?, filename?, state? } }`
`ShareSessionDiff` — `{ type: "session_diff", data: SharePart[] }`
`ShareModel` — `{ type: "model", data: [...] }`

### SSO

**`OrgDomain`**
```ts
{
  _tag: "OrgDomain",
  id: string,
  domain: string,
  verified: boolean
}
```

**`SsoIssuerValidation`**
```ts
{ _tag: "SsoIssuerValidation", ok: boolean, error?: string }
```

**`SamlConfigValidation`**
```ts
{ _tag: "SamlConfigValidation", ok: boolean, error?: string }
```

**`SamlMetadataValidation`**
```ts
{ _tag: "SamlMetadataValidation", ok: boolean, error?: string }
```

**`SsoDeleteOk`**
```ts
{ _tag: "SsoDeleteOk", ok: true }
```

**`SetupOrgOk`**
```ts
{ _tag: "SetupOrgOk", ok: true }
```

**`MemberMutationOk`**
```ts
{ _tag: "MemberMutationOk", ok: true }
```

### OpenCode Config

**`OpenCodeConfigResponse`**
```ts
{
  _tag: "OpenCodeConfigResponse",
  config: {
    enterprise?: { url: string } | null,
    enabled_providers?: string[] | null,
    provider?: Record<string, OpenCodeProvider> | null
  }
}
```

### Health

**`HealthOk`**
```ts
{ status: "ok" }
```

**`ReadyOk`**
```ts
{ status: "ready" }
```

**`ReadyErr`**
```ts
{ status: "not_ready", error: string }   // HTTP 503
```

### Usage

**`UsageSummary`** — returned by `GET /api/usage/summary` and `GET /api/usage`
```ts
{
  _tag: "UsageSummary",               // REQUIRED — tagged struct
  totalRequests: string,              // bigint branded (RequestTotal)
  totalInputTokens: string,           // bigint branded
  totalOutputTokens: string,          // bigint branded
  totalCacheReadTokens: string,       // bigint branded
  totalCacheWrite5mTokens: string,    // bigint branded
  totalCacheWrite1hTokens: string,    // bigint branded
  totalCostMicroCents: string         // bigint branded (micro-cents)
}
```
All numeric fields are **strings** (Effect Schema bigint-backed branded types) because they represent large integer values that don't fit in JS `number`.

**`DailyCost`** — returned by `GET /api/usage/cost-by-day`
```ts
{
  _tag: "DailyCost",                  // REQUIRED — tagged struct
  date: string,                       // "YYYY-MM-DD"
  totalCostMicroCents: string,        // bigint
  totalTokens: string,                // bigint
  totalRequests: string               // bigint
}
```

**`ModelSummary`** — item for `GET /api/usage/models`
```ts
{
  _tag: "ModelSummary",               // REQUIRED — tagged struct
  model: string,                      // ModelId branded
  provider: string,                   // ProviderId branded
  totalRequests: string,
  totalInputTokens: string,
  totalOutputTokens: string,
  totalCacheReadTokens: string,
  totalCacheWrite5mTokens: string,
  totalCacheWrite1hTokens: string,
  totalCostMicroCents: string
}
```

**`UserUsageSummary`** — item for `GET /api/usage/users`
```ts
{
  _tag: "UserUsageSummary",           // REQUIRED — tagged struct
  userId: string | null,              // must be present (null for service accounts), starts with "user_"
  principalType: "user" | "service-account",
  serviceUserId: string | null,       // must be present (null for user principals), starts with "svcacct_"
  email: string | null,               // must be present (null for service accounts)
  name: string | null,                // must be present (null if unknown)
  totalRequests: string,
  totalInputTokens: string,
  totalOutputTokens: string,
  totalCacheReadTokens: string,
  totalCacheWrite5mTokens: string,
  totalCacheWrite1hTokens: string,
  totalCostMicroCents: string,
  lastActiveAt: string | null         // must be present (null if never active), ISO 8601
}
```

### Pagination

All offset-based paginated list endpoints wrap results in a standard envelope:

**`PaginatedResponse<T>`** — wrapper returned by `Pr(T)`:
```ts
{
  items: T[],                          // the actual items
  pageInfo: PageInfo                   // required
}
```

**`PageInfo`** — mandatory pagination metadata (tagged struct):
```ts
{
  _tag: "PageInfo",                    // REQUIRED — tagged struct discriminator
  page: number,                        // current page (positive integer, >= 1)
  pageSize: number,                    // items per page (positive integer, >= 1)
  total: number,                       // total items across all pages (positive number, >= 1)
  pageCount: number                    // total number of pages (positive number, >= 1)
}
```
All fields use Effect's `Positive` constraint meaning **minimum value is 1**, even when there are zero items.

**Cursor-based pagination** — used by `GET /api/usage/rows`:
```ts
{
  items: T[],                          // the actual items
  nextCursor?: string                  // optional cursor for next page
}
```

### Leaderboard

**`LeaderboardResponse`**
```ts
{
  _tag: "LeaderboardResponse",
  users: LeaderboardUser[],
  models: LeaderboardModel[]
}
```

**`LeaderboardUser`**
```ts
{
  _tag: "LeaderboardUser",
  userId: string,                // starts with "user_"
  email: string,
  name?: string | null,
  totalRequests: number,
  totalTokens: number,
  totalCostMicroCents: number,
  favoriteModel?: string | null,
  models: LeaderboardUserModel[]
}
```

**`LeaderboardModel`**
```ts
{
  _tag: "LeaderboardModel",
  model: string,
  provider: string,
  totalRequests: number,
  totalTokens: number,
  totalCostMicroCents: number,
  userCount: number
}
```

### Error Schemas (HTTP error responses)

| Schema | Fields | HTTP Status |
|--------|--------|-------------|
| `LoginFailed` | `{ message: string }` | 401 |
| `RegisterFailed` | `{ message: string }` | 400 |
| `LogoutFailed` | `{ message: string }` | 401 |
| `RefreshFailed` | `{ message: string }` | 401 |
| `SessionQueryFailed` | `{ message: string }` | 401 |
| `Unauthorized` | `{ message: string }` | 401 |
| `ConnectionNameConflict` | `{ displayName: string }` | 409 |
| `ShareNotFound` | `{ message: string }` | 404 |
| `ShareInvalidSecret` | `{ message: string }` | 403 |
| `ShareInvalidPayload` | `{ message: string }` | 400 |
| `DeviceTokenError` | `{ error: string, error_description: string }` | 400 |
| `ReadyErr` | `{ status: "not_ready", error: string }` | 503 |

All other errors follow `{ message: string }` with no explicit HTTP status override (defaults apply).

## Critical Rules

1. **Every tagged struct** must have a `_tag` field matching the schema class name (e.g., `"OrgView"`, `"Connection"`, `"LeaderboardResponse"`)
2. **Branded string prefixes** are mandatory — `user_`, `org_`, `sess_`, `conn_`, `svcacct_`, `sk_`, `share_`
3. **Email** must pass `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
4. **Extra fields** not in the schema cause silent parse failures — strip unknown fields from responses
5. **Boolean literals** — `ok: true` must be actual `true`, not a truthy value
6. **Dates** are ISO 8601 strings (e.g., `"2026-06-11T12:00:00.000Z"`)
7. **Pagination (offset-based)** — list endpoints using `Pr(T)` wrap results: `{ items: T[], pageInfo: PageInfo }`. `pageInfo` is **required** and must include `_tag: "PageInfo"`.
8. **Pagination (cursor-based)** — `GET /api/usage/rows` uses `vM(T)`: `{ items: T[], nextCursor?: string }`
9. **Optional fields** — use `?` / `undefined` / `null` appropriately; missing optional fields are fine
