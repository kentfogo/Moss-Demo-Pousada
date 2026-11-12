<!-- Source: https://docs.moss.dev/docs/reference/js/type-aliases/MetadataFilter.md -->
# MetadataFilter

> JavaScript metadata filter shapes for local queries, with field conditions and logical composition; this shape is not exported.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / MetadataFilter

Composable metadata filter passed to [`QueryOptions.filter`](../interfaces/QueryOptions). Metadata
filtering narrows query results to only documents whose metadata satisfies the filter. It is
evaluated on the loaded (local) index; load the index via `loadIndex()` before querying.

> [!NOTE]
>
> `@moss-js/moss` does not export `MetadataFilter`. This page documents the shape of a filter
> object. `QueryOptions.filter` is typed `any`, so pass a plain object, or declare this type and
> [`FilterCondition`](./FilterCondition) in your own code to have TypeScript check your filters.

```ts theme={null}
type MetadataFilter =
  | { field: string; condition: FilterCondition }
  | { $and: MetadataFilter[] }
  | { $or:  MetadataFilter[] };
```

## Shapes

* **Field condition** - compare a single metadata field using a [`FilterCondition`](./FilterCondition) operator.
* **`$and`** - logical AND of nested filters; a document must satisfy every entry.
* **`$or`** - logical OR of nested filters; a document must satisfy at least one entry.

## Example

```ts theme={null}
import { MossClient } from '@moss-js/moss';

const client = new MossClient(projectId, projectKey);
await client.loadIndex('products');

const results = await client.query('products', 'running shoes', {
  topK: 5,
  alpha: 0.6,
  filter: {
    $and: [
      { field: 'category', condition: { $eq: 'shoes' } },
      { field: 'price',    condition: { $lt: 100 } },
    ],
  },
});
```
