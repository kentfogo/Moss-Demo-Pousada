<!-- Source: https://docs.moss.dev/docs/api-reference/v1/document-operations/getDocs.md -->
# Get Documents

> Retrieve the stored documents for an index.

Retrieve the stored documents for an index.

**Required fields**: `indexName`

**Optional fields**: `options.docIds` to return a subset.

**Example request**

```bash theme={null}
curl -X POST "https://service.usemoss.dev/v1/manage" \
  -H "Content-Type: application/json" \
  -H "x-service-version: v1" \
  -H "x-project-key: moss_access_key_xxxxx" \
  -d '{
    "action": "getDocs",
    "projectId": "project_123",
    "indexName": "support-faq"
  }'
```

**Responses**

```json 200 - OK theme={null}
[
  {
    "id": "faq-1",
    "text": "Reset password: Click 'Forgot Password' on the sign-in page to receive a reset link via email.",
    "metadata": {
      "category": "account",
      "topic": "password"
    }
  },
  {
    "id": "faq-2",
    "text": "Enable two-factor authentication: Go to Account Settings > Security and toggle on 2FA to add an extra layer of protection.",
    "metadata": {
      "category": "account",
      "topic": "2fa"
    }
  }
]
```
