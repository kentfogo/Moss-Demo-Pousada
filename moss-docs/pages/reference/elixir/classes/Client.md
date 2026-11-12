<!-- Source: https://docs.moss.dev/docs/reference/elixir/classes/Client.md -->
# Moss.Client

> Entry point for cloud index management and local querying in the Moss Elixir SDK.

[Elixir SDK](https://docs.moss.dev/docs/reference/elixir/api.md) / Moss.Client

The single entry point for the Moss Elixir SDK. Construct a client with your
project credentials, then use it for cloud index CRUD, loading indexes into
memory, local querying, and opening [`Moss.Session`](./Session) handles for
real-time indexing.

Cloud operations (`create_index`, `add_docs`, `delete_docs`, `get_docs`,
`get_index`, `list_indexes`, `delete_index`, `get_job_status`) read and write the
server-side index. Local operations (`load_index`, `load_indexes`, `unload_index`,
`unload_indexes`, `has_index`, `query`, `query_multi_index`, `refresh_index`,
`get_index_info`) act on indexes loaded into memory.

An index must be loaded with [`load_index/3`](#load_index-client-name-opts) before
you can [`query/4`](#query-client-name-query_text-opts) it. Once loaded, queries
run entirely in-memory with no network round trip.

Every `{:error, reason}` carries a [`%Moss.Error{}`](../types#error): match on its `code`
atom, not on the message. The one exception is [`session/3`](#session-client-index_name-opts)
with a `:server_name` that is already registered. *(Elixir moss 1.5.0+)*

Model responses grounded in your indexes come from a separate client,
`Moss.Inference`, not from `Moss.Client`. See [Inference](https://docs.moss.dev/docs/inference/sdks/elixir.md).

## Methods

### `new(project_id, project_key, opts)`

Create a new client. Starts an internal local index manager and generates a
per-client UUID for telemetry correlation. The index API URL is resolved from the
`MOSS_INDEX_URL` environment variable, falling back to the default cloud endpoint.

#### Parameters

* **project\_id** (`String.t()`)
* **project\_key** (`String.t()`)
* **opts** (`keyword()` = `[]`): supports `:cache_path` (`String.t()`), the directory for the on-disk index cache that `load_index/3` uses and the `.moss-device-id` file. Sessions from this client save to `<cache_path>/sessions/<project id>/` when [`Moss.Session.save_to_disk/2`](./Session#save_to_disk-session-cache_path) gets no path (Elixir moss 1.8.0+).

#### Returns

`{:ok, Moss.Client.t()}` or `{:error, Moss.Error.t()}`

```elixir theme={null}
{:ok, client} = Moss.Client.new("your-project-id", "your-project-key")
{:ok, client} = Moss.Client.new("your-project-id", "your-project-key", cache_path: "/var/cache/my_app/moss")
```

***

### `create_index(client, name, docs, model_id)`

Create a new cloud index and populate it with documents.

`model_id` is optional and defaults to `"moss-minilm"`. Pass `"moss-mediumlm"`
for higher accuracy, or `"custom"` when every document carries a pre-computed
`embedding`.

#### Parameters

* **client** (`Moss.Client.t()`)
* **name** (`String.t()`)
* **docs** (list of [`Moss.DocumentInfo`](../types#documentinfo))
* **model\_id** (`String.t()` = `"moss-minilm"`)

#### Returns

`{:ok, Moss.MutationResult.t()}` or `{:error, Moss.Error.t()}`

```elixir theme={null}
{:ok, result} = Moss.Client.create_index(client, "faqs", documents)
{:ok, result} = Moss.Client.create_index(client, "faqs", documents, "moss-mediumlm")
```

***

### `add_docs(client, name, docs, opts)`

Add or update documents in an existing cloud index.

#### Parameters

* **client** (`Moss.Client.t()`)
* **name** (`String.t()`)
* **docs** (list of [`Moss.DocumentInfo`](../types#documentinfo))
* **opts** (`keyword()` = `[]`): supports `:upsert` (boolean). When omitted, the server default applies.

#### Returns

`{:ok, Moss.MutationResult.t()}` or `{:error, Moss.Error.t()}`

```elixir theme={null}
{:ok, result} = Moss.Client.add_docs(client, "faqs", more_docs, upsert: true)
```

***

### `delete_docs(client, name, doc_ids)`

Delete documents from a cloud index by their IDs.

#### Parameters

* **client** (`Moss.Client.t()`)
* **name** (`String.t()`)
* **doc\_ids** (list of `String.t()`)

#### Returns

`{:ok, Moss.MutationResult.t()}` or `{:error, Moss.Error.t()}`

```elixir theme={null}
{:ok, result} = Moss.Client.delete_docs(client, "faqs", ["doc1", "doc2"])
```

***

### `get_docs(client, name, opts)`

Retrieve documents from a cloud index.

#### Parameters

* **client** (`Moss.Client.t()`)
* **name** (`String.t()`)
* **opts** (`keyword()` = `[]`): supports `:doc_ids` (list of strings). When provided, only those documents are fetched; otherwise all documents are returned.

#### Returns

`{:ok, [Moss.DocumentInfo.t()]}` or `{:error, Moss.Error.t()}`

```elixir theme={null}
{:ok, docs} = Moss.Client.get_docs(client, "faqs", doc_ids: ["doc1"])
```

***

### `get_index(client, name)`

Get metadata for a cloud index.

#### Parameters

* **client** (`Moss.Client.t()`)
* **name** (`String.t()`)

#### Returns

`{:ok, Moss.IndexInfo.t()}` or `{:error, Moss.Error.t()}`

***

### `list_indexes(client)`

List all cloud indexes for the project, with their metadata.

#### Parameters

* **client** (`Moss.Client.t()`)

#### Returns

`{:ok, [Moss.IndexInfo.t()]}` or `{:error, Moss.Error.t()}`

***

### `delete_index(client, name)`

Delete a cloud index and all of its data.

#### Parameters

* **client** (`Moss.Client.t()`)
* **name** (`String.t()`)

#### Returns

`{:ok, boolean()}` or `{:error, Moss.Error.t()}`

***

### `get_job_status(client, job_id)`

Poll the status of an asynchronous job, such as the one returned by
[`create_index/4`](#create_index-client-name-docs-model_id) or
[`add_docs/4`](#add_docs-client-name-docs-opts).

#### Parameters

* **client** (`Moss.Client.t()`)
* **job\_id** (`String.t()`)

#### Returns

`{:ok, Moss.JobStatusResponse.t()}` or `{:error, Moss.Error.t()}`

```elixir theme={null}
{:ok, status} = Moss.Client.get_job_status(client, result.job_id)
```

***

### `load_index(client, name, opts)`

Download a cloud index into memory for fast local querying. An index must be
loaded before you can [`query/4`](#query-client-name-query_text-opts) it; once
loaded, queries run entirely in-memory with no network round trip.

Set `auto_refresh: true` to keep the loaded index in sync with cloud updates by
polling every `:polling_interval` seconds.

#### Parameters

* **client** (`Moss.Client.t()`)
* **name** (`String.t()`)
* **opts** (`keyword()` = `[]`): supports `:auto_refresh` (boolean, default `false`) and `:polling_interval` (integer seconds, default `600`).

#### Returns

`{:ok, Moss.IndexInfo.t()}` or `{:error, Moss.Error.t()}`

```elixir theme={null}
{:ok, info} = Moss.Client.load_index(client, "faqs")
{:ok, info} = Moss.Client.load_index(client, "faqs", auto_refresh: true, polling_interval: 300)
```

***

### `load_indexes(client, names, opts)`

Load several cloud indexes into memory in one call. A name that fails to load is
reported in `failed` and does not affect the others. The options apply to every
index.

#### Parameters

* **client** (`Moss.Client.t()`)
* **names** (list of `String.t()`)
* **opts** (`keyword()` = `[]`): supports `:auto_refresh` (boolean, default `false`) and `:polling_interval` (integer seconds, default `600`).

#### Returns

`{:ok, Moss.LoadIndexesResult.t()}`. See [`LoadIndexesResult`](../types#loadindexesresult).

```elixir theme={null}
{:ok, %Moss.LoadIndexesResult{loaded: loaded, failed: failed}} =
  Moss.Client.load_indexes(client, ["products", "reviews"])
```

***

### `query(client, name, query_text, opts)`

Perform a semantic similarity search against a loaded index. Call
[`load_index/3`](#load_index-client-name-opts) first; queries then run entirely
in-memory. Metadata filtering is supported on locally loaded indexes.

For built-in models the query is embedded automatically. For indexes created with
`model_id: "custom"`, pass the query embedding via the `:embedding` option.

#### Parameters

* **client** (`Moss.Client.t()`)
* **name** (`String.t()`)
* **query\_text** (`String.t()`)
* **opts** (`keyword()` = `[]`): supports `:top_k` (integer, default `5`), `:alpha` (float, default `0.8`), `:filter` (map), and `:embedding` (list of floats, required for `model_id: "custom"`).

#### Returns

`{:ok, Moss.SearchResult.t()}` or `{:error, Moss.Error.t()}`

```elixir theme={null}
{:ok, result} = Moss.Client.query(client, "faqs", "return a damaged product", top_k: 3, alpha: 0.6)

# With a metadata filter
{:ok, result} = Moss.Client.query(client, "faqs", "running shoes",
  top_k: 5,
  filter: %{
    "$and" => [
      %{"field" => "category", "condition" => %{"$eq" => "shoes"}},
      %{"field" => "price", "condition" => %{"$lt" => "100"}}
    ]
  }
)
```

`alpha` tunes the hybrid blend: `1.0` is pure semantic, `0.0` is pure keyword,
and the default `0.8` is semantic-heavy. Filter operators: `$eq`, `$ne`, `$gt`,
`$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$near`. Logical combinators: `$and`,
`$or` (nestable).

***

### `query_multi_index(client, names, query_text, opts)`

Search several loaded indexes in one call and get the global top-k. Each result
carries the `index_name` of its source index. Options work as in
[`query/4`](#query-client-name-query_text-opts).

Returns `{:error, reason}` when `names` is empty, a name is not loaded, or the
indexes use different embedding models.

#### Parameters

* **client** (`Moss.Client.t()`)
* **names** (list of `String.t()`)
* **query\_text** (`String.t()`)
* **opts** (`keyword()` = `[]`): supports `:top_k` (integer, default `10`, caps the merged result), `:alpha` (float, default `0.8`), `:filter` (map, applied to every index), and `:embedding` (list of floats, required for `model_id: "custom"` unless `alpha: 0.0`).

#### Returns

`{:ok, Moss.SearchResult.t()}` or `{:error, Moss.Error.t()}`

```elixir theme={null}
{:ok, results} =
  Moss.Client.query_multi_index(client, ["products", "reviews"], "noise cancelling headphones",
    top_k: 5,
    alpha: 0.5
  )

for doc <- results.docs do
  IO.puts("[#{doc.index_name}] #{doc.id}: #{doc.text}")
end
```

***

### `refresh_index(client, name)`

Force an immediate refresh of a loaded index from the cloud, picking up any
server-side changes since it was loaded.

#### Parameters

* **client** (`Moss.Client.t()`)
* **name** (`String.t()`)

#### Returns

`{:ok, Moss.RefreshResult.t()}` or `{:error, Moss.Error.t()}`

***

### `get_index_info(client, name)`

Get metadata for an index that is currently loaded into memory.

#### Parameters

* **client** (`Moss.Client.t()`)
* **name** (`String.t()`)

#### Returns

`{:ok, Moss.IndexInfo.t()}` or `{:error, Moss.Error.t()}`

***

### `has_index(client, name)`

Check whether an index is currently loaded into memory.

#### Parameters

* **client** (`Moss.Client.t()`)
* **name** (`String.t()`)

#### Returns

`boolean()`

***

### `unload_index(client, name)`

Unload an index from memory, freeing its resources. The cloud copy is unaffected.

#### Parameters

* **client** (`Moss.Client.t()`)
* **name** (`String.t()`)

#### Returns

`{:ok, :ok}` or `{:error, Moss.Error.t()}`

***

### `unload_indexes(client, names)`

Unload several indexes from memory. Names that are not loaded are ignored. The
cloud copies are unaffected.

#### Parameters

* **client** (`Moss.Client.t()`)
* **names** (list of `String.t()`)

#### Returns

`:ok`

***

### `session(client, index_name, opts)`

Create or resume a local, real-time [`Moss.Session`](./Session). If a cloud index
with `index_name` already exists, it is silently loaded into the session, and the
session takes its model, even when the index has no documents. Otherwise the session
starts empty. An explicit `:model_id` that the existing index does not use returns
`{:error, %Moss.Error{code: :invalid_argument}}`. Built-in models are pre-warmed to
eliminate cold-start delay on the first query. `index_name` is also the target when
[`Moss.Session.push_index/1`](./Session#push_index-session) is later called.

With `auto_load_on_init: false` the session skips that load and starts empty with
`:model_id`, so [`Moss.Session.load_from_disk/3`](./Session#load_from_disk-session-cache_path-opts)
can restore a saved session with no index download.
[`Moss.Session.push_index/1`](./Session#push_index-session) before any load replaces the
cloud index with the session's documents. *(Elixir moss 1.6.0+)*

#### Parameters

* **client** (`Moss.Client.t()`)
* **index\_name** (`String.t()`)
* **opts** (`keyword()` = `[]`): supports `:model_id` (`String.t()`, default `"moss-minilm"`; other options `"moss-mediumlm"`, `"custom"`), `:auto_load_on_init` (boolean, default `true`; whether to load an existing cloud index into the session before returning; Elixir moss 1.6.0+) and `:server_name` (GenServer name for the session process).

#### Returns

`{:ok, GenServer.server()}` or `{:error, Moss.Error.t()}`. A `:server_name` that is already
registered returns GenServer's `{:error, {:already_started, pid}}` instead.

```elixir theme={null}
{:ok, session} = Moss.Client.session(client, "session-abc")
{:ok, custom} = Moss.Client.session(client, "custom-session", model_id: "custom")

# Skip the cloud load and restore a snapshot saved with Moss.Session.save_to_disk/2
{:ok, notes} = Moss.Client.session(client, "notes", auto_load_on_init: false)
{:ok, doc_count} = Moss.Session.load_from_disk(notes, "/var/cache/my_app/moss")
```

***

### `close(client)`

Close the client's index manager: send its final usage report, unload its indexes and
stop its process. Waits until the report arrives or 2 seconds pass. Sessions are separate
processes, so close each with [`Moss.Session.close/1`](./Session#close-session). Cloud
calls such as `create_index/4` keep working afterwards; calls that go through the index
manager, such as `load_index/3`, exit. *(Elixir moss 1.5.0+)*

#### Parameters

* **client** (`Moss.Client.t()`)

#### Returns

`:ok`

```elixir theme={null}
:ok = Moss.Client.close(client)
```

See [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).
