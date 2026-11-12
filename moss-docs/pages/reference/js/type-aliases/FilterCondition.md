<!-- Source: https://docs.moss.dev/docs/reference/js/type-aliases/FilterCondition.md -->
# FilterCondition

> JavaScript metadata condition shapes for equality, ranges, membership, and proximity; this shape is documented but not exported.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / FilterCondition

A single condition evaluated against one metadata field inside a [`MetadataFilter`](./MetadataFilter).

> [!NOTE]
>
> `@moss-js/moss` does not export `FilterCondition`. This page documents the shape of a
> condition object. [`QueryOptions.filter`](../interfaces/QueryOptions) is typed `any`, so pass a
> plain object, or declare this type in your own code to have TypeScript check your filters.

```ts theme={null}
type FilterCondition =
  | { $eq:  string | number }
  | { $ne:  string | number }
  | { $gt:  string | number }
  | { $gte: string | number }
  | { $lt:  string | number }
  | { $lte: string | number }
  | { $in:  (string | number)[] }
  | { $nin: (string | number)[] }
  | { $near: string };
```

## Operators

| Operator | Description |
| - | - |
| `$eq` | Field is equal to the given value. |
| `$ne` | Field is not equal to the given value. |
| `$gt` | Field is strictly greater than the value. |
| `$gte` | Field is greater than or equal to the value. |
| `$lt` | Field is strictly less than the value. |
| `$lte` | Field is less than or equal to the value. |
| `$in` | Field matches any value in the array. |
| `$nin` | Field does not match any value in the array. |
| `$near` | Geo-proximity match against the field (accepts an encoded location string). |

## Example

```ts theme={null}
// At least 50
{ $gte: 50 }

// Below 100
{ $lt: 100 }
```

A condition goes in the `condition` of a field filter. To match a `price` that meets both,
combine two field filters with `$and` in a [`MetadataFilter`](./MetadataFilter).
