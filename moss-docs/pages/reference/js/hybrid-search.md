<!-- Source: https://docs.moss.dev/docs/reference/js/hybrid-search.md -->
# Hybrid search (JavaScript SDK)

> Blend semantic and keyword scoring in JavaScript with a single alpha parameter.

Semantic (vector) search captures meaning; keyword (BM25) search captures exact terms.
Hybrid search blends both with one parameter, `alpha`, so you can tune relevance per query.
As with all queries, load the index first (or open a [session](https://docs.moss.dev/docs/reference/js/sessions.md)).

## The `alpha` parameter

`alpha` lives on [`QueryOptions`](./interfaces/QueryOptions).

| `alpha` | Behavior |
| - | - |
| `1.0` | Pure semantic (embeddings only) |
| `0.0` | Pure keyword (BM25 only) |
| between | Blends the two; default is semantic-heavy at `0.8` |

## Example

```typescript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

await client.loadIndex('faqs') // required before querying

// Blend semantic and keyword scoring (60/40).
const hybrid = await client.query('faqs', 'return policy', { topK: 3, alpha: 0.6 })

// Pure keyword.
const keywordOnly = await client.query('faqs', 'return policy', { topK: 3, alpha: 0.0 })

// Pure semantic (the default leans here at 0.8).
const semanticOnly = await client.query('faqs', 'return policy', { topK: 3, alpha: 1.0 })

hybrid.docs.forEach(d => console.log(d.id, d.score, d.text))
```

The same `alpha` applies inside a [session](https://docs.moss.dev/docs/reference/js/sessions.md):

```typescript theme={null}
const session = await client.session('call-123')
await session.addDocs([{ id: 'turn-1', text: 'Customer asked about the SKU-4421 refund.' }])

// Lean on keyword scoring to match the exact SKU.
const hits = await session.query('SKU-4421', { topK: 3, alpha: 0.2 })
```

## Choosing alpha

* Lower `alpha` (toward keyword) when queries contain exact identifiers, SKUs, names, or jargon.
* Higher `alpha` (toward semantic) when queries are natural-language paraphrases.
* Tune per index and per intent (returns, billing, onboarding, and so on).

## Related

* [Metadata filtering](https://docs.moss.dev/docs/reference/js/metadata-filtering.md) - constrain results by document metadata.
* [Custom embeddings](https://docs.moss.dev/docs/reference/js/custom-embeddings.md) - bring your own vectors.
* [QueryOptions](https://docs.moss.dev/docs/reference/js/interfaces/QueryOptions.md) - all query parameters.
* [SDK reference](https://docs.moss.dev/docs/reference/js/api.md) - the full JavaScript SDK overview.
