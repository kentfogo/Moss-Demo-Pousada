<!-- Source: https://docs.moss.dev/docs/integrate/releasing-resources.md -->
# Releasing Resources

> Close clients and sessions to free local memory promptly, and close idle clients in apps that search in bursts.

A client holds the indexes it loaded, their refresh pollers and the embedding model. A session
holds its documents and vectors. Garbage collection frees them eventually; `close()` frees
them now and sends the [final usage report](https://docs.moss.dev/docs/reference/telemetry.md). Close every client
and session when you are done with it.

## Close when you are done

In JavaScript, `MossClient` and `SessionIndex` support `await using`, which closes them when
the enclosing block ends. In Python, both are context managers, so `async with` does the same.

```ts JavaScript theme={null}
import { MossClient } from '@moss-js/moss'

await using client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
await client.loadIndex('support-faqs')
const answers = await client.query('support-faqs', 'refund policy', { topK: 5 })

await using session = await client.session('call-123')
await session.addDocs([{ id: 'turn-1', text: 'Customer asked about a refund.' }])
const recent = await session.query('refund', { topK: 3 })
// Both close when this block ends, the session first.
```

```python Python theme={null}
import os
from moss import DocumentInfo, MossClient, QueryOptions

async with MossClient(
    os.getenv("MOSS_PROJECT_ID"), os.getenv("MOSS_PROJECT_KEY")
) as client:
    await client.load_index("support-faqs")
    answers = await client.query("support-faqs", "refund policy", QueryOptions(top_k=5))

    async with await client.session(index_name="call-123") as session:
        await session.add_docs(
            [DocumentInfo(id="turn-1", text="Customer asked about a refund.")]
        )
        recent = await session.query("refund", QueryOptions(top_k=3))
    # The session is closed here, the client when the outer block ends.
```

`await using` needs Node.js 24 or later. On older versions, call `close()` in a `finally`
block:

```typescript theme={null}
const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
try {
  await client.loadIndex('support-faqs')
  const answers = await client.query('support-faqs', 'refund policy', { topK: 5 })
} finally {
  await client.close()
}
```

In synchronous Python code, `with` works too. It blocks the calling thread while the final
report is sent, so prefer `async with` inside async code.

> [!NOTE]
>
> `close()`, `with` and `async with` need `moss` >= **1.15.0** (Python). Every `@moss-js/moss`
> release (JavaScript) has `close()` and `await using`, and the 2-second bound on the final
> report needs >= **1.16.0**. In Swift the bound needs >= **0.8.0**, and in C >= **0.24.0**.

## What close does

1. **Sends the final usage report.** It waits until the report arrives or 2 seconds pass, so
   `close()` can take up to 2 seconds.
2. **Frees local data.** It stops auto-refresh polling, unloads the indexes, and frees the
   documents and vectors, including memory-mapped vector files.
3. **Lets go of the embedding model.** One copy of each model is shared by every client and
   session in the process that uses it. It is freed when the last of them closes, and loaded
   again on next use. Process memory may not shrink right away, because the allocator keeps
   freed pages for reuse.

Closing is safe to repeat. A closed object can't be reopened: create a new client instead.
After `close()`:

* **JavaScript**: client methods reject with `MossClient is closed`. A closed session still
  reads `name` and `modelId`; everything else throws.
* **Python**: client methods raise `RuntimeError("MossClient is closed")`. A closed session
  still reads `name`; everything else raises `InvalidArgumentError`.

In JavaScript and Python, closing a client also closes the sessions it opened. A client or
session that is garbage collected without `close()` still tries to send its final report, but
a process that exits first can lose the last few seconds of usage.

In Python, each client and session also keeps its own background threads until it is garbage
collected. `close()` frees the memory but not those threads.

## Other SDKs

| SDK | How to close | Notes |
| - | - | - |
| Swift | `client.close()`, `session.close()`, also run on `deinit` | Blocks until in-flight calls return, then waits up to 2 seconds for the final report. Closing the client leaves its sessions open. Later calls throw `MossClient already closed` or `MossSession already closed`. |
| Elixir | `Moss.Client.close/1`, `Moss.Session.close/1` | Also runs when a supervisor stops the process. Sessions are separate processes, so close each one. After `Moss.Client.close/1`, cloud calls such as `create_index/4` still work, and calls that go through the index manager, such as `load_index/3`, exit. Needs Elixir `moss` >= **1.5.0**. |
| C | `moss_client_free`, `moss_session_free` | Waits up to 2 seconds for the final report, or sends it in the background when called inside a Tokio runtime. Sessions stay valid after their client is freed. `NULL` is a no-op; freeing the same handle twice is undefined behavior. |
| Browser | `client.dispose()` | Synchronous. Stops auto-refresh, frees the loaded indexes and the ONNX Runtime sessions of models no longer in use, and sends the pending usage counts. The WebAssembly module stays loaded. Load indexes again before the next query. |

## Close idle clients

An app that searches in bursts, such as a search box or a desktop assistant, can close its
client after a quiet period and create a new one on the next search. Memory stays free
between bursts. The first search after a close pays for loading the index and the model
again. Give the client a cache directory so the reload reads the index from disk when the
cloud copy hasn't changed; see [Storage & Persistence](https://docs.moss.dev/docs/integrate/storage-persistence.md).

```ts JavaScript theme={null}
import { MossClient } from '@moss-js/moss'

const IDLE_MS = 15_000

class IdleSearch {
  #client: Promise<MossClient> | null = null
  #timer: ReturnType<typeof setTimeout> | undefined
  #active = 0

  async query(text: string) {
    clearTimeout(this.#timer)
    this.#active++
    try {
      this.#client ??= this.#open()
      const client = await this.#client
      return await client.query('notes', text, { topK: 5 })
    } finally {
      if (--this.#active === 0) this.#timer = setTimeout(() => this.#close(), IDLE_MS)
    }
  }

  async #open() {
    const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
    try {
      await client.loadIndex('notes', { cachePath: '/var/cache/moss' })
      return client
    } catch (err) {
      this.#client = null
      await client.close()
      throw err
    }
  }

  async #close() {
    const pending = this.#client
    this.#client = null
    const client = await pending?.catch(() => null)
    await client?.close()
  }
}
```

```python Python theme={null}
import asyncio
import os
from moss import MossClient, QueryOptions

IDLE_SECONDS = 15


class IdleSearch:
    def __init__(self):
        self._client = None
        self._lock = asyncio.Lock()
        self._timer = None
        self._active = 0

    async def query(self, text):
        if self._timer is not None:
            self._timer.cancel()
            self._timer = None
        self._active += 1
        try:
            client = await self._open()
            return await client.query("notes", text, QueryOptions(top_k=5))
        finally:
            self._active -= 1
            if self._active == 0:
                self._timer = asyncio.create_task(self._close_after_idle())

    async def _open(self):
        async with self._lock:
            if self._client is None:
                client = MossClient(
                    os.getenv("MOSS_PROJECT_ID"),
                    os.getenv("MOSS_PROJECT_KEY"),
                    cache_path="/var/cache/moss",
                )
                try:
                    await client.load_index("notes")
                except BaseException:
                    await client.close()
                    raise
                self._client = client
            return self._client

    async def _close_after_idle(self):
        await asyncio.sleep(IDLE_SECONDS)
        self._timer = None
        client, self._client = self._client, None
        if client is not None:
            await client.close()
```

## Related

> [card] [Sessions](https://docs.moss.dev/docs/integrate/sessions.md)
>
> Create, query and push a session.

> [card] [Telemetry](https://docs.moss.dev/docs/reference/telemetry.md)
>
> What the final usage report contains.
