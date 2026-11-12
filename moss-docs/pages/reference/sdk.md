<!-- Source: https://docs.moss.dev/docs/reference/sdk.md -->
# SDK Overview

> Every Moss SDK capability, with links to the detailed guide for each.

Moss ships official SDKs for seven platforms. They share one conceptual API (create or load an
index, then query) and one index format, so you can build in one and query from another.

> [card] [Python](https://docs.moss.dev/docs/reference/python/api.md)
>
> Async Python SDK. `pip install moss`

> [card] [JavaScript](https://docs.moss.dev/docs/reference/js/api.md)
>
> Node.js server-side SDK. `npm install @moss-js/moss`

> [card] [Swift (iOS)](https://docs.moss.dev/docs/reference/swift/api.md)
>
> On-device iOS SDK via Swift Package Manager.

> [card] [Android](https://docs.moss.dev/docs/reference/android/getting-started.md)
>
> On-device Android SDK, a Kotlin AAR.

> [card] [Elixir](https://docs.moss.dev/docs/reference/elixir/api.md)
>
> Elixir SDK on Hex. `{:moss, "~> 1.0"}`

> [card] [Browser](https://docs.moss.dev/docs/reference/browser/api.md)
>
> In-browser / WebAssembly SDK. `npm install @moss-dev/moss-web`

> [card] [C](https://docs.moss.dev/docs/reference/c/getting-started.md)
>
> Native C library (libmoss).

> [!NOTE]
>
> Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to 1.9.0+ before then.

## Capabilities

Everything the SDKs can do. Pick a language above for install and quickstart; follow a link
below for the details.

Links below go to the Python pages; each topic has a JavaScript equivalent under the JavaScript SDK.

| Capability | What it does | Learn more |
| - | - | - |
| Index management | Create, add, update, delete, get, and list indexes | [Indexing](https://docs.moss.dev/docs/reference/python/api.md#indexes) |
| Index from files | Build an index from PDF/DOCX with server-side parsing and OCR | [Index from files](https://docs.moss.dev/docs/reference/python/files.md) |
| Load and query | Load an index into memory and run semantic search | [Load and query](https://docs.moss.dev/docs/reference/python/api.md#load-and-query) |
| Hybrid search | Blend semantic and keyword scoring with `alpha` | [Hybrid search](https://docs.moss.dev/docs/reference/python/hybrid-search.md) |
| Metadata filtering | Narrow results with `$eq`, `$in`, `$near`, `$and`/`$or`, and more | [Metadata filtering](https://docs.moss.dev/docs/reference/python/metadata-filtering.md) |
| Custom embeddings | Bring your own vectors with `model_id="custom"` | [Custom embeddings](https://docs.moss.dev/docs/reference/python/custom-embeddings.md) |
| Multi-index search | Query across several loaded indexes in one call, with the same `alpha` blend as a single-index query. Also in the JavaScript and Elixir SDKs | [Multi-index search](https://docs.moss.dev/docs/reference/python/multi-index-search.md) |
| Real-time sessions | Local-first indexing during a live interaction | [Sessions](https://docs.moss.dev/docs/reference/python/sessions.md) |
| Cross-agent handoff | Resume a session across agents, channels, and devices | [Sessions](https://docs.moss.dev/docs/reference/python/sessions.md) |
| Hydration and sync | Hydrate from the cloud, auto-refresh, and push updates | [Keeping indexes fresh](https://docs.moss.dev/docs/reference/python/api.md#keeping-indexes-fresh) |
| Inference | Responses in the shape of OpenAI's Responses API, answered from your indexes. Every SDK has an inference client, and any OpenAI client works too, on a server or in a browser page. Direct page calls with the project key are for prototypes, local demos and internal tools; a public page calls through a route of yours, see [Keep the project key on your server](https://docs.moss.dev/docs/inference/sdks/browser.md#keep-the-project-key-on-your-server) | [Python](https://docs.moss.dev/docs/inference/sdks/python.md), [JavaScript](https://docs.moss.dev/docs/inference/sdks/javascript.md), [Swift](https://docs.moss.dev/docs/inference/sdks/swift.md), [Android](https://docs.moss.dev/docs/inference/sdks/android.md), [Elixir](https://docs.moss.dev/docs/inference/sdks/elixir.md), [Browser](https://docs.moss.dev/docs/inference/sdks/browser.md), [C](https://docs.moss.dev/docs/inference/sdks/c.md), [HTTP API](https://docs.moss.dev/docs/api-reference/v1/inference/responses.md) |

## Models

* `moss-minilm` (default) - fast, lightweight, good for edge and offline
* `moss-mediumlm` - higher accuracy with reasonable performance
* `moss-litelm` - the on-device default on iOS and Android
* `custom` - bring your own embedding vectors

## Samples

Runnable end-to-end examples live in the
[moss](https://github.com/usemoss/moss) repo, with parallel JavaScript and
Python projects you can adapt by swapping in your own data.
