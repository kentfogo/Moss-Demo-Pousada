<!-- Source: https://docs.moss.dev/docs/api-reference/v1/getting-started/authentication.md -->
# Moss REST API authentication

> How to authenticate requests to the Moss Control Plane API.

All mutating and read operations are routed through `POST /v1/manage` and require both of the following:

* `projectId` field in the JSON body.
* `x-project-key` header containing the project access key.
* `x-service-version` header set to `v1`.

The service verifies the credentials before running the requested action. Invalid credentials return `403 Forbidden` with a JSON error payload.

```bash theme={null}
curl -X POST "https://service.usemoss.dev/v1/manage" \
  -H "Content-Type: application/json" \
  -H "x-service-version: v1" \
  -H "x-project-key: moss_access_key_xxxxx" \
  -d '{
    "action": "listIndexes",
    "projectId": "project_123"
  }'
```
