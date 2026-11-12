<!-- Source: https://docs.moss.dev/docs/build/data-hydration-sync.md -->
# Data Hydration & Sync

> Hydrate on-device indexes from the cloud and keep them fresh with zero-downtime hot-swaps.

Moss keeps an on-device index in sync with the cloud in two directions: **hydration**
(loading existing data into memory when you open an index or session) and **refresh**
(picking up cloud updates without reloading the service).

![A cloud index hydrates a loaded index or session on device, auto-refreshes it, and receives push\_index updates](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/data-hydration-sync-light.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=b95d0114e919a8efa91ab34c9b913427)

![A cloud index hydrates a loaded index or session on device, auto-refreshes it, and receives push\_index updates](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/data-hydration-sync-dark.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=c21699cc3fce026e80d35a139fd20e6f)

## Hydration: cloud to device

When you open a [session](https://docs.moss.dev/docs/integrate/sessions.md) or load an index, Moss downloads the
index binary and deserializes it into memory, so the agent starts warm instead of empty. No
re-embedding happens; the prebuilt vectors are loaded directly.

```python theme={null}
from moss import MossClient

client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

# Hydrate a loaded index for querying...
await client.load_index("support-faqs")

# ...or hydrate a session by name (auto-loads the cloud index if it exists).
session = await client.session(index_name="call-123")
```

## Two layers of freshness

Once an index is live, freshness has two independent handles - one for getting changes into
the index, and one for propagating those changes to running agents.

### Layer 1: mutations

`add_docs` and `delete_docs` are the write API. They are asynchronous: you submit the
change, and Moss rebuilds the index server-side without touching your live service. A
mutation moves through statuses (`pending_upload`, `uploading`, `building`, `completed`);
while building, it reports finer-grained phases such as `generating_embeddings` and
`building_index`. Once `completed`, the new version is available in the cloud.

```python theme={null}
from moss import DocumentInfo, MutationOptions

await client.add_docs(
    "product-catalog",
    [DocumentInfo(id="item-9182", text="Wireless headphones, midnight blue, 40-hour battery.",
                  metadata={"category": "audio", "in_stock": "true"})],
    MutationOptions(upsert=True),
)
```

### Layer 2: runtime hot-swap

Load an index with `auto_refresh` and Moss keeps the in-memory copy current automatically:

```python theme={null}
await client.load_index("product-catalog", auto_refresh=True, polling_interval_in_seconds=120)
```

Periodically, Moss checks the cloud for a newer version. If one exists, it downloads in the
background while the current version keeps serving queries; when the download finishes, the
index is hot-swapped atomically. In-flight queries finish against the old version, new
queries immediately see the updated one. No restart, no dropped requests, no coordination.

The refresh path is:

1. Content changes land through `add_docs` or `delete_docs`.
2. Moss builds a new cloud version server-side.
3. `auto_refresh` detects the new version, downloads it in the background, and atomically hot-swaps the loaded index.
4. In-flight queries finish on the old version; new queries use the update.

## Tuning the refresh interval

`polling_interval_in_seconds` controls how often Moss checks for a new version - not how
fast a build completes. Match it to how quickly your data changes:

| Data change frequency | Suggested interval | Notes |
| - | - | - |
| Near-real-time (live inventory, pricing) | 30-60 s | Frequent polls; size your build time accordingly |
| Regular updates (daily policy changes) | 300-600 s | The default of 600 s fits here |
| Infrequent (quarterly docs, stable FAQs) | 1800 s+ | Low overhead; practically always fresh |

To force an immediate update after a known critical change, reload the index explicitly.
This is a blocking call that downloads and installs the latest version:

```python theme={null}
# Force an immediate refresh after a known critical update.
await client.load_index("compliance-rules")
```

## Independent per-index refresh

Each index manages its own refresh lifecycle on its own timer, so you can tune staleness
tolerance per knowledge domain. A slow rebuild on one index never blocks queries or
refreshes on another.

```python theme={null}
await client.load_index("live-inventory",  auto_refresh=True, polling_interval_in_seconds=30)
await client.load_index("support-policies", auto_refresh=True, polling_interval_in_seconds=600)
await client.load_index("legal-archive",    auto_refresh=True, polling_interval_in_seconds=3600)
```

## Persist: device to cloud

A [session](https://docs.moss.dev/docs/integrate/sessions.md) accumulates context locally during an interaction.
`push_index()` syncs it back to the cloud - at the end, or at checkpoints - so it survives
the session and any agent can resume it (see [Cross-agent context & omni-channel handoff](https://docs.moss.dev/docs/build/cross-agent-handoff.md)).

```python theme={null}
await session.push_index()
```

## Convergence

With `auto_refresh` enabled, a loaded index converges to the latest version within at most
one polling interval after the build completes. The hot-swap is atomic: in-flight queries
complete against the previous version, and subsequent queries use the new one.

## Related

> [card] [Live-call context](https://docs.moss.dev/docs/build/live-call-context.md)
>
> Short-term + long-term context during a call.

> [card] [Sessions](https://docs.moss.dev/docs/integrate/sessions.md)
>
> The session lifecycle in depth.
