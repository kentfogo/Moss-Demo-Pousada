<!-- Source: https://docs.moss.dev/docs/reference/python/structured-payload.md -->
# Structured payload

> Attach an opaque structured record to a document, stored and returned verbatim.

Each document can carry an optional `payload` — an opaque string (typically JSON) that Moss
stores and returns **unchanged**. It is never embedded or searched; it's the place for the
full structured record behind the embeddable `text` (the source row, a nested object,
anything you can serialize). Use `metadata` for the flat fields you filter on, and `payload`
for the complete record you want back verbatim.

> [!NOTE]
>
> Requires `moss` **1.5.0+** (which pulls `inferedge-moss-core` `0.18.0`). Older indexes built
> without a payload return `payload = None`; no migration is needed.

## How it works

* Set `payload` (a `str`) on a [`DocumentInfo`](./interfaces/DocumentInfo) when you build or
  add documents. Moss carries it through the upload/build pipeline and persists it alongside
  `text` and `metadata`.
* It comes back on [`get_docs()`](./classes/MossClient#get_docs-name-options) and on query
  results ([`QueryResultDocumentInfo.payload`](./interfaces/QueryResultDocumentInfo)).
* Moss treats it as an opaque string — it does not parse or validate it. Serialize/deserialize it
  yourself (e.g. `json.dumps` / `json.loads`).

## On a cloud index

```python theme={null}
import asyncio
import json
from moss import DocumentInfo, MossClient

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

    # The full structured record travels in `payload`; `text` is what gets embedded.
    docs = [
        DocumentInfo(
            id="ticket-42",
            text="Customer asked about a duplicate billing charge.",          # embedded + searched
            metadata={"status": "open", "priority": "high"},                  # filterable
            payload=json.dumps({                                              # verbatim record
                "customer": {"id": "c_1", "tier": "pro"},
                "amount": 19.0,
                "tags": ["billing", "refund"],
            }),
        ),
    ]
    await client.create_index("tickets", docs, model_id="moss-minilm")

    # Read the documents back — payload returns exactly as stored.
    fetched = await client.get_docs("tickets")
    record = json.loads(fetched[0].payload)
    print(record["customer"]["tier"])   # -> "pro"

    # Payload is also present on query hits.
    await client.load_index("tickets")
    results = await client.query("tickets", "billing problem")
    top = results.docs[0]
    if top.payload:
        print(json.loads(top.payload)["tags"])   # -> ["billing", "refund"]

asyncio.run(main())
```

You can set `payload` the same way on [`add_docs()`](./classes/MossClient#add_docs-name-docs-options)
to append documents to an existing index.

> [!NOTE]
>
> `payload` is independent of `metadata`. Keep the fields you filter or sort on in `metadata`
> (string key/values); use `payload` for the larger or nested record you only need to retrieve.

## Related

> [card] [Metadata filtering](https://docs.moss.dev/docs/reference/python/metadata-filtering.md)
>
> Filter results by the flat fields you store in `metadata`.

> [card] [DocumentInfo](https://docs.moss.dev/docs/reference/python/interfaces/DocumentInfo.md)
>
> The document shape, including `payload`.
