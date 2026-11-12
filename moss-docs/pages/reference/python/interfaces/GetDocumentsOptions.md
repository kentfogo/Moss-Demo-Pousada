<!-- Source: https://docs.moss.dev/docs/reference/python/interfaces/GetDocumentsOptions.md -->
# GetDocumentsOptions (Python SDK)

> Python deterministic document retrieval options for exact IDs, metadata filters, sorting, and grouping documents by parent.

[moss v1.0.1](https://docs.moss.dev/docs/reference/python/api.md)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / GetDocumentsOptions

Options for `get_docs` — deterministic retrieval (no query vector, no ranking).
See [Exact / Graph Retrieval](https://docs.moss.dev/docs/reference/python/graph-retrieval.md).

## Properties

* **doc\_ids**: `Optional[List[str]]` - Fetch these exact ids, returned in this order. Missing ids are skipped.
* **filter**: `Optional[dict]` - Metadata predicate (same dict shape as [`QueryOptions.filter`](./QueryOptions) / [metadata filtering](https://docs.moss.dev/docs/reference/python/metadata-filtering.md)). *(moss 1.6.0+)*
* **sort\_by**: `Optional[str]` - Metadata field to order results by (numeric-aware). *(moss 1.6.0+)*
* **ascending**: `Optional[bool]` - Sort direction for `sort_by`; defaults to ascending. *(moss 1.6.0+)*
* **group\_by**: `Optional[ParentGrouping]` - Collapse sibling docs sharing a parent id into one result per unit. See [`ParentGrouping`](./ParentGrouping). *(moss 1.6.0+)*
