<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/MutationResult.md -->
# MutationResult (JavaScript SDK)

> JavaScript result fields returned after index creation or document mutations complete: job ID, index name, and document count.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / MutationResult

Result of an async mutation operation (createIndex, addDocs, deleteDocs).
Returned after the operation completes (polling is handled internally).

## Properties

| Property | Type |
| - | - |
| `jobId` | `string` |
| `indexName` | `string` |
| `docCount` | `number` |
