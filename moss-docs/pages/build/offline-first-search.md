<!-- Source: https://docs.moss.dev/docs/build/offline-first-search.md -->
# Sub-10ms Knowledge Retrieval

> Load an index into memory and run semantic queries in-process.

Moss loads an index into memory and runs embedding and search in-process, so a query is a
local call with no network round trip per operation. The pattern is the same in every SDK:
load the index once, then query it.

```ts theme={null}
await client.loadIndex(indexName)
const results = await client.query(indexName, 'How do I return a damaged product?', { topK: 3 })
```

Queries run against the in-memory index and embed the query text with a local model.

## The query pipeline

![Query text is embedded locally, retrieved from an in-process loaded index, optionally reranked, and returned as results](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/offline-first-search-light.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=30c2869bae1001203721436fc245f3dc)

![Query text is embedded locally, retrieved from an in-process loaded index, optionally reranked, and returned as results](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/offline-first-search-dark.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=71b4a8ef2747d363022821e8dc8c2e1e)

* Load the index once, then query it in-process.
* Optional background sync to the cloud.
* Query pipeline: text -> embed -> retrieve -> rerank (optional).

## Prerequisites

* Node.js 18+ or Python 3.10+
* Moss credentials: `MOSS_PROJECT_ID`, `MOSS_PROJECT_KEY`
* An index to query (create `faqs` via the [Quickstart](https://docs.moss.dev/docs/start/quickstart.md) if you don't have one yet)

## Steps

**1. Export credentials (and index if different)**

```bash theme={null}
export MOSS_PROJECT_ID=your_project_id
export MOSS_PROJECT_KEY=your_project_key
export MOSS_INDEX_NAME=faqs   # or your index
```

**2. Ensure the index exists**

Ensure the index exists (see [Quickstart](https://docs.moss.dev/docs/start/quickstart.md) to create `faqs`).

**3. Run one of the snippets below**

Run one of the snippets below.

## Run the sample (JavaScript or Python)

```ts JavaScript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(
  process.env.MOSS_PROJECT_ID!,
  process.env.MOSS_PROJECT_KEY!
)

const indexName = process.env.MOSS_INDEX_NAME || 'faqs' // ensure this exists (see Quickstart)

async function main() {
  await client.loadIndex(indexName)
  const results = await client.query(indexName, 'How do I return a damaged product?', { topK: 3 })

  console.log(`Found ${results.docs.length} docs in ${results.timeTakenInMs}ms`)
  results.docs.forEach((doc, i) => {
    console.log(`${i + 1}. [${doc.id}] ${doc.text} (score: ${doc.score.toFixed(3)})`)
  })
}

main().catch(console.error)
```

```python Python theme={null}
import os
import asyncio
from moss import MossClient, QueryOptions

project_id = os.getenv("MOSS_PROJECT_ID")
project_key = os.getenv("MOSS_PROJECT_KEY")
index_name = os.getenv("MOSS_INDEX_NAME", "faqs")  # ensure this exists (see Quickstart)

async def main():
    client = MossClient(project_id, project_key)
    await client.load_index(index_name)
    results = await client.query(index_name, "How do I return a damaged product?", QueryOptions(top_k=3))

    print(f"Found {len(results.docs)} docs")
    for i, doc in enumerate(results.docs, 1):
        print(f"{i}. [{doc.id}] {doc.text} (score: {doc.score:.3f})")

asyncio.run(main())
```

The sample loads your index into memory and returns the top matches. An index must be loaded
with `loadIndex` / `load_index` (or opened as a session) before you can query it.
