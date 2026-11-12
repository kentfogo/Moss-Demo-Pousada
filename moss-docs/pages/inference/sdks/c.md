<!-- Source: https://docs.moss.dev/docs/inference/sdks/c.md -->
# C

> The C client for Moss Inference: OpenAI's Responses API, answered from your indexes.

`MossInference` is the C client for [Moss Inference](https://docs.moss.dev/docs/inference/overview.md). `moss_inference_responses_create` takes an OpenAI Responses request as JSON, searches your indexes, and returns OpenAI's JSON.

## Install

```bash theme={null}
VERSION=0.31.0
TARGET=aarch64-apple-darwin
curl -L -o libmoss.tar.gz \
  "https://github.com/usemoss/moss/releases/download/c-sdk-v${VERSION}/libmoss-v${VERSION}-${TARGET}.tar.gz"
mkdir -p libmoss && tar -xzf libmoss.tar.gz -C libmoss --strip-components=1
```

`MossInference` needs `libmoss` 0.29.0 or later. Set `TARGET` for your platform. The tarball holds the header, `include/libmoss.h`. A `libmoss.h` with these functions defines `MOSS_INFERENCE_API_VERSION` `3` or later. For the other platforms and how to link the library, see [Install](https://docs.moss.dev/docs/reference/c/getting-started.md#install).

## Create a client

```c theme={null}
#include "libmoss.h"
#include <stdio.h>
#include <stdlib.h>

char options[512];
snprintf(options, sizeof(options),
         "{\"project_id\": \"%s\", \"project_key\": \"%s\"}",
         getenv("MOSS_PROJECT_ID"), getenv("MOSS_PROJECT_KEY"));

MossInference *client = NULL;
if (moss_inference_new(options, &client) != OK) {
    fprintf(stderr, "%s\n", moss_last_error());
    return 1;
}
```

Copy the project id and key from the [Moss portal](https://portal.usemoss.dev). Build one client and reuse it for every call, from any thread. Free it with `moss_inference_free` once no call on it is running.

The examples below use this `client`.

## Get a response

```c theme={null}
const char *request =
    "{\"instructions\": \"You are the support agent for Acme.\","
    " \"input\": \"Do you ship to Canada?\"}";
char *response = NULL;
if (moss_inference_responses_create(client, request, NULL, NULL, NULL,
                                    &response) == OK) {
    printf("%s\n", response);
    moss_free_string(response);
} else {
    fprintf(stderr, "%s\n", moss_last_error());
}
```

With `NULL` for the callback, `out_json` gets the response as the JSON of one OpenAI Response. Free it with `moss_free_string`.

The text is in the `output_text` parts of the `message` items of `output`.

The response's `request_id` is its `X-Moss-Request-Id`. Include it when you report a problem. It is left out when the response has none.

Moss stores no response, so `input` holds the whole conversation. Pass a string, or a list of items such as `{"role": "user", "content": "Hi"}` and the `output` items of earlier responses. See [Conversations](https://docs.moss.dev/docs/api-reference/v1/inference/responses.md#conversations).

## Stream a response

```c theme={null}
static int32_t print_event(const char *event_json, void *user_data) {
    (void)user_data;
    printf("%s\n", event_json);
    return 0; // any other value stops the stream
}

const char *request =
    "{\"instructions\": \"You are the support agent for Acme.\","
    " \"input\": \"Do you ship to Canada?\"}";
if (moss_inference_responses_create(client, request, NULL, print_event, NULL,
                                    NULL) != OK) {
    fprintf(stderr, "%s\n", moss_last_error());
}
```

The call blocks until the response ends. It hands the callback each event as the JSON text of one OpenAI Responses event, such as `response.output_text.delta`. That event carries the new text in `delta`. The stream ends after one of two events:

* `response.completed`, when the response is done.
* `response.incomplete`, when `max_output_tokens` or a content filter cut the response short.

A streaming call can pass `out_json` too. It then gets the response of the last event.

To stop early, return a value other than `0` from the callback. The call then closes the connection, which stops the model, and returns `OK`.

[Streaming](https://docs.moss.dev/docs/inference/streaming.md) lists every event.

## Ground it in your indexes

```c theme={null}
const char *request =
    "{\"instructions\": \"You are the support agent for Acme.\","
    " \"input\": \"Do you ship to Canada?\","
    " \"indexes\": [\"faq\"]}";
char *response = NULL;
if (moss_inference_responses_create(client, request, NULL, NULL, NULL,
                                    &response) == OK) {
    printf("%s\n", response);
    moss_free_string(response);
} else {
    fprintf(stderr, "%s\n", moss_last_error());
}
```

Moss searches the `faq` index and adds what it finds to the prompt. The [Quickstart](https://docs.moss.dev/docs/inference/quickstart.md) creates that index.

Without `indexes`, Moss does not search before the model runs. You can name at most 32.

`"retrieve": false` skips the search on a call that names indexes.

[Ground answers in your indexes](https://docs.moss.dev/docs/inference/retrieval.md) covers the options and the cost.

## Use a vendor model

Name a model from OpenAI, Anthropic or Google in `model`. The search of your indexes works the same for every model. [Models](https://docs.moss.dev/docs/inference/models.md) lists them all.

### On the Moss key

```c theme={null}
const char *request =
    "{\"model\": \"anthropic/claude-haiku-5.5\","
    " \"instructions\": \"You are the support agent for Acme.\","
    " \"input\": \"Do you ship to Canada?\","
    " \"indexes\": [\"faq\"]}";
char *response = NULL;
if (moss_inference_responses_create(client, request, NULL, NULL, NULL,
                                    &response) == OK) {
    printf("%s\n", response);
    moss_free_string(response);
} else {
    fprintf(stderr, "%s\n", moss_last_error());
}
```

Without your own key, a listed vendor model runs on the Moss key and bills your credits. [Routes](https://docs.moss.dev/docs/inference/models.md#routes) shows who bills each call.

A listed model that is not served right now fails with `code` `"model_not_enabled"` in `moss_last_error_detail()`. Send `moss/fastlane-1` or use your own key.

### With your own key

Pass your OpenAI, Anthropic or Google key to a client as `api_key` in `options_json`:

```c theme={null}
char own_options[1024];
snprintf(own_options, sizeof(own_options),
         "{\"project_id\": \"%s\", \"project_key\": \"%s\", \"api_key\": \"%s\"}",
         getenv("MOSS_PROJECT_ID"), getenv("MOSS_PROJECT_KEY"),
         getenv("OPENAI_API_KEY"));

MossInference *own_client = NULL;
if (moss_inference_new(own_options, &own_client) != OK) {
    fprintf(stderr, "%s\n", moss_last_error());
    return 1;
}

const char *request =
    "{\"model\": \"gpt-6-luna\","
    " \"instructions\": \"You are the support agent for Acme.\","
    " \"input\": \"Do you ship to Canada?\","
    " \"indexes\": [\"faq\"]}";
char *response = NULL;
if (moss_inference_responses_create(own_client, request, NULL, NULL, NULL,
                                    &response) == OK) {
    printf("%s\n", response);
    moss_free_string(response);
} else {
    fprintf(stderr, "%s\n", moss_last_error());
}
```

The key goes in the `X-Moss-Provider-Key` header, never in the body. To use a key for one call only, put `api_key` in `call_options_json`.

The response's `model` is the name you sent. [Bring your own key](https://docs.moss.dev/docs/inference/bring-your-own-key.md) covers model names and billing.

## Tool calls

Pass OpenAI function tools in `tools` of the request JSON. A function tool is flat, as in OpenAI's Responses API. Your code runs the tools.

```c theme={null}
const char *request =
    "{\"instructions\": \"You are the support agent for Acme.\","
    " \"input\": [{\"role\": \"user\", \"content\": \"Where is order A1?\"}],"
    " \"tools\": [{\"type\": \"function\", \"name\": \"lookup_order\","
    " \"parameters\": {\"type\": \"object\","
    " \"properties\": {\"id\": {\"type\": \"string\"}}}}]}";
char *response = NULL;
if (moss_inference_responses_create(client, request, NULL, NULL, NULL,
                                    &response) == OK) {
    // With your JSON library, run lookup_order for each function_call item of output.
    moss_free_string(response);
} else {
    fprintf(stderr, "%s\n", moss_last_error());
}
```

Each call the model makes comes as a `function_call` item of `output`, with its `call_id`, `name` and `arguments`.

Put the `output` items back into `input` as they are. Add one item per call, such as `{"type": "function_call_output", "call_id": "...", "output": "Shipped on Oct 20."}`. Call again with the same `tools` until the response has no calls.

Each item keeps every field the model sent, such as the thought signature Gemini needs in the next turn.

[Tool calling](https://docs.moss.dev/docs/inference/tool-calling.md) covers `tool_choice`, `parallel_tool_calls` and structured output.

## MCP servers

A `tools` entry of type `"mcp"` names an MCP server. Moss Inference runs its tools for the model within the same call, so your code sends no `function_call_output` items for them.

```c theme={null}
const char *request =
    "{\"instructions\": \"You are the support agent for Acme.\","
    " \"input\": \"Where is order A1?\","
    " \"tools\": [{\"type\": \"mcp\", \"server_label\": \"crm\","
    " \"server_url\": \"https://mcp.example.com/mcp\","
    " \"headers\": {\"Authorization\": \"Bearer your-crm-token\"}}]}";
char *response = NULL;
if (moss_inference_responses_create(client, request, NULL, print_event, NULL,
                                    &response) == OK) {
    printf("%s\n", response);
    moss_free_string(response);
} else {
    fprintf(stderr, "%s\n", moss_last_error());
}
```

`print_event` is the callback from [Stream a response](#stream-a-response).

Each call comes as an `mcp_call` item. It arrives in a `response.output_item.added` event when it starts, and in `response.output_item.done` when it ends. The same items are in the response's `output`.

Send the items back in `input` with the rest of `output`. The model then sees the earlier tool results.

MCP failures return a negative `MossResult`, with `status`, `type`, `code` and `retry_after_ms` in `moss_last_error_detail()`. A call that fails after a tool ran has `code` `"failed_after_tool_call"`. The tool may already have changed data, so Moss Inference does not retry the call. **Never replay a request that failed with `failed_after_tool_call`.**

[MCP servers](https://docs.moss.dev/docs/inference/mcp-servers.md) covers the server fields and every MCP error.

## Errors

A failed call returns a negative `MossResult`. A streaming call returns it after the events the callback already got. A `response.failed` event fails the call too.

Right after the failed call, on the same thread, `moss_last_error()` holds the message. `moss_last_error_detail()` holds a JSON object with these fields:

| Field | Meaning |
| - | - |
| `status` | The HTTP status of a refused request. |
| `type` | The kind of failure. |
| `code` | The error code Moss Inference sent, such as `"rate_limit_exceeded"`. |
| `request_id` | The response's `X-Moss-Request-Id`. |
| `retry_after_ms` | Milliseconds to wait, from a `Retry-After` header. |

A field the failure lacks is `null`.

The SDK sets these types itself:

| `type` | Returns | Cause |
| - | - | - |
| none, the detail is `NULL` | `ERR_NULL_POINTER`, `ERR_INVALID_ARG` | An argument rejected before sending, such as an empty key, an index name that is empty or holds a comma, a `NULL` client or request, or no callback and no `out_json`. |
| `connection_error` | `ERR_CLOUD` | Moss Inference unreachable, or the connection broke. |
| `timeout` | `ERR_CLOUD` | A time limit ran out, such as `timeout_ms` or `idle_timeout_ms`. |
| `incomplete_stream` | `ERR_CLOUD` | The stream ended before `response.completed` or `response.incomplete`. |
| `server_error` | `ERR_CLOUD`, `ERR_DESERIALIZATION` | A stream event over 1 MiB (`ERR_CLOUD`), or one that is not a JSON object (`ERR_DESERIALIZATION`). |

Every other error carries what Moss Inference sent. The call returns:

* `ERR_UNAUTHORIZED` for `authentication_error` and `permission_error`.
* `ERR_INVALID_ARG` for `invalid_request_error`.
* `ERR_CLOUD` for the rest.

[Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#errors) lists every code. For a `429`, see [Limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#limits).

## Options

```c theme={null}
typedef int32_t (*MossInferenceEventFn)(const char *event_json, void *user_data);
MossResult moss_inference_new(const char *options_json, MossInference **out);
void moss_inference_free(MossInference *client);
MossResult moss_inference_responses_create(
    const MossInference *client, const char *request_json, const char *call_options_json,
    MossInferenceEventFn on_event, void *user_data, char **out_json);
```

`options_json` of `moss_inference_new`:

| Key | Default | Notes |
| - | - | - |
| `project_id`, `project_key` | required | Your project id and key. |
| `api_key` | none | Your OpenAI, Anthropic or Google key, for a vendor `model`. Sent as `X-Moss-Provider-Key`, never in the body. An empty key returns `ERR_INVALID_ARG`. |
| `timeout_ms` | none | Milliseconds for a whole call, stream included. `0` turns it off. |
| `idle_timeout_ms` | `120000` | Milliseconds to wait for the response to start, and for each pause in it. `0` turns it off. |
| `max_retries` | `2` | Retries before the response starts. `0` turns them off. |

`request_json` of `moss_inference_responses_create`:

| Key | Default | Notes |
| - | - | - |
| `model` | `"moss"` | `moss` is an alias of `moss/fastlane-1`. Or a listed vendor model on the Moss key, or any vendor model with your `api_key`. |
| `input` | required | A string, or a list of messages, `function_call_output` items and earlier `output` items. |
| `instructions` | none | The system message, before `input`. |
| `tools`, `tool_choice`, `parallel_tool_calls` | none | OpenAI's Responses tool fields. A `tools` entry of type `"mcp"` names an MCP server. |
| `indexes` | none | Index names to search, at most 32. Without it, Moss does not search before the model runs. |
| `retrieve` | `true` | `false` skips the search even when indexes are named. |
| `cache` | `true` | `true` can answer an identical request from the reply cache. `false` always asks the model. |
| Other OpenAI fields | none | `max_output_tokens`, `temperature`, `text` for structured output, `reasoning` and the rest. `stream` is always `true`. |

`call_options_json` of `moss_inference_responses_create`, which may be `NULL`:

| Key | Default | Notes |
| - | - | - |
| `api_key` | the client's | Your vendor key for this call. |
| `timeout_ms`, `idle_timeout_ms` | the client's | This call's limits. `0` turns one off. |
| `max_retries` | the client's | This call's retries. |

## Memory and the event callback

| Pointer | Owner | Release |
| - | - | - |
| `MossInference *` from `moss_inference_new` | You | `moss_inference_free`, once no call on it is running. `NULL` is a no-op. |
| `*out_json` from `moss_inference_responses_create` | You | `moss_free_string`. Set only when the call returns `OK`. `NULL` when the callback stopped the stream first. |
| `event_json` in the callback | `libmoss` | Nothing. Valid until the callback returns, so copy it to keep it. |
| `moss_last_error()`, `moss_last_error_detail()` | `libmoss` | Nothing. Valid until the next `libmoss` call on the same thread. |
| `options_json`, `request_json`, `call_options_json` | You | Your own. They only need to live until the call returns. |

* The callback runs on the thread that made the call, once per event. It never runs after the call returns.
* `libmoss` never reads or frees `user_data`.
* The next event is read only after the callback returns. A slow callback holds up the stream, and its time counts toward `timeout_ms`.
