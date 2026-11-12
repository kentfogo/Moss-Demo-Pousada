<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/MossError.md -->
# MossError (JavaScript SDK)

> An Error with a stable code, from the native core or the SDK.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / MossError

An `Error` with a stable `code`, from the native core or the SDK. A core failure carries
fixed text for each kind of failure, such as `Index not found.`, and `detail` holds the core
error text. A `MossError` the SDK raises itself describes its cause and has no `detail`.
Not every SDK error is a `MossError`: a closed client or session, `createIndex` with no
documents and the custom-embedding checks throw a plain `Error` with no `code`.
*(@moss-js/moss 1.16.0+)*

`MossError` is a type, not a class. Narrow a caught value with
[`isMossError`](../functions/isMossError) rather than `instanceof`.

## Extends

* `Error`

## Properties

| Property | Type | Description |
| - | - | - |
| `code` | [`MossErrorCode`](../type-aliases/MossErrorCode) | The kind of failure, stable across releases. Branch on it instead of the message. |
| `detail?` | `string` | The core error text, for logs and support, at most 512 bytes. Diagnostic text, not a stable contract. |

See [Error codes](https://docs.moss.dev/docs/reference/errors.md#error-codes).
