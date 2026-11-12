<!-- Source: https://docs.moss.dev/docs/inference/sdks/android.md -->
# Android

> The Android client for Moss Inference: OpenAI's Responses API, answered from your indexes.

`MossInference` is the Kotlin client for [Moss Inference](https://docs.moss.dev/docs/inference/overview.md) on Android. It searches your indexes and answers in the shape of OpenAI's Responses API, with camelCase fields. `responses.create` returns the whole response, and `createStreaming` streams its events.

## Install

```bash theme={null}
VERSION=0.31.0
mkdir -p app/libs
curl -fL -o app/libs/moss-android.aar \
  "https://github.com/usemoss/moss/releases/download/android-sdk-v${VERSION}/moss-android-${VERSION}.aar"
```

Then add the AAR in `app/build.gradle.kts`:

```kotlin theme={null}
dependencies {
    implementation(files("libs/moss-android.aar"))
}
```

`MossInference` needs the `moss-android` AAR 0.29.0 or later. For the rest of the SDK setup, see [Install](https://docs.moss.dev/docs/reference/android/getting-started.md#install).

## Create a client

```kotlin theme={null}
import dev.usemoss.moss.MossInference

val inference = MossInference(projectId = projectId, projectKey = projectKey)
```

`projectId` and `projectKey` are your project id and key. Copy them from the [Moss portal](https://portal.usemoss.dev). Build one client and reuse it for every call, from any thread.

Calls and stream reads block. On the main thread they throw `MossException`, so run them from `Dispatchers.IO`. The examples below use this `inference` client inside a coroutine.

## Get a response

```kotlin theme={null}
import dev.usemoss.moss.InputItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

val input = listOf(InputItem.user("Do you ship to Canada?"))

val response = withContext(Dispatchers.IO) {
    inference.responses.create(
        input = input,
        instructions = "You are the support agent for Acme.",
    )
}
println(response.outputText)
```

`response.outputText` joins the text of the response's messages. `response.output` holds its items: `OutputItem.Message`, `FunctionCall`, `McpCall`, or `Other` for any other type. Each item has its JSON in `raw`.

`response.requestId` is the response's `X-Moss-Request-Id`. A stream has the same `stream.requestId`. Include it when you report a problem. Both are `null` when the response has none.

Moss stores no response, so `input` holds the whole conversation. Build messages with `InputItem.user`, `system`, `developer` and `assistant`. Add the `output` items of earlier responses with `InputItem.of(item)`. See [Conversations](https://docs.moss.dev/docs/api-reference/v1/inference/responses.md#conversations).

## Stream a response

```kotlin theme={null}
import kotlinx.coroutines.ensureActive

withContext(Dispatchers.IO) {
    inference.responses.createStreaming(
        input = input,
        instructions = "You are the support agent for Acme.",
    ).use { stream ->
        for (event in stream) {
            ensureActive()
            if (event.type == "response.output_text.delta") print(event.delta)
        }
    }
}
```

Each `ResponseStreamEvent` has OpenAI's `type`, such as `response.output_text.delta`, and the fields of that type. The stream ends after one of two events:

* `response.completed`, whose `event.response` is the whole response.
* `response.incomplete`, when `maxOutputTokens` or a content filter cut the response short.

To stop early, leave `use` with a `break` or `return`. That closes the connection, which stops the model. Cancelling the coroutine alone does not. So the loop calls `ensureActive()`, whose throw leaves `use` the same way.

[Streaming](https://docs.moss.dev/docs/inference/streaming.md) lists every event.

## Ground it in your indexes

```kotlin theme={null}
val response = withContext(Dispatchers.IO) {
    inference.responses.create(
        input = input,
        instructions = "You are the support agent for Acme.",
        indexes = listOf("faq"),
    )
}
```

Moss searches the `faq` index and adds what it finds to the prompt. The [Quickstart](https://docs.moss.dev/docs/inference/quickstart.md) creates that index.

Without `indexes`, Moss does not search before the model runs. You can name at most 32.

`retrieve = false` skips the search on a call that names indexes.

[Ground answers in your indexes](https://docs.moss.dev/docs/inference/retrieval.md) covers the options and the cost.

## Use a vendor model

Name a model from OpenAI, Anthropic or Google in `model`. The search of your indexes works the same for every model. [Models](https://docs.moss.dev/docs/inference/models.md) lists them all.

### On the Moss key

```kotlin theme={null}
val response = withContext(Dispatchers.IO) {
    inference.responses.create(
        input = input,
        model = "anthropic/claude-haiku-5.5",
        instructions = "You are the support agent for Acme.",
        indexes = listOf("faq"),
    )
}
```

Without your own key, a listed vendor model runs on the Moss key and bills your credits. [Routes](https://docs.moss.dev/docs/inference/models.md#routes) shows who bills each call.

A listed model that is not served right now throws `InferenceError` with `code` `"model_not_enabled"`. Send `moss/fastlane-1` or use your own key.

### With your own key

Pass your OpenAI, Anthropic or Google key to a client as `apiKey`:

```kotlin theme={null}
val ownClient = MossInference(
    projectId = projectId,
    projectKey = projectKey,
    apiKey = openaiKey,
)

val response = withContext(Dispatchers.IO) {
    ownClient.responses.create(
        input = input,
        model = "gpt-6-luna",
        instructions = "You are the support agent for Acme.",
        indexes = listOf("faq"),
    )
}
```

`openaiKey` is your OpenAI key. It goes in the `X-Moss-Provider-Key` header, never in the body. To use a key for one call only, pass `apiKey` to `responses.create` or `createStreaming`.

[Bring your own key](https://docs.moss.dev/docs/inference/bring-your-own-key.md) covers model names and billing.

## Tool calls

Pass `tools` as the flat function tools of OpenAI's Responses API. Each call the model makes comes as an `OutputItem.FunctionCall` item of `output`.

Append every `output` item with `InputItem.of(item)`, which sends it back unchanged. Add one `InputItem.functionCallOutput(callId, output)` per call, and call again until the response has no calls:

```kotlin theme={null}
import dev.usemoss.moss.OutputItem
import dev.usemoss.moss.Tool

fun lookupOrder(arguments: String): String = "Shipped on Oct 20."

val tools = listOf(
    Tool.function(
        name = "lookup_order",
        description = "Finds an order by its id.",
        parameters = """{"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}""",
    ),
)

val answer = withContext(Dispatchers.IO) {
    val items = mutableListOf<InputItem>(InputItem.user("Where is order A1?"))
    val instructions = "You are the support agent for Acme."
    var response = inference.responses.create(items, instructions = instructions, tools = tools)
    while (true) {
        items += response.output.map { InputItem.of(it) }
        val calls = response.output.filterIsInstance<OutputItem.FunctionCall>()
        if (calls.isEmpty()) break
        for (call in calls) {
            items += InputItem.functionCallOutput(call.callId, lookupOrder(call.arguments))
        }
        response = inference.responses.create(items, instructions = instructions, tools = tools)
    }
    response.outputText
}
println(answer)
```

`lookupOrder` stands for your own code. It takes the call's JSON arguments and returns the result as text. `InputItem.of(item)` keeps every field the model sent, such as the signature Gemini needs back in the next turn.

[Tool calling](https://docs.moss.dev/docs/inference/tool-calling.md) covers `toolChoice`, `parallelToolCalls` and structured output.

## MCP servers

A `Tool.mcp` entry in `tools` names an MCP server. Moss Inference runs its tools for the model during the same call, so your code sends no `functionCallOutput` for them.

```kotlin theme={null}
import dev.usemoss.moss.McpServer

val crm = McpServer(
    serverLabel = "crm",
    serverUrl = "https://mcp.example.com/mcp",
    headers = mapOf("Authorization" to "Bearer $crmToken"),
)

withContext(Dispatchers.IO) {
    inference.responses.createStreaming(
        listOf(InputItem.user("Where is order A1?")),
        instructions = "You are the support agent for Acme.",
        tools = listOf(Tool.mcp(crm)),
    ).use { stream ->
        for (event in stream) {
            ensureActive()
            val call = event.item as? OutputItem.McpCall
            if (call != null && event.type == "response.output_item.done") println("${call.name}: ${call.output}")
            if (event.type == "response.output_text.delta") print(event.delta)
        }
    }
}
```

`crmToken` is your CRM token. `McpServer` also takes `allowedTools` and `transport`, which is `McpServer.Transport.STREAMABLE_HTTP` or `SSE`.

Each call comes as an `OutputItem.McpCall`. It arrives in `response.output_item.added` when it starts, and in `response.output_item.done` when it ends. The same items are in the response's `output`.

An `McpCall` has the `serverLabel`, `name` and `arguments` of the call. Once the call ends, it also has its `status`, `output` or `error`, and `durationMs`.

Send the items back in `input` with the rest of `output`. The model then sees the earlier tool results.

MCP failures throw `InferenceError` with `status`, `type`, `code` and `retryAfterMs`. A call that fails after a tool ran has `code` `"failed_after_tool_call"`. The tool may already have changed data, so Moss Inference does not retry the call. **Never replay a request that failed with `failed_after_tool_call`.**

[MCP servers](https://docs.moss.dev/docs/inference/mcp-servers.md) covers the server fields and every MCP error.

## Errors

A failed call throws `InferenceError`. Once a stream has started, it throws from the `for` loop. A `response.failed` event throws it too.

| Field | Meaning |
| - | - |
| `status` | The HTTP status of a refused request. |
| `type` | The kind of failure. |
| `message` | What went wrong. |
| `code` | The error code Moss Inference sent, such as `"rate_limit_exceeded"`. |
| `requestId` | The response's `X-Moss-Request-Id`. |
| `retryAfterMs` | Milliseconds to wait, from a `Retry-After` header. |

A field the failure lacks is `null`.

The SDK raises these errors itself. All but the first are an `InferenceError` with that `type` and `status` `null`:

| Error | Cause |
| - | - |
| `IllegalArgumentException` | An argument rejected before sending, such as a blank key or an index name that is blank or holds a comma. |
| `connection_error` | Moss Inference unreachable, or the connection broke. |
| `timeout` | A time limit ran out, such as `timeoutMs` or `idleTimeoutMs`. |
| `incomplete_stream` | The stream ended before `response.completed` or `response.incomplete`. |
| `server_error` | A stream event over 1 MiB, or one that is not a JSON object. |

Every other error carries what Moss Inference sent. [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#errors) lists every code. For a `429`, see [Limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#limits).

## Options

`MossInference(...)`:

| Option | Default | Notes |
| - | - | - |
| `projectId`, `projectKey` | required | Your project id and key. |
| `apiKey` | none | Your OpenAI, Anthropic or Google key, for a vendor `model`. Sent as `X-Moss-Provider-Key`, never in the body. A blank key throws `IllegalArgumentException`. |
| `timeoutMs` | none | Milliseconds for a whole call, stream included. `null` turns it off. |
| `idleTimeoutMs` | `120_000` | Milliseconds to wait for the response to start, and for each pause in it. `null` turns it off. |
| `maxRetries` | `2` | Retries before the response starts. `0` turns them off. |

`responses.create` and `createStreaming` take the same parameters, `input` first:

| Option | Default | Notes |
| - | - | - |
| `input` | required | A `List<InputItem>`, built with `InputItem.user`, `system`, `developer`, `assistant`, `of(item)` and `functionCallOutput(callId, output)`. `InputItem.raw` takes any other item as the text of a JSON object. |
| `model` | `"moss"` | `moss` is an alias of `moss/fastlane-1`. Or a listed vendor model on the Moss key, or any vendor model with your `apiKey`. |
| `instructions` | none | The system message, before `input`. |
| `tools` | none | A `List<Tool>`: `Tool.function` for your function, `Tool.mcp` for an MCP server, `Tool.raw` for any other tool object. |
| `toolChoice` | none | `ToolChoice.AUTO`, `NONE`, `REQUIRED`, `ToolChoice.function(name)`, or `ToolChoice.raw(json)` for any other JSON object. |
| `parallelToolCalls` | none | Whether the model may call several tools at once. |
| `maxOutputTokens` | none | The most tokens the response may have. |
| `indexes` | none | Index names to search, at most 32. Without it, Moss does not search before the model runs. |
| `retrieve` | `true` | `false` skips the search even when indexes are named. |
| `cache` | `true` | `true` can answer an identical request from the reply cache. `false` always asks the model. |
| `apiKey` | the client's | Your vendor key for this call. |
| `extra` | none | Other OpenAI fields as JSON values, such as `temperature`, `text` for structured output or `reasoning`. Typed parameters win over `extra`. `stream` is always `true`. |
| `timeoutMs`, `idleTimeoutMs` | the client's | This call's limits. `null` turns one off. |
| `maxRetries` | the client's | This call's retries. |
