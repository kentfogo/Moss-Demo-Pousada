<!-- Source: https://docs.moss.dev/docs/reference/python/hybrid-search.md -->
# Hybrid search (Python SDK)

> Configure hybrid semantic and keyword search with the alpha parameter in the Moss Python SDK.

Semantic (vector) search captures meaning; keyword (BM25) search captures exact terms.
Hybrid search blends both with one parameter, `alpha`, set on
[`QueryOptions`](./interfaces/QueryOptions). As with all queries, load the index first with
[`load_index()`](./classes/MossClient#load_index-name-auto_refresh-polling_interval_in_seconds)
(or open a [session](https://docs.moss.dev/docs/reference/python/sessions.md)).

## The `alpha` parameter

| `alpha` | Behavior |
| - | - |
| `1.0` | Pure semantic (embeddings only) |
| `0.0` | Pure keyword (BM25 only) |
| between | Blends the two; default is semantic-heavy at `0.8` |

## Example

```python theme={null}
import asyncio
from moss import MossClient, QueryOptions

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)
    await client.load_index("faqs")   # required before querying

    # Blend semantic and keyword scoring (60/40).
    hybrid = await client.query("faqs", "return policy", QueryOptions(top_k=3, alpha=0.6))

    # Pure keyword.
    keyword_only = await client.query("faqs", "return policy", QueryOptions(top_k=3, alpha=0.0))

    # Pure semantic (the default leans here at 0.8).
    semantic_only = await client.query("faqs", "return policy", QueryOptions(top_k=3, alpha=1.0))

    for doc in hybrid.docs:
        print(f"{doc.id} score={doc.score:.3f} {doc.text}")

asyncio.run(main())
```

`alpha` also applies inside a [session](https://docs.moss.dev/docs/reference/python/sessions.md) query and composes with
[metadata filtering](https://docs.moss.dev/docs/reference/python/metadata-filtering.md):

```python theme={null}
session = await client.session(index_name="call-123")
await session.query("billing dispute", QueryOptions(top_k=3, alpha=0.6))
```

## Choosing alpha

* Lower `alpha` (toward keyword) when queries contain exact identifiers, SKUs, names, or jargon.
* Higher `alpha` (toward semantic) when queries are natural-language paraphrases.
* Tune per index and per intent (returns, billing, onboarding, and so on).

## Behavior notes

* If you omit `alpha`, it defaults to `0.8`.
* `alpha` works the same way for [multi-index search](https://docs.moss.dev/docs/reference/python/multi-index-search.md).

## Related

> [card] [Metadata filtering](https://docs.moss.dev/docs/reference/python/metadata-filtering.md)
>
> Constrain results by document metadata.

> [card] [Custom embeddings](https://docs.moss.dev/docs/reference/python/custom-embeddings.md)
>
> Bring your own vectors.
