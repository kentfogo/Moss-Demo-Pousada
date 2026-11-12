<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/SearchResult.md -->
# SearchResult (JavaScript SDK)

> JavaScript search response containing ranked documents, the original query, source index name, and query timing.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / SearchResult

Search operation result.

## Properties

| Property | Type | Description |
| - | - | - |
| `docs` | [`QueryResultDocumentInfo`](./QueryResultDocumentInfo)\[] | Matching documents in hybrid relevance order. |
| `query` | `string` | The original search query. |
| `indexName?` | `string` | Name of the index that was searched. |
| `timeTakenInMs?` | `number` | Time taken to execute the search in milliseconds. |
