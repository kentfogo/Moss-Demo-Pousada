<!-- Source: https://docs.moss.dev/docs/reference/elixir/classes/Session.md -->
# Moss.Session

> Local in-session index for real-time embedding, search, and cloud sync.

[Elixir SDK](https://docs.moss.dev/docs/reference/elixir/api.md) / Moss.Session

A local, in-session index backed by the Rust core. Index documents in memory
during a live workflow (voice AI agents, chat) and query them with no cloud round
trips, then push the index to the cloud when done.

Sessions are opened with
[`Moss.Client.session/3`](./Client#session-client-index_name-opts), which handles
credentials and auto-loads from the cloud if an index with the given name already
exists, unless you pass `auto_load_on_init: false`. The functions below take the session
reference returned by that call. A session can be saved to disk
([`save_to_disk/2`](#save_to_disk-session-cache_path) and
[`load_from_disk/3`](#load_from_disk-session-cache_path-opts)) or synced to the cloud
([`push_index/1`](#push_index-session) and [`load_index/2`](#load_index-session-index_name)).

For built-in models (`"moss-minilm"`, `"moss-mediumlm"`), embeddings are computed
automatically in the Rust core. For `model_id: "custom"`, each document must set
`.embedding`, and [`query/3`](#query-session-query_text-opts) requires an
`:embedding` option.

Every `{:error, reason}` carries a [`%Moss.Error{}`](../types#error): match on its `code`
atom, not on the message. *(Elixir moss 1.5.0+)*

## Example

```elixir theme={null}
{:ok, client} = Moss.Client.new("project-id", "project-key")
{:ok, session} = Moss.Client.session(client, "session-abc")

docs = [
  %Moss.DocumentInfo{id: "turn-1", text: "Customer: I need to cancel my subscription"},
  %Moss.DocumentInfo{id: "turn-2", text: "Agent: I can help with that. Can I ask why?"}
]

{:ok, {2, 0}} = Moss.Session.add_docs(session, docs)
{:ok, result} = Moss.Session.query(session, "subscription cancellation", top_k: 2)
{:ok, push_result} = Moss.Session.push_index(session)
```

## Methods

### `add_docs(session, docs, opts)`

Add or update documents in the session index, embedding them in the Rust core.
Returns the counts of documents added (new IDs) and updated (existing IDs).

For built-in models embeddings are computed automatically. For
`model_id: "custom"`, each document must have `.embedding` set.

#### Parameters

* **session** (`GenServer.server()`)
* **docs** (list of [`Moss.DocumentInfo`](../types#documentinfo))
* **opts** (`keyword()` = `[]`): supports `:upsert` (boolean, default `true`).

#### Returns

`{:ok, {added, updated}}` or `{:error, Moss.Error.t()}`

```elixir theme={null}
{:ok, {2, 0}} = Moss.Session.add_docs(session, docs)
```

***

### `delete_docs(session, doc_ids)`

Delete documents from the session index by their IDs. Returns the number of
documents actually deleted (missing IDs are ignored).

#### Parameters

* **session** (`GenServer.server()`)
* **doc\_ids** (list of `String.t()`)

#### Returns

`non_neg_integer()`

```elixir theme={null}
deleted = Moss.Session.delete_docs(session, ["turn-1"])
```

***

### `get_docs(session, opts)`

Retrieve documents from the session index.

#### Parameters

* **session** (`GenServer.server()`)
* **opts** (`keyword()` = `[]`): supports `:doc_ids` (list of strings). When provided, only those documents are returned; otherwise all documents are returned.

#### Returns

`[Moss.DocumentInfo.t()]`

```elixir theme={null}
docs = Moss.Session.get_docs(session, doc_ids: ["turn-1"])
```

***

### `query(session, query_text, opts)`

Run a semantic similarity search against the session index. For built-in models
the query is embedded automatically in the Rust core. For `model_id: "custom"`,
pass the query embedding via the `:embedding` option. Metadata filtering is
supported.

#### Parameters

* **session** (`GenServer.server()`)
* **query\_text** (`String.t()`)
* **opts** (`keyword()` = `[]`): supports `:top_k` (integer, default `5`), `:alpha` (float, default `0.8`), `:filter` (map), and `:embedding` (list of floats, required for `model_id: "custom"`).

#### Returns

`{:ok, Moss.SearchResult.t()}` or `{:error, Moss.Error.t()}`

```elixir theme={null}
{:ok, result} = Moss.Session.query(session, "subscription cancellation", top_k: 2, alpha: 0.6)
```

`alpha` tunes the hybrid blend: `1.0` is pure semantic, `0.0` is pure keyword,
and the default `0.8` is semantic-heavy.

***

### `model_id(session)`

The embedding model the session uses, or `"custom"`. A load moves the session to the
loaded model, and [`add_docs/3`](#add_docs-session-docs-opts) and
[`query/3`](#query-session-query_text-opts) read it from the core on every call, so after a
custom-model load they need embeddings. *(Elixir moss 1.6.0+)*

#### Parameters

* **session** (`GenServer.server()`)

#### Returns

`String.t()`

```elixir theme={null}
model_id = Moss.Session.model_id(session)
```

***

### `load_index(session, index_name)`

Load an existing cloud index into this session. Returns the document count loaded.
The index replaces the session's documents and model, so after a custom-model index
loads, `add_docs/3` and `query/3` need embeddings. After loading, the session behaves
as a local index: subsequent add, delete, and query operations run in memory without
hitting the network.

#### Parameters

* **session** (`GenServer.server()`)
* **index\_name** (`String.t()`)

#### Returns

`{:ok, non_neg_integer()}` or `{:error, Moss.Error.t()}`

```elixir theme={null}
{:ok, doc_count} = Moss.Session.load_index(session, "faqs")
```

***

### `push_index(session)`

Push the local session index to the cloud, creating or replacing the server-side
index. Returns a [`Moss.PushIndexResult`](../types#pushindexresult) with a
`job_id`; poll it with
[`Moss.Client.get_job_status/2`](./Client#get_job_status-client-job_id) until the
status is `ready`.

#### Parameters

* **session** (`GenServer.server()`)

#### Returns

`{:ok, Moss.PushIndexResult.t()}` or `{:error, Moss.Error.t()}`

```elixir theme={null}
{:ok, push_result} = Moss.Session.push_index(session)
```

***

### `save_to_disk(session, cache_path)`

Save the session under `<cache_path>/<name>/`, so a later session with the same name can
restore it with [`load_from_disk/3`](#load_from_disk-session-cache_path-opts). Open that
session with `auto_load_on_init: false` so the restore downloads no index. A failed or
interrupted save leaves the last saved snapshot loadable. For a built-in model the snapshot
records the model id and the exact model artifact. *(Elixir moss 1.6.0+)*

Without `cache_path`, or with an empty one, the snapshot goes in `sessions/<project id>/`
under the client's `:cache_path`, else under the `MOSS_SESSION_CACHE_PATH` environment
variable, which only session snapshots read, else under `moss` in the default cache
directory: `~/.cache/moss` on macOS and Linux, `%LOCALAPPDATA%\moss` on Windows. The
variable is read from the environment the VM started with, so `System.put_env/2` does not
change it. Set the client's `:cache_path` instead. *(Elixir moss 1.8.0+)*

#### Parameters

* **session** (`GenServer.server()`)
* **cache\_path** (`String.t() | nil` = `nil`): Directory that holds one snapshot directory per session name. A relative path resolves against the current working directory, and `~` is not expanded.

#### Returns

`:ok` or `{:error, Moss.Error.t()}`

```elixir theme={null}
:ok = Moss.Session.save_to_disk(session)
:ok = Moss.Session.save_to_disk(session, "/var/cache/my_app/moss")
```

***

### `load_from_disk(session, cache_path, opts)`

Restore a session saved by [`save_to_disk/2`](#save_to_disk-session-cache_path) from
`<cache_path>/<name>/`. The snapshot replaces this session's documents and model, so after a
custom-model snapshot loads, `add_docs/3` and `query/3` need embeddings. A missing or damaged
snapshot returns `{:error, %Moss.Error{code: :deserialization}}` and leaves the session as it
was. *(Elixir moss 1.6.0+)*

Without `cache_path`, or with only options, it reads the directory that `save_to_disk/2`
picks without one. *(Elixir moss 1.8.0+)*

A snapshot that an older core saved for a built-in model has no model artifact identity, so
it can only load as a custom-model session. With `rebuild_legacy: true` (the default), a
session opened with that same built-in model rebuilds the snapshot instead: the call
re-embeds the stored documents with the current model and saves the snapshot back, so later
loads skip the rebuild. The rebuild needs the model, so the cloud must be
reachable. When the model cannot be loaded, the call returns
`{:error, %Moss.Error{code: :model_unavailable}}` and changes nothing, so retry later instead
of discarding the snapshot. Custom-model sessions and snapshots of another model load
without a rebuild. Pass `rebuild_legacy: false` to load such a snapshot as a custom-model
session.

#### Parameters

* **session** (`GenServer.server()`)
* **cache\_path** (`String.t() | nil` = `nil`): Directory passed to `save_to_disk/2`.
* **opts** (`keyword()` = `[]`): supports `:rebuild_legacy` (boolean, default `true`). Can be passed in place of `cache_path`, as in `load_from_disk(session, rebuild_legacy: false)`.

#### Returns

`{:ok, non_neg_integer()}` (the number of documents loaded) or `{:error, Moss.Error.t()}`

```elixir theme={null}
{:ok, session} = Moss.Client.session(client, "notes", auto_load_on_init: false)

case Moss.Session.load_from_disk(session) do
  {:ok, doc_count} -> doc_count
  {:error, %Moss.Error{code: :deserialization}} -> 0
end
```

***

### `close(session)`

Send the session's final usage report, then stop its process. Waits until the report
arrives or 2 seconds pass. Closing a session that already stopped returns `:ok`. A
supervisor shutting the session down, or the exit of the process that started it, closes
it the same way. [`Moss.Client.close/1`](./Client#close-client) does not close sessions,
so close each one. *(Elixir moss 1.5.0+)*

#### Parameters

* **session** (`GenServer.server()`)

#### Returns

`:ok`

```elixir theme={null}
:ok = Moss.Session.close(session)
```

See [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).
