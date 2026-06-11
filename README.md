# OpenCode Console Mock Server

A local mock server for the [OpenCode Console](https://console.opencode.ai) that serves the real frontend assets while emulating all backend API endpoints.

<img width="1041" height="907" alt="image" src="https://github.com/user-attachments/assets/254063a0-1016-4778-acc4-82ceb6bb41f1" />

## Quick Start

```bash
start.cmd
```

Or manually:

```bash
npm install
node server.js
```

Open `http://localhost:3030` in your browser — you'll be automatically logged in.

## How It Works

- **Frontend**: SPA assets (HTML, JS, CSS) are fetched from `console.opencode.ai` and cached locally
- **Backend**: All `/auth/*` and `/api/*` endpoints are mocked with fake responses
- **Auth**: Session always returns authenticated — no login form needed
- **Client patch**: A script injected into the HTML forces `/auth/session` responses to match the exact Effect schema format the frontend expects

## Schema Requirements (critical!)

The frontend uses Effect Schema to parse API responses. Field formats must match exactly:

| Field | Schema | Required format |
|-------|--------|----------------|
| `user.id` | `UserId` | Must start with `user_` (e.g. `user_k8x7m3...`) |
| `org.id` | `OrgId` | Must start with `org_` (e.g. `org_abc123...`) |
| `user.email` | `Email` | Valid email matching `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |

If schemas don't match, the frontend silently treats the user as unauthenticated.

## Custom API Routes

Edit `routes.json` to craft custom responses:

```json
{
  "routes": [
    {
      "method": "GET",
      "path": "/api/usage",
      "status": 200,
      "response": { "totalTokens": 5000000, "totalCost": 99.99, ... }
    }
  ]
}
```

Routes are matched against `new RegExp(r.path)` so regex patterns work.

## Endpoints Mocked

- `/auth/login`, `/auth/register`, `/auth/session`, `/auth/logout`, `/auth/refresh`
- `/api/sso/hrd`, `/api/sso/discover`
- `/api/setup/status`, `/api/config`, `/api/orgs/current`
- `/api/members`, `/api/service-accounts`, `/api/connections`, `/api/shares`
- `/api/leaderboard`, `/api/usage`
