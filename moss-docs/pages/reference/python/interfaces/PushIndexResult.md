<!-- Source: https://docs.moss.dev/docs/reference/python/interfaces/PushIndexResult.md -->
# PushIndexResult (Python SDK)

> Python result from persisting a local session index to the cloud, including job ID, index name, document count, and status.

[moss v1.4.0](https://docs.moss.dev/docs/reference/python/api.md)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / PushIndexResult

The result of [`SessionIndex.push_index()`](../classes/SessionIndex#push_index) -
returned when a local session index is persisted to the cloud.

## Properties

* **job\_id**: `str` - ID of the background job that builds the cloud index. Pass to [`MossClient.get_job_status()`](../classes/MossClient#get_job_status-job_id) to track progress.
* **index\_name**: `str` - Name of the cloud index that was created or replaced.
* **doc\_count**: `int` - Number of documents pushed.
* **status**: `str` - Status of the push operation.
