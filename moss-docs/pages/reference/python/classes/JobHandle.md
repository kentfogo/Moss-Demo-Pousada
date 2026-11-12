<!-- Source: https://docs.moss.dev/docs/reference/python/classes/JobHandle.md -->
# JobHandle

> Handle to an in-flight index build submitted with wait=False.

[moss v1.19.0](https://docs.moss.dev/docs/reference/python/api.md)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / JobHandle

Returned by [`create_index(..., wait=False)`](./MossClient#create_index-name-docs-model_id-wait).
The build runs server-side, so you can read the [`job_id`](#job_id), tear down your
process, and reconnect later to check on it — or call [`wait()`](#wait) to block
until it completes.

> [!NOTE]
>
> Requires `moss` **1.7.1+** (which pulls `inferedge-moss-core` `0.20.1`).

## Properties

### `job_id`

* **Type:** `str`

The build job id. Available immediately, before the build finishes. Persist it to
poll the build later via [`get_job_status(job_id)`](./MossClient#get_job_status-job_id).

## Methods

### `status()`

Current build status — a live readout of the phase and progress.

#### Returns

[`JobStatusResponse`](../interfaces/JobStatusResponse)

***

### `wait()`

Block until the build completes. Raises if the build fails or times out.

#### Returns

[`MutationResult`](../interfaces/MutationResult)

***

## Example

```python theme={null}
import asyncio

job = await client.create_index("my-index", docs, "moss-minilm", wait=False)

# Fire-and-forget: save the id, tear down, reconnect later
job_id = job.job_id

# Or watch it in-process — throttle your polling so you don't hammer the API
while True:
    status = await job.status()
    if status.status.value in ("completed", "failed"):
        break
    await asyncio.sleep(2)

# Or simply block until done (the SDK polls for you)
result = await job.wait()
```
