<!-- Source: https://docs.moss.dev/docs/reference/browser/browser-vs-node.md -->
# Browser vs Node

> Choose between the Moss Browser/WASM SDK and the Node SDK.

[Browser SDK](https://docs.moss.dev/docs/reference/browser/api.md) / Browser vs Node

Moss ships two JavaScript clients. They share a similar API surface but target
different environments. Pick the one that matches where your code runs.

## Which one do I use?

* Use [`@moss-dev/moss-web`](./api) for client-side, in-browser search. Queries
  run locally on WebAssembly, and their text never leaves the device.
* Use [`@moss-js/moss`](../js/api) for server-side (Node.js) workloads, such as
  API routes, backend services, and pipelines.

```typescript theme={null}
// In the browser
import { MossClient } from "@moss-dev/moss-web";

// On the server (Node.js)
import { MossClient } from "@moss-js/moss";
```

## Differences

| | `@moss-dev/moss-web` (Browser) | `@moss-js/moss` (Node) |
| - | - | - |
| Environment | Modern browsers, runs on WebAssembly | Node.js server-side |
| Where queries run | Locally in the browser after `loadIndex` | Server-side runtime |
| Sessions | Not supported | Supported (`client.session()`) |
| Persistence | In-browser, per device | Server-side |
| Credentials | Use a [custom authenticator](https://docs.moss.dev/docs/reference/js/custom-authenticator.md); never ship a `projectKey` in client code | `projectKey` can be used directly in trusted server code |

> [!NOTE]
>
> Both clients require an index to be loaded before querying. In the browser SDK,
> call [`loadIndex`](./classes/MossClient#loadindex) before
> [`query`](./classes/MossClient#query).
