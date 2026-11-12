<!-- Source: https://docs.moss.dev/docs/reference/browser/classes/MossClient.md -->
# MossClient (Browser SDK)

> In-browser semantic search client backed by WebAssembly.

[@moss-dev/moss-web](https://docs.moss.dev/docs/reference/browser/api.md) / MossClient

`MossClient` is the entry point for the Moss Browser/WASM SDK. It manages
indexes and documents and runs semantic search locally in the browser. Once an
index is loaded with `loadIndex`, queries run entirely in-browser with no
server round-trips.

This is the in-browser client. For server-side (Node.js) code, use the
[Node `MossClient`](../../js/classes/MossClient) instead. See
[Browser vs Node](https://docs.moss.dev/docs/reference/browser/browser-vs-node.md) for guidance.

This client does not have sessions.

Model responses grounded in your indexes come from a separate client,
`MossInference`, not from `MossClient`. See [Inference](https://docs.moss.dev/docs/inference/sdks/browser.md).

## Example

```typescript theme={null}
import { MossClient } from "@moss-dev/moss-web";

const client = new MossClient("your-project-id", "your-project-key");

// Create an index with documents
await client.createIndex("docs", [
  { id: "1", text: "Machine learning fundamentals" },
  { id: "2", text: "Deep learning neural networks" },
]);

// Load the index into the browser, then query it
await client.loadIndex("docs");
const results = await client.query("docs", "AI and neural networks");
```

## Creating a client

### Constructor (lazy)

> **new MossClient**(`projectId`, `projectKey`, `options?`): `MossClient`

Creates a client with lazy initialization. The WebAssembly module and embedding
model load on the first API call.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `projectId` | `string` | Your project identifier. |
| `projectKey` | `string` | Your project authentication key. |
| `options?` | `MossClientOptions` | Optional configuration. See [Options](#options). |

#### Returns

`MossClient`

### Constructor (custom authenticator)

> **new MossClient**(`projectId`, `authenticator`, `options?`): `MossClient`

Creates a client with lazy initialization that authenticates through an
`IAuthenticator` instead of a `projectKey`, so the key is never shipped in
browser code. See [Custom authenticator](#custom-authenticator).

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `projectId` | `string` | Your project identifier. |
| `authenticator` | `IAuthenticator` | Implementation that returns a short-lived bearer token from your backend. |
| `options?` | `MossClientOptions` | Optional configuration. See [Options](#options). |

#### Returns

`MossClient`

### create() (eager)

> **MossClient.create**(`projectId`, `projectKey`, `options?`): `Promise`\<`MossClient`>

Creates a client with eager initialization. The WebAssembly module and embedding
model load immediately, before the returned promise resolves.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `projectId` | `string` | Your project identifier. |
| `projectKey` | `string` | Your project authentication key. |
| `options?` | `MossClientOptions` | Optional configuration. See [Options](#options). |

#### Returns

`Promise`\<`MossClient`>

Promise that resolves to a ready `MossClient`.

#### Example

```typescript theme={null}
// Lazy: WASM/model loads on first API call
const client = new MossClient("your-project-id", "your-project-key");

// Eager: WASM/model loads immediately
const client = await MossClient.create("your-project-id", "your-project-key");
```

### create() (custom authenticator)

> **MossClient.create**(`projectId`, `authenticator`, `options?`): `Promise`\<`MossClient`>

Creates a client with eager initialization that authenticates through an
`IAuthenticator` instead of a `projectKey`, so the key is never shipped in
browser code. See [Custom authenticator](#custom-authenticator).

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `projectId` | `string` | Your project identifier. |
| `authenticator` | `IAuthenticator` | Implementation that returns a short-lived bearer token from your backend. |
| `options?` | `MossClientOptions` | Optional configuration. See [Options](#options). |

#### Returns

`Promise`\<`MossClient`>

Promise that resolves to a ready `MossClient`.

### Custom authenticator

Both the constructor and `create()` also accept an `IAuthenticator` in place of
`projectKey`, so production frontends never ship the key. The authenticator
fetches a short-lived token from your own backend. The client caches it until
shortly before expiry and refreshes it after a `401`.

```typescript theme={null}
import { MossClient } from "@moss-dev/moss-web";
import type { IAuthenticator, AuthToken } from "@moss-dev/moss-web";

const client = new MossClient("your-project-id", new MyBackendAuthenticator());
const client = await MossClient.create("your-project-id", new MyBackendAuthenticator());

const token = await client.getAuthToken(); // cached AuthToken
```

`getAuthToken()` is only available when the client was created with an
authenticator. See [Custom Authenticator](https://docs.moss.dev/docs/reference/js/custom-authenticator.md)
for the `MyBackendAuthenticator` implementation and the backend token endpoint.

### Options

| Option | Type | Description |
| - | - | - |
| `model` | `"moss-minilm"` \| `"moss-mediumlm"` | Embedding model. Defaults to `"moss-minilm"` (fast, for most use-cases). Use `"moss-mediumlm"` for higher quality. |
| `baseUrl` | `string` | Custom API base URL. |
| `onnxWasmPath` | `string` | URL of a directory that serves the ONNX Runtime files. It must serve `ort-wasm-simd-threaded.wasm` and `ort-wasm-simd-threaded.mjs` from onnxruntime-web 1.30.0 *(@moss-dev/moss-web 1.5.0+)*. The `.jsep` files are not requested. |

```typescript theme={null}
const client = new MossClient("your-project-id", "your-project-key", {
  model: "moss-mediumlm",
  baseUrl: "https://moss.internal.example.com",
});
```

## Index management

### createIndex()

> **createIndex**(`name`, `docs`, `options?`): `Promise`

Creates a new index with the provided documents.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `name` | `string` | Name of the index to create. |
| `docs` | `DocumentInfo`\[] | Documents to index. |
| `options?` | `CreateIndexOptions` | Optional configuration. |

#### Example

```typescript theme={null}
await client.createIndex("knowledge-base", [
  { id: "doc1", text: "Introduction to AI" },
  { id: "doc2", text: "Machine learning basics" },
]);
```

***

### addDocs()

> **addDocs**(`name`, `docs`, `options?`): `Promise`

Adds or updates documents in an index.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `name` | `string` | Name of the target index. |
| `docs` | `DocumentInfo`\[] | Documents to add or update. |
| `options?` | `MutationOptions` | Optional configuration. |

#### Example

```typescript theme={null}
await client.addDocs("knowledge-base", [
  { id: "new-doc", text: "New content to index" },
]);
```

***

### deleteDocs()

> **deleteDocs**(`name`, `docIds`, `options?`): `Promise`

Deletes documents from an index by their IDs.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `name` | `string` | Name of the target index. |
| `docIds` | `string`\[] | Document IDs to delete. |
| `options?` | `MutationOptions` | Optional configuration. |

#### Example

```typescript theme={null}
await client.deleteDocs("knowledge-base", ["doc1", "doc2"]);
```

***

### getIndex()

> **getIndex**(`name`): `Promise`

Gets metadata about a specific index.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `name` | `string` | Name of the index to retrieve. |

#### Example

```typescript theme={null}
const info = await client.getIndex("knowledge-base");
```

***

### listIndexes()

> **listIndexes**(): `Promise`

Lists all available indexes.

#### Example

```typescript theme={null}
const indexes = await client.listIndexes();
```

***

### deleteIndex()

> **deleteIndex**(`name`): `Promise`

Deletes an index and all its data.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `name` | `string` | Name of the index to delete. |

#### Example

```typescript theme={null}
await client.deleteIndex("old-index");
```

***

### getDocs()

> **getDocs**(`name`, `options?`): `Promise`

Retrieves documents from an index.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `name` | `string` | Name of the target index. |
| `options?` | `GetDocumentsOptions` | Optional configuration for retrieval. |

#### Example

```typescript theme={null}
// Get all documents
const allDocs = await client.getDocs("knowledge-base");

// Get specific documents
const specificDocs = await client.getDocs("knowledge-base", {
  docIds: ["doc1", "doc2"],
});
```

***

### getJobStatus()

> **getJobStatus**(`jobId`): `Promise`

Gets the current status of an async operation.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `jobId` | `string` | The job ID returned by an async operation. |

#### Example

```typescript theme={null}
const status = await client.getJobStatus(jobId);
```

## Local search

Queries run against an index that has been loaded into the browser. Always call
`loadIndex` before `query`.

### loadIndex()

> **loadIndex**(`name`, `options?`): `Promise`

Loads an index into the browser for fast local querying. Call this before
`query`.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `name` | `string` | Name of the index to load. |
| `options?` | `LoadIndexOptions` | Optional configuration. |

#### Example

```typescript theme={null}
await client.loadIndex("knowledge-base");

// Now queries run locally in the browser
const results = await client.query("knowledge-base", "search text");
```

***

### loadIndexes()

> **loadIndexes**(`names`, `options?`): `Promise`

Loads several indexes, one at a time. Best-effort: a name that fails is reported
in `failed`, and the indexes that loaded stay loaded. `options` apply to every
index.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `names` | `string[]` | Names of the indexes to load. |
| `options?` | `LoadIndexOptions` | Optional configuration, applied to every index. |

#### Returns

A `LoadIndexesResult`:

| Property | Type | Description |
| - | - | - |
| `loaded` | `string[]` | Names of the indexes that loaded. |
| `failed` | `Record<string, string>` | Names that failed to load, mapped to the error message. |
| `failedCodes?` | `Record<string, string>` | Names that failed to load, mapped to the error's stable `code`, such as `NOT_FOUND` or `NETWORK`. A failure without a code, such as one from an older `@moss-dev/moss-wasm`, has no entry. *(@moss-dev/moss-web 1.4.0+)* |

#### Example

```typescript theme={null}
const { loaded, failed, failedCodes } = await client.loadIndexes(["docs", "faq"]);
for (const name of Object.keys(failed)) {
  console.warn(name, failedCodes?.[name], failed[name]);
}
```

***

### hasIndex()

> **hasIndex**(`name`): `Promise`

Checks whether an index is loaded locally in the browser.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `name` | `string` | Name of the index to check. |

#### Example

```typescript theme={null}
if (await client.hasIndex("knowledge-base")) {
  const results = await client.query("knowledge-base", "search text");
}
```

***

### getIndexInfo()

> **getIndexInfo**(`name`): `Promise`

Gets info about a locally loaded index.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `name` | `string` | Name of the loaded index. |

#### Example

```typescript theme={null}
const info = await client.getIndexInfo("knowledge-base");
```

***

### query()

> **query**(`name`, `queryText`, `options?`): `Promise`

Performs a semantic similarity search against a loaded index. The index must be
loaded with `loadIndex` first; the search then runs entirely in the browser.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `name` | `string` | Name of the target index to search. |
| `queryText` | `string` | The search query text. |
| `options?` | `QueryOptions` | Optional query configuration, such as `topK`. |

#### Example

```typescript theme={null}
await client.loadIndex("knowledge-base");

const results = await client.query("knowledge-base", "machine learning");
results.docs.forEach((doc) => {
  console.log(`${doc.id}: ${doc.text} (score: ${doc.score})`);
});
```

***

### refreshIndex()

> **refreshIndex**(`name`): `Promise`

Refreshes a loaded index from the server, picking up the latest changes.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `name` | `string` | Name of the loaded index to refresh. |

#### Example

```typescript theme={null}
await client.refreshIndex("knowledge-base");
```

***

### unloadIndex()

> **unloadIndex**(`name`): `Promise`

Unloads an index from the browser, freeing its resources. Querying it again
requires calling `loadIndex` first.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `name` | `string` | Name of the index to unload. |

#### Example

```typescript theme={null}
await client.unloadIndex("knowledge-base");
```

## Cleanup

### dispose()

> **dispose**(): `void`

Releases the client's resources: stops auto-refresh, frees the loaded indexes and
the ONNX Runtime sessions of models no longer in use, and sends the pending usage
counts. The WebAssembly module stays loaded. Call this when the client is no longer
needed. The loaded indexes are gone afterwards, so load them again before the next
query. See [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).

#### Example

```typescript theme={null}
client.dispose();
```
