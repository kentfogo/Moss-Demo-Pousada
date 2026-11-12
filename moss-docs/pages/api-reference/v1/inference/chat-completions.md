<!-- Source: https://docs.moss.dev/docs/api-reference/v1/inference/chat-completions.md -->
# Chat Completions

> Reference for POST /v1/chat/completions: fields, headers, the response, the stream format and an example.

`POST /v1/chat/completions` takes an OpenAI [chat completion request](https://platform.openai.com/docs/api-reference/chat/create), searches the indexes the call names for the user's message, and returns the reply in OpenAI's shape. Any OpenAI client works once you change the base URL and the key.

## Base URL

```text theme={null}
https://inference.moss.dev/v1
```

## Authentication

Send your project id and project key from the [Moss portal](https://portal.usemoss.dev) as one bearer token:

```text theme={null}
Authorization: Bearer <project_id>:<project_key>
```

## Request

The body is an OpenAI chat completion request.

| Field | Required | Notes |
| - | - | - |
| `model` | no | `moss/fastlane-1`, the default. Or a listed vendor model on the Moss key, or any vendor model on your own key. See [Models](https://docs.moss.dev/docs/inference/models.md). |
| `messages` | yes | OpenAI's message list. System messages work. |
| `stream` | no | `true` streams `chat.completion.chunk` events, ending with `data: [DONE]`. See [Streaming](#streaming). |
| `stream_options` | no | `{"include_usage": false}` leaves out the usage chunk. |
| `tools` | no | Function tools, which your code runs, and `mcp` servers and the `moss_search` tool, which Moss runs. Anything but a list of objects returns `400`. |
| `tool_choice` | no | OpenAI's shape. Passed to the model. |
| `parallel_tool_calls` | no | Whether the model can call more than one tool at once. |
| `response_format` | no | Passed to the model, for structured output. |
| `max_tokens` | no | The most tokens the reply can have. On `moss/fastlane-1`, the prompt, the retrieved facts and the reply share 262,144 tokens. |
| `temperature` | no | Passed to the model. |
| Other OpenAI fields | no | Passed to the model. |

On the Moss key, a vendor model refuses some fields with `400` and `code` `unsupported_parameter`. [Models](https://docs.moss.dev/docs/inference/models.md#parameters-refused-on-the-moss-key) lists them.

## Headers

### Request headers

| Header | Default | What it does |
| - | - | - |
| `X-Moss-Indexes` | none | Comma-separated index names to search before the model runs, such as `faq,policies`, at most 32. Without it, Moss does not run this search. A name outside the project returns `403`. |
| `X-Moss-Retrieve` | `on` | `off` skips the search before the model runs, even when indexes are named. It does not turn off [`moss_search`](https://docs.moss.dev/docs/inference/moss-search). |
| `X-Moss-Cache` | `on` | `off` skips the reply cache. |
| `X-Moss-System-Prompt` | `on` | `off` skips the project's [system prompt](#system-prompt). |
| `X-Moss-Provider-Key` | none | Your OpenAI, Anthropic or Google key. The call runs on your key. |
| `X-Request-Id` | none | Your own id for the call. Moss logs it and passes it to a vendor model. |

### Reply headers

| Header | What it carries |
| - | - |
| `X-Moss-Request-Id` | The request's id, on every response, a refused one included. Send it when you report a problem. |
| `X-Moss-Retrieve-Ms` | How long the search before the model took, in milliseconds. It leaves out `moss_search` calls. |
| `x-ratelimit-limit-*`, `x-ratelimit-remaining-*`, `x-ratelimit-reset-*` | What is left of the project's [limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#limits), for `requests` and, on `moss/fastlane-1`, `tokens`. |
| `Retry-After` | On a `429` or `503`, the seconds to wait before you retry. |
| `x-should-retry` | `false` on a request you must not send again. |

## System prompt

A project can have its own system prompt. Set it in the [Moss portal](https://portal.usemoss.dev), on the Prompt tab of the Moss Inference page. Moss uses it when a request has no system message. A request whose first message is a `system` or `developer` message with text uses that message instead, and the project's prompt is not added. An empty one counts as no system message. `X-Moss-System-Prompt: off` turns the project's prompt off for one request. The project's prompt counts toward the request's prompt tokens and its context limit. A change to the prompt takes effect within about a minute.

## Response

Without `stream`, the body is one OpenAI `chat.completion`.

| Field | Meaning |
| - | - |
| `model` | The current id of the model that answered: `moss/fastlane-1` when you sent none or `moss`. |
| `choices` | One choice, with no `logprobs`. |
| `choices[0].message.tool_calls` | The function calls, when `finish_reason` is `tool_calls`. |
| `usage.prompt_tokens` | Includes the retrieved facts. `0` on a reply-cache hit, which is free. |
| `usage.prompt_tokens_details.cached_tokens` | On `moss/fastlane-1`, the prompt tokens the model already held in its prefix cache. They bill at the cached input price. |
| `moss_tool_steps` | The MCP and `moss_search` tool steps that ran, in order. OpenAI clients ignore it. |

## Streaming

With `stream: true`, the reply is a series of server-sent `chat.completion.chunk` events. The last chunk before `data: [DONE]` has empty `choices` and the whole reply's `usage`. No other chunk carries `usage`.

```text theme={null}
data: {"id": "chatcmpl-1", "object": "chat.completion.chunk", "created": 1761177600, "model": "moss/fastlane-1", "choices": [{"index": 0, "delta": {"role": "assistant", "content": "Yes, we ship"}, "finish_reason": null}]}

data: {"id": "chatcmpl-1", "object": "chat.completion.chunk", "created": 1761177600, "model": "moss/fastlane-1", "choices": [{"index": 0, "delta": {"content": " to Canada."}, "finish_reason": "stop"}]}

data: {"id": "chatcmpl-1", "object": "chat.completion.chunk", "created": 1761177600, "model": "moss/fastlane-1", "choices": [], "usage": {"prompt_tokens": 165, "completion_tokens": 7, "total_tokens": 172, "prompt_tokens_details": {"cached_tokens": 128}}}

data: [DONE]
```

Check `choices` before you read `choices[0]`. A failure after the stream starts arrives as a final `data:` frame carrying `error` instead of `choices`, then `data: [DONE]`. [Streaming](https://docs.moss.dev/docs/inference/streaming.md) shows how to read the chunks and stop early.

## Examples

The Python and JavaScript tabs use OpenAI's own clients. The Moss SDKs call [Responses](https://docs.moss.dev/docs/api-reference/v1/inference/responses.md) instead. Each example streams a reply grounded in the `faq` index from the [Quickstart](https://docs.moss.dev/docs/inference/quickstart.md).

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

```python Python theme={null}
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
```

```typescript JavaScript theme={null}
import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://inference.moss.dev/v1',
  apiKey: `${process.env.MOSS_PROJECT_ID}:${process.env.MOSS_PROJECT_KEY}`,
  defaultHeaders: { 'X-Moss-Indexes': 'faq' },
})
const stream = await client.chat.completions.create({
  model: 'moss/fastlane-1',
  messages: [
    { role: 'system', content: 'You are the support agent for Acme.' },
    { role: 'user', content: 'Do you ship to Canada?' },
  ],
  stream: true,
})
for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta.content ?? '')
}
```

## Limits

Each project has per-minute request and token limits, and each request has limits on prompt tokens, indexes and body size. The values for `moss/fastlane-1` and vendor models are in [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#limits).

## Errors

Errors use OpenAI's `{"error": {"message", "type", "code"}}` shape. Every status and code, with what to do about it, is in [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#errors).

## Tool calls

`tools`, `tool_choice` and `parallel_tool_calls` take OpenAI's shapes. Your code runs the `function` tools. Moss runs `moss_search` and `mcp` tools for the model, as the next two sections show. [Tool calling](https://docs.moss.dev/docs/inference/tool-calling.md) shows the loop and the messages to send back for `function` tools.

## Moss search tool

A `tools` entry of type `moss_search` lets the model search your project's indexes. Moss runs each search, and your code does not. [Moss search tool](https://docs.moss.dev/docs/inference/moss-search.md) has the entry's fields.

## MCP servers

A `tools` entry of type `mcp` names a server that Moss runs for the model. [MCP servers](https://docs.moss.dev/docs/inference/mcp-servers.md#add-a-server) has the entry's fields. [Tool steps](https://docs.moss.dev/docs/inference/mcp-servers.md#tool-steps) has the `moss_tool_step` chunks a stream carries.

## MCP errors

**Never replay a request that failed with `failed_after_tool_call`.** The other MCP errors are in [MCP servers](https://docs.moss.dev/docs/inference/mcp-servers.md#errors).
