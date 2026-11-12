<!-- Source: https://docs.moss.dev/docs/build/browser-extension-context.md -->
# Browser Extension Context

> Run indexing and queries in the browser with the @moss-dev/moss-web SDK.

Run indexing and queries inside a browser extension using the
[`@moss-dev/moss-web`](https://docs.moss.dev/docs/reference/browser/api) SDK. The background service worker hosts
the Moss client and the index; content scripts message the worker to run queries. The index
persists in extension storage or IndexedDB, so queries resolve in the browser without a
network call and the indexed data stays in the browser.

A million 256-dimension vectors compress to roughly 500 MB; most extensions need far less.

## Architecture

![A browser content script queries a background worker, which owns the Moss client and a local index in IndexedDB or extension storage](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/browser-extension-context-light.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=c0f11ffed86f520216d6163a986d39e3)

![A browser content script queries a background worker, which owns the Moss client and a local index in IndexedDB or extension storage](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/browser-extension-context-dark.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=92442b9eca1bb9a4c9d927be47a2f01e)

* Background service worker hosts a Moss client (use the [browser SDK](https://docs.moss.dev/docs/reference/browser/api.md), `@moss-dev/moss-web`)
* Content scripts post messages to the background worker for index/query
* Persist the index using extension storage or IndexedDB

## Example (background worker)

`MyBackendAuthenticator` fetches a short-lived token from your backend, so the extension bundle never contains a `projectKey`. See [Custom Authenticator](https://docs.moss.dev/docs/reference/js/custom-authenticator.md) for the implementation. In a service worker, fetch the token from an absolute URL and add that origin to the manifest's `host_permissions`.

```ts theme={null}
// background.ts
import { MossClient } from '@moss-dev/moss-web'
import { MyBackendAuthenticator } from './auth'
const client = new MossClient(process.env.MOSS_PROJECT_ID!, new MyBackendAuthenticator())

chrome.runtime.onMessage.addListener(async (msg, _sender, sendResponse) => {
  if (msg.type === 'query') {
    await client.loadIndex('ext-context')
    const res = await client.query('ext-context', msg.text, { topK: 3 })
    sendResponse(res)
  }
})
```

## Related

> [card] [Browser SDK](https://docs.moss.dev/docs/reference/browser/api.md)
>
> The in-browser `@moss-dev/moss-web` client.

> [card] [Local embeddings](https://docs.moss.dev/docs/build/local-embeddings.md)
>
> Embed on-device for privacy.
