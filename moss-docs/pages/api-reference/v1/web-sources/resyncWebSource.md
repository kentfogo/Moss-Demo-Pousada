<!-- Source: https://docs.moss.dev/docs/api-reference/v1/web-sources/resyncWebSource.md -->
# Resync Web Source

> Re-crawl a website and refresh its pages in the index.

Trigger a re-crawl of one web source on demand. The site is crawled again in full and only
this source's pages change: pages whose content is unchanged are kept as they are (not
re-embedded), changed pages are re-indexed, and pages that disappeared from the site are
dropped. Other web sources on the index and directly added documents are untouched. Works
for both scheduled and manual sources.

Returns `202 Accepted` with a `jobId`; poll
[`getJobStatus`](../index-management/getJobStatus) until the job completes. If another crawl
or build is already running on the index, the job waits its turn and reports `queued` until
it starts.

**Required fields**: `sourceId`

| Field | Type | Required | Notes |
| - | - | - | - |
| `sourceId` | string | ✅ | Web source ID returned by `createWebSource` or `listWebSources`. |

**Example request**

```bash theme={null}
curl -X POST "https://service.usemoss.dev/v1/manage" \
  -H "Content-Type: application/json" \
  -H "x-service-version: v1" \
  -H "x-project-key: moss_access_key_xxxxx" \
  -d '{
    "action": "resyncWebSource",
    "projectId": "project_123",
    "sourceId": "7f2a9c04-3b1e-4c8a-9d2f-1e5b6a7c8d90"
  }'
```

**Responses**

```json 202 - Accepted theme={null}
{
  "id": "7f2a9c04-3b1e-4c8a-9d2f-1e5b6a7c8d90",
  "jobId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "status": "crawling",
  "effectiveMaxPages": 500
}
```

`effectiveMaxPages` is the page cap this run uses; see [`createWebSource`](./createWebSource)
for how it is derived.

**Errors**

* `400` when `sourceId` is missing.
* `403` `PLAN_FEATURE_NOT_INCLUDED` when your plan does not include manual re-sync (Developer).
  The billing gate runs first, so an exhausted monthly credit returns `429` instead.
* `404` if the web source is not found.
* `409` `BUILD_IN_PROGRESS` when this source already has a crawl queued or running.
* `429` `USAGE_LIMIT_EXCEEDED` when your organization is running or has queued its maximum
  number of concurrent crawl and parse jobs, or has used its monthly crawled URL allowance
  on a plan without overage billing. On plans with overage billing the re-sync runs and the
  extra pages are billed at the pricing page rate.
* `503` when website crawling or the plan check is temporarily unavailable.
