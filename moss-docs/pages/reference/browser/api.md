<!-- Source: https://docs.moss.dev/docs/reference/browser/api.md -->
# Moss Browser SDK overview

> Private, in-browser semantic search for the web with the Moss Browser/WASM SDK.

`@moss-dev/moss-web` brings semantic search directly into the browser. Queries
run locally on WebAssembly, and their text never leaves the device. The first
text query loads the embedding model, which contacts Moss, and the SDK sends
usage counts to Moss; see [Telemetry](https://docs.moss.dev/docs/reference/telemetry.md).

This is the in-browser, client-side SDK. For server-side (Node.js) workloads,
use [`@moss-js/moss`](../js/api) instead. See
[Browser vs Node](https://docs.moss.dev/docs/reference/browser/browser-vs-node.md) to pick the right one.

## Features

* In-browser vector search with zero network latency once an index is loaded
* Semantic and hybrid search that goes beyond keyword matching
* Multi-index support for isolated search spaces
* Full CRUD for indexes and documents from the browser
* Privacy-first: queries run entirely in the browser

## Install

```bash theme={null}
npm install @moss-dev/moss-web
```

The package depends on `@moss-dev/moss-wasm`, which is installed automatically.
The WebAssembly module and embedding model download on first use.

Outside Node, the SDK imports ONNX Runtime from `onnxruntime-web/wasm`, pinned to 1.30.0,
through the `#ort` entry of the package's `imports` field. Your bundler must follow that field,
as Vite 4.2+ and webpack 5 do. One that doesn't fails to resolve `#ort`. To serve the ONNX
Runtime files yourself, see the [`onnxWasmPath`](./classes/MossClient#options) option.
*(@moss-dev/moss-web 1.5.0+)*

## Quickstart

Create a client, create an index, load it into the browser, then query it.
Querying always requires a loaded index, so call `loadIndex` before `query`.

```typescript theme={null}
import { MossClient } from "@moss-dev/moss-web";

// 1. Initialize the client (WASM/model download happens on first use)
const client = new MossClient("your-project-id", "your-project-key");

// 2. Create an index with documents
await client.createIndex("knowledge-base", [
  { id: "1", text: "Machine learning fundamentals" },
  { id: "2", text: "Deep learning neural networks" },
]);

// 3. Load the index into the browser for fast local queries
await client.loadIndex("knowledge-base");

// 4. Query - runs entirely in-browser
const results = await client.query("knowledge-base", "AI and neural networks");
results.docs.forEach((doc) => {
  console.log(`${doc.id}: ${doc.text} (score: ${doc.score})`);
});
```

> [!NOTE]
>
> The inline `projectKey` is for local experiments only. Production frontends must
> pass a [custom authenticator](https://docs.moss.dev/docs/reference/js/custom-authenticator.md) instead,
> so the key stays on your server.

> [!NOTE]
>
> Always call `loadIndex` before `query`. Querying runs against an index that has
> been loaded into the browser; there is no query path that skips loading.

## Errors

A failure from the WebAssembly core rejects with an `Error` whose `code` is a stable string:
`INVALID_ARGUMENT`, `NOT_FOUND`, `UNAUTHORIZED`, `NETWORK`, `DESERIALIZATION`,
`MODEL_UNAVAILABLE` or `INTERNAL`. Branch on `code`, not on the message: the message is fixed
text for each kind of failure, such as `Index not found.`, with no URLs or index names.
`detail` holds the core error text, for logs and support, at most 512 bytes, and not a stable
contract. [`loadIndexes`](./classes/MossClient#loadindexes) reports each failed name's code in
`failedCodes`. Errors the SDK throws itself are not core failures: `queryMultiIndex([])` throws
a plain `Error` with no `code`, and a failed model download throws a `ModelDeliveryError`, whose
`code`, when set, is the model service's own error code. *(@moss-dev/moss-web 1.4.0+ with
@moss-dev/moss-wasm 0.17.0)*

```typescript theme={null}
try {
  await client.loadIndex("docs");
} catch (error) {
  if ((error as { code?: string }).code !== "NOT_FOUND") throw error;
  // The index does not exist yet.
}
```

See [Error codes](https://docs.moss.dev/docs/reference/errors.md#error-codes).

## Reference

* [MossClient](https://docs.moss.dev/docs/reference/browser/classes/MossClient.md) - the in-browser client: create a client,
  manage indexes and documents, load indexes locally, and query them.
* [Inference](https://docs.moss.dev/docs/inference/sdks/browser.md) - `MossInference`, a separate client for model
  responses grounded in your indexes.
* [Browser vs Node](https://docs.moss.dev/docs/reference/browser/browser-vs-node.md) - when to use the browser SDK versus the
  Node SDK.
