<!-- Source: https://docs.moss.dev/docs/api-reference/v1/web-sources/listWebSources.md -->
# List Web Sources

> Enumerate the project's web sources, optionally for one index.

List the web sources registered for the project, newest first. Pass `indexName` to see only
the sources on one index.

**Required fields**: none beyond the shared schema.

| Field | Type | Required | Notes |
| - | - | - | - |
| `indexName` | string | ▶︎ | Only return the sources on this index. |

**Example request**

```bash theme={null}
curl -X POST "https://service.usemoss.dev/v1/manage" \
  -H "Content-Type: application/json" \
  -H "x-service-version: v1" \
  -H "x-project-key: moss_access_key_xxxxx" \
  -d '{
    "action": "listWebSources",
    "projectId": "project_123",
    "indexName": "docs-site"
  }'
```

**Responses**

```json 200 - OK theme={null}
{
  "sources": [
    {
      "id": "9c1d2e3f-4a5b-4c6d-8e7f-0a1b2c3d4e5f",
      "indexName": "docs-site",
      "rootUrl": "https://blog.yoursite.com/",
      "maxPages": 200,
      "maxDocuments": 50000,
      "maxDepth": 3,
      "respectRobots": true,
      "parseDocuments": true,
      "refreshCadence": "manual",
      "nextRefreshAt": null,
      "lastCrawledAt": "2026-09-01T11:02:10.000+00:00",
      "lastPageCount": 48,
      "lastDocCount": 391,
      "status": "idle",
      "lastErrorCode": null,
      "createdAt": "2026-09-01T10:50:00.000+00:00"
    },
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
      "lastCrawledAt": "2026-09-01T10:12:41.000+00:00",
      "lastPageCount": 214,
      "lastDocCount": 1893,
      "status": "idle",
      "lastErrorCode": null,
      "createdAt": "2026-09-01T10:00:00.000+00:00"
    }
  ]
}
```

See [`createWebSource`](./createWebSource) for the field descriptions. `lastPageCount` and
`lastDocCount` are per source, so the index above holds 262 pages in total.
