<!-- Source: https://docs.moss.dev/docs/integrate/memory-sizing.md -->
# Memory Sizing

> Estimate the memory a server process needs for the embedding model and its loaded indexes, and keep it bounded with many indexes.

On a server, a loaded index lives entirely in process memory: its document text, metadata,
vectors, keyword index and id map. Query time does not grow with the number of loaded indexes, so
what limits how many indexes a process can hold is memory. This page gives the measured costs, a
formula to estimate a process, and the practices that keep memory bounded when you serve many
knowledge bases.

## What a process holds

| What | Memory |
| - | - |
| Python, the SDK and a `MossClient` | 37 MiB |
| Embedding model, once per process | 149 MiB |
| Whole process while the model loads | 370 to 379 MiB |
| Each loaded chunk, in a process holding many indexes | 5.7 to 7.1 KB |
| 500 indexes of 200 chunks each, whole process | 810 to 859 MiB |
| Each further process that loads the same 500 indexes | 786 to 792 MiB more |

Measured with `moss` 1.19.0 and Python 3.12 on Linux (arm64, glibc), with the `moss-minilm` model
and chunks of 800 to 1,200 characters of English text with four metadata fields. Memory is RSS,
which is what a container's memory limit counts. Your text, chunk size and metadata change the cost
per chunk, so check these figures against your own data.

* **The embedding model loads once per process** for each model, with the first load that needs it,
  and every client and session in the process shares it. Opening it briefly holds 2.2 to 2.5 times its
  steady size.
* **A load briefly needs about twice the index's size**, for the download and parse buffers. A
  refresh needs about three times, because the old copy keeps serving queries until the new version
  replaces it.
* **Memory grows linearly** with the number of loaded chunks, and with the number of indexes. Each
  index keeps its own keyword vocabulary, so many small indexes cost 1.5 to 2 times more per chunk
  than one large index with the same chunks. Non-Latin text, such as Hindi, roughly doubled the cost
  per chunk in our test.
* **Processes share nothing.** Each process holds its own model and its own copy of every index it
  loads, even when they use the same `cache_path`. The disk cache saves downloads, not memory.
* **Text query time stays flat.** With 50 or 500 indexes loaded, a text query on one of them took
  about 6 ms at the median and 9 to 10 ms at p95, embedding included.

The JavaScript SDK runs the same core, so plan with the same model and per-chunk figures and
measure the Node.js baseline separately.

## Estimate a process

Plan each process for the larger of two numbers:

* **About 380 MiB plus the indexes loading at the same time**, the peak while the embedding model
  loads. It happens once, with the first load in the process.
* **186 MiB + 7 KB per loaded chunk + twice the largest index**, the steady memory plus room to load
  or refresh the largest index. The steady term already counts the old copy that a refresh keeps
  serving, so twice the index on top covers the refresh's total of about three times. An index of
  `n` chunks takes about `n × 7 KB`.

Add your application's own memory on top: the web framework, the agent runtime, voice activity
detection and other models.

> [accordion] Example: one process holding 500 knowledge bases
>
> 500 knowledge bases of 200 chunks each, all loaded in one process:
>
> * Loaded chunks: 500 × 200 = 100,000, so 100,000 × 7 KB ≈ 668 MiB.
> * Largest index: 200 × 7 KB ≈ 1.3 MiB, twice that ≈ 3 MiB.
> * Steady estimate: 186 + 668 + 3 ≈ 857 MiB, above the 380 MiB model peak.
>
> Plan about 860 MiB for this process. The measured process used 810 to 859 MiB. A second process that
> loads the same 500 indexes needs another 860 MiB.
>
> If all 500 loads start together with the first one, they overlap the model load and can peak at
> about 380 + 668 ≈ 1,048 MiB. Load one index first, then the rest concurrently: the model opens
> with that first index, and the process stays at the steady estimate.

