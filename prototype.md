# OpenCode Console — API Prototype / Route Reference

All API endpoints (Effect HTTP routes) extracted from the JS bundles. Each entry shows the method, path, success response schema, and possible error schemas.

## Auth Routes (`/auth/*`)

| Method | Path | Success Schema | Error Schemas | Notes |
|--------|------|---------------|---------------|-------|
| `POST` | `/auth/register` | `Session` | `RegisterFailed` (400) | Creates account + returns session |
| `POST` | `/auth/login` | `Session` | `LoginFailed` (401) | Email/password login |
| `POST` | `/auth/logout` | `{ ok: true }` | `LogoutFailed` (401) | Destroys session |
| `POST` | `/auth/refresh` | `Session` | `RefreshFailed` (401) | Refreshes expired token |
| `GET` | `/auth/session` | `Session` | `SessionQueryFailed` (401) | Current session info |
| `GET` | `/auth/password-status` | `{ hasPassword: boolean }` | `SessionQueryFailed` (401) | Whether user has a password |
| `POST` | `/auth/device/code` | `{ device_code, user_code, verification_uri, expires_in, interval }` | `DeviceAuthFailed` (400) | Start device auth flow |
| `POST` | `/auth/device/token` | `{ access_token, refresh_token, token_type, expires_in }` | `DeviceTokenError` (400) | Poll for device auth token |
| `POST` | `/auth/device/approve` | `{ ok: true }` | `DeviceApproveFailed` (400) | Approve device auth |
| `POST` | `/auth/device/deny` | `{ ok: true }` | `DeviceApproveFailed` (400) | Deny device auth |
| `POST` | `/auth/send-verification-email` | `{ ok: true }` | `VerificationFailed` (400) | Send verification email |
| `POST` | `/auth/verify-email` | `{ ok: true }` | `VerificationFailed` (400) | Verify email with token |
| `GET` | `/auth/email-verified` | `{ verified: boolean }` | `SessionQueryFailed` (401) | Check email verification status |
| `POST` | `/auth/request-password-reset` | `{ ok: true }` | `VerificationFailed` (400) | Request password reset email |
| `POST` | `/auth/reset-password` | `{ ok: true }` | `VerificationFailed` (400) | Reset password with token |
| `POST` | `/auth/change-password` | `{ ok: true }` | `ChangePasswordFailed` (400) | Change password (authenticated) |

## OIDC Auth (`/auth/oidc/:providerId/*`)

| Method | Path | Success Schema | Notes |
|--------|------|---------------|-------|
| `GET` | `/auth/oidc/:providerId/start` | `Redirect` | Redirects to OIDC provider |
| `GET` | `/auth/oidc/:providerId/callback` | `Session` | OIDC callback handler |

## Social Auth (`/auth/social/:providerId/*`)

| Method | Path | Success Schema | Notes |
|--------|------|---------------|-------|
| `GET` | `/auth/social/:providerId/start` | `Redirect` | Redirects to social provider |
| `GET` | `/auth/social/:providerId/callback` | `Session` | Social auth callback |

## Organizations (`/api/orgs`)

| Method | Path | Success Schema | Error Schemas |
|--------|------|---------------|---------------|
| `GET` | `/api/orgs/current` | `OrgContextView` | `OrgRequired`, `SsoRequired` |
| `POST` | `/api/orgs/setup` | `SetupOrgOk` | — |
| `POST` | `/api/orgs/onboard` | `OrgView` | `OrgOnboardingAlreadyMemberError` |
| `PUT`  | `/api/orgs/settings` | `SetupOrgOk` | `OrgRequired` |
| `GET`  | `/api/me/orgs` | `OrgView[]` | — |

## Connections (`/api/connections`)

| Method | Path | Success Schema | Error Schemas |
|--------|------|---------------|---------------|
| `GET` | `/api/connections` | `PaginatedResponse<Connection>` | — |
| `POST` | `/api/connections/models` | `ConnectionModelsResult` | `ConnectionModelsCredentialRequired` (422), `ConnectionModelsDiscoveryFailed` (502) |
| `POST` | `/api/connections/validate` | `ConnectionValidateResult` | — |
| `POST` | `/api/connections` | `Connection` | `ConnectionNameConflict` (409) |
| `PATCH` | `/api/connections/:connectionId` | `Connection` | `ConnectionNameConflict` (409) |
| `DELETE` | `/api/connections/:connectionId` | `ConnectionDeleteOk` | — |

## Service Accounts (`/api/service-accounts`)

