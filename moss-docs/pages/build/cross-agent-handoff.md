<!-- Source: https://docs.moss.dev/docs/build/cross-agent-handoff.md -->
# Cross-Agent Context & Omni-Channel Handoff

> Hand a conversation off across agents, channels, and devices with full context intact.

A session is identified by its **index name**. Any process that calls `client.session(name)`
loads the most recent version of that index pushed to the cloud. Multiple agents, channels,
or services can share one evolving index by using the same name: one process calls
`push_index()` to write, another calls `session(name)` to read the result.

## How it works

![Agent A pushes conversation context to a cloud index, then Agent B loads the latest version and continues the session](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/cross-agent-handoff-light.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=fd935baea3accdb912d277fe331f7a6d)

![Agent A pushes conversation context to a cloud index, then Agent B loads the latest version and continues the session](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/cross-agent-handoff-dark.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=20cacdaaad3202afe334107594b1fbce)

* **`session(name)`** loads the cloud index with that name into a local session (no re-embedding).
* **`push_index()`** writes the session back to the cloud, creating or replacing that index.

## Example

**Agent A** accumulates context, then pushes:

```python theme={null}
from moss import DocumentInfo, MossClient

client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

session = await client.session(index_name="conv-123")
await session.add_docs([
    DocumentInfo(id="turn-1", text="Customer reported a duplicate $49.99 charge."),
    DocumentInfo(id="turn-2", text="Agent confirmed a refund in 3-5 business days."),
])
await session.push_index()
```

**Agent B** (another process or device) opens the same name and resumes:

```python theme={null}
session = await client.session(index_name="conv-123")
print(f"{session.doc_count} documents loaded")

results = await session.query("status of the refund", QueryOptions(top_k=3))
for doc in results.docs:
    print(f"{doc.id} score={doc.score:.3f} {doc.text}")

await session.add_docs([
    DocumentInfo(id="turn-3", text="Customer confirmed the refund posted to their statement."),
])
await session.push_index()
```

## Semantics

* `push_index()` creates or replaces the cloud index of that name. Readers see the most recent completed push.
* `session(name)` loads the stored index directly; documents keep their pushed embeddings, with no re-embedding.
* All participants must use the same embedding model. Passing a `model_id` that differs from the stored index raises an error.

## Use cases

* **Omni-channel** - voice, chat, and email handlers share one index keyed by conversation or customer ID.
* **Agent escalation** - a frontline agent pushes; a specialist or human agent opens the same index with the full history.
* **Multi-device** - a session continues when the user moves from one device to another.
* **Multi-agent pipelines** - specialized agents (router, retrieval, reasoning, review) pass state through one named index; each read and write is a local in-memory operation rather than a network call.

## Related

> [card] [Sessions guide](https://docs.moss.dev/docs/integrate/sessions.md)
>
> Create, resume, and persist sessions.

> [card] [Data hydration & sync](https://docs.moss.dev/docs/build/data-hydration-sync.md)
>
> Loading and refreshing indexes.
