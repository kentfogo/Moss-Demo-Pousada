<!-- Source: https://docs.moss.dev/docs/api-reference/v1/document-operations/deleteDocs.md -->
# Delete Documents

> Remove specific documents by ID and rebuild the index.

Remove specific documents by ID and rebuild the index. This is an async operation - the response includes a `jobId` you can poll with `getJobStatus`.

**Required fields**: `indexName`, `docIds` (non-empty array)

**Example request**

```bash theme={null}
curl -X POST "https://service.usemoss.dev/v1/manage" \
  -H "Content-Type: application/json" \
  -H "x-service-version: v1" \
  -H "x-project-key: moss_access_key_xxxxx" \
  -d '{
    "action": "deleteDocs",
    "projectId": "project_123",
    "indexName": "support-faq",
    "docIds": ["faq-001", "faq-042", "faq-099"]
  }'
```

**Responses**

```json 200 - OK theme={null}
{
  "jobId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "building"
}
```