> [accordion] Example: 20 concurrent voice calls on one host
>
> Each call loads 3 knowledge bases of 2,000 chunks each.
>
> With one call per process, as in the default LiveKit setup:
>
> * Per process: 6,000 chunks × 7 KB ≈ 40 MiB, and the largest index ≈ 13 MiB, so
>   186 + 40 + 2 × 13 ≈ 253 MiB steady.
> * The model load sets the peak instead: about 380 MiB, plus the 40 MiB of indexes that load
>   alongside it, so about 420 MiB.
> * 20 calls ≈ 20 × 420 MiB ≈ 8.2 GiB for Moss alone.
>
> With every call in one process (the LiveKit thread executor) and no knowledge base shared between
> calls:
>
> * 60 indexes × 2,000 chunks = 120,000 chunks × 7 KB ≈ 801 MiB.
> * 186 + 801 + 2 × 13 ≈ 1,014 MiB steady for all 20 calls, and less when calls share knowledge
>   bases.
> * If all 60 loads overlap the first model load, the peak is about 380 + 801 ≈ 1,181 MiB, so plan
>   about 1.2 GiB for the process.
>
> See [Process model and index loading](https://docs.moss.dev/docs/integrations/livekit.md#process-model-and-index-loading) for
> the trade-offs.

## Many indexes

### One index per knowledge base

Give each knowledge base, tenant or agent its own index, and load the ones a request needs. Query
time does not depend on how many indexes are loaded, and
[multi-index search](https://docs.moss.dev/docs/integrate/multi-index-search.md) queries several of them in one call.

One large index filtered per tenant is a poor fit:

* **A filtered query still scores every vector** in the index, then drops the ones the filter
  excludes, so every tenant pays for the size of all tenants.
* **Every edit rewrites the whole index.** A new version is rebuilt in full, and every process that
  refreshes it downloads the whole index again.
* **Every process holds every tenant's data**, whether or not it serves them.

### Load on first use, concurrently

Load an index when a request first needs it, with a `cache_path` on persistent storage so a reload
reads it from disk when the cloud copy is unchanged. To load several, start the loads together so
their round trips to the cloud overlap.

```ts JavaScript theme={null}
const names = ['acme-faq', 'acme-policies']

await Promise.all(
  names.map((name) => client.loadIndex(name, { cachePath: '/var/cache/moss' })),
)
```

```python Python theme={null}
import asyncio

client = MossClient(project_id, project_key, cache_path="/var/cache/moss")
names = ["acme-faq", "acme-policies"]

await asyncio.gather(*(client.load_index(name) for name in names))
```

Use one client per process. Clients in a process share the embedding model, but each client holds its
own copy of the indexes it loads.

### Unload idle indexes

A process that serves many knowledge bases over time keeps every index it loads until you unload it.
Track when each index was last queried, and unload the ones that have gone idle with `unload_index` /
`unloadIndex` (or `unload_indexes` / `unloadIndexes` for several). The next request that needs one
loads it again, from the disk cache when the cloud copy is unchanged.

On Linux, glibc keeps freed memory inside the process, so RSS does not drop right after an unload.
Later loads in the same process reuse that memory. To return it to the operating system, call
`malloc_trim` after unloading:

```python theme={null}
import ctypes

await client.unload_indexes(idle)
ctypes.CDLL("libc.so.6").malloc_trim(0)
```

So size a process for the most indexes it holds at once, not the average.

### Refresh sparingly

With `auto_refresh`, each poll makes three requests per index. 500 indexes at the default interval of
600 seconds make 150 requests a minute; at 10 seconds they make 9,000. Keep the default interval or a
longer one when a process holds many indexes, and refresh the indexes you know have changed by loading
them again.

Each poll also counts as session time, so a long-running process with `auto_refresh` on is billed for
session minutes around the clock, even when it serves no calls.

## Related

> [card] [Storage & Persistence](https://docs.moss.dev/docs/integrate/storage-persistence.md)
>
> Disk cache, offline loads and auto-refresh.

> [card] [Releasing Resources](https://docs.moss.dev/docs/integrate/releasing-resources.md)
>
> Close clients and sessions to free memory.
