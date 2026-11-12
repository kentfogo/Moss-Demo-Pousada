<!-- Source: https://docs.moss.dev/docs/start/quickstart.md -->
# SDK Quickstart

> Install, authenticate, create an index, and query it (JS/Python tabs)

Follow one path to a visible result. Choose your language tab.

## Prerequisites:

* Node.js 20.4+ or Python 3.10+
* Valid Moss project credentials (`MOSS_PROJECT_ID`, `MOSS_PROJECT_KEY`)
* JS: `@moss-js/moss`; Python: `moss`

**1. Install**

```bash JavaScript theme={null}
npm install @moss-js/moss
```

```bash Python theme={null}
pip install moss
```

> [!NOTE]
>
> Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to 1.9.0+ before then.

> [!NOTE]
>
> Moss for Node moved from `@moss-dev/moss` to `@moss-js/moss` with 1.8.0. `@moss-dev/moss` is a frozen 1.7.1 package. Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to `@moss-js/moss` 1.9.0+ before then. The date will be announced in the changelog. `@moss-dev/moss-web` is the browser SDK and is not this package.

**2. Configure credentials**

From the Moss portal, copy your Project ID and create a key on the **API Keys** page. Set them as env vars:

```bash theme={null}
export MOSS_PROJECT_ID="your_project_id"
export MOSS_PROJECT_KEY="your_project_key"
```

**3. Create and query an index**

Save the JavaScript as `quickstart.mts` and run `npx tsx quickstart.mts` (the `.mts` extension lets it use top-level `await`), or save the Python as `quickstart.py` and run `python quickstart.py`:

```ts JavaScript theme={null}
import { MossClient, DocumentInfo } from '@moss-js/moss'
const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
const documents: DocumentInfo[] = [
  { id: 'doc1', text: 'How do I track my order? You can track your order by logging into your account.', metadata: { category: 'shipping' } },
  { id: 'doc2', text: 'What is your return policy? We offer a 30-day return policy for most items.', metadata: { category: 'returns' } },
  { id: 'doc3', text: 'How can I change my shipping address? Contact our customer service team.', metadata: { category: 'support' } },
]
const indexName = 'faqs'
await client.createIndex(indexName, documents, { modelId: 'moss-minilm' }) // default; use 'moss-mediumlm' for higher accuracy
await client.loadIndex(indexName)
const results = await client.query(indexName, 'How do I return a damaged product?', { topK: 3 })
console.log(results.docs[0])
```

```python Python theme={null}
import os
import asyncio
from moss import MossClient, DocumentInfo, QueryOptions
client = MossClient(os.getenv("MOSS_PROJECT_ID"), os.getenv("MOSS_PROJECT_KEY"))
index_name = "faqs"
documents = [
    DocumentInfo(id="doc1", text="How do I track my order? You can track your order by logging into your account.", metadata={"category": "shipping"}),
    DocumentInfo(id="doc2", text="What is your return policy? We offer a 30-day return policy for most items.", metadata={"category": "returns"}),
    DocumentInfo(id="doc3", text="How can I change my shipping address? Contact our customer service team.", metadata={"category": "support"}),
]
async def main():
    await client.create_index(index_name, documents, "moss-minilm")  # default; use "moss-mediumlm" for higher accuracy
    await client.load_index(index_name)
    results = await client.query(index_name, "How do I return a damaged product?", QueryOptions(top_k=3, alpha=0.6))
    print(f"  ID: {results.docs[0].id}")
    print(f"  Text: {results.docs[0].text}")
    print(f"  Score: {results.docs[0].score}")
asyncio.run(main())
```

## Example output

```json theme={null}
{
  "id": "doc2",
  "score": 0.82,
  "text": "What is your return policy? We offer a 30-day return policy for most items."
}
```

> [!NOTE]
>
> `score` is each result's relevance to the query, from 0 to 1 (the value here is illustrative). See
> [Score semantics](https://docs.moss.dev/docs/integrate/retrieval.md#score-semantics) for what it means and the SDK version it needs.

> [!TIP]
>
> Need keyword-heavy results? Set `alpha` to `0.0` for pure keyword, `1.0` for pure semantic, or a blend in between (see [Hybrid Search](https://docs.moss.dev/docs/integrate/hybrid-search.md) for details).

## Next steps

You just created a cloud index and queried it. Moss does much more:

> [card] [Core concepts](https://docs.moss.dev/docs/start/core-concepts.md)
>
> Indexes, embeddings, retrieval, sessions, and sync in one place.

> [card] [Sessions](https://docs.moss.dev/docs/integrate/sessions.md)
>
> Local-first, real-time indexing during a live interaction.

> [card] [Hybrid search](https://docs.moss.dev/docs/integrate/hybrid-search.md)
>
> Blend semantic and keyword scoring with `alpha`.

> [card] [Metadata filtering](https://docs.moss.dev/docs/integrate/metadata-filtering.md)
>
> Narrow results with `$eq`, `$in`, `$near`, and more.

> [card] [Custom embeddings](https://docs.moss.dev/docs/integrate/custom-embeddings.md)
>
> Bring your own vectors instead of the built-in model.

> [card] [Multi-index search](https://docs.moss.dev/docs/integrate/multi-index-search.md)
>
> Query several indexes at once for a global top-K.

> [card] [Data hydration & sync](https://docs.moss.dev/docs/build/data-hydration-sync.md)
>
> Hydrate on-device indexes and keep them fresh.

> [card] [SDK Overview](https://docs.moss.dev/docs/reference/sdk.md)
>
> Full per-language API: Python, JavaScript, Swift, Elixir, Browser, C.
