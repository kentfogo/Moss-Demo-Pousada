<!-- Source: https://docs.moss.dev/docs/build/local-embeddings.md -->
# Local Embeddings

> Embed documents on-device with a built-in model.

Moss embeds documents on-device using a built-in model, so the text and resulting vectors
stay on the machine and embedding stays off the network path. You choose the model at index
creation.

## How it works

![Text stays on device, flows through a local embedding model, becomes vectors, and is stored in a local index](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/local-embeddings-light.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=a6046639fccb9cd107633fb678e5b09a)

![Text stays on device, flows through a local embedding model, becomes vectors, and is stored in a local index](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/local-embeddings-dark.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=1eec31d66824e77a97df8ce9b6fa4753)

## Setup

Pick the on-device model at index creation: `moss-minilm` (fast, lightweight) or `moss-mediumlm` (higher accuracy). Moss embeds your documents on-device with the model you choose. If you'd rather supply precomputed vectors from your own pipeline, see [Custom embeddings](https://docs.moss.dev/docs/integrate/custom-embeddings.md).

```ts theme={null}
import { MossClient } from '@moss-js/moss'
const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
await client.createIndex('local-embeddings', docs, { modelId: 'moss-minilm' })
```

## Tips

* Batch inputs for speed
* Cache vectors for unchanged content
* Use hybrid retrieval for best relevance

## Related

> [card] [Custom embeddings](https://docs.moss.dev/docs/integrate/custom-embeddings.md)
>
> Bring your own precomputed vectors.

> [card] [Sub-10ms knowledge retrieval](https://docs.moss.dev/docs/build/offline-first-search.md)
>
> The local retrieval pipeline.
