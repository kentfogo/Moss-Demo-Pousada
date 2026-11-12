<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/PushIndexResult.md -->
# PushIndexResult (JavaScript SDK)

> JavaScript cloud persistence result for a session index, including background job ID, index name, document count, and status.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / PushIndexResult

Returned by [`SessionIndex.pushIndex()`](../classes/SessionIndex#pushindex) when a local
session is persisted to the cloud.

## Properties

| Property | Type | Description |
| - | - | - |
| `jobId` | `string` | ID of the background job that builds the cloud index. Pass to [`getJobStatus()`](../classes/MossClient#getjobstatus) to track progress. |
| `indexName` | `string` | Name of the cloud index that was created or replaced. |
| `docCount` | `number` | Number of documents pushed. |
| `status` | `string` | Status of the push operation. |
