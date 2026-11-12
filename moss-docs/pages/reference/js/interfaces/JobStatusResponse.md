<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/JobStatusResponse.md -->
# JobStatusResponse (JavaScript SDK)

> JavaScript getJobStatus response fields for job progress, current phase, errors, and creation or completion timestamps.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / JobStatusResponse

Full job status response from getJobStatus.

## Properties

| Property | Type |
| - | - |
| `jobId` | `string` |
| `status` | [`JobStatus`](../type-aliases/JobStatus) |
| `progress` | `number` |
| `currentPhase` | [`JobPhase`](../type-aliases/JobPhase) \| `null` |
| `error?` | `string` \| `null` |
| `createdAt` | `string` |
| `updatedAt` | `string` |
| `completedAt` | `string` \| `null` |
