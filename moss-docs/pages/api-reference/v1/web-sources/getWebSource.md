<!-- Source: https://docs.moss.dev/docs/api-reference/v1/web-sources/getWebSource.md -->
# Get Web Source

> Fetch a single web source by ID.

Fetch one web source, including its crawl configuration, schedule, and the stats from its
most recent run.

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
    "action": "getWebSource",
    "projectId": "project_123",
    "sourceId": "7f2a9c04-3b1e-4c8a-9d2f-1e5b6a7c8d90"
  }'
```

**Responses**

```json 200 - OK theme={null}
{
  "id": "7f2a9c04-3b1e-4c8a-9d2f-1e5b6a7c8d90",
  "indexName": "docs-site",
  "rootUrl": "https://docs.yoursite.com",
  "maxPages": 500,
  "maxDocuments": 50000,
  "maxDepth": 3,
  "respectRobots": true,
  "parseDocuments": true,
  "refreshCadence": "weekly",
  "nextRefreshAt": "2026-09-08T10:00:00.000+00:00",
  "lastCrawledAt": "2026-09-01T10:12:41.000+00:00",
  "lastPageCount": 214,
  "lastDocCount": 1893,
  "status": "idle",
  "lastErrorCode": null,
  "createdAt": "2026-09-01T10:00:00.000+00:00"
}
```

See [`createWebSource`](./createWebSource) for the field descriptions.

**Errors**

* `400` when `sourceId` is missing.
* `404` if the web source is not found.
