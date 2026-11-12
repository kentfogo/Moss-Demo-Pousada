<!-- Source: https://docs.moss.dev/docs/build/live-call-context.md -->
# Live-Call Context

> Query a persistent cloud index and a live session together during a conversation.

During a live interaction you typically query two indexes:

* **Long-term context** - a persistent cloud index of durable knowledge and account facts
  (FAQs, policies, profile). You load it once at the start of the call with `load_index()`.
* **Short-term context** - a [session](https://docs.moss.dev/docs/integrate/sessions.md) holding the current
  conversation, which you build up with `add_docs()` as turns arrive.

Both run locally once loaded, so each turn can query the knowledge index and the session
without a network round trip, then pass the combined results to the model.

## A single agent turn

![A caller turn reaches an agent, which updates a short-term session, queries recent context and long-term cloud knowledge, then responds](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/live-call-context-light.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=d89ade0d0c3fc7d372706c25049088c7)

![A caller turn reaches an agent, which updates a short-term session, queries recent context and long-term cloud knowledge, then responds](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/live-call-context-dark.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=aab230eec0ffcd50cc3313256ab1d65d)

## How it works

**1. Load the long-term index**

`load_index("support-faqs")` loads the persistent knowledge index into memory for querying.

**2. Open a session for the call**

`client.session(call_id)` returns a local [`SessionIndex`](https://docs.moss.dev/docs/reference/python/classes/SessionIndex).
If an index with that name already exists in the cloud it is loaded; otherwise the session starts empty.

**3. Index transcript turns**

Call `add_docs` as turns arrive; documents are embedded and indexed locally.

**4. Query both indexes per turn**

Query the loaded knowledge index and the session, and pass both result sets to the model.

**5. Persist the session**

`session.push_index()` writes the session to the cloud so a later interaction can resume it.

## Example

```python theme={null}
import asyncio
from datetime import datetime
from moss import DocumentInfo, MossClient, QueryOptions

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

    # Long-term context: load a persistent knowledge index.
    await client.load_index("support-faqs")

    # Short-term context: open a session for this call.
    call_id = f"call-{datetime.now():%Y%m%d-%H%M%S}"
    session = await client.session(index_name=call_id)

    # Index transcript turns into the session.
    await session.add_docs([
        DocumentInfo(id="turn-1", text="Customer was billed twice for the same renewal."),
        DocumentInfo(id="turn-2", text="Customer requested a refund for the duplicate $49.99 charge."),
    ])

    # Query both indexes and combine the results for the model.
    knowledge = await client.query("support-faqs", "duplicate charge refund policy", QueryOptions(top_k=3))
    recent = await session.query("refund request", QueryOptions(top_k=3))

    for doc in recent.docs:
        print(f"[session] {doc.id} score={doc.score:.3f} {doc.text}")
    for doc in knowledge.docs:
        print(f"[faqs]    {doc.id} score={doc.score:.3f} {doc.text}")

    # Persist the session at call end.
    result = await session.push_index()
    print(f"Pushed {result.doc_count} docs to cloud index {result.index_name!r}")

asyncio.run(main())
```

## Two kinds of context

| | Short-term context | Long-term context |
| - | - | - |
| **What** | The current conversation: working notes, live transcript | Durable knowledge and account facts: FAQs, policies, profile, history |
| **Where** | A local [session](https://docs.moss.dev/docs/integrate/sessions.md), built turn by turn | A persistent cloud index, loaded once |
| **Lifetime** | The current interaction (optionally persisted at the end) | Across interactions |

## Data hydration and sync

At call start the long-term index and the session are loaded from the cloud (no
re-embedding); during the call the long-term index can stay current with `auto_refresh`; and
`session.push_index()` writes the session back. See
[Data hydration & sync](https://docs.moss.dev/docs/build/data-hydration-sync.md) for the load/refresh model and
refresh-interval tuning.

## Related

> [card] [Sessions](https://docs.moss.dev/docs/integrate/sessions.md)
>
> The session lifecycle and API.

> [card] [Real-time local indexing](https://docs.moss.dev/docs/build/real-time-local-indexing.md)
>
> How local sessions work.
