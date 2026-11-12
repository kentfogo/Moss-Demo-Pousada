<!-- Source: https://docs.moss.dev/docs/reference/js/type-aliases/MossErrorCode.md -->
# MossErrorCode

> The stable code on every error from the native core, and on the SDK errors that set a code.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / MossErrorCode

> **MossErrorCode** = `"INVALID_ARGUMENT"` | `"NOT_FOUND"` | `"UNAUTHORIZED"` | `"NETWORK"` | `"DESERIALIZATION"` | `"MODEL_UNAVAILABLE"` | `"INTERNAL"`

Stable code on every error from the native core, and on the SDK errors that set a code. It
is the `code` of a [`MossError`](../interfaces/MossError) and the value type of
[`LoadIndexesResult.failedCodes`](../interfaces/LoadIndexesResult). Other SDK errors, such as
`MossClient is closed` or `createIndex requires at least one document`, are plain `Error`s
with no code. *(@moss-js/moss 1.16.0+)*

| Code | Meaning |
| - | - |
| `INVALID_ARGUMENT` | The caller passed a value the operation cannot accept. |
| `NOT_FOUND` | The index or other named resource does not exist or is not loaded. |
| `UNAUTHORIZED` | The credentials, token or plan do not permit the operation. |
| `NETWORK` | The Moss service could not be reached or did not answer in time. |
| `DESERIALIZATION` | Index data, a snapshot or a service response could not be decoded. |
| `MODEL_UNAVAILABLE` | The embedding model could not be downloaded, verified or loaded. |
| `INTERNAL` | A failure inside the SDK that the caller cannot correct. |
