<!-- Source: https://docs.moss.dev/docs/reference/js/type-aliases/MossModel.md -->
# MossModel

> JavaScript embedding model choices: moss-minilm, moss-mediumlm, or custom for caller-provided document and query embeddings.

[@moss-js/moss](https://docs.moss.dev/docs/reference/js/api.md) / MossModel

> **MossModel** = `"moss-minilm"` | `"moss-mediumlm"` | `"custom"`

Available embedding models for text-to-vector conversion.

Each model offers different trade-offs between speed, accuracy, and resource usage:

* **moss-minilm**: Lightweight model optimized for speed and efficiency.
  Best for applications requiring fast response times with moderate accuracy requirements.

* **moss-mediumlm**: Balanced model offering higher accuracy with reasonable performance.
  Best for applications where search quality is important and moderate latency is acceptable.

* **custom**: Use this when providing pre-computed embeddings from external sources.
  No embedding model is loaded. All documents must include embeddings, and all queries
  must provide embeddings via QueryOptions.embedding.
