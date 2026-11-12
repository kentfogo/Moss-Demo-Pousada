<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/ParseFileInput.md -->
# ParseFileInput (JavaScript SDK)

> JavaScript file input fields for PDF and DOCX parsing, using a file path or in-memory bytes with a unique name and content type.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / ParseFileInput

Input descriptor for a single file in the parse pipeline. Either `path` (server/Node.js) or
`data` (in-memory) must be provided.

## Properties

| Property | Type | Description |
| - | - | - |
| `name` | `string` | File identifier sent to the server. Required. Must be unique within the call - uploads are matched back to files by name. |
| `contentType` | `string` | MIME content type. Required. Supported values are `"application/pdf"` and `"application/vnd.openxmlformats-officedocument.wordprocessingml.document"` (DOCX). |
| `path?` | `string` | Filesystem path to the file (Node.js / server-side). Required when `data` is not provided. |
| `data?` | `Uint8Array` \| `ArrayBuffer` \| `Blob` \| `File` | Raw file bytes (in-memory). Takes precedence over `path` when provided. `Buffer` also works (it is a `Uint8Array` subclass). |
