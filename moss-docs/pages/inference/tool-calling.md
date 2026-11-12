<!-- Source: https://docs.moss.dev/docs/inference/tool-calling.md -->
# Tool calling

> Give the model function tools, run each call in your code, and send the results back.

The model asks for a tool, your code runs it, and you send the result back. This page shows that loop on Responses and on Chat Completions, then structured output. To have Moss run the tools for you, use [MCP servers](https://docs.moss.dev/docs/inference/mcp-servers.md). To let the model search your indexes, use the [Moss search tool](https://docs.moss.dev/docs/inference/moss-search.md).

## The loop

Moss stores nothing between calls. Each round sends the whole conversation, and you repeat it until the reply has no tool calls.

**1. Send your tools**

Put function tools in `tools`. On Responses a function tool is flat: `name`, `description` and `parameters` sit next to `type`.

```bash theme={null}
curl https://inference.moss.dev/v1/responses \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "moss/fastlane-1",
    "instructions": "You are the support agent for Acme.",
    "input": "Where is order A1?",
    "tools": [{
      "type": "function",
      "name": "lookup_order",
      "description": "Look up an order by its id.",
      "parameters": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}
    }]
  }'
```

**2. Run each call**

The reply's `output` holds one `function_call` item per call, with a `call_id`, the tool's `name` and its `arguments`. `arguments` is a JSON string, such as `{"id": "A1"}`. Parse it and run the tool in your code.

**3. Send the results back**

Call again with the conversation so far. In order, send the earlier input, the `output` items, and one `function_call_output` per call with the same `call_id`. Send `instructions` again too.

```bash theme={null}
curl https://inference.moss.dev/v1/responses \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "moss/fastlane-1",
    "instructions": "You are the support agent for Acme.",
    "input": [
      {"role": "user", "content": "Where is order A1?"},
      {"id": "fc_8fd7_0", "type": "function_call", "status": "completed", "call_id": "call_1",
       "name": "lookup_order", "arguments": "{\"id\": \"A1\"}"},
      {"type": "function_call_output", "call_id": "call_1", "output": "Shipped on Oct 20."}
    ],
    "tools": [{
      "type": "function",
      "name": "lookup_order",
      "description": "Look up an order by its id.",
      "parameters": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}
    }]
  }'
```

The reply is the answer, or more calls. Repeat until `output` has no `function_call` items.

**Send `tools` on every request.** Moss keeps no state, so the model sees only the tools in the request it is answering.

**Send `output` items back unchanged.** A `function_call` item can carry fields beyond OpenAI's, such as Gemini's `extra_content` and its thought signature. The model needs them on the next turn.

## Write the loop with an SDK

Each loop runs until the reply has no calls. `lookup_order` stands for your own code, and it returns text.

```python Python theme={null}
import asyncio
import json
import os

from moss import MossInference
from moss.inference import ResponseFunctionToolCall

client = MossInference(os.environ["MOSS_PROJECT_ID"], os.environ["MOSS_PROJECT_KEY"])

tools = [{
    "type": "function",
    "name": "lookup_order",
    "description": "Look up an order by its id.",
    "parameters": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]},
}]


def lookup_order(id):
    return "Shipped on Oct 20."


async def main():
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
            output = lookup_order(**json.loads(call.arguments))
            items.append({"type": "function_call_output", "call_id": call.call_id, "output": output})


asyncio.run(main())
```

```typescript JavaScript theme={null}
import { MossInference } from '@moss-js/moss'
import type { FunctionTool, ResponseInputItem } from '@moss-js/moss'

const client = new MossInference(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

const tools: FunctionTool[] = [
  {
    type: 'function',
    name: 'lookup_order',
    description: 'Look up an order by its id.',
    parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
]

async function lookupOrder(id: string): Promise<string> {
  return 'Shipped on Oct 20.'
}

const input: ResponseInputItem[] = [{ role: 'user', content: 'Where is order A1?' }]

for (;;) {
  const stream = await client.responses.create({
    instructions: 'You are the support agent for Acme.',
    input,
    tools,
    stream: true,
  })
  for await (const event of stream) {
    if (event.type === 'response.output_text.delta') process.stdout.write(event.delta ?? '')
  }
  const { output } = await stream.finalResponse()
  input.push(...output)
  const calls = output.filter((item) => item.type === 'function_call')
  if (calls.length === 0) break
  for (const call of calls) {
    const { id } = JSON.parse(call.arguments)
    input.push({ type: 'function_call_output', call_id: call.call_id, output: await lookupOrder(id) })
  }
}
```

In Python, each call is a `ResponseFunctionToolCall` and goes back as its `raw` JSON, with every field the model sent. In JavaScript, the loop streams each round and reads the items from `stream.finalResponse()`. Without `stream: true`, `create` returns the response directly.

## Call tools on Chat Completions

Chat Completions takes OpenAI's Chat shape, where a tool nests `name` and `parameters` under `function`. A reply without `stream` has the calls in `choices[0].message.tool_calls`, with `finish_reason` `tool_calls`.

Send the assistant message back unchanged, then one `tool` message per call, and call again:

```json theme={null}
{
  "model": "moss/fastlane-1",
  "messages": [
    {"role": "system", "content": "You are the support agent for Acme."},
    {"role": "user", "content": "Where is order A1?"},
    {
      "role": "assistant",
      "content": null,
      "tool_calls": [{"id": "call_1", "type": "function",
                      "function": {"name": "lookup_order", "arguments": "{\"id\": \"A1\"}"}}]
    },
    {"role": "tool", "tool_call_id": "call_1", "content": "Shipped on Oct 20."}
  ],
  "tools": [{
    "type": "function",
    "function": {
      "name": "lookup_order",
      "description": "Look up an order by its id.",
      "parameters": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}
    }
  }]
}
```

The same two rules apply. Send `tools` every time, and keep every field of `tool_calls`, such as Gemini's `extra_content`. A `tools` value that is not a list of objects returns `400`.

## Choose how the model calls tools

`tool_choice` sets whether the model must call a tool. On Responses it takes these values:

| Value | The model |
| - | - |
| `auto` | Decides for itself. The default. |
| `none` | Answers without a tool. |
| `required` | Calls at least one tool. |
| `{"type": "function", "name": "lookup_order"}` | Calls that function. |
| `{"type": "mcp", "server_label": "crm", "name": "lookup_order"}` | Calls that tool of an [MCP server](https://docs.moss.dev/docs/inference/mcp-servers.md). |

On Chat Completions, `tool_choice` takes OpenAI's Chat values. A named function there is `{"type": "function", "function": {"name": "lookup_order"}}`.

On the Moss key, `anthropic/claude-sonnet-5.5`, `anthropic/claude-opus-5.5` and `anthropic/claude-fable-5.1` take only `auto` and `none`. A `tool_choice` of `required` or a named tool returns `400 unsupported_parameter`.

`parallel_tool_calls` is `true` by default, so the model can call more than one tool at once. Set it to `false` to allow one call at a time.

## Structured output

To get JSON that matches a schema, set `text.format` to type `json_schema` on Responses. Type `json_object` asks for any JSON object, and type `text` is plain text. Anthropic models on the Moss key refuse `json_object` with `400 unsupported_parameter`; send `json_schema` instead.

```bash curl theme={null}
curl https://inference.moss.dev/v1/responses \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Moss-Indexes: faq" \
  -d '{
    "model": "moss/fastlane-1",
    "instructions": "You are the support agent for Acme.",
    "input": "Do you ship to Canada?",
    "text": {"format": {"type": "json_schema", "name": "shipping_answer", "schema": {
      "type": "object",
      "properties": {"ships": {"type": "boolean"}, "answer": {"type": "string"}},
      "required": ["ships", "answer"],
      "additionalProperties": false
    }}}
  }'
```

```python Python theme={null}
import asyncio
import json
import os

from moss import MossInference

client = MossInference(os.environ["MOSS_PROJECT_ID"], os.environ["MOSS_PROJECT_KEY"])

schema = {
    "type": "object",
    "properties": {"ships": {"type": "boolean"}, "answer": {"type": "string"}},
    "required": ["ships", "answer"],
    "additionalProperties": False,
}


async def main():
    response = await client.responses.create(
        instructions="You are the support agent for Acme.",
        input="Do you ship to Canada?",
        indexes=["faq"],
        text={"format": {"type": "json_schema", "name": "shipping_answer", "schema": schema}},
    )
    print(json.loads(response.output_text))


asyncio.run(main())
```

```typescript JavaScript theme={null}
import { MossInference } from '@moss-js/moss'

const client = new MossInference(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
const schema = {
  type: 'object',
  properties: { ships: { type: 'boolean' }, answer: { type: 'string' } },
  required: ['ships', 'answer'],
  additionalProperties: false,
}
const response = await client.responses.create({
  instructions: 'You are the support agent for Acme.',
  input: 'Do you ship to Canada?',
  indexes: ['faq'],
  text: { format: { type: 'json_schema', name: 'shipping_answer', schema } },
})
console.log(JSON.parse(response.output_text))
```

`output_text` is then the JSON object as a string. On Chat Completions, send the schema in `response_format` instead, in OpenAI's shape: `{"type": "json_schema", "json_schema": {"name": "shipping_answer", "schema": ...}}`.

## Stream tool calls

On a Responses stream, each call starts with `response.output_item.added`. Its arguments arrive in pieces in `response.function_call_arguments.delta` events, then whole in `response.function_call_arguments.done`. `response.output_item.done` carries the finished `function_call` item.

On a Chat Completions stream, each call arrives in pieces in `delta.tool_calls`, with `index`, `id`, `function.name` and `function.arguments`. Join the pieces by `index`. A chunk with `finish_reason` `tool_calls` ends the round.

[Streaming](https://docs.moss.dev/docs/inference/streaming.md) lists every event and chunk.
