<!-- Source: https://docs.moss.dev/docs/reference/python/multi-index-search.md -->
# Multi-index search

> Use the Moss Python SDK to load multiple indexes, query them together, and return a global top-K.

Sometimes the answer is spread across separate corpora - a product catalog, its reviews,
and an FAQ - that you keep as distinct indexes. Multi-index search queries several loaded
indexes in a single call and returns the global top-K, with each result tagged by its source
index. See [`query_multi_index`](./classes/MossClient#query_multi_index-names-query-options)
in the reference.

## Usage

Load the indexes (in bulk with `load_indexes`), then query them together with
`query_multi_index`. Every result document carries an `index_name` so you know where it came
from.

```python theme={null}
import asyncio
from moss import MossClient, QueryOptions

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)
    indexes = ["products", "reviews", "faqs"]

    # Bulk-load (best-effort; one failure does not roll back the others).
    result = await client.load_indexes(indexes)
    print(f"loaded={result.loaded} failed={result.failed}")

    # One query across all three; global top-K, tagged by source.
    results = await client.query_multi_index(
        indexes, "wireless headphones battery life", QueryOptions(top_k=6)
    )
    for doc in results.docs:
        print(f"[{doc.index_name}] {doc.id} score={doc.score:.3f} {doc.text[:60]}")

    await client.unload_indexes(indexes)

asyncio.run(main())
```

## Behavior notes

* All indexes must be loaded locally (via
  [`load_index`](./classes/MossClient#load_index-name-auto_refresh-polling_interval_in_seconds)
  or [`load_indexes`](./classes/MossClient#load_indexes-names-auto_refresh-polling_interval_in_seconds))
  and share the same embedding model. Querying indexes with different models raises an error.
* `top_k` is global, not per-index - it caps the merged result set. The default is `10`
  (single-index `query` defaults to `5`).
* `QueryOptions.alpha` works as in single-index
  [`query`](./classes/MossClient#query-name-query-options) (default `0.8`): `1.0` is
  embedding-only, `0.0` is keyword-only, and values in between fuse both signals with
  Reciprocal Rank Fusion. Keyword scoring runs each index's own BM25 and merges hits by score
  before fusion, so keyword and hybrid ordering across indexes is approximate. `filter` and
  `embedding` work the same as in single-index `query`.

## Bulk lifecycle

`load_indexes(names)` returns a
[`LoadIndexesResult`](./interfaces/LoadIndexesResult) with `loaded` and `failed`. It is
best-effort: a typo in one name does not roll back the others, and reloading an
already-loaded index is idempotent.
[`unload_indexes(names)`](./classes/MossClient#unload_indexes-names) releases them when you
are done.

```python theme={null}
# A typo on one name does not stop the others from loading.
partial = await client.load_indexes(["products", "does-not-exist-xyz"])
print(partial.loaded, partial.failed)
```

## Related

> [card] [Hybrid search](https://docs.moss.dev/docs/reference/python/hybrid-search.md)
>
> How `alpha` blends semantic and keyword scoring.

> [card] [MossClient reference](https://docs.moss.dev/docs/reference/python/classes/MossClient.md)
>
> `query_multi_index`, `load_indexes`, `unload_indexes`.
