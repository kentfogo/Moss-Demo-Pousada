<!-- Source: https://docs.moss.dev/docs/api-reference/v1/index-management/startBuild.md -->
# Start Build

> Trigger an index build after uploading data.

After uploading index data to the presigned URL from `initUpload`, call `startBuild` to trigger the index build. The build runs asynchronously - use `getJobStatus` to poll for completion.

**Required fields**: `jobId`

| Field | Type | Required | Notes |
| - | - | - | - |
| `jobId` | string | ✅ | The job ID returned by `initUpload`. |

**Example request**

```bash theme={null}
curl -X POST "https://service.usemoss.dev/v1/manage" \
  -H "Content-Type: application/json" \
  -H "x-service-version: v1" \
  -H "x-project-key: moss_access_key_xxxxx" \
  -d '{
    "action": "startBuild",
    "projectId": "project_123",
    "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }'
```

**Responses**

```json 200 - OK theme={null}
{
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "building"
}
```

**Errors**

* `400` when `jobId` is missing.
* `404` if the upload data is not found (upload may not have completed).
