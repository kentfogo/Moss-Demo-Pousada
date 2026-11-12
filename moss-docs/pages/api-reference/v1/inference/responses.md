<!-- Source: https://docs.moss.dev/docs/api-reference/v1/inference/responses.md -->
# Responses

> Reference for POST /v1/responses: fields, input items, events, the response and what is not supported.

`POST /v1/responses` takes an OpenAI [Responses request](https://platform.openai.com/docs/api-reference/responses/create), searches the indexes the call names for the user's message, and returns a [Response object](https://platform.openai.com/docs/api-reference/responses/object) or a stream of events. The Moss SDKs call this endpoint, and so can any OpenAI client with the Responses API.

> [!NOTE]
>
> Send the whole conversation in `input` on every call. Moss stores no responses, so `previous_response_id` and `conversation` return `400`. See [Conversations](#conversations).

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

Only these fields are accepted. A field set to `null` counts as left out. Any other field returns `400`. See [Not supported](#not-supported).

| Field | Default | Notes |
| - | - | - |
| `model` | `moss/fastlane-1` | Or a listed vendor model on the Moss key, or any vendor model on your own key. See [Models](https://docs.moss.dev/docs/inference/models.md). |
| `input` | required | A string, which is one user message, or a list of [input items](#input-items). |
| `instructions` | none | A string, sent as the system message before `input`. It counts as the request's own system message, so the project's [system prompt](https://docs.moss.dev/docs/api-reference/v1/inference/chat-completions.md#system-prompt) is not used. A list returns `400`. |
| `stream` | `false` | `true` streams [events](#streaming). |
| `tools` | none | `function` tools, `mcp` servers and one [`moss_search`](https://docs.moss.dev/docs/inference/moss-search) entry. An `mcp` entry takes `require_approval` only as `never`, and no `connector_id` or `authorization`. |
| `tool_choice` | `auto` | `none`, `auto`, `required`, `{"type": "function", "name": ...}`, or `{"type": "mcp", "server_label": ..., "name": ...}`. For `moss_search`, the server label is `moss`. |
| `parallel_tool_calls` | `true` | Whether the model can call more than one tool at once. |
| `max_output_tokens` | none | The most tokens the reply can have. A reply cut at this limit has `status` `incomplete`. |
| `text` | plain text | `format` of type `text`, `json_object` or `json_schema`. `verbosity` can only be `medium`. |
| `reasoning` | none | `effort` only. A vendor model gets it as sent. `moss/fastlane-1` ignores it. |
| `temperature`, `top_p`, `user` | the model's | Passed to the model. |
| `safety_identifier`, `prompt_cache_key`, `service_tier` | the model's | Passed to a vendor model. `moss/fastlane-1` ignores them. |
| `metadata` | `{}` | Kept on the response. |
| `store`, `stream_options` | none | Ignored. |
| `background`, `truncation`, `include` | `false`, `"disabled"`, `[]` | The only values accepted. |

The request and reply headers are the same as on [Chat Completions](https://docs.moss.dev/docs/api-reference/v1/inference/chat-completions.md#headers). So are the limits, listed in [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#limits). On the Moss key, a vendor model refuses some fields with `400` and `code` `unsupported_parameter`. [Models](https://docs.moss.dev/docs/inference/models.md#parameters-refused-on-the-moss-key) lists them.

## Input items

| `type` | Notes |
| - | - |
| `message` | `role` is `user`, `system`, `developer` or `assistant`. `content` is a string or a list of `input_text` and `output_text` parts, plus `input_image` parts on a user message. `type` can be left out. |
| `function_call` | A call from an earlier response's `output`. Send it back unchanged. |
| `function_call_output` | Your tool's result, as a string or a list of text parts. |
| `mcp_call` | An MCP call or a `moss_search` call from an earlier response's `output`. Send it back unchanged. |
| `mcp_list_tools`, `reasoning` | Skipped. |

The search reads only the text of user messages, never images. An `input_image` part, given by its `image_url`, goes to the model as it is. `moss/fastlane-1` reads text only, so send images to a vendor model that reads them.

## Conversations

Moss keeps no conversation state. Each call sends the conversation so far, in order:

1. the earlier input items,
2. the `output` items of the last response, unchanged,
3. the new items: the next user message, or one `function_call_output` for each function call.

`instructions` belongs to each call, so send it every time. [Tool calling](https://docs.moss.dev/docs/inference/tool-calling.md) shows a full `input`.

## Streaming

The events follow OpenAI's [streaming events](https://platform.openai.com/docs/api-reference/responses-streaming). Moss sends only these types:

* `response.created` and `response.in_progress`
* `response.output_item.added` and `response.output_item.done`
* `response.content_part.added` and `response.content_part.done`
* `response.output_text.delta` and `response.output_text.done`
* `response.function_call_arguments.delta` and `response.function_call_arguments.done`
* `response.mcp_call.in_progress`, `response.mcp_call_arguments.done`, `response.mcp_call.completed` and `response.mcp_call.failed`, for each MCP call and each `moss_search` call

The stream ends with one event that carries the whole response:

| Final event | Sent when |
| - | - |
| `response.completed` | The reply finished. |
| `response.incomplete` | `max_output_tokens` or a content filter cut the reply short. |
| `response.failed` | The call failed after the stream started. `response.error` has `type`, `code` and `message`. `response.output` holds the items so far. |

There is no `data: [DONE]`. [Streaming](https://docs.moss.dev/docs/inference/streaming.md) shows how to read the events and stop early.

## Response

Without `stream`, the body is the response that the final event carries, in OpenAI's [shape](https://platform.openai.com/docs/api-reference/responses/object).

| Field | Meaning |
| - | - |
| `model` | The current id of the model that answered: `moss/fastlane-1` when you sent none or `moss`. |
| `output` | Only `message`, `function_call` and `mcp_call` items. A `moss_search` call is an `mcp_call` item with `server_label` `"moss"` and `name` `"moss_search"`. |
| `status` | `incomplete` for a reply cut short. |
| `incomplete_details.reason` | Why it was cut: `max_output_tokens` or `content_filter`. |
| `store` | Always `false`. |
| `tools` | The tools you sent, without MCP `headers`. |
| `usage.input_tokens` | Includes the retrieved facts. |

## Examples

The Python and JavaScript tabs use OpenAI's own clients. The Moss SDKs, such as [Python](https://docs.moss.dev/docs/inference/sdks/python.md) and [JavaScript](https://docs.moss.dev/docs/inference/sdks/javascript.md), have their own client for this endpoint. [SDKs](https://docs.moss.dev/docs/inference/sdks.md) lists the other platforms. Each example streams a reply grounded in the `faq` index from the [Quickstart](https://docs.moss.dev/docs/inference/quickstart.md).

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

```typescript JavaScript theme={null}
import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://inference.moss.dev/v1',
  apiKey: `${process.env.MOSS_PROJECT_ID}:${process.env.MOSS_PROJECT_KEY}`,
  defaultHeaders: { 'X-Moss-Indexes': 'faq' },
})
const stream = await client.responses.create({
  model: 'moss/fastlane-1',
  instructions: 'You are the support agent for Acme.',
  input: 'Do you ship to Canada?',
  stream: true,
})
for await (const event of stream) {
  if (event.type === 'response.output_text.delta') process.stdout.write(event.delta)
}
```

## Not supported

These return `400` with `type` `invalid_request_error`, `code` `unsupported_parameter`, and a message that names the field:

* `previous_response_id` and `conversation`. Nothing is stored, so send the whole conversation in `input`.
* `background: true`, a non-empty `include`, `prompt`, and `truncation: "auto"`.
* `reasoning` fields other than `effort`, such as `summary`, and `text.verbosity` other than `medium`.
* Tools other than `function`, `mcp` and `moss_search`: OpenAI's built-in tools, such as `web_search`, `file_search`, `code_interpreter`, `image_generation`, computer use and shell, and custom tools. The same goes for a `tool_choice` that names one of them.
* Content parts other than `input_text`, `output_text` and `input_image` with an `image_url`: files (`input_file`), audio (`input_audio`), and images given by `file_id`.
* Input items other than those in [Input items](#input-items), such as `item_reference`.
* Any field not listed under [Request](#request), such as `max_tool_calls` or `top_logprobs`.

```json 400 - Bad Request theme={null}
{
  "error": {
    "message": "previous_response_id is not supported. Send the whole conversation in input.",
    "type": "invalid_request_error",
    "code": "unsupported_parameter"
  }
}
```

Images are not on this list because a vendor model can read them. `moss/fastlane-1` reads text only. [OpenAI compatibility](https://docs.moss.dev/docs/inference/openai-compatibility.md#what-is-different-from-openai) sums up every difference from OpenAI.

## Tool calls

Function tools take OpenAI's flat shape, and your code runs them. [Tool calling](https://docs.moss.dev/docs/inference/tool-calling.md) shows the loop and the `input` to send back.

## MCP servers

A `tools` entry of type `mcp` names a server that Moss runs for the model, and each call comes back as an `mcp_call` output item. [MCP servers](https://docs.moss.dev/docs/inference/mcp-servers.md) has the fields, the events and how to send `mcp_call` items back.

## Moss search tool

A `tools` entry of type `moss_search` lets the model search your project's indexes. Each search comes back as an `mcp_call` output item with `server_label` `moss` and `name` `moss_search`. It streams the same `response.mcp_call.*` events as an MCP call. Send the item back in `input` unchanged, like any `mcp_call`. [Moss search tool](https://docs.moss.dev/docs/inference/moss-search.md) has the fields and the billing.

## Errors

An error before the stream starts uses OpenAI's error shape, with the statuses and codes in [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#errors). **Never replay a request that failed with `failed_after_tool_call`.**
