<!-- Source: https://docs.moss.dev/docs/api-reference/v1/index-management/initUpload.md -->
# Init Upload

> Get a presigned URL to upload index data for a new index.

Initialize an upload session for creating a new index. Returns a presigned URL where you can upload your pre-computed index data, along with a `jobId` to use with `startBuild` once the upload completes.

**Required fields**: `indexName`, `modelId`, `docCount`, `dimension`

| Field | Type | Required | Notes |
| - | - | - | - |
| `indexName` | string | ✅ | Name for the new index. |
| `modelId` | string | ✅ | Embedding model identifier (e.g. `moss-minilm`). |
| `docCount` | integer | ✅ | Total number of documents being uploaded. |
| `dimension` | integer | ✅ | Embedding vector dimension (e.g. `384` for `moss-minilm`). |

**Example request**

```bash theme={null}
curl -X POST "https://service.usemoss.dev/v1/manage" \
  -H "Content-Type: application/json" \
  -H "x-service-version: v1" \
  -H "x-project-key: moss_access_key_xxxxx" \
  -d '{
    "action": "initUpload",
    "projectId": "project_123",
    "indexName": "support-faq",
    "modelId": "moss-minilm",
    "docCount": 2,
    "dimension": 384
  }'
```

**Responses**

```json 200 - OK theme={null}
{
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "uploadUrl": "https://<bucket>.r2.cloudflarestorage.com/temp-uploads/<project_id>/<job_id>/data.bin?<signed_params>",
  "expiresIn": 3600
}
```

| Field | Type | Notes |
| - | - | - |
| `jobId` | string | Use this ID with `startBuild` after uploading. |
| `uploadUrl` | string | Presigned URL to `PUT` your index data. Expires after `expiresIn` seconds. |
| `expiresIn` | integer | Seconds until the upload URL expires (default `3600`). |

**Errors**

* `400` when `docCount` or `dimension` is missing or invalid.
* `404` if the project does not exist.
