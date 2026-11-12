<!-- Source: https://docs.moss.dev/docs/reference/js/custom-embeddings.md -->
# Custom embeddings (JavaScript SDK)

> Bring your own vectors in JavaScript instead of a built-in on-device model.

Moss embeds text on-device with built-in models (`moss-minilm`, `moss-mediumlm`). If you
already generate embeddings elsewhere - a proprietary model, a hosted embedding API, or a
shared pipeline across services - use `modelId: 'custom'` to supply your own vectors. Moss
indexes and searches them; it does not load a local model.

## How it works

* At index time, every document must carry its own `embedding`. With `modelId: 'custom'`, Moss
  does not embed for you. (If you omit `modelId` and every document has an `embedding`, Moss
  infers `'custom'` automatically; mixed documents are rejected.)
* At query time, you must pass the query vector via
  [`QueryOptions.embedding`](./interfaces/QueryOptions), because there is no local model to
  embed the query text.
* All vectors must share the same dimensionality.

## Example

```typescript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

// Your embedding function - any model, as long as dimensions are consistent.
async function embed(text: string): Promise<number[]> {
  // ...call your model or embedding API and return the vector
}

// Index with precomputed vectors. modelId: 'custom' -> Moss does not embed.
await client.createIndex('tickets', [
  { id: '1', text: 'Customer asked about billing', embedding: await embed('Customer asked about billing') },
  { id: '2', text: 'Refund requested for duplicate charge', embedding: await embed('Refund requested for duplicate charge') },
], { modelId: 'custom' })

await client.loadIndex('tickets') // required before querying

// Query with your own query vector (required for custom embeddings).
const queryVector = await embed('billing problem')
const results = await client.query('tickets', 'billing problem', { topK: 3, embedding: queryVector })
results.docs.forEach(d => console.log(d.id, d.score, d.text))
```

## In a session

Sessions support custom embeddings too: open the session with `modelId: 'custom'`, set
`embedding` on every document you add, and pass `embedding` on every query.

```typescript theme={null}
const session = await client.session('conv-123', 'custom')

await session.addDocs([
  { id: '1', text: 'Customer asked about billing', embedding: await embed('Customer asked about billing') },
])

const hits = await session.query('billing problem', { topK: 3, embedding: await embed('billing problem') })
```

> [!NOTE]
>
> With `modelId: 'custom'`, adding a document without an `embedding`, or querying without
> `embedding` in the query options, throws.

## Related

* [Sessions](https://docs.moss.dev/docs/reference/js/sessions.md) - custom embeddings in a live session.
* [Hybrid search](https://docs.moss.dev/docs/reference/js/hybrid-search.md) - blend semantic and keyword scoring.
* [DocumentInfo](https://docs.moss.dev/docs/reference/js/interfaces/DocumentInfo.md) and [QueryOptions](https://docs.moss.dev/docs/reference/js/interfaces/QueryOptions.md) - where `embedding` lives.
* [SDK reference](https://docs.moss.dev/docs/reference/js/api.md) - the full JavaScript SDK overview.
