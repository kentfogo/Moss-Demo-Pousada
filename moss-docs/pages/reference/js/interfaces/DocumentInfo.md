<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/DocumentInfo.md -->
# DocumentInfo (JavaScript SDK)

> JavaScript document fields for indexing and retrieval: ID, searchable text, metadata, and optional caller-provided embeddings.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / DocumentInfo

Document that can be indexed and retrieved.

## Extended by

* [`QueryResultDocumentInfo`](./QueryResultDocumentInfo)

## Properties

| Property | Type | Description |
| - | - | - |
| `id` | `string` | Unique identifier within an index. |
| `text` | `string` | REQUIRED canonical text to embed/search. |
| `metadata?` | `Record`\<`string`, `string`> | Optional metadata associated with the document. |
| `embedding?` | `number`\[] | Optional caller-provided embedding vector. |
