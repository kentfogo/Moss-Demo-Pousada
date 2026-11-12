<!-- Source: https://docs.moss.dev/docs/reference/js/api.md -->
# Moss JavaScript SDK overview

> Everything the Moss JavaScript SDK can do, with a snippet for each operation.

The Moss JavaScript SDK (`@moss-js/moss`) brings semantic search to Node.js. It wraps a
high-performance Rust core and exposes an async, Promise-based API. Documents are embedded
and queried locally, with optional cloud sync.

## Requirements

* Node.js 20.4 or higher

## Install

```bash theme={null}
npm install @moss-js/moss
```

> [!WARNING]
>
> Keep optional dependencies on. The native binary comes only from the
> `@moss-js/moss-core-<platform>` package that npm installs for your platform as an optional
> dependency. After `npm install --omit=optional`, `optional=false` in `.npmrc` or
> `pnpm --no-optional`, importing `@moss-js/moss` throws `Cannot find native binding`. The same
> happens on `npm ci` from a lockfile that npm older than 11.3 rebuilt while `node_modules`
> existed, because that lockfile keeps only that machine's platform package. Before installing on
> another platform, such as Linux CI or Docker from a lockfile made on a Mac, regenerate the
> lockfile with `node_modules` removed, or with npm 11.3 or newer. *(@moss-js/moss 1.17.0+)*

> [!NOTE]
>
> Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to 1.9.0+ before then.

> [!NOTE]
>
> Moss for Node moved from `@moss-dev/moss` to `@moss-js/moss` with 1.8.0. `@moss-dev/moss` is a frozen 1.7.1 package. Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to `@moss-js/moss` 1.9.0+ before then. The date will be announced in the changelog. `@moss-dev/moss-web` is the browser SDK and is not this package.

