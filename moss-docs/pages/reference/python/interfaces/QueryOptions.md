<!-- Source: https://docs.moss.dev/docs/reference/python/interfaces/QueryOptions.md -->
# QueryOptions (Python SDK)

> Python query options for embeddings, result count, hybrid weighting, metadata filters, grouping, and score controls.

[moss v1.0.1](https://docs.moss.dev/docs/reference/python/api.md)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / QueryOptions

Optional parameters for `MossClient.query()`.

## Properties

| Property | Type | Description |
| - | - | - |
| `embedding` | `Optional[Sequence[float]]` | Caller-provided query embedding. When supplied, the service/client skips embedding generation. |
| `top_k` | `Optional[int]` | Number of top results to return. |
| `alpha` | `Optional[float]` | Weight for hybrid search fusion. `1.0` = pure semantic, `0.0` = pure keyword. **Default** `0.8`. |
| `filter` | `Optional[dict]` | Metadata filter applied to the query. Honored on locally loaded indexes; load the index (or open a session) before querying with a filter. |
| `group_by` | `Optional[ParentGrouping]` | Collapse sibling hits sharing a parent id into one result per unit. See [`ParentGrouping`](./ParentGrouping) and [Exact / Graph Retrieval](https://docs.moss.dev/docs/reference/python/graph-retrieval.md). *(moss 1.6.0+)* |
| `min_score` | `Optional[float]` | Drops results whose `score` is below this floor, from 0 to 1. A query returns up to `top_k` results that clear it, in hybrid order. Rejected on a keyword-only query (`alpha=0`). `SessionIndex.query` ignores it. *(moss 1.14.0+)* |
| `candidate_depth` | `Optional[int]` | How many hits a hybrid query ranks on each signal before fusion. A hit outside both lists is never returned, so a deeper list raises recall and query time. Defaults to `2 * top_k`. A set value must be at least 1 and is raised to `top_k` when below it. Keyword-only and vector-only queries (`alpha` 0 or 1) ignore it. Used by `MossClient.query` and `query_multi_index`; `SessionIndex.query` ignores it. *(moss 1.14.0+)* |

## Filter shape

The `filter` value is a dict with either a field condition or a logical
composition:

```python theme={null}
# Field condition
{"field": "city", "condition": {"$eq": "NYC"}}

# Logical composition
{"$and": [filter_a, filter_b, ...]}
{"$or":  [filter_a, filter_b, ...]}
```

Supported condition operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`,
`$in`, `$nin`, `$near`.

## Example

```python theme={null}
from moss import QueryOptions

options = QueryOptions(
    top_k=5,
    alpha=0.6,
    filter={
        "$and": [
            {"field": "category", "condition": {"$eq": "shoes"}},
            {"field": "price",    "condition": {"$lt": 100}},
        ],
    },
)
```
