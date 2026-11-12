<!-- Source: https://docs.moss.dev/docs/reference/python/custom-embeddings.md -->
# Custom embeddings (Python SDK)

> Use caller-provided document and query embeddings with cloud indexes and sessions in the Moss Python SDK.

Moss embeds text on-device with built-in models (`moss-minilm`, `moss-mediumlm`). If you
already generate embeddings elsewhere - a proprietary model, a hosted embedding API, or a
shared pipeline across services - use `model_id="custom"` to supply your own vectors. Moss
indexes and searches them; it does not load a local model. This works for both cloud indexes
and [sessions](https://docs.moss.dev/docs/reference/python/sessions.md).

## How it works

* At index time, every document must carry its own `embedding`. With `model_id="custom"`,
  Moss does not embed for you. (If you omit `model_id` and every document has an `embedding`,
  Moss infers `"custom"` automatically; mixed documents are rejected.)
* At query time, you must pass the query vector via
  [`QueryOptions.embedding`](./interfaces/QueryOptions), because there is no local model to
  embed the query text.
* All vectors must share the same dimensionality.

## On a cloud index

```python theme={null}
import asyncio
from moss import DocumentInfo, MossClient, QueryOptions

def embed(text: str) -> list[float]:
    """Your embedding function - any model, as long as dimensions are consistent."""
    ...

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

    # Index with precomputed vectors. model_id="custom" means Moss does not embed.
    docs = [
        DocumentInfo(id="1", text="Customer asked about billing", embedding=embed("Customer asked about billing")),
        DocumentInfo(id="2", text="Refund requested for duplicate charge", embedding=embed("Refund requested for duplicate charge")),
    ]
    await client.create_index("tickets", docs, model_id="custom")
    await client.load_index("tickets")   # required before querying

    # Query with your own query vector (required for custom embeddings).
    q = embed("billing problem")
    results = await client.query("tickets", "billing problem", QueryOptions(top_k=3, embedding=q))
    for doc in results.docs:
        print(f"{doc.id} score={doc.score:.3f} {doc.text}")

asyncio.run(main())
```

## In a session

Sessions support custom embeddings too: open the session with `model_id="custom"`, set
`.embedding` on every document you add, and pass `QueryOptions.embedding` on every query.

```python theme={null}
session = await client.session(index_name="conv-123", model_id="custom")
await session.add_docs([DocumentInfo(id="1", text="Customer asked about billing", embedding=embed("Customer asked about billing"))])
results = await session.query("billing problem", QueryOptions(top_k=3, embedding=embed("billing problem")))
```

> [!NOTE]
>
> With `model_id="custom"`, adding a document without `.embedding`, or querying without
> `QueryOptions.embedding`, raises a `ValueError`.

## Related

> [card] [Hybrid search](https://docs.moss.dev/docs/reference/python/hybrid-search.md)
>
> Blend semantic and keyword scoring.

> [card] [Sessions](https://docs.moss.dev/docs/reference/python/sessions.md)
>
> Use custom vectors in a live local index.
