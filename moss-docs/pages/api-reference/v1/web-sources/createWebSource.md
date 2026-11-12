<!-- Source: https://docs.moss.dev/docs/api-reference/v1/web-sources/createWebSource.md -->
# Create Web Source

> Crawl a website into an index, alone or alongside other sites.

Register a website as a web source and start a crawl that adds its pages to an index. An
index can hold up to 20 web sources, each crawled and refreshed on its own, next to documents
you add directly. The crawler stays on the site, uses its sitemap in addition to following
links, respects robots.txt by default, and keeps only the main content of each page
(navigation, footers, cookie banners, and skip links are dropped). Linked PDF and DOCX files
found during the crawl are parsed into the same index.

The first source on an index name creates the index; later sources add to it. Every crawl
replaces only its own source's pages: other sources' pages and directly added documents stay,
and pages whose content did not change since the last crawl are not re-embedded.

Returns `202 Accepted` with a `jobId`; poll [`getJobStatus`](../index-management/getJobStatus)
until the job completes. If another crawl or build is already running on the index, the job
waits its turn and reports `queued` until it starts. Set `refreshCadence` to re-crawl on a
schedule, or omit it and trigger re-crawls manually with
[`resyncWebSource`](./resyncWebSource) (both require a paid plan; see the field notes below).

**Required fields**: `rootUrl`, `indexName`

| Field | Type | Required | Notes |
| - | - | - | - |
| `rootUrl` | string | ✅ | Publicly reachable `http`/`https` URL to start crawling from. Private and internal addresses are rejected. Each root URL can be registered once per index: the URL with and without a trailing slash counts as the same source, and any fragment is ignored. |
| `indexName` | string | ✅ | Name of the index to build or add to. Up to 20 web sources per index. |
| `maxPages` | integer | ▶︎ | Page cap for the crawl. Default `500`, max `5000`. Each run is also capped by your plan's crawl size (Developer 25, Hobbyist 500, Startup 5,000, Enterprise custom); the cap actually used is returned as `effectiveMaxPages`. |
| `maxDepth` | integer | ▶︎ | Link depth from `rootUrl`. Default `3`, max `10`. |
| `maxDocuments` | integer | ▶︎ | Cap on indexed chunks. Default and max `50000`. |
| `includePaths` | string\[] | ▶︎ | Only crawl matching path globs (e.g. `["/blog/*"]`). Up to 50 entries. Omitted from responses when not set. |
| `excludePaths` | string\[] | ▶︎ | Skip matching path globs. Up to 50 entries. Omitted from responses when not set. |
| `respectRobots` | boolean | ▶︎ | Honor robots.txt. Default `true`. |
| `parseDocuments` | boolean | ▶︎ | Parse linked PDF/DOCX files into the index. Default `true`. |
| `refreshCadence` | string | ▶︎ | `daily` or `weekly`. Omit for a one-time crawl; manual re-syncs require Hobbyist or above. Scheduled refresh is available on Startup and Enterprise plans. Each scheduled run counts its pages against your monthly crawled URL allowance. On Startup, runs continue past the allowance and the extra pages are billed at \$0.005 per page; on a plan configured without overage billing, each scheduled run is skipped while the allowance is used up. A skipped run sets `lastErrorCode`. |
| `modelId` | string | ▶︎ | Embedding model, fixed when the index is created. Default `moss-minilm`; `custom` is not supported. Every source on an index uses the index's model. |

**Example request**

```bash theme={null}
curl -X POST "https://service.usemoss.dev/v1/manage" \
  -H "Content-Type: application/json" \
  -H "x-service-version: v1" \
  -H "x-project-key: moss_access_key_xxxxx" \
  -d '{
    "action": "createWebSource",
    "projectId": "project_123",
    "rootUrl": "https://docs.yoursite.com",
    "indexName": "docs-site",
    "maxPages": 500,
    "refreshCadence": "weekly"
  }'
```

To add a second site to the same index, call `createWebSource` again with the same
`indexName` and a different `rootUrl`. There is no need to wait for the first crawl to
finish; the second crawl queues behind it.

**Responses**

