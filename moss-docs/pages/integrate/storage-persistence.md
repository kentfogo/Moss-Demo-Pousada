<!-- Source: https://docs.moss.dev/docs/integrate/storage-persistence.md -->
# Storage & Persistence

> Persist loaded indexes to disk and keep them in sync with the cloud.

## How indexes are stored

Indexes live in the cloud. The SDKs fetch them into memory with
`loadIndex()` / `load_index()` so queries run locally without network round
trips. The canonical copy is always the cloud index - your local process holds
an in-memory snapshot for fast retrieval.

## Disk cache

The Node (`@moss-js/moss`) and Python SDKs can cache the downloaded index to disk so subsequent loads skip
the download when the cloud data hasn't changed. Each load still checks the
cloud for a newer version. Pass a cache directory to `loadIndex()` /
`load_index()`:

```ts JavaScript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(projectId, projectKey)

await client.loadIndex('my-index', {
  cachePath: '/var/cache/moss',
})
```

```python Python theme={null}
from moss import MossClient

client = MossClient(project_id, project_key)

await client.load_index("my-index", cache_path="/var/cache/moss")
```

Auto-refresh writes through to the same cache, so restarts stay warm.

The cache saves downloads, not memory: every process that loads an index holds its own copy in
memory, even when processes share a `cache_path`. See [Memory sizing](https://docs.moss.dev/docs/integrate/memory-sizing.md).

In Python, `cache_path` on `load_index()` and `load_indexes()` requires `moss`
**1.11.0+**. With `moss` **1.14.0+**, `MossClient(project_id, project_key, cache_path=...)`
sets a default for every load, and a per-call `cache_path` overrides it. In JavaScript,
the `cachePath` client option only sets where the device id file lives, so pass
`cachePath` to each `loadIndex()` or `loadIndexes()` call.

### Loading from the cache offline

Requires `moss` **1.14.0+** (Python) or `@moss-js/moss` **1.15.0+** (JavaScript).

When a snapshot is already on disk, a load checks the cloud once within 5 seconds
instead of retrying. If the cloud is unreachable or answers with a temporary error,
such as a 429 or 503, the load serves the snapshot instead of failing. It also starts
a refresh poller, even without auto-refresh, so the index catches up when the cloud
returns. A 401, 403 or 404 still fails, so a forbidden or deleted index does not come
back from cache. In Python,
[`was_served_stale(name)`](https://docs.moss.dev/docs/reference/python/classes/MossClient#was_served_stale-name)
reports whether an index is served from the snapshot.

A snapshot saved by `moss` 1.13.0 or earlier, or by `@moss-js/moss` 1.14.0 or earlier, is not
served until the index is downloaded again, which happens when the cloud copy changes. A snapshot
saved under another project or cloud origin is never served.

Until the cloud is reachable, a built-in embedding model may not open, so text queries
with `alpha` above 0 can fail. Keyword-only queries (`alpha` 0) and queries that pass
their own embedding keep working.

## Hot reload & auto-refresh

Enable `autoRefresh` to periodically poll the cloud and hot-swap the
in-memory index when a newer version is detected - in-flight queries are not
interrupted.

```ts JavaScript theme={null}
await client.loadIndex('my-index', {
  autoRefresh: true,
  pollingIntervalInSeconds: 300, // every 5 minutes
})
```

```python Python theme={null}
await client.load_index(
    "my-index",
    auto_refresh=True,
    polling_interval_in_seconds=300,
)
```

Calling `loadIndex()` again without `autoRefresh` stops the polling loop and
loads the index again, from the disk cache when a `cachePath` is set and the cloud copy
is unchanged. A load served from the cache while the cloud is unreachable starts the
poller anyway, as described in [Loading from the cache offline](#loading-from-the-cache-offline).

Each poll counts as session time, so a long-running process with auto-refresh on is billed for
session minutes around the clock, even when it serves no queries. To pick up an edit you know about,
load the index again instead.
