<!-- Source: https://docs.moss.dev/docs/inference/sdks/javascript.md -->
# JavaScript

> The JavaScript client for Moss Inference: OpenAI's Responses API, answered from your indexes.

`MossInference` is the JavaScript client for [Moss Inference](https://docs.moss.dev/docs/inference/overview.md). Its `responses.create` takes OpenAI's Responses arguments plus `indexes`, searches those indexes, and returns OpenAI's shapes.

## Install

```bash theme={null}
npm install @moss-js/moss@^1.22.0
```

`MossInference` needs `@moss-js/moss` 1.22.0 or later. Earlier versions have `chat.completions.create` instead. See the [changelog](https://docs.moss.dev/docs/changelog.md). For the rest of the SDK setup, see [Install](https://docs.moss.dev/docs/reference/js/api.md#install).

## Create a client

```typescript theme={null}
import { MossInference } from '@moss-js/moss'

const client = new MossInference(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
```

Copy the project id and key from the [Moss portal](https://portal.usemoss.dev). Build one client and reuse it for every call. It has nothing to close. The examples below use this `client`.

With `MOSS_PROJECT_ID` and `MOSS_PROJECT_KEY` set, `import { inference } from '@moss-js/moss'` gives you `inference.responses.create` with no client to build.

## Get a response

```typescript theme={null}
const response = await client.responses.create({
  instructions: 'You are the support agent for Acme.',
  input: 'Do you ship to Canada?',
})
console.log(response.output_text)
```

`response.output_text` joins the text of the response's messages. `response.output` holds its items.

`response.requestId` is the response's `X-Moss-Request-Id`. A stream has the same `stream.requestId`. Include it when you report a problem. Both are `undefined` when the response has none.

Moss stores no response, so `input` holds the whole conversation. Pass a string, or a list of items such as `{ role: 'user', content: 'Hi' }` and the `output` items of earlier responses. See [Conversations](https://docs.moss.dev/docs/api-reference/v1/inference/responses.md#conversations).

## Stream a response

```typescript theme={null}
const stream = await client.responses.create({
  instructions: 'You are the support agent for Acme.',
  input: 'Do you ship to Canada?',
  stream: true,
})
for await (const event of stream) {
  if (event.type === 'response.output_text.delta') process.stdout.write(event.delta ?? '')
}
```

Each event is the JSON Moss Inference sent, with OpenAI's `type`, such as `response.output_text.delta`. The stream ends after one of two events:

* `response.completed`, whose `event.response` is the whole response.
* `response.incomplete`, when `max_output_tokens` or a content filter cut the response short.

`await stream.finalResponse()` reads the rest of the stream and returns that response.

To stop early, leave the loop or call `stream.controller.abort()`. Either one closes the connection, which stops the model, and neither throws.

[Streaming](https://docs.moss.dev/docs/inference/streaming.md) lists every event.

## Ground it in your indexes

```typescript theme={null}
const response = await client.responses.create({
  instructions: 'You are the support agent for Acme.',
  input: 'Do you ship to Canada?',
  indexes: ['faq'],
})
```

Moss searches the `faq` index and adds what it finds to the prompt. The [Quickstart](https://docs.moss.dev/docs/inference/quickstart.md) creates that index.

Without `indexes`, Moss does not search before the model runs. You can name at most 32.

`retrieve: false` skips the search on a call that names indexes.

[Ground answers in your indexes](https://docs.moss.dev/docs/inference/retrieval.md) covers the options and the cost.

## Use a vendor model

Name a model from OpenAI, Anthropic or Google in `model`. The search of your indexes works the same for every model. [Models](https://docs.moss.dev/docs/inference/models.md) lists them all.

### On the Moss key

```typescript theme={null}
const response = await client.responses.create({
  model: 'anthropic/claude-haiku-5.5',
  instructions: 'You are the support agent for Acme.',
  input: 'Do you ship to Canada?',
  indexes: ['faq'],
})
```

Without your own key, a listed vendor model runs on the Moss key and bills your credits. [Routes](https://docs.moss.dev/docs/inference/models.md#routes) shows who bills each call.

A listed model that is not served right now throws `InferenceError` with `errorCode` `'model_not_enabled'`. Send `moss/fastlane-1` or use your own key.

### With your own key

Pass your OpenAI, Anthropic or Google key to a client as `apiKey`:

```typescript theme={null}
const ownClient = new MossInference(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!, {
  apiKey: process.env.OPENAI_API_KEY,
})
const response = await ownClient.responses.create({
  model: 'gpt-6-luna',
  instructions: 'You are the support agent for Acme.',
  input: 'Do you ship to Canada?',
  indexes: ['faq'],
})
```

The key goes in the `X-Moss-Provider-Key` header, never in the body. To use a key for one call only, pass `{ apiKey }` as the second argument of `responses.create`.

The response's `model` is the name you sent. [Bring your own key](https://docs.moss.dev/docs/inference/bring-your-own-key.md) covers model names and billing.

## Tool calls

`tools`, `tool_choice` and `parallel_tool_calls` take OpenAI's Responses shapes, so a function tool is flat. Each call the model makes comes as a `function_call` item of `output`.

Push the `output` items onto `input` unchanged. Add one `function_call_output` item per call, and call again until the response has no calls:

```typescript theme={null}
import type { FunctionTool, ResponseInputItem } from '@moss-js/moss'

const lookupOrder = (id: string) => 'Shipped on Oct 20.'

const tools: FunctionTool[] = [
  {
    type: 'function',
    name: 'lookup_order',
    description: 'Look up an order by its id.',
    parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
]
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
    input.push({ type: 'function_call_output', call_id: call.call_id, output: lookupOrder(id) })
  }
}
```

`lookupOrder` stands for your own code. Push the items unchanged to keep every field the model sent. Gemini, for one, needs its thought signature in the next turn.

`finalResponse()` also works without the `for await` loop. Without `stream: true`, `create` returns the response directly.

[Tool calling](https://docs.moss.dev/docs/inference/tool-calling.md) covers `tool_choice`, `parallel_tool_calls` and structured output.

## MCP servers

An `McpServer` entry in `tools` names an MCP server. Moss Inference calls its tools for the model during the response, so your code sends no `function_call_output` items for them.

```typescript theme={null}
import type { McpServer } from '@moss-js/moss'

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

Each call comes as an `mcp_call` item. It arrives in `response.output_item.added` when it starts, and in `response.output_item.done` when it ends. The same items are in the response's `output`.

Send the items back in `input` with the rest of `output`. The model then sees the earlier tool results.

MCP failures throw `InferenceError` with `status`, `type`, `errorCode` and `retryAfter`. A call that fails after a tool ran has `errorCode` `'failed_after_tool_call'`. The tool may already have changed data, so Moss Inference does not retry the call. **Never replay a request that failed with `failed_after_tool_call`.**

[MCP servers](https://docs.moss.dev/docs/inference/mcp-servers.md) covers the server fields and every MCP error.

## Errors

Every failure other than an abort throws `InferenceError`. Once a stream has started, it throws from the `for await` loop. A `response.failed` event throws it too.

| Field | Meaning |
| - | - |
| `status` | The HTTP status of a refused request. |
| `type` | The kind of failure. |
| `message` | What went wrong. |
| `errorCode` | The error code Moss Inference sent, such as `"rate_limit_exceeded"`. |
| `requestId` | The response's `X-Moss-Request-Id`. |
| `retryAfter` | Milliseconds to wait, from a `Retry-After` header. |

A field the failure lacks is `undefined`. The error also has a Moss `code`, so [`isMossError`](https://docs.moss.dev/docs/reference/js/functions/isMossError) accepts it.

The SDK sets these types itself, with `status` `undefined`:

| `type` | Cause |
| - | - |
| `invalid_request_error` | An argument rejected before sending, such as an empty key, an index name that is empty or holds a comma, or an unset `MOSS_PROJECT_ID` for `inference`. |
| `connection_error` | Moss Inference unreachable, or the connection broke. |
| `timeout` | A time limit ran out, such as `timeout` or `idleTimeout`. |
| `incomplete_stream` | The stream ended before `response.completed` or `response.incomplete`. |
| `server_error` | A stream event over 1 MiB, or one that is not a JSON object. |

Every other error carries what Moss Inference sent. [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#errors) lists every code. For a `429`, see [Limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#limits).

## Options

`new MossInference(projectId, projectKey, options?)`:

| Option | Default | Notes |
| - | - | - |
| `apiKey` | none | Your OpenAI, Anthropic or Google key, for a vendor `model`. Sent as `X-Moss-Provider-Key`, never in the body. An empty key throws `InferenceError`. |
| `timeout` | none | Milliseconds for a whole call, stream included. `null` turns it off. |
| `idleTimeout` | `120_000` | Milliseconds to wait for the response to start, and for each pause in it. `null` turns it off. |
| `maxRetries` | `2` | Retries before the response starts. `0` turns them off. |
| `headers` | none | Headers sent with every call. |

`responses.create(params, options?)` takes OpenAI's fields and the Moss fields in `params`. Settings for this call only go in `options`:

| Option | Default | Notes |
| - | - | - |
| `model` | `"moss"` | `moss` is an alias of `moss/fastlane-1`. Or a listed vendor model on the Moss key, or any vendor model with your `apiKey`. |
| `input` | required | A string, or a list of messages, `function_call_output` items and earlier `output` items. |
| `instructions` | none | The system message, before `input`. |
| `stream` | `false` | `true` resolves to a `ResponseStream` of events. Otherwise to one `Response`. |
| `tools`, `tool_choice`, `parallel_tool_calls` | none | Flat function tools and `McpServer` entries, and how the model may call them. |
| `max_output_tokens` | none | The most tokens the response may have. |
| `indexes` | none | Index names to search, at most 32. Without it, Moss does not search before the model runs. |
| `cache` | `true` | `true` can answer an identical request from the reply cache. `false` always asks the model. |
| `retrieve` | `true` | `false` skips the search even when indexes are named. |
| Other OpenAI fields | none | `temperature`, `text` for structured output, `reasoning` and the rest. An `apiKey` or `api_key` field throws. |
| `options.apiKey` | the client's | Your vendor key for this call. |
| `options.timeout`, `options.idleTimeout` | the client's | This call's limits. `null` turns one off. |
| `options.maxRetries` | the client's | This call's retries. |
| `options.headers` | none | Headers for this call. They add to the client's, or replace them by name. |
| `options.signal` | none | An `AbortSignal` that cancels the call. |
