<!-- Source: https://docs.moss.dev/docs/reference/python/interfaces/QueryResultDocumentInfo.md -->
# QueryResultDocumentInfo (Python SDK)

> Python query result document fields for text, metadata, vector relevance score, source index, and stored structured payload.

[moss v1.4.0](https://docs.moss.dev/docs/reference/python/api.md)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / QueryResultDocumentInfo

QueryResultDocumentInfo

## Properties

* **id**: `str`
* **text**: `str`
* **metadata**: `Optional[Dict[str, str]]`
* **score**: `float` - Relevance to the query from 0 to 1. It comes from vector similarity alone, so rank never changes it and every `alpha` above 0 gives the same value. Results are ordered by hybrid relevance, so a lower-ranked result can show a higher score. A keyword-only query (`alpha` 0, or an index without vectors) scores every hit 0. Scores depend on the embedding model: tune `min_score` on your own queries. See [Score semantics](https://docs.moss.dev/docs/integrate/retrieval.md#score-semantics). *(moss 1.14.0+)*
* **index\_name**: `Optional[str]` - Source index for the result. Set by [`query_multi_index()`](../classes/MossClient#query_multi_index-names-query-options); `None` for single-index queries.
* **payload**: `Optional[str]` - Opaque structured value stored at index time, returned verbatim; `None` when the document has none. See [Structured payload](https://docs.moss.dev/docs/reference/python/structured-payload.md). *(moss 1.5.0+)*
