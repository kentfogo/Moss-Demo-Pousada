<!-- Source: https://docs.moss.dev/docs/reference/python/interfaces/ParseFileInput.md -->
# ParseFileInput (Python SDK)

> Python PDF or DOCX input descriptor with a unique name, content type, and either a filesystem path or raw bytes.

[moss](https://docs.moss.dev/docs/reference/python/api.md) / ParseFileInput

Input descriptor for a single file in the parse pipeline. Either `path` (filesystem path) or
`data` (raw bytes) must be provided. Both `name` and `content_type` are required.

## Properties

* **name**: `str` - file identifier sent to the server; must be unique within the call
* **content\_type**: `str` - `"application/pdf"` or `"application/vnd.openxmlformats-officedocument.wordprocessingml.document"` (DOCX)
* **path**: `Optional[str]` - filesystem path to the file
* **data**: `Optional[bytes]` - raw file bytes; takes precedence over `path` when provided
