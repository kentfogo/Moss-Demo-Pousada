<!-- Source: https://docs.moss.dev/docs/reference/js/metadata-filtering.md -->
# Metadata filtering (JavaScript SDK)

> Narrow JavaScript query results to documents whose metadata matches a filter.

Attach metadata to documents at index time, then constrain queries to the documents whose
metadata matches a filter. Filtering is evaluated on the locally loaded index, so call
[`loadIndex()`](./classes/MossClient#loadindex) (or open a [session](https://docs.moss.dev/docs/reference/js/sessions.md)) before
querying with a filter. The filter is passed as
[`QueryOptions.filter`](./interfaces/QueryOptions).

## Operators

A single condition compares one metadata field with one operator. The
[condition shape](https://docs.moss.dev/docs/reference/js/type-aliases/FilterCondition.md) lists them all.

| Operator | Meaning |
| - | - |
| `$eq`, `$ne` | equals / not equals |
| `$gt`, `$gte`, `$lt`, `$lte` | greater than, greater than or equal to, less than, less than or equal to. See [how ranges compare](https://docs.moss.dev/docs/integrate/metadata-filtering.md#how-ranges-compare) |
| `$in`, `$nin` | value in / not in a list |
| `$near` | within a haversine distance of a point: `"lat,lng,radiusMeters"` |

Compose multiple conditions with `$and` / `$or` (nestable). A single condition can be passed
on its own without a wrapper. The [filter shape](https://docs.moss.dev/docs/reference/js/type-aliases/MetadataFilter.md) page describes
the full structure. `@moss-js/moss` does not export `MetadataFilter` or `FilterCondition`:
`QueryOptions.filter` is typed `any`, so pass a plain object as in the examples below.

Metadata values are strings. Filter values can be strings or numbers; a `Date` is rejected.

## Examples

```typescript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

await client.createIndex('catalog', [
  { id: 'doc1', text: 'Running shoes with breathable mesh for daily training.',
    metadata: { category: 'shoes', price: '79', city: 'new-york', location: '40.7580,-73.9855' } },
  { id: 'doc2', text: 'Trail running shoes built for rocky terrain.',
    metadata: { category: 'shoes', price: '149', city: 'seattle', location: '47.6062,-122.3321' } },
  { id: 'doc3', text: 'Lightweight city backpack with laptop compartment.',
    metadata: { category: 'bags', price: '95', city: 'new-york', location: '40.7505,-73.9934' } },
])

await client.loadIndex('catalog') // required before filtering

// $eq - a single condition needs no wrapper.
await client.query('catalog', 'running gear', {
  topK: 5,
  filter: { field: 'category', condition: { $eq: 'shoes' } },
})

// $and - shoes under $100.
await client.query('catalog', 'running shoes', {
  topK: 5,
  alpha: 0.6,
  filter: {
    $and: [
      { field: 'category', condition: { $eq: 'shoes' } },
      { field: 'price',    condition: { $lt: 100 } },
    ],
  },
})

// $or - New York or Seattle.
await client.query('catalog', 'city essentials', {
  topK: 5,
  filter: {
    $or: [
      { field: 'city', condition: { $eq: 'new-york' } },
      { field: 'city', condition: { $eq: 'seattle' } },
    ],
  },
})

// $in - city in a set.
await client.query('catalog', 'city essentials', {
  topK: 5,
  filter: { field: 'city', condition: { $in: ['new-york', 'seattle'] } },
})

// $near - within 5km of Times Square.
await client.query('catalog', 'city products', {
  topK: 5,
  filter: { field: 'location', condition: { $near: '40.7580,-73.9855,5000' } },
})
```

## Filtering inside a session

The same filter syntax works on a [session](https://docs.moss.dev/docs/reference/js/sessions.md) query, evaluated entirely in-memory.

```typescript theme={null}
const session = await client.session('call-123')
await session.addDocs([
  { id: 't1', text: 'Customer opened the call about an incorrect charge.',
    metadata: { speaker: 'agent', topic: 'billing', priority: '3' } },
  { id: 't2', text: 'I need a full refund for the duplicate charge.',
    metadata: { speaker: 'customer', topic: 'refund', priority: '5' } },
])

// Customer turns about refunds only.
await session.query('what did the customer want', {
  topK: 5,
  filter: {
    $and: [
      { field: 'speaker', condition: { $eq: 'customer' } },
      { field: 'topic',   condition: { $eq: 'refund' } },
    ],
  },
})
```

## Date ranges

Store dates as Unix epoch seconds in a decimal string and filter with numbers, so both sides
compare as numbers. [Filter by date](https://docs.moss.dev/docs/integrate/metadata-filtering.md#filter-by-date)
explains the encoding and the pitfalls of ISO 8601 strings.

```typescript theme={null}
const toEpoch = (iso: string) => Math.floor(Date.parse(iso) / 1000)

await session.addDocs([
  {
    id: 't3',
    text: 'Customer confirmed the refund arrived.',
    metadata: { createdAt: String(toEpoch('2026-01-10T09:00:00Z')) },
  },
])

await session.query('refund', {
  topK: 5,
  filter: {
    $and: [
      { field: 'createdAt', condition: { $gte: toEpoch('2026-01-01T00:00:00Z') } },
      { field: 'createdAt', condition: { $lte: toEpoch('2026-01-31T23:59:59Z') } },
    ],
  },
})
```

## Related

* [Hybrid search](https://docs.moss.dev/docs/reference/js/hybrid-search.md) - blend semantic and keyword scoring.
* [Sessions](https://docs.moss.dev/docs/reference/js/sessions.md) - filter inside a live session.
* [MetadataFilter](https://docs.moss.dev/docs/reference/js/type-aliases/MetadataFilter.md) and [FilterCondition](https://docs.moss.dev/docs/reference/js/type-aliases/FilterCondition.md) - the filter and condition shapes (documented, not exported).
* [SDK reference](https://docs.moss.dev/docs/reference/js/api.md) - the full JavaScript SDK overview.
