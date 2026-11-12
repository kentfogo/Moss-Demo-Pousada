<!-- Source: https://docs.moss.dev/docs/build/real-time-local-indexing.md -->
# Real-Time Local Indexing

> Index and query in-process with a local session - no per-operation network call.

A **session** is an in-process index. You open it with `client.session(name)`, then add,
query, and delete documents locally; embedding and search run on-device, with no network
call per operation. When you are done, `push_index()` persists the index to the cloud.

A session is represented by a [`SessionIndex`](https://docs.moss.dev/docs/reference/python/classes/SessionIndex).

## Operations

![Session operations run on device, with add\_docs and query in process before optional push\_index to cloud](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/real-time-local-indexing-light.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=b8d71193d5c75cdb622b08faa0d70f84)

![Session operations run on device, with add\_docs and query in process before optional push\_index to cloud](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/real-time-local-indexing-dark.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=e25c731910af3f6cbdb56237653b98e0)

* **`add_docs(docs, options?)`** - embeds and indexes documents locally; returns `(added, updated)`.
* **`query(text, options?)`** - semantic or hybrid search over the in-memory index; returns a `SearchResult`.
* **`get_docs(options?)` / `delete_docs(ids)`** - read and remove documents locally.
* **`push_index()`** - uploads the session to the cloud, creating or replacing the cloud index of the same name. For a built-in model the service re-embeds the text with that model; a custom-model session keeps its own embeddings.

In Python and Elixir, and by default in Swift and C, `session(name)` is **create-or-resume**:
if a cloud index with that name already exists it is loaded into the session (no
re-embedding); otherwise the session starts empty. A JavaScript session always starts empty;
call `session.loadIndex(name)` to resume the cloud index. The rest of the API is the same
either way.

## Example

```python theme={null}
import asyncio
from moss import DocumentInfo, MossClient, QueryOptions

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

    # Open a session: new local index, or load an existing cloud index by name.
    session = await client.session(index_name="notes")

    # Add documents (embedded and indexed locally).
    added, updated = await session.add_docs([
        DocumentInfo(id="1", text="Ship the on-device SDK by Friday."),
        DocumentInfo(id="2", text="Follow up with the LiveKit team about latency."),
    ])
    print(f"{added} added, {updated} updated, {session.doc_count} total")

    # Query the in-memory index.
    results = await session.query("what's due this week", QueryOptions(top_k=3))
    for doc in results.docs:
        print(f"{doc.id} score={doc.score:.3f} {doc.text}")

asyncio.run(main())
```

## Performance characteristics

* Operations run in-process: no network round trip, TLS, or serialization on the query path.
* Query text is embedded by a local model; with `model_id="custom"` you supply the query vector via `QueryOptions.embedding` instead.
* Local queries typically complete in single-digit milliseconds, which suits short, frequent queries against a per-session or per-user working set.

## Session vs. loaded cloud index

| Use a **session** when | Use a **loaded cloud index** when |
| - | - |
| You are indexing data created at runtime (a live call, a chat, a working set) | You are querying a large, stable corpus built ahead of time |
| You need writes and reads against the same in-memory index | Reads dominate and the data changes infrequently |
| The data is per-conversation or per-user and short-lived | The index is shared across many sessions |

The two compose: load a persistent index and open a session in the same client. See
[Live-call context](https://docs.moss.dev/docs/build/live-call-context.md).

## Related

> [card] [Sessions guide](https://docs.moss.dev/docs/integrate/sessions.md)
>
> The full session lifecycle and API.

> [card] [SessionIndex reference](https://docs.moss.dev/docs/reference/python/classes/SessionIndex.md)
>
> Methods, parameters, and return types.
