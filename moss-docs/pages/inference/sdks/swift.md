<!-- Source: https://docs.moss.dev/docs/inference/sdks/swift.md -->
# Swift

> The Swift client for Moss Inference: OpenAI's Responses API, answered from your indexes.

`MossInference` is the Swift client for [Moss Inference](https://docs.moss.dev/docs/inference/overview.md). It searches your indexes in the cloud and answers in the shape of OpenAI's Responses API. `responses.create` returns the whole response, and `createStreaming` streams its events.

## Install

```swift theme={null}
dependencies: [
  .package(url: "https://github.com/usemoss/moss", from: "0.15.0"),
],
targets: [
  .target(name: "YourTarget", dependencies: [
    .product(name: "Moss", package: "moss"),
  ]),
]
```

`MossInference` needs the `Moss` Swift package 0.13.0 or later. For Xcode and the rest of the SDK setup, see [Install](https://docs.moss.dev/docs/reference/swift/api.md#install).

## Create a client

```swift theme={null}
import Foundation
import Moss

let client = try MossInference(
  projectId: ProcessInfo.processInfo.environment["MOSS_PROJECT_ID"]!,
  projectKey: ProcessInfo.processInfo.environment["MOSS_PROJECT_KEY"]!
)
```

Copy the project id and key from the [Moss portal](https://portal.usemoss.dev). Build one client and reuse it for every call. The initializer throws [`InferenceError`](#errors) for an argument it refuses.

The examples below use this `client`. Every call is `async` and throws, so each one takes `try await`.

## Get a response

```swift theme={null}
let response = try await client.responses.create(
  input: "Do you ship to Canada?",
  instructions: "You are the support agent for Acme."
)
print(response.outputText)
```

`response.outputText` joins the text of the response's messages. `response.output` holds its `OutputItem`s: `.message`, `.functionCall`, `.mcpCall`, or `.other` for any other type. Each one has its JSON in `raw`.

`response.requestId` is the response's `X-Moss-Request-Id`. A stream has the same `stream.requestId`. Include it when you report a problem. Both are `nil` when the response has none.

Moss stores no response, so `input` holds the whole conversation. Pass a string, or an array of `InputItem`s:

* `.system`, `.developer`, `.user` and `.assistant` take the text of a message, such as `.user("Hi")`.
* `.functionCallOutput(callId:output:)` takes a tool's result.
* `InputItem(item)` sends back an `output` item of an earlier response.
* `.raw` takes any other item as a JSON object.

See [Conversations](https://docs.moss.dev/docs/api-reference/v1/inference/responses.md#conversations).

## Stream a response

```swift theme={null}
let stream = try await client.responses.createStreaming(
  input: "Do you ship to Canada?",
  instructions: "You are the support agent for Acme."
)
for try await event in stream where event.type == "response.output_text.delta" {
  print(event.delta ?? "", terminator: "")
}
```

`createStreaming` takes the same arguments as `create`. Each `ResponseStreamEvent` has OpenAI's `type`, such as `response.output_text.delta`, and the fields of that type. The stream ends after one of two events:

* `response.completed`, whose `event.response` is the whole response.
* `response.incomplete`, when `maxOutputTokens` or a content filter cut the response short.

To stop early, call `stream.cancel()`. It closes the connection, which stops the model, and ends the loop without an error.

[Streaming](https://docs.moss.dev/docs/inference/streaming.md) lists every event.

## Ground it in your indexes

```swift theme={null}
let response = try await client.responses.create(
  input: "Do you ship to Canada?",
  instructions: "You are the support agent for Acme.",
  indexes: ["faq"]
)
```

Moss searches the `faq` index and adds what it finds to the prompt. The [Quickstart](https://docs.moss.dev/docs/inference/quickstart.md) creates that index.

Without `indexes`, Moss does not search before the model runs. You can name at most 32.

`retrieve: false` skips the search on a call that names indexes.

[Ground answers in your indexes](https://docs.moss.dev/docs/inference/retrieval.md) covers the options and the cost.

## Use a vendor model

Name a model from OpenAI, Anthropic or Google in `model`. The search of your indexes works the same for every model. [Models](https://docs.moss.dev/docs/inference/models.md) lists them all.

### On the Moss key

```swift theme={null}
let response = try await client.responses.create(
  model: "anthropic/claude-haiku-5.5",
  input: "Do you ship to Canada?",
  instructions: "You are the support agent for Acme.",
  indexes: ["faq"]
)
```

Without your own key, a listed vendor model runs on the Moss key and bills your credits. [Routes](https://docs.moss.dev/docs/inference/models.md#routes) shows who bills each call.

A listed model that is not served right now throws `InferenceError` with `code` `"model_not_enabled"`. Send `moss/fastlane-1` or use your own key.

### With your own key

Pass your OpenAI, Anthropic or Google key to a client as `apiKey`:

```swift theme={null}
let ownClient = try MossInference(
  projectId: ProcessInfo.processInfo.environment["MOSS_PROJECT_ID"]!,
  projectKey: ProcessInfo.processInfo.environment["MOSS_PROJECT_KEY"]!,
  apiKey: ProcessInfo.processInfo.environment["OPENAI_API_KEY"]!
)
let response = try await ownClient.responses.create(
  model: "gpt-6-luna",
  input: "Do you ship to Canada?",
  instructions: "You are the support agent for Acme.",
  indexes: ["faq"]
)
```

The key goes in the `X-Moss-Provider-Key` header, never in the body. To use a key for one call only, pass `apiKey` to `create` or `createStreaming`.

[Bring your own key](https://docs.moss.dev/docs/inference/bring-your-own-key.md) covers model names and billing.

## Tool calls

Pass your functions in `tools`, as the flat function tools of OpenAI's Responses API. Each call the model makes comes as a `.functionCall` item of `output`.

Put the `output` items back into `input` with `InputItem(item)`. Add one `.functionCallOutput(callId:output:)` per call, and call again until the response has no calls:

```swift theme={null}
func lookupOrder(_ arguments: String) -> String {
  "Shipped on Oct 20."
}

let tools: [Tool] = [
  .function(
    name: "lookup_order",
    description: "Find an order by its id.",
    parameters: ["type": "object", "properties": ["id": ["type": "string"]], "required": ["id"]]
  )
]
var input: [InputItem] = [.user("Where is order A1?")]
while true {
  let response = try await client.responses.create(
    input: .items(input),
    instructions: "You are the support agent for Acme.",
    tools: tools
  )
  input += response.output.map(InputItem.init)
  var called = false
  for case .functionCall(let call) in response.output {
    input.append(.functionCallOutput(callId: call.callId, output: lookupOrder(call.arguments)))
    called = true
  }
  if !called {
    print(response.outputText)
    break
  }
}
```

`lookupOrder` stands for your own code, and it returns a `String`. `InputItem(item)` sends the item's `raw` JSON. It keeps every field the model sent, such as the thought signature Gemini needs in the next turn.

[Tool calling](https://docs.moss.dev/docs/inference/tool-calling.md) covers tool choice, parallel calls and structured output.

## MCP servers

An `McpServer` in `tools` names an MCP server. Moss Inference runs its tools for the model, so your code sends no `.functionCallOutput` items for them.

```swift theme={null}
let crm = McpServer(
  serverLabel: "crm",
  serverURL: "https://mcp.example.com/mcp",
  headers: ["Authorization": "Bearer your-crm-token"]
)
let stream = try await client.responses.createStreaming(
  input: "Where is order A1?",
  instructions: "You are the support agent for Acme.",
  tools: [.mcp(crm)]
)
for try await event in stream {
  switch (event.type, event.item) {
  case ("response.output_item.done", .mcpCall(let call)?): print(call.name, call.output ?? "")
  case ("response.output_text.delta", _): print(event.delta ?? "", terminator: "")
  default: break
  }
}
```

`McpServer` also takes `allowedTools`, and `transport` as `.streamableHTTP` or `.sse`.

Each call comes as an `.mcpCall` item. It arrives in `response.output_item.added` when it starts, and in `response.output_item.done` when it ends. The same items are in the response's `output`.

An `McpCall` has the call's `serverLabel`, `name` and `arguments`. Once the call has ended, it also has its `status`, `output` or `error`, and `durationMs`.

Send the items back in `input` with the rest of `output`. The model then sees the earlier tool results.

MCP failures throw `InferenceError` with `status`, `type`, `code` and `retryAfter`. A call that fails after a tool ran has `code` `"failed_after_tool_call"`. The tool may already have changed data, so Moss Inference does not retry the call. **Never replay a request that failed with `failed_after_tool_call`.**

[MCP servers](https://docs.moss.dev/docs/inference/mcp-servers.md) covers the server fields and every MCP error.

## Errors

A failed call throws `InferenceError`. Once a stream has started, it throws from the `for try await` loop. A `response.failed` event throws it too.

| Field | Meaning |
| - | - |
| `status` | The HTTP status of a refused request. |
| `type` | The kind of failure. |
| `message` | What went wrong. |
| `code` | The error code Moss Inference sent, such as `"rate_limit_exceeded"`. |
| `requestId` | The response's `X-Moss-Request-Id`. |
| `retryAfter` | Seconds to wait, from a `Retry-After` header. |

A field the failure lacks is `nil`.

The SDK sets these types itself, with `status` `nil`:

| `type` | Cause |
| - | - |
| `invalid_request_error` | An argument rejected before sending, such as an empty key or an index name that is empty or holds a comma. |
| `connection_error` | Moss Inference unreachable, or the connection broke. |
| `timeout` | A time limit ran out, such as `timeout` or `idleTimeout`. |
| `incomplete_stream` | The stream ended before `response.completed` or `response.incomplete`. |
| `server_error` | A stream event over 1 MiB, or one that is not a JSON object. |

Every other error carries what Moss Inference sent. [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#errors) lists every code. For a `429`, see [Limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#limits).

## Options

`MossInference(...)`:

| Option | Default | Notes |
| - | - | - |
| `projectId`, `projectKey` | required | Your project id and key. |
| `apiKey` | none | Your OpenAI, Anthropic or Google key, for a vendor `model`. Sent as `X-Moss-Provider-Key`, never in the body. An empty key throws `InferenceError`. |
| `timeout` | none | Seconds for a whole call, stream included. `nil` or `.infinity` turns it off. |
| `idleTimeout` | `120` | Seconds to wait for the response to start, and for each pause in it. `nil` or `.infinity` turns it off. |
| `maxRetries` | `2` | Retries before the response starts. `0` turns them off. |

`create` and `createStreaming` take the same labeled arguments, in this order:

| Option | Default | Notes |
| - | - | - |
| `model` | `"moss"` | `moss` is an alias of `moss/fastlane-1`. Or a listed vendor model on the Moss key, or any vendor model with your `apiKey`. |
| `input` | required | A string literal or `.text(string)`, or an array literal or `.items(array)` of `InputItem`. |
| `instructions` | `nil` | The system message, before `input`. |
| `tools` | `[]` | `[Tool]`: `.function(name:description:parameters:strict:)` for your function, `.mcp(server)` for an MCP server, `.raw(object)` for any other entry. |
| `toolChoice` | `nil` | `.auto`, `.required`, `.function(name)`, `.never` (sent as `none`), or `.raw(object)` for any other object. |
| `parallelToolCalls` | `nil` | Whether the model may call several tools at once. |
| `maxOutputTokens` | `nil` | The most tokens the response may have. |
| `indexes` | none | Index names to search, at most 32. Without it, Moss does not search before the model runs. |
| `retrieve` | `true` | `false` skips the search even when indexes are named. |
| `cache` | `true` | `true` can answer an identical request from the reply cache. `false` always asks the model. |
| `apiKey` | the client's | Your vendor key for this call. |
| `timeout`, `idleTimeout` | the client's | This call's limits. `.infinity` turns one off. `nil` keeps the client's. |
| `maxRetries` | the client's | This call's retries. |
| `extra` | `[:]` | Other OpenAI body fields as `[String: JSONValue]`, such as `["temperature": 0.2]` or `["text": ["format": ...]]`. The typed arguments win over the same keys. `stream` is always `true`. |
