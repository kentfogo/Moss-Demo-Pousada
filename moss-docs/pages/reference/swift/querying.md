<!-- Source: https://docs.moss.dev/docs/reference/swift/querying.md -->
# Querying

> Hybrid search and metadata filtering with the Moss Swift SDK.

[Swift SDK](https://docs.moss.dev/docs/reference/swift/api.md) / Querying

[`MossSession.query`](./classes/MossSession#query-_options) takes a
[`QueryOptions`](./types#queryoptions) that controls result count, the
semantic/keyword blend, and metadata filtering.

## Result count

`topK` caps how many documents come back (default `5`).

```swift theme={null}
let r = try await session.query("running shoes", options: .init(topK: 3))
```

## Hybrid search (`alpha`)

`alpha` blends dense (semantic) and sparse (keyword) scoring:

* `1.0` - pure semantic
* `0.0` - pure keyword
* `0.8` - default (semantic-heavy)

```swift theme={null}
// Pure keyword - exact term matches rank highest
try await session.query("running shoes", options: .init(topK: 3, alpha: 0.0))

// Default - semantic-heavy hybrid
try await session.query("running shoes", options: .init(topK: 3))

// Pure semantic - meaning over exact words
try await session.query("running shoes", options: .init(topK: 3, alpha: 1.0))
```

Sweep `alpha` against your eval set to find the blend that maximizes recall for
your data.

## Metadata filtering

Attach metadata when you add documents:

```swift theme={null}
try await session.addDocs([
  .init(id: "p1", text: "Running shoes with breathable mesh.",
        metadata: ["category": "shoes", "price": "79", "city": "new-york",
                   "location": "40.7580,-73.9855"]),
])
```

> [!TIP]
>
> Prefer the typed [`Filter`](./types#filter) DSL over hand-written JSON — set
> [`QueryOptions.filter`](./types#queryoptions) (e.g. `.equals("category", "shoes")`)
> and skip the escaping. See [the Filter DSL](https://docs.moss.dev/docs/reference/swift/graph-retrieval.md#the-filter-dsl).
> The `filterJson` string below remains supported as an escape hatch.

Then restrict a query to matching documents with `filterJson` - a JSON **string**
describing the filter. A single-field filter has the shape:

```json theme={null}
{ "field": "<name>", "condition": { "<operator>": <value> } }
```

Combine clauses with `$and` / `$or`:

```json theme={null}
{ "$and": [ { "field": "...", "condition": { ... } }, { "field": "...", "condition": { ... } } ] }
```

### Operators

| Operator | Meaning | Example value |
| - | - | - |
| `$eq` / `$ne` | equals / not equals | `"shoes"` |
| `$gt` / `$gte` / `$lt` / `$lte` | greater than, greater than or equal to, less than, less than or equal to: as numbers when both values are plain decimals, as text when neither is, never otherwise ([how ranges compare](https://docs.moss.dev/docs/integrate/metadata-filtering.md#how-ranges-compare)) | `"100"` |
| `$in` / `$nin` | in / not in a list | `["new-york", "seattle"]` |
| `$near` | within a radius of a point, `"lat,lng,radiusMeters"` | `"40.7580,-73.9855,5000"` |
| `$and` / `$or` | combine clauses | array of clauses |

### Examples

Swift raw string literals (`#"..."#`) let you write the JSON without escaping
quotes:

```swift theme={null}
// $eq - category == shoes
let eq = #"{"field":"category","condition":{"$eq":"shoes"}}"#
try await session.query("comfortable footwear", options: .init(topK: 5, alpha: 0.5, filterJson: eq))

// $and - shoes AND price < 100
let and = #"{"$and":[{"field":"category","condition":{"$eq":"shoes"}},{"field":"price","condition":{"$lt":"100"}}]}"#
try await session.query("running shoes", options: .init(topK: 5, alpha: 0.6, filterJson: and))

// $in - city in [new-york]
let inList = #"{"field":"city","condition":{"$in":["new-york"]}}"#
try await session.query("everyday gear", options: .init(topK: 5, filterJson: inList))

// $near - within 5km of a coordinate
let near = #"{"field":"location","condition":{"$near":"40.7580,-73.9855,5000"}}"#
try await session.query("city products", options: .init(topK: 5, filterJson: near))
```

Each hit's metadata is returned on
[`QueryResult.metadata`](./types#queryresult), so you can inspect or
post-process the matched fields.

## Custom embeddings

To use your own embedding model instead of the on-device one, open the session
with `modelId: "custom"`. Moss then skips on-device embedding and you supply the
vectors yourself - both when adding documents and when querying:

```swift theme={null}
let session = try await client.session("docs", modelId: "custom")

// Provide a precomputed embedding per document via DocumentInfo.embedding.
try await session.addDocs([
  .init(id: "1", text: "First document",  embedding: myVectors["1"]),
  .init(id: "2", text: "Second document", embedding: myVectors["2"]),
])

// Query with a precomputed query embedding (from your own model).
let queryVec: [Float] = myModel.vector(for: "search text")
let hits = try await session.query("search text", embedding: queryVec, options: .init(topK: 5))
```

All embeddings must share the same dimension, and query vectors must match it.

## Fetch by id

To pull specific documents back (for example, to follow references between
records), use [`getDocs`](./classes/MossSession#getdocs-_):

```swift theme={null}
let docs = try await session.getDocs(["p1", "p3"])
```

For deterministic retrieval — exact fetch in a guaranteed order, metadata-only
filtering, parent grouping, and verbatim payloads — see the
[Exact / Graph Retrieval](https://docs.moss.dev/docs/reference/swift/graph-retrieval.md) guide.
