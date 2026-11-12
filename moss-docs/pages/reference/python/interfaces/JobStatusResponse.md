<!-- Source: https://docs.moss.dev/docs/reference/python/interfaces/JobStatusResponse.md -->
# JobStatusResponse (Python SDK)

> Python get_job_status response fields for progress, current phase, errors, and creation or completion timestamps.

[moss v1.0.1](https://docs.moss.dev/docs/reference/python/api.md)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / JobStatusResponse

Full status response from get\_job\_status.

## Properties

* **job\_id**: `str`
* **status**: [`JobStatus`](./JobStatus)
* **progress**: `float`
* **current\_phase**: Optional\[[`JobPhase`](./JobPhase)]
* **error**: `Optional[str]`
* **created\_at**: `str`
* **updated\_at**: `str`
* **completed\_at**: `Optional[str]`
