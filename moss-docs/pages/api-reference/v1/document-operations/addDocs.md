<!-- Source: https://docs.moss.dev/docs/api-reference/v1/document-operations/addDocs.md -->
# Add Documents

> Append or upsert documents into an existing index.

Append or upsert documents into an existing index. This is an async operation - the response includes a `jobId` you can poll with `getJobStatus`. The service merges the new documents, rebuilds the index efficiently, and makes fresh artifacts available for further usage.

**Required fields**: `indexName`, `docs`

**Optional fields**: `options.upsert` (defaults to `true`).

**Example request**

```bash theme={null}
curl -X POST "https://service.usemoss.dev/v1/manage" \
  -H "Content-Type: application/json" \
  -H "x-service-version: v1" \
  -H "x-project-key: moss_access_key_xxxxx" \
  -d '{
    "action": "addDocs",
    "projectId": "project_123",
    "indexName": "support-faq",
    "docs": [
      { "id": "faq-125", "text": "How do I change billing cycles?" }
    ],
    "options": {
      "upsert": true
    }
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

* `404` if the index cannot be located.
* `500` when existing documents cannot be downloaded or the update fails.
