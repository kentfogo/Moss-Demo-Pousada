<!-- Source: https://docs.moss.dev/docs/inference/openai-compatibility.md -->
# OpenAI compatibility

> Call Moss Inference from any OpenAI client: base URL, key, endpoints, Moss headers and what differs from OpenAI.

Moss Inference speaks OpenAI's API, so any OpenAI client works once you change the base URL and the key. This page covers the endpoints, the Moss headers and what differs from OpenAI.

## Set the base URL and key

```text theme={null}
https://inference.moss.dev/v1
```

The key is your project id and project key from the [Moss portal](https://portal.usemoss.dev), joined by a colon. Send it as a bearer token:

```text theme={null}
Authorization: Bearer <project_id>:<project_key>
```

| Endpoint | What it does |
| - | - |
| [`POST /v1/responses`](https://docs.moss.dev/docs/api-reference/v1/inference/responses) | OpenAI's Responses API. The Moss SDKs call it. |
| [`POST /v1/chat/completions`](https://docs.moss.dev/docs/api-reference/v1/inference/chat-completions) | OpenAI's Chat Completions API. |
| [`GET /v1/models`](https://docs.moss.dev/docs/api-reference/v1/inference/models) | The models served now, in OpenAI's list shape. |

## Point an OpenAI client at Moss

Change the base URL and the key. The `X-Moss-Indexes` header is optional and names the indexes to search. Install OpenAI's client with `pip install openai` or `npm install openai`. The Vercel AI SDK needs `npm install @ai-sdk/openai ai`.

```bash curl theme={null}
curl https://inference.moss.dev/v1/responses \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Moss-Indexes: faq" \
  -d '{
    "model": "moss/fastlane-1",
    "instructions": "You are the support agent for Acme.",
    "input": "Do you ship to Canada?"
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
response = client.responses.create(
    model="moss/fastlane-1",
    instructions="You are the support agent for Acme.",
    input="Do you ship to Canada?",
)
print(response.output_text)
```

```typescript JavaScript theme={null}
import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://inference.moss.dev/v1',
  apiKey: `${process.env.MOSS_PROJECT_ID}:${process.env.MOSS_PROJECT_KEY}`,
  defaultHeaders: { 'X-Moss-Indexes': 'faq' },
})
const response = await client.responses.create({
  model: 'moss/fastlane-1',
  instructions: 'You are the support agent for Acme.',
  input: 'Do you ship to Canada?',
})
console.log(response.output_text)
```

```typescript Vercel AI SDK theme={null}
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const moss = createOpenAI({
  baseURL: 'https://inference.moss.dev/v1',
  apiKey: `${process.env.MOSS_PROJECT_ID}:${process.env.MOSS_PROJECT_KEY}`,
  headers: { 'X-Moss-Indexes': 'faq' },
})
const { text } = await generateText({
  model: moss.chat('moss/fastlane-1'),
  system: 'You are the support agent for Acme.',
  prompt: 'Do you ship to Canada?',
})
console.log(text)
```

The Python and JavaScript tabs use OpenAI's own clients. The Vercel AI SDK tab calls Chat Completions through `.chat()`. For the Moss SDKs, see [SDKs](https://docs.moss.dev/docs/inference/sdks.md).

## Responses or Chat Completions

Both endpoints search the indexes a call names and take the same models, headers and limits.

| Use | Pick |
| - | - |
| New code | Responses |
| A Moss SDK | Responses. The Moss SDKs call it. |
| Existing code on Chat Completions | Chat Completions |
| The Vercel AI SDK | Chat Completions, through `.chat()` |

The same call on Chat Completions:

```bash curl theme={null}
curl https://inference.moss.dev/v1/chat/completions \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Moss-Indexes: faq" \
  -d '{
    "model": "moss/fastlane-1",
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
completion = client.chat.completions.create(
    model="moss/fastlane-1",
    messages=[
        {"role": "system", "content": "You are the support agent for Acme."},
        {"role": "user", "content": "Do you ship to Canada?"},
    ],
)
print(completion.choices[0].message.content)
```

```typescript JavaScript theme={null}
import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://inference.moss.dev/v1',
  apiKey: `${process.env.MOSS_PROJECT_ID}:${process.env.MOSS_PROJECT_KEY}`,
  defaultHeaders: { 'X-Moss-Indexes': 'faq' },
})
const completion = await client.chat.completions.create({
  model: 'moss/fastlane-1',
  messages: [
    { role: 'system', content: 'You are the support agent for Acme.' },
    { role: 'user', content: 'Do you ship to Canada?' },
  ],
})
console.log(completion.choices[0].message.content)
```

## Moss headers

Both endpoints read these request headers. The last column names the matching Moss SDK option.

| Header | Default | What it does | SDK option |
| - | - | - | - |
| `X-Moss-Indexes` | none | Comma-separated index names to search, such as `faq,policies`. Without it, Moss does not search before the model runs. A [`moss_search`](https://docs.moss.dev/docs/inference/moss-search) tool still searches. | `indexes` |
| `X-Moss-Retrieve` | `on` | `off` skips the search before the model runs, even when indexes are named. It does not turn off [`moss_search`](https://docs.moss.dev/docs/inference/moss-search). | `retrieve` |
| `X-Moss-Cache` | `on` | `off` skips the reply cache. | `cache` |
| `X-Moss-System-Prompt` | `on` | `off` skips the project's [system prompt](https://docs.moss.dev/docs/api-reference/v1/inference/chat-completions.md#system-prompt). | none |
| `X-Moss-Provider-Key` | none | Your OpenAI, Anthropic or Google key. The call runs on it. | `api_key`, `apiKey` |
| `X-Request-Id` | none | Your own id for the call. Moss logs it and passes it to a vendor model. | none |

The rules for `X-Moss-Indexes` and `X-Moss-Retrieve` are in [Ground answers in your indexes](https://docs.moss.dev/docs/inference/retrieval.md). Your own key is covered in [Bring your own key](https://docs.moss.dev/docs/inference/bring-your-own-key.md).

Every reply carries these headers:

| Header | What it holds |
| - | - |
| `X-Moss-Request-Id` | The request's id, a refused request included. Send it when you report a problem. |
| `X-Moss-Retrieve-Ms` | How long the search before the model took, in milliseconds. It leaves out `moss_search` calls. |
| `x-ratelimit-limit-*`, `x-ratelimit-remaining-*`, `x-ratelimit-reset-*` | How much of the project's limits is left. |

The `*` is `requests`, and on `moss/fastlane-1` also `tokens`. The limits themselves are in [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#limits).

## What is different from OpenAI

On Responses, Moss differs from OpenAI in these ways:

* Moss stores no responses. `store` is ignored, and `previous_response_id` and `conversation` are refused. Send the whole conversation in `input` on every call. See [Conversations](https://docs.moss.dev/docs/api-reference/v1/inference/responses.md#conversations).
* Tools are `function`, `mcp` and the Moss [`moss_search`](https://docs.moss.dev/docs/inference/moss-search) tool only. OpenAI's built-in tools, such as `web_search`, `file_search`, `code_interpreter`, `image_generation`, computer use and shell, are refused. So are custom tools, and a `tool_choice` that names one.
* Content parts are `input_text`, `output_text`, and `input_image` with an `image_url`. Files (`input_file`), audio (`input_audio`) and images by `file_id` are refused. The `moss/fastlane-1` model reads text only.
* [Input items](https://docs.moss.dev/docs/api-reference/v1/inference/responses.md#input-items) other than those listed, such as `item_reference`, are refused.
* `background: true`, a non-empty `include`, `prompt`, and `truncation: "auto"` are refused.
* `reasoning` takes `effort` only. `text.verbosity` takes `medium` only.
* Any field missing from the [Responses request](https://docs.moss.dev/docs/api-reference/v1/inference/responses.md#request) table is refused, such as `max_tool_calls` or `top_logprobs`.

A refused field returns `400` with `type` `invalid_request_error` and `code` `unsupported_parameter`. The message names the field:

```json 400 - Bad Request theme={null}
{
  "error": {
    "message": "previous_response_id is not supported. Send the whole conversation in input.",
    "type": "invalid_request_error",
    "code": "unsupported_parameter"
  }
}
```

On Chat Completions:

* A reply without `stream` has one choice and no `logprobs`.
* Chat Completions ends a stream with `data: [DONE]`. Responses sends none.
* The last chunk before `data: [DONE]` has empty `choices` and the whole reply's `usage`. See [Streaming](https://docs.moss.dev/docs/inference/streaming.md).

Vendor models on the Moss key also refuse some fields, such as `temperature` on an Anthropic model, with the same `400`. The list per vendor is in [Models](https://docs.moss.dev/docs/inference/models.md#parameters-refused-on-the-moss-key).
