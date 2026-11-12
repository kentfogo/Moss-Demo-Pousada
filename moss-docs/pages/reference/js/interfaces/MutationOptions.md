<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/MutationOptions.md -->
# MutationOptions (JavaScript SDK)

> JavaScript document mutation options for upserting matching IDs and receiving asynchronous progress callbacks.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / MutationOptions

Options for async mutation operations (addDocs, deleteDocs).

## Properties

| Property | Type | Description |
| - | - | - |
| `upsert?` | `boolean` | Whether to update existing documents with the same ID. Only applies to addDocs. **Default** `true` |
| `onProgress?` | (`progress`) => `void` | Callback invoked with progress updates (\~every 2s) while the server is processing. |
