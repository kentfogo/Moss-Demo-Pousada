<!-- Source: https://docs.moss.dev/docs/reference/js/sessions.md -->
# Sessions (JavaScript SDK)

> Local-first, real-time indexing in JavaScript with create-resume-query-push.

A session is a local index you read and write in real time, with no cloud round trip on any
operation. Sessions are how Moss indexes data during a live interaction - indexing transcript
turns mid-call, building a per-user working set, or accumulating context that is handed off
between agents.

A session is a [`SessionIndex`](./classes/SessionIndex), created from
[`client.session()`](./classes/MossClient#session). It works with a client built with either a
`projectKey` or a custom authenticator. A project key goes to the session directly, and a custom
authenticator supplies the session's tokens through the same bridge as
[`loadIndex`](./classes/MossClient#loadindex).

## Create or resume

`client.session(name)` returns a `SessionIndex` that starts empty, even when a cloud index
with that name exists. To resume that index, call
[`session.loadIndex(name)`](./classes/SessionIndex#loadindex): it pulls the documents in
without re-embedding and resolves to the number loaded, `0` when no cloud index has that
name. `name` is also the target when [`pushIndex()`](./classes/SessionIndex#pushindex) is
called, and a push replaces that cloud index with the session's documents, so load it first
to add to an existing index.

```typescript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

// Create, then resume the cloud index of the same name if there is one.
const session = await client.session('call-123')
const loaded = await session.loadIndex('call-123')
console.log(`${loaded} existing docs loaded`)

// Mutate locally - appended to whatever was loaded. Embeds in-process, no network round trip.
await session.addDocs([
  { id: 'turn-1', text: 'Customer reported a duplicate charge on their March invoice.' },
])

// Query locally (~1-10ms). Same options as MossClient.query (topK, alpha, filter, embedding).
const results = await session.query('billing issue', { topK: 3 })
results.docs.forEach(d => console.log(d.id, d.score, d.text))

// Fetch and delete by id, also local.
const docs = await session.getDocs({ docIds: ['turn-1'] })
await session.deleteDocs(['turn-1'])

// Persist to the cloud under the session name.
const pushed = await session.pushIndex()
console.log(`Pushed ${pushed.docCount} docs (job ${pushed.jobId})`)
```

## Short-term vs. long-term context

A session is short-term context - the working set for the current interaction. A persistent
cloud index loaded with [`client.loadIndex()`](./classes/MossClient#loadindex) is long-term
context - durable knowledge shared across interactions. Most real-time apps query both: load
a cloud index for long-term knowledge, open a session for the live turns, and query each.

```typescript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

// Long-term context: load a persistent cloud index into memory.
await client.loadIndex('product-faqs')

// Short-term context: open a session for the live call.
const session = await client.session('call-123')

// As the call progresses, index transcript turns locally.
await session.addDocs([
  { id: 'turn-1', text: 'Customer was billed twice for the same subscription renewal.' },
  { id: 'turn-2', text: 'Customer requested a refund for the duplicate charge of $49.99.' },
])

// On each new turn, query both: the FAQ index for knowledge, the session for what was said.
const userQuestion = 'how long does a refund take'
const [knowledge, recall] = await Promise.all([
  client.query('product-faqs', userQuestion, { topK: 3 }),
  session.query(userQuestion, { topK: 3 }),
])

// At the end of the call, persist the session for future retrieval.
await session.pushIndex()
```

## Loading a cloud index into a session

[`loadIndex()`](./classes/SessionIndex#loadindex) can pull any cloud index into the session's
local store, not only the one named after the session. With `autoRefresh: true` the SDK polls
the cloud and pulls newer versions in on subsequent reads (paused while the session has
un-pushed local edits).

```typescript theme={null}
const session = await client.session('call-123')
const loaded = await session.loadIndex('product-faqs', { autoRefresh: true })
console.log(`${loaded} docs loaded into the session`)
```

## Behavior notes

* Every session operation (`addDocs`, `deleteDocs`, `getDocs`, `query`) runs in process memory
  with no per-operation cloud round trip.
* The embedding model is set by the optional second argument to `session()` (default
  `"moss-minilm"`; also `"moss-mediumlm"` or `"custom"`). `loadIndex()` and `loadFromDisk()`
  move the session to the model of the index or snapshot they load, and `session.modelId`
  reports the model in use. After a custom-model load, `addDocs` takes the documents'
  embeddings and `query` without an `embedding` rejects with code `INVALID_ARGUMENT`.
  *(@moss-js/moss 1.17.0+)* All participants resuming the same index must use the same model.
* With `modelId: 'custom'`, each added document must carry an `embedding` and every `query`
  must pass an `embedding`. See [Custom embeddings](https://docs.moss.dev/docs/reference/js/custom-embeddings.md).
* `pushIndex()` uploads the session's documents. For a built-in model the service re-embeds
  the text with that model, and a custom-model session keeps its own embeddings.
* `close()` sends the final usage report and frees the session's memory, and
  `await using session = await client.session(name)` calls it for you on Node.js 24 or
  later. `client.close()` also closes every session the client opened. See
  [Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md).

## Related

* [SessionIndex reference](https://docs.moss.dev/docs/reference/js/classes/SessionIndex.md) - every session method.
* [MossClient.session()](https://docs.moss.dev/docs/reference/js/classes/MossClient.md#session) - open an empty session.
* [Metadata filtering](https://docs.moss.dev/docs/reference/js/metadata-filtering.md) - filter inside a session query.
* [SDK reference](https://docs.moss.dev/docs/reference/js/api.md) - the full JavaScript SDK overview.
