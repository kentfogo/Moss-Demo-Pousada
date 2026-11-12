<!-- Source: https://docs.moss.dev/docs/reference/python/classes/SessionIndex.md -->
# SessionIndex (Python SDK)

> Local, in-session index for real-time indexing and querying.

[moss v1.19.0](https://docs.moss.dev/docs/reference/python/api.md)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / SessionIndex

A local, in-session index for real-time indexing and querying.

All operations (`add_docs`, `delete_docs`, `query`) run entirely in-memory with no
cloud round trips (\~1-10 ms). Open a session with
[`MossClient.session()`](./MossClient#session-index_name-model_id), which auto-loads an
existing cloud index by name or starts empty. Call `push_index()` at the end of the
session to persist the index to the cloud for future retrieval, or
[`save_to_disk()`](#save_to_disk-cache_path) to keep it on this device.

```python theme={null}
# Auto-loads from cloud if the index exists, starts fresh if not
session = await client.session(index_name="session-abc")

await session.add_docs([DocumentInfo(id="1", text="Customer asked about billing")])
results = await session.query("billing question")

result = await session.push_index()
# optionally: await client.get_job_status(result.job_id)
```

## Properties

* **name** (`str`): The index name.
* **doc\_count** (`int`): Number of documents in the local session index.
* **model\_id** (`str`): The embedding model the session uses, or `"custom"`. A load moves
  the session to the loaded model, and `add_docs` and `query` read it on every call. The
  value is as of the last completed call, so reading it never waits for a call in progress,
  and it still reads after `close()`. *(moss 1.16.0+)*

## Methods

### `add_docs(docs, options)`

Add or update documents in the local session index. Embeddings are generated locally
via the Rust core - no cloud round trip. When the session uses `model_id="custom"`, each
document must have `.embedding` set.

`docs` takes the same inputs as
[`MossClient.create_index()`](./MossClient#create_index-name-docs-model_id-wait): dicts, JSON
array or JSON Lines text, and `.json`, `.jsonl`, `.ndjson`, `.txt`, `.md` and `.markdown` file
paths, besides `DocumentInfo` objects. Text and markdown files are chunked natively. *(moss 1.18.0+)*

#### Parameters

* **docs** ([`DocsInput`](../interfaces/Chunking#docsinput)) - `DocumentInfo` objects, dicts, JSON array or JSON Lines text, or `pathlib.Path` objects for files. A `str` is always read as JSON text, never as a path. *(moss 1.18.0+ for anything but a list of [`DocumentInfo`](../interfaces/DocumentInfo))*
* **options** (Optional\[[`MutationOptions`](../interfaces/MutationOptions)] = `None`)
* **chunker** (`Optional[Chunker]` = `None`) - keyword-only. A synchronous function from a document's text to a list of chunk strings. See [`Chunker`](../interfaces/Chunking#chunker). *(moss 1.18.0+)*
* **chunking** (Optional\[[`Chunking`](../interfaces/Chunking)] = `None`) - keyword-only. Tunes the native chunker, and also chunks `DocumentInfo`, dict and JSON input. Pass `chunker` or `chunking`, not both. *(moss 1.18.0+)*

#### Returns

`Tuple[int, int]` - `(added_count, updated_count)`

#### Raises

* [`InvalidArgumentError`](../interfaces/InvalidArgumentError) - for invalid JSON, an unsupported file type, a file with no text to index, or a `chunker` chunk of more than 2,000 characters. See [`Chunking`](../interfaces/Chunking#errors).
* `TypeError` - when both `chunker` and `chunking` are passed.
* `ValueError` - when `chunker` or `chunking` is passed to a session that uses `model_id="custom"`, because chunks have no embeddings.

```python theme={null}
from pathlib import Path
from moss import Chunking

await session.add_docs(Path("notes.md"), chunking=Chunking(chunk_size=800))
```

***

### `delete_docs(doc_ids)`

Delete documents from the local session index by their IDs.

#### Parameters

* **doc\_ids** (`List[str]`)

#### Returns

`int` - the number of documents deleted.

***

### `get_docs(options)`

Retrieve documents from the local session index.

#### Parameters

* **options** (Optional\[[`GetDocumentsOptions`](../interfaces/GetDocumentsOptions)] = `None`)

#### Returns

List\[[`DocumentInfo`](../interfaces/DocumentInfo)]

***

### `query(query, options)`

Perform a semantic search over the local session index. Runs entirely in-memory
(\~1-10 ms) with no cloud call. Supports the same metadata filter syntax as
[`MossClient.query()`](./MossClient#query-name-query-options).

When the session uses `model_id="custom"`, provide a query embedding via
`QueryOptions.embedding`.

#### Parameters

* **query** (`str`)
* **options** (Optional\[[`QueryOptions`](../interfaces/QueryOptions)] = `None`)

#### Returns

[`SearchResult`](../interfaces/SearchResult)

***

### `push_index()`

Push the local session index to the cloud. The cloud index is created, or replaced if
one already exists with the same name. For a built-in model the service re-embeds the
text with that model, so the index loads and answers text queries like one built with
`create_index`. A custom-model session keeps its own embeddings.

#### Returns

[`PushIndexResult`](../interfaces/PushIndexResult)

***

### `save_to_disk(cache_path)`

Save the session under `<cache_path>/<name>/`, so a later session with the same name can
restore it with [`load_from_disk()`](#load_from_disk-cache_path-rebuild_legacy). Open that
session with `auto_load_on_init=False` so the restore downloads no index. A failed or
interrupted save leaves the last saved snapshot loadable. For a built-in model the snapshot
records the model id and the exact model artifact, so the restored session embeds text with
the same model. *(moss 1.16.0+)*

Without `cache_path`, or with an empty one, the snapshot goes in `sessions/<project id>/`
under the client's [`cache_path`](./MossClient#constructor),
else under the `MOSS_SESSION_CACHE_PATH` environment variable, which only session snapshots
read, else under `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux,
`%LOCALAPPDATA%\moss` on Windows. *(moss 1.19.0+)*

#### Parameters

* **cache\_path** (`Optional[str]` = `None`): Directory that holds one snapshot directory per
  session name. A relative path resolves against the current working directory, and `~` is
  not expanded.

#### Returns

`None`

```python theme={null}
await session.save_to_disk()
await session.save_to_disk("/var/cache/my-app/moss")
```

***

### `load_from_disk(cache_path, rebuild_legacy)`

Restore a session saved by [`save_to_disk()`](#save_to_disk-cache_path) from
`<cache_path>/<name>/`, or without `cache_path` from the directory `save_to_disk` uses
without one. The snapshot replaces this session's documents and model, so after a
custom-model snapshot loads, `add_docs` and `query` need embeddings. If the session has
already loaded the snapshot's model, it keeps that model instead of loading it again. A missing or damaged snapshot raises
[`MossError`](../interfaces/MossError) with code `DESERIALIZATION` and leaves the session as
it was before the call. *(moss 1.16.0+)*

A snapshot that an older core saved for a built-in model has no model artifact identity, so
it can only load as a custom-model session. With `rebuild_legacy=True` (the default), a
session opened with that same built-in model rebuilds the snapshot instead: the call
re-embeds the stored documents with the current model and saves the snapshot back, so later
loads skip the rebuild. The rebuild needs the model, so the cloud must be
reachable. When the model cannot be loaded, the call raises `MossError` with code
`MODEL_UNAVAILABLE` and changes neither the snapshot nor the session, so retry later instead
of discarding the snapshot. Custom-model sessions and snapshots of another model load
without a rebuild. Pass `rebuild_legacy=False` to load such a snapshot as a custom-model
session.

#### Parameters

* **cache\_path** (`Optional[str]` = `None`): Directory passed to `save_to_disk`, resolved the
  same way.
* **rebuild\_legacy** (`bool` = `True`): Keyword-only. Rebuild a built-in model snapshot that
  has no model artifact identity.

#### Returns

`int` - the number of documents loaded.

```python theme={null}
from moss import MossError

session = await client.session(index_name="notes", auto_load_on_init=False)
try:
    loaded = await session.load_from_disk()
except MossError as e:
    if e.code != "DESERIALIZATION":
        raise
    loaded = 0  # no snapshot yet, so the session starts empty
```

***

### `close()`

Send the final usage report, then free the session's native memory. Waits until the
report arrives or 2 seconds pass. Safe to call more than once. Afterwards `name` and
`model_id` still read and every other member raises `InvalidArgumentError`.
[`MossClient.close()`](./MossClient#close) also closes every session the client opened.
*(moss 1.15.0+)*

```python theme={null}
session = await client.session(index_name="session-abc")
try:
    await session.add_docs([DocumentInfo(id="1", text="Customer asked about billing")])
    results = await session.query("billing question")
finally:
    await session.close()
```

`SessionIndex` is also a context manager: leaving an `async with` or `with` block calls
`close()` automatically.

```python theme={null}
async with await client.session(index_name="session-abc") as session:
    await session.add_docs([DocumentInfo(id="1", text="Customer asked about billing")])
    results = await session.query("billing question")
# session.close() ran here
```

See [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).
