<!-- Source: https://docs.moss.dev/docs/inference/overview.md -->
# Moss Inference

> Run optimized LLM inference alongside retrieval on the same host, delivering sub-200ms inference latency so your agent can start responding sooner.

**Sub-200ms time to first token, with retrieval built in.**

Moss Inference is a low-latency inference API built for real-time AI agents. It brings optimized model inference and context retrieval together, enabling agents to start responding in under 200ms on supported fast-lane workloads.

Run Moss's optimized inference model or access models from OpenAI, Anthropic, Google, and other providers through a single OpenAI-compatible endpoint. Ground responses in your Moss indexes without building or managing a separate retrieval pipeline.

> [!NOTE]
>
> **Private beta:** Moss Inference is currently in private beta. [Request access through the Moss portal](https://portal.usemoss.dev/).

## Why Moss Inference?

Traditional AI applications retrieve context and generate responses through separate systems. Even after retrieving the right information, an agent still needs to send that context to an LLM and wait for generation to begin.

Moss Inference brings retrieval and generation closer together, reducing the overhead between finding relevant information and generating a response.

### Sub-200ms time to first token

Start generating responses in under 200ms with Moss's optimized inference model on supported workloads. Built for applications where response latency matters, including conversational AI, interactive agents, and real-time workflows.

### Retrieval and inference, colocated

Moss runs its optimized inference model alongside its retrieval runtime, allowing relevant context to be retrieved and used without a separate network round trip between the retrieval and generation systems.

Specify a Moss index in your inference request, and Moss retrieves relevant context to ground the model's response.

### One OpenAI-compatible API

Access Moss's optimized model and supported third-party models through a single endpoint.

Use the OpenAI-compatible Responses API, with an optional `indexes` parameter to enable context retrieval. You can use Moss for inference alone or combine it with your existing Moss indexes.

## How Moss Inference works

Moss Inference combines context retrieval and model execution into a single request.

1. **Send a request.** Your agent calls the Moss Inference API, specifying a model and optionally one or more Moss indexes.
2. **Retrieve relevant context.** When indexes are specified, Moss searches them and adds relevant information to the model's input.
3. **Generate a response.** The selected model generates a response, which can be streamed back to your application.

With Moss's optimized model, retrieval and inference run on colocated infrastructure. When using a third-party model, Moss provides access through the same API, with optional retrieval grounding.

**API endpoint**

`https://inference.moss.dev/v1`

## Available models

Moss Inference supports two ways to run inference.

| Model type | Description |
| - | - |
| Moss optimized model | Moss-hosted inference optimized for low-latency response generation, with colocated retrieval |
| Third-party models | Access supported models from OpenAI, Anthropic, Google, and other providers through the Moss endpoint |

Both options can use your Moss indexes to provide relevant context during inference. [Models](https://docs.moss.dev/docs/inference/models.md) lists every id with its prompt limit and prices.

## How it fits

| You need | Moss Inference gives you |
| - | - |
| A model | `moss/fastlane-1` on Moss GPUs, or a vendor model, on one project key |
| Time to first token | Under 200 ms on `moss/fastlane-1`, grounded. A vendor model adds its own latency |
| Grounding | A search of the indexes a call names, hits added to the prompt |
| Tools | OpenAI function tools run by your code, MCP servers and the [`moss_search`](https://docs.moss.dev/docs/inference/moss-search) tool run by Moss |
| Streaming | OpenAI's Responses events or Chat Completions chunks |
| A client | Any OpenAI client with a new base URL, or a Moss SDK on seven platforms |
| Billing | Credits per token and per retrieval, or vendor-billed tokens on your own key |

## Make one call

Run this after the [Quickstart](https://docs.moss.dev/docs/inference/quickstart.md), which creates the `faq` index it searches.

```bash curl theme={null}
curl -N https://inference.moss.dev/v1/responses \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Moss-Indexes: faq" \
  -d '{
    "model": "moss/fastlane-1",
    "stream": true,
    "instructions": "You are the support agent for Acme.",
    "input": "Do you ship to Canada?"
  }'
```

```python Python theme={null}
import asyncio
import os

from moss import MossInference

client = MossInference(os.environ["MOSS_PROJECT_ID"], os.environ["MOSS_PROJECT_KEY"])


async def main():
    response = await client.responses.create(
        model="moss/fastlane-1",
        instructions="You are the support agent for Acme.",
        input="Do you ship to Canada?",
        indexes=["faq"],
    )
    print(response.output_text)


asyncio.run(main())
```

Moss searches the `faq` index for the question, adds what it finds to the prompt, and answers. The curl call streams the reply. The Python client installs with `pip install moss`; [SDKs](https://docs.moss.dev/docs/inference/sdks.md) lists the other six.

## What can you build?

**Real-time voice agents**

Reduce the delay before an agent starts responding while retrieving relevant information from conversation context and business knowledge.

**Browser and computer-use agents**

Support agents that interact with websites and applications, using retrieved instructions, task context, and relevant knowledge to inform their next actions.

**Long-running agents**

Give agents access to relevant information from previous steps and persistent indexes as they work through multi-step tasks.

**AI copilots and assistants**

Build responsive applications that answer questions using your own documents, product information, and business knowledge.

## Choose how to start

> [card] [Quickstart](https://docs.moss.dev/docs/inference/quickstart.md)
>
> Get a grounded, streamed reply in five minutes.

> [card] [Models](https://docs.moss.dev/docs/inference/models.md)
>
> Every model, with its prompt limit, prices and notes.

> [card] [Use an OpenAI client](https://docs.moss.dev/docs/inference/openai-compatibility.md)
>
> Change the base URL and the key. What differs from OpenAI.

> [card] [SDKs](https://docs.moss.dev/docs/inference/sdks.md)
>
> Inference clients for seven platforms.

## Terms

| Term | Meaning | Called elsewhere |
| - | - | - |
| Index | A searchable set of your documents, built with the Moss SDK or API. | Vector store, knowledge base |
| Retrieval | One search of your indexes: the search before the model answers, or one `moss_search` call. | RAG, grounding |
| Time to first token | The time from sending the request to the first streamed token, not to the whole reply. | TTFT, latency |
| Project id and key | The two portal credentials that together form the bearer token. | API key |
| Moss key | A vendor model called on Moss's vendor account and billed to your credits. | Hosted model |
| Your own key | A vendor model called on your vendor account, with the key sent in `X-Moss-Provider-Key`. | BYOK |
| Model id | `provider/model`, such as `moss/fastlane-1` or `anthropic/claude-haiku-5.5`. | Model string |
| Reply cache | A repeated request answered without a model call, free. | Response cache |
| Prefix cache | Prompt tokens `moss/fastlane-1` still holds from an earlier call, billed at the cached price. | Prompt caching |

## In this section

* [Quickstart](https://docs.moss.dev/docs/inference/quickstart.md): key, install, one call, stream it, ground it.
* [Models](https://docs.moss.dev/docs/inference/models.md): the table, routes, the Moss model, refused parameters.
* [Pricing](https://docs.moss.dev/docs/inference/pricing.md): credits, tokens, caching, retrievals.
* [OpenAI compatibility](https://docs.moss.dev/docs/inference/openai-compatibility.md): base URL, endpoints, headers, what differs.
* [Ground answers in your indexes](https://docs.moss.dev/docs/inference/retrieval.md): choose indexes, turn retrieval off, what it costs.
* [Streaming](https://docs.moss.dev/docs/inference/streaming.md): events, chunks, stopping early, errors after the stream starts.
* [Tool calling](https://docs.moss.dev/docs/inference/tool-calling.md): the loop, both shapes, structured output.
* [MCP servers](https://docs.moss.dev/docs/inference/mcp-servers.md): servers Moss runs for the model.
* [Bring your own key](https://docs.moss.dev/docs/inference/bring-your-own-key.md): vendor models on your account.
* [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md): every status and code, limits, retries.
* [SDKs](https://docs.moss.dev/docs/inference/sdks.md): the seven inference clients.