Get your `projectId` and `projectKey` from the [Moss portal](https://portal.usemoss.dev).

## Two ways to search

* [`MossClient`](./classes/MossClient) - the entry point. Manage cloud indexes, load one into memory, and query it.
* [`SessionIndex`](./classes/SessionIndex) - a local, in-process index for real-time indexing during a live interaction; push to the cloud when done.

## Quick start

```typescript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

await client.createIndex('faqs', [
  { id: 'doc1', text: 'Track your order in your account.', metadata: { category: 'shipping' } },
  { id: 'doc2', text: '30-day return policy for most items.', metadata: { category: 'returns' } },
])
await client.loadIndex('faqs')
const results = await client.query('faqs', 'return a damaged product', { topK: 3 })
results.docs.forEach(d => console.log(d.id, d.score))
```

## Indexes

Create, inspect, and delete cloud indexes. Mutations run as async jobs and return a
`MutationResult` with a `jobId` and `docCount`.

```typescript theme={null}
// Create (defaults to moss-minilm)
const result = await client.createIndex('faqs', documents)

// Inspect
const info = await client.getIndex('faqs')   // IndexInfo: name, docCount, model.id, status
const indexes = await client.listIndexes()    // IndexInfo[]

// Delete
await client.deleteIndex('faqs')
```

## Index from files

Build an index straight from PDF and DOCX files - the server parses, chunks, and embeds
them. Up to 20 files per call.

```typescript theme={null}
await client.createIndexFromFiles('contracts', [
  { name: 'report.pdf', contentType: 'application/pdf', path: '/docs/report.pdf' },
], { parseOptions: { ocrMode: 'full_ocr' } })
```

See [Index from files](https://docs.moss.dev/docs/reference/js/files.md).

## Documents

Add, update, fetch, and remove documents on an existing index.

```typescript theme={null}
// Add or upsert
await client.addDocs('faqs', newDocs, { upsert: true })

// Fetch all, or by id
const allDocs = await client.getDocs('faqs')
const some = await client.getDocs('faqs', { docIds: ['doc1', 'doc2'] })

// Delete by id
await client.deleteDocs('faqs', ['doc6', 'doc7'])
```

## Load and query

Load an index into memory, then query it in-process. Call `loadIndex` before querying.

```typescript theme={null}
await client.loadIndex('faqs')
const results = await client.query('faqs', 'return a damaged product', { topK: 3 })
results.docs.forEach(d => console.log(d.id, d.score, d.text))
```

## Hybrid search

Blend semantic and keyword scoring with `alpha` (1.0 = semantic, 0.0 = keyword; default 0.8).

```typescript theme={null}
await client.query('faqs', 'return policy', { topK: 3, alpha: 0.6 })
```

See [Hybrid search](https://docs.moss.dev/docs/reference/js/hybrid-search.md).

## Metadata filtering

Narrow results by document metadata on a loaded index.

```typescript theme={null}
await client.query('products', 'running shoes', {
  topK: 5,
  filter: {
    $and: [
      { field: 'category', condition: { $eq: 'shoes' } },
      { field: 'price',    condition: { $lt: 100 } },
    ],
  },
})
```

Operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$near`, composed with
`$and` / `$or`. See [Metadata filtering](https://docs.moss.dev/docs/reference/js/metadata-filtering.md).

## Custom embeddings

Supply your own vectors with `modelId: 'custom'` (each document carries `embedding`, and
queries pass `embedding`).

```typescript theme={null}
await client.createIndex('tickets', docsWithEmbeddings, { modelId: 'custom' })
await client.loadIndex('tickets')
await client.query('tickets', 'billing problem', { topK: 3, embedding: queryVector })
```

See [Custom embeddings](https://docs.moss.dev/docs/reference/js/custom-embeddings.md).

## Sessions

Index and query locally in real time with a [`SessionIndex`](./classes/SessionIndex), then
push to the cloud. `session()` starts empty; `session.loadIndex(name)` resumes an existing
cloud index.

```typescript theme={null}
const session = await client.session('call-123')
await session.addDocs([{ id: 'turn-1', text: 'Customer reported a duplicate charge.' }])
const hits = await session.query('billing issue', { topK: 3 })
await session.pushIndex()
```

See [Sessions](https://docs.moss.dev/docs/reference/js/sessions.md).

## Keeping indexes fresh

Auto-refresh a loaded index (poll the cloud and hot-swap newer versions in automatically),
and track async jobs.

```typescript theme={null}
await client.loadIndex('faqs', { autoRefresh: true, pollingIntervalInSeconds: 300 })
const status = await client.getJobStatus(result.jobId)
```

## Inference

Answer with facts from your indexes. A `MossInference` client takes the arguments of OpenAI's
`responses.create`, plus `indexes`, and returns the same shapes.

```typescript theme={null}
import { MossInference } from '@moss-js/moss'

const llm = new MossInference(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
const stream = await llm.responses.create({
  model: 'moss/fastlane-1',
  input: 'Do you ship to Canada?',
  indexes: ['faqs'],
  stream: true,
})
for await (const event of stream) {
  if (event.type === 'response.output_text.delta') process.stdout.write(event.delta ?? '')
}
```

See [Inference](https://docs.moss.dev/docs/inference/sdks/javascript.md).

## Authentication

Construct the client with a `projectKey` for server-side use, or use a custom authenticator
to mint short-lived tokens for untrusted clients (`getAuthToken()`).

```typescript theme={null}
const { token, expiresIn } = await client.getAuthToken()
```

See [Custom Authenticator](https://docs.moss.dev/docs/reference/js/custom-authenticator.md).

## Errors

A failure from the native core rejects with an `Error` whose `code` is a stable
[`MossErrorCode`](./type-aliases/MossErrorCode), such as `NOT_FOUND` or `NETWORK`. Branch on
`code`, not on the message. [`isMossError`](./functions/isMossError) narrows a caught value,
and `loadIndexes` reports each failed name's code in `failedCodes`. Some checks the SDK makes
itself, such as a closed client, throw a plain `Error` with no `code`. *(@moss-js/moss 1.16.0+)*

```typescript theme={null}
import { isMossError } from '@moss-js/moss'

try {
  await client.query('faqs', 'refund policy')
} catch (error) {
  if (isMossError(error) && error.code === 'NOT_FOUND') {
    await client.loadIndex('faqs')
  } else {
    throw error
  }
}
```

See [Error codes](https://docs.moss.dev/docs/reference/errors.md#error-codes).

## Models

* `moss-minilm` (default) - fast, lightweight
* `moss-mediumlm` - higher accuracy
* `custom` - supply your own embedding vectors via `DocumentInfo.embedding`

## Guides

* [Index from files](https://docs.moss.dev/docs/reference/js/files.md)
* [Sessions](https://docs.moss.dev/docs/reference/js/sessions.md)
* [Hybrid search](https://docs.moss.dev/docs/reference/js/hybrid-search.md)
* [Metadata filtering](https://docs.moss.dev/docs/reference/js/metadata-filtering.md)
* [Custom embeddings](https://docs.moss.dev/docs/reference/js/custom-embeddings.md)
* [Custom Authenticator](https://docs.moss.dev/docs/reference/js/custom-authenticator.md)
* [Inference](https://docs.moss.dev/docs/inference/sdks/javascript.md)

## Reference

[MossClient](https://docs.moss.dev/docs/reference/js/classes/MossClient.md) and [SessionIndex](https://docs.moss.dev/docs/reference/js/classes/SessionIndex.md), plus all interfaces and types, are in the Reference section of the sidebar.
