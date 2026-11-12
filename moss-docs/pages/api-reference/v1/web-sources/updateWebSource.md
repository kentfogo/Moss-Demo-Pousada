<!-- Source: https://docs.moss.dev/docs/api-reference/v1/web-sources/updateWebSource.md -->
# Update Web Source

> Change a web source's crawl settings or refresh schedule.

Update any of a web source's crawl settings and its refresh cadence. Fields you leave out
stay as they are. Crawl settings (`rootUrl`, path filters, depth, page caps, robots and
document parsing) take effect on the next crawl, whether that is a scheduled refresh, a
[`resyncWebSource`](./resyncWebSource), or `resync: true` on this call. Changing `rootUrl`
re-points the source: the next crawl indexes the new site and removes the old site's pages
from the index.

For the cadence, `daily` and `weekly` schedule automatic re-crawls; `manual` clears the
schedule so the source is only re-crawled on demand. Cadence changes take effect immediately
and reset the clock: the next scheduled run becomes now plus the new interval. Scheduled
refreshes run on a rolling interval from the last completed run (there is no time-of-day
control).

**Required fields**: `sourceId`, plus at least one field to change

| Field | Type | Required | Notes |
| - | - | - | - |
| `sourceId` | string | ✅ | Web source ID returned by `createWebSource` or `listWebSources`. |
| `rootUrl` | string | ▶︎ | New start URL. Same rules as on create: public `http`/`https`, and not already registered on this index. |
| `maxPages` | integer | ▶︎ | Page cap for future crawls. Max `5000`; the plan cap still applies per run. |
| `maxDepth` | integer | ▶︎ | Link depth from `rootUrl`. Max `10`. |
| `maxDocuments` | integer | ▶︎ | Cap on indexed chunks. Max `50000`. |
| `includePaths` | string\[] | ▶︎ | Path globs to crawl. Up to 50 entries. Send `[]` to clear. |
| `excludePaths` | string\[] | ▶︎ | Path globs to skip. Up to 50 entries. Send `[]` to clear. |
| `respectRobots` | boolean | ▶︎ | Honor robots.txt. |
| `parseDocuments` | boolean | ▶︎ | Parse linked PDF/DOCX files. |
| `refreshCadence` | string | ▶︎ | One of `daily`, `weekly`, `manual`. |
| `resync` | boolean | ▶︎ | `true` starts a crawl right after saving, the same as calling `resyncWebSource`. Requires manual re-sync on your plan (Hobbyist or above). |

Sending `null` for a field is rejected with `400`; omit the field instead.

**Example request**

```bash theme={null}
curl -X POST "https://service.usemoss.dev/v1/manage" \
  -H "Content-Type: application/json" \
  -H "x-service-version: v1" \
  -H "x-project-key: moss_access_key_xxxxx" \
  -d '{
    "action": "updateWebSource",
    "projectId": "project_123",
    "sourceId": "7f2a9c04-3b1e-4c8a-9d2f-1e5b6a7c8d90",
    "maxPages": 1000,
    "excludePaths": ["/changelog/*"],
    "refreshCadence": "daily",
    "resync": true
  }'
```

**Responses**

The updated source. When `resync` is `true`, the response also carries `jobId`, reports
`status` as `crawling`, and includes `effectiveMaxPages`; poll the job with
[`getJobStatus`](../index-management/getJobStatus).

```json 200 - OK theme={null}
{
  "id": "7f2a9c04-3b1e-4c8a-9d2f-1e5b6a7c8d90",
  "indexName": "docs-site",
  "rootUrl": "https://docs.yoursite.com/",
  "maxPages": 1000,
  "maxDocuments": 50000,
  "maxDepth": 3,
  "excludePaths": ["/changelog/*"],
  "respectRobots": true,
  "parseDocuments": true,
  "refreshCadence": "daily",
  "nextRefreshAt": "2026-09-02T10:15:00.000+00:00",
  "lastCrawledAt": "2026-09-01T10:12:41.000+00:00",
  "lastPageCount": 214,
  "lastDocCount": 1893,
  "status": "crawling",
  "lastErrorCode": null,
  "createdAt": "2026-09-01T10:00:00.000+00:00",
  "jobId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "effectiveMaxPages": 1000
}
```

```json 200 - OK (cadence only) theme={null}
{
  "id": "7f2a9c04-3b1e-4c8a-9d2f-1e5b6a7c8d90",
  "indexName": "docs-site",
  "rootUrl": "https://docs.yoursite.com/",
  "maxPages": 500,
  "maxDocuments": 50000,
  "maxDepth": 3,
  "respectRobots": true,
  "parseDocuments": true,
  "refreshCadence": "manual",
  "nextRefreshAt": null,
  "lastCrawledAt": "2026-09-01T10:12:41.000+00:00",
  "lastPageCount": 214,
  "lastDocCount": 1893,
  "status": "idle",
  "lastErrorCode": null,
  "createdAt": "2026-09-01T10:00:00.000+00:00"
}
```

**Errors**

* `400` when `sourceId` is missing, no field is being changed, a field is `null`, a limit is
  out of range, `rootUrl` is not a public website address, or `refreshCadence` is not
  `daily`, `weekly`, or `manual`.
* `403` `PLAN_FEATURE_NOT_INCLUDED` when `refreshCadence` is `daily` or `weekly` and your plan
  does not include scheduled refresh, or `resync` is `true` and your plan does not include
  manual re-sync (Developer). Setting `manual` clears the schedule and is allowed on every plan.
* `404` if the web source is not found.
* `409` `WEB_SOURCE_EXISTS` when the new `rootUrl` is already registered on this index.
* `409` `BUILD_IN_PROGRESS` when a crawl setting is changed while the source is crawling
  (queued or running). The cadence can be changed at any time. Retry once the crawl completes.
* `429` `USAGE_LIMIT_EXCEEDED` when your organization's monthly credit is exhausted or its
  billing is paused; the billing gate runs before the plan feature check.
* `503` when the plan check is temporarily unavailable.
