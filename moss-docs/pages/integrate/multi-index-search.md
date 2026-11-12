<!-- Source: https://docs.moss.dev/docs/integrate/multi-index-search.md -->
# Multi-Index Search

> Search several loaded Moss indexes in one request and combine matches into a global top-K result set.

Sometimes the answer is spread across separate corpora - a product catalog, its reviews,
and an FAQ - that you keep as distinct indexes. **Multi-index search** queries several
loaded indexes in a single call and returns the global top-K, with each result tagged by
its source index.

## How it works

Load the indexes (in bulk with `load_indexes`, or concurrently with one `load_index` per
index under `asyncio.gather`), then query them together with `query_multi_index`. Every
result document carries an `index_name` so you know where it came from. Each loaded index
holds its own memory; see [Memory sizing](https://docs.moss.dev/docs/integrate/memory-sizing.md) to plan for many
indexes.

## Behavior

* **All indexes must be loaded** locally (via `load_index` / `load_indexes`) and **share
  the same embedding model**. Querying indexes with different models returns an error.
* **`top_k` is global**, not per-index - it caps the merged result set. The default is `10`
  (a single-index `query` defaults to `5`).
* **Hybrid via `alpha`**: `alpha` works as in a single-index query (default `0.8`). `1.0`
  is embedding-only, `0.0` is keyword-only, and values in between fuse both signals with
  Reciprocal Rank Fusion. Keyword scoring runs each index's own BM25 and merges hits by
  score before fusion, so keyword and hybrid ordering across indexes is approximate.
  `filter` and `embedding` work the same as in a single-index query.
* **Bulk lifecycle**:
  [`load_indexes(names)`](https://docs.moss.dev/docs/reference/python/classes/MossClient#load_indexes-names-auto_refresh-polling_interval_in_seconds)
  returns a [`LoadIndexesResult`](https://docs.moss.dev/docs/reference/python/interfaces/LoadIndexesResult) with
  `loaded` and `failed` (best-effort; a typo in one name doesn't roll back the others), and
  [`unload_indexes(names)`](https://docs.moss.dev/docs/reference/python/classes/MossClient#unload_indexes-names)
  releases them and is idempotent.

## Implementation

Multi-index search is available in the Python (`query_multi_index`), JavaScript
(`queryMultiIndex`), and Elixir (`Moss.Client.query_multi_index/4`) SDKs, each with
matching bulk `load_indexes` / `unload_indexes` calls. See the
[Python guide](https://docs.moss.dev/docs/reference/python/multi-index-search.md) for a runnable example.

## Related

> [card] [Retrieval](https://docs.moss.dev/docs/integrate/retrieval.md)
>
> Single-index querying, filters, and hybrid search.

> [card] [Python reference](https://docs.moss.dev/docs/reference/python/classes/MossClient.md)
>
> `query_multi_index`, `load_indexes`, `unload_indexes`.
