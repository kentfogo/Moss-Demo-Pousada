<!-- Source: https://docs.moss.dev/docs/api-reference/v1/getting-started/overview.md -->
# Overview

> Control Plane endpoint structure and shared request schema.

All API actions are multiplexed through the `/v1/manage` endpoint. Provide an `action` string plus the required fields for that operation. On success, handlers return `2xx` JSON payloads outlined below. Failures return structured errors:

```json theme={null}
{
  "error": "Human-readable message",
  "action": "addDocs" // present on server errors
}
```

Shared request schema:

| Field | Type | Required | Notes |
| - | - | - | - |
| `action` | string | ✅ | One of `initUpload`, `startBuild`, `getJobStatus`, `getIndex`, `listIndexes`, `deleteIndex`, `addDocs`, `deleteDocs`, `getDocs`, `getIndexUrl`, `createWebSource`, `listWebSources`, `getWebSource`, `resyncWebSource`, `updateWebSource`, `deleteWebSource`, `initParseIndex`, `confirmParseIndex`. |
| `projectId` | string | ✅ | Project identifier issued by Moss Control. |
| `indexName` | string | ▶︎ | Required for index-scoped actions. |

> **Required headers:** `x-project-key` with your project access key and `x-service-version: v1`.

## Supported actions at a glance

| Action | Purpose | Extra required fields |
| - | - | - |
| `initUpload` | Get a presigned URL to upload index data. | `indexName`, `modelId`, `docCount`, `dimension` |
| `startBuild` | Trigger an index build after uploading data. | `jobId` |
| `getJobStatus` | Check the status of an async build job. | `jobId` |
| `getIndex` | Fetch metadata for a single index. | `indexName` |
| `listIndexes` | Enumerate every index under the project. | None |
| `deleteIndex` | Remove an index record and assets. | `indexName` |
| `getIndexUrl` | Get download URLs for a built index. | `indexName` |
| `addDocs` | Upsert documents into an existing index. | `indexName`, `docs` |
| `deleteDocs` | Remove documents by ID. | `indexName`, `docIds` |
| `getDocs` | Retrieve stored documents (without embeddings). | `indexName` |
| `createWebSource` | Crawl a website into an index; an index holds up to 20 web sources. | `rootUrl`, `indexName` |
| `listWebSources` | Enumerate the project's web sources, optionally for one `indexName`. | None |
| `getWebSource` | Fetch a single web source by ID. | `sourceId` |
| `resyncWebSource` | Re-crawl one web source and refresh its pages. | `sourceId` |
| `updateWebSource` | Change a web source's crawl settings or schedule, optionally re-crawling. | `sourceId` |
| `deleteWebSource` | Remove a web source and its pages (the index is kept). | `sourceId` |

[Responses](https://docs.moss.dev/docs/api-reference/v1/inference/responses.md) and [chat completions](https://docs.moss.dev/docs/api-reference/v1/inference/chat-completions.md) are not `/v1/manage` actions; they are served by Moss Inference at `https://inference.moss.dev/v1/responses` and `https://inference.moss.dev/v1/chat/completions` with `Authorization: Bearer <project_id>:<project_key>`.

`initParseIndex` and `confirmParseIndex` expose the file-parsing pipeline behind
[`createIndexFromFiles`](https://docs.moss.dev/docs/reference/js/files); prefer the SDK method rather than
calling them directly.
