<!-- Source: https://docs.moss.dev/docs/reference/python/graph-retrieval.md -->
# Exact / Graph Retrieval (Python SDK)

> Deterministic fetch by id or metadata, sorting, and parent grouping on a session.

Alongside semantic [`query`](./api), a [`SessionIndex`](./classes/SessionIndex)
supports **deterministic retrieval** — exact lookups that run with *no embedding
and no similarity ranking*. Use it when you know precisely which documents you
want: fetch by id, filter by metadata, and group chunks back into their parent
unit. All of it runs locally on the session.

> [!NOTE]
>
> Requires `moss` **1.6.0+** (which pulls `inferedge-moss-core` `0.19.0`). This is
> the Python counterpart to the [Swift exact/graph retrieval](https://docs.moss.dev/docs/reference/swift/graph-retrieval.md)
> surface.

In the examples below, `session` is a [`SessionIndex`](./classes/SessionIndex)
opened with `session = await client.session(index_name, model_id=...)`. The
deterministic fetches are configured through
[`GetDocumentsOptions`](./interfaces/GetDocumentsOptions) passed to
`session.get_docs`; parent grouping is also available on semantic
`session.query` via [`QueryOptions.group_by`](./interfaces/QueryOptions).

## Fetch by id (exact, ordered)

Returns documents in the **exact order requested**; missing ids are skipped.

```python theme={null}
from moss import GetDocumentsOptions

docs = await session.get_docs(GetDocumentsOptions(doc_ids=["doc_42", "doc_17", "doc_88"]))
# -> [doc_42, doc_17, doc_88], minus any id that doesn't exist
```

## Fetch by metadata (filter + sort)

Pass a `filter` — the same dict shape used for [metadata filtering](https://docs.moss.dev/docs/reference/python/metadata-filtering.md)
on queries — to fetch every matching document, with no query vector and no
ranking. `sort_by` orders by a metadata field (numeric-aware); `ascending`
defaults to `True`.

```python theme={null}
# Every published doc, newest first.
published = await session.get_docs(GetDocumentsOptions(
    filter={"field": "status", "condition": {"$eq": "published"}},
    sort_by="updated_at",
    ascending=False,
))

# Compose with $and / $or, numeric-aware comparisons, $in, $near — same as queries.
shoes = await session.get_docs(GetDocumentsOptions(
    filter={"$and": [
        {"field": "category", "condition": {"$eq": "shoes"}},
        {"field": "price", "condition": {"$lt": "100"}},
    ]},
    sort_by="price",
))
```

## Group chunks into their parent record

When a logical record (a long document, an article, a transcript) is stored as
several sibling chunks that share a parent id,
[`ParentGrouping`](./interfaces/ParentGrouping) collapses them into one result —
sibling text assembled in `order_field` order (numeric-aware), the best score
kept.

```python theme={null}
from moss import GetDocumentsOptions, ParentGrouping

articles = await session.get_docs(GetDocumentsOptions(
    filter={"field": "kind", "condition": {"$eq": "chunk"}},
    group_by=ParentGrouping("article_id", "chunk_index"),
))
# One document per article_id; .text is the chunks joined in chunk_index order.
```

Grouping also works on semantic `query` via
[`QueryOptions.group_by`](./interfaces/QueryOptions), which collapses sibling
hits into one result per record:

```python theme={null}
from moss import QueryOptions, ParentGrouping

result = await session.query("how vector search works", QueryOptions(
    top_k=5,
    group_by=ParentGrouping("article_id", "chunk_index"),
))
```

> [!NOTE]
>
> For **complete** records, prefer `get_docs(..., group_by=...)` — it groups over
> the full matching set. On the semantic `query` path, grouping over-fetches
> candidates and returns `top_k` records, but a record whose siblings fall outside
> the fetched window may still be partially assembled; raise `top_k` for wider
> coverage.

## Mixing exact and semantic

There's no blended call — run the two and combine. A common pattern: semantic
`query` to rank candidates, then `get_docs(doc_ids=...)` to pull the exact,
fully-populated records (with [payloads](https://docs.moss.dev/docs/reference/python/structured-payload.md)) for the winners.

```python theme={null}
ranked = await session.query("waterproof hiking boots", QueryOptions(top_k=10))
ids = [d.id for d in ranked.docs]
full = await session.get_docs(GetDocumentsOptions(doc_ids=ids))  # exact order
```

## Related

> [card] [Structured payload](https://docs.moss.dev/docs/reference/python/structured-payload.md)
>
> Carry the full verbatim record alongside the embedded text.

> [card] [Metadata filtering](https://docs.moss.dev/docs/reference/python/metadata-filtering.md)
>
> The filter dict shape, shared with queries.
