<!-- Source: https://docs.moss.dev/docs/reference/js/web-sources.md -->
# Web Sources (JavaScript SDK)

> Create and resync website sources in the Moss JavaScript SDK to keep searchable index content current.

A web source crawls a website into an index and keeps it up to date. The `MossClient` web
source methods are typed wrappers over the [`/v1/manage` web source
actions](https://docs.moss.dev/docs/api-reference/v1/web-sources/createWebSource): each call goes to the Moss
cloud API with your project key, needs no index loaded locally, and works wherever the SDK
runs.

> [!NOTE]
>
> Requires `@moss-js/moss` **1.10.0+**. Also available in Python as
> [`create_web_source`](../python/web-sources) and the other web source methods (`moss`
> **1.10.0+**). Crawling, manual re-sync, and scheduled refresh are plan gated; see
> [Pricing](https://docs.moss.dev/docs/pricing.md).

```typescript theme={null}
import { MossClient, ManageApiError } from '@moss-js/moss'

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

async function waitForJob(jobId: string) {
  for (;;) {
    const job = await client.getJobStatus(jobId)
    if (job.status === 'completed') return
    if (job.status === 'failed') throw new Error(`job failed: ${job.error ?? ''}`)
    await new Promise((r) => setTimeout(r, 5000))
  }
}

// Two sites, one index. The first call creates the index; the second adds to it.
const docs = await client.createWebSource('https://docs.yoursite.com', 'support-kb', {
  maxPages: 500,
  maxDepth: 3,
  refreshCadence: 'weekly',
})
const blog = await client.createWebSource('https://blog.yoursite.com', 'support-kb', {
  maxPages: 200,
})
await waitForJob(docs.jobId)
await waitForJob(blog.jobId)

await client.loadIndex('support-kb')
const results = await client.query('support-kb', 'how do I rotate an API key')
```

## Methods

| Method | Returns | What it does |
| - | - | - |
| `createWebSource(rootUrl, indexName, options?)` | [`CreateWebSourceResult`](#the-websource-record) | Registers the site on the index and starts a crawl. `jobId` polls the crawl. |
| `listWebSources(indexName?)` | `WebSource[]` | Every source in the project, newest first, or only the sources on one index. |
| `getWebSource(sourceId)` | `WebSource` | One source with its settings, schedule, and last-run stats. |
| `updateWebSource(sourceId, options)` | `UpdateWebSourceResult` | Changes settings or cadence. With `resync: true` a crawl starts right away and `jobId` is set. |
| `resyncWebSource(sourceId)` | `ResyncWebSourceResult` | Re-crawls one source. `jobId` polls the crawl. |
| `deleteWebSource(sourceId)` | `DeleteWebSourceResult` | Removes the source and its pages. `purgeJobId` polls the removal. The index is kept. |

These methods need the project key. A client built with a custom authenticator instead of a
key throws `Web source methods require a project key`.

## Several sites on one index

* An index holds up to 20 web sources. Each root URL can be registered once per index; the
  URL with and without a trailing slash is the same source, and a repeat is refused with
  status 409.
* Each source's pages are tracked separately. A crawl or re-sync replaces only that source's
  pages, and `deleteWebSource` removes only that source's pages. Other sources and documents
  added with `addDocs` are never touched.
* Crawls on the same index run one at a time. A crawl requested while another runs queues
  and starts on its own; you do not need to wait between `createWebSource` calls.
* Every source on an index uses the index's embedding model, fixed when the index is
  created.

## Create options

`CreateWebSourceOptions`, all optional:

| Option | Default | Notes |
| - | - | - |
| `maxPages` | `500` | Page cap per crawl run, max `5000`. Your plan's crawl size caps it further. |
| `maxDepth` | `3` | Link depth from `rootUrl`, max `10`. |
| `maxDocuments` | `50000` | Cap on indexed chunks. |
| `includePaths` | none | Only crawl matching path globs, e.g. `['/blog/*']`. Up to 50. |
| `excludePaths` | none | Skip matching path globs. Up to 50. |
| `respectRobots` | `true` | Honor robots.txt. |
| `parseDocuments` | `true` | Parse linked PDF and DOCX files into the index (50 MB per file, 20 per run). |
| `refreshCadence` | none | `'daily'` or `'weekly'` for scheduled re-crawls. Omit for a manual source. |
| `modelId` | `'moss-minilm'` | Or `'moss-mediumlm'`. Only used when the index is created. |

## Update options

`UpdateWebSourceOptions`. Fields you leave out stay
unchanged; crawl settings apply on the next crawl.

| Option | Notes |
| - | - |
| `refreshCadence` | `'daily'`, `'weekly'`, or `'manual'`. Changing it resets the schedule to now plus the interval. |
| `rootUrl` | Re-point the source. The next crawl indexes the new site and drops the old site's pages. |
| `includePaths`, `excludePaths` | Path globs. Pass `[]` to clear. |
| `maxDepth`, `maxPages` | New caps for future crawls. |
| `resync` | `true` starts a crawl after saving; the result carries `jobId`. |

Crawl settings cannot change while the source is crawling (status 409); the cadence can.
`maxDocuments`, `respectRobots`, and `parseDocuments` are changed through the
[`updateWebSource` API action](https://docs.moss.dev/docs/api-reference/v1/web-sources/updateWebSource).

## The WebSource record

Every method except delete returns a `WebSource`:

| Field | Notes |
| - | - |
| `id` | Source ID, used by the other methods. |
| `indexName`, `rootUrl` | The index and the registered URL (a bare origin gains a trailing slash). |
| `maxPages`, `maxDocuments`, `maxDepth`, `includePaths?`, `excludePaths?`, `respectRobots`, `parseDocuments` | Crawl settings. |
| `refreshCadence`, `nextRefreshAt` | `'daily'`, `'weekly'`, or `'manual'`, and when the next scheduled run is due (`null` for manual). |
| `status` | `'crawling'` while a run is queued or active, `'idle'`, `'failed'`, or `'removing'` while a delete purges its pages. |
| `lastCrawledAt`, `lastPageCount`, `lastDocCount` | Stats from this source's last completed run. |
| `lastErrorCode` | Moss error code from the last failed run, or `null`. |

`CreateWebSourceResult` adds `jobId`. `UpdateWebSourceResult` adds `jobId` when `resync` was
`true`. `ResyncWebSourceResult` is `{ id, jobId, status }`. `DeleteWebSourceResult` is
`{ deleted, id, purgeJobId? }`; `purgeJobId` is absent when there was nothing to purge, for
example when the index was already deleted.

## Polling jobs

Crawl and purge jobs are polled with `getJobStatus(jobId)`, which resolves to a
[`JobStatusResponse`](./interfaces/JobStatusResponse). `status` ends at `'completed'` or
`'failed'`. `currentPhase` moves through `'queued'` (waiting for another crawl or build on
the index), `'crawling'`, `'parsing_documents'` when linked files were found, and
`'building_index'`. A queued crawl reports `status: 'building'` with
`currentPhase: 'queued'`.

## Errors

Every method throws `ManageApiError` with the HTTP `status` and the
API's JSON error body in the message, which includes the Moss error code.

| `status` | Error code | Cause |
| - | - | - |
| `400` | `VALIDATION_FAILED` | A limit out of range, a non-public `rootUrl`, an unsupported `modelId`, a `null` field, or a 21st source on the index. |
| `403` | `PLAN_FEATURE_NOT_INCLUDED` | Scheduled refresh or manual re-sync is not on your plan. |
| `404` | `WEB_SOURCE_NOT_FOUND` | Unknown `sourceId`. |
| `409` | `WEB_SOURCE_EXISTS` | The root URL is already registered on this index. |
| `409` | `BUILD_IN_PROGRESS` | Crawl settings changed, a re-sync requested, or a delete attempted while the source is crawling. |
| `429` | `USAGE_LIMIT_EXCEEDED` | Concurrent job, crawled URL, index, or credit limits. |
| `503` | | Crawling or the plan check is temporarily unavailable. |

```typescript theme={null}
try {
  await client.createWebSource('https://docs.yoursite.com', 'support-kb')
} catch (e) {
  if (e instanceof ManageApiError && e.status === 409) {
    // already registered on this index
  } else {
    throw e
  }
}
```

## Environment

`MOSS_CLOUD_API_BASE_URL` overrides the API host used by the web source methods (default
`https://service.usemoss.dev`). It does not affect the client's other calls.
