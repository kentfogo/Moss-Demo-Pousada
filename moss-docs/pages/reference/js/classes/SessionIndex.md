<!-- Source: https://docs.moss.dev/docs/reference/js/classes/SessionIndex.md -->
# SessionIndex (JavaScript SDK)

> Local-first, in-process index for real-time indexing and querying.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / SessionIndex

A local-first, in-process index for real-time indexing and querying. All operations
(`addDocs`, `deleteDocs`, `query`) run in process memory with no cloud round-trip per
operation. Call [`pushIndex()`](#pushindex) to persist the session to the cloud.

Construct a session with [`MossClient.session()`](./MossClient#session); the constructor is
not used directly.

## Example

```typescript theme={null}
import { MossClient } from '@moss-js/moss';

const client = new MossClient('your-project-id', 'your-project-key');

const session = await client.session('chat-session-123');
await session.addDocs([{ id: '1', text: 'Customer asked about billing' }]);
const results = await session.query('billing question');
await session.pushIndex();
```

## Accessors

| Property | Type | Description |
| - | - | - |
| `name` | `string` | The session name, and the cloud index `pushIndex` writes to. |
| `docCount` | `number` | Number of documents currently in the local session. |
| `modelId` | [`MossModel`](../type-aliases/MossModel) | The embedding model the session uses, as of its last completed call. `loadIndex`, `loadFromDisk` and auto-refresh can change it *(@moss-js/moss 1.17.0+)*. |

## Methods

### addDocs()

> **addDocs**(`docs`, `options?`): `Promise`\<\{ `added`: `number`; `updated`: `number` }>

Adds or updates documents in the local session index. For built-in models, embeddings are
generated locally. For `modelId: "custom"`, each document must carry an `embedding`.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `docs` | [`DocumentInfo`](../interfaces/DocumentInfo)\[] | Documents to add or update. |
| `options?` | [`MutationOptions`](../interfaces/MutationOptions) | Mutation options (e.g. `upsert`). |

#### Returns

`Promise`\<\{ `added`: `number`; `updated`: `number` }>

***

### deleteDocs()

> **deleteDocs**(`docIds`): `Promise`\<`number`>

Deletes documents from the local session by id. Returns the number removed.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `docIds` | `string`\[] | Document ids to delete. |

#### Returns

`Promise`\<`number`>

***

### getDocs()

> **getDocs**(`options?`): `Promise`\<[`DocumentInfo`](../interfaces/DocumentInfo)\[]>

Fetches documents currently in the local session.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `options?` | [`GetDocumentsOptions`](../interfaces/GetDocumentsOptions) | Pass `docIds` to filter. |

#### Returns

`Promise`\<[`DocumentInfo`](../interfaces/DocumentInfo)\[]>

***

### query()

> **query**(`query`, `options?`): `Promise`\<[`SearchResult`](../interfaces/SearchResult)>

Hybrid (keyword + semantic) search over the local session index, entirely in-memory. For
`modelId: "custom"`, an explicit `options.embedding` is required.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `query` | `string` | The search query text. |
| `options?` | [`QueryOptions`](../interfaces/QueryOptions) | Query options (`topK`, `alpha`, `embedding`, `filter`). |

#### Returns

`Promise`\<[`SearchResult`](../interfaces/SearchResult)>

***

### loadIndex()

> **loadIndex**(`indexName`, `options?`): `Promise`\<`number`>

Loads an existing cloud index into the session by name. A session starts empty, so this is
how it resumes the cloud index it is named after. With `options.autoRefresh = true`,
the SDK polls the cloud index and pulls newer versions in on subsequent reads (paused while
the session has un-pushed local edits). Returns the number of documents loaded, `0` when no
cloud index has that name.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `indexName` | `string` | Name of the cloud index to load into the session. |
| `options?` | [`LoadSessionOptions`](../interfaces/LoadSessionOptions) | Auto-refresh settings. |

#### Returns

`Promise`\<`number`>

***

### pushIndex()

> **pushIndex**(): `Promise`\<[`PushIndexResult`](../interfaces/PushIndexResult)>

Uploads the session to the cloud, creating or replacing the index with the same name.
For a built-in model the service re-embeds the text with that model, so the index loads and
answers text queries like one built with `createIndex`. A custom-model session keeps its own
embeddings.

#### Returns

`Promise`\<[`PushIndexResult`](../interfaces/PushIndexResult)>

***

### saveToDisk()

> **saveToDisk**(`cachePath?`): `Promise`\<`void`>

Persists the session to `<cachePath>/<name>/` for offline reuse without a cloud round-trip.
A relative `cachePath` resolves against the current working directory, and `~` is not
expanded.

Without `cachePath`, or with an empty one, the snapshot goes in `sessions/<project id>/`
under the client's [`cachePath` option](./MossClient#mossclientoptions), else under the
`MOSS_SESSION_CACHE_PATH` environment variable, which only session snapshots read, else
under `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux,
`%LOCALAPPDATA%\moss` on Windows. *(@moss-js/moss 1.19.0+)*

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `cachePath?` | `string` | Directory to write the session to. Defaults to the directory above. |

***

### loadFromDisk()

> **loadFromDisk**(`cachePath?`, `options?`): `Promise`\<`number`>

Restores a session previously written by `saveToDisk`. Without `cachePath` it reads the
directory `saveToDisk` uses without one. Returns the number of documents loaded.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `cachePath?` | `string` | Directory a session was saved to. Defaults to the directory `saveToDisk` uses without one. |
| `options?` | `LoadFromDiskOptions` | `rebuildLegacy` (default `true`) rebuilds a snapshot that an SDK older than 1.8 saved for a built-in model. Pass `{ rebuildLegacy: false }` to load it as a custom-model session. |

#### Returns

`Promise`\<`number`>

***

### inspectSnapshot()

> **inspectSnapshot**(`cachePath?`): `Promise`\<`SnapshotInfo`>

Describes the snapshot under `<cachePath>/<name>/` without loading it. Without `cachePath` it
reads the directory `saveToDisk` uses without one *(@moss-js/moss 1.19.0+)*.

#### Parameters

| Parameter | Type | Description |
| - | - | - |
| `cachePath?` | `string` | Directory a session was saved to. Defaults to the directory `saveToDisk` uses without one. |

#### Returns

`Promise`\<`SnapshotInfo`>:

| Field | Type | Description |
| - | - | - |
| `modelId` | `string` | The model the snapshot was saved with: `"custom"` or a built-in model such as `"moss-minilm"`. |
| `hasModelArtifact` | `boolean` | `false` for a built-in model snapshot an SDK older than 1.8 saved, which `loadFromDisk` rebuilds by default. |
| `docCount` | `number` | Documents in the snapshot. |
| `dimension` | `number` | Vector dimension. |
| `legacyLayout` | `boolean` | `true` for the on-disk layout of older SDKs. |

***

### close()

> **close**(): `Promise`\<`void`>

Sends the final usage report, then releases the session's native resources: its
auto-refresh poller, its in-memory index and its reference to the shared embedding model.
Resolves once the report arrives or 2 seconds pass. Safe to call more than once.
Afterwards `name` and `modelId` still read; `docCount` and every method throw.
[`MossClient.close()`](./MossClient#close) also closes every session the client opened.

`SessionIndex` also implements `Symbol.asyncDispose`, so `await using` closes it when the
enclosing block ends (Node.js 24 or later).

#### Returns

`Promise`\<`void`>

#### Example

```typescript theme={null}
await using session = await client.session('call-123');
await session.addDocs([{ id: 'turn-1', text: 'Customer asked about a refund.' }]);
const results = await session.query('refund');
// session.close() runs when the block ends
```

See [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).
