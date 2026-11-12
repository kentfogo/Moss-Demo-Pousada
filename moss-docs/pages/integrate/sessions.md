<!-- Source: https://docs.moss.dev/docs/integrate/sessions.md -->
# Sessions

> Local-first, real-time indexing with create-resume-query-push.

A **session** is a local index you read and write in real time, with no cloud round trip
on any operation. Sessions are how Moss does indexing *during* a live interaction -
indexing transcript turns mid-call, building a per-user working set, or accumulating
context that's handed off between agents.

A session is represented by a [`SessionIndex`](https://docs.moss.dev/docs/reference/python/classes/SessionIndex),
created from [`MossClient.session()`](https://docs.moss.dev/docs/reference/python/classes/MossClient#session-index_name-model_id).

## Lifecycle

**1. Create or resume**

`client.session(name)` returns a `SessionIndex`. In Python, Elixir, Swift and C, a cloud
index with that name loads into the session by default if it exists (no re-embedding);
otherwise the session starts empty. Python and Elixir skip that load with
`auto_load_on_init`, and Swift with `autoLoadOnInit`, for example to restore a session saved
on disk. A JavaScript session always starts empty: call `session.loadIndex(name)` to pull the
cloud index in, which resolves to `0` when there is none. The rest of the workflow is the
same either way.

**2. Mutate locally**

`add_docs`, `delete_docs`, and `get_docs` run in-memory. `add_docs` embeds locally via the
Rust core, with no network round trip. With `model_id="custom"`, each document must carry its own
`.embedding`.

**3. Query locally**

`query` runs entirely in-memory (\~1-10 ms) and supports the same metadata filter syntax as
[`MossClient.query()`](https://docs.moss.dev/docs/reference/python/classes/MossClient#query-name-query-options).

**4. Persist (optional)**

`push_index()` uploads the session's documents to the cloud under the session's name,
creating or replacing that index. For a built-in model the service re-embeds the text with
that model, so the pushed index answers text queries like one built with `create_index`. A
custom-model session keeps its own embeddings.

To keep the session on the device instead, `save_to_disk(cache_path)` writes it under
`<cache_path>/<name>/`, and `load_from_disk(cache_path)` restores it into a later session with
the same name (`saveToDisk` and `loadFromDisk` in JavaScript). See the
[Python](https://docs.moss.dev/docs/reference/python/sessions.md#save-and-restore-on-disk),
[Elixir](https://docs.moss.dev/docs/reference/elixir/classes/Session.md#save_to_disk-session-cache_path) and
[JavaScript](https://docs.moss.dev/docs/reference/js/classes/SessionIndex.md#savetodisk) references.

The path is optional. Without one, the session saves to `sessions/<project id>/` under the
directory below, so sessions of the same name in two projects stay apart.
`MOSS_SESSION_CACHE_PATH` is an environment variable only session snapshots read.

| SDK | Directory without a path |
| - | - |
| Python, JavaScript, Elixir | The client's cache path, else `MOSS_SESSION_CACHE_PATH`, else `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux, `%LOCALAPPDATA%\moss` on Windows |
| Swift | `MOSS_SESSION_CACHE_PATH` when it is set, else the app's `Library/Caches/moss` |
| Kotlin (Android) | The app's `cacheDir/moss` |
| C | `MOSS_SESSION_CACHE_PATH`, else `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux, the app's `Library/Caches/moss` on iOS, `%LOCALAPPDATA%\moss` on Windows. Android has no default, so the call fails with `ERR_INVALID_ARG` unless `MOSS_SESSION_CACHE_PATH` is set |

**5. Close**

`close()` sends the final usage report and frees the session's documents and vectors.
Closing the client also closes its sessions in Python and JavaScript. See
[Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).

## Short-term vs. long-term context

A session is **short-term context** - the working set for the current interaction. A
persistent cloud index loaded with
[`load_index()`](https://docs.moss.dev/docs/reference/python/classes/MossClient#load_index-name-auto_refresh-polling_interval_in_seconds)
is **long-term context** - durable knowledge shared across interactions. Most real-time
apps query both; see [Live-call context](https://docs.moss.dev/docs/build/live-call-context.md).

## Models

The session's embedding model is set by the `model_id` argument to `session()` (default
`"moss-minilm"`; also `"moss-mediumlm"` or `"custom"`). A session takes the model of the cloud
index or disk snapshot it loads, and `model_id` (`modelId` in JavaScript) reports the model in
use. After a custom-model load, adding documents and querying need embeddings. When resuming
an existing cloud index in Python or Elixir, omit `model_id` to adopt the stored model:
passing a different one raises a `ValueError` in Python and returns an `:invalid_argument`
error in Elixir. All participants resuming the same index must use the same model.

## Authentication

Project credentials are validated when the session is opened; `session()` raises if they're
invalid. See [Authentication](https://docs.moss.dev/docs/integrate/authentication.md).

## Implementation

Runnable, per-language examples (create-or-resume, mutate, query, push) live in the SDK guides:

* [Python](https://docs.moss.dev/docs/reference/python/sessions.md)
* [JavaScript](https://docs.moss.dev/docs/reference/js/sessions.md)

## Related

> [card] [Real-time local indexing](https://docs.moss.dev/docs/build/real-time-local-indexing.md)
>
> Why sessions are sub-10 ms.

> [card] [Cross-agent handoff](https://docs.moss.dev/docs/build/cross-agent-handoff.md)
>
> Resume a session on another agent or channel.

> [card] [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md)
>
> Close sessions and clients, and close idle clients.
