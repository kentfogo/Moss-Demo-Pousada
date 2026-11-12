<!-- Source: https://docs.moss.dev/docs/reference/swift/graph-retrieval.md -->
# Exact / Graph Retrieval (Swift SDK)

> Deterministic fetch by id or metadata, typed filters, parent grouping, and verbatim payloads with the Moss Swift SDK.

[Swift SDK](https://docs.moss.dev/docs/reference/swift/api.md) / Exact / Graph Retrieval

Alongside semantic [`query`](./querying), a session supports **deterministic
retrieval** — exact lookups that run with *no embedding and no similarity
ranking*. Use it when you know precisely which documents you want: fetch by id,
filter by metadata, group chunks back into their parent record, and carry a
verbatim structured payload alongside the embedded text.

All of these run on [`MossSession`](./classes/MossSession) and are fully local —
no network round trip.

> [!NOTE]
>
> Requires the Moss iOS SDK **v0.6.2+** (`.package(url: "https://github.com/usemoss/moss", from: "0.6.2")`).

## Fetch by id (exact, ordered)

`getDocs(ids:)` returns documents in the **exact order requested**. Missing ids
are skipped (no error, no gap).

```swift theme={null}
let docs = try await session.getDocs(ids: ["doc_42", "doc_17", "doc_88"])
// -> [doc_42, doc_17, doc_88], minus any id that doesn't exist
```

Passing `nil` returns every document (handy for inspection, expensive on large
indexes); an **empty array returns nothing**:

```swift theme={null}
let all = try await session.getDocs()        // everything
let none = try await session.getDocs(ids: []) // []
```

## Fetch by metadata (typed filter)

`getDocs(where:)` returns every document matching a metadata predicate — no
query string, no ranking. Build predicates with the typed `Filter` DSL instead
of hand-written JSON:

```swift theme={null}
// Every published document, newest first.
let published = try await session.getDocs(
  where: .equals("status", "published"),
  sortBy: "updated_at",
  ascending: false
)
```

`sortBy` orders results by a metadata field (numeric-aware, so `"9" < "50"`);
`ascending` defaults to `true`. Omit `sortBy` for a deterministic id order.

### The `Filter` DSL

[`Filter`](./types#filter) values compose, and [`FilterValue`](./types#filtervalue)
is literal-expressible — pass `"shoes"`, `27`, `0.7`, or `false` directly:

```swift theme={null}
.equals("category", "shoes")                    // ==
.notEquals("status", "archived")                // !=
.greaterThanOrEqual("price", 100)               // >=  (numeric-aware)
.lessThan("price", 50)                          // <
.isIn("city", ["new-york", "seattle"])          // in a set
.notIn("status", ["draft"])                     // not in a set
.near(field: "location", lat: 40.7580, lng: -73.9855, withinMeters: 5000)
```

Combine with `.and` / `.or` (they nest):

```swift theme={null}
// shoes under $100
let f: Filter = .and([
  .equals("category", "shoes"),
  .lessThan("price", 100),
])
let hits = try await session.getDocs(where: f, sortBy: "price")
```

> [accordion] Escape hatch: raw filter JSON
>
> If you already have an engine-format filter string, wrap it with `.raw`. Invalid
> JSON surfaces as a thrown `MossError` rather than silently matching everything:
>
> ```swift theme={null}
> let f: Filter = .raw(#"{"field":"category","condition":{"$eq":"shoes"}}"#)
> ```

The same typed `Filter` works on semantic search too — set
[`QueryOptions.filter`](./types#queryoptions) to restrict a `query` to matching
documents (it takes precedence over the legacy `filterJson` string):

```swift theme={null}
let r = try await session.query("comfortable footwear", options: .init(
  topK: 5,
  filter: .equals("category", "shoes")
))
```

## Group chunks into their parent record

When a logical record (a long document, an article, a transcript) is stored as
several sibling chunks that share a parent id, `ParentGrouping` collapses them
into one result — sibling text assembled in `orderField` order (numeric-aware),
the best score kept.

```swift theme={null}
let articles = try await session.getDocs(options: .init(
  filter: .equals("kind", "chunk"),
  groupByParent: ParentGrouping(parentField: "article_id", orderField: "chunk_index")
))
// One DocumentInfo per article_id; .text is the chunks joined in chunk_index order.
```

[`GetDocsOptions`](./types#getdocsoptions) is the full-control entry point —
`ids`, `filter`, `sortBy`, `ascending`, and `groupByParent` in one call.

Grouping also works on semantic `query` via
[`QueryOptions.groupByParent`](./types#queryoptions), which collapses sibling
hits into one result per record:

```swift theme={null}
let r = try await session.query("how vector search works", options: .init(
  topK: 5,
  groupByParent: ParentGrouping(parentField: "article_id", orderField: "chunk_index")
))
```

> [!NOTE]
>
> For **complete** records, prefer `getDocs(where:…, groupByParent:)` — it groups
> over the full matching set. On the semantic `query` path, grouping over-fetches
> candidates and returns `topK` records, but a record whose siblings fall outside
> the fetched window may still be partially assembled. Raise `topK` if you need
> wider coverage there.

## Verbatim structured payload

Each document can carry an opaque `payload` stored and returned **unchanged** —
never embedded, never searched. It's the place for the structured record behind
the embedded text (the source row, the full object, anything `Codable`).

Write it from any `Encodable` with the `structured:` initializer:

```swift theme={null}
struct Product: Codable {
  let sku: String
  let name: String
  let tags: [String]
  let price: Double
}

let product = Product(sku: "SKU-42", name: "Trail Runner",
                      tags: ["shoes", "running"], price: 79.0)

try await session.addDocs([
  try DocumentInfo(
    id: "p42",
    text: "Lightweight trail running shoe with a grippy outsole.",  // embedded + searched
    metadata: ["category": "shoes", "price": "79"],                // filterable
    structured: product                                            // verbatim payload
  )
])
```

Read it back, decoded to your type, from either a fetch or a query hit:

```swift theme={null}
let docs = try await session.getDocs(ids: ["p42"])
let product = try docs.first?.decodedPayload(Product.self)

let r = try await session.query("trail running shoes")
let top = try r.docs.first?.decodedPayload(Product.self)
```

`decodedPayload(_:)` returns `nil` when a document has no payload. The raw string
is also available as `DocumentInfo.payload` / `QueryResult.payload`. Indexes
written before a payload was attached load with `payload == nil` — no migration,
no format break.

## Mixing exact and semantic

There's no blended call — run the two and combine client-side. A common pattern:
semantic `query` to rank candidates, then `getDocs(ids:)` to pull the exact,
fully-populated records (with payloads) for the winners:

```swift theme={null}
let ranked = try await session.query("waterproof hiking boots", options: .init(topK: 10))
let ids = ranked.docs.map(\.id)
let full = try await session.getDocs(ids: ids)   // exact order, with payloads
```
