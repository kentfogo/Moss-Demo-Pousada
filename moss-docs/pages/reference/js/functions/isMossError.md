<!-- Source: https://docs.moss.dev/docs/reference/js/functions/isMossError.md -->
# isMossError

> Narrows a caught value to a MossError with a stable code.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / isMossError

> **isMossError**(`error`): `error is` [`MossError`](../interfaces/MossError)

True when `error` is an `Error` whose `code` is one of the
[`MossErrorCode`](../type-aliases/MossErrorCode) values. Every failure from the native core
passes, and so does an argument the SDK rejects with a code, such as `queryMultiIndex([])`.
A plain `Error` the SDK throws without a code, such as `MossClient is closed`, does not, and
neither does a [`ManageApiError`](../web-sources) from the web source methods.
*(@moss-js/moss 1.16.0+)*

## Parameters

| Parameter | Type | Description |
| - | - | - |
| `error` | `unknown` | The value to test, usually a caught error. |

## Returns

`error is` [`MossError`](../interfaces/MossError)

## Example

```typescript theme={null}
import { isMossError } from '@moss-js/moss'

let results
try {
  results = await client.query('faqs', 'refund policy')
} catch (error) {
  if (!isMossError(error) || error.code !== 'NOT_FOUND') throw error
  await client.loadIndex('faqs')
  results = await client.query('faqs', 'refund policy')
}
```
