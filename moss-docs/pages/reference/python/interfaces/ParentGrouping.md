<!-- Source: https://docs.moss.dev/docs/reference/python/interfaces/ParentGrouping.md -->
# ParentGrouping

> Python configuration for grouping sibling documents by parent metadata and assembling them in a chosen order.

[moss v1.6.0](https://docs.moss.dev/docs/reference/python/api.md)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / ParentGrouping

Collapse sibling documents that share a parent id into one result per unit,
assembled in `order_field` order (numeric-aware). Passed to
[`GetDocumentsOptions.group_by`](./GetDocumentsOptions) and
[`QueryOptions.group_by`](./QueryOptions). See
[Exact / Graph Retrieval](https://docs.moss.dev/docs/reference/python/graph-retrieval.md). *(moss 1.6.0+)*

```python theme={null}
from moss import ParentGrouping

ParentGrouping("article_id", "chunk_index")
```

## Constructor

* **ParentGrouping(parent\_field: str, order\_field: str)**

## Properties

* **parent\_field**: `str` - Metadata field whose value identifies the parent unit (e.g. `"article_id"`).
* **order\_field**: `str` - Metadata field used to order siblings before collapsing (numeric-aware, e.g. `"chunk_index"`).
