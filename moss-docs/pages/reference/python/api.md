<!-- Source: https://docs.moss.dev/docs/reference/python/api.md -->
# Moss Python SDK overview

> Everything the Moss Python SDK can do, with a snippet for each operation.

The Moss Python SDK (`moss`) brings semantic search to Python. It wraps a high-performance
Rust core and exposes an async API. Documents are embedded and queried locally, with optional
cloud sync.

## Requirements

* Python 3.10 or higher

## Install

```bash theme={null}
pip install moss
```

> [!NOTE]
>
> Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to 1.9.0+ before then.

Get your project credentials from the [Moss portal](https://portal.usemoss.dev).

## Two ways to search

* [`MossClient`](./classes/MossClient) - the entry point. Manage cloud indexes, load one into memory, and query it.
* [`SessionIndex`](./classes/SessionIndex) - a local, in-process index for real-time indexing during a live interaction; push to the cloud when done.

## Quick start

```python theme={null}
import asyncio
from moss import MossClient, DocumentInfo, QueryOptions

async def main():
    client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)
    await client.create_index("faqs", [
        DocumentInfo(id="doc1", text="Track your order in your account.", metadata={"category": "shipping"}),
        DocumentInfo(id="doc2", text="30-day return policy for most items.", metadata={"category": "returns"}),
    ])
    await client.load_index("faqs")
    results = await client.query("faqs", "return a damaged product", QueryOptions(top_k=3))
    for doc in results.docs:
        print(doc.id, doc.score)

asyncio.run(main())
```

## Indexes

Create, inspect, and delete cloud indexes. Mutations run as async jobs and return a
`MutationResult` with a `job_id` and `doc_count`.

```python theme={null}
# Create (defaults to moss-minilm)
result = await client.create_index("faqs", documents)

# Inspect
info = await client.get_index("faqs")     # IndexInfo: name, doc_count, model.id, status
indexes = await client.list_indexes()      # list[IndexInfo]

# Delete
await client.delete_index("faqs")
```

## Index from files

Build an index straight from PDF and DOCX files - the server parses, chunks, and embeds
them. Up to 20 files per call.

```python theme={null}
from moss import ParseFileInput, ParseOptions

await client.create_index_from_files("contracts", [
    ParseFileInput(name="report.pdf", content_type="application/pdf", path="/docs/report.pdf"),
], parse_options=ParseOptions(ocr_mode="full_ocr"))
```

See [Index from files](https://docs.moss.dev/docs/reference/python/files.md).

## Documents

Add, update, fetch, and remove documents on an existing index.

```python theme={null}
from moss import MutationOptions, GetDocumentsOptions

# Add or upsert
await client.add_docs("faqs", new_docs, MutationOptions(upsert=True))

# Fetch all, or by id
all_docs = await client.get_docs("faqs")
some = await client.get_docs("faqs", GetDocumentsOptions(doc_ids=["doc1", "doc2"]))

# Delete by id
await client.delete_docs("faqs", ["doc6", "doc7"])
```

## JSON, files and chunking

`create_index`, `add_docs` and `SessionIndex.add_docs` also take dicts, JSON array or JSON Lines
text, and `.json`, `.jsonl`, `.ndjson`, `.txt`, `.md` and `.markdown` files as
`pathlib.Path` objects. Text and markdown files are chunked into documents `{path}#{n}` with
metadata `parentId`. Tune that with `chunking=Chunking(...)`, or split text yourself with
`chunker=`. *(moss 1.18.0+)*

```python theme={null}
from pathlib import Path
from moss import Chunking

await client.create_index("faqs", Path("faqs.jsonl"))
await client.add_docs("faqs", [{"id": "doc9", "text": "30-day returns."}])
await client.create_index("handbook", Path("handbook.md"), chunking=Chunking(chunk_size=800))
```

`Chunking`, `DocsInput` and `Chunker` are exported from `moss`. See [`Chunking`](./interfaces/Chunking).

## Load and query

Load an index into memory, then query it in-process. Call `load_index` before querying.

```python theme={null}
await client.load_index("faqs")
results = await client.query("faqs", "return a damaged product", QueryOptions(top_k=3))
for doc in results.docs:
    print(doc.id, doc.score, doc.text)

await client.unload_index("faqs")   # free memory when done
```

## Hybrid search

Blend semantic and keyword scoring with `alpha` (1.0 = semantic, 0.0 = keyword; default 0.8).

```python theme={null}
await client.query("faqs", "return policy", QueryOptions(top_k=3, alpha=0.6))
```

See [Hybrid search](https://docs.moss.dev/docs/reference/python/hybrid-search.md).

## Metadata filtering

Narrow results by document metadata on a loaded index.

```python theme={null}
await client.query("products", "running shoes", QueryOptions(top_k=5, filter={
    "$and": [
        {"field": "category", "condition": {"$eq": "shoes"}},
        {"field": "price",    "condition": {"$lt": "100"}},
    ],
}))
```

Operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$near`, composed with
`$and` / `$or`. See [Metadata filtering](https://docs.moss.dev/docs/reference/python/metadata-filtering.md).

## Custom embeddings

Supply your own vectors with `model_id="custom"` (each document carries `embedding`, and
queries pass `embedding`).

```python theme={null}
await client.create_index("tickets", docs_with_embeddings, model_id="custom")
await client.load_index("tickets")
await client.query("tickets", "billing problem", QueryOptions(top_k=3, embedding=query_vector))
```

See [Custom embeddings](https://docs.moss.dev/docs/reference/python/custom-embeddings.md).

## Multi-index search

Query several loaded indexes in one call; each result is tagged with its source `index_name`.

```python theme={null}
await client.load_indexes(["products", "reviews", "faqs"])
results = await client.query_multi_index(["products", "reviews", "faqs"], "battery life", QueryOptions(top_k=6))
for doc in results.docs:
    print(doc.index_name, doc.id, doc.score)
await client.unload_indexes(["products", "reviews", "faqs"])
```

See [Multi-index search](https://docs.moss.dev/docs/reference/python/multi-index-search.md).

## Sessions

Index and query locally in real time with a [`SessionIndex`](./classes/SessionIndex), then
push to the cloud. `session()` resumes an existing cloud index by name, or starts empty.

```python theme={null}
session = await client.session(index_name="call-123")
await session.add_docs([DocumentInfo(id="turn-1", text="Customer reported a duplicate charge.")])
hits = await session.query("billing issue", QueryOptions(top_k=3))
await session.push_index()
```

Save a session to disk and restore it in a later run with no index download.
*(moss 1.16.0+)*

```python theme={null}
await session.save_to_disk("/var/cache/my-app/moss")

# Later: skip the cloud load and restore the snapshot
session = await client.session(index_name="call-123", auto_load_on_init=False)
loaded = await session.load_from_disk("/var/cache/my-app/moss")
```

See [Sessions](https://docs.moss.dev/docs/reference/python/sessions.md).

## Keeping indexes fresh

Auto-refresh a loaded index (poll the cloud and hot-swap newer versions in automatically),
and track async jobs.

```python theme={null}
await client.load_index("faqs", auto_refresh=True, polling_interval_in_seconds=300)
status = await client.get_job_status(result.job_id)
```

## Inference

Answer with facts from your indexes. A `MossInference` client takes the arguments of OpenAI's
`responses.create`, plus `indexes`, and returns responses with OpenAI's field names.

```python theme={null}
from moss import MossInference

llm = MossInference(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)
stream = await llm.responses.create(
    model="moss/fastlane-1",
    input="Do you ship to Canada?",
    indexes=["faqs"],
    stream=True,
)
async with stream:
    async for event in stream:
        if event.type == "response.output_text.delta":
            print(event.delta, end="")
```

See [Inference](https://docs.moss.dev/docs/inference/sdks/python.md).

## Errors

Every failure the native core reports raises [`MossError`](./interfaces/MossError), a
`RuntimeError` whose `code` is a stable string such as `"NOT_FOUND"` or `"NETWORK"`. Branch on
`code`, not on the message. [`InvalidArgumentError`](./interfaces/InvalidArgumentError) is the
`INVALID_ARGUMENT` subclass and is also a `ValueError`. `load_indexes` reports each failed
name's code in `failed_codes`. Checks the SDK makes before calling the core, such as a closed
client, raise plain Python exceptions with no `code`. *(moss 1.15.0+)*

```python theme={null}
from moss import MossError

try:
    results = await client.query("faqs", "refund policy")
except MossError as e:
    if e.code != "NOT_FOUND":
        raise
    await client.load_index("faqs")
    results = await client.query("faqs", "refund policy")
```

See [Error codes](https://docs.moss.dev/docs/reference/errors.md#error-codes).

## Models

* `moss-minilm` (default) - fast, lightweight
* `moss-mediumlm` - higher accuracy
* `custom` - supply your own embedding vectors via `DocumentInfo.embedding`

## Guides

* [Index from files](https://docs.moss.dev/docs/reference/python/files.md)
* [Sessions](https://docs.moss.dev/docs/reference/python/sessions.md)
* [Hybrid search](https://docs.moss.dev/docs/reference/python/hybrid-search.md)
* [Metadata filtering](https://docs.moss.dev/docs/reference/python/metadata-filtering.md)
* [Custom embeddings](https://docs.moss.dev/docs/reference/python/custom-embeddings.md)
* [Multi-index search](https://docs.moss.dev/docs/reference/python/multi-index-search.md)
* [Inference](https://docs.moss.dev/docs/inference/sdks/python.md)

## Reference

[MossClient](https://docs.moss.dev/docs/reference/python/classes/MossClient.md) and [SessionIndex](https://docs.moss.dev/docs/reference/python/classes/SessionIndex.md), plus all interfaces and types, are in the Reference section of the sidebar.
