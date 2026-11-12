<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/LoadIndexOptions.md -->
# LoadIndexOptions

> JavaScript index loading options for automatic refresh, polling intervals, and caching downloaded index data to disk.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / LoadIndexOptions

## Properties

| Property | Type | Description |
| - | - | - |
| `autoRefresh?` | `boolean` | Whether to enable auto-refresh polling for this index. When enabled, the index will periodically check for updates from the cloud. **Default** `false` |
| `pollingIntervalInSeconds?` | `number` | Polling interval in seconds. Only used when autoRefresh is true. **Default** `600 (10 minutes)` |
| `cachePath?` | `string` | Filesystem path for caching index data to disk. When set, downloaded indexes are persisted and reused on subsequent loads if the cloud data hasn't changed. Auto-refresh also writes to this cache. |