```json 202 - Accepted theme={null}
{
  "id": "7f2a9c04-3b1e-4c8a-9d2f-1e5b6a7c8d90",
  "indexName": "docs-site",
  "rootUrl": "https://docs.yoursite.com/",
  "maxPages": 500,
  "maxDocuments": 50000,
  "maxDepth": 3,
  "respectRobots": true,
  "parseDocuments": true,
  "refreshCadence": "weekly",
  "nextRefreshAt": "2026-09-08T10:00:00.000+00:00",
  "lastCrawledAt": null,
  "lastPageCount": null,
  "lastDocCount": null,
  "status": "crawling",
  "lastErrorCode": null,
  "createdAt": "2026-09-01T10:00:00.000+00:00",
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "effectiveMaxPages": 500
}
```

| Field | Type | Notes |
| - | - | - |
| `id` | string | Web source ID. Use it with `getWebSource`, `resyncWebSource`, `updateWebSource`, and `deleteWebSource`. |
| `rootUrl` | string | The registered URL. A bare origin such as `https://docs.yoursite.com` is stored with a trailing slash. |
| `jobId` | string | Poll with [`getJobStatus`](../index-management/getJobStatus). The job reports `queued` while it waits for another crawl or build on the index, then moves through the phases `crawling`, `parsing_documents` (when linked files are found), and `building_index`. A job that waits more than 12 hours fails with `BUILD_IN_PROGRESS`. |
| `effectiveMaxPages` | integer | The page cap this crawl run uses: the lower of your `maxPages` and your plan's crawl size, further reduced to the remaining monthly allowance on plans without overage billing. |
| `status` | string | `crawling` while a run is active or queued; otherwise `idle`, `failed`, or `removing` while a delete is purging the source's pages. |
| `refreshCadence` | string | `daily`, `weekly`, or `manual`. |
| `nextRefreshAt` | string \| null | When the next scheduled re-crawl becomes due, or `null` for manual sources. |
| `lastCrawledAt`, `lastPageCount`, `lastDocCount` | mixed | Stats from the most recent completed run of this source. |
| `lastErrorCode` | string \| null | Error code from the last failed run, e.g. `CRAWL_FAILED`, `CRAWL_LIMIT_EXCEEDED`, `CRAWL_ROBOTS_DISALLOWED`, `CRAWL_UNREACHABLE_HOST`, or from a skipped scheduled refresh: `PLAN_FEATURE_NOT_INCLUDED` or `USAGE_LIMIT_EXCEEDED`. Cleared by the next successful run. |

**Linked documents**

When `parseDocuments` is `true`, PDF and DOCX links discovered during the crawl are parsed
into the index. Limits: 50 MB per file and at most 20 linked documents per crawl run.
Oversized, unreachable, or unsupported files (e.g. `.doc`, `.xlsx`, `.pptx`) are skipped and
the crawl still completes. On plans without overage billing, documents are also skipped once
your monthly parsed document page allowance is used up (PDF pages are counted before parsing). Skipped documents are logged, not returned.

**Errors**

* `400` when `rootUrl` or `indexName` is missing, a limit is out of range, `rootUrl` is not
  a public website address, `modelId` is not supported for website crawling, or the index
  already has 20 web sources.
* `403` `PLAN_FEATURE_NOT_INCLUDED` when `refreshCadence` is set and your plan does not include
  scheduled refresh, or `MODEL_NOT_ALLOWED` when the model is not enabled for your organization.
* `409` `WEB_SOURCE_EXISTS` when the same root URL is already registered on this index.
* `429` `USAGE_LIMIT_EXCEEDED` when your organization is running or has queued its maximum
  number of concurrent crawl and parse jobs, has used its monthly crawled URL allowance on a
  plan without overage billing, has reached its plan's index limit, or has exhausted its
  monthly credit. On Hobbyist and Startup, exceeding the allowance does
  not block the crawl; the extra pages are billed at the rate on the pricing page. Enterprise
  allowances and overage handling follow your contract. Developer plans
  stop at the allowance unless pay-as-you-go is on with a payment method; otherwise upgrade
  to Hobbyist.
* `503` when website crawling or the plan check is temporarily unavailable.
