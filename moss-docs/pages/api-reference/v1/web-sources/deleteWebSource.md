<!-- Source: https://docs.moss.dev/docs/api-reference/v1/web-sources/deleteWebSource.md -->
# Delete Web Source

> Remove a web source and its pages from the index.

Delete a web source. The source, its refresh schedule, and the pages it crawled are removed.
The index itself stays, along with everything else in it: pages from other web sources and
documents you added directly. Use [`deleteIndex`](../index-management/deleteIndex) to remove
the whole index and every source on it.

The pages are removed by a purge job. Until it completes, the source reports `status`
`removing` and still appears in [`listWebSources`](./listWebSources); afterwards it is gone.
Poll `purgeJobId` with [`getJobStatus`](../index-management/getJobStatus) to know when the
index no longer contains the source's pages.

A crawl that is still queued for the source is cancelled and the delete goes ahead. A crawl
that is already running blocks the delete with `409`; retry after it completes.

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
    "action": "deleteWebSource",
    "projectId": "project_123",
    "sourceId": "7f2a9c04-3b1e-4c8a-9d2f-1e5b6a7c8d90"
  }'
```

**Responses**

```json 200 - OK theme={null}
{
  "id": "7f2a9c04-3b1e-4c8a-9d2f-1e5b6a7c8d90",
  "deleted": true,
  "purgeJobId": "c3d4e5f6-a7b8-9012-cdef-345678901234"
}
```

```json 200 - OK (nothing to purge) theme={null}
{
  "deleted": true,
  "id": "7f2a9c04-3b1e-4c8a-9d2f-1e5b6a7c8d90"
}
```

| Field | Type | Notes |
| - | - | - |
| `purgeJobId` | string | Job that removes the source's pages from the index. Absent when there is nothing to purge: the index was already deleted, or the source never completed a crawl. |

**Errors**

* `400` when `sourceId` is missing.
* `404` if the web source is not found.
* `409` `BUILD_IN_PROGRESS` when the source's crawl is running. Retry once it completes.
