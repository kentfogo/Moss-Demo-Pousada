<!-- Source: https://docs.moss.dev/docs/reference/swift/custom-authenticator.md -->
# Custom Authenticator

> Authenticate the Swift client with short-lived tokens from your backend.

[Swift SDK](https://docs.moss.dev/docs/reference/swift/api.md) / Custom Authenticator

For shipped iOS apps, don't embed your long-lived `projectKey` in the binary.
Instead, implement the `Authenticator` protocol so the SDK fetches a
short-lived bearer token from your backend whenever it needs one.

## The protocol

```swift theme={null}
public protocol Authenticator: AnyObject, Sendable {
    func getAuthHeader() async throws -> String
}
```

The native runtime calls `getAuthHeader()` whenever it needs a fresh token for
an outbound request, and it calls it on **every** request. The SDK does not
cache delegated tokens for you, so your implementation should cache the token
and refetch only when it's near expiry (see [Token caching](#token-caching)).
The method may be called from any thread.

After a `401` from the Moss service, the SDK calls `getAuthHeader()` again and
retries the request once with the token it returns. It doesn't tell your
authenticator which token was rejected.

## Return-value contract

Return **the raw bearer token only** - do **not** include the `Bearer ` prefix.
The SDK constructs the full `Authorization: Bearer <token>` header itself.

```swift theme={null}
// ✅ correct
return "eyJhbGciOi..."

// ❌ wrong - the SDK prepends `Bearer ` itself
return "Bearer eyJhbGciOi..."
```

> [!NOTE]
>
> The JavaScript SDK's `IAuthenticator.getAuthHeader()` returns the full
> `Bearer ...` value, but the JavaScript SDKs never call it. They call
> `getAuthToken()`, whose `token` is the raw token this method returns.

## Token caching

Unlike the project-key initializer (which caches tokens internally) and the
JavaScript SDK (which wraps your authenticator in an automatic cache), the Swift
`Authenticator` returns only a token string. The runtime has no expiry to cache
against, so **caching is your responsibility**.

Have your backend return the token's lifetime alongside it, cache both on-device,
and return the cached token until it's close to expiry. The example keeps a token
until 60 seconds before it expires, or for 90% of its life when that is later,
the rule the project-key initializer uses:

```swift theme={null}
import Foundation
import Moss

final class BackendTokenAuthenticator: Authenticator {
    private let tokenURL: URL
    private let store = TokenStore()

    init(tokenURL: URL) { self.tokenURL = tokenURL }

    func getAuthHeader() async throws -> String {
        // Returns the cached token if still valid (a local check, no network);
        // otherwise fetches once. Concurrent callers coalesce onto one refresh.
        // Returns the raw token only; the SDK adds the "Bearer " prefix.
        try await store.token { try await self.fetchToken() }
    }

    private func fetchToken() async throws -> (token: String, expiresIn: TimeInterval) {
        var request = URLRequest(url: tokenURL)
        // Never replay a token from URLSession's cache.
        request.cachePolicy = .reloadIgnoringLocalCacheData
        // Authenticate this request with your own user credential, e.g.:
        // request.setValue("Bearer \(mySession)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        let body = try JSONDecoder().decode(TokenResponse.self, from: data)
        return (body.token, body.expiresIn)
    }

    private struct TokenResponse: Decodable {
        let token: String
        let expiresIn: TimeInterval // seconds
    }
}

/// Thread-safe cache. Concurrent callers during a refresh coalesce onto a single
/// fetch, so a cold start or expiry boundary triggers one backend round-trip.
actor TokenStore {
    private var token: String?
    private var expiresAt: Date = .distantPast
    private var refresh: Task<(token: String, expiresIn: TimeInterval), Error>?

    func token(
        orFetch fetch: @Sendable @escaping () async throws -> (token: String, expiresIn: TimeInterval)
    ) async throws -> String {
        if let token, expiresAt > Date() { return token }
        if let refresh { return try await refresh.value.token }

        let task = Task { try await fetch() }
        refresh = task
        defer { refresh = nil }

        let fetched = try await task.value
        token = fetched.token
        // Until 60s before expiry, or for 90% of its life when that is later.
        expiresAt = Date().addingTimeInterval(max(fetched.expiresIn * 0.9, fetched.expiresIn - 60))
        return fetched.token
    }
}
```

```swift theme={null}
let auth = BackendTokenAuthenticator(
    tokenURL: URL(string: "https://api.yourapp.com/moss-token")!
)
let client = try MossClient(projectId: "your-project-id", authenticator: auth)
```

Your token endpoint should return JSON shaped like
`{ "token": "...", "expiresIn": 3600 }` (`expiresIn` in seconds). With caching in
place your backend is hit only on a cold start and once per token lifetime.
Every request in between gets its token from the in-memory cache.

> [!TIP]
>
> A complete, runnable example (the iOS app plus a token-vending backend in Node
> and Python) is in [`examples/ios`](https://github.com/usemoss/moss/tree/main/examples/ios)
> in the Moss repo.

See [`MossClient`](./classes/MossClient#init-projectidauthenticatorbaseurl) for
the matching initializer.
