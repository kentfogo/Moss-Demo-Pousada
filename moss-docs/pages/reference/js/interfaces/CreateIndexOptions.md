<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/CreateIndexOptions.md -->
# CreateIndexOptions

> JavaScript index creation options for choosing an embedding model and receiving build progress updates.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / CreateIndexOptions

Options for creating an index.

## Properties

| Property | Type | Description |
| - | - | - |
| `modelId?` | `string` | Embedding model to use. Defaults to "moss-minilm", or "custom" if documents have pre-computed embeddings. |
| `onProgress?` | (`progress`) => `void` | Callback invoked with progress updates (\~every 2s) while the server is processing. |
