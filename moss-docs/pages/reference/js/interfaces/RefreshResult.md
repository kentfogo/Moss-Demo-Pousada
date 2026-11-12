<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/RefreshResult.md -->
# RefreshResult

> JavaScript index refresh result fields showing previous and new update timestamps and whether cloud changes were applied.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / RefreshResult

Result of an index refresh operation. Reports whether a loaded index was updated
with a newer version from the cloud.

## Properties

| Property | Type | Description |
| - | - | - |
| `indexName` | `string` | Name of the index that was refreshed. |
| `previousUpdatedAt` | `string` | Timestamp before the refresh operation. |
| `newUpdatedAt` | `string` | Timestamp after the refresh operation. |
| `wasUpdated` | `boolean` | Whether the index was actually updated (true if the cloud had a newer version). |
