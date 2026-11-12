<!-- Source: https://docs.moss.dev/docs/reference/python/classes/MossClient.md -->
# MossClient (Python SDK)

> Semantic search client for vector similarity operations.

[moss v1.19.0](https://docs.moss.dev/docs/reference/python/api.md)

[moss](https://docs.moss.dev/docs/reference/python/api.md) / MossClient

Semantic search client for vector similarity operations.

All mutations and reads go through the Rust core. Querying runs against an index that
has been loaded into memory with [`load_index()`](#load_index-name-auto_refresh-polling_interval_in_seconds)
(or [`load_indexes()`](#load_indexes-names-auto_refresh-polling_interval_in_seconds)) -
load the index before you query it.

For real-time, local-first indexing during a live interaction, use
[`session()`](#session-index_name-model_id), which returns a
[`SessionIndex`](./SessionIndex).

Model responses grounded in your indexes come from a separate client, `MossInference`, not from `MossClient`. See [Inference](https://docs.moss.dev/docs/inference/sdks/python.md).

## Constructor

### `MossClient(project_id, project_key, cache_path)`

Create a client. `cache_path` is keyword-only.

#### Parameters

* **project\_id** (`str`)
* **project\_key** (`str`)
* **cache\_path** (`Optional[str]` = `None`) - default directory for the on-disk index cache and the `.moss-device-id` file. A `cache_path` passed to [`load_index()`](#load_index-name-auto_refresh-polling_interval_in_seconds) or [`load_indexes()`](#load_indexes-names-auto_refresh-polling_interval_in_seconds) overrides it. With neither, indexes are not cached on disk and the device id stays in `~/.moss`. *(moss 1.14.0+)* Sessions from this client save to `<cache_path>/sessions/<project id>/` when [`save_to_disk()`](./SessionIndex#save_to_disk-cache_path) gets no directory. *(moss 1.19.0+)*

## Methods

### `create_index(name, docs, model_id, wait)`

Create a new index and populate it with documents.

`docs` takes `DocumentInfo` objects, dicts with the same fields, JSON array or JSON Lines
text, or `pathlib.Path` objects for `.json`, `.jsonl`, `.ndjson`, `.txt`, `.md` and
`.markdown` files. Text and markdown files are chunked natively into documents `{path}#{n}`
with metadata `parentId`; `chunking` tunes that and `chunker` replaces it. See
[`DocsInput`](../interfaces/Chunking#docsinput) and [`Chunking`](../interfaces/Chunking).
*(moss 1.18.0+)*

When `model_id` is omitted, the SDK picks `"moss-minilm"` when no documents
carry pre-computed embeddings and `"custom"` when every document provides an
`embedding`. Mixed documents are rejected.

By default (`wait=True`) the call blocks until the build finishes and returns a
[`MutationResult`](../interfaces/MutationResult). With `wait=False` it submits the
build and returns a [`JobHandle`](./JobHandle) as soon as the upload is accepted, so
you can fire the build, tear down the machine, and check on it later.

> [!NOTE]
>
> The `wait` parameter and [`JobHandle`](./JobHandle) require `moss` **1.7.1+** (which pulls `inferedge-moss-core` `0.20.1`).

#### Parameters

* **name** (`str`)
* **docs** ([`DocsInput`](../interfaces/Chunking#docsinput)) - documents, JSON text or file paths. A `str` is always read as JSON text, never as a path, so wrap a path in `pathlib.Path`. In a dict or JSON document, boolean metadata values are stored as `"true"` and `"false"` and numbers as decimal strings. *(moss 1.18.0+ for anything but a list of [`DocumentInfo`](../interfaces/DocumentInfo))*
* **model\_id** (`Optional[str]` = `None`)
* **wait** (`bool` = `True`) — when `False`, return a [`JobHandle`](./JobHandle) immediately instead of blocking until the build completes.
* **chunker** (`Optional[Chunker]` = `None`) - keyword-only. A synchronous function from a document's text to a list of chunk strings, applied to every document, files included. Each chunk may have at most 2,000 characters. See [`Chunker`](../interfaces/Chunking#chunker). *(moss 1.18.0+)*
* **chunking** (Optional\[[`Chunking`](../interfaces/Chunking)] = `None`) - keyword-only. Tunes the native chunker (`chunk_size`, `chunk_overlap`, `mode`, `markdown_header_depth`). It also chunks `DocumentInfo`, dict and JSON input, which are indexed as given without it. Pass `chunker` or `chunking`, not both. *(moss 1.18.0+)*

#### Returns

[`MutationResult`](../interfaces/MutationResult) when `wait=True`, otherwise [`JobHandle`](./JobHandle).

#### Raises

* [`InvalidArgumentError`](../interfaces/InvalidArgumentError) - for invalid JSON, a record that breaks the document rules (the message gives its position), an unsupported file type, a file with no text to index, or a `chunker` chunk of more than 2,000 characters. See [`Chunking`](../interfaces/Chunking#errors).
* `TypeError` - when both `chunker` and `chunking` are passed (`pass chunker or chunking, not both`).
* `ValueError` - when `chunker` or `chunking` is passed with `model_id="custom"` (`chunker and chunking cannot be used with model_id='custom': chunks have no embeddings`).

#### Example: submit without waiting

```python theme={null}
# Submit the build and return right away
job = await client.create_index("my-index", docs, "moss-minilm", wait=False)
print(job.job_id)                 # available immediately

# Optional: watch progress
status = await job.status()       # status, progress, current_phase

# Block until done if you want the result in-process
result = await job.wait()

# Or reconnect later from a fresh client and poll by id
status = await client.get_job_status(job.job_id)
```

#### Example: JSON, files and chunking

```python theme={null}
from pathlib import Path
from moss import Chunking

# JSON text, a JSON Lines file, or dicts
await client.create_index("faqs", '[{"id": "1", "text": "Track your order in your account."}]')
await client.create_index("faqs-jsonl", Path("faqs.jsonl"))  # one JSON object per line
await client.add_docs("faqs", [{"id": "2", "text": "30-day returns.", "metadata": {"days": 30}}])

# Text and markdown files are chunked into handbook.md#0, handbook.md#1, ...
await client.create_index("handbook", [Path("handbook.md"), Path("faq.txt")])

# Tune the native chunker, or split text yourself
await client.create_index("kb", Path("notes.md"), chunking=Chunking(chunk_size=800, chunk_overlap=100))
await client.create_index("kb-custom", Path("notes.md"), chunker=lambda text: text.split("\n---\n"))
```

***

### `create_index_from_files(name, files, model_id, parse_options)`

Create a new index by uploading raw files (PDF and DOCX) for server-side parsing and
embedding. Blocks until the index is ready.

> [!NOTE]
>
> Requires `moss` **1.7.3+**.

#### Parameters

* **name** (`str`)
* **files** (List\[`ParseFileInput`]) - each file carries `name` (`str`, unique within the call), `content_type` (`"application/pdf"` or `"application/vnd.openxmlformats-officedocument.wordprocessingml.document"`), and either `path` (`Optional[str]`) or `data` (`Optional[bytes]`).
* **model\_id** (`Optional[str]` = `None`) - defaults to `"moss-minilm"`; `"custom"` is not supported because embeddings are generated server-side during parsing.
* **parse\_options** (Optional\[`ParseOptions`] = `None`) - extraction controls: `ocr_mode` (`"auto_ocr"` / `"full_ocr"`, use `"full_ocr"` for scanned documents with no text layer), `use_high_resolution` (higher fidelity, useful for dense tables), `segmentation_method` (`"smart_layout_detection"` / `"page_by_page"`), `merge_tables`, `chunk_size` (maximum characters per chunk, 200-2000, default 1200) and `chunk_overlap` (0 to half of `chunk_size`, default 200 or half of `chunk_size` when smaller) *(moss 1.17.0+)*. Omitted fields use the server defaults.

#### Returns

[`MutationResult`](../interfaces/MutationResult)

#### Example

```python theme={null}
from moss import MossClient, ParseFileInput, ParseOptions

result = await client.create_index_from_files("contracts", [
    ParseFileInput(name="report.pdf", content_type="application/pdf", path="/docs/report.pdf"),
], parse_options=ParseOptions(ocr_mode="full_ocr"))
```

Up to 20 files per call, 50 MB per file. See the [Index from Files](https://docs.moss.dev/docs/reference/python/files.md) guide for
parse options, limits, and querying notes.

***

### `add_docs(name, docs, options)`

Add or update documents in an index. `docs`, `chunker` and `chunking` work as in
[`create_index()`](#create_index-name-docs-model_id-wait).

#### Parameters

* **name** (`str`)
* **docs** ([`DocsInput`](../interfaces/Chunking#docsinput)) - `DocumentInfo` objects, dicts, JSON array or JSON Lines text, or `pathlib.Path` objects for `.json`, `.jsonl`, `.ndjson`, `.txt`, `.md` and `.markdown` files. *(moss 1.18.0+ for anything but a list of [`DocumentInfo`](../interfaces/DocumentInfo))*
* **options** (Optional\[[`MutationOptions`](../interfaces/MutationOptions)] = `None`)
* **chunker** (`Optional[Chunker]` = `None`) - keyword-only. See [`Chunker`](../interfaces/Chunking#chunker). *(moss 1.18.0+)*
* **chunking** (Optional\[[`Chunking`](../interfaces/Chunking)] = `None`) - keyword-only. Pass `chunker` or `chunking`, not both. *(moss 1.18.0+)*

#### Returns

[`MutationResult`](../interfaces/MutationResult)

#### Raises

[`InvalidArgumentError`](../interfaces/InvalidArgumentError) and `TypeError` as in [`create_index()`](#create_index-name-docs-model_id-wait).

```python theme={null}
await client.add_docs("handbook", Path("docs/returns.md"), chunking=Chunking(chunk_size=800))
```

***

### `delete_docs(name, doc_ids)`

Delete documents from an index by their IDs.

#### Parameters

* **name** (`str`)
* **doc\_ids** (`List[str]`)

#### Returns

[`MutationResult`](../interfaces/MutationResult)

***

### `get_job_status(job_id)`

Get the status of a bulk operation job.

#### Parameters

* **job\_id** (`str`)

#### Returns

[`JobStatusResponse`](../interfaces/JobStatusResponse)

***

### `get_index(name)`

Get information about a specific index.

#### Parameters

* **name** (`str`)

#### Returns

[`IndexInfo`](../interfaces/IndexInfo)

***

### `list_indexes()`

List all indexes with their information.

#### Returns

List\[[`IndexInfo`](../interfaces/IndexInfo)]

***

### `delete_index(name)`

Delete an index and all its data.

#### Parameters

* **name** (`str`)

#### Returns

`bool`

***

### `get_docs(name, options)`

Retrieve documents from an index.

#### Parameters

* **name** (`str`)
* **options** (Optional\[[`GetDocumentsOptions`](../interfaces/GetDocumentsOptions)] = `None`)

#### Returns

List\[[`DocumentInfo`](../interfaces/DocumentInfo)]

***

### `load_index(name, auto_refresh, polling_interval_in_seconds)`

Downloads an index from the cloud into memory for fast local querying. An index must be
loaded before you can [`query()`](#query-name-query-options) it; once loaded, queries run
entirely in-memory (\~1-10 ms). Set `auto_refresh=True` to keep the loaded index in sync
with cloud updates by polling every `polling_interval_in_seconds`.

With a `cache_path`, the downloaded index is saved under that directory and reused on later
loads while the cloud copy is unchanged. Each load still checks the cloud for a newer version.
When a snapshot is already on disk and the cloud is unreachable or answers with a temporary
error, the load serves that snapshot instead of raising. A 401, 403 or 404 still raises. See
[`was_served_stale()`](#was_served_stale-name) and
[Storage & Persistence](https://docs.moss.dev/docs/integrate/storage-persistence.md#disk-cache).

> [!NOTE]
>
> `cache_path` requires `moss` **1.11.0+**. The client-level default and serving the snapshot while the cloud is unreachable require `moss` **1.14.0+** (which pulls `inferedge-moss-core` `0.26.0`).

#### Parameters

* **name** (`str`)
* **auto\_refresh** (`bool` = `False`)
* **polling\_interval\_in\_seconds** (`int` = `600`)
* **cache\_path** (`Optional[str]` = `None`) - directory for the on-disk index cache. When omitted, the client's [`cache_path`](#constructor) is used.

#### Returns

`str`

***

### `unload_index(name)`

Unload an index from memory.

#### Parameters

* **name** (`str`)

***

### `query(name, query, options)`

Perform a semantic similarity search against a loaded index. Call
[`load_index(name)`](#load_index-name-auto_refresh-polling_interval_in_seconds) first;
queries then run entirely in-memory (\~1-10 ms). Metadata filtering is supported on
locally loaded indexes.

#### Parameters

* **name** (`str`)
* **query** (`str`)
* **options** (Optional\[[`QueryOptions`](../interfaces/QueryOptions)] = `None`): Query options (`top_k`, `alpha`, `embedding`, `filter`, `group_by`, `min_score`, `candidate_depth`). `min_score` and `candidate_depth` require `moss` **1.14.0+**.

#### Returns

[`SearchResult`](../interfaces/SearchResult)

***

### `query_multi_index(names, query, options)`

Search across multiple loaded indexes and return the global top-K. All requested indexes
must be loaded locally and share the same embedding model. Each result document is tagged
with its source `index_name`.

`options.top_k` is the **global** cap across the merged result. See [Multi-index search](https://docs.moss.dev/docs/integrate/multi-index-search.md).

#### Parameters

* **names** (`List[str]`): Non-empty list of loaded index names.
* **query** (`str`)
* **options** (Optional\[[`QueryOptions`](../interfaces/QueryOptions)] = `None`)

#### Returns

[`SearchResult`](../interfaces/SearchResult) - `docs` carry `index_name` per result.

***

### `load_indexes(names, auto_refresh, polling_interval_in_seconds)`

Bulk-load many indexes into memory. Best-effort: a failure on one name does not roll back
the others. `auto_refresh`, `polling_interval_in_seconds` and `cache_path` apply to the whole
batch, as in [`load_index()`](#load_index-name-auto_refresh-polling_interval_in_seconds).

#### Parameters

* **names** (`List[str]`)
* **auto\_refresh** (`bool` = `False`)
* **polling\_interval\_in\_seconds** (`int` = `600`)
* **cache\_path** (`Optional[str]` = `None`) - directory for the on-disk index cache. *(moss 1.11.0+)* When omitted, the client's [`cache_path`](#constructor) is used. *(moss 1.14.0+)*

#### Returns

[`LoadIndexesResult`](../interfaces/LoadIndexesResult)

***

### `unload_indexes(names)`

Bulk-unload many indexes from memory. Idempotent for names that aren't loaded.

#### Parameters

* **names** (`List[str]`)

***

### `was_served_stale(name)`

Whether a loaded index is served from an on-disk snapshot because the cloud was unreachable
when it loaded. Such a load starts a refresh poller on its own, and this returns `False` again
once a refresh or a new load reaches the cloud. Raises `RuntimeError` when the index is not loaded.

Until the cloud is reachable, a built-in embedding model may not open, so text queries with
`alpha` above 0 can fail. Keyword-only queries (`alpha=0`) and queries that pass their own
`embedding` keep working.

> [!NOTE]
>
> Requires `moss` **1.14.0+** (which pulls `inferedge-moss-core` `0.26.0`).

#### Parameters

* **name** (`str`)

#### Returns

`bool`

***

### `session(index_name, model_id)`

Create or resume a local, real-time [`SessionIndex`](./SessionIndex). If a cloud index with
the given name already exists, it is auto-loaded into the session (no re-embedding), and the
session takes its model, even when the index has no documents. Otherwise the session starts
empty. The `index_name` is also the target when [`push_index()`](./SessionIndex#push_index)
is later called.

With `auto_load_on_init=False` the session skips that load and starts empty with
`model_id`, so [`load_from_disk()`](./SessionIndex#load_from_disk-cache_path-rebuild_legacy)
can restore a saved session with no index download. A `push_index()` before any load
replaces the cloud index with the session's documents. *(moss 1.16.0+)*

Raises `ValueError` if an existing cloud index uses a different model than an explicit
`model_id`. See the [Sessions guide](https://docs.moss.dev/docs/integrate/sessions.md).

#### Parameters

* **index\_name** (`str`)
* **model\_id** (`Optional[str]` = `None`): Local embedding model. Defaults to `"moss-minilm"`. Other options: `"moss-mediumlm"`, `"custom"`.
* **auto\_load\_on\_init** (`bool` = `True`): Keyword-only. Load an existing cloud index into the session before returning. *(moss 1.16.0+)*

#### Returns

[`SessionIndex`](./SessionIndex)

```python theme={null}
# Resume the cloud index of the same name, or start empty
session = await client.session(index_name="call-123")

# Skip the cloud load and restore a snapshot saved with save_to_disk
session = await client.session(index_name="notes", auto_load_on_init=False)
loaded = await session.load_from_disk("/var/cache/my-app/moss")
```

***

### `close()`

Send the final usage report, then free the native memory of this client and of every
session it opened. Waits until the report arrives or 2 seconds pass. Safe to call more
than once. Afterwards every method raises `RuntimeError("MossClient is closed")`; create a
new client to continue. *(moss 1.15.0+)*

```python theme={null}
client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)
try:
    await client.load_index("my-index")
    results = await client.query("my-index", "refund policy")
finally:
    await client.close()
```

`MossClient` is also a context manager: leaving an `async with` or `with` block calls
`close()` automatically.

```python theme={null}
async with MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY) as client:
    await client.load_index("my-index")
    results = await client.query("my-index", "refund policy")
# client.close() ran here
```

See [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).
