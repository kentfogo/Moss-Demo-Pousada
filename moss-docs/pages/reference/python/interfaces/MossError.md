<!-- Source: https://docs.moss.dev/docs/reference/python/interfaces/MossError.md -->
# MossError (Python SDK)

> The exception raised for every failure the Moss native core reports.

[moss](https://docs.moss.dev/docs/reference/python/api.md) / MossError

A `RuntimeError` subclass raised for every failure the native core reports. Branch on
`code`, not on the message: the message is fixed text for each kind of failure, such as
`Index not found.`, with no URLs, file paths or index names. *(moss 1.15.0+, with
`inferedge-moss-core` 0.27.0)*

[`InvalidArgumentError`](./InvalidArgumentError) is the subclass raised for
`INVALID_ARGUMENT`. Not every exception the SDK raises is a `MossError`: a closed
`MossClient` raises a plain `RuntimeError`, a filter value of the wrong type raises
`TypeError`, some argument checks raise a bare `ValueError`, and web source methods raise
`ManageApiError` (see [Web sources](https://docs.moss.dev/docs/reference/python/web-sources.md)). None of these has a `code`.

## Properties

* **code**: `Optional[str]` - The kind of failure, stable across releases: `INVALID_ARGUMENT`, `NOT_FOUND`, `UNAUTHORIZED`, `NETWORK`, `DESERIALIZATION`, `MODEL_UNAVAILABLE` or `INTERNAL`. Every `MossError` the SDK raises sets it. See [Error codes](https://docs.moss.dev/docs/reference/errors.md#error-codes).
* **detail**: `Optional[str]` - The core error text, for logs and support, at most 512 bytes. Released wheels carry it too. Diagnostic text, not a stable contract. `None` when there is none.

## Example

```python theme={null}
from moss import MossError

try:
    results = await client.query("faqs", "refund policy")
except MossError as e:
    if e.code != "NOT_FOUND":
        raise
    await client.load_index("faqs")
    results = await client.query("faqs", "refund policy")
```
