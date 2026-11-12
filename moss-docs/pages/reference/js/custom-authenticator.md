<!-- Source: https://docs.moss.dev/docs/reference/js/custom-authenticator.md -->
# Custom Authenticator (JS)

> Authenticate browser/frontend clients (`@moss-dev/moss-web`) without shipping your projectKey.

By default, `MossClient` authenticates using your `projectId` and `projectKey`:

```ts theme={null}
import { MossClient } from '@moss-js/moss';

const client = new MossClient('your-project-id', 'your-project-key');
```

This works well for **server-side** code where secrets stay on the backend. For **browser / frontend** use, you should never embed your `projectKey` in client-side code. Instead, implement a custom `IAuthenticator` that fetches a short-lived token from your own backend.

## The `IAuthenticator` interface

Both `@moss-js/moss` (Node) and `@moss-dev/moss-web` (browser) export the `IAuthenticator`
and `AuthToken` types and accept an authenticator in place of the key. Their shapes are shown
below for reference - you don't need to redefine them in your code.

```ts theme={null}
// Exported from '@moss-js/moss' and '@moss-dev/moss-web' - shown here for reference
interface AuthToken {
  token: string;      // Bearer token to send with each request
  expiresIn: number;  // Token lifetime in seconds, as returned by your backend
}

interface IAuthenticator {
  getAuthToken(): Promise<AuthToken>;
  // Required in @moss-js/moss. Optional and deprecated in @moss-dev/moss-web 1.3.0+.
  getAuthHeader(): Promise<string>; // returns "Bearer <token>"
}
```

Both SDKs call only `getAuthToken()`, through the cache described below, and never call
your `getAuthHeader()`. `@moss-js/moss` still requires it in the type, so return
`Bearer <token>` from it. `@moss-dev/moss-web` marks it optional and deprecated
*(@moss-dev/moss-web 1.3.0+)*, so a browser authenticator implements `getAuthToken()` alone.
Earlier `@moss-dev/moss-web` versions require it too.

## Recommended setup

### 1. Your backend - expose a token endpoint

Your backend holds the `projectKey` securely and uses the SDK to fetch a token, returning it directly to the frontend.

```ts theme={null}
// Example: Express route on your backend
import express from 'express';
import { MossClient } from '@moss-js/moss';

const app = express();
const moss = new MossClient('your-project-id', 'your-project-key');

// Protect this route with your own auth middleware
app.get('/api/moss-token', yourAuthMiddleware, async (req, res) => {
  try {
    // getAuthToken() returns { token, expiresIn } - forward it directly
    res.json(await moss.getAuthToken());
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve token' });
  }
});
```

### 2. Your frontend - implement `IAuthenticator`

Since your backend forwards the Moss auth response unchanged, `response.json()` already matches the `AuthToken` shape - no manual mapping needed.

```ts theme={null}
import { MossClient } from '@moss-dev/moss-web';
import type { IAuthenticator, AuthToken } from '@moss-dev/moss-web';

class MyBackendAuthenticator implements IAuthenticator {
  async getAuthToken(): Promise<AuthToken> {
    const response = await fetch('/api/moss-token', {
      credentials: 'include', // include your session cookie / auth header
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Moss token: HTTP ${response.status}`);
    }

    return response.json(); // shape matches AuthToken: { token, expiresIn }
  }
}

// Pass your authenticator to MossClient
const client = new MossClient('your-project-id', new MyBackendAuthenticator());
```

## Token caching

The SDK automatically wraps your authenticator with an internal caching layer, so your backend is only called when the cached token runs out, not on every SDK request. No extra setup is needed.

* Both SDKs cache a token until 60 seconds before it expires, or for 90% of its life when that is later, so a short-lived token is cached too. An `expiresIn` that is not a positive finite number, such as `0` or a missing value, is not cached. *(@moss-js/moss 1.17.0+, @moss-dev/moss-web 1.3.0+)*
* When the Moss service answers `401`, the SDK drops the rejected token from the cache and retries the request once, asking your authenticator for a new token. *(@moss-js/moss 1.17.0+)*
* A telemetry request the Moss service refuses keeps the cached token.

> [!TIP]
>
> Make sure your backend returns the correct `expiresIn` value so the cache TTL is accurate.

## Summary

| Use case | How to initialize |
| - | - |
| Server-side (Node.js) | `new MossClient(projectId, projectKey)` |
| Frontend - custom auth (`@moss-dev/moss-web`) | `new MossClient(projectId, new MyBackendAuthenticator())` |

**Rule of thumb:** your `projectKey` must never appear in browser-facing code. The custom authenticator pattern ensures it stays on your server while the frontend still gets authenticated access to Moss.
