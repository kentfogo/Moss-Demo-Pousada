<!-- Source: https://docs.moss.dev/docs/reference/elixir/types.md -->
# Moss Elixir SDK types

> Structs passed to and returned from the Moss Elixir SDK.

[Elixir SDK](https://docs.moss.dev/docs/reference/elixir/api.md) / Types

Reference for the structs passed to and returned from
[`Moss.Client`](./classes/Client) and [`Moss.Session`](./classes/Session). Each
is a plain Elixir struct.

## DocumentInfo

A document stored in or returned from an index.

```elixir theme={null}
%Moss.DocumentInfo{
  id: String.t(),
  text: String.t(),
  metadata: map() | nil,
  embedding: [float()] | nil
}
```

| Field | Type | Description |
| - | - | - |
| `id` | `String.t()` | Unique document ID. |
| `text` | `String.t()` | Document text. |
| `metadata` | `map() \| nil` | Optional string key/value metadata, usable in filters. Defaults to `nil`. |
| `embedding` | `[float()] \| nil` | Optional pre-computed embedding. Required when the index or session uses the `"custom"` model. Defaults to `nil`. |

## SearchResult

Returned by [`query/4`](./classes/Client#query-client-name-query_text-opts),
[`query_multi_index/4`](./classes/Client#query_multi_index-client-names-query_text-opts), and
[`query/3`](./classes/Session#query-session-query_text-opts).

```elixir theme={null}
%Moss.SearchResult{
  docs: [Moss.QueryResultDoc.t()],
  query: String.t(),
  index_name: String.t() | nil,
  time_taken_ms: number()
}
```

| Field | Type | Description |
| - | - | - |
| `docs` | `[Moss.QueryResultDoc.t()]` | Matching documents, ordered by relevance. |
| `query` | `String.t()` | The query text that was run. |
| `index_name` | `String.t() \| nil` | The index that was searched. `nil` for `query_multi_index/4` results; use each doc's `index_name`. |
| `time_taken_ms` | `number()` | Time the query took, in milliseconds. |

## QueryResultDoc

A single match within a [`SearchResult`](#searchresult).

```elixir theme={null}
%Moss.QueryResultDoc{
  id: String.t(),
  text: String.t(),
  score: float(),
  metadata: map() | nil,
  index_name: String.t() | nil
}
```

| Field | Type | Description |
| - | - | - |
| `id` | `String.t()` | Document ID. |
| `text` | `String.t()` | Document text. |
| `score` | `float()` | Relevance score for this match. |
| `metadata` | `map() \| nil` | Document metadata, if any. |
| `index_name` | `String.t() \| nil` | Source index name. Set on [`query_multi_index/4`](./classes/Client#query_multi_index-client-names-query_text-opts) results; `nil` for single-index queries. |

## LoadIndexesResult

Returned by [`load_indexes/3`](./classes/Client#load_indexes-client-names-opts).

```elixir theme={null}
%Moss.LoadIndexesResult{
  loaded: [String.t()],
  failed: %{String.t() => String.t()},
  failed_codes: %{String.t() => Moss.Error.code()}
}
```

| Field | Type | Description |
| - | - | - |
| `loaded` | `[String.t()]` | Names of the indexes that loaded. |
| `failed` | `%{String.t() => String.t()}` | Names that failed to load, mapped to the error message. The message is the fixed text a [`Moss.Error`](#error) carries, with no URLs, file paths or index names. |
| `failed_codes` | `%{String.t() => Moss.Error.code()}` | Names that failed to load, mapped to the same code atom [`Moss.Error`](#error) carries, such as `:not_found`. *(Elixir moss 1.5.0+)* |

## IndexInfo

Metadata about a cloud or local index, returned by
[`get_index/2`](./classes/Client#get_index-client-name),
[`list_indexes/1`](./classes/Client#list_indexes-client),
[`load_index/3`](./classes/Client#load_index-client-name-opts), and
[`get_index_info/2`](./classes/Client#get_index_info-client-name).

```elixir theme={null}
%Moss.IndexInfo{
  id: String.t(),
  name: String.t(),
  version: String.t(),
  status: String.t(),
  doc_count: non_neg_integer(),
  created_at: String.t(),
  updated_at: String.t(),
  model: Moss.ModelRef.t()
}
```

| Field | Type | Description |
| - | - | - |
| `id` | `String.t()` | Index identifier. |
| `name` | `String.t()` | Index name. |
| `version` | `String.t()` | Index version. |
| `status` | `String.t()` | Current index status. |
| `doc_count` | `non_neg_integer()` | Number of documents in the index. |
| `created_at` | `String.t()` | Creation timestamp. |
| `updated_at` | `String.t()` | Last-updated timestamp. |
| `model` | `Moss.ModelRef.t()` | The embedding model the index uses. |

## ModelRef

A reference to an embedding model.

```elixir theme={null}
%Moss.ModelRef{
  id: String.t(),
  version: String.t()
}
```

| Field | Type | Description |
| - | - | - |
| `id` | `String.t()` | Model ID, for example `"moss-minilm"`, `"moss-mediumlm"`, or `"custom"`. |
| `version` | `String.t()` | Model version. |

## MutationResult

Returned by cloud mutations:
[`create_index/4`](./classes/Client#create_index-client-name-docs-model_id),
[`add_docs/4`](./classes/Client#add_docs-client-name-docs-opts), and
[`delete_docs/3`](./classes/Client#delete_docs-client-name-doc_ids).

```elixir theme={null}
%Moss.MutationResult{
  job_id: String.t(),
  index_name: String.t(),
  doc_count: non_neg_integer()
}
```

| Field | Type | Description |
| - | - | - |
| `job_id` | `String.t()` | ID of the async job; poll with [`get_job_status/2`](./classes/Client#get_job_status-client-job_id). |
| `index_name` | `String.t()` | The affected index. |
| `doc_count` | `non_neg_integer()` | Document count after the mutation. |

## PushIndexResult

Returned by
[`Moss.Session.push_index/1`](./classes/Session#push_index-session). Poll `job_id`
with [`get_job_status/2`](./classes/Client#get_job_status-client-job_id) until
`status` is `"ready"`.

```elixir theme={null}
%Moss.PushIndexResult{
  job_id: String.t(),
  index_name: String.t(),
  doc_count: non_neg_integer(),
  status: String.t()
}
```

| Field | Type | Description |
| - | - | - |
| `job_id` | `String.t()` | ID of the push job. |
| `index_name` | `String.t()` | The cloud index that was created or replaced. |
| `doc_count` | `non_neg_integer()` | Number of documents pushed. |
| `status` | `String.t()` | Current job status. |

## RefreshResult

Returned by
[`refresh_index/2`](./classes/Client#refresh_index-client-name).

```elixir theme={null}
%Moss.RefreshResult{
  index_name: String.t(),
  previous_updated_at: String.t(),
  new_updated_at: String.t(),
  was_updated: boolean()
}
```

| Field | Type | Description |
| - | - | - |
| `index_name` | `String.t()` | The refreshed index. |
| `previous_updated_at` | `String.t()` | The index timestamp before the refresh. |
| `new_updated_at` | `String.t()` | The index timestamp after the refresh. |
| `was_updated` | `boolean()` | Whether the refresh pulled new data. |

## JobStatusResponse

Returned by
[`get_job_status/2`](./classes/Client#get_job_status-client-job_id).

```elixir theme={null}
%Moss.JobStatusResponse{
  job_id: String.t(),
  status: String.t(),
  progress: number(),
  current_phase: String.t() | nil,
  error: String.t() | nil,
  created_at: String.t(),
  updated_at: String.t(),
  completed_at: String.t() | nil
}
```

| Field | Type | Description |
| - | - | - |
| `job_id` | `String.t()` | The job being polled. |
| `status` | `String.t()` | Job status, for example `"ready"`. |
| `progress` | `number()` | Progress fraction. |
| `current_phase` | `String.t() \| nil` | Current processing phase, if any. |
| `error` | `String.t() \| nil` | Error message if the job failed. |
| `created_at` | `String.t()` | When the job was created. |
| `updated_at` | `String.t()` | When the job was last updated. |
| `completed_at` | `String.t() \| nil` | When the job completed, if finished. |

## Error

The `reason` in every `{:error, reason}` the SDK returns, except GenServer's
`{:already_started, pid}` from [`Moss.Client.session/3`](./classes/Client#session-client-index_name-opts)
with a `:server_name` already in use. `Moss.Error` is an exception, so
`raise reason` works, and it implements `String.Chars`, so `"#{reason}"` renders the message.
*(Elixir moss 1.5.0+)*

```elixir theme={null}
%Moss.Error{
  code: Moss.Error.code(),
  message: String.t(),
  detail: String.t() | nil
}
```

| Field | Type | Description |
| - | - | - |
| `code` | `Moss.Error.code()` | The kind of failure, an atom to match on: `:invalid_argument`, `:not_found`, `:unauthorized`, `:network`, `:deserialization`, `:model_unavailable` or `:internal`. See [Error codes](https://docs.moss.dev/docs/reference/errors.md#error-codes). |
| `message` | `String.t()` | Fixed text for each kind of failure, such as `"Index not found."`, with no URLs, file paths or index names. Option errors the NIF raises itself, such as a malformed metadata filter, keep their descriptive text with code `:invalid_argument`. |
| `detail` | `String.t() \| nil` | The native core's error text, in release and debug NIF builds alike, at most 512 bytes. Diagnostic text for logs and support, not a stable contract. `nil` when there is none. |

```elixir theme={null}
case Moss.Client.load_index(client, "docs") do
  {:ok, info} -> info
  {:error, %Moss.Error{code: :not_found}} -> nil
end
```
