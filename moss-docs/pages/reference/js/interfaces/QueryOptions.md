<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/QueryOptions.md -->
# QueryOptions (JavaScript SDK)

> JavaScript query controls for embeddings, result count, hybrid weighting, metadata filters, score thresholds, and candidate depth.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / QueryOptions

Optional parameters for semantic queries.

## Properties

| Property | Type | Description |
| - | - | - |
| `embedding?` | `number`\[] | Caller-provided embedding vector. When supplied, the service/client skips embedding generation. |
| `topK?` | `number` | Number of top results to return. Overrides method-level defaults. |
| `alpha?` | `number` | Weight for hybrid search fusion. `1.0` = pure semantic, `0.0` = pure keyword. **Default** `0.8`. |
| `filter?` | `any` | Optional metadata filter applied to the query. Supports field conditions and `$and` / `$or` composition. Pass a plain object in the shape described under [`MetadataFilter`](../type-aliases/MetadataFilter), with operators from [`FilterCondition`](../type-aliases/FilterCondition). The package does not export either type. |
| `minScore?` | `number` | Minimum `score` a hit must reach, from 0 to 1. Drops hits below it; a query returns up to `topK` hits that clear it, in hybrid order. Rejected on a keyword-only query (`alpha === 0`). Session queries ignore it. *(@moss-js/moss 1.15.0+)* |
| `candidateDepth?` | `number` | How many hits a hybrid query (`alpha` between 0 and 1) ranks on each signal before fusion. A hit outside both lists is never returned, so a deeper list raises recall and query time. Defaults to `2 * topK`. A set value must be at least 1 and is raised to `topK` when below it. Keyword-only and vector-only queries (`alpha` 0 or 1) ignore it. Used by `query()` and [`queryMultiIndex()`](../classes/MossClient#querymultiindex); session queries ignore it. *(@moss-js/moss 1.15.0+)* |
