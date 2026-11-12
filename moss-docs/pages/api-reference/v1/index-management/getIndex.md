<!-- Source: https://docs.moss.dev/docs/api-reference/v1/index-management/getIndex.md -->
# Get Index

> Fetch metadata for a single index.

Fetch metadata for a single index.

**Required fields**: `indexName`

**Example request**

```bash theme={null}
curl -X POST "https://service.usemoss.dev/v1/manage" \
  -H "Content-Type: application/json" \
  -H "x-service-version: v1" \
  -H "x-project-key: moss_access_key_xxxxx" \
  -d '{
    "action": "getIndex",
    "projectId": "project_123",
    "indexName": "support-faq"
  }'
```

**Responses**

```json 200 - OK theme={null}
{
  "id": "a98fe5f5-1c00-4d5c-b2a5-6c1ef8d157cc",
  "name": "support-faq",
  "model": {
    "id": "moss-minilm",
    "version": "service-v1.0.0"
  },
  "status": "Ready",
  "version": "service-v1.0.0",
  "docCount": 124,
  "createdAt": "2025-01-09T21:14:07.000+00:00",
  "updatedAt": "2025-01-10T03:52:11.000+00:00"
}
```

**Errors**

* `404` if the index is unknown.
