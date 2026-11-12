<!-- Source: https://docs.moss.dev/docs/reference/python/interfaces/JobProgress.md -->
# JobProgress (Python SDK)

> Python job progress fields covering the job ID, status, progress value, and optional current phase.

[moss v1.0.1](https://docs.moss.dev/docs/reference/python/api.md)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / JobProgress

Progress update for a job.

## Properties

* **job\_id**: `str`
* **status**: [`JobStatus`](./JobStatus)
* **progress**: `float`
* **current\_phase**: Optional\[[`JobPhase`](./JobPhase)]
