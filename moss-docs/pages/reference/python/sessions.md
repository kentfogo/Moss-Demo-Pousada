<!-- Source: https://docs.moss.dev/docs/reference/python/sessions.md -->
# Sessions (Python SDK)

> Index and query locally in real time with a SessionIndex, then push to the cloud.

A session is a local, in-process index you read and write in real time, with no cloud round
trip on any operation. Sessions are how the Python SDK does indexing during a live
interaction: indexing transcript turns mid-call, building a per-user working set, or
accumulating context that is handed off between agents.

A session is a [`SessionIndex`](./classes/SessionIndex), created from
[`client.session()`](./classes/MossClient#session-index_name-model_id). For the full method
list, see the [SDK reference](https://docs.moss.dev/docs/reference/python/api.md).

## Create or resume

`client.session(index_name=...)` returns a `SessionIndex`. If a cloud index with that name
already exists, it auto-loads into the session (no re-embedding); otherwise the session
starts empty. The workflow is identical in both cases, so you do not branch on whether the
index exists. Pass `auto_load_on_init=False` to skip that load and start empty, for example
to [restore the session from disk](#save-and-restore-on-disk).

```python theme={null}
import asyncio
from moss import DocumentInfo, MossClient, QueryOptions

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

    # Auto-loads from cloud if the index exists, starts fresh if not.
    session = await client.session(index_name="my-session-index")
    print(f"{session.doc_count} existing docs loaded")

asyncio.run(main())
```

## Mutate and query locally

`add_docs`, `delete_docs`, and `get_docs` run in-memory; `add_docs` embeds locally via the
Rust core with no network round trip. `query` also runs entirely in-memory (\~1-10 ms) and supports
the same metadata filter syntax as [`client.query()`](./classes/MossClient#query-name-query-options).

```python theme={null}
session = await client.session(index_name="call-123")

# Add or update docs - appended to whatever was loaded.
added, updated = await session.add_docs([
    DocumentInfo(id="turn-1", text="Customer reported a duplicate charge on their March invoice."),
    DocumentInfo(id="turn-2", text="Agent confirmed the refund would arrive in 3-5 business days."),
])
print(f"{added} added, {updated} updated (total: {session.doc_count})")

# Query locally.
results = await session.query("refund timeline", QueryOptions(top_k=3))
for doc in results.docs:
    print(f"{doc.id} score={doc.score:.3f} {doc.text}")

# Fetch and delete by id, all in-memory.
some = await session.get_docs()
await session.delete_docs(["turn-1"])
```

## Persist to the cloud

`push_index()` uploads the session's documents to the cloud under the session's name,
creating or replacing that index. For a built-in model the service re-embeds the text with
that model, so the pushed index answers text queries like one built with `create_index`. A
custom-model session keeps its own embeddings.

```python theme={null}
result = await session.push_index()
print(f"Pushed {result.doc_count} docs (job {result.job_id}) status={result.status}")
```

## Extend an existing index

Because `session()` resumes by name, the same code extends an index across runs. Resume,
append new documents, then push back to overwrite the cloud copy with the combined set.

```python theme={null}
session = await client.session(index_name="my-session-index")  # loads prior docs

await session.add_docs([
    DocumentInfo(id="follow-up-1", text="Customer called back to confirm the refund was received."),
    DocumentInfo(id="follow-up-2", text="Refund of $49.99 appeared on the statement within 3 days."),
])

results = await session.query("refund outcome and customer satisfaction", QueryOptions(top_k=3))
await session.push_index()   # creates or overwrites the cloud index
```

## Save and restore on disk

[`save_to_disk(cache_path)`](./classes/SessionIndex#save_to_disk-cache_path) writes the
session under `<cache_path>/<name>/`. A later session with the same name restores it with
[`load_from_disk(cache_path)`](./classes/SessionIndex#load_from_disk-cache_path-rebuild_legacy),
which returns the number of documents loaded. Open that session with
`auto_load_on_init=False`, so it skips the cloud load and the restore downloads no index.
*(moss 1.16.0+)*

```python theme={null}
import asyncio
from moss import DocumentInfo, MossClient, MossError

CACHE_DIR = "/var/cache/my-app/moss"

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

    # Skip the cloud load, then restore the last saved snapshot.
    session = await client.session(index_name="notes", auto_load_on_init=False)
    try:
        loaded = await session.load_from_disk(CACHE_DIR)
    except MossError as e:
        if e.code != "DESERIALIZATION":
            raise
        loaded = 0  # no snapshot yet, so the session starts empty
    print(f"{loaded} docs restored, model {session.model_id}")

    await session.add_docs([
        DocumentInfo(id="note-1", text="Customer prefers a call back on Friday."),
    ])

    # Save for the next run.
    await session.save_to_disk(CACHE_DIR)

asyncio.run(main())
```

* The snapshot replaces the session's documents and model, so `session.model_id` reports
  the snapshot's model after a load. After a custom-model snapshot loads, `add_docs` and
  `query` need embeddings.
* A missing or damaged snapshot raises `MossError` with code `DESERIALIZATION` and leaves the
  session as it was. A failed or interrupted save leaves the last saved snapshot loadable.
* A snapshot that an older core saved for a built-in model has no model artifact identity.
  By default `load_from_disk` rebuilds it for a session opened with the same model: it
  re-embeds the stored documents and saves the snapshot back in the same call, which needs
  the cloud for the model. If the model cannot be loaded, it raises `MossError` with code
  `MODEL_UNAVAILABLE` and changes nothing. Pass `rebuild_legacy=False` to load such a snapshot
  as a custom-model session.
* A relative `cache_path` resolves against the current working directory, and `~` is not
  expanded.
* `cache_path` is optional. Without one, snapshots go in `sessions/<project id>/` under the
  client's `cache_path`, else under the `MOSS_SESSION_CACHE_PATH` environment variable, which
  only session snapshots read, else under `moss` in the default cache directory:
  `~/.cache/moss` on macOS and Linux, `%LOCALAPPDATA%\moss` on Windows. *(moss 1.19.0+)*

## Live-call context: short-term plus long-term

A session is short-term context - the working set for the current interaction. A persistent
cloud index loaded with [`load_index()`](./classes/MossClient#load_index-name-auto_refresh-polling_interval_in_seconds)
is long-term context - durable knowledge shared across interactions. A typical live call
loads a cloud FAQ index for long-term context and opens a session for short-term context,
then queries both for each turn.

```python theme={null}
import asyncio
from moss import DocumentInfo, MossClient, QueryOptions

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

    # Long-term context: a persistent cloud index, loaded for in-process queries.
    await client.load_index("support-faqs")

    # Short-term context: a session for this specific call.
    session = await client.session(index_name="call-abc")

    # As each turn arrives, index it locally (~1-5 ms).
    await session.add_docs([
        DocumentInfo(id="turn-1", text="Customer was billed twice for the same renewal."),
    ])

    # Query both for context on the current turn.
    user_turn = "why was I charged twice"
    recent = await session.query(user_turn, QueryOptions(top_k=3))          # this call
    knowledge = await client.query("support-faqs", user_turn, QueryOptions(top_k=3))  # all-time

    context = list(recent.docs) + list(knowledge.docs)
    for doc in context:
        print(f"{doc.id} score={doc.score:.3f} {doc.text}")

    # At call end, persist the session for future retrieval.
    await session.push_index()
    await client.unload_index("support-faqs")

asyncio.run(main())
```

## Behavior notes

* The session's embedding model is set by `model_id` on `session()` (default `"moss-minilm"`;
  also `"moss-mediumlm"` or `"custom"`). When resuming an existing cloud index, omit
  `model_id` to adopt the stored model - passing a different one raises a `ValueError`. All
  participants resuming the same index must use the same model.
* `session.model_id` is the model the session uses, or `"custom"`. Loading a cloud index or
  a disk snapshot moves the session to the loaded model. *(moss 1.16.0+)*
* With `model_id="custom"`, each document must carry its own `.embedding` and every query
  must pass `QueryOptions.embedding`. See [Custom embeddings](https://docs.moss.dev/docs/reference/python/custom-embeddings.md).
* Project credentials are validated when the session is opened; `session()` raises if they
  are invalid.
* `close()` sends the final usage report and frees the session's memory, and
  `async with await client.session(...) as session:` calls it for you. `client.close()`
  also closes every session the client opened. Requires `moss` >= **1.15.0**. See
  [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).

## Related

> [card] [SessionIndex reference](https://docs.moss.dev/docs/reference/python/classes/SessionIndex.md)
>
> Every session method and property.

> [card] [Metadata filtering](https://docs.moss.dev/docs/reference/python/metadata-filtering.md)
>
> Filter inside a session query.
