<!-- Source: https://docs.moss.dev/docs/inference/sdks/python.md -->
# Python

> The Python client for Moss Inference: OpenAI's Responses API, answered from your indexes.

`MossInference` is the Python client for [Moss Inference](https://docs.moss.dev/docs/inference/overview.md). Its `responses.create` takes OpenAI's Responses arguments, searches your indexes, and returns OpenAI's field names.

## Install

```bash theme={null}
pip install "moss>=1.22.0"
```

`MossInference` needs `moss` 1.22.0 or later. Earlier versions have `chat.completions.create` instead. See the [changelog](https://docs.moss.dev/docs/changelog.md). For the rest of the SDK setup, see [Install](https://docs.moss.dev/docs/reference/python/api.md#install).

## Create a client

```python theme={null}
import os

from moss import MossInference

client = MossInference(os.environ["MOSS_PROJECT_ID"], os.environ["MOSS_PROJECT_KEY"])
```

Copy the project id and key from the [Moss portal](https://portal.usemoss.dev). Build one client and reuse it for every call. To close its connections, call `await client.close()` or use `async with client:`.

The API is async only. The examples below use this `client` inside an `async` function. With `MOSS_PROJECT_ID` and `MOSS_PROJECT_KEY` set, `from moss import inference` gives you `inference.responses.create` with no client to build.

## Get a response

```python theme={null}
response = await client.responses.create(
    instructions="You are the support agent for Acme.",
    input="Do you ship to Canada?",
)
print(response.output_text)
```

`response.output_text` joins the text of the response's messages. `response.output` holds its items.

`response.request_id` is the response's `X-Moss-Request-Id`. A stream has the same `stream.request_id`. Include it when you report a problem. Both are `None` when the response has none.

Moss stores no response, so `input` holds the whole conversation. Pass a string, or a list of items such as `{"role": "user", "content": "Hi"}` and the `output` items of earlier responses. See [Conversations](https://docs.moss.dev/docs/api-reference/v1/inference/responses.md#conversations).

## Stream a response

```python theme={null}
stream = await client.responses.create(
    instructions="You are the support agent for Acme.",
    input="Do you ship to Canada?",
    stream=True,
)
async with stream:
    async for event in stream:
        if event.type == "response.output_text.delta":
            print(event.delta, end="", flush=True)
```

Each event has OpenAI's `type`, such as `response.output_text.delta`, and the fields of that type. The stream ends after one of two events:

* `response.completed`, whose `event.response` is the whole response.
* `response.incomplete`, when `max_output_tokens` or a content filter cut the response short.

`await stream.get_final_response()` reads the rest of the stream and returns that response.

To stop early, `break` out of the loop. Leaving the `async with stream:` block closes the connection, which stops the model.

[Streaming](https://docs.moss.dev/docs/inference/streaming.md) lists every event.

## Ground it in your indexes

```python theme={null}
response = await client.responses.create(
    instructions="You are the support agent for Acme.",
    input="Do you ship to Canada?",
    indexes=["faq"],
)
```

Moss searches the `faq` index and adds what it finds to the prompt. The [Quickstart](https://docs.moss.dev/docs/inference/quickstart.md) creates that index.

Without `indexes`, Moss does not search before the model runs. You can name at most 32.

`retrieve=False` skips the search on a call that names indexes.

[Ground answers in your indexes](https://docs.moss.dev/docs/inference/retrieval.md) covers the options and the cost.

## Use a vendor model

Name a model from OpenAI, Anthropic or Google in `model`. The search of your indexes works the same for every model. [Models](https://docs.moss.dev/docs/inference/models.md) lists them all.

### On the Moss key

```python theme={null}
response = await client.responses.create(
    model="anthropic/claude-haiku-5.5",
    instructions="You are the support agent for Acme.",
    input="Do you ship to Canada?",
    indexes=["faq"],
)
```

Without your own key, a listed vendor model runs on the Moss key and bills your credits. [Routes](https://docs.moss.dev/docs/inference/models.md#routes) shows who bills each call.

A listed model that is not served right now raises `InferenceError` with `code` `"model_not_enabled"`. Send `moss/fastlane-1` or use your own key.

### With your own key

Pass your OpenAI, Anthropic or Google key to a client as `api_key`:

```python theme={null}
own_client = MossInference(
    os.environ["MOSS_PROJECT_ID"],
    os.environ["MOSS_PROJECT_KEY"],
    api_key=os.environ["OPENAI_API_KEY"],
)
response = await own_client.responses.create(
    model="gpt-6-luna",
    instructions="You are the support agent for Acme.",
    input="Do you ship to Canada?",
    indexes=["faq"],
)
```

The key goes in the `X-Moss-Provider-Key` header, never in the body. To use a key for one call only, pass `api_key` to `responses.create`.

The response's `model` is the name you sent. [Bring your own key](https://docs.moss.dev/docs/inference/bring-your-own-key.md) covers model names and billing.

## Tool calls

Pass OpenAI function tools in `tools`. A function tool is flat, as in OpenAI's Responses API. Each call the model makes comes as a `ResponseFunctionToolCall` item of `output`.

Put the `output` items back into `input` as they are. Add one `function_call_output` item per call, and call again until the response has no calls:

```python theme={null}
import json

from moss.inference import ResponseFunctionToolCall


def lookup_order(order_id):
    return "Shipped on Oct 20."


tools = [{
    "type": "function",
    "name": "lookup_order",
    "parameters": {"type": "object", "properties": {"id": {"type": "string"}}},
}]
items = [{"role": "user", "content": "Where is order A1?"}]
while True:
    response = await client.responses.create(
        instructions="You are the support agent for Acme.",
        input=items,
        tools=tools,
    )
    items += response.output
    calls = [i for i in response.output if isinstance(i, ResponseFunctionToolCall)]
    if not calls:
        print(response.output_text)
        break
    for call in calls:
        output = lookup_order(json.loads(call.arguments)["id"])
        items.append({"type": "function_call_output", "call_id": call.call_id, "output": output})
```

`lookup_order` stands for your own code, and it returns text. Each item goes back as its `raw` JSON. It keeps every field the model sent, such as the thought signature Gemini needs in the next turn.

[Tool calling](https://docs.moss.dev/docs/inference/tool-calling.md) covers `tool_choice`, `parallel_tool_calls` and structured output.

## MCP servers

An `McpServer` in `tools` names an MCP server. Moss Inference runs its tools for the model, so your code sends no `function_call_output` items for them.

```python theme={null}
from moss.inference import McpCall, McpServer

crm = McpServer(
    server_label="crm",
    server_url="https://mcp.example.com/mcp",
    headers={"Authorization": "Bearer your-crm-token"},
)
stream = await client.responses.create(
    instructions="You are the support agent for Acme.",
    input="Where is order A1?",
    tools=[crm],
    stream=True,
)
async with stream:
    async for event in stream:
        if event.type == "response.output_item.done" and isinstance(event.item, McpCall):
            print(event.item.name, event.item.output)
        elif event.type == "response.output_text.delta":
            print(event.delta, end="", flush=True)
```

Each call comes as an `McpCall` item. It arrives in `response.output_item.added` when it starts, and in `response.output_item.done` when it ends. The same items are in the response's `output`.

Send the items back in `input` with the rest of `output`. The model then sees the earlier tool results.

MCP failures raise `InferenceError` with `status`, `type`, `code` and `retry_after`. A call that fails after a tool ran has `code` `"failed_after_tool_call"`. The tool may already have changed data, so Moss Inference does not retry the call. **Never replay a request that failed with `failed_after_tool_call`.**

[MCP servers](https://docs.moss.dev/docs/inference/mcp-servers.md) covers the server fields and every MCP error.

## Errors

A failed call raises `moss.inference.InferenceError`. Once a stream has started, it raises from the `async for` loop. A `response.failed` event raises it too.

| Field | Meaning |
| - | - |
| `status` | The HTTP status of a refused request. |
| `type` | The kind of failure. |
| `message` | What went wrong. Also `str(error)`. |
| `code` | The error code Moss Inference sent, such as `"rate_limit_exceeded"`. |
| `request_id` | The response's `X-Moss-Request-Id`. |
| `retry_after` | Seconds to wait, from a `Retry-After` header. |

A field the failure lacks is `None`.

The SDK sets these types itself, with `status` `None`:

| `type` | Cause |
| - | - |
| `invalid_request_error` | An argument rejected before sending, such as an empty key or an index name that is empty or holds a comma. |
| `connection_error` | Moss Inference unreachable, or the connection broke. |
| `timeout` | A time limit ran out, such as `timeout` or `idle_timeout`. |
| `incomplete_stream` | The stream ended before `response.completed` or `response.incomplete`. |
| `server_error` | A stream event over 1 MiB, or one that is not a JSON object. |

Every other error carries what Moss Inference sent. [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#errors) lists every code. For a `429`, see [Limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#limits).

## Options

`MossInference(project_id, project_key, ...)`:

| Option | Default | Notes |
| - | - | - |
| `project_id`, `project_key` | required | Your project id and key. |
| `api_key` | none | Your OpenAI, Anthropic or Google key, for a vendor `model`. Sent as `X-Moss-Provider-Key`, never in the body. An empty key raises `InferenceError`. |
| `timeout` | none | Seconds for a whole call, stream included. 0 or less turns it off. |
| `idle_timeout` | `120` | Seconds to wait for the response to start, and for each pause in it. 0 or less turns it off. `None` keeps 120. |
| `max_retries` | `2` | Retries before the response starts. `0` turns them off. |
| `default_headers` | none | Headers sent with every call. |

`responses.create(...)` takes keyword arguments only:

| Option | Default | Notes |
| - | - | - |
| `model` | `"moss"` | `moss` is an alias of `moss/fastlane-1`. Or a listed vendor model on the Moss key, or any vendor model with your `api_key`. |
| `input` | required | A string, or a list of OpenAI input item dicts and earlier `output` items. |
| `instructions` | none | The system message, before `input`. |
| `stream` | `False` | `True` returns a `ResponseStream` of `ResponseStreamEvent`. Otherwise one `Response`. |
| `tools`, `tool_choice`, `parallel_tool_calls` | none | Flat function tools and `McpServer`s, and how the model may call them. |
| `max_output_tokens` | none | The most tokens the response may have. |
| `indexes` | none | Index names to search, at most 32. Without it, Moss does not search before the model runs. |
| `retrieve` | `True` | `False` skips the search even when indexes are named. |
| `cache` | `True` | `True` can answer an identical request from the reply cache. `False` always asks the model. |
| `api_key` | the client's | Your vendor key for this call. |
| `timeout`, `idle_timeout` | the client's | This call's limits. 0 or less turns one off. `None` keeps the client's. |
| `max_retries` | the client's | This call's retries. |
| `extra_headers` | none | Headers for this call, over `default_headers`. |
| `extra_body` | none | Extra body fields. |
| Other OpenAI arguments | none | `temperature`, `text` for structured output, `reasoning` and the rest. |
