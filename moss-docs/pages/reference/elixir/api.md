<!-- Source: https://docs.moss.dev/docs/reference/elixir/api.md -->
# Moss Elixir SDK overview

> On-device semantic search for Elixir with the Moss Elixir SDK.

The Moss Elixir SDK (`moss` on Hex.pm) brings semantic search to Elixir
applications. Documents are embedded and queried on-device through a
high-performance Rust core, with optional cloud sync. The SDK ships built-in
embedding models, hybrid (semantic + keyword) search, and per-session indexing
for real-time workflows.

## Requirements

* Elixir 1.15 or higher
* OTP 26 or higher
* Valid Moss project credentials (`project_id` and `project_key`)

## Install

Add `moss` to your dependencies in `mix.exs`:

```elixir theme={null}
# mix.exs
defp deps do
  [{:moss, "~> 1.0"}]
end
```

Then fetch it:

```bash theme={null}
mix deps.get
```

Sign up at [the Moss portal](https://portal.usemoss.dev) to get your
`project_id` and `project_key`.

## Two ways to search

The Elixir SDK exposes two entry points:

* [`Moss.Client`](./classes/Client) - the entry point. Construct it with your
  credentials, manage cloud indexes, and load indexes into memory for fast local
  querying.
* [`Moss.Session`](./classes/Session) - a local, in-session index. Index
  documents in memory during a live workflow with no cloud round trips, then
  push to the cloud when done.

Model responses grounded in your indexes come from a separate client,
`Moss.Inference`. See [Inference](https://docs.moss.dev/docs/inference/sdks/elixir.md).

## Load before query

Querying always runs against an index that has been loaded into memory. Call
[`Moss.Client.load_index/3`](./classes/Client#load_index-client-name-opts) first,
then [`Moss.Client.query/4`](./classes/Client#query-client-name-query_text-opts).
Queries run entirely in-memory with no network round trip. There is no query
path that runs without first loading the index (or opening a session).

## Quick start

Create a client, create and populate a cloud index, load it, and query:

```elixir theme={null}
alias Moss.{Client, DocumentInfo}

# Initialize the client with your project credentials
{:ok, client} = Client.new("your-project-id", "your-project-key")

# Prepare documents to index
documents = [
  %DocumentInfo{
    id: "doc1",
    text: "How do I track my order? Log into your account to see live status.",
    metadata: %{"category" => "shipping"}
  },
  %DocumentInfo{
    id: "doc2",
    text: "What is your return policy? We offer a 30-day return policy.",
    metadata: %{"category" => "returns"}
  }
]

# Create a cloud index (defaults to the moss-minilm model)
{:ok, _} = Client.create_index(client, "faqs", documents)

# Load the index into memory before querying
{:ok, _} = Client.load_index(client, "faqs")

# Query the loaded index
{:ok, result} = Client.query(client, "faqs", "How do I return a damaged product?", top_k: 3, alpha: 0.6)

IO.puts("Query: #{result.query}")

for doc <- result.docs do
  IO.puts("#{doc.id} (#{Float.round(doc.score, 4)}): #{doc.text}")
end
```

## Sessions

For real-time indexing during live workflows (voice AI agents, chat), open a
session. Documents are indexed in memory with no cloud round trip, and you can
push the index to the cloud when done:

```elixir theme={null}
{:ok, client} = Moss.Client.new("project-id", "project-key")
{:ok, session} = Moss.Client.session(client, "session-abc")

docs = [
  %Moss.DocumentInfo{id: "turn-1", text: "Customer: I need to cancel my subscription"},
  %Moss.DocumentInfo{id: "turn-2", text: "Agent: I can help with that. Can I ask why?"}
]

{:ok, {2, 0}} = Moss.Session.add_docs(session, docs)
{:ok, result} = Moss.Session.query(session, "subscription cancellation", top_k: 2)

# Push the session index to the cloud when done
{:ok, _} = Moss.Session.push_index(session)
```

To keep a session on the device, save it with
[`Moss.Session.save_to_disk/2`](./classes/Session#save_to_disk-session-cache_path) and
restore it in a later run with
[`Moss.Session.load_from_disk/3`](./classes/Session#load_from_disk-session-cache_path-opts).
Open the restoring session with `auto_load_on_init: false` so it downloads no index.
*(Elixir moss 1.6.0+)*

The cache path is optional. Without one, the snapshot goes in `sessions/<project id>/` under
the client's `:cache_path`, else under the `MOSS_SESSION_CACHE_PATH` environment variable,
else under `moss` in the default cache directory (`~/.cache/moss` on macOS and Linux,
`%LOCALAPPDATA%\moss` on Windows). *(Elixir moss 1.8.0+)*

```elixir theme={null}
:ok = Moss.Session.save_to_disk(session)

# Later: skip the cloud load and restore the snapshot
{:ok, session} = Moss.Client.session(client, "session-abc", auto_load_on_init: false)
{:ok, doc_count} = Moss.Session.load_from_disk(session)

# Or pass a directory of your own
:ok = Moss.Session.save_to_disk(session, "/var/cache/my_app/moss")
```

## Models

Two built-in embedding models run entirely in the Rust core:

* `moss-minilm` - lightweight, optimized for speed (the default).
* `moss-mediumlm` - higher accuracy with reasonable performance.

Pass `model_id: "custom"` to supply your own pre-computed embeddings via
[`DocumentInfo.embedding`](./types#documentinfo). With a custom model, each
document must set `embedding`, and queries must pass an `embedding:` option.

## Errors

Every `{:error, reason}` from the SDK carries a [`%Moss.Error{}`](./types#error). Match on its
`code` atom, such as `:not_found` or `:network`, not on the message. `detail` holds the native
error text for logs, and `load_indexes/3` reports each failed name's code in `failed_codes`.
The one exception is [`Moss.Client.session/3`](./classes/Client#session-client-index_name-opts)
with a `:server_name` that is already registered, which returns GenServer's
`{:error, {:already_started, pid}}`. *(Elixir moss 1.5.0+)*

```elixir theme={null}
case Moss.Client.load_index(client, "docs") do
  {:ok, info} -> info
  {:error, %Moss.Error{code: :not_found}} -> nil
end
```

See [Error codes](https://docs.moss.dev/docs/reference/errors.md#error-codes).

## Reference

* **Classes** - [Moss.Client](https://docs.moss.dev/docs/reference/elixir/classes/Client.md), [Moss.Session](https://docs.moss.dev/docs/reference/elixir/classes/Session.md)
* **Types** - [DocumentInfo, SearchResult, QueryResultDoc, IndexInfo, and more](https://docs.moss.dev/docs/reference/elixir/types.md)
