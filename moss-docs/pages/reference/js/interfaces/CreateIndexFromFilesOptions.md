<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/CreateIndexFromFilesOptions.md -->
# CreateIndexFromFilesOptions

> JavaScript options for file-based index creation, including the embedding model, text extraction controls, and progress callbacks.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / CreateIndexFromFilesOptions

Options for creating an index from files via the parse pipeline.

## Properties

| Property | Type | Description |
| - | - | - |
| `modelId?` | `"moss-minilm"` \| `"moss-mediumlm"` | Embedding model to use. Defaults to `"moss-minilm"`. `"custom"` is not supported - the parse pipeline generates embeddings server-side. |
| `parseOptions?` | [`ParseOptions`](./ParseOptions) | Extraction controls, including OCR mode and chunk size. Omit for server defaults. |
| `onProgress?` | (`progress`) => `void` | Callback invoked with progress updates (\~every 2s) while the server is processing. |
