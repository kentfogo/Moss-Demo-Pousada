<!-- Source: https://docs.moss.dev/docs/api-reference/v1/index-management/deleteIndex.md -->
# Delete Index

> Delete an index record and associated assets.

Delete an index record and associated assets.

**Required fields**: `indexName`

**Example request**

```bash theme={null}
curl -X POST "https://service.usemoss.dev/v1/manage" \
  -H "Content-Type: application/json" \
  -H "x-service-version: v1" \
  -H "x-project-key: moss_access_key_xxxxx" \
  -d '{
    "action": "deleteIndex",
    "projectId": "project_123",
    "indexName": "support-faq"
  }'
```

**Responses**

```json 200 - OK theme={null}
true
```

**Errors**

* `404` if the index is missing.
