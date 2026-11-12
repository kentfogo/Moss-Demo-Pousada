<!-- Source: https://docs.moss.dev/docs/reference/swift/types.md -->
# Moss Swift SDK types

> Structs and enums used across the Moss Swift SDK.

[Swift SDK](https://docs.moss.dev/docs/reference/swift/api.md) / Types

Reference for the structs and enums passed to and returned from
[`MossClient`](./classes/MossClient) and [`MossSession`](./classes/MossSession).

## DocumentInfo

A document stored in or returned from an index. Conforms to `Codable`.

```swift theme={null}
public struct DocumentInfo: Codable {
    public let id: String
    public let text: String
    public let metadata: [String: String]?   // optional, defaults to nil
    public let embedding: [Float]?            // optional, defaults to nil
    public let payload: String?              // optional, verbatim — defaults to nil
}
```

| Field | Type | Description |
| - | - | - |
| `id` | `String` | Unique document id. |
| `text` | `String` | Document text (embedded and searched). |
| `metadata` | `[String: String]?` | Optional string key/value metadata, usable in filters. |
| `embedding` | `[Float]?` | Optional pre-computed embedding. Required when the session/index uses the `"custom"` model. |
| `payload` | `String?` | Optional opaque structured payload, stored and returned verbatim — never embedded or searched. See [Exact / Graph Retrieval](https://docs.moss.dev/docs/reference/swift/graph-retrieval.md#verbatim-structured-payload). |

Store an `Encodable` value as the payload with the `structured:` initializer, and
read it back typed with `decodedPayload(_:)`:

```swift theme={null}
public init<P: Encodable>(id: String, text: String,
                          metadata: [String: String]? = nil,
                          embedding: [Float]? = nil, structured: P) throws
public func decodedPayload<P: Decodable>(_ type: P.Type) throws -> P?
```

## QueryOptions

```swift theme={null}
public struct QueryOptions {
    public var topK: Int        // default 5
    public var alpha: Float     // default 0.8
    public var filter: Filter?
    public var filterJson: String?
    public var groupByParent: ParentGrouping?
}
```

| Field | Type | Description |
| - | - | - |
| `topK` | `Int` | Number of results to return. Default `5`. |
| `alpha` | `Float` | Hybrid blend: `1.0` = pure semantic, `0.0` = pure keyword. Default `0.8` (semantic-heavy). |
| `filter` | [`Filter?`](#filter) | Typed metadata filter (preferred). Takes precedence over `filterJson` when both are set. |
| `filterJson` | `String?` | Legacy metadata filter as a JSON string (`$eq`, `$and`, `$in`, `$near`, …). |
| `groupByParent` | [`ParentGrouping?`](#parentgrouping) | Collapse sibling hits sharing a parent id into one result per unit. |

See [Querying](https://docs.moss.dev/docs/reference/swift/querying.md) for hybrid-search examples and
[Exact / Graph Retrieval](https://docs.moss.dev/docs/reference/swift/graph-retrieval.md) for the typed `Filter` DSL and
parent grouping.

## SearchResult

Returned by `query(...)`.

```swift theme={null}
public struct SearchResult {
    public let docs: [QueryResult]
    public let query: String
    public let timeMs: UInt64
}
```

## QueryResult

A single match within a [`SearchResult`](#searchresult).

```swift theme={null}
public struct QueryResult {
    public let id: String
    public let score: Float
    public let text: String
    public let metadata: [String: String]?
    public let payload: String?
}
```

`payload` is the document's verbatim structured payload (`nil` when it has none);
read it typed with `decodedPayload(_:)` — see
[Verbatim structured payload](https://docs.moss.dev/docs/reference/swift/graph-retrieval.md#verbatim-structured-payload).

## Filter

A composable, typed metadata predicate used by
[`getDocs(where:)`](./classes/MossSession#getdocs-wheresortbyascending) and
[`QueryOptions.filter`](#queryoptions). Serialized internally to the engine's
filter format — no JSON to hand-write. See
[the Filter DSL](https://docs.moss.dev/docs/reference/swift/graph-retrieval.md#the-filter-dsl) for examples.

```swift theme={null}
public indirect enum Filter {
    case equals(String, FilterValue)
    case notEquals(String, FilterValue)
    case greaterThan(String, FilterValue)
    case greaterThanOrEqual(String, FilterValue)
    case lessThan(String, FilterValue)
    case lessThanOrEqual(String, FilterValue)
    case isIn(String, [FilterValue])
    case notIn(String, [FilterValue])
    case near(field: String, lat: Double, lng: Double, withinMeters: Double)
    case and([Filter])
    case or([Filter])
    case raw(String)   // escape hatch: raw engine-format JSON
}
```

Range comparisons (`greaterThan`, `lessThanOrEqual`, …) compare two plain decimals
as numbers even though metadata is stored as strings (`"9" < "50"`), two other
values as text, and never match a plain decimal against text. See
[how ranges compare](https://docs.moss.dev/docs/integrate/metadata-filtering.md#how-ranges-compare). `.raw` with invalid JSON
throws rather than silently matching everything.

## FilterValue

A typed metadata value used inside a [`Filter`](#filter). Literal-expressible, so
you can write `"shoes"`, `27`, `0.7`, or `false` directly wherever a
`FilterValue` is expected.

```swift theme={null}
public enum FilterValue {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)
}
```

## ParentGrouping

Collapses sibling documents that share a parent id into one result per unit,
assembling sibling text in `orderField` order (numeric-aware). Passed to
[`GetDocsOptions.groupByParent`](#getdocsoptions) and
[`QueryOptions.groupByParent`](#queryoptions).

```swift theme={null}
public struct ParentGrouping {
    public var parentField: String   // e.g. "article_id"
    public var orderField: String    // e.g. "chunk_index"
}
```

## GetDocsOptions

Full-control input to
[`getDocs(options:)`](./classes/MossSession#getdocs-options). Combine an id list,
a metadata filter, sorting, and parent grouping in one deterministic fetch.

```swift theme={null}
public struct GetDocsOptions {
    public var ids: [String]?            // exact ids, returned in this order
    public var filter: Filter?           // metadata predicate
    public var sortBy: String?           // metadata field to order by (numeric-aware)
    public var ascending: Bool           // default true
    public var groupByParent: ParentGrouping?
}
```

See [Exact / Graph Retrieval](https://docs.moss.dev/docs/reference/swift/graph-retrieval.md) for worked examples.

## ModelRef

Reference to an embedding model with version information. Surfaced on
[`IndexInfo`](#indexinfo).

```swift theme={null}
public struct ModelRef {
    public let id: String
    public let version: String?
}
```

| Field | Type | Description |
| - | - | - |
| `id` | `String` | Model identifier. |
| `version` | `String?` | Model version (semver or build identifier). |

## IndexInfo

Metadata about a cloud index. Returned by
[`getIndex`](./classes/MossClient#getindex-_) and
[`listIndexes`](./classes/MossClient#listindexes).

```swift theme={null}
public struct IndexInfo {
    public let id: String
    public let name: String
    public let status: String
    public let docCount: Int
    public let model: ModelRef
    public let version: String?
    public let createdAt: String?
    public let updatedAt: String?
}
```

| Field | Type | Description |
| - | - | - |
| `id` | `String` | Unique identifier of the index. |
| `name` | `String` | Human-readable name of the index. |
| `status` | `String` | Current build status (e.g. `NotStarted`, `Building`, `Ready`, `Failed`). |
| `docCount` | `Int` | Number of documents in the index. |
| `model` | `ModelRef` | Embedding model bound to the index. |
| `version` | `String?` | Index build/format version. |
| `createdAt` | `String?` | When the index was created. |
| `updatedAt` | `String?` | When the index was last updated. |

## SessionOptions

Passed to [`MossClient.session(_:options:)`](./classes/MossClient#session-_options).

```swift theme={null}
public struct SessionOptions {
    public var modelId: String?              // optional, defaults to nil
    public var vectorQuantization: VectorQuantization = .default
    public var autoLoadOnInit: Bool = true
}
```

| Field | Type | Description |
| - | - | - |
| `modelId` | `String?` | Embedding model id. `nil` = platform default (`moss-litelm` on iOS). Pass `"custom"` to supply embeddings via `DocumentInfo.embedding`. |
| `vectorQuantization` | [`VectorQuantization`](#vectorquantization) | On-disk vector precision used when persisting with `MossSession.save(toCachePath:)`. Defaults to `.default` (platform-appropriate). |
| `autoLoadOnInit` | `Bool` | When `true` (the default), `session(_:options:)` auto-loads the named index from the cloud at creation. Set `false` for a local-only, disk-first session: creation returns immediately and you load it yourself (restore from disk, hitting the cloud only on a miss). |

> [!WARNING]
>
> With `autoLoadOnInit: false` the session starts empty until you load it. Calling
> `pushIndex()` on a session you never loaded overwrites the cloud index with the
> near-empty local one — use it for read-only or load-then-mutate flows.

## VectorQuantization

On-disk vector precision for [`SessionOptions`](#sessionoptions), applied when a
session is persisted with `MossSession.save(toCachePath:)`.

```swift theme={null}
public enum VectorQuantization: UInt8 {
    case `default` = 0   // platform-appropriate (INT8 on iOS)
    case fp32 = 1        // full 32-bit precision
    case int8 = 2        // 8-bit scalar quantization (smaller on disk)
}
```

## PushIndexResult

Returned by [`MossSession.pushIndex()`](./classes/MossSession#pushindex). Poll
`jobId` with [`getJobStatus`](./classes/MossClient#getjobstatus-_) until
`status` is `ready`.

```swift theme={null}
public struct PushIndexResult {
    public let jobId: String
    public let indexName: String
    public let docCount: Int
    public let status: String
}
```

## MutationResult

Returned by the cloud document operations
[`createIndex`](./classes/MossClient#createindex-_docsmodelid),
[`addDocs`](./classes/MossClient#adddocs-_docsupsert), and
[`deleteDocs`](./classes/MossClient#deletedocs-_docids) after the operation
completes.

```swift theme={null}
public struct MutationResult {
    public let jobId: String
    public let indexName: String
    public let docCount: Int
}
```

| Field | Type | Description |
| - | - | - |
| `jobId` | `String` | Identifier of the async job that performed the mutation. |
| `indexName` | `String` | Name of the index that was mutated. |
| `docCount` | `Int` | Number of documents in the index after the mutation. |

## RefreshResult

Returned by [`refreshIndex`](./classes/MossClient#refreshindex-_).

```swift theme={null}
public struct RefreshResult {
    public let indexName: String
    public let previousUpdatedAt: String
    public let newUpdatedAt: String
    public let wasUpdated: Bool
}
```

| Field | Type | Description |
| - | - | - |
| `indexName` | `String` | Name of the index that was refreshed. |
| `previousUpdatedAt` | `String` | Timestamp before the refresh. |
| `newUpdatedAt` | `String` | Timestamp after the refresh. |
| `wasUpdated` | `Bool` | `true` when a newer cloud version was applied. |

## LoadIndexesResult

Returned by `MossClient.loadIndexes(_:options:)`, which loads several indexes in one
call. Best-effort: indexes that load are kept even when others fail.

```swift theme={null}
public struct LoadIndexesResult: Sendable {
    public let loaded: [String]
    public let failed: [String: String]
    public let failedCodes: [String: Int32]
}
```

| Field | Type | Description |
| - | - | - |
| `loaded` | `[String]` | Names of the indexes that loaded. |
| `failed` | `[String: String]` | Names that failed to load, mapped to the error message: the same fixed text a thrown [`MossError`](#mosserror) carries. |
| `failedCodes` | `[String: Int32]` | Names that failed to load, mapped to the [`MossError`](#mosserror) code, such as `MossError.notFound`. Empty when the linked libmoss does not report codes. *(0.8.0+)* |

## JobStatus

Returned by [`getJobStatus`](./classes/MossClient#getjobstatus-_).

```swift theme={null}
public struct JobStatus {
    public let jobId: String
    public let status: String
    public let progress: Double
    public let currentPhase: String?
    public let error: String?
    public let createdAt: String
    public let updatedAt: String
    public let completedAt: String?
}
```

## MemoryPressureLevel

Passed to [`onMemoryPressure`](./classes/MossClient#onmemorypressure-_).

```swift theme={null}
public enum MemoryPressureLevel: UInt8 {
    case low = 0        // hint: drop hot caches
    case critical = 1   // drop everything reclaimable; on-disk caches kept
}
```

## MossError

Thrown for any failure reported by the underlying runtime. Conforms to
`LocalizedError`, so `error.localizedDescription` returns the message.

```swift theme={null}
public struct MossError: LocalizedError {
    public let code: Int32
    public let message: String
    public let detail: String?
}
```

| Field | Type | Description |
| - | - | - |
| `code` | `Int32` | The libmoss result code for the kind of failure. Compare it with the constants below. |
| `message` | `String` | Fixed text for each kind of core failure, with no URLs, file paths or index names. An argument the SDK rejects keeps its own text. |
| `detail` | `String?` | The core error text when the linked libmoss exports `moss_last_error_detail`, release builds included, at most 512 bytes. The Foundation error when the model cache directory cannot be created. `nil` otherwise. Diagnostic text for logs and support, not a stable contract. *(0.8.0+)* |

The code constants name the libmoss result codes, so you can compare `error.code`
without literals. *(0.8.0+)* See [Error codes](https://docs.moss.dev/docs/reference/errors.md#error-codes).

| Constant | Value | Meaning |
| - | - | - |
| `MossError.nullPointer` | `-1` | A required pointer argument was NULL, or the client or session is already closed. |
| `MossError.invalidArgument` | `-2` | An argument was rejected. |
| `MossError.network` | `-3` | The Moss service could not be reached or did not answer in time. |
| `MossError.notFound` | `-4` | The index does not exist or is not loaded. |
| `MossError.modelUnavailable` | `-5` | The embedding model could not be downloaded, verified or loaded. |
| `MossError.internalError` | `-7` | A failure inside the SDK. |
| `MossError.unauthorized` | `-8` | The project credentials, token or plan were rejected. |
| `MossError.deserialization` | `-9` | Index data, a snapshot or a service response could not be decoded. |

```swift theme={null}
do {
    try await client.loadIndex("faqs")
} catch let error as MossError where error.code == MossError.notFound {
    print("Index not found:", error.detail ?? error.message)
}
```
