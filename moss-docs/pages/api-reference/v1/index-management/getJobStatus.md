<!-- Source: https://docs.moss.dev/docs/api-reference/v1/index-management/getJobStatus.md -->
# Get Job Status

> Check the status of an async index build job.

Poll the status of an async job started by `startBuild`, `addDocs`, `deleteDocs`,
`createWebSource`, or `resyncWebSource`.

**Required fields**: `jobId`

| Field | Type | Required | Notes |
| - | - | - | - |
| `jobId` | string | ✅ | The job ID returned by the initiating action. |

**Example request**

```bash theme={null}
curl -X POST "https://service.usemoss.dev/v1/manage" \
  -H "Content-Type: application/json" \
  -H "x-service-version: v1" \
  -H "x-project-key: moss_access_key_xxxxx" \
  -d '{
    "action": "getJobStatus",
    "projectId": "project_123",
    "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }'
```

**Responses**

```json 200 - OK (completed) theme={null}
{
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "completed",
  "progress": 100,
  "currentPhase": null,
  "error": null,
  "createdAt": "2025-01-09T21:14:07.000+00:00",
  "updatedAt": "2025-01-09T21:14:32.000+00:00",
  "completedAt": "2025-01-09T21:14:32.000+00:00"
}
```

```json 200 - OK (building) theme={null}
{
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "building",
  "progress": 45,
  "currentPhase": "indexing",
  "error": null,
  "createdAt": "2025-01-09T21:14:07.000+00:00",
  "updatedAt": "2025-01-09T21:14:15.000+00:00",
  "completedAt": null
}
```

| Field | Type | Notes |
| - | - | - |
| `jobId` | string | The job identifier. |
| `status` | string | One of `building`, `completed`, or `failed`. Web crawl jobs report `queued` while another crawl or build on the same index runs, then `building`. |
| `progress` | integer | Percentage complete (0-100). |
| `currentPhase` | string \| null | Current build phase, or `null` when completed. Web crawl jobs move through `crawling`, `parsing_documents` (when linked files are found), and `building_index`. |
| `error` | string \| null | Error message if the job failed, otherwise `null`. |
| `createdAt` | string | ISO 8601 timestamp when the job was created. |
| `updatedAt` | string | ISO 8601 timestamp of the last status update. |
| `completedAt` | string \| null | ISO 8601 timestamp when the job completed, or `null` if still running. |

**Errors**

* `404` if the job ID is not found.
