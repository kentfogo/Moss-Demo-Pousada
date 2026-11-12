<!-- Source: https://docs.moss.dev/docs/reference/swift/classes/MossSession.md -->
# MossSession

> On-device index for local embedding, search, persistence, and cloud sync.

[Swift SDK](https://docs.moss.dev/docs/reference/swift/api.md) / MossSession

An on-device index handle for a single index, returned by
[`MossClient.session(_:options:)`](./MossClient#session-_options). All embedding
runs locally with the bundled model; queries don't hit the network.

A session can be persisted to disk (`save` / `loadFromDisk`) or synced to the
cloud (`pushIndex` / `loadIndex`).

The class is thread-safe. `close()` (also called on `deinit`) blocks until
in-flight calls return before freeing the native handle.

## Example

```swift theme={null}
let session = try await client.session("notes")
defer { session.close() }

_ = try await session.addDocs([
  .init(id: "1", text: "first note"),
  .init(id: "2", text: "second note"),
])

let result = try await session.query("first")
result.docs.forEach { print($0.score, $0.id) }
```

## Properties

### name

```swift theme={null}
var name: String
```

The index name this session was opened against.

### docCount

```swift theme={null}
var docCount: Int
```

Current document count in the index.

## Methods

### close()

```swift theme={null}
func close()
```

Sends the final usage report, then frees the native handle. Blocks until in-flight
calls return, then waits up to 2 seconds for the report to arrive. Idempotent; also
called on `deinit`. Later calls throw `MossError` with the message
`MossSession already closed`.

***

### addDocs(\_:upsert:)

```swift theme={null}
func addDocs(_ docs: [DocumentInfo], upsert: Bool = true) async throws -> (added: Int, updated: Int)
```

Adds or upserts documents, embedding them on-device. Returns the counts of rows
added (new ids) and updated (existing ids). Takes
[`[DocumentInfo]`](../types#documentinfo).

***

### deleteDocs(\_:)

```swift theme={null}
func deleteDocs(_ docIds: [String]) async throws -> Int
```

Deletes documents by id. Returns the number actually deleted (missing ids are
ignored).

***

### getDocs(\_:)

```swift theme={null}
func getDocs(_ docIds: [String]? = nil) async throws -> [DocumentInfo]
```

Returns documents by id, or all documents when `docIds` is `nil`. An empty
array returns nothing. Returns [`[DocumentInfo]`](../types#documentinfo).

### getDocs(ids:)

```swift theme={null}
func getDocs(ids: [String]) async throws -> [DocumentInfo]
```

Deterministic fetch of exact ids, returned **in the order requested**. Missing
ids are skipped.

### getDocs(where:sortBy:ascending:)

```swift theme={null}
func getDocs(where filter: Filter, sortBy: String? = nil, ascending: Bool = true) async throws -> [DocumentInfo]
```

Fetch by a metadata predicate — no embedding, no similarity ranking. Build
`filter` with the typed [`Filter`](../types#filter) DSL; `sortBy` orders by a
metadata field (numeric-aware).

### getDocs(options:)

```swift theme={null}
func getDocs(options: GetDocsOptions) async throws -> [DocumentInfo]
```

Full-control deterministic fetch — combine `ids`, `filter`, `sortBy`,
`ascending`, and `groupByParent` via [`GetDocsOptions`](../types#getdocsoptions).

See the [Exact / Graph Retrieval](https://docs.moss.dev/docs/reference/swift/graph-retrieval.md) guide for worked examples
of all four overloads, the `Filter` DSL, and parent grouping.

***

### query(\_:options:)

```swift theme={null}
func query(_ q: String, options: QueryOptions = QueryOptions()) async throws -> SearchResult
```

Embeds `q` on-device and runs a local similarity search. Tune with
[`QueryOptions`](../types#queryoptions) - hybrid `alpha` and metadata
filtering are covered in the [Querying guide](https://docs.moss.dev/docs/reference/swift/querying.md). Returns a
[`SearchResult`](../types#searchresult).

### query(\_:embedding:options:)

```swift theme={null}
func query(_ q: String, embedding: [Float]?, options: QueryOptions = QueryOptions()) async throws -> SearchResult
```

Search variant that takes a caller-provided embedding, bypassing the on-device
model forward pass.

***

### save(toCachePath:)

```swift theme={null}
func save(toCachePath cachePath: String? = nil) async throws
```

Persists the session's index to disk under `cachePath` so it can be reopened
on the next launch without re-embedding. Without a path, the snapshot goes in
the app's `Library/Caches/moss/sessions/<project id>/`, which the system may
purge, or in `sessions/<project id>/` under the `MOSS_SESSION_CACHE_PATH`
environment variable when it is set. Only session snapshots read that variable.

***

### loadFromDisk(cachePath:)

```swift theme={null}
@discardableResult
func loadFromDisk(cachePath: String? = nil) async throws -> Int
```

Restores a session previously written with `save(toCachePath:)`. Without a path,
it reads the directory that `save(toCachePath:)` uses without one. Returns the
document count restored. The session's name must match the one used at save
time.

```swift theme={null}
try await session.save()
session.close()

let restored = try await client.session("notes")
try await restored.loadFromDisk()
```

***

### pushIndex()

```swift theme={null}
func pushIndex() async throws -> PushIndexResult
```

Pushes the in-memory session to the cloud as a server-side index. Returns a
[`PushIndexResult`](../types#pushindexresult) with a `jobId`; poll
[`MossClient.getJobStatus`](./MossClient#getjobstatus-_) until the status is
`ready`.

***

### loadIndex(\_:)

```swift theme={null}
func loadIndex(_ indexName: String) async throws -> Int
```

Pulls a server-side index into this session as a one-time hydration (returns
the doc count loaded, `0` if no such cloud index). The session then behaves as
a local one - subsequent add/delete/query don't hit the network.

```swift theme={null}
let push = try await session.pushIndex()
while try await client.getJobStatus(push.jobId).status != "ready" {
  try await Task.sleep(nanoseconds: 1_000_000_000)
}

let restored = try await client.session(push.indexName)
_ = try await restored.loadIndex(push.indexName)
let hits = try await restored.query("how do transformers work", options: .init(topK: 3))
```
