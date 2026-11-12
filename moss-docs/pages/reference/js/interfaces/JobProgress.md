<!-- Source: https://docs.moss.dev/docs/reference/js/interfaces/JobProgress.md -->
# JobProgress (JavaScript SDK)

> JavaScript progress callback fields for an asynchronous job: job ID, status, progress, and current phase.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / JobProgress

Progress update passed to the `onProgress` callback during async operations.

## Properties

| Property | Type |
| - | - |
| `jobId` | `string` |
| `status` | [`JobStatus`](../type-aliases/JobStatus) |
| `progress` | `number` |
| `currentPhase` | [`JobPhase`](../type-aliases/JobPhase) \| `null` |
