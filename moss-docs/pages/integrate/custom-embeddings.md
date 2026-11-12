<!-- Source: https://docs.moss.dev/docs/integrate/custom-embeddings.md -->
# Custom Embeddings

> Provide your own embeddings for Moss indexes and queries instead of using a built-in on-device model.

Moss embeds text on-device with built-in models (`moss-minilm`, `moss-mediumlm`). If you
already generate embeddings elsewhere - a proprietary model, a hosted embedding API, or a
shared pipeline across services - use `model_id="custom"` to supply your own vectors. Moss
indexes and searches them; it does not load a local model.

## How it works

* **At index time**, every document must carry its own `embedding`. With `model_id="custom"`,
  Moss does not embed for you. (If you omit `model_id` and every document has an `embedding`,
  Moss infers `"custom"` automatically; mixed documents are rejected.)
* **At query time**, you must pass the query vector via `QueryOptions.embedding`, because
  there is no local model to embed the query text.
* All vectors must share the same dimensionality.
* Sessions support custom embeddings too: open the session with `model_id="custom"`, set each
  document's `embedding`, and pass a query embedding (`QueryOptions.embedding`) on every query.

> [!NOTE]
>
> With `model_id="custom"`, adding a document without `.embedding`, or querying without
> `QueryOptions.embedding`, raises a `ValueError`.

## Implementation

Runnable, per-language examples (cloud index and session) live in the SDK guides:

* [Python](https://docs.moss.dev/docs/reference/python/custom-embeddings.md)
* [JavaScript](https://docs.moss.dev/docs/reference/js/custom-embeddings.md)

## Related

> [card] [Local embeddings](https://docs.moss.dev/docs/build/local-embeddings.md)
>
> Use the built-in on-device models.

> [card] [Hybrid search](https://docs.moss.dev/docs/integrate/hybrid-search.md)
>
> Blend semantic and keyword scoring.
