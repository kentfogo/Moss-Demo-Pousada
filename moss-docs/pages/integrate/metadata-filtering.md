<!-- Source: https://docs.moss.dev/docs/integrate/metadata-filtering.md -->
# Metadata Filtering

> Narrow query results to documents whose metadata matches a filter, date ranges included.

Attach metadata to documents when you add them, then constrain queries to the documents whose
metadata matches a filter. Filtering is evaluated on the **locally loaded index**, so call
[`load_index()`](https://docs.moss.dev/docs/reference/python/classes/MossClient#load_index-name-auto_refresh-polling_interval_in_seconds)
(or open a [session](https://docs.moss.dev/docs/integrate/sessions.md)) before querying with a filter. There is no
cloud query.

## Attach metadata

Metadata is a map of string keys to **string values** in every SDK. Convert numbers and dates
to strings before you add them. Pass it on each document, whether you add documents to a
session, to a new cloud index, or to an existing one.

> [!NOTE]
>
> In Python 1.18.0+, dicts and JSON passed to `create_index` or `add_docs` may hold number and
> boolean metadata values, which are stored as strings. A number such as `30` becomes `"30"`, and
> a boolean becomes `"true"` or `"false"`. Filter booleans with those strings, such as
> `{"$eq": "true"}`, not with Python `True`.

```ts JavaScript theme={null}
const session = await client.session('support-calls')

await session.addDocs(
  [
    {
      id: 'call-1',
      text: 'Customer asked for a refund on a duplicate charge.',
      metadata: { topic: 'refund', priority: '5', createdAt: '1768035600' },
    },
  ],
)
```

```python Python theme={null}
from moss import DocumentInfo

session = await client.session(index_name="support-calls")

await session.add_docs(
    [
        DocumentInfo(
            id="call-1",
            text="Customer asked for a refund on a duplicate charge.",
            metadata={"topic": "refund", "priority": "5", "created_at": "1768035600"},
        ),
    ]
)
```

## Operators

| Operator | Meaning |
| - | - |
| `$eq`, `$ne` | equals / not equals |
| `$gt`, `$gte`, `$lt`, `$lte` | greater than, greater than or equal to, less than, less than or equal to. See [How ranges compare](#how-ranges-compare) |
| `$in`, `$nin` | value in / not in a list |
| `$near` | within a haversine distance of a point: `"lat,lng,radiusMeters"` |

A condition names one field: `{ field: 'topic', condition: { $eq: 'refund' } }`. Compose
several with `$and` / `$or` (nestable). A single condition can be passed on its own without a
wrapper.

A condition never matches a document that lacks the field, `$ne` and `$nin` included, so a
misspelled field name matches nothing and raises no error.

Filter values can be strings or numbers; a number is compared in its plain decimal form. A
JavaScript `Date` or a Python `datetime` is rejected, so **convert it first**, as in
[Filter by date](#filter-by-date).

## How ranges compare

`$gt`, `$gte`, `$lt` and `$lte` compare the stored value with the filter value like this:

| Values | Comparison |
| - | - |
| Both are plain decimals, such as `"42"` or `"-3.5"` | As numbers, so `"9"` is less than `"50"` |
| Neither is a plain decimal | As text, character by character, so `"2026-01-15"` is greater than `"2026-01-01"` |
| One is a plain decimal and the other is not | Never matches |

A plain decimal is one or more digits, optionally preceded by `-` and optionally followed by
`.` and one or more digits. The digits before the point have no leading zero unless they are
just `0`. So `"0"`, `"-3.5"` and `"0.25"` are plain decimals, while `"-"`, `".5"`, `"5."`,
`"007"`, `"1e3"`, `"+5"`, `" 5"` and `"NaN"` are text, and so is a numeral too large for a
64-bit float.

> [!NOTE]
>
> This rule needs `moss` >= **1.15.0** (Python), `@moss-js/moss` >= **1.16.0** (JavaScript),
> `@moss-dev/moss-web` >= **1.4.0** (Browser), Elixir `moss` >= **1.5.0**, the Swift SDK
>
> > \= **0.8.0**, or the C SDK >= **0.24.0**. Earlier releases order some values differently.

## Filter by date

Store dates as **Unix epoch seconds** in a decimal string, and filter with numbers. Both sides
are then plain decimals, so they compare as numbers and in time order. Epoch milliseconds work
the same way.

```ts JavaScript theme={null}
const toEpoch = (iso: string) => Math.floor(Date.parse(iso) / 1000)

await session.addDocs([
  {
    id: 'call-1',
    text: 'Customer asked for a refund on a duplicate charge.',
    metadata: { createdAt: String(toEpoch('2026-01-10T09:00:00Z')) },
  },
  {
    id: 'call-2',
    text: 'Customer asked to move to the annual plan.',
    metadata: { createdAt: String(toEpoch('2026-02-03T14:30:00Z')) },
  },
])

// January 2026 in UTC, both bounds included.
const january = {
  $and: [
    { field: 'createdAt', condition: { $gte: toEpoch('2026-01-01T00:00:00Z') } },
    { field: 'createdAt', condition: { $lte: toEpoch('2026-01-31T23:59:59Z') } },
  ],
}

const results = await session.query('refund', { topK: 5, filter: january })
```

```python Python theme={null}
from datetime import datetime, timezone
from moss import DocumentInfo, QueryOptions


def to_epoch(dt: datetime) -> int:
    return int(dt.timestamp())


def to_epoch_str(dt: datetime) -> str:
    return str(to_epoch(dt))


call_1_at = to_epoch_str(datetime(2026, 1, 10, 9, 0, tzinfo=timezone.utc))
call_2_at = to_epoch_str(datetime(2026, 2, 3, 14, 30, tzinfo=timezone.utc))

await session.add_docs(
    [
        DocumentInfo(
            id="call-1",
            text="Customer asked for a refund on a duplicate charge.",
            metadata={"created_at": call_1_at},
        ),
        DocumentInfo(
            id="call-2",
            text="Customer asked to move to the annual plan.",
            metadata={"created_at": call_2_at},
        ),
    ]
)

# January 2026 in UTC, both bounds included.
start = to_epoch(datetime(2026, 1, 1, tzinfo=timezone.utc))
end = to_epoch(datetime(2026, 1, 31, 23, 59, 59, tzinfo=timezone.utc))
january = {
    "$and": [
        {"field": "created_at", "condition": {"$gte": start}},
        {"field": "created_at", "condition": {"$lte": end}},
    ]
}

results = await session.query("refund", QueryOptions(top_k=5, filter=january))
```

The same filter works on a loaded index: pass it as `filter` to `client.query()`.

> [!WARNING]
>
> Give Python datetimes a time zone. `timestamp()` reads a naive `datetime` as local time.

### List every document in a range

A query returns the best matches for its text, and a blank query returns nothing. To list
every document in a date range, call `get_docs` with a filter on a session. It returns every
match without ranking, and `sort_by` orders numbers numerically, so epoch values come back in
time order. Python, Swift and C sessions support this; JavaScript and Elixir sessions fetch
documents by id only.

```python theme={null}
from moss import GetDocumentsOptions

in_january = await session.get_docs(
    GetDocumentsOptions(filter=january, sort_by="created_at")
)
```

### ISO 8601 strings

ISO 8601 strings compare as text. Text order is time order only when every value uses one
fixed, zero-padded UTC format, such as `2026-01-10T09:00:00Z`.

> [!WARNING]
>
> Text ranges are easy to get wrong:
>
> * Mixed formats break the order. `2026-01-10T09:00:00.5Z` sorts before `2026-01-10T09:00:00Z`
>   though it is later, and offsets such as `+02:00` are not converted to UTC.
> * A date-only upper bound leaves out that day: `"2026-01-31T09:00:00Z"` sorts after
>   `"2026-01-31"`, so `$lte: "2026-01-31"` excludes it. Use `$lt: "2026-02-01"`.
> * A text range matches any text that sorts inside it, so a value such as `"pending"` passes
>   `$gt: "2026-01-01"`.
> * An ISO value never matches an epoch filter, and an epoch value never matches an ISO filter.

## Where filters apply

| Call | Filter |
| - | - |
| `query` on a loaded index, in every SDK | Yes, once the index is loaded |
| `query` on a session (Python, JavaScript, Swift, Elixir, C) | Yes |
| Multi-index query | Yes, the same filter on every index |
| `get_docs` on a session (Python, Swift, C) | Yes, every match without ranking, optionally sorted |
| `getDocs` / `get_docs` on a JavaScript or Elixir session | No, by id only |
| `getDocs` / `get_docs` on a cloud index | No, by id only. Python's `GetDocumentsOptions` takes `filter` and `sort_by`, but `MossClient.get_docs` ignores them |

## Implementation

Runnable, per-language examples (catalog filters, geo `$near`, and filtering inside a
session) live in the SDK guides:

* [Python](https://docs.moss.dev/docs/reference/python/metadata-filtering.md)
* [JavaScript](https://docs.moss.dev/docs/reference/js/metadata-filtering.md)

The other SDKs take the same filters:

* **Swift**: the typed `Filter`, such as
  `.and([.greaterThanOrEqual("created_at", 1767225600), .lessThanOrEqual("created_at", 1769903999)])`,
  set as `QueryOptions(filter:)` or passed to `session.getDocs(where:sortBy:)`. See
  [Graph retrieval](https://docs.moss.dev/docs/reference/swift/graph-retrieval.md).
* **Elixir**: the same maps with string keys, such as
  `%{"field" => "created_at", "condition" => %{"$gte" => 1767225600}}`, passed as `filter:`.
  See [Moss.Session](https://docs.moss.dev/docs/reference/elixir/classes/Session.md).
* **C**: the same filter as a JSON string in `MossQueryOptions.filter_json`. See
  [C API](https://docs.moss.dev/docs/reference/c/api.md).
* **Browser**: the same objects as JavaScript, on a loaded index. See
  [Browser SDK](https://docs.moss.dev/docs/reference/browser/api.md).

## Related

> [card] [Hybrid search](https://docs.moss.dev/docs/integrate/hybrid-search.md)
>
> Blend semantic and keyword scoring.

> [card] [Retrieval](https://docs.moss.dev/docs/integrate/retrieval.md)
>
> Retrieval strategies overview.
