<!-- Source: https://docs.moss.dev/docs/inference/streaming.md -->
# Streaming

> Stream replies as Responses events or Chat Completions chunks, stop early, and catch errors after the stream starts.

Set `stream` to `true` and the reply arrives as server-sent events while the model writes it. This page covers the events of each API, stopping early, errors after the stream starts and where usage arrives.

## Stream a response

Responses streams typed events. The text arrives in `response.output_text.delta` events.

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
    stream = await client.responses.create(
        instructions="You are the support agent for Acme.",
        input="Do you ship to Canada?",
        indexes=["faq"],
        stream=True,
    )
    async with stream:
        async for event in stream:
            if event.type == "response.output_text.delta":
                print(event.delta, end="", flush=True)


asyncio.run(main())
```

```typescript JavaScript theme={null}
import { MossInference } from '@moss-js/moss'

const client = new MossInference(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
const stream = await client.responses.create({
  instructions: 'You are the support agent for Acme.',
  input: 'Do you ship to Canada?',
  indexes: ['faq'],
  stream: true,
})
for await (const event of stream) {
  if (event.type === 'response.output_text.delta') process.stdout.write(event.delta ?? '')
}
```

```python OpenAI client theme={null}
import os

from openai import OpenAI

client = OpenAI(
    base_url="https://inference.moss.dev/v1",
    api_key=f"{os.environ['MOSS_PROJECT_ID']}:{os.environ['MOSS_PROJECT_KEY']}",
    default_headers={"X-Moss-Indexes": "faq"},
)
stream = client.responses.create(
    model="moss/fastlane-1",
    instructions="You are the support agent for Acme.",
    input="Do you ship to Canada?",
    stream=True,
)
for event in stream:
    if event.type == "response.output_text.delta":
        print(event.delta, end="", flush=True)
```

Moss sends only these event types, in OpenAI's [streaming event](https://platform.openai.com/docs/api-reference/responses-streaming) shapes:

| Part | Events |
| - | - |
| Start | `response.created`, `response.in_progress` |
| Output items | `response.output_item.added`, `response.output_item.done` |
| Content parts | `response.content_part.added`, `response.content_part.done` |
| Text | `response.output_text.delta`, `response.output_text.done` |
| Function calls | `response.function_call_arguments.delta`, `response.function_call_arguments.done` |
| MCP and `moss_search` calls | The `mcp_call` events in [MCP servers](https://docs.moss.dev/docs/inference/mcp-servers.md) |

The stream ends with one event that carries the whole response:

* `response.completed`: the reply is done.
* `response.incomplete`: `max_output_tokens` or a content filter cut the reply short.
* `response.failed`: the call failed. See [Errors after the stream starts](#errors-after-the-stream-starts).

Responses sends no `data: [DONE]`. In the SDKs, `await stream.get_final_response()` in Python and `await stream.finalResponse()` in JavaScript read the rest and return that response.

## Stream Chat Completions

Chat Completions streams `chat.completion.chunk` objects and ends with `data: [DONE]`. The text arrives in `choices[0].delta.content`.

```bash curl theme={null}
curl -N https://inference.moss.dev/v1/chat/completions \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Moss-Indexes: faq" \
  -d '{
    "model": "moss/fastlane-1",
    "stream": true,
    "messages": [
      { "role": "system", "content": "You are the support agent for Acme." },
      { "role": "user", "content": "Do you ship to Canada?" }
    ]
  }'
```

```python OpenAI client theme={null}
import os

from openai import OpenAI

client = OpenAI(
    base_url="https://inference.moss.dev/v1",
    api_key=f"{os.environ['MOSS_PROJECT_ID']}:{os.environ['MOSS_PROJECT_KEY']}",
    default_headers={"X-Moss-Indexes": "faq"},
)
stream = client.chat.completions.create(
    model="moss/fastlane-1",
    messages=[
        {"role": "system", "content": "You are the support agent for Acme."},
        {"role": "user", "content": "Do you ship to Canada?"},
    ],
    stream=True,
)
for chunk in stream:
    if chunk.choices:
        print(chunk.choices[0].delta.content or "", end="", flush=True)
    elif chunk.usage:
        print(f"\n{chunk.usage.total_tokens} tokens")
