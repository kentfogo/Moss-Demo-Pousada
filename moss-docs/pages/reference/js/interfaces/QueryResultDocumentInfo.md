<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/QueryResultDocumentInfo.md -->
# QueryResultDocumentInfo (JavaScript SDK)

> JavaScript query result document fields, including searchable text, metadata, vector relevance score, and source index name.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / QueryResultDocumentInfo

Document result from a query, with its relevance score.

## Extends

* [`DocumentInfo`](./DocumentInfo)

## Properties

| Property | Type | Description | Inherited from |
| - | - | - | - |
| `id` | `string` | Unique identifier within an index. | [`DocumentInfo`](./DocumentInfo).[`id`](./DocumentInfo#properties) |
| `text` | `string` | REQUIRED canonical text to embed/search. | [`DocumentInfo`](./DocumentInfo).[`text`](./DocumentInfo#properties) |
| `metadata?` | `Record`\<`string`, `string`> | Optional metadata associated with the document. | [`DocumentInfo`](./DocumentInfo).[`metadata`](./DocumentInfo#properties) |
| `embedding?` | `number`\[] | Optional caller-provided embedding vector. | [`DocumentInfo`](./DocumentInfo).[`embedding`](./DocumentInfo#properties) |
| `score` | `number` | Relevance to the query from 0 to 1. It comes from vector similarity alone, so rank never changes it and every `alpha` above 0 gives the same value. Results are ordered by hybrid relevance, so a lower-ranked result can show a higher score. A keyword-only query (`alpha` 0, or an index without vectors) scores every hit 0. Scores depend on the embedding model: tune `minScore` on your own queries. See [Score semantics](https://docs.moss.dev/docs/integrate/retrieval.md#score-semantics). *(@moss-js/moss 1.15.0+)* | - |
| `indexName?` | `string` | Source index name. Set on [`queryMultiIndex()`](../classes/MossClient#querymultiindex) results; absent for single-index queries. | - |
