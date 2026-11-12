<!-- Source: https://docs.moss.dev/docs/reference/python/interfaces/InvalidArgumentError.md -->
# InvalidArgumentError

> The MossError subclass for INVALID_ARGUMENT, also a ValueError.

[moss](https://docs.moss.dev/docs/reference/python/api.md) / InvalidArgumentError

A [`MossError`](./MossError) with code `INVALID_ARGUMENT`, raised for a value the operation
cannot accept. It is also a `ValueError`, so `except ValueError` still catches it.
`InvalidArgumentError.code` is `"INVALID_ARGUMENT"` on the class too. *(moss 1.15.0+, with
`inferedge-moss-core` 0.27.0)*

Of the `MossError` codes, only `INVALID_ARGUMENT` is a `ValueError`. Every other code
raises a plain `MossError`, a `RuntimeError`, so code that catches `ValueError` around a call
should catch `MossError` as well. Some argument checks in the SDK still raise a bare
`ValueError`, which has no `code`.

## Base classes

* [`MossError`](./MossError)
* `ValueError`

## Properties

Inherits **code** and **detail** from [`MossError`](./MossError).

## Example

```python theme={null}
from moss import InvalidArgumentError

try:
    await client.query_multi_index([], "refund policy")
except InvalidArgumentError as e:
    print(e.code)  # INVALID_ARGUMENT
```