```

On the wire, the stream looks like this:

```text theme={null}
data: {"id": "chatcmpl-1", "object": "chat.completion.chunk", "created": 1761177600, "model": "moss/fastlane-1", "choices": [{"index": 0, "delta": {"role": "assistant", "content": "Yes, we ship"}, "finish_reason": null}]}

data: {"id": "chatcmpl-1", "object": "chat.completion.chunk", "created": 1761177600, "model": "moss/fastlane-1", "choices": [{"index": 0, "delta": {"content": " to Canada."}, "finish_reason": "stop"}]}

data: {"id": "chatcmpl-1", "object": "chat.completion.chunk", "created": 1761177600, "model": "moss/fastlane-1", "choices": [], "usage": {"prompt_tokens": 165, "completion_tokens": 7, "total_tokens": 172, "prompt_tokens_details": {"cached_tokens": 128}}}

data: [DONE]
```

The last chunk before `data: [DONE]` has empty `choices` and the whole reply's `usage`. Check `choices` before you read `choices[0]`.

## Stop early

In the Moss SDKs, leave the loop to stop. That closes the connection, which stops the model. This example stops after the first sentence:

```python Python theme={null}
import asyncio
import os

from moss import MossInference

client = MossInference(os.environ["MOSS_PROJECT_ID"], os.environ["MOSS_PROJECT_KEY"])


async def main():
    stream = await client.responses.create(
        instructions="You are the support agent for Acme.",
        input="Do you ship to Canada?",
        indexes=["faq"],
        stream=True,
    )
    text = ""
    async with stream:
        async for event in stream:
            if event.type == "response.output_text.delta":
                text += event.delta
                if "." in text:
                    break
    print(text)


asyncio.run(main())
```

```typescript JavaScript theme={null}
import { MossInference } from '@moss-js/moss'

const client = new MossInference(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
const stream = await client.responses.create({
  instructions: 'You are the support agent for Acme.',
  input: 'Do you ship to Canada?',
  indexes: ['faq'],
  stream: true,
})
let text = ''
for await (const event of stream) {
  if (event.type === 'response.output_text.delta') text += event.delta ?? ''
  if (text.includes('.')) break
}
console.log(text)
```

In Python, `break` leaves the `async with stream:` block, which closes the connection. JavaScript can also stop with `stream.controller.abort()`. In JavaScript, neither way throws.

## Errors after the stream starts

Once the first event is sent, the status is already `200`. A failure after that arrives in the body:

* Responses ends the stream with `response.failed`. Its `response.error` has `type`, `code` and `message`. Its `response.output` holds the items so far.
* Chat Completions sends a final `data:` frame that carries `error` instead of `choices`, then `data: [DONE]`.

**Check the body of every stream for `error`: the status is already 200.**

The Moss SDKs check for you. They raise their [inference error](https://docs.moss.dev/docs/inference/errors-and-limits.md#sdk-errors) from the loop, and a `response.failed` event raises it too. A stream that ends before its last event raises it with `type` `incomplete_stream`. The SDKs retry only before the response starts, so a failure mid-stream is not retried.

If the stream fails after an MCP call or a `moss_search` call ran, `error.code` is `failed_after_tool_call`. Do not replay that request: the tool may already have changed data. See [MCP servers](https://docs.moss.dev/docs/inference/mcp-servers.md). Every code is in [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#errors).

## Read usage on a stream

| API | Usage arrives in | To leave it out |
| - | - | - |
| Responses | The final event's `response.usage` | `stream_options` is ignored. |
| Chat Completions | The last chunk before `data: [DONE]`, with empty `choices` | `"stream_options": {"include_usage": false}` |

Both counts include the retrieved facts. On `moss/fastlane-1`, the Chat Completions field `usage.prompt_tokens_details.cached_tokens` is the part of the prompt held in the prefix cache. See [Pricing](https://docs.moss.dev/docs/inference/pricing.md#prompt-caching).
