<!-- Source: https://docs.moss.dev/docs/reference/python/interfaces/DocumentInfo.md -->
# DocumentInfo (Python SDK)

> Python document fields for IDs, searchable text, metadata, optional embeddings, and structured payloads stored without searching.

[moss v1.0.1](https://docs.moss.dev/docs/reference/python/api.md)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / DocumentInfo

DocumentInfo

## Properties

* **id**: `str`
* **text**: `str`
* **metadata**: `Optional[Dict[str, str]]`
* **embedding**: `Optional[Sequence[float]]`
* **payload**: `Optional[str]` - Opaque structured value (e.g. a JSON string) stored and returned verbatim; never embedded or searched. See [Structured payload](https://docs.moss.dev/docs/reference/python/structured-payload.md). *(moss 1.5.0+)*
