<!-- Source: https://docs.moss.dev/docs/integrate/retrieval.md -->
# Retrieval

> Choose vector, keyword, or hybrid retrieval

Moss supports three retrieval strategies, all over the same query call:

* **Vector similarity** (semantic) - matches on meaning
* **Keyword / BM25** - matches on exact terms
* **Hybrid** - blends both, tuned with `alpha`

An index must be loaded before you query it. Call
[`load_index()`](https://docs.moss.dev/docs/reference/python/classes/MossClient#load_index-name-auto_refresh-polling_interval_in_seconds)
(or open a [session](https://docs.moss.dev/docs/integrate/sessions.md)) first; queries then run entirely in-memory
(\~1-10 ms).

## Basic query

```ts JavaScript theme={null}
import { MossClient } from '@moss-js/moss'
const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
await client.loadIndex('my-index')
const results = await client.query('my-index', 'getting started latency', { topK: 5 })
```

```python Python theme={null}
from moss import MossClient, QueryOptions
import os

client = MossClient(os.getenv("MOSS_PROJECT_ID"), os.getenv("MOSS_PROJECT_KEY"))
await client.load_index("my-index")
results = await client.query("my-index", "getting started latency", QueryOptions(top_k=5))
```

## Score semantics

Every result carries a `score`: the hit's relevance to the query, from 0 to 1, on single- and
multi-index queries alike. It is a per-model rescaled similarity, not a calibrated probability, and it
depends on the embedding model, so tune any threshold against your own queries and model. Results stay
in hybrid (semantic plus keyword) order, so the score is not the sort key: a lower-ranked result can
carry a higher score. A keyword-only query (`alpha=0`, or an index without vectors) scores every hit 0.

In Python and JavaScript, set `min_score` (`minScore`) to drop low-relevance hits. It takes a value
from 0 to 1, and a query then returns up to `top_k` results that clear the floor, in hybrid order. It
needs a semantic signal to score against, so it is rejected on a keyword-only query (`alpha=0`, or
an index without vectors), and session queries ignore it. The Browser, Elixir and Swift SDKs return
the same `score` but have no threshold option.

> [!NOTE]
>
> The relevance `score` requires `moss` **1.14.0+** (Python), `@moss-js/moss` **1.15.0+** (JavaScript),
> `@moss-dev/moss-web` **1.3.0+** (Browser), Elixir `moss` **1.4.0+**, or the Swift SDK **0.6.3+**.
> `min_score` and `minScore` need the same Python and JavaScript versions.

## Go deeper

> [card] [Hybrid search](https://docs.moss.dev/docs/integrate/hybrid-search.md)
>
> Blend semantic and keyword scoring with `alpha`.

> [card] [Metadata filtering](https://docs.moss.dev/docs/integrate/metadata-filtering.md)
>
> Narrow results by document metadata.

> [card] [Custom embeddings](https://docs.moss.dev/docs/integrate/custom-embeddings.md)
>
> Bring your own query and document vectors.

> [card] [Multi-index search](https://docs.moss.dev/docs/integrate/multi-index-search.md)
>
> Query several loaded indexes in one call.

## Tuning

* Adjust `topK` / `top_k` to trade recall for latency
* Drop low-relevance hits with `min_score` (`minScore`) in Python and JavaScript (a value from 0 to 1; see [Score semantics](#score-semantics))
* Layer metadata filters to narrow candidate sets
* Group queries by intent (returns, billing, onboarding) and tune per index
* Choose model per index: `moss-minilm` (fast) or `moss-mediumlm` (more accurate)
