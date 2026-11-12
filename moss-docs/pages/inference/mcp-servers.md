<!-- Source: https://docs.moss.dev/docs/inference/mcp-servers.md -->
# MCP servers

> Name an MCP server in tools, and Moss runs its tools for the model during the response.

A `tools` entry of type `mcp` names an MCP server. Moss connects to it, offers its tools to the model, and runs each call the model makes. Your code sends no results for these tools.

## Add a server

```json theme={null}
{
  "type": "mcp",
  "server_label": "crm",
  "server_url": "https://mcp.example.com/mcp",
  "headers": {"Authorization": "Bearer CRM_TOKEN"},
  "allowed_tools": ["lookup_order"]
}
```

| Field | Required | Notes |
| - | - | - |
| `type` | yes | `mcp` |
| `server_label` | yes | A name for the server. Different for each server in the request. In a request that has the [Moss search tool](https://docs.moss.dev/docs/inference/moss-search.md), `moss` is kept for that tool and returns `400`. |
| `server_url` | yes | A public `https` URL on port 443. Any other URL returns `400`. |
| `headers` | no | Sent to that server only, such as `Authorization`. They never reach the model. |
| `allowed_tools` | no | Tool names. The model sees only these tools of the server. |
| `transport` | no | `streamable_http`, the default, or `sse` for an older server. |
| `require_approval` | no | Only `never`. Moss never asks for approval. |

A public server, such as `https://mcp.deepwiki.com/mcp`, needs no `headers`. OpenAI's connectors (`connector_id`) and its `authorization` field are not supported, so send a token in `headers`. A response's `tools` field leaves out MCP `headers`.

One request can hold your own [function tools](https://docs.moss.dev/docs/inference/tool-calling.md) and MCP servers together. When the model calls both in one round, only your function calls are returned, and the MCP calls are not run. A request with MCP servers can run for a few minutes.

## Run a request with a server

These examples stream the answer and print each MCP call when it ends. Replace the URL with your server's, and set `CRM_TOKEN` to its token.

```bash curl theme={null}
curl -N https://inference.moss.dev/v1/responses \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "moss/fastlane-1",
    "stream": true,
    "instructions": "You are the support agent for Acme.",
    "input": "Where is order A1?",
    "tools": [{
      "type": "mcp",
      "server_label": "crm",
      "server_url": "https://mcp.example.com/mcp",
      "headers": {"Authorization": "Bearer '"$CRM_TOKEN"'"}
    }]
  }'
```

```python Python theme={null}
import asyncio
import os

from moss import MossInference
from moss.inference import McpCall, McpServer

client = MossInference(os.environ["MOSS_PROJECT_ID"], os.environ["MOSS_PROJECT_KEY"])

crm = McpServer(
    server_label="crm",
    server_url="https://mcp.example.com/mcp",
    headers={"Authorization": f"Bearer {os.environ['CRM_TOKEN']}"},
)


async def main():
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


asyncio.run(main())
```

```typescript JavaScript theme={null}
import { MossInference } from '@moss-js/moss'
import type { McpServer } from '@moss-js/moss'

const client = new MossInference(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

const crm: McpServer = {
  type: 'mcp',
  server_label: 'crm',
  server_url: 'https://mcp.example.com/mcp',
  headers: { Authorization: `Bearer ${process.env.CRM_TOKEN}` },
}
const stream = await client.responses.create({
  instructions: 'You are the support agent for Acme.',
  input: 'Where is order A1?',
  tools: [crm],
  stream: true,
})
for await (const event of stream) {
  if (event.type === 'response.output_item.done' && event.item?.type === 'mcp_call') {
    console.log(event.item.server_label, event.item.name, event.item.output)
  } else if (event.type === 'response.output_text.delta') {
    process.stdout.write(event.delta ?? '')
  }
}
```

Each call is an `mcp_call` item. It arrives in `response.output_item.added` when it starts and in `response.output_item.done` when it ends. The same items are in the response's `output`.

## Tool steps

### Read steps on Responses

Each MCP call streams as these events, in order:

1. `response.output_item.added`
2. `response.mcp_call.in_progress`
3. `response.mcp_call_arguments.done`
4. `response.mcp_call.completed`, or `response.mcp_call.failed`
5. `response.output_item.done`

The finished item holds the call and its result:

```json theme={null}
{
  "id": "call_1",
  "type": "mcp_call",
  "status": "completed",
  "server_label": "crm",
  "name": "lookup_order",
  "arguments": "{\"id\": \"A1\"}",
  "output": "Shipped on Oct 20.",
  "error": null,
  "duration_ms": 41.2
}
```

A failed call has `status` `failed` and `output` null. Its `error` is `{"type": "mcp_tool_execution_error", "content": ...}`.

### Read steps on Chat Completions

A stream carries one extra chunk before each MCP call and one after it. Each has an empty `delta` and a `moss_tool_step`:

```text theme={null}
data: {"object": "chat.completion.chunk", "choices": [{"index": 0, "delta": {}, "finish_reason": null}], "moss_tool_step": {"type": "call", "id": "call_1", "server_label": "crm", "name": "lookup_order", "arguments": "{\"id\": \"A1\"}"}}

data: {"object": "chat.completion.chunk", "choices": [{"index": 0, "delta": {}, "finish_reason": null}], "moss_tool_step": {"type": "result", "id": "call_1", "server_label": "crm", "name": "lookup_order", "is_error": false, "duration_ms": 41.2, "output": "Shipped on Oct 20."}}
```

A `call` step comes before the tool runs and carries its `arguments`. A `result` step comes after, with `is_error`, `duration_ms` and `output`. Both have the same `id`, the `server_label` and the tool's `name`.

A reply without `stream` lists the steps in order in a top-level `moss_tool_steps` array. OpenAI clients ignore both fields.

Chat Completions does not add MCP calls to the message history. Keep what you need from the steps in your own messages.

## Send `mcp_call` items back

On Responses, put the `mcp_call` items back in `input` with the rest of `output`. The model sees their results and does not run the tools again.

An `mcp_call` with neither `output` nor `error` never finished, and its tool may have run. Sending it back returns `400`. Check whether the tool ran, and send the outcome as a message in its place.

## Errors

| Status | `type` | `code` | Cause | What to do |
| - | - | - | - | - |
| `400` | `invalid_request_error` | | A bad `tools` entry, a `server_label` or tool name used twice, or too many servers or tools. | Fix the `tools` list. |
| `400` | `mcp_error` | `mcp_server_error` | `server_url` is not a public `https` URL on port 443. | Use a public `https` URL on port 443. |
| `424` | `mcp_error` | `mcp_server_error` | The server did not connect, refused the credentials, or failed to list its tools. | Check the server and its `headers`. |
| `424` | | `failed_after_tool_call` | A call failed after a tool ran. | Do not replay. Read what ran. |
| `429` | `capacity` | `mcp_loops_busy` | Too many requests with MCP servers or `moss_search` at once. | Retry after `Retry-After`. |

A tool may already have changed data when a call fails after it, so Moss never retries that call:

* Without `stream`, the reply is `424` with `code` `failed_after_tool_call` and the header `x-should-retry: false`. Its body holds the `output` items so far on Responses, or the `moss_tool_steps` that ran on Chat Completions.
* On a Responses stream, `response.failed` has `error.code` `failed_after_tool_call`.
* On a Chat Completions stream, an `error` frame follows the last step.

**Never replay a request that failed with `failed_after_tool_call`.**

Read the items or steps that ran to see what the tool did.

In the SDKs, every MCP failure is an `InferenceError`. It has `status`, `type`, `code` and `retry_after` in Python, and `status`, `type`, `errorCode` and `retryAfter` in JavaScript.

[Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#errors) lists every other error. Its [Limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#limits) section covers the request limits.
