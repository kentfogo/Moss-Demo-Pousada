<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/LoadIndexesResult.md -->
# LoadIndexesResult (JavaScript SDK)

> JavaScript bulk index loading results, including loaded names and per-index failure messages and error codes.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / LoadIndexesResult

Result of a [`loadIndexes()`](../classes/MossClient#loadindexes) call.

## Properties

| Property | Type | Description |
| - | - | - |
| `loaded` | `string`\[] | Names of the indexes that loaded. |
| `failed` | `Record`\<`string`, `string`> | Names that failed to load, mapped to the error message. |
| `failedCodes?` | `Record`\<`string`, [`MossErrorCode`](../type-aliases/MossErrorCode)> | Names that failed to load, mapped to the error code, such as `NOT_FOUND`. `@moss-js/moss-core` 0.31.0, which this release depends on, always sets it. *(@moss-js/moss 1.16.0+)* |
