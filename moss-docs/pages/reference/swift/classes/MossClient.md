<!-- Source: https://docs.moss.dev/docs/reference/swift/classes/MossClient.md -->
# MossClient (Swift SDK)

> Entry point for the Swift SDK: construct the client and open on-device sessions.

[Swift SDK](https://docs.moss.dev/docs/reference/swift/api.md) / MossClient

The entry point for the Swift SDK. Construct it with your project credentials
(or a custom [`Authenticator`](../custom-authenticator)), then open on-device
[sessions](https://docs.moss.dev/docs/reference/swift/classes/MossSession.md) and track push jobs.

All methods are `async throws` and dispatch native work onto a background
thread. The underlying native client is thread-safe.

Model responses grounded in your indexes come from a separate client,
`MossInference`, not from `MossClient`. See [Inference](https://docs.moss.dev/docs/inference/sdks/swift.md).

## Example

```swift theme={null}
import Moss

let client = try MossClient(projectId: "your-project-id", projectKey: "your-project-key")
defer { client.close() }

// Open an on-device session and search locally.
let session = try await client.session("docs")
try await session.addDocs([
  .init(id: "1", text: "Machine learning fundamentals"),
  .init(id: "2", text: "Deep learning neural networks"),
])
let results = try await session.query("AI and neural networks")
```

## Constructors

### init(projectId:projectKey:)

```swift theme={null}
init(projectId: String, projectKey: String) throws
```

Creates a client backed by a static project key.

| Parameter | Type | Description |
| - | - | - |
| `projectId` | `String` | Your project identifier. |
| `projectKey` | `String` | Your project authentication key. Prefer the `Authenticator` form for shipped apps so the key never ships in the binary. |

### init(projectId:authenticator:baseUrl:)

```swift theme={null}
init(projectId: String, authenticator: any Authenticator, baseUrl: String? = nil) throws
```

Creates a client whose bearer tokens come from a custom
[`Authenticator`](../custom-authenticator). Use this in shipped apps so the
long-lived project key stays on your backend.

| Parameter | Type | Description |
| - | - | - |
| `projectId` | `String` | Your project identifier. |
| `authenticator` | `any Authenticator` | Supplies a short-lived bearer token from your backend. |
| `baseUrl` | `String?` | Optional override for the API base URL. |

## Statics

### sdkVersion

```swift theme={null}
static var sdkVersion: String
```

The native runtime version string.

### setModelCacheDir(\_:)

```swift theme={null}
static func setModelCacheDir(_ path: String) throws
```

Override where embedding-model files are cached. **You normally don't need
this** - the client caches under `<Library/Caches>/moss-models/` automatically
on first init. Call it before constructing your first client if you need a
custom location (e.g. a shared App Group container).

## Methods

### close()

```swift theme={null}
func close()
```

Sends the final usage report, then frees the underlying native handle.
Idempotent and safe to call while operations are in flight: it blocks until they
drain, then waits up to 2 seconds for the report to arrive. Also called
automatically on `deinit`. Sessions opened from the client stay open; close each
one. Later calls throw `MossError` with the message `MossClient already closed`.
See [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).

***

### session(\_:options:)

```swift theme={null}
func session(_ name: String, options: SessionOptions = SessionOptions()) async throws -> MossSession
func session(_ name: String, modelId: String?) async throws -> MossSession
```

Opens an on-device [`MossSession`](./MossSession). Documents are embedded
locally with the bundled model (default `moss-litelm` on iOS) and queried
without a network round-trip. Configure with
[`SessionOptions`](../types#sessionoptions) — including
[`autoLoadOnInit`](../types#sessionoptions) to skip the creation-time cloud load
for a local-first startup.

```swift theme={null}
let session = try await client.session("notes")
defer { session.close() }
```

By default the session auto-loads the named cloud index at creation. For a
local-only, disk-first session, pass `autoLoadOnInit: false` so creation returns
immediately and you control loading (restore from disk, hitting the cloud only
on a miss):

```swift theme={null}
let cachePath = NSSearchPathForDirectoriesInDomains(
    .cachesDirectory, .userDomainMask, true)[0]

let session = try await client.session(
    "notes", options: SessionOptions(autoLoadOnInit: false))

if try await session.loadFromDisk(cachePath: cachePath) == 0 {
    // Cache miss: pull from the cloud, then persist for next launch.
    _ = try await session.loadIndex("notes")
    try await session.save(toCachePath: cachePath)
}
```

***

### createIndex(\_:docs:modelId:)

```swift theme={null}
func createIndex(_ name: String, docs: [DocumentInfo], modelId: String? = nil) async throws -> MutationResult
```

Creates a cloud index from the given documents and polls until it is ready.
When `modelId` is `nil` the server picks a default (`"custom"` when documents
carry pre-computed embeddings). Returns a [`MutationResult`](../types#mutationresult).

| Parameter | Type | Description |
| - | - | - |
| `name` | `String` | Name of the index to create. |
| `docs` | `[DocumentInfo]` | Documents to index, optionally with pre-computed embeddings. |
| `modelId` | `String?` | Embedding model id. `nil` selects the server default. |

```swift theme={null}
let result = try await client.createIndex("docs", docs: [
  .init(id: "1", text: "Machine learning fundamentals"),
  .init(id: "2", text: "Deep learning neural networks"),
])
```

***

### getIndex(\_:)

```swift theme={null}
func getIndex(_ name: String) async throws -> IndexInfo
```

Gets metadata about a single cloud index. Returns an
[`IndexInfo`](../types#indexinfo). Throws if the index does not exist.

***

### listIndexes()

```swift theme={null}
func listIndexes() async throws -> [IndexInfo]
```

Lists all cloud indexes for the project. Returns an array of
[`IndexInfo`](../types#indexinfo).

```swift theme={null}
for index in try await client.listIndexes() {
  print("\(index.name): \(index.docCount) docs")
}
```

***

### refreshIndex(\_:)

```swift theme={null}
func refreshIndex(_ name: String) async throws -> RefreshResult
```

Checks the cloud for a newer version of a loaded index and updates it in place
if one exists. Returns a [`RefreshResult`](../types#refreshresult) describing
whether an update was applied.

***

### loadIndex(\_:options:)

```swift theme={null}
func loadIndex(_ name: String, options: LoadIndexOptions = LoadIndexOptions()) async throws
```

Downloads a cloud index and loads it for fast local querying. Configure
caching and background auto-refresh with
`LoadIndexOptions`. Throws if the index does not
exist or loading fails.

| Parameter | Type | Description |
| - | - | - |
| `name` | `String` | Name of the index to load. |
| `options` | `LoadIndexOptions` | Cache path and auto-refresh configuration. |

```swift theme={null}
try await client.loadIndex("docs", options: .init(cachePath: cachePath))
```

***

### query(*:*:options:)

```swift theme={null}
func query(_ indexName: String, _ query: String, options: QueryOptions = QueryOptions()) async throws -> SearchResult
```

Runs a semantic search against a loaded index. The index must be loaded with
[`loadIndex(_:options:)`](#loadindex-_options) first; querying an index that has
not been loaded throws. Configure with [`QueryOptions`](../types#queryoptions)
and read matches from the returned [`SearchResult`](../types#searchresult).

| Parameter | Type | Description |
| - | - | - |
| `indexName` | `String` | Name of the loaded index to search. |
| `query` | `String` | Search query text. |
| `options` | `QueryOptions` | `topK`, `alpha`, and metadata filter. |

```swift theme={null}
try await client.loadIndex("docs", options: .init(cachePath: cachePath))
let results = try await client.query("docs", "vector search on mobile")
for doc in results.docs {
  print("\(doc.id): \(doc.score)")
}
```

***

### unloadIndex(\_:)

```swift theme={null}
func unloadIndex(_ name: String) async throws
```

Unloads a previously loaded index, releasing the resources it held. Subsequent
[`query(_:_:options:)`](#query-options) calls for that index throw until it is
loaded again.

***

### addDocs(\_:docs:upsert:)

```swift theme={null}
func addDocs(_ name: String, docs: [DocumentInfo], upsert: Bool = true) async throws -> MutationResult
```

Adds or updates documents in a cloud index and polls until the rebuild
completes. Returns a [`MutationResult`](../types#mutationresult).

| Parameter | Type | Description |
| - | - | - |
| `name` | `String` | Name of the target index. |
| `docs` | `[DocumentInfo]` | Documents to add or update. |
| `upsert` | `Bool` | Update documents that already share an id. Default `true`. |

***

### getDocs(\_:docIds:)

```swift theme={null}
func getDocs(_ name: String, docIds: [String]? = nil) async throws -> [DocumentInfo]
```

Retrieves documents from a cloud index. Pass `docIds` to fetch specific
documents; omit it to fetch all of them. Returns an array of
[`DocumentInfo`](../types#documentinfo).

```swift theme={null}
let all = try await client.getDocs("docs")
let some = try await client.getDocs("docs", docIds: ["1", "2"])
```

***

### deleteDocs(\_:docIds:)

```swift theme={null}
func deleteDocs(_ name: String, docIds: [String]) async throws -> MutationResult
```

Deletes documents from a cloud index by id and polls until the rebuild
completes. Returns a [`MutationResult`](../types#mutationresult).

| Parameter | Type | Description |
| - | - | - |
| `name` | `String` | Name of the target index. |
| `docIds` | `[String]` | Ids of the documents to delete. |

***

### getJobStatus(\_:)

```swift theme={null}
func getJobStatus(_ jobId: String) async throws -> JobStatus
```

Gets the current status of an async job - for example, the job returned by
[`MossSession.pushIndex`](./MossSession#pushindex). Poll until `status` is
`ready`. Returns a [`JobStatus`](../types#jobstatus).

```swift theme={null}
let push = try await session.pushIndex()
while try await client.getJobStatus(push.jobId).status != "ready" {
  try await Task.sleep(nanoseconds: 1_000_000_000)
}
```

***

### deleteIndex(\_:)

```swift theme={null}
func deleteIndex(_ name: String) async throws -> Bool
```

Deletes a cloud index (e.g. one created by
[`MossSession.pushIndex`](./MossSession#pushindex)) and all its data. Returns
`true` if deleted.

***

### onMemoryPressure(\_:)

```swift theme={null}
func onMemoryPressure(_ level: MemoryPressureLevel = .critical) async throws -> Int
```

Frees reclaimable native memory in response to an OS memory-pressure signal.
Wire this from `UIApplication.didReceiveMemoryWarningNotification`. Returns the
number of indexes freed. See [`MemoryPressureLevel`](../types#memorypressurelevel).
