<!-- Source: https://docs.moss.dev/docs/inference/sdks/elixir.md -->
# Elixir

> The Elixir client for Moss Inference: OpenAI's Responses API, answered from your indexes.

`Moss.Inference` is the Elixir client for [Moss Inference](https://docs.moss.dev/docs/inference/overview.md). Its `Responses.create/3` takes OpenAI's Responses body as a map and searches your indexes. It answers with OpenAI's field names as string keys.

## Install

```elixir theme={null}
# mix.exs
defp deps do
  [{:moss, "~> 1.11"}]
end
```

Then run `mix deps.get`. `Moss.Inference` needs `moss` 1.11.0 or later. For the rest of the SDK setup, see [Install](https://docs.moss.dev/docs/reference/elixir/api.md#install).

## Create a client

```elixir theme={null}
alias Moss.Inference.Responses

project_id = System.fetch_env!("MOSS_PROJECT_ID")
project_key = System.fetch_env!("MOSS_PROJECT_KEY")

client = Moss.Inference.new(project_id, project_key)
```

Copy the project id and key from the [Moss portal](https://portal.usemoss.dev). Build one client and reuse it for every call, from any process. It is plain data with nothing to close.

The examples below use this `client` and the `Responses` alias.

## Get a response

```elixir theme={null}
params = %{instructions: "You are the support agent for Acme.", input: "Do you ship to Canada?"}
{:ok, response} = Responses.create(client, params)

IO.puts(response["output_text"])
```

`params` is OpenAI's Responses body, with atom or string keys. `create/3` returns `{:ok, response}`.

`response["output_text"]` joins the text of the response's messages. `response["output"]` holds its items.

`response["request_id"]` is the response's `X-Moss-Request-Id`. A stream has the same `stream.request_id`. Include it when you report a problem. Both are `nil` when the response has none.

Moss stores no response, so `input` holds the whole conversation. Pass a string, or a list of items such as `%{role: "user", content: "Hi"}` and the `"output"` items of earlier responses. See [Conversations](https://docs.moss.dev/docs/api-reference/v1/inference/responses.md#conversations).

## Stream a response

```elixir theme={null}
params = %{
  instructions: "You are the support agent for Acme.",
  input: "Do you ship to Canada?",
  stream: true
}

{:ok, stream} = Responses.create(client, params)

for %{"type" => "response.output_text.delta", "delta" => delta} <- stream do
  IO.write(delta)
end
```

With `stream: true`, `create/3` returns `{:ok, stream}` once the response starts. Each event is a map with OpenAI's `"type"`, such as `response.output_text.delta`, and the fields of that type. The stream ends after one of two events:

* `response.completed`, when the response is done.
* `response.incomplete`, when `max_output_tokens` or a content filter cut the response short.

The `"response"` map of that last event holds `"output"` and `"usage"`. It has no `"output_text"` or `"request_id"`. Join the text from the `response.output_text.delta` events or from `"output"`. Read the request id from `stream.request_id`.

Read the stream once, in the process that called `create/3`.

To stop early, halt the stream, for example with `Enum.take/2`. You can also call `Moss.Inference.ResponseStream.close(stream)` from any process. Either one closes the connection, which stops the model.

[Streaming](https://docs.moss.dev/docs/inference/streaming.md) lists every event.

## Ground it in your indexes

```elixir theme={null}
params = %{instructions: "You are the support agent for Acme.", input: "Do you ship to Canada?"}
{:ok, response} = Responses.create(client, params, indexes: ["faq"])
```

Moss searches the `faq` index and adds what it finds to the prompt. The [Quickstart](https://docs.moss.dev/docs/inference/quickstart.md) creates that index.

`:indexes` goes in `opts`, the third argument, not in `params`. Code written for OpenAI keeps its body and adds `:indexes`.

Without `:indexes`, Moss does not search before the model runs. You can name at most 32.

`retrieve: false` skips the search on a call that names indexes.

[Ground answers in your indexes](https://docs.moss.dev/docs/inference/retrieval.md) covers the options and the cost.

## Use a vendor model

Name a model from OpenAI, Anthropic or Google in `model`. The search of your indexes works the same for every model. [Models](https://docs.moss.dev/docs/inference/models.md) lists them all.

### On the Moss key

```elixir theme={null}
params = %{
  model: "anthropic/claude-haiku-5.5",
  instructions: "You are the support agent for Acme.",
  input: "Do you ship to Canada?"
}

{:ok, response} = Responses.create(client, params, indexes: ["faq"])
```

Without your own key, a listed vendor model runs on the Moss key and bills your credits. [Routes](https://docs.moss.dev/docs/inference/models.md#routes) shows who bills each call.

A listed model that is not served right now returns `{:error, error}` with `code` `"model_not_enabled"`. Send `moss/fastlane-1` or use your own key.

### With your own key

Pass your OpenAI, Anthropic or Google key to a client as `:api_key`:

```elixir theme={null}
own_client =
  Moss.Inference.new(project_id, project_key, api_key: System.fetch_env!("OPENAI_API_KEY"))

params = %{
  model: "gpt-6-luna",
  instructions: "You are the support agent for Acme.",
  input: "Do you ship to Canada?"
}

{:ok, response} = Responses.create(own_client, params, indexes: ["faq"])
```

The key goes in the `X-Moss-Provider-Key` header, never in the body. To use a key for one call only, pass `:api_key` in the `opts` of `create/3`.

`response["model"]` is the name you sent. [Bring your own key](https://docs.moss.dev/docs/inference/bring-your-own-key.md) covers model names and billing.

## Tool calls

Pass OpenAI function tools in `tools`, inside `params`. A function tool is flat, as in OpenAI's Responses API. Your code runs the tools. Each call the model makes comes as a `"function_call"` item of `"output"`.

Put the `"output"` items back into `input` as they are. Add one `"function_call_output"` item per call, and call again until the response has no calls:

```elixir theme={null}
defmodule Orders do
  alias Moss.Inference.Responses

  @lookup %{
    type: "function",
    name: "lookup_order",
    parameters: %{type: "object", properties: %{id: %{type: "string"}}}
  }

  def answer(client, input) do
    params = %{
      instructions: "You are the support agent for Acme.",
      input: input,
      tools: [@lookup]
    }

    {:ok, response} = Responses.create(client, params)

    results =
      for %{"type" => "function_call"} = call <- response["output"] do
        output = lookup_order(call["arguments"])
        %{type: "function_call_output", call_id: call["call_id"], output: output}
      end

    if results == [],
      do: response["output_text"],
      else: answer(client, input ++ response["output"] ++ results)
  end

  defp lookup_order(_arguments), do: "Shipped on Oct 20."
end

IO.puts(Orders.answer(client, [%{role: "user", content: "Where is order A1?"}]))
```

`lookup_order/1` stands for your own code. It gets the arguments as a JSON string and returns the result as a string.

Each item goes back unchanged. It keeps every field the model sent, such as Gemini's `extra_content`.

[Tool calling](https://docs.moss.dev/docs/inference/tool-calling.md) covers `tool_choice`, `parallel_tool_calls` and structured output.

## MCP servers

A `Moss.Inference.McpServer` struct in `tools` names an MCP server. Moss Inference runs its tools for the model during the response. Your code sends no `"function_call_output"` items for them.

```elixir theme={null}
crm = %Moss.Inference.McpServer{
  server_label: "crm",
  server_url: "https://mcp.example.com/mcp",
  headers: %{"Authorization" => "Bearer " <> System.fetch_env!("CRM_TOKEN")}
}

params = %{
  instructions: "You are the support agent for Acme.",
  input: "Where is order A1?",
  tools: [crm],
  stream: true
}

{:ok, stream} = Responses.create(client, params)

for %{"type" => "response.output_item.done", "item" => %{"type" => "mcp_call"} = call} <- stream do
  IO.puts("#{call["server_label"]}.#{call["name"]}: #{call["output"]}")
end
```

Each call comes as an `"mcp_call"` item. It arrives in `response.output_item.added` when it starts, and in `response.output_item.done` when it ends. The same items are in the response's `"output"`.

Send the items back in `input` with the rest of `"output"`. The model then sees the earlier tool results.

MCP failures give a `Moss.Inference.Error` with `status`, `type`, `code` and `retry_after`. A call that fails after a tool ran has `code` `"failed_after_tool_call"`. The tool may already have changed data, so Moss Inference does not retry the call. **Never replay a request that failed with `failed_after_tool_call`.**

[MCP servers](https://docs.moss.dev/docs/inference/mcp-servers.md) covers the server fields and every MCP error.

## Errors

A failed call gives a `Moss.Inference.Error`. `new/3` raises it, and `create/3` returns it as `{:error, error}`. Once a stream has started, reading it raises the error. A `response.failed` event raises it too.

| Field | Meaning |
| - | - |
| `status` | The HTTP status of a refused request. |
| `type` | The kind of failure. |
| `message` | What went wrong. |
| `code` | The error code Moss Inference sent, such as `"rate_limit_exceeded"`. |
| `request_id` | The response's `X-Moss-Request-Id`. |
| `retry_after` | Milliseconds to wait, from a `Retry-After` header. |

A field the failure lacks is `nil`.

The SDK sets these types itself, with `status` `nil`:

| `type` | Cause |
| - | - |
| `invalid_request_error` | An argument rejected before sending, such as an empty key, an index name that is empty or holds a comma, or an option like `:api_key` or `apiKey` inside `params`. |
| `connection_error` | Moss Inference unreachable, or the connection broke. |
| `timeout` | A time limit ran out, such as `:timeout` or `:idle_timeout`. |
| `incomplete_stream` | The stream ended before `response.completed` or `response.incomplete`. |
| `server_error` | A stream event over 1 MiB, or one that is not a JSON object. |

Every other error carries what Moss Inference sent. [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#errors) lists every code. For a `429`, see [Limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#limits).

## Options

`Moss.Inference.new(project_id, project_key, opts)`:

| Option | Default | Notes |
| - | - | - |
| `:api_key` | none | Your OpenAI, Anthropic or Google key, for a vendor `model`. Sent as `X-Moss-Provider-Key`, never in the body. An empty key raises `Moss.Inference.Error`. |
| `:timeout` | none | Milliseconds for a whole call, stream included. `:infinity` turns it off. |
| `:idle_timeout` | `120_000` | Milliseconds to wait for the response to start, and for each pause in it. `:infinity` turns it off. |
| `:max_retries` | `2` | Retries before the response starts. `0` turns them off. |

`Moss.Inference.Responses.create(client, params, opts)` takes OpenAI's Responses body in `params`. The Moss options go in `opts`:

| Option | Default | Notes |
| - | - | - |
| `params` | required | OpenAI's Responses body as a map, with atom or string keys. |
| `model` in `params` | `"moss"` | `moss` is an alias of `moss/fastlane-1`. Or a listed vendor model on the Moss key, or any vendor model with your `:api_key`. |
| `input` in `params` | required | A string, or a list of input item maps and earlier `"output"` items. |
| `instructions` in `params` | none | The system message, before `input`. |
| `stream` in `params` | `false` | `true` returns `{:ok, stream}`, an `Enumerable` of event maps, once the response starts. Otherwise `{:ok, response}`, one response map. |
| `tools`, `tool_choice`, `parallel_tool_calls` in `params` | none | Flat function tools and `Moss.Inference.McpServer` structs, and how the model may call them. |
| `max_output_tokens` in `params` | none | The most tokens the response may have. |
| `:indexes` | none | Index names to search, at most 32. Without it, Moss does not search before the model runs. |
| `:retrieve` | `true` | `false` skips the search even when indexes are named. |
| `:cache` | `true` | `true` can answer an identical request from the reply cache. `false` always asks the model. |
| `:api_key` | the client's | Your vendor key for this call. |
| `:timeout`, `:idle_timeout` | the client's | This call's limits. `:infinity` turns one off. |
| `:max_retries` | the client's | This call's retries. |
