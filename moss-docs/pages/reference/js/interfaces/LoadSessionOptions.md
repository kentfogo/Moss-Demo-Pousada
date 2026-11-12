<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/LoadSessionOptions.md -->
# LoadSessionOptions

> JavaScript session index loading options for polling newer cloud versions and pausing refresh while local edits are pending.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / LoadSessionOptions

Options for [`SessionIndex.loadIndex()`](../classes/SessionIndex#loadindex) when pulling an
existing cloud index into a session.

## Properties

| Property | Type | Description |
| - | - | - |
| `autoRefresh?` | `boolean` | When `true`, the SDK starts a background poller that pulls newer cloud versions of this index into the session at the configured interval. Paused automatically while the session has un-pushed local edits. **Default** `false` |
| `pollingIntervalInSeconds?` | `number` | Poll interval in seconds. Only used when `autoRefresh` is `true`. **Default** `600 (10 minutes)` |
