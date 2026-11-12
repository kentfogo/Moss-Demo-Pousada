<!-- Source: https://docs.moss.dev/docs/reference/python/interfaces/LoadIndexesResult.md -->
# LoadIndexesResult (Python SDK)

> Python bulk index loading results with successfully loaded names and per-index failure messages and error codes.

[moss v1.4.0](https://docs.moss.dev/docs/reference/python/api.md)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / LoadIndexesResult

The result of [`MossClient.load_indexes()`](../classes/MossClient#load_indexes-names-auto_refresh-polling_interval_in_seconds).
Bulk loading is best-effort - failures on individual names do not roll back successes.

## Properties

* **loaded**: `List[str]` - Names of the indexes that loaded successfully.
* **failed**: `Dict[str, str]` - Mapping of index name → error message for the names that failed to load.
* **failed\_codes**: `Dict[str, str]` - Mapping of index name → error code, such as `"NOT_FOUND"`, for the names that failed to load. The codes are the ones [`MossError.code`](./MossError) carries. *(moss 1.15.0+, with `inferedge-moss-core` 0.27.0)*