| Method | Path | Success Schema | Error Schemas |
|--------|------|---------------|---------------|
| `GET` | `/api/service-accounts` | `PaginatedResponse<ServiceAccountWithKeys>` | — |
| `GET` | `/api/service-accounts/:serviceAccountId` | `ServiceAccountWithKeys` | — |
| `POST` | `/api/service-accounts` | `ServiceAccount` | `ServiceAccountNameConflict` |
| `POST` | `/api/service-accounts/:serviceAccountId/keys` | `ServiceApiKeyCreateResult` | — |
| `POST` | `/api/service-accounts/keys/:serviceApiKeyId/revoke` | `ServiceApiKeyRevokeOk` | — |
| `DELETE` | `/api/service-accounts/:serviceAccountId` | `true` | — |

ServiceAccountWithKeys structure:
```ts
{
  _tag: "ServiceAccountWithKeys",
  account: ServiceAccount,   // NESTED object: { _tag:"ServiceAccount", id:"sa_...", orgId, name, ... }
  keys: ServiceApiKey[]      // array of { _tag:"ServiceApiKey", id:"sak_...", name, tokenHint, status, ... }
}
```

## Members (`/api/members`)

| Method | Path | Success Schema | Error Schemas |
|--------|------|---------------|---------------|
| `GET` | `/api/members` | `PaginatedResponse<Member>` | `Member` includes `_tag:"Member"`, `userId`, `email`, `name?`, `role`, `createdAt` |
| `GET` | `/api/members/:userId` | `Member` | — |
| `POST` | `/api/members/invite` | `MemberMutationOk` | `InviteMemberAlreadyExistsError` |
| `PATCH` | `/api/members/:userId/role` | `MemberMutationOk` | `MemberNotFoundError`, `LastOwnerRoleChangeError` |
| `DELETE` | `/api/members/:userId` | `MemberMutationOk` | `MemberNotFoundError`, `CannotRemoveSelfError`, `LastOwnerRemovalError` |

## SSO (`/api/sso`)

| Method | Path | Success Schema | Error Schemas |
|--------|------|---------------|---------------|
| `GET` | `/api/sso` | `SsoConnection` (OIDC or SAML) | — |
| `POST` | `/api/sso` | `SsoConnection` | — |
| `PATCH` | `/api/sso` | `SsoConnection` | — |
| `DELETE` | `/api/sso` | `SsoDeleteOk` | — |
| `GET` | `/api/sso/saml-draft` | `SamlConnectionDraft` | — |
| `POST` | `/api/sso/saml-draft` | `SamlConnectionDraft` | — |
| `POST` | `/api/sso/saml-draft/activate` | `SsoConnection` | `OrgDomainConflict` |
| `DELETE` | `/api/sso/saml-draft` | `SsoDeleteOk` | — |
| `GET` | `/api/sso/domains` | `OrgDomain[]` | — |
| `POST` | `/api/sso/domains` | `OrgDomain` | `OrgDomainConflict` |
| `DELETE` | `/api/sso/domains/:domainId` | `SsoDeleteOk` | — |
| `POST` | `/api/sso/domains/:domainId/verify` | `OrgDomain` | `OrgDomainVerificationFailed` |
| `POST` | `/api/sso/validate-issuer` | `SsoIssuerValidation` | — |
| `POST` | `/api/sso/validate-saml-config` | `SamlConfigValidation` | — |
| `POST` | `/api/sso/validate-saml-metadata` | `SamlMetadataValidation` | — |

## SSO Discovery (`/api/sso`)

| Method | Path | Success Schema | Notes |
|--------|------|---------------|-------|
| `GET` | `/api/sso/discover` | `SsoDiscovery` | SSO discovery info |
| `GET` | `/api/sso/hrd` | `HrdDiscovery` | Home Realm Discovery — returns `null` if no SSO required |

## Shares (`/api/shares`)

| Method | Path | Success Schema | Error Schemas |
|--------|------|---------------|---------------|
| `POST` | `/api/shares` | `ShareCreateResult` | — |
| `POST` | `/api/shares/:shareId/sync` | `ShareEmpty` | `ShareNotFound` (404), `ShareInvalidSecret` (403), `ShareInvalidPayload` (400) |
| `GET` | `/api/shares/admin` | `PaginatedResponse<ShareListItem>` | — |
| `GET` | `/api/shares/me` | `PaginatedResponse<ShareListItem>` | — |
| `GET` | `/api/shares/:shareId/data` | `ShareContent[]` (tagged union) | `ShareNotFound` (404) |
| `DELETE` | `/api/shares/:shareId` | `ShareEmpty` | `ShareNotFound` (404), `ShareInvalidSecret` (403) |

## Usage (`/api/usage`)

