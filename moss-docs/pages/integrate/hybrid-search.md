<!-- Source: https://docs.moss.dev/docs/integrate/hybrid-search.md -->
# Hybrid Search

> Choose semantic-only, keyword-only, or blended retrieval in Moss with the alpha setting and tune it to your query intent.

Semantic (vector) search captures meaning; keyword (BM25) search captures exact terms.
Hybrid search blends both with one parameter, `alpha`, so you can tune relevance per query
or per index. As with all queries, load the index first (or open a
[session](https://docs.moss.dev/docs/integrate/sessions.md)).

## The `alpha` parameter

| `alpha` | Behavior |
| - | - |
| `1.0` | Pure semantic (embeddings only) |
| `0.0` | Pure keyword (BM25 only) |
| between | Blends the two; default is semantic-heavy at `0.8` |

## Choosing alpha

* Lower `alpha` (toward keyword) when queries contain exact identifiers, SKUs, names, or jargon.
* Higher `alpha` (toward semantic) when queries are natural-language paraphrases.
* Tune per index and per intent (returns, billing, onboarding, etc.).

## What the score means

The returned `score` is a relevance value, not the sort key: results stay in hybrid order. A pure
keyword query (`alpha=0`) scores every hit 0. See
[Score semantics](https://docs.moss.dev/docs/integrate/retrieval.md#score-semantics) for exactly what it means, how to
threshold with `min_score`, and the SDK version it needs.

## Implementation

Runnable, per-language examples live in the SDK guides:

* [Python](https://docs.moss.dev/docs/reference/python/hybrid-search.md)
* [JavaScript](https://docs.moss.dev/docs/reference/js/hybrid-search.md)

## Related

> [card] [Metadata filtering](https://docs.moss.dev/docs/integrate/metadata-filtering.md)
>
> Constrain results by document metadata.

> [card] [Custom embeddings](https://docs.moss.dev/docs/integrate/custom-embeddings.md)
>
> Bring your own vectors.