| Method | Path | Success Schema | Notes |
|--------|------|---------------|-------|
| `GET` | `/api/usage/summary` | `UsageSummary` | Aggregate usage data |
| `GET` | `/api/usage/cost-by-day` | `DailyCost[]` | Per-day cost breakdown |
| `GET` | `/api/usage/models` | `PaginatedResponse<ModelSummary>` | Per-model usage |
| `GET` | `/api/usage/users` | `PaginatedResponse<UserUsageSummary>` | Per-user usage |
| `GET` | `/api/usage/rows` | `CursorPaginatedResponse<UsageSelect>` | Detailed usage rows (cursor-based) |

## User Self

| Method | Path | Success Schema | Notes |
|--------|------|---------------|-------|
| `GET` | `/api/user` | `UserSelf` | Current user profile info |

## Budgets (`/api/budgets`)

| Method | Path | Success Schema | Notes |
|--------|------|---------------|-------|
| `GET` | `/api/budgets/org` | `OrgBudget` (optional) | Org-level budget |
| `PUT` | `/api/budgets/org` | `OrgBudget` | Set org budget |
| `DELETE` | `/api/budgets/org` | `true` | Remove org budget |
| `GET` | `/api/budgets/users/status` | `UserBudgetStatus[]` | All user budget statuses |
| `GET` | `/api/budgets/users/default` | `UserBudgetDefault` (optional) | Default user budget |
| `PUT` | `/api/budgets/users/default` | `UserBudgetDefault` | Set default user budget |
| `DELETE` | `/api/budgets/users/default` | `true` | Remove default user budget |
| `GET` | `/api/budgets/users/:userId` | `UserBudget` (optional) | Specific user budget |
| `PUT` | `/api/budgets/users/:userId` | `UserBudget` | Set user budget |
| `DELETE` | `/api/budgets/users/:userId` | `true` | Remove user budget |
| `GET` | `/api/budgets/service-accounts/:serviceAccountId` | `ServiceAccountBudget` (optional) | SA budget |
| `PUT` | `/api/budgets/service-accounts/:serviceAccountId` | `ServiceAccountBudget` | Set SA budget |

## Config

| Method | Path | Success Schema | Notes |
|--------|------|---------------|-------|
| `GET` | `/api/config` | `OpenCodeConfigResponse` | Enterprise config. Response must include `_tag:"OpenCodeConfigResponse"`. Fields: `config.enterprise` (nullable object with `url`), `config.enabled_providers` (nullable string[]), `config.provider` (nullable Record<string, OpenCodeProvider>). |

## Setup

| Method | Path | Success Schema | Notes |
|--------|------|---------------|-------|
| `GET` | `/api/setup/status` | `AuthStatus` | Auth method availability, signup mode |

## Leaderboard

| Method | Path | Success Schema | Error Schemas |
|--------|------|---------------|---------------|
| `GET` | `/api/leaderboard` | `LeaderboardResponse` | — |

## Health

| Method | Path | Success Schema | Error Schemas |
|--------|------|---------------|---------------|
| `GET` | `/health` | `{ status: "ok" }` | — |
| `GET` | `/ready` | `{ status: "ready" }` | `{ status: "not_ready", error: string }` (503) |

## Pagination Wrapper

List endpoints wrap results in a paginated envelope. Two variants exist:

### Offset-based (`Pr(T)`)

```ts
{
  items: T[],                    // the actual items (field name is "items", NOT "data")
  pageInfo: {                    // REQUIRED
    _tag: "PageInfo",            // tagged struct discriminator
    page: number,                // current page index (>= 0)
    pageSize: number,            // items per page (>= 0)
    total: number,               // total item count (>= 0)
    pageCount: number            // total page count (>= 0)
  }
}
```

Used by: `/api/connections`, `/api/members`, `/api/service-accounts`, `/api/shares/me`, `/api/shares/admin`, `/api/usage/models`, `/api/usage/users`

### Cursor-based (`vM(T)`)

```ts
{
  items: T[],                    // the actual items
  nextCursor?: string            // optional cursor for next page
}
```

Used by: `/api/usage/rows`

### Query Parameters

Paginated list endpoints accept optional query params:

```ts
{
  page?: number,      // default varies
  pageSize?: number   // default 20, min 1, max 100
}
```

## Common Error Response Shape

```ts
{
  message: string    // human-readable error description
}
```

Unless overridden (see error schema table), errors return HTTP 4xx/5xx with this body shape.

## Notes

- All `:paramId` path params correspond to branded IDs with their respective prefixes
- Paginated endpoints accept `?page=0&pageSize=20` query params (defaults may vary)
- `POST`/`PATCH`/`PUT` endpoints accept JSON bodies matching their corresponding `Create`/`Update`/`Set` schemas
- The `/auth/session` endpoint is called on every page load — it must respond quickly and correctly
- All numeric bigint fields (`totalRequests`, `totalCostMicroCents`, `totalTokens`, etc.) must be **strings**, not numbers, because Effect Schema uses bigint-backed branded types
