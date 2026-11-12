<!-- Source: https://docs.moss.dev/docs/changelog.md -->
# Changelog

> Every release across the Moss SDKs, integrations, CLI, Portal, and API.

> [tab] All
>
> **2026-11-10**
>
> v1.24.0
>
> **Changed**
>
> * `tasks.create` and `tasks.run` take `api_key`, and send only that call's key as `X-Moss-Provider-Key`, for the task's model calls. They never send the client's `api_key`, which is for `responses`, so without a key in the call no provider key is sent; an empty one raises `InferenceError` before any request. The other task calls never send it. `MossInferenceSync` takes `api_key` too.
>
> **2026-11-10**
>
> v1.24.0
>
> **Changed**
>
> * `tasks.create` and `tasks.run` send the `apiKey` of their options (`TaskCreateOptions`, `TaskRunOptions`) as `X-Moss-Provider-Key`, for the task's model calls. They never send the client's `apiKey`, which is for `responses`, so without a key in the call no provider key is sent; an empty one rejects with `invalid_request_error` before any request. The other task calls never send it.
>
> **2026-11-10**
>
> v1.10.0
>
> **Changed**
>
> * `tasks.create` and `tasks.run` send the `apiKey` of their options (`TaskCreateOptions`, `TaskRunOptions`) as `X-Moss-Provider-Key`, for the task's model calls. They never send the client's `apiKey`, which is for `responses`, so without a key in the call no provider key is sent; an empty one rejects with `invalid_request_error` before any request. The other task calls never send it.
>
> **2026-11-10**
>
> v1.13.0
>
> **Changed**
>
> * `Moss.Inference.Tasks.create/3` and `run/3` take `:api_key`, and send only that call's key as `X-Moss-Provider-Key`, for the task's model calls. They never send the client's `:api_key`, which is for `Responses`, so without a key in the call no provider key is sent; an empty one is an `invalid_request_error` before any request. The other task calls never send it, and take no `:api_key`.
>
> **2026-11-10**
>
> v0.15.0
>
> **Changed**
>
> * `tasks.create` and `tasks.run` take `apiKey:`, and send only that call's key as `X-Moss-Provider-Key`, for the task's model calls. They never send the client's `apiKey`, which is for `responses`, so without a key in the call no provider key is sent; an empty one throws before any request. The other task calls never send it.
>
> Native runtime `sdkVersion`: `0.31.0`.
>
> **2026-11-10**
>
> v0.31.0
>
> **Changed**
>
> * `tasks.create` and `tasks.run` take `apiKey`, and send only that call's key as `X-Moss-Provider-Key`, for the task's model calls. They never send the client's `apiKey`, which is for `responses`, so without a key in the call no provider key is sent; a blank one throws `IllegalArgumentException` before any request. The other task calls never send it.
>
> **2026-11-10**
>
> v0.31.0
>
> **Changed**
>
> * `moss_inference_tasks_create` and `moss_inference_tasks_run` take `api_key` in their call options, and send only that call's key as `X-Moss-Provider-Key`, for the task's model calls. They never send the client's `api_key`, which is for `moss_inference_responses_create`, so without a key in the call options no provider key is sent; an empty one fails with `ERR_INVALID_ARG` before any request. No other task call sends it, and one given `api_key` fails with `ERR_INVALID_ARG`.
>
> **2026-11-07**
>
> v1.23.0
>
> **Added**
>
> * `MossInference.tasks` wraps the gateway's Tasks API: an agent reaches a goal in a browser within time and dollar limits. `create` queues a task from `goal`, `environment`, `output_schema`, `limits`, `model`, `effort` and `metadata`, and sends only the arguments given, so the gateway picks the defaults. `retrieve` and `cancel` return the `Task`, and `wait` polls it every `poll_interval` seconds (2 by default) until it is neither `queued` nor `running`, within `timeout`, and returns a `failed` task too. `run` creates a task and waits for it in one call. `trace` returns the agent's record, `files.list` a `TaskFileList`, and `files.content` a `TaskFileContent` with the bytes and `content_type`. `Task[T]` types `result.output`, and `TaskUsage.raw` keeps every field the gateway sends. `create` sends an `Idempotency-Key`, a new one per call or the one in that call's `extra_headers`, and the same one on every retry, so a retried create never starts a second task. Task calls never send `api_key`, and never retry a 409, which the files routes send until a task ends. `Task` has `files_expire_at`, when the gateway removes the trace and files. `InferenceError.task_id` names the task of an error of `wait` or `run`, so a task that `run` created can still be read or cancelled. `moss.inference.tasks` makes the same calls on a client built from the environment.
> * `MossInferenceSync` makes the `tasks` calls without an event loop. It runs them on an event loop in a daemon thread of its own, which `close()` or the end of `with` stops after cancelling the calls under way.
>
> **2026-11-07**
>
> v1.23.0
>
> **Added**
>
> * `MossInference.tasks`, typed by the `Tasks` interface, wraps the gateway's Tasks API: an agent reaches a goal in a browser within time and dollar limits. `create` queues a task from `TaskCreateParams` (`goal`, `environment`, `output_schema`, `limits`, `model`, `effort`, `metadata`) and sends only the fields given, so the gateway picks the defaults. `retrieve` and `cancel` return the `Task`, and `wait` polls it every `pollInterval` (2000 ms by default) until it is neither `queued` nor `running`, with `timeout` and `signal` in `TaskWaitOptions`, and resolves on `failed` too. `run` creates a task and waits for it in one call. `trace` returns the agent's record, `files.list` a `TaskFileList`, and `files.content` a `TaskFileContent` with the bytes and `contentType`. `Task<Output>` types `result.output`. `usage` (`TaskUsage`) keeps every field the gateway sends. `create` sends an `Idempotency-Key`, a new one per call or the one in that call's `headers`, and the same one on every retry, so a retried create never starts a second task. Task calls never send `apiKey`, and never retry a 409, which the files routes send until a task ends. `Task` has `files_expire_at`, when the gateway removes the trace and files. `InferenceError.taskId` names the task of an error of `wait` or `run`, so a task that `run` created can still be read or cancelled. `inference.tasks` is the `tasks` of a client built from the environment. See Browser tasks in the README.
>
> **Changed**
>
> * `responses.create` rejects a body number that JSON cannot carry, such as `NaN` or `Infinity`, with `invalid_request_error`, where it sent `null`.
>
> **2026-11-07**
>
> v1.9.0
>
> **Added**
>
> * `MossInference.tasks`, typed by the `Tasks` interface, wraps the gateway's Tasks API: an agent reaches a goal in a browser within time and dollar limits. `create` queues a task from `TaskCreateParams` (`goal`, `environment`, `output_schema`, `limits`, `model`, `effort`, `metadata`) and sends only the fields given, so the gateway picks the defaults. `retrieve` and `cancel` return the `Task`, and `wait` polls it every `pollInterval` (2000 ms by default) until it is neither `queued` nor `running`, with `timeout` and `signal` in `TaskWaitOptions`, and resolves on `failed` too. `run` creates a task and waits for it in one call. `trace` returns the agent's record, `files.list` a `TaskFileList`, and `files.content` a `TaskFileContent` with the bytes, ready for a `Blob`, and `contentType`. `Task<Output>` types `result.output`. `usage` (`TaskUsage`) keeps every field the gateway sends. Task calls go under the `baseURL` path when there is one, with the client's credentials, timeouts and retries, but never retry a 409, which the files of an unfinished task answer, and never send `apiKey`. `files_expire_at` on a `Task` is when the gateway removes its trace and files, 7 days after it ends, after which they reject with a 410 `files_expired`. Once the task exists, every `InferenceError` of `wait` and `run` names it in `taskId`. Each create sends an `Idempotency-Key`, a new one per call or the caller's in the call's `headers`, never one from the client's, and the same one on every retry. The gateway answers a repeated key with the same body, within 24 hours, with the task it created, so a retried create never starts a second task. To retry a create yourself, pass your own key. See Browser tasks in the README.
>
> **Changed**
>
> * `responses.create` rejects a body number that JSON cannot carry, such as `NaN` or `Infinity`, with `invalid_request_error`, where it sent `null`.
>
> **2026-11-07**
>
> v1.12.0
>
> **Added**
>
> * `Moss.Inference.Tasks` runs browser tasks: an agent works toward a goal in a browser on Moss, within time and dollar limits. `run/3` queues a task and returns it once it ends, and `create/3`, `retrieve/3`, `cancel/3`, `wait/3`, `trace/3` and `Moss.Inference.Tasks.Files.list/3` and `content/4` do each step. Each returns `{:ok, value}` or `{:error, %Moss.Inference.Error{}}`, and uses the client's credentials, `MOSS_INFERENCE_URL`, timeouts and retries, but never its `:api_key`, and no task call goes again after a 409, which the files of an unfinished task return.
> * `create/3` sends only the fields you give. Each create sends an `Idempotency-Key`, a new one per call or its `:idempotency_key` option, and the same one on every retry. The gateway answers a repeated key with the same body, within 24 hours, with the task it created, so a retried create never starts a second task. To retry a create yourself, pass your own key.
> * `wait/3` and `run/3` poll every `:poll_interval`, `2_000` ms by default, until the task is neither `queued` nor `running`, and return a `failed` or `cancelled` task as `{:ok, task}`. Their `:timeout` limits the wait, each poll included, and past it they return a `"timeout"` error while the task goes on. Once the task is queued, every error they return has its id in the `task_id` field of `Moss.Inference.Error`.
> * A task is a `Moss.Inference.Task` struct with `result`, `verification`, `usage` and `error` structs. `files_expire_at` is when the gateway removes the trace and files, 7 days after the task ends, after which they return a 410 `files_expired` error. `raw` holds the task as the gateway sent it, and `usage.raw` every usage field, such as `"browser_minutes"`. `Moss.Inference.Tasks.Files.content/4` returns a file's bytes and `content_type`, and never writes or opens the file.
>
> **2026-11-07**
>
> v0.14.0
>
> **Added**
>
> * `client.tasks` wraps the gateway's Tasks API: an agent reaches a goal in a browser within time and dollar limits. `run` creates a task and waits until it ends. `create` queues one from `goal`, `environment` (`.browser(startURL:liveView:)`), `outputSchema`, `limits` (`TaskLimits`), `model`, `effort` and `metadata`, and sends only the fields given, so the gateway picks the defaults. `retrieve` and `cancel` return the `MossTask`, and `wait` polls it every `pollInterval:` seconds, 2 by default, until it is neither `queued` nor `running`. `run` and `wait` take a `timeout:` for the whole wait and return a `failed` task too. `trace` returns the agent's record as `JSONValue`, `files.list` a `TaskFileList`, and `files.content` a `TaskFileContent` with the bytes and `contentType`. `TaskResult.decodeOutput(_:)` decodes `output` as your type. `TaskUsage` keeps every field the gateway sends in `raw`, and `MossTask.filesExpireAt` is when the gateway removes the trace and files, 7 days after the task ends, after which they throw a 410 `files_expired`. Each create sends an `Idempotency-Key`, a new one per call or `idempotencyKey:`, and the same one on every retry. The gateway answers a repeated key with the same body, within 24 hours, with the task it created, so a retried create never starts a second task. To retry a create yourself, pass your own key. Task calls retry as `responses` does but never after a 409, which the files of an unfinished task throw, and never send the provider key. Once the task exists, every `InferenceError` of `wait` and `run` names it in `taskId`. See Browser tasks in the README.
>
> Native runtime `sdkVersion`: `0.30.0`.
>
> **2026-11-07**
>
> v0.30.0
>
> **Added**
>
> * **Browser tasks.** `MossInference.tasks` gives an agent a goal to reach in a browser, within time and dollar limits. `run` creates a task and waits until it ends. `create` returns it `queued`, and `wait` polls it every `pollIntervalMs`, 2 s by default, within its own `timeoutMs`, and returns a `failed` or `cancelled` task too. `retrieve`, `cancel`, `trace`, `files.list` and `files.content` read or stop a task. `Task` types every field of the gateway's task and keeps the whole JSON in `raw`, and `filesExpireAt` is when the gateway removes its trace and files, 7 days after it ends, after which they throw a 410 `files_expired`. Each create sends an `Idempotency-Key`, a new one per call or `idempotencyKey`, and the same one on every retry. The gateway answers a repeated key with the same body, within 24 hours, with the task it created, so a retried create never starts a second task. To retry a create yourself, pass your own key. Task calls retry as `responses` does but never after a 409, which the files of an unfinished task throw, and never send `apiKey`. Once the task exists, every `InferenceError` of `wait` and `run` names it in `taskId`.
>
> **2026-11-07**
>
> v0.30.0
>
> **Added**
>
> * `moss_inference_tasks_create`, `moss_inference_tasks_run`, `moss_inference_tasks_retrieve`, `moss_inference_tasks_cancel`, `moss_inference_tasks_wait`, `moss_inference_tasks_trace`, `moss_inference_tasks_files_list` and `moss_inference_tasks_files_content` call the gateway's Tasks API, where an agent works toward a goal in a browser within time and dollar limits. Tasks go in and come back as JSON text. A create sends the request as given. Each create sends an `Idempotency-Key`, a new one per call or the `idempotency_key` of the call options, and the same one on every retry. The gateway answers a repeated key with the same body, within 24 hours, with the task it created, so a retried create never starts a second task. To retry a create yourself, pass your own key. Task calls go again as `moss_inference_responses_create` does, but never after a 409, which the files of an unfinished task return. A task's `files_expire_at` is when the gateway removes its trace and files, 7 days after it ends, after which they fail with a 410 `files_expired`. `moss_inference_tasks_run` creates a task and waits for it. It and `moss_inference_tasks_wait` poll every `poll_interval_ms`, 2000 by default, until the task is neither `queued` nor `running`, give each task to a `MossInferenceTaskFn` callback that can stop them, and fail with the type `timeout` past their `timeout_ms` without cancelling the task. Each poll takes the client's `timeout_ms`, or the time left in the wait when that is shorter. `moss_inference_tasks_files_content` returns a file's bytes, freed with the new `moss_free_bytes`, and its `Content-Type`. No task call sends `api_key`. `MOSS_INFERENCE_API_VERSION` is 4.
>
> **2026-11-06**
>
> **Changed**
>
> * **Moss Inference** searches only the indexes a call names, in `X-Moss-Indexes` or `indexes` in the Moss SDKs. A call that names no index is plain inference, with no search and no retrieval fee. It used to search every index of the project. See [Ground answers in your indexes](https://docs.moss.dev/docs/inference/retrieval.md).
>
> **2026-11-03**
>
> **Moss Inference beta**
>
> * New **Moss Inference** page and sidebar card. On the Developer plan, request private beta access, then share your invite link to move up the waitlist; the page shows your place and how many people joined through your link.
> * On paid plans, the page and card offer **Talk to an engineer**, and an invite page shares your link without a waitlist rank.
>
> **2026-11-02**
>
> v1.22.0
>
> **Changed**
>
> * **Breaking change:** `MossInference.responses.create` replaces `chat.completions.create`, in the shape of OpenAI's Responses API, and calls `/responses` under the base URL. It takes `input`, a string or a list of items, and `instructions` in place of `messages`, plus typed `max_output_tokens`. Function tools are flat. Without `stream=True` it returns a `Response`, whose `output` holds `ResponseOutputMessage`, `ResponseFunctionToolCall` and `McpCall` items and whose `output_text` joins the text. With it, it returns a `ResponseStream` of `ResponseStreamEvent`s, such as `response.output_text.delta`, that ends after `response.completed` or `response.incomplete`, and `get_final_response()` returns the whole response. A tool call's result goes back as a `function_call_output` item. Usage is a `ResponseUsage` with `input_tokens` and `output_tokens`. A `response.failed` or `error` event raises `InferenceError`, and once an `McpCall` has arrived every error has the code `failed_after_tool_call`. `moss.inference.responses.create` makes the same call on a client built from the environment.
> * Requires `inferedge-moss-core` 0.36.0.
> * Every request the native core makes, such as model and index downloads, control-plane calls, authentication, uploads and telemetry, sends a `moss-sdk/<version>` User-Agent.
>
> **Removed**
>
> * `chat.completions.create`, `ChatCompletionStream.get_final_completion()`, `ToolStep` and the chunk, choice, message, completion and logprob types.
>
> **Fixed**
>
> * On Linux, TLS no longer trusts emSign ECC Root CA - G3, which `webpki-roots` 1.0.10 drops after the private keys of eight eMudhra intermediate CAs were compromised. macOS and Windows use the system trust store.
>
> **2026-11-02**
>
> v1.22.0
>
> **Changed**
>
> * **Breaking change:** `MossInference.responses.create`, typed by the `Responses` interface, replaces `chat.completions.create`, in the shape of OpenAI's Responses API, and calls `/responses` under the base URL. It takes `input`, a string or a list of `ResponseInputItem`s (an `EasyInputMessage`, a `FunctionCallOutput` or an output item), and `instructions` in place of `messages`, plus typed `max_output_tokens`, `text`, `reasoning` and `metadata`. A function tool is flat (`FunctionTool`), and `tool_choice` names a function as `{ type: "function", name }`. Without `stream: true` it returns a `Response`, the `response` object of the stream's last event plus `output_text`, whose `output` holds `ResponseOutputMessage`, `ResponseFunctionToolCall`, `McpCall` and `ResponseReasoningItem` items. With it, it returns a `ResponseStream` of `ResponseStreamEvent`s, such as `response.output_text.delta`, that ends after `response.completed` or `response.incomplete`, and `finalResponse()` returns the whole response. The `output` items go back into `input` unchanged, followed by one `function_call_output` item per function call. Usage is a `ResponseUsage` with `input_tokens` and `output_tokens`. A `response.failed` or `error` event throws `InferenceError`, and once an `mcp_call` item has arrived every error has the `errorCode` `failed_after_tool_call`. `inference.responses.create` makes the same call on a client built from the environment.
> * Requires `@moss-js/moss-core` 0.37.0.
> * Every request the native core makes, such as model and index downloads, control-plane calls, authentication, uploads and telemetry, sends a `moss-sdk/<version>` User-Agent.
>
> **Removed**
>
> * `chat.completions.create`, the `ChatCompletions` namespace, `ChatCompletionStream` and its `finalChatCompletion()`, `ToolStep` with `moss_tool_step` and `moss_tool_steps`, and the chat types: `ChatCompletion`, `ChatCompletionChoice`, `ChatCompletionChunk`, `ChatCompletionChunkChoice`, `ChatCompletionChunkDelta`, `ChatCompletionChunkToolCall`, `ChatCompletionContentPart`, `ChatCompletionCreateParams` with its `Base`, `Streaming` and `NonStreaming` forms, `ChatCompletionLogprobs`, `ChatCompletionMessage`, `ChatCompletionMessageParam`, `ChatCompletionMessageToolCall`, `ChatCompletionTokenLogprob`, `ChatCompletionTool` and `CompletionUsage`.
>
> **Fixed**
>
> * On Linux, TLS no longer trusts emSign ECC Root CA - G3, which `webpki-roots` 1.0.10 drops after the private keys of eight eMudhra intermediate CAs were compromised. macOS and Windows use the system trust store.
>
> **2026-11-02**
>
> v1.8.0
>
> **Changed**
>
> * **Breaking change:** `MossInference.responses.create`, typed by the `Responses` interface, replaces `chat.completions.create`, in the shape of OpenAI's Responses API, and calls `/responses`, under the `baseURL` path when there is one. It takes `input`, a string or a list of `ResponseInputItem`s (an `EasyInputMessage`, a `FunctionCallOutput` or an output item), and `instructions` in place of `messages`, plus typed `max_output_tokens`, `text`, `reasoning` and `metadata`. A function tool is flat (`FunctionTool`), and `tool_choice` names a function as `{ type: "function", name }`. Without `stream: true` it returns a `Response`, the `response` object of the stream's last event plus `output_text`, whose `output` holds `ResponseOutputMessage`, `ResponseFunctionToolCall`, `McpCall` and `ResponseReasoningItem` items. With it, it returns a `ResponseStream` of `ResponseStreamEvent`s, such as `response.output_text.delta`, that ends after `response.completed` or `response.incomplete`, and `finalResponse()` returns the whole response. The `output` items go back into `input` unchanged, followed by one `function_call_output` item per function call. Usage is a `ResponseUsage` with `input_tokens` and `output_tokens`. A `response.failed` or `error` event throws `InferenceError`, and once an `mcp_call` item has arrived every error has the `errorCode` `failed_after_tool_call`. The proxy route in the README forwards to `/responses`.
>
> **Removed**
>
> * `chat.completions.create`, the `ChatCompletions` namespace, `ChatCompletionStream` and its `finalChatCompletion()`, `ToolStep` with `moss_tool_step` and `moss_tool_steps`, and the chat types: `ChatCompletion`, `ChatCompletionChoice`, `ChatCompletionChunk`, `ChatCompletionChunkChoice`, `ChatCompletionChunkDelta`, `ChatCompletionChunkToolCall`, `ChatCompletionContentPart`, `ChatCompletionCreateParams` with its `Base`, `Streaming` and `NonStreaming` forms, `ChatCompletionLogprobs`, `ChatCompletionMessage`, `ChatCompletionMessageParam`, `ChatCompletionMessageToolCall`, `ChatCompletionTokenLogprob`, `ChatCompletionTool` and `CompletionUsage`.
>
> **2026-11-02**
>
> v1.11.0
>
> **Changed**
>
> * **Breaking change:** `Moss.Inference.Responses.create(client, params, opts)` replaces `Moss.Inference.Chat.Completions.create/3`, in the shape of OpenAI's Responses API, and calls `/responses` under the base URL. `params` take `input`, a string or a list of items, and `instructions` in place of `messages`, plus `max_output_tokens`. Function tools are flat, and so is a `tool_choice` that names one. Without `stream: true` it returns `{:ok, response}`, the `"response"` map of the last event, whose `"output"` holds the `"message"`, `"function_call"` and `"mcp_call"` items as the model sent them, plus `"output_text"`, the text of its messages joined, and `"request_id"`. With it, it returns `{:ok, %Moss.Inference.ResponseStream{}}`, an `Enumerable` of event maps, such as `response.output_text.delta`, that ends after `response.completed` or `response.incomplete`, and `Moss.Inference.ResponseStream.close/1` ends one early. A tool call's result goes back as a `function_call_output` item, after the output items. Usage has `input_tokens` and `output_tokens`. A `response.failed` or `error` event raises `Moss.Inference.Error`, and once an `mcp_call` item has arrived every error has the code `"failed_after_tool_call"`. A stream that ends, or sends `[DONE]`, before its last event is an `incomplete_stream`.
> * Requires the `moss_core` 0.28.0 NIF.
> * Every request the native core makes, such as model and index downloads, control-plane calls, authentication, uploads and telemetry, sends a `moss-sdk/<version>` User-Agent.
>
> **Removed**
>
> * `Moss.Inference.Chat.Completions`, `Moss.Inference.ChatCompletionStream`, the joined `chat.completion` map with its choices, tool call joining and logprobs, and the `"moss_tool_step"` chunks and `"moss_tool_steps"` list.
>
> **Fixed**
>
> * On Linux, TLS no longer trusts emSign ECC Root CA - G3, which `webpki-roots` 1.0.10 drops after the private keys of eight eMudhra intermediate CAs were compromised. macOS and Windows use the system trust store.
>
> **2026-11-02**
>
> v0.13.0
>
> **Changed**
>
> * **Breaking change:** `client.responses.create` and `createStreaming` replace `chat.completions.create` and `createStreaming`, in the shape of OpenAI's Responses API, and call `/responses` under the base URL. They take `input`, a string or a list of `InputItem`s, and `instructions` in place of `messages`, plus `maxOutputTokens`. `Tool.function` is flat, and `ToolChoice.function(name)` sends `{"type": "function", "name": ...}`. `create` returns a `Response`, whose `output` holds `OutputItem`s (`.message`, `.functionCall`, `.mcpCall` or `.other`, each with its `raw` JSON) and whose `outputText` joins the text. `createStreaming` returns a `ResponseStream` of `ResponseStreamEvent`s, such as `response.output_text.delta`, that ends after `response.completed` or `response.incomplete`. An output item goes back into `input` as `InputItem(item)`, and a function call's result as `.functionCallOutput(callId:output:)`. `Usage` has `inputTokens`, `outputTokens`, `totalTokens`, `cachedTokens` and `reasoningTokens`. A `response.failed` or `error` event throws `InferenceError`, and once an `mcp_call` item has arrived every error has the code `failed_after_tool_call`.
> * Every request the native core makes, such as model and index downloads, control-plane calls, authentication, uploads and telemetry, sends a `moss-sdk/<version>` User-Agent.
>
> **Removed**
>
> * `chat.completions`, `ChatMessage`, `ChatCompletion`, `ChatCompletionChunk`, `ChatCompletionStream`, `ToolStep`, `CompletionUsage` with its token details, and the logprob types `ChoiceLogprobs` and `ChatCompletionTokenLogprob`.
>
> Native runtime `sdkVersion`: `0.29.0`.
>
> **2026-11-02**
>
> v0.29.0
>
> **Changed**
>
> * **Breaking change:** `MossInference.responses` replaces `chat.completions`, in the shape of OpenAI's Responses API, and calls `/responses` under the base URL. `create` and `createStreaming` take `input`, a list of `InputItem`s, in place of `messages`, plus `instructions` and `maxOutputTokens`, and come in a new argument order: `input`, `model`, the OpenAI arguments, the Moss options, `extra`, then the limits. `create` returns a `Response`, whose `output` holds `OutputItem.Message`, `OutputItem.FunctionCall`, `OutputItem.McpCall` and `OutputItem.Other` items and whose `outputText` joins the text. `createStreaming` returns a `ResponseStream` of `ResponseStreamEvent`s, such as `response.output_text.delta`, that ends after `response.completed` or `response.incomplete`. `Tool.function` is flat, and `ToolChoice.function` sends `{"type": "function", "name": ...}`. `InputItem.of(item)` sends an output item back with every field it came with, and `InputItem.functionCallOutput(callId, output)` answers a call. Usage is a `Usage` with `inputTokens` and `outputTokens`. A `response.failed` or `error` event throws `InferenceError`, and once an `OutputItem.McpCall` has arrived every error of the call has the code `failed_after_tool_call`.
> * Every request the native core makes, such as model and index downloads, control-plane calls, authentication, uploads and telemetry, sends a `moss-sdk/<version>` User-Agent.
>
> **Removed**
>
> * `chat.completions`, `ChatMessage`, `ChatCompletion`, `ChatCompletionChunk`, `ChatCompletionStream`, `ChatToolCall`, `ToolStep`, `ChoiceLogprobs`, `ChatCompletionTokenLogprob`, `CompletionUsage`, `CompletionTokensDetails` and `PromptTokensDetails`.
>
> **Fixed**
>
> * TLS no longer trusts emSign ECC Root CA - G3, which `webpki-roots` 1.0.10 drops after the private keys of eight eMudhra intermediate CAs were compromised.
>
> **2026-11-02**
>
> v0.29.0
>
> **Changed**
>
> * **Breaking change:** `moss_inference_responses_create` replaces `moss_inference_chat_completions_create`, in the shape of OpenAI's Responses API, and calls `/responses` under the base URL. The request JSON takes `input`, a string or a list of items, and `instructions` in place of `messages`, plus `max_output_tokens`, and function tools are flat. The callback, a `MossInferenceEventFn` in place of `MossInferenceChunkFn`, gets each Responses event as JSON, such as `response.output_text.delta`, and the stream ends after `response.completed` or `response.incomplete`. Without a callback, `out_json` gets the `response` of that last event, plus `request_id` when the reply has one, and it is NULL when a callback stopped the stream first. A function call's result goes back in `input` as a `function_call_output` item, after the `output` items as they came, whose `mcp_call` items give the model the earlier tool results. A `response.failed` or `error` event fails the call with its message and code, and once an `mcp_call` item has arrived every failure has the code `failed_after_tool_call`. Moss stores nothing: `store` is ignored, and `previous_response_id`, `background`, `include` and built-in tools fail with the code `unsupported_parameter`. The third argument is `call_options_json`, the name its error messages use. `MOSS_INFERENCE_API_VERSION` is 3.
> * Every request the library makes, such as model and index downloads, control-plane calls, authentication, uploads, telemetry and inference, sends a `moss-sdk/<version>` User-Agent.
>
> **Removed**
>
> * `moss_inference_chat_completions_create`, `MossInferenceChunkFn`, the chat completion JSON joined from the chunks with its `choices`, `logprobs` and `moss_tool_steps`, and the `moss_tool_step` chunks.
>
> **Fixed**
>
> * On Linux, TLS no longer trusts emSign ECC Root CA - G3, which `webpki-roots` 1.0.10 drops after the private keys of eight eMudhra intermediate CAs were compromised. macOS and Windows use the system trust store.
>
> **2026-11-02**
>
> v0.3.0
>
> **Added**
>
> * With no credentials, `moss index`, `moss doc` and `moss query` run in offline mode. They keep one index in `~/.moss/offline`, built from documents that carry their own `embedding`. The index opens only for the OS user and device that created it, in one process at a time, and the CLI does not run it on Kubernetes, AWS Lambda and similar server platforms.
> * `--offline` (or `MOSS_OFFLINE=1`) selects offline mode, even with credentials. In CI, missing credentials fail without it.
> * Offline mode sends anonymous usage counts: a random device id, a session id, the CLI version, and document and query counts. Nothing from the index leaves the device.
> * `moss index push <name>` uploads that index to your project, embeddings included.
> * `moss query --embedding` takes the query vector as a JSON array or the path of a file holding one, with or without an account.
>
> **Changed**
>
> * moss-cli carries a native module and ships one wheel per platform: Linux x86\_64 and aarch64, macOS arm64 and Windows x86\_64, where `moss` already installs. It has no source distribution, and a build from a checkout needs a Rust toolchain.
>
> **2026-11-02**
>
> v2.0.3
>
> **Changed**
>
> * Requires `inferedge-moss-core` 0.36.0, the core that `moss` 1.22.0 requires, so the two install together.
>
> **2026-11-02**
>
> **Credits**
>
> * The **Billing** page has a **Credits** card in place of Pay-As-You-Go: see your balance, buy credits (\$5 minimum), and set auto-reload. Only organization owners can buy credits or redeem promo codes.
> * When credits run out, usage pauses and the sidebar says **Add credits to continue**.
> * Credit purchases show on the **Invoices** page.
> * The **Usage** page shows inference tokens per model and inference retrievals.
>
> **2026-10-23**
>
> v1.21.0
>
> **Added**
>
> * `create` takes `tools`, `tool_choice` and `parallel_tool_calls` as typed arguments, sent only when given.
> * Tool calls keep every field the model sends, such as Gemini's `extra_content` with its thought signature. `raw` on `ChoiceDeltaToolCall` and `ChatCompletionMessageToolCall` holds them, and a reply message put back into `messages` sends them unchanged.
> * `moss.inference.McpServer` puts an MCP server in `tools`, and Moss runs its tools during the reply. Neither its `server_url` nor its `headers` show in a repr.
> * `ChatCompletionChunk.tool_step` and `ChatCompletion.tool_steps` hold each MCP tool call and result as a `ToolStep`.
> * `ChatCompletionStream.get_final_completion()` returns the whole reply as one `ChatCompletion`, joined from every chunk of the stream, the ones already read included.
> * Once a call has streamed a tool step, any error it raises has the code `failed_after_tool_call`, since a tool may have changed data.
> * `max_retries`, 2 by default, on `MossInference` or for one call of `create`, sends a call again when it fails before its reply starts: a connection failure, or a `408`, `409`, `429` or `5xx` response, unless its `x-should-retry` header says otherwise. The wait is the `Retry-After` in seconds when it is 60 or less, else 0.5 s doubled for each retry up to 8 s, and it counts against `timeout`. A stream that fails after it started is never retried.
> * `create(cache=False)` always asks the model, never Moss's reply cache.
> * `request_id` on `ChatCompletionStream` and `ChatCompletion` holds the `X-Moss-Request-Id` of the reply, or `None`.
> * `logprobs` on each choice of a chunk and of a `ChatCompletion`, as a `ChoiceLogprobs`. A joined choice's `content` and `refusal` lists are those of its chunks, in order. `CompletionUsage` has `completion_tokens_details` and `prompt_tokens_details`.
>
> **Changed**
>
> * `load_indexes` runs up to eight loads at once instead of one after another, so many indexes load in about the time of the slowest few. A name listed twice loads once.
> * `load_index` on an index that is already loaded checks the cloud version first. An unchanged copy stays loaded with no download or parse, and a changed one is swapped in without interrupting queries. Either way the call's `auto_refresh` and polling options replace the current ones.
> * Auto-refresh polls a loaded index first at a random point of its first interval, then every interval give or take 10%, so indexes loaded together no longer poll together.
> * On Linux with glibc, `unload_index`, `unload_indexes`, `close`, each refresh or reload that installs a newer version, and a `SessionIndex` that swaps in a refreshed version or is deleted hand the freed memory back to the operating system, so a long-running process shrinks when it unloads indexes. glibc used to keep those pages until something called `malloc_trim`, and each refresh left the replaced version resident.
>
> **Fixed**
>
> * `indexes=[]` searches no index. Leaving `indexes` out still searches every index of the project.
> * Tool call pieces with no `index` no longer merge parallel calls into one. A piece joins the call with its `id`. A new `id` starts the next call, unless the latest call has no id yet and takes it. A piece with no `id` joins the latest call.
> * A joined reply message always has `content`: its text, else `None` when it has tool calls and `""` when it has none. Put back into `messages`, it keeps that `content`.
>
> **2026-10-23**
>
> v1.21.0
>
> **Added**
>
> * Tool calls keep every field the model sends, such as Gemini's `extra_content` with the thought signature that Gemini 3 needs back. A non-streaming call joins the pieces of each call with those fields, so pushing the reply message into `messages` sends each call back unchanged. `tools`, `tool_choice` and `parallel_tool_calls` are typed and documented.
> * `ChatCompletionStream.finalChatCompletion()` joins a stream into one completion, as a call without `stream: true` returns, so a streamed reply with tool calls can go back into `messages`.
> * `McpServer` entries in `tools` let the gateway call an MCP server's tools during the turn. Each tool step arrives as a chunk's `moss_tool_step` (`ToolStep`), and a non-streaming completion lists them in `moss_tool_steps`. `InferenceErrorType` names `capacity` and `mcp_error`. Once a step has arrived, every error of that call has the `errorCode` `failed_after_tool_call`. See the Inference section of the README.
> * `maxRetries` on the client and on each call, 2 by default and `0` for none. A connection that fails, or a 408, 409, 429 or 5xx response, before the stream starts is sent again after its `Retry-After` of up to 60 seconds, or else after a backoff of 0.5 s doubling up to 8 s with jitter. A response's `x-should-retry` forbids or forces a retry, the waits count against `timeout`, and an abort ends a wait at once. A stream that started is never retried, and after the last attempt the last error throws unchanged.
> * `cache: false` among the parameters sends `X-Moss-Cache: off`, so the gateway asks the model instead of answering an identical request from its reply cache.
> * `ChatCompletionStream.requestId` and a completion's `requestId` hold the response's `X-Moss-Request-Id`. On the completion it is not enumerable, so `JSON.stringify` gives the wire shape.
>
> **Changed**
>
> * `loadIndexes` runs up to eight loads at once instead of one after another, so many indexes load in about the time of the slowest few. A name listed twice loads once.
> * `loadIndex` on an index that is already loaded checks the cloud version first. An unchanged copy stays loaded with no download or parse, and a changed one is swapped in without interrupting queries. Either way the call's `autoRefresh` and polling options replace the current ones.
> * Auto-refresh polls a loaded index first at a random point of its first interval, then every interval give or take 10%, so indexes loaded together no longer poll together.
> * On Linux with glibc, `unloadIndex`, `unloadIndexes`, `close`, each refresh or reload that installs a newer version, and a `SessionIndex` that swaps in a refreshed version or is freed hand the freed memory back to the operating system, so a long-running process shrinks when it unloads indexes. glibc used to keep those pages until something called `malloc_trim`, and each refresh left the replaced version resident.
>
> **Fixed**
>
> * `indexes: []` skips the search, as `retrieve: false` does, instead of searching every index.
> * A completion's choices keep `logprobs`, each key holding the tokens of every chunk in order, or `null` when no chunk had any. `ChatCompletionChunkChoice` types `logprobs`, and `CompletionUsage` types `completion_tokens_details` and `prompt_tokens_details`, which `usage` keeps as the gateway sent them.
> * Parallel tool calls whose pieces carry no `index` stay apart. Such a piece joins the call of its choice with the same `id`. A piece with a new `id` starts a new call, unless the latest call has no id yet and takes it, and a piece with no `id` joins the latest call.
> * A completion's message always has `content`: the text, or with no text `null` when the model called tools and `""` otherwise, so the message goes back into `messages` whole.
>
> **2026-10-23**
>
> v1.7.0
>
> **Added**
>
> * `tools`, `tool_choice` and `parallel_tool_calls` are typed, documented parameters of `chat.completions.create`. A call without `stream: true` joins each tool call as the gateway does and keeps fields beyond OpenAI's, such as Gemini's `extra_content`, so pushing the reply message onto `messages` sends every call back unchanged. The README's Tool calls section shows the loop.
> * `ChatCompletionStream.finalChatCompletion()` joins a stream into one completion, as a call without `stream: true` returns, so a streamed reply with tool calls can go back onto `messages`.
> * MCP servers: a `tools` entry of type `mcp`, typed `McpServer`, asks the gateway to call that server for the model during the turn. Chunks carry each tool step as `moss_tool_step`, typed `ToolStep`, and a completion lists them in `moss_tool_steps`. Once a step has arrived, any failure of the call carries `errorCode` `failed_after_tool_call`, since a tool may have changed data. `InferenceErrorType` names `capacity` and `mcp_error`.
> * `maxRetries` on the client and on each call, 2 by default and `0` for none. A connection that fails, or a 408, 409, 429 or 5xx response, before the stream starts is sent again after its `Retry-After` of up to 60 seconds, or else after a backoff of 0.5 s doubling up to 8 s with jitter. A response's `x-should-retry` forbids or forces a retry, the waits count against `timeout`, and an abort ends a wait at once. A stream that started is never retried, and after the last attempt the last error throws unchanged.
> * `cache: false` among the parameters sends `X-Moss-Cache: off`, so the gateway asks the model instead of answering an identical request from its reply cache.
> * `ChatCompletionStream.requestId` and a completion's `requestId` hold the response's `X-Moss-Request-Id`. On the completion it is not enumerable, so `JSON.stringify` gives the wire shape.
>
> **Fixed**
>
> * `indexes: []` skips the search, as `retrieve: false` does, instead of searching every index.
> * A completion's choices keep `logprobs`, each key holding the tokens of every chunk in order, or `null` when no chunk had any. `ChatCompletionChunkChoice` types `logprobs`, and `CompletionUsage` types `completion_tokens_details` and `prompt_tokens_details`, which `usage` keeps as the gateway sent them.
> * Parallel tool calls whose pieces carry no `index` stay apart. Such a piece joins the call of its choice with the same `id`. A piece with a new `id` starts a new call, unless the latest call has no id yet and takes it, and a piece with no `id` joins the latest call.
> * A completion's message always has `content`: the text, or with no text `null` when the model called tools and `""` otherwise, so the message goes back onto `messages` whole.
>
> **2026-10-23**
>
> v1.10.0
>
> **Added**
>
> * `Moss.Inference.McpServer` is an MCP server for `tools`: Moss calls its tools during the turn. It encodes to `{"type": "mcp", ...}` without its `nil` fields, and `inspect/2` leaves out `server_url` and `headers`.
> * A chunk with `"moss_tool_step"` reports an MCP call before and after it runs, and a reply without `stream` lists them in `"moss_tool_steps"`. Any failure after a step has code `"failed_after_tool_call"`, since a tool may have changed data.
> * `tools`, `tool_choice` and `parallel_tool_calls` are documented in `t:Moss.Inference.Chat.Completions.params/0`.
> * `:max_retries` on `Moss.Inference.new/3` and on each call, default `2`, `0` for none. A call whose connection fails before the reply's headers, or that gets a 408, 409, 429 or 5xx reply, is sent again after the reply's `Retry-After` seconds when they are 60 or fewer, else after 0.5 s doubled each time up to 8 s, less up to 25%. The waits count against `:timeout`, a wait that would pass it is not taken, and a reply's `x-should-retry` header of `false` forbids a retry and `true` forces one. A stream that started is never sent again. After the last attempt the last error returns unchanged.
> * `cache: false` on a call sends `X-Moss-Cache: off`, so Moss always asks the model instead of its reply cache.
> * `stream.request_id` and a joined reply's `"request_id"` are the reply's `X-Moss-Request-Id` header, else `nil`.
>
> **Changed**
>
> * `indexes: []` searches no index and sends `X-Moss-Retrieve: off`. Leaving `:indexes` out still searches every index.
> * Each choice of a reply without `stream` has `"logprobs"`: `nil` when no chunk sent any, else `"content"` and `"refusal"`, each the chunks' lists joined in order, or `nil` when no chunk sent that key. Its `"usage"` keeps every field the gateway sent, such as `"completion_tokens_details"`.
> * A tool call piece without an `"index"` joins the call of its choice that has its `"id"`, else the most recent call. A new id starts a new call instead when that call has an id already. Parallel calls sent without an index stay separate, even when their pieces interleave.
> * The message of a reply without `stream` always has `"content"`: the text, else `nil` when it has tool calls and `""` when it has none, so it goes back in `messages` as it is.
> * A reply without `stream` keeps every field of each tool call the model sent, such as Gemini's `extra_content`, joined the way Moss joins them, so a reply's message appended to `messages` sends them back unchanged. A call without an id or a name has `""` for it, not `nil`.
> * `params` that give one key twice at any depth, such as `:content` and `"content"`, return an `invalid_request_error`, since JSON would send that key twice.
> * On Linux with glibc, `unload_index/2`, `unload_indexes/2`, `close/1`, each refresh or reload that installs a newer version, and a session that swaps in a refreshed version or is freed hand the freed memory back to the operating system, so a long-running node shrinks when it unloads indexes. glibc used to keep those pages until something called `malloc_trim`.
>
> **2026-10-23**
>
> v0.12.0
>
> **Added**
>
> * **Tool calls.** `create` and `createStreaming` take `tools`, `toolChoice` and `parallelToolCalls`. `ChatMessage(message)` sends a reply back with every field of its tool calls, and `.tool(callId:content:)` sends a call's result. `ToolChoice.never` sends `none`, and `.raw` any other object.
> * **MCP servers.** `Tool.mcp(McpServer)` attaches a server the gateway calls, with its steps in `chunk.toolStep` and `completion.toolSteps` and code `failed_after_tool_call` once a step arrived.
> * **Retries.** `maxRetries` (2 by default, on the client and per call) sends a call again after a connection failure or a 408, 409, 429 or 5xx status, before its stream starts. It waits a `Retry-After` of up to 60 seconds, else a backoff of up to 8 seconds.
> * **Logprobs and usage details.** Chunk and completion choices carry `logprobs`, joined in order by `create`, and `CompletionUsage` keeps every field in `raw`, with `completionTokensDetails` and `promptTokensDetails`.
> * **Request id.** `ChatCompletionStream.requestId` and `ChatCompletion.requestId` hold the `X-Moss-Request-Id` of a call that succeeded.
> * **Reply cache switch.** `cache: false` sends `X-Moss-Cache: off`, so the model always answers.
>
> **Changed**
>
> * `indexes: []` skips the search and leaving `indexes` out searches every index.
>
> **Fixed**
>
> * A tool call piece with no `index` joins the call with its `id`, so parallel and interleaved calls stay apart and a call whose id comes late stays one call, in `create` and in each chunk piece's `index`.
> * A reply with no text and no tool calls has `content` `""`, so it goes back into `messages` intact.
>
> Native runtime `sdkVersion`: `0.28.0`.
>
> **2026-10-23**
>
> v0.28.0
>
> **Added**
>
> * **Tool calls.** `create` and `createStreaming` take `tools` (`Tool.function`, `Tool.mcp`, `Tool.raw`), `toolChoice` (`ToolChoice.raw` for any JSON object) and `parallelToolCalls`, which win over the same keys in `extra`. `create` keeps every field of a tool call, such as Gemini's `extra_content`, so `ChatMessage.assistant(message)` sends the reply back unchanged, and `ChatMessage.tool(callId, content)` answers a call.
> * **MCP servers.** `Tool.mcp(McpServer(...))` lets the gateway call an MCP server's tools, and `McpServer.toString()` shows neither the URL nor a header. `ChatCompletionChunk.toolStep` and `ChatCompletion.toolSteps` carry the tool steps, after which every `InferenceError` of the call has the code `failed_after_tool_call`.
> * **Retries.** `maxRetries` on the client and on a call, 2 by default and 0 for none, sends a call again after a failed or lost connection or a 408, 409, 429 or 5xx before its stream starts, waiting for a `Retry-After` of up to 60 seconds, else a backoff, within `timeoutMs`. A read timeout while waiting for the response headers is not retried. `x-should-retry` forbids or forces a retry, and an interrupt ends the call with its last error.
> * `cache = false` sends `X-Moss-Cache: off`, so the model answers instead of the reply cache.
> * `ChatCompletionStream.requestId` and `ChatCompletion.requestId` carry the `X-Moss-Request-Id` of a call that succeeded.
> * `logprobs` on each chunk choice and joined choice (`ChoiceLogprobs`), and `completionTokensDetails` and `promptTokensDetails` on `CompletionUsage`.
> * `AppStatus.providerTimeMs` is the part of an app's `timeMs` its provider spent before encoding its reply, so the rest is reaching the app and carrying the reply. It is `null` when the provider runs 0.27.0 or older.
> * `CrossAppOptions.providerHoldMs`, off by default, keeps a provider that answers `OK` connected that long after its last answer, so a search in that time skips the system's provider lookup and finds the provider awake, and its process keeps the searching app's priority until then. Opting in with `CrossAppOptions.DEFAULT_PROVIDER_HOLD_MS` holds a provider for 5 s, and any other positive value is allowed. Any other outcome disconnects it at once.
>
> **Changed**
>
> * `cache` comes right after `retrieve`, and `tools`, `toolChoice` and `parallelToolCalls` right after `extra`, so a Java caller that passes `apiKey` or a later argument by position now passes those first, and Kotlin code built against 0.27.0 that calls `create` or `createStreaming` must be rebuilt.
> * `create` gives a tool call that arrived without an `id` or function `name` an empty string there, not `null`.
> * `indexes = emptyList()` skips the search and sends no indexes. Leave `indexes` out, now `null` by default, to search every index.
>
> **Fixed**
>
> * `create` keeps parallel tool calls that arrive without an `index` apart: such a piece joins the call with the same `id`. A piece with no `id` joins the call of the latest piece, and so does one with a new `id` while that call has none; any other new `id` starts a new call.
> * The joined message always has `content`: `null` beside tool calls and `""` when nothing came, so `ChatMessage.assistant(message)` sends it back whole.
>
> **2026-10-23**
>
> v0.28.0
>
> **Added**
>
> * `moss_inference_chat_completions_create` takes MCP servers in `tools`, as `{"type": "mcp", "server_label", "server_url"}` with optional `headers`, `allowed_tools` and `transport`. The completion lists each chunk's `moss_tool_step` in `moss_tool_steps`, and a failure after a step has the code `failed_after_tool_call`. `libmoss.h` documents `tools`, `tool_choice` and `parallel_tool_calls`.
> * `max_retries` in the client and call options, 2 unless set. A call goes again after a connection failure or a 408, 409, 429 or 5xx, before any of the reply is read, waiting the `Retry-After` in delta-seconds when it is 60 s or less, else 0.5 s doubled per retry up to 8 s, less up to 25%. `x-should-retry` from the gateway forbids or forces a retry, a wait that would pass `timeout_ms` ends the call with that failure, and the last failure is the call's error. A stream that fails after it started is never retried. 0 turns retries off.
> * `"cache": false` in the request JSON sends `X-Moss-Cache: off`, so the gateway asks the model rather than answering from its reply cache.
> * The completion JSON has `request_id`, the reply's `X-Moss-Request-Id`, or null without one.
>
> **Changed**
>
> * `MOSS_INFERENCE_API_VERSION` is 2, which marks a header whose inference calls keep every tool call field, list `moss_tool_steps`, report `failed_after_tool_call`, take `max_retries` and `cache`, turn retrieval off for an empty `indexes` and return `request_id`.
> * On Linux with glibc, `moss_client_unload_index`, `moss_client_unload_indexes`, `moss_client_release_memory`, `moss_client_free`, each refresh or reload that installs a newer version, and a session that swaps in a refreshed version or is freed hand the freed memory back to the operating system. glibc used to keep those pages until something called `malloc_trim`.
>
> **Fixed**
>
> * The completion's tool calls keep every field the model sent, such as Gemini's `extra_content`, merged as the gateway merges them, so the message JSON sent back in `messages` carries them unchanged. They used to keep only `id`, `type` and the function's `name` and `arguments`. A call sent without an `id` has an empty one, not `null`.
> * `"indexes": []` turns retrieval off and sends no `X-Moss-Indexes`. It used to search every index.
> * Each completion choice has `logprobs`: null when no chunk of it had any, else `content` and `refusal`, each the chunks' arrays joined in order.
> * A tool call piece without an `index` joins the call with its `id`, else the most recent call, unless the piece and that call both have an id, and then it starts the next call. Parallel calls sent without an `index` stay apart, even when their pieces alternate, and a call whose `id` comes on its second piece stays one call. They used to join by their position in each chunk.
> * The completion message of a reply without text has `content` null when it has tool calls and `""` when it has none, so it goes back in `messages` as it is. An empty reply used to have `null`.
>
> **2026-10-23**
>
> v2.0.2
>
> **Changed**
>
> * Requires `inferedge-moss-core` 0.35.0, the core that `moss` 1.21.0 requires, so the two install together. 2.0.1 required 0.32.0, which conflicts with `moss` 1.19.0 and later.
>
> **Fixed**
>
> * The README, the LiveKit example and the package docstrings said that indexes loaded in `prewarm` are shared by every room a process handles. LiveKit runs each call in its own process by default and runs `prewarm` once in each new process, which must finish within `initialize_process_timeout` (10 seconds by default), so those indexes serve one call. The README shows how to share one `MossAgent` across calls that run as threads of one process.
>
> **2026-10-22**
>
> v1.20.0
>
> **Added**
>
> * `MossInference(project_id, project_key)` answers chat messages with facts from your Moss indexes. `await client.chat.completions.create(...)` takes the arguments of OpenAI's `chat.completions.create` plus `indexes` and `retrieve`, and returns a `ChatCompletionStream` of `ChatCompletionChunk` with `stream=True`, else one `ChatCompletion`, with OpenAI's field names. `model` is `"moss"` by default. `api_key`, on the client or for one call of `create`, is optional: your own OpenAI, Anthropic or Google key, for a vendor model such as `gpt-4o-mini`. `moss` ignores it, and a vendor model without one is refused. The client also takes `timeout` for a whole call, `idle_timeout` for each wait for data or a free connection (120 seconds by default or when `None`), and `default_headers`. A timeout of 0 or less is off. `create` can change the key and both timeouts for one call, and `None` there keeps the client's. The client checks its arguments when built, keeps one connection pool, and closes it with `close()` or `async with`. Failures raise `moss.inference.InferenceError` with `status`, `type` and `message`, and, once the service has answered, its `request_id`, error `code` and `retry_after` in seconds. A redirect is one of those failures, so credentials never reach another URL. Calls go to `https://inference.moss.dev/v1`, or to the base URL in `MOSS_INFERENCE_URL`, which a client reads when built. `moss.inference.chat.completions.create` makes the same call on a client built from `MOSS_PROJECT_ID`, `MOSS_PROJECT_KEY` and `MOSS_INFERENCE_URL`.
>
> **Changed**
>
> * Requires `httpx`, which `moss.inference` streams replies with, along with `h11` 0.16 or later and `anyio` 4.14.2 or later, the first releases of each without published advisories.
> * Requires `inferedge-moss-core` 0.34.0. Every native object shares one process-wide async runtime instead of starting its own 18 threads, so a process keeps the same few threads however many clients and sessions it opens. `MOSS_TOKIO_WORKER_THREADS` sets its worker count, by default the number of CPU cores, at least 2 and at most 4, and a forked child builds its own. The background flush a dropped object starts runs to the end.
> * A `429` with the code `USAGE_LIMIT_EXCEEDED`, which Moss sends while a project is paused, fails on the first response with the code `UNAUTHORIZED` and the message "The project's usage limit has been reached; billing must be updated before it can be used.", instead of retrying for about 90 seconds and failing with `NETWORK`. A cold start with a committed snapshot on disk fails the same way rather than serving the snapshot. Any other `429` still retries.
>
> **2026-10-22**
>
> v1.20.0
>
> **Added**
>
> * `MossInference` answers OpenAI's `chat.completions.create` through the Moss inference gateway, which adds what it finds in the `indexes` you pass to the prompt. `new MossInference(projectId, projectKey, { apiKey, timeout, idleTimeout, headers })` checks its arguments when it is built, and `client.chat.completions.create(params, { apiKey, signal, timeout, idleTimeout, headers })` takes OpenAI's parameters plus `indexes` and `retrieve`, with `model` set to `"moss"` when it is left out. With `stream: true` it returns a `ChatCompletionStream` of `ChatCompletionChunk`s, and otherwise one `ChatCompletion`. `apiKey` is optional: your own OpenAI, Anthropic or Google key, for a vendor model such as `gpt-4o-mini`. `moss` ignores it, and a vendor model without one is refused. A call's `apiKey` wins over the client's, and an empty one is an error, as is `apiKey` or `api_key` among the parameters. Neither the client's nor a call's `headers` can set `Host`, `Content-Length` or `Transfer-Encoding`. `idleTimeout` limits the wait for response headers or for more of the body, 120 seconds by default. The client does not follow redirects. A client built with `MOSS_INFERENCE_URL` set calls that gateway instead of production, and a `baseURL` or `baseUrl` option is an error. `inference.chat.completions.create` uses a client built from `MOSS_PROJECT_ID`, `MOSS_PROJECT_KEY` and `MOSS_INFERENCE_URL`. Failures throw `InferenceError`, which carries a Moss `code` that `isMossError` accepts, and the gateway's `errorCode`, the `requestId` and `retryAfter` in milliseconds when the response has them. See the Inference section of the README.
>
> **Changed**
>
> * Requires `@moss-js/moss-core` 0.35.0. A `429` with the code `USAGE_LIMIT_EXCEEDED`, which Moss sends while a project is paused, fails on the first response with the code `UNAUTHORIZED` and the message "The project's usage limit has been reached; billing must be updated before it can be used.", instead of retrying for about 90 seconds and failing with `NETWORK`. A cold start with a committed snapshot on disk fails the same way rather than serving the snapshot. Any other `429` still retries.
>
> **2026-10-22**
>
> v1.6.0
>
> **Added**
>
> * `MossInference` answers OpenAI's `chat.completions.create` through the Moss inference gateway, which adds what it finds in the `indexes` you pass to the prompt. `new MossInference(projectId, projectKey, { baseURL, apiKey, timeout, idleTimeout, headers })` checks its arguments when it is built, and `client.chat.completions.create(params, { apiKey, signal, timeout, idleTimeout, headers })` takes OpenAI's parameters plus `indexes` and `retrieve`, with `model` set to `"moss"` when it is left out. With `stream: true` it returns a `ChatCompletionStream` of `ChatCompletionChunk`s, and otherwise one `ChatCompletion`, with the types of `@moss-js/moss`. The client calls the Moss inference gateway, unless `baseURL` names a path on the page's origin, such as `/moss/v1`; any other `baseURL` throws. Each call resolves that path against the page's URL, so a client built during server rendering works in the browser, and a call without an http or https page throws `InferenceError`. With such a path, `null` for both credentials sends no `Authorization` header, for a route on your server that adds it, since a project key in page code is visible to every visitor; the Inference section of the README shows that route, which passes `Retry-After` and `X-Moss-Request-Id` back to the page. `apiKey` is optional: your own OpenAI, Anthropic or Google key, for a vendor model such as `gpt-4o-mini`. `moss` ignores it, and a vendor model without one is refused. A call's `apiKey` wins over the client's, and an empty one is an error, as is `apiKey` or `api_key` among the parameters. `idleTimeout` limits the wait for response headers or for more of the body, 120 seconds by default. Failures throw `InferenceError`, which carries the gateway's `errorCode`, the `requestId` and `retryAfter` in milliseconds when the response has them and the page can read them. A redirect is not followed: it throws `InferenceError`, with no `status` in a browser, which hides the redirect. A browser reports a stream cut off mid-reply as a network error, so that fails as `connection_error` rather than `incomplete_stream`. The package declares `"sideEffects": false`, so a bundle that imports only `MossInference` leaves out the WASM client and ONNX Runtime code, though Vite still copies their `.wasm` files into the build output.
>
> **Changed**
>
> * Requires `@moss-dev/moss-wasm` 0.18.2. A `429` with the code `USAGE_LIMIT_EXCEEDED`, which Moss sends while a project is paused, rejects on the first response with the code `UNAUTHORIZED` and the message "The project's usage limit has been reached; billing must be updated before it can be used.", instead of retrying for about 90 seconds and failing with `NETWORK`. A cold start with a committed snapshot on disk fails the same way rather than serving the snapshot. Any other `429` still retries.
>
> **2026-10-22**
>
> v1.9.0
>
> **Added**
>
> * `Moss.Inference` is a client for OpenAI's chat completions call, answered by Moss inference at `https://inference.moss.dev/v1`, which searches the indexes named in `:indexes` and adds what it finds to the prompt. The `MOSS_INFERENCE_URL` environment variable sets another base URL, read when a client is built. `Moss.Inference.new(project_id, project_key, opts)` returns a `%Moss.Inference{}` and raises `Moss.Inference.Error` for an empty credential or key, a project id with `:`, a credential or key that is not printable ASCII or starts or ends with a space or tab, a bad timeout, or a `MOSS_INFERENCE_URL` that is not an `http` or `https` URL with a host and no user info, query or fragment, in an error that names the variable and never its value. An unknown option raises `ArgumentError`, which names the option and never its value. It takes `:api_key`, optional, your own OpenAI, Anthropic or Google key, for a vendor model such as `gpt-4o-mini`: `moss` ignores it, and a vendor model without one is refused. It also takes `:timeout`, milliseconds for a whole call (default `:infinity`), and `:idle_timeout`, milliseconds Moss may stay silent before the reply headers or between two parts of the body (default `120_000`, `:infinity` disables it). `inspect/2` leaves out the keys.
> * `Moss.Inference.Chat.Completions.create(client, params, opts)` sends the call. `params` is the OpenAI request body, with atom or string keys, and without `model` the call sends `"model" => "moss"`. `opts` takes `:indexes`, `:retrieve`, and `:api_key`, `:timeout` and `:idle_timeout` over the client's. `params` that hold one of these options, or `apiKey`, as an atom or string key, return an `invalid_request_error` that names the option and never its value. A provider key goes in a header, never in the body or an error, and an empty one, or one that starts or ends with a space or tab, is an error. A client that is not a `%Moss.Inference{}`, params that are not a map or an unknown option raises `ArgumentError`, which holds no key. With `stream: true` it returns `{:ok, %Moss.Inference.ChatCompletionStream{}}`, an `Enumerable` of chunk maps that raises `Moss.Inference.Error` if the reply fails after it starts. Without it, it returns `{:ok, completion}`, the whole reply as one `chat.completion` map with tool call arguments joined. A failure before the reply starts returns `{:error, %Moss.Inference.Error{}}` with `status`, `type` and `message`, `code`, the gateway's `error.code` as text, `request_id`, the reply's `X-Moss-Request-Id` header, and `retry_after`, an error reply's `Retry-After` header in milliseconds. A failure after the reply's headers carries the same `request_id`, and an error event its `code`. A redirect is an error with its status, never followed. An error reply that is not JSON has its body, on one line and cut to 300 characters, as the message. A reply that ends before `[DONE]`, or a connection reset mid-reply, is an `incomplete_stream`, an event or line over 1 MiB a `server_error`, and a silent reply a `timeout`. `Moss.Inference.ChatCompletionStream.close/1`, from any process, ends a stream without an error.
> * Inference calls reuse idle connections, from any process, in a pool the `:moss` application starts. A reply read to its end gives its connection back, and a stream that stops early, fails or times out closes its own, as does a process that dies mid-stream. No call is sent twice: a pooled connection found closed is replaced before the call is written to it. A call never waits for the pool past its `:timeout`, and one that gets a pooled connection too late gives it back unused. The pool keeps up to 100 idle connections, each for at most 4 seconds. Without the `:moss` application running, each call opens its own connection.
>
> **Changed**
>
> * The SDK depends on `jason` directly, and on `mint` 1.11 or later, the HTTP client the inference client uses. Earlier `mint` releases, and the `hpax` releases they allow, have published security advisories.
> * Requires the `moss_core` 0.26.0 NIF. A `429` with the code `USAGE_LIMIT_EXCEEDED`, which Moss sends while a project is paused, fails on the first response with the code `:unauthorized` and the message "The project's usage limit has been reached; billing must be updated before it can be used.", instead of retrying for about 90 seconds and failing with `:network`. A cold start with a committed snapshot on disk fails the same way rather than serving the snapshot. Any other `429` still retries.
>
> **2026-10-22**
>
> v0.11.0
>
> **Added**
>
> * **Inference.** `MossInference(projectId:projectKey:apiKey:timeout:idleTimeout:)` is a client for the Moss inference gateway, which searches your indexes and answers in the shape of OpenAI's chat completions. `client.chat.completions.create` returns a `ChatCompletion` and `createStreaming` a `ChatCompletionStream` of `ChatCompletionChunk`. `model` defaults to `"moss"`. Failures throw `InferenceError`, which carries the gateway's `code`, the call's `requestId` and the `retryAfter` seconds of a `Retry-After` header, and the client checks its credentials when created. `apiKey` is optional. Your own OpenAI, Anthropic or Google key, for a vendor model such as `gpt-4o-mini`. `moss` ignores it, and a vendor model without one is refused. A call's `apiKey` replaces the client's. `MOSS_INFERENCE_URL` sets the base URL it calls, and the client reads it when it is created. A value that is not an `http` or `https` URL with a host and no user info, query or fragment makes `init` throw `InferenceError` with type `invalid_request_error`. `idleTimeout` (120 seconds by default) ends a call when the gateway goes silent. An event or a line over 1 MiB fails the stream with a `server_error`. A redirect is not followed.
>
> **Changed**
>
> * A `429` with the code `USAGE_LIMIT_EXCEEDED`, which Moss sends while a project is paused, throws on the first response with a `MossError` whose code is `MossError.unauthorized` and the message "The project's usage limit has been reached; billing must be updated before it can be used.", instead of retrying for about 90 seconds and failing with `MossError.network`. A cold start with a committed snapshot on disk fails the same way rather than serving the snapshot. Any other `429` still retries.
>
> Native runtime `sdkVersion`: `0.27.0`.
>
> **2026-10-22**
>
> v0.27.0
>
> **Added**
>
> * **Inference.** `MossInference(projectId, projectKey, apiKey, timeoutMs, idleTimeoutMs)` calls the Moss inference gateway with OpenAI's chat completion shape. `chat.completions.createStreaming` returns a `ChatCompletionStream` of `ChatCompletionChunk`s, `create` joins them into one `ChatCompletion`. Both take `messages` first, and `model` is `moss` unless a call passes another, so `create(messages)` works from Java too. Failures throw `InferenceError` with `status`, `type` and `message`, and with the gateway's `code`, `requestId` and `retryAfterMs` when the response carried them. `apiKey` is optional, your own OpenAI, Anthropic or Google key, for a vendor model such as `gpt-4o-mini`; `moss` ignores it, and a vendor model without one is refused. A call can pass its own `apiKey`, which wins over the client's. `idleTimeoutMs` (120 seconds by default) ends a call when the gateway goes silent, `timeoutMs` (off by default) bounds a whole call, and a call can pass its own of either. `MOSS_INFERENCE_URL`, read when a client is built, sets the base URL it calls. A redirect is not followed. Built on `HttpURLConnection`, with no new dependency.
>
> **Changed**
>
> * A `429` with the code `USAGE_LIMIT_EXCEEDED`, which Moss sends while a project is paused, throws on the first response with a `MossException` whose code is `MossErrorCode.UNAUTHORIZED` and the message "The project's usage limit has been reached; billing must be updated before it can be used.", instead of retrying for about 90 seconds and failing with `MossErrorCode.NETWORK`. A cold start with a committed snapshot on disk fails the same way rather than serving the snapshot. Any other `429` still retries.
>
> **2026-10-22**
>
> v0.27.0
>
> **Added**
>
> * `MossInference`, a client of the Moss inference gateway in the shape of OpenAI's chat completions API. `moss_inference_new` creates one from an options JSON with `project_id` and `project_key`, and optionally `api_key`, `timeout_ms` and `idle_timeout_ms`, and rejects a bad option before any call. `moss_inference_free` frees it. A client calls the gateway at `https://inference.moss.dev/v1`, or at the base URL in `MOSS_INFERENCE_URL`, and refuses a value that is not printable ASCII, or not an absolute http or https URL with a host and no user info, query, fragment or port 0. `api_key` is your own OpenAI, Anthropic or Google key, for a vendor model such as `gpt-4o-mini`; `moss` ignores it, and a vendor model without one is refused. It is sent as the `X-Moss-Provider-Key` header. `idle_timeout_ms`, 120000 unless set, limits each wait for the reply's headers or its next bytes, and `timeout_ms` a whole call; 0 turns either off. One client may serve calls on several threads at once.
> * `moss_inference_chat_completions_create` creates a chat completion on a `MossInference` client, like OpenAI's `chat.completions.create`. It takes the OpenAI request JSON, whose `model` defaults to `moss`, plus `indexes` and `retrieve`, and call options with `api_key`, `timeout_ms` and `idle_timeout_ms` that replace the client's, and streams each chunk to a callback or returns one completion JSON. Redirects are not followed, and an event or a line over 1 MiB fails the call. `moss_last_error_detail()` describes a failure with its OpenAI error `type`, HTTP `status`, the gateway's error `code`, the `X-Moss-Request-Id` as `request_id` and a `Retry-After` in delta-seconds as `retry_after_ms`. `MOSS_INFERENCE_API_VERSION` 1 marks a header with these functions.
>
> **Changed**
>
> * A `429` with the code `USAGE_LIMIT_EXCEEDED`, which Moss sends while a project is paused, returns on the first response with `ERR_UNAUTHORIZED` and the message "The project's usage limit has been reached; billing must be updated before it can be used.", instead of retrying for about 90 seconds and failing with `ERR_CLOUD`. A cold start with a committed snapshot on disk fails the same way rather than serving the snapshot. Any other `429` still retries.
>
> **2026-10-21**
>
> **Added**
>
> * **Moss Inference**: `POST https://inference.moss.dev/v1/chat/completions` takes an OpenAI chat completion request with `Authorization: Bearer <project_id>:<project_key>`, searches the project's indexes, adds the hits to the prompt, and answers in OpenAI's shape, so any OpenAI client works by changing the base URL and the key. `model` is `moss` (the default) or an OpenAI, Anthropic, or Google model name with your own key in `X-Moss-Provider-Key`. Headers, limits, errors, and billing are on the [Chat Completions](https://docs.moss.dev/docs/api-reference/v1/inference/chat-completions.md) page.
>
> **2026-10-20**
>
> v1.19.0
>
> **Added**
>
> * The package metadata declares its license, PolyForm Shield 1.0.0, as `LicenseRef-PolyForm-Shield-1.0.0`, so PyPI and license scanners show it.
> * The `inferedge-moss-core` wheels carry `LICENSE-THIRD-PARTY.txt`, the license and copyright notices of the third-party code the extension links: the Rust crates of that target, ONNX Runtime and the components it includes, and the Rust standard library.
> * `SessionIndex.save_to_disk` and `load_from_disk` take `cache_path` as optional. Without one, or with an empty one, snapshots go in `sessions/<project id>/` under the client's `cache_path`, else under the `MOSS_SESSION_CACHE_PATH` environment variable, which only session snapshots read, else under `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux, `%LOCALAPPDATA%\moss` on Windows. A directory you pass is used as before.
>
> **Changed**
>
> * Requires `inferedge-moss-core` 0.33.0.
> * The custom embeddings section of the README says to L2-normalize the vectors you provide. Thanks @VeshRaazThapa (usemoss/moss#529).
> * `inferedge-moss-core`, the native runtime of `moss`, is not supported for direct use, and its `moss_core` module no longer exports `Index`. Import every Moss type from `moss`. No change to the `moss` API.
> * `SessionIndex.add_docs` on a session with a built-in model embeds the documents in batches of at most 512 padded tokens instead of 8,192, and tokenizes each batch on the thread that embeds it. Each model session runs 2 inference threads on a desktop or server host (macOS, Linux or Windows) with 8 or more cores, and 1 on a smaller host, on Android and iOS, and for `moss-litelm`. Idle threads sleep instead of spinning. Embedding many documents needs less memory, and on a host that runs 2 threads it takes less time. Text queries on other sessions with the same model stay fast while it runs. `MOSS_EMBEDDING_INTRA_OP_THREADS` still sets the thread count on every platform.
> * `moss-litelm` embeds each document in its own batch, so a document's vector equals the vector of its text embedded alone. Embedded in a batch, its vectors used to differ from that, with a cosine similarity as low as 0.989.
>
> **Fixed**
>
> * Deleting a `MossClient` or `SessionIndex` waits at most 100 ms for a DNS lookup still in progress. It used to hold the GIL until DNS gave up.
>
> **2026-10-20**
>
> v1.19.0
>
> **Added**
>
> * The `license` field names `LICENSE.txt`, the file the package ships, so npm and license scanners find the PolyForm Shield 1.0.0 text.
> * `SessionIndex.saveToDisk`, `loadFromDisk` and `inspectSnapshot` take the directory as optional. Without one, or with an empty one, snapshots go in `sessions/<project id>/` under the client's `cachePath` option, else under the `MOSS_SESSION_CACHE_PATH` environment variable, which only session snapshots read, else under `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux, `%LOCALAPPDATA%\moss` on Windows. A directory you pass is used as before.
> * `IndexInfo`, `IndexStatus` and `ModelRef` are exported, so code that types the results of `getIndex` and `listIndexes` imports them from `@moss-js/moss`. Import every Moss type from `@moss-js/moss`: `@moss-js/moss-core` is the SDK's native runtime and is not supported for direct use.
> * `IndexStatus`, `JobStatus` and `JobPhase` are exported as plain objects with matching string union types, so members such as `IndexStatus.Ready` work at runtime and type-check under `isolatedModules` and `verbatimModuleSyntax` (Vite, Next.js, tsx). Each member also names its own type, as an enum member did, so `let status: JobStatus.Completed` still compiles. The fields that hold them, such as `IndexInfo.status`, accept the same strings.
>
> **Changed**
>
> * Requires `@moss-js/moss-core` 0.34.0.
> * `@moss-js/moss-core` declares `IndexStatus`, `JobStatus` and `JobPhase` as types only, so code that imported their values from it, such as `IndexStatus.Ready`, imports them from `@moss-js/moss` instead.
> * The published type declarations no longer include internal members. No runtime change.
> * The custom embeddings section of the README says to L2-normalize the vectors you provide. Thanks @VeshRaazThapa (usemoss/moss#529).
> * `dist/index.esm.js` ships as plain JavaScript, not minified, so stack traces name the SDK's own functions. No API change.
> * `SessionIndex.addDocs` on a session with a built-in model embeds the documents in batches of at most 512 padded tokens instead of 8,192, and tokenizes each batch on the thread that embeds it. Each model session runs 2 inference threads on a desktop or server host (macOS, Linux or Windows) with 8 or more cores, and 1 on a smaller host, on Android and iOS, and for `moss-litelm`. Idle threads sleep instead of spinning. Embedding many documents needs less memory, and on a host that runs 2 threads it takes less time. Text queries on other sessions with the same model stay fast while it runs. `MOSS_EMBEDDING_INTRA_OP_THREADS` still sets the thread count on every platform.
> * `moss-litelm` embeds each document in its own batch, so a document's vector equals the vector of its text embedded alone. Embedded in a batch, its vectors used to differ from that, with a cosine similarity as low as 0.989.
>
> **2026-10-20**
>
> v1.5.1
>
> **Changed**
>
> * Requires `@moss-dev/moss-wasm` 0.18.1.
>
> **Fixed**
>
> * The `license` field names `LICENSE.txt`, the file the package ships, so npm and license scanners find the PolyForm Shield 1.0.0 text.
>
> **2026-10-20**
>
> v1.8.0
>
> **Added**
>
> * The `moss_core` package declares its license, PolyForm Shield 1.0.0, as `LicenseRef-PolyForm-Shield-1.0.0`, and it and each NIF archive carry the `LICENSE.txt` it names.
> * Each `moss_core` NIF archive carries `LICENSE-THIRD-PARTY.txt`, the license and copyright notices of the third-party code the NIF links: the Rust crates of that target, ONNX Runtime and the components it includes, and the Rust standard library.
> * `Moss.Session.save_to_disk/2` and `Moss.Session.load_from_disk/3` take the cache path as optional, and `load_from_disk(session, rebuild_legacy: false)` also works. Without one, or with an empty one, snapshots go in `sessions/<project id>/` under the client's `:cache_path`, else under the `MOSS_SESSION_CACHE_PATH` environment variable, which only session snapshots read, else under `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux, `%LOCALAPPDATA%\moss` on Windows. A path you pass is used as before. `Moss.Client` keeps its `:cache_path`, and `MossCore.Nif.session_save_to_disk/3` and `session_load_from_disk/4` take the client's cache path.
>
> **Changed**
>
> * Bumped `moss_core` dependency to 0.25.0.
> * `Moss.Session.add_docs/3` on a session with a built-in model embeds the documents in batches of at most 512 padded tokens instead of 8,192, and tokenizes each batch on the thread that embeds it. Each model session runs 2 inference threads on a desktop or server host (macOS, Linux or Windows) with 8 or more cores, and 1 on a smaller host and for `moss-litelm`. Idle threads sleep instead of spinning. Embedding many documents needs less memory, and on a host that runs 2 threads it takes less time. Text queries on other sessions with the same model stay fast while it runs. `MOSS_EMBEDDING_INTRA_OP_THREADS` still sets the thread count on every platform.
> * `moss-litelm` embeds each document in its own batch, so a document's vector equals the vector of its text embedded alone. Embedded in a batch, its vectors used to differ from that, with a cosine similarity as low as 0.989.
>
> **2026-10-20**
>
> v0.10.0
>
> **Added**
>
> * **Third-party notices.** `Moss.xcframework.zip` and the Swift package carry `LICENSE-THIRD-PARTY.txt`, the license and copyright notices of the third-party code `libmoss.a` links: the Rust crates, ONNX Runtime and the components it includes, and the Rust standard library.
> * **Default session directory.** `MossSession.save(toCachePath:)` and `loadFromDisk(cachePath:)` take the path as optional. Without one, snapshots go in the app's `Library/Caches/moss/sessions/<project id>/`, or in `sessions/<project id>/` under the `MOSS_SESSION_CACHE_PATH` environment variable when it is set. Only session snapshots read that variable.
>
> **Changed**
>
> * **Document parsing in the core.** `MossClient.createIndex` and `addDocs` parse documents with the core's JSON parser. Everything accepted before is accepted with the same result, and parse errors name the document's index.
> * **Smaller embedding batches.** `MossSession.addDocs` on a session with a built-in model embeds the documents in batches of at most 512 padded tokens instead of 8,192, and tokenizes each batch on the thread that embeds it. Each model session keeps 1 inference thread on every iPhone and iPad. `MOSS_EMBEDDING_INTRA_OP_THREADS` still sets the thread count, and with more than 1 thread, idle threads sleep instead of spinning.
> * **`moss-litelm` vectors match single texts.** `moss-litelm` embeds each document in its own batch, so a document's vector equals the vector of its text embedded alone. Embedded in a batch, its vectors used to differ from that, with a cosine similarity as low as 0.989.
>
> **Fixed**
>
> * **Close returns promptly.** `MossClient.close()` and `MossSession.close()`, also run on deinit, wait at most 100 ms past their 2-second close deadline for a DNS lookup still in progress, instead of until DNS gives up.
> * **A session keeps its client's authenticator.** A `MossSession` opened from a client with an `Authenticator` keeps that authenticator until the session closes, so a session still open after `MossClient.close()` gets its tokens instead of crashing.
>
> Native runtime `sdkVersion`: `0.26.0`.
>
> **2026-10-20**
>
> v0.26.0
>
> **Added**
>
> * **Third-party notices.** The AAR carries `assets/moss/LICENSE-THIRD-PARTY.txt`, the license and copyright notices of the third-party code `libmoss_jni.so` links: the Rust crates, ONNX Runtime and the components it includes, and the Rust standard library.
> * **Android SDK.** A Kotlin AAR (`dev.usemoss.moss`, arm64-v8a, minSdk 24) over one 16 KB-aligned `libmoss_jni.so` that statically links `libmoss` and ONNX Runtime. `MossClient` loads indexes for on-device query (`loadIndex`, `query`, `unloadIndex`), wraps the cloud index operations, and opens on-device sessions with `MossClient.session` (moss-litelm + INT8 by default) with `saveToDisk`, `loadFromDisk` and `pushIndex`. Blocking calls reject the main looper, Application trim-memory callbacks unload indexes off the main thread, and `close()` frees the native client on a worker thread.
> * **Default session directory.** `saveToDisk` and `loadFromDisk` without a path use `cacheDir/moss/sessions/<project id>/<name>`, the layout of the other SDKs, so two projects with a session of the same name stay apart. `MossClient.sessionCacheDir(context, projectId)` returns the project folder.
> * **Multi-app search.** `MossClient.loadIndexes`, `queryMultiIndex` and `unloadIndexes` search several loaded indexes, such as one per app, in one call. The result is the global top `topK` (10 without options) across all of them, and each `QueryResult.indexName` names the index a hit came from. `alpha` keeps its single-index meaning; keyword ranking merges each index's BM25 hits by score. `loadIndexes` is best effort and reports each failure by name in `LoadIndexesResult.failed` and `failedCodes`.
> * **Search other apps.** An app exports a `MossSearchProvider` to answer searches from its own indexes, and `CrossAppSearch.query` searches every provider app it trusts plus its own loaded indexes in one call, under one deadline (1,000 ms by default), and ranks the hits by score. `AppPolicy` sets who may search whom by signing certificate or permission, same signer by default; a refused caller gets no hits. Each app reports OK, TIMEOUT, REFUSED, UNTRUSTED, UNAVAILABLE, FAILED or INCOMPATIBLE, and a cloud copy the host loaded answers for any app that did not answer, unless it refused. A reply holds at most 100 hits, 2,000 characters of text per hit and 64 KB. On API 30 and later the searching app needs a `<queries>` entry for `MossSearchProvider.ACTION`.
> * **Typed exceptions.** Every failure is a `MossException` subclass for its `MossErrorCode`: `InvalidArgument`, `NotFound`, `Unauthorized`, `Network`, `Deserialization`, `ModelUnavailable` and `Internal`. `message` is fixed text for each kind of core failure, `detail` carries the core error text for logs and support, and `nativeCode` keeps the exact `MossResult` value. Arguments the Kotlin layer checks itself, such as a blank index name or a `topK` below 1, throw `IllegalArgumentException`.
>
> **2026-10-20**
>
> v0.26.0
>
> **Added**
>
> * `moss_session_save_to_disk` and `moss_session_load_from_disk` accept a NULL or empty `cache_path`. The snapshot then goes in `sessions/<project id>/` under the `MOSS_SESSION_CACHE_PATH` environment variable, which only session snapshots read, else under `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux, the app's `Library/Caches/moss` on iOS, `%LOCALAPPDATA%\moss` on Windows. Android has no default, so the call returns `ERR_INVALID_ARG` there unless `MOSS_SESSION_CACHE_PATH` is set. `MOSS_SESSION_DEFAULT_DIR_API_VERSION` 1 marks a header with this default.
> * Each archive carries `LICENSE-THIRD-PARTY.txt`, the license and copyright notices of the third-party code its library links: the Rust crates of that target, ONNX Runtime and the components it includes, and the Rust standard library.
>
> **Fixed**
>
> * `moss_client_free` and `moss_session_free` wait at most 100 ms past their 2-second close deadline for blocking work still running, such as a DNS lookup. They used to wait for it, for as long as DNS took to give up.
> * The authenticator callback of `moss_client_new_with_authenticator` is never invoked after the client and every session opened from it are freed, so `user_data` needs to stay valid only until then.
>
> **Changed**
>
> * The Linux builds support glibc 2.28 and newer on both x86\_64 and aarch64, so they load on RHEL 8 and 9, Amazon Linux 2023, Debian 10 and later, and Ubuntu 20.04 and later. They used to need glibc 2.35 on x86\_64 and 2.39 on aarch64.
> * `moss_client_create_index_from_json` and `moss_client_add_docs_from_json` accept JSON Lines as well as a JSON array. Integer ids and number or boolean metadata values become strings, `null` metadata values are dropped, and a non-string `payload` is stored as its JSON text. Everything accepted before parses the same way. Parse errors name the array index or line.
> * `moss_session_add_docs` on a session with a built-in model embeds the documents in batches of at most 512 padded tokens instead of 8,192, and tokenizes each batch on the thread that embeds it. Each model session runs 2 inference threads on a desktop or server host (macOS, Linux or Windows) with 8 or more cores, and 1 on a smaller host, on Android and iOS, and for `moss-litelm`. Idle threads sleep instead of spinning. Embedding many documents needs less memory, and on a host that runs 2 threads it takes less time. Text queries on other sessions with the same model stay fast while it runs. `MOSS_EMBEDDING_INTRA_OP_THREADS` still sets the thread count on every platform.
> * `moss-litelm` embeds each document in its own batch, so a document's vector equals the vector of its text embedded alone. Embedded in a batch, its vectors used to differ from that, with a cosine similarity as low as 0.989.
>
> **2026-10-20**
>
> v0.2.1
>
> **Added**
>
> * The package metadata declares its license, PolyForm Shield 1.0.0, as `LicenseRef-PolyForm-Shield-1.0.0`, so PyPI and license scanners show it.
>
> **Fixed**
>
> * The README puts the global options `--project-id`, `--project-key` and `--json` before the command, where `moss` reads them.
>
> **2026-10-19**
>
> v2.0.1
>
> **Added**
>
> * README: ambient retrieval (STT to Moss), which queries Moss with every final user transcript and gives the results to the LLM with the question. Includes a LiveKit `on_user_turn_completed` example and one for any framework.
>
> **2026-10-19**
>
> v2.0.0
>
> A major release: the newer core changes what `score` means and how built-in models load, and multi-index queries become hybrid by default. See **Breaking changes**.
>
> **Breaking changes**
>
> * Requires `inferedge-moss-core` 0.32.0 (1.0.0 required 0.12.0). Behavior that comes with the newer core:
>   * Result `score` is relevance from 0 to 1 on every query path. In 1.0.0, single-index `score` was a rank-fusion value (1.0, 0.969, 0.939, ...) and multi-index `score` was raw cosine, so a threshold tuned on 1.0.0 scores needs retuning.
>   * Errors are `MossError` with stable `.code` / `.detail`; invalid arguments raise `InvalidArgumentError`, which is also a `ValueError`.
>   * `$gt` / `$gte` / `$lt` / `$lte` filters compare plain decimals as numbers and everything else as text.
>   * Loading a built-in embedding model needs the Moss cloud to be reachable.
> * Multi-index queries default to `alpha=0.8` (hybrid), as in the `moss` SDK. 1.0.0 ran them embedding-only; pass `QueryOptions(alpha=1.0)` for that.
> * `query_multi_index` with no index names raises `InvalidArgumentError` before any search.
> * `top_k=0` is passed through on every query method and returns no results, as in `moss` and core, instead of being replaced by the default 5 (10 for multi-index).
>
> **Added**
>
> * `MossAgent.start_call(room_id, *, session_id=None, started_at=None) -> MossCall` starts the call scope for one conversation in any voice framework, and `MossCall.end()` ends it. Starting a room whose call is active returns a handle to that call. `started_at` must be timezone-aware and defaults to now.
> * `MossCall.room_id` and `MossCall.session_id`. `livekit_room_id` and `livekit_session_id` stay as aliases.
> * `MossAgent.close()` ends every active call, sends the final usage telemetry and releases the agent; afterwards every method raises `RuntimeError("MossAgent is closed")`. `MossAgent` works as `async with` and `with`.
> * `MossAgent(..., cache_path=...)` sets the default on-disk index cache for `load_index` / `load_indexes`; a per-call `cache_path` overrides it.
> * `MossAgent.was_served_stale(name)` reports whether an index is served from a cached snapshot because the cloud was unreachable at load.
> * `QueryOptions.min_score` and `QueryOptions.candidate_depth` are honored on `MossCall.query*` and `MossAgent.query*`, and `alpha` is honored on multi-index queries.
> * `create_index` and `add_docs` take documents as dicts, JSON array or JSON Lines text, or `.json`, `.jsonl`, `.ndjson`, `.txt`, `.md` and `.markdown` file paths, as well as `DocumentInfo` objects, with keyword-only `chunker` and `chunking` (`Chunking`) arguments.
> * `create_index(..., wait=False)` submits the build and returns a `JobHandle` (`job_id`, `status()`, `wait()`). `MossAgent.wait_for_job(job_id, *, poll_interval_seconds=2.0, timeout_seconds=1800.0)`.
> * `create_index_from_files(..., parse_options=ParseOptions(...))` with `use_high_resolution`, `segmentation_method`, `ocr_mode`, `merge_tables`, `chunk_size` and `chunk_overlap`.
> * Web sources on the Moss manage API: `create_web_source`, `list_web_sources`, `get_web_source`, `update_web_source`, `resync_web_source` and `delete_web_source`, with the same signatures and results as the `moss` SDK. `MOSS_CLOUD_API_BASE_URL` overrides the host. Failures raise `ManageApiError`, and a redirect is refused with `ManageApiError` rather than followed, so the project key is never resent to another URL.
> * Exports `ParseOptions`, `JobHandle`, `DocsInput`, `Chunker`, `Chunking`, `ParentGrouping`, `MossError`, `InvalidArgumentError`, `ManageApiError`, `WebSource`, `CreateWebSourceResult`, `UpdateWebSourceResult`, `ResyncWebSourceResult` and `DeleteWebSourceResult`.
>
> **Changed**
>
> * `attach(ctx)` is built on `start_call`. A naive `room.creation_time` is read as local time, as before.
> * `MossAgent.query` and `query_multi_index` take `options` positionally too.
> * `moss_agent.__version__` is read from the installed package metadata.
>
> **Fixed**
>
> * `MossAgent.query` and `MossCall.query` pass an explicit `alpha=0.0` (keyword-only search) through instead of replacing it with the default 0.8.
>
> **2026-10-16**
>
> **Founding Agent deal codes**
>
> * Redeem a Founding Agent deal, such as the [YC deal](https://moss.dev/product/founding-agent/yc), from the sign-up link in its email. Checkout opens with the code applied, and the plan activates once you confirm it.
> * If a code can't be used, the **Plan** page says why.
>
> **2026-10-14**
>
> **Changed**
>
> * Parsed PDF and DOCX files are split into chunks that end at sentence boundaries, and each chunk starts with the document's title and nearest section heading. Image descriptions are no longer indexed.
> * `parseOptions` takes `chunkSize` (200 to 2000 characters, default 1200) and `chunkOverlap` (default 200, at most half of `chunkSize`). See [Index from Files](https://docs.moss.dev/docs/reference/js/files.md).
> * Only files parsed from now on are affected.
>
> **2026-10-14**
>
> v1.18.0
>
> **Added**
>
> * `MossClient.create_index`, `MossClient.add_docs` and `SessionIndex.add_docs` take documents as dicts (or any `collections.abc.Mapping`), JSON array or JSON Lines text, or `.json`, `.jsonl`, `.ndjson`, `.txt`, `.md` and `.markdown` file paths, as well as `DocumentInfo` objects. Text and markdown files are chunked natively into documents `{path}#{n}` with metadata `parentId`. A word longer than `chunk_size` (1200 by default), such as a long URL or a run of text without spaces, is split into `chunk_size` pieces, so no text is dropped. Markdown front matter (a first `---` line through the next `---` or `...` line) is not indexed.
> * A keyword-only `chunker` argument on the same methods splits every document's text with your own function. Pass `chunker` or `chunking`, not both: using both raises `TypeError`. Neither can be used with `model_id="custom"`.
> * `moss.Chunking` and a keyword-only `chunking` argument on the same methods tune the native chunker within the embedding model's limits, with the names and limits of `ParseOptions`: `chunk_size` 200 to 2000 characters (default 1200), `chunk_overlap` 0 to half of `chunk_size` (default 200, capped at half of `chunk_size`), `mode` `"pages"` or `"sentences"`, and `markdown_header_depth` 1 to 6. With `chunking`, `DocumentInfo`, dict and JSON input is chunked too, not only text and markdown files. Out-of-range values raise `InvalidArgumentError` with `ParseOptions`-style messages, such as `Unsupported chunk_size 100. Supported: 200 to 2000`. Chunks from a user `chunker` longer than 2,000 characters raise `InvalidArgumentError`.
> * `moss.DocsInput`, `moss.Chunker` and `moss.Chunking` are new exports.
>
> **Changed**
>
> * Requires `inferedge-moss-core` 0.32.0, which adds `moss_core.parse_documents_json` and `moss_core.to_document_infos`.
>
> **Fixed**
>
> * The type stub declares `MossClient.create_index_from_files`, `ParseFileInput` and `ParseOptions`, and its `__all__` lists them and `ParentGrouping`. It also declares `SearchResult.model_id`, `IndexStatus.value` and the `JobPhase.CRAWLING` and `JobPhase.PARSING_DOCUMENTS` phases, types `create_index(..., wait=flag)` for a `bool` flag, and declares fields that are read-only at runtime, such as `MutationResult.job_id` and `SessionIndex.name`, as read-only properties. The `LoadIndexesResult` arguments no longer accept `None`, which the core refuses. No runtime change.
> * The type stub marks the classes of the native core, such as `DocumentInfo` and `QueryOptions`, final, since Python cannot subclass them, and declares their constructors with `__new__`, as the core defines them. No runtime change.
>
> **2026-10-14**
>
> v1.17.0
>
> **Added**
>
> * `ParseOptions.chunk_size` (200 to 2000 characters, default 1200) and `ParseOptions.chunk_overlap` (0 to half of `chunk_size`, default 200 capped at half of `chunk_size`) control how the parse pipeline splits extracted text. Out-of-range values raise `InvalidArgumentError` before any upload.
>
> **Changed**
>
> * Requires `inferedge-moss-core` 0.31.0.
>
> **2026-10-14**
>
> v1.18.0
>
> **Added**
>
> * `ParseOptions.chunkSize` (200 to 2000 characters, default 1200) and `ParseOptions.chunkOverlap` (0 to half of `chunkSize`, default 200 capped at half of `chunkSize`) control how the parse pipeline splits extracted text. Out-of-range values reject before any upload.
>
> **Changed**
>
> * Requires `@moss-js/moss-core` 0.33.0.
>
> **2026-10-14**
>
> v1.7.0
>
> **Added**
>
> * `Moss.Client.create_index_from_files/5` takes `:chunk_size` (200 to 2000 characters, default 1200) and `:chunk_overlap` (0 to half of `:chunk_size`, default 200 capped at half of `:chunk_size`) in `parse_options` to control how the parse pipeline splits extracted text. Out-of-range values return `{:error, %Moss.Error{code: :invalid_argument}}` before any upload.
>
> **Changed**
>
> * Bumped `moss_core` dependency to 0.24.0.
>
> **2026-10-13**
>
> v1.16.1
>
> **Changed**
>
> * Requires `inferedge-moss-core` 0.30.1.
>
> **Fixed**
>
> * `MossClient.query`, `query_multi_index`, `unload_index`, `unload_indexes` and `was_served_stale` release the GIL while they run, so the event loop keeps running other tasks during a query or while an unload waits for one.
>
> **2026-10-12**
>
> v0.25.0
>
> **Changed**
>
> * `moss_session_add_docs` and `moss_session_delete_docs` update the keyword index in place instead of rebuilding it, and loads build it in one pass. Scores are unchanged.
> * `moss_session_add_docs` checks a whole batch before changing the session, so a batch with a vector of another length adds nothing.
> * A session keeps one copy of each document, and adds and loads move documents into the index instead of copying them.
> * `moss_session_load_index` into a session that holds documents replaces them instead of keeping stale copies.
> * The token cache keeps a token until 60 seconds before it expires or for 90% of its life, whichever is later, so short-lived tokens are cached too.
> * A 401 drops only the token it rejected from the cache, and a refused telemetry request keeps the token.
> * A project key session fetches one token for its requests and its telemetry.
> * `moss_session_load_index` and `moss_session_load_from_disk` keep the session's loaded model when the index uses the same model, instead of loading it again.
>
> **2026-10-12**
>
> v1.16.0
>
> **Added**
>
> * `SessionIndex.save_to_disk(cache_path)` and `SessionIndex.load_from_disk(cache_path, *, rebuild_legacy=True)` save a session to disk and restore it. `save_to_disk` writes the session under `<cache_path>/<name>/`, and a failed or interrupted save leaves the last saved snapshot loadable. `load_from_disk` restores it into a session with the same name and returns the number of documents loaded, and the session takes the snapshot's model. A session that already loaded the same model keeps it instead of loading it again. A missing or damaged snapshot raises `MossError` with code `DESERIALIZATION` and leaves the session as it was. A snapshot that an older core saved for a built-in model has no model artifact identity: by default `load_from_disk` rebuilds it for a session opened with the same model, re-embedding the stored documents and saving the snapshot back in the same call, which needs the cloud for the model. When the model cannot be loaded it raises `MossError` with code `MODEL_UNAVAILABLE` and changes nothing. `rebuild_legacy=False` loads such a snapshot as a custom-model session. Code that calls `load_from_disk` on the private `SessionIndex._inner` gets no rebuild unless it passes `rebuild_legacy=True`; the public method rebuilds by default.
> * `MossClient.session(name, auto_load_on_init=False)` opens the session without loading the cloud index of that name. The session starts empty with the given model, so `load_from_disk` restores a saved session with no index download. A `push_index` before any load replaces the cloud index with the session's documents.
> * `SessionIndex.model_id`, the embedding model the session uses, or `"custom"`. A load moves the session to the loaded model, and `add_docs` and `query` read it on every call. Reading it never waits for a call in progress, and it still reads after `close()`.
>
> **Changed**
>
> * Requires `inferedge-moss-core` 0.30.0.
> * `SessionIndex.add_docs` and `delete_docs` update the keyword index in place instead of rebuilding it, and loads build it in one pass. Scores are unchanged.
> * **Behavior change:** `SessionIndex.add_docs` checks every document of a call first, so a call with a vector whose length differs from the session's vectors raises `InvalidArgumentError` and adds nothing.
> * `SessionIndex` keeps one copy of each document, and adds and loads move documents into the index instead of copying them.
> * The token cache keeps a token until 60 seconds before it expires or for 90% of its life, whichever is later, so short-lived tokens are cached too.
> * A 401 drops only the token it rejected from the cache, and a refused telemetry request keeps the token.
> * A project key session fetches one token for its requests and its telemetry.
>
> **Fixed**
>
> * `MossClient.session` moves the session to the model of an existing cloud index that has no documents, as it does for one with documents. Without `model_id`, a session on an empty custom-model index opens and takes embeddings instead of raising `InvalidArgumentError` while it warms the default model, and an explicit `model_id` the index does not use raises `ValueError`.
> * When `MossClient.session` raises, it closes the session it opened, so the session's final telemetry is sent and its native memory freed then, not at `MossClient.close`.
>
> **2026-10-12**
>
> v1.17.0
>
> **Added**
>
> * `MossModel` includes `"moss-litelm"`, so `session(name, "moss-litelm")` type-checks and `SessionIndex.modelId` names every model the core reports.
>
> **Changed**
>
> * Requires `@moss-js/moss-core` 0.32.0.
> * `@moss-js/moss-core` ships its native binary only in the `@moss-js/moss-core-<platform>` package that npm installs for the host as an optional dependency, so an install is about 60 MB smaller. Keep optional dependencies on: after an install with `npm install --omit=optional`, `optional=false` in `.npmrc` or `pnpm --no-optional`, importing `@moss-js/moss` throws `Cannot find native binding` with a hint to reinstall without that option. The same happens on `npm ci` from a lockfile that npm older than 11.3 rebuilt while `node_modules` existed, because that lockfile keeps only that machine's platform package. Before installing on another platform, regenerate it with `node_modules` removed, or with npm 11.3 or newer. No API change.
> * `SessionIndex.addDocs` and `deleteDocs` update the keyword index in place instead of rebuilding it, and loads build it in one pass. Scores are unchanged.
> * **Behavior change:** `SessionIndex.addDocs` checks every document of a call first, so a call with a vector of another length adds nothing.
> * `SessionIndex` keeps one copy of each document, and adds and loads move documents into the index instead of copying them.
> * A token is cached until 60 seconds before it expires or for 90% of its life, whichever is later, for custom authenticators and project keys.
> * With a project key, a 401 drops only the token it rejected, and a refused telemetry request keeps the cached token instead of fetching a new one.
> * A project key session fetches one token for its requests and its telemetry.
> * A session filled by `loadIndex` or restored by `loadFromDisk` keeps its loaded model when the index uses the same model, instead of loading it again.
>
> **Fixed**
>
> * `loadIndex` into a session that held documents kept them beside the loaded index, and `saveToDisk` then failed. A load now replaces them.
> * With a custom authenticator, the retry after a 401 resent the same cached token. It now drops the rejected token and asks the authenticator for a new one.
> * A client with a custom authenticator kept Node running after `close()`. The process now exits once its work is done.
> * On Windows, a process that first loaded the native addon from a `worker_threads` worker could crash with an access violation when that worker exited. The addon now stays loaded until the process exits, as on Linux and macOS.
> * `SessionIndex.modelId` is the model the native core reports after the last completed call, and `addDocs` and `query` pick their path by it on every call. `loadIndex` and `loadFromDisk` move the session to the model of the index or snapshot they load, which is `custom` for a custom-model one and for a built-in model one without a model artifact identity (such as a legacy snapshot loaded with `rebuildLegacy: false`), and auto-refresh can install a custom-model version into a built-in model session. After such a change, `addDocs` takes the documents' embeddings instead of rejecting, and `query` without an embedding rejects with code `INVALID_ARGUMENT`.
>
> **2026-10-12**
>
> v1.5.0
>
> **Changed**
>
> * Requires `@moss-dev/moss-wasm` 0.18.0.
> * Loading an index builds its keyword index in one pass. Scores are unchanged.
> * With a project key, a token is cached until 60 seconds before it expires or for 90% of its life, whichever is later.
> * With a project key, a request refused with 401, model requests included, drops only the token it sent before it retries.
> * Outside Node, the SDK imports `onnxruntime-web/wasm` instead of the package default, and it pins `onnxruntime-web` to 1.30.0, the version `^1.27.0` resolved to. A bundled app ships the plain `ort-wasm-simd-threaded.wasm` (14.2 MB, 3.7 MB gzip) instead of the WebGPU build `ort-wasm-simd-threaded.jsep.wasm` (28.3 MB, 6.7 MB gzip), and about 330 KB less JavaScript. The SDK only runs the wasm execution provider, so embeddings are unchanged. A directory passed as `onnxWasmPath` must serve `ort-wasm-simd-threaded.wasm` and `ort-wasm-simd-threaded.mjs` from onnxruntime-web 1.30.0; the `.jsep` files are no longer requested. Under Node, including server rendering, the SDK keeps the package default, whose Node build loads the wasm from disk. The choice is the `#ort` entry of the package's `imports` field, so a bundler must follow that field, as Vite 4.2+ and webpack 5 do; one that does not fails to resolve `#ort`. No API change.
>
> **2026-10-12**
>
> v1.6.0
>
> **Added**
>
> * `Moss.Session.save_to_disk/2` and `Moss.Session.load_from_disk/3` save a session to disk and restore it. `save_to_disk/2` writes the session under `<cache_path>/<name>/` and returns `:ok`; a failed or interrupted save leaves the last saved snapshot loadable. `load_from_disk/3` restores it into a session with the same name and returns `{:ok, doc_count}`. A missing or damaged snapshot returns `{:error, %Moss.Error{code: :deserialization}}` and leaves the session as it was. A snapshot that an older core saved for a built-in model has no model artifact identity: by default `load_from_disk/3` rebuilds it for a session opened with the same model, re-embedding the stored documents and saving the snapshot back in the same call, which needs the cloud for the model. When the model cannot be loaded it returns `{:error, %Moss.Error{code: :model_unavailable}}` and changes nothing. `rebuild_legacy: false` loads such a snapshot as a custom-model session. After a load, `add_docs/3` and `query/3` use the model the session took from the snapshot, so a custom-model snapshot needs embeddings.
> * `Moss.Client.session/3` takes `auto_load_on_init: false` to open the session without loading the cloud index of that name. The session starts empty with `:model_id`, so `Moss.Session.load_from_disk/3` restores a saved session with no index download. `Moss.Session.push_index/1` before any load replaces the cloud index with the session's documents.
> * `Moss.Session.model_id/1` returns the embedding model the session uses, or `"custom"`. A load moves the session to the loaded model, and `add_docs/3` and `query/3` read it from the core on every call.
>
> **Changed**
>
> * Bumped `moss_core` dependency to 0.23.0.
> * `Moss.Session.add_docs/3` and `delete_docs/2` update the keyword index in place instead of rebuilding it, and loads build it in one pass. Scores are unchanged.
> * `add_docs/3` checks every document of a call first, so a call with a vector of another length adds nothing.
> * A session keeps one copy of each document, and adds and loads move documents into the index instead of copying them.
> * `load_index/2` into a session that holds documents replaces them instead of keeping stale copies.
> * The token cache keeps a token until 60 seconds before it expires or for 90% of its life, whichever is later, so short-lived tokens are cached too.
> * A 401 drops only the token it rejected from the cache, and a refused telemetry request keeps the token.
> * A project key session fetches one token for its requests and its telemetry.
> * `load_index/2` keeps the session's loaded model when the index uses the same model, instead of loading it again.
> * The precompiled `moss_core` NIFs link the custom-minimal ONNX Runtime that the C, JavaScript and Python SDKs ship, with only the operators the built-in models use, instead of the full runtime. The x86\_64 Linux NIF is built on Ubuntu 22.04 and needs glibc 2.35 or newer instead of 2.38. No API change.
>
> **Removed**
>
> * The `req` dependency, which the SDK does not use, and with it `finch`, `mint` and `hpax`. Their releases with published security advisories no longer reach an app through the SDK. An app that used `req`, or one of its dependencies, through the SDK must declare it in its own `mix.exs`.
>
> **Fixed**
>
> * `Moss.Session.load_index/2` moves the session to the model of the index it loads, as `load_from_disk/3` does, so after a custom-model index, or a built-in model index without a model artifact identity, loads into a built-in model session, `add_docs/3` takes the documents' embeddings instead of failing and `query/3` without an embedding returns `{:error, %Moss.Error{code: :invalid_argument}}`. Without `:model_id`, `Moss.Client.session/3` resumes such an index, an empty one included, instead of returning an error while it warms the default model. An explicit `:model_id` the index does not use returns `{:error, %Moss.Error{code: :invalid_argument}}` with a message that names both models.
>
> **2026-10-12**
>
> v0.9.0
>
> **Changed**
>
> * **Keyword index updated in place.** `MossSession.addDocs` and `deleteDocs` no longer rebuild it, and `loadIndex` and `loadFromDisk` build it in one pass. Scores are unchanged.
> * **Failed adds change nothing.** `addDocs` with a vector of another length adds none of its documents.
> * **One copy of each document.** Adds and loads move documents into the index.
> * **`loadIndex` replaces documents** a session already held.
> * **Short-lived tokens are cached** until 60 seconds before expiry or for 90% of their life, whichever is later.
> * **A 401 drops only the rejected token**, and a refused telemetry request keeps it.
> * **One token per session open** for a project key session's requests and telemetry.
> * **`loadIndex` and `loadFromDisk(cachePath:)` keep the session's model** when the index uses the same model, instead of loading it again.
>
> Native runtime `sdkVersion`: `0.25.0`.
>
> **2026-10-12**
>
> v0.2.0
>
> **Added**
>
> * `moss login` logs in through the browser and saves a CLI token to `~/.moss/config.json`. `moss logout` revokes the saved token and removes it, and `moss whoami` shows the account the token belongs to.
> * `moss projects list` lists the projects in the workspaces you belong to, with your role in each.
> * `moss keys create`, `list` and `delete` manage project keys with the CLI token (`--json` for agents). `create` shows the secret once, and `delete` asks first unless `--confirm` / `-y` or `--json` is passed.
> * `moss login --print-token --name ...` prints a separate token for an agent instead of saving it, and keeps your saved login.
> * `--token` / `MOSS_TOKEN` passes a CLI token, for agents, and `--api-url` / `MOSS_API_URL` points `login`, `whoami`, `projects` and `keys` at another dashboard, such as staging. The saved token is only sent to the dashboard that issued it.
>
> **Changed**
>
> * `moss init` keeps a token saved by `moss login` instead of overwriting the whole config file.
> * Requires `typer` 0.26.8 or later and `rich` 15.0.0 or later.
>
> **Removed**
>
> * The `--cloud` / `-c` flag on `moss query`. The cloud query service it targeted has been retired, so `moss query` always downloads the index and queries it on-device (the previous default).
>
> **Fixed**
>
> * A failing command prints only its error message, not a Python traceback.
>
> **2026-10-07**
>
> **Founding Agent widget teaser**
>
> * A new **Widget teaser** setting on the agent's **Agent** tab shows a short message (up to 80 characters) above the idle widget on your site. Requires `@moss-js/founding-agent` 2.3.0.
>
> **Changed**
>
> * Agents open on their **Agent** settings, and the **Overview** page is removed.
>
> **2026-10-07**
>
> v2.3.0
>
> **Added**
>
> * Teaser: when the agent has one set in the portal, the bubble shows a short message above the idle orb. It is a frosted card with a tail toward the orb that appears after a short pause (no entrance animation under reduced motion). Clicking anywhere on it starts the conversation and its X closes it; either keeps it hidden for the rest of the browser session. It never shows during a call. The text is set in Geist Mono at 15px, loaded from jsDelivr only when a teaser shows and falling back to the system monospace if blocked. `PublicConfig.teaser` carries it, normalized on fetch.
> * New `@moss-js/founding-agent/core` exports from `teaser`: `normalizeTeaser` (fail-closed: only an enabled teaser with 1 to 80 characters of text survives), `isTeaserDismissed`, `dismissTeaser`, `loadTeaserFont`, `TEASER_FONT_FAMILY` and `TEASER_MAX_LENGTH`. `TeaserConfig` is exported from `/react` too.
>
> **2026-10-06**
>
> v0.24.1
>
> **Fixed**
>
> * `moss_session_push_index` on a session with a built-in model (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) sends that model's id, so the service re-embeds the text with it and the pushed index loads and answers text queries like one built with `moss_client_create_index`. It used to be stamped `custom`, so a pushed session could not be resumed with text queries. A custom-model session still pushes its own embeddings.
>
> **2026-10-06**
>
> v1.15.1
>
> **Fixed**
>
> * `SessionIndex.push_index()` on a session with a built-in model (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) sends that model's id, so the service re-embeds the text with it and the pushed index loads and answers text queries like one built with `create_index`. It used to be stamped `custom`, so a pushed session could not be resumed with text queries. A custom-model session still pushes its own embeddings. Requires `inferedge-moss-core` 0.28.1.
>
> **2026-10-06**
>
> v1.16.1
>
> **Fixed**
>
> * `SessionIndex.pushIndex()` on a session with a built-in model (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) sends that model's id, so the service re-embeds the text with it and the pushed index loads and answers text queries like one built with `createIndex`. It used to be stamped `custom`, so a pushed session could not be resumed with text queries. A custom-model session still pushes its own embeddings. Requires `@moss-js/moss-core` 0.31.1.
>
> **2026-10-06**
>
> v1.5.1
>
> **Changed**
>
> * Bumped `moss_core` dependency to 0.22.1.
>
> **Fixed**
>
> * `Moss.Session.push_index/1` on a session with a built-in model (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) sends that model's id, so the service re-embeds the text with it and the pushed index loads and answers text queries like one built with `Moss.Client.create_index/4`. It used to be stamped `custom`, so a pushed session could not be resumed with text queries. A custom-model session still pushes its own embeddings.
>
> **2026-10-06**
>
> v0.8.1
>
> **Fixed**
>
> * `MossSession.pushIndex()` on a session with a built-in model (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) sends that model's id, so the service re-embeds the text with it and the pushed index loads and answers text queries like one built with `createIndex`. It used to be stamped `custom`, so a pushed session could not be resumed with text queries. A custom-model session still pushes its own embeddings. Native runtime `moss-c` 0.24.1.
>
> **2026-10-05**
>
> v0.24.0
>
> The first C SDK release since `c-sdk-v0.9.0`, which it supersedes. Manifest versions 0.9.2 through 0.23.0 were never published as C SDK archives, so 0.9.0 is the only earlier build in use.
>
> **Changed**
>
> * Built-in models (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) download from the Moss cloud in the native model format, and this build no longer reads the model files 0.9.0 downloaded. Loading a built-in model needs the Moss cloud to be reachable; the `custom` model still takes caller embeddings and downloads nothing.
> * `libmoss.so`, `libmoss.dylib` and `moss.dll` export exactly the `moss_*` functions declared in `libmoss.h` and nothing else.
> * Each archive ships `include/libmoss.h` and the shared library, plus the import library `lib/moss.dll.lib` on Windows. The static libraries (`libmoss.a`, `moss.lib`) are no longer included.
> * The macOS dylib has the install name `@rpath/libmoss.dylib`: link with an `-rpath` that resolves to the archive's `lib/`, for example `-Wl,-rpath,@loader_path/lib`.
> * The Linux builds support glibc 2.35 and newer on x86\_64, and glibc 2.39 and newer on aarch64.
>
> **2026-10-05**
>
> v1.15.0
>
> **Added**
>
> * `MossClient.close()` and `SessionIndex.close()`, and both work as `with` and `async with` context managers. `close()` sends the final usage telemetry, waiting until it is delivered or 2 seconds pass, and frees the native memory; `MossClient.close()` also closes the sessions the client opened. Afterwards every `MossClient` method raises `RuntimeError("MossClient is closed")` and every `SessionIndex` method but `name` raises `InvalidArgumentError`. Requires `inferedge-moss-core` 0.27.0.
> * `moss.MossError`, a `RuntimeError` subclass raised for every failure the native core reports. `code` is a stable string to branch on: `INVALID_ARGUMENT`, `NOT_FOUND`, `UNAUTHORIZED`, `NETWORK`, `DESERIALIZATION`, `MODEL_UNAVAILABLE` or `INTERNAL`. `moss.InvalidArgumentError` is the `INVALID_ARGUMENT` subclass and is also a `ValueError`. `detail` holds the core error text in released wheels too: diagnostic text for logs and support, at most 512 bytes, and not a stable contract. Requires `inferedge-moss-core` 0.27.0.
> * `LoadIndexesResult.failed_codes` maps each index that `load_indexes` could not load to its code, such as `"NOT_FOUND"`. Requires `inferedge-moss-core` 0.27.0.
>
> **Changed**
>
> * `MossError.detail` carries no request URL for a cloud or model download error: a cloud timeout, retry or response parse failure names the operation, such as `get_index_info`, and a model download names only the host. Cache, repair, snapshot and `MOSS_CA_BUNDLE` errors name the file, not its absolute path. Parser text from `.moss` payloads and from release and manifest files goes to the debug log, and ONNX Runtime and tokenizer failures give fixed text. A failed response contributes only its HTTP status and the error code its body names, such as `HTTP 403 Forbidden: AccessDenied` from the object store or `HTTP 409 Conflict: INDEX_EXISTS` from the Moss service, never the rest of the body. A `.moss` payload whose JSON does not parse, or whose document count does not match its header, gives the detail `index payload is malformed`; header and length errors keep their own short text, such as `binary data truncated`. A lock left unusable by an earlier panic raises `MossError` with code `INTERNAL` and the detail `internal state is unavailable after an earlier failure`, also when an embedding model load hits it.
> * `MossError.detail` names a numbered fault for a damaged on-device vector file or session snapshot, such as `fault 1028` for a vector count that differs from the snapshot metadata, and no longer describes the file layout or the snapshot files. Build the core with its `diagnostics` Cargo feature to add the description.
> * **Behavior change:** error messages from the native core are fixed text per kind of failure, such as `Index not found.` or `The Moss service could not be reached.`, and no longer carry URLs, file paths or index names. Code that matched on message text should branch on `MossError.code`. A failed `load_index` or `unload_index` now raises the core's `MossError` directly instead of wrapping it in a `RuntimeError` that names the index. A text query on an index that cannot embed it (a custom-embedding index, or a foundation index without an artifact identity) raises `InvalidArgumentError`, still a `ValueError`, with the core's message. The reasons in `load_indexes().failed` are the same fixed messages. `query` on an index that is not loaded raises `MossError` with code `NOT_FOUND`, still a `RuntimeError`, and its message still names the load call.
> * **Behavior change:** only `INVALID_ARGUMENT` failures are still a `ValueError`. These session failures were `ValueError` and are now a `MossError` (a `RuntimeError`) with the code shown: a rejected project key when opening a session (`UNAUTHORIZED`), a service or network failure when opening one (`NETWORK` or another cloud code), a model that cannot be downloaded or loaded during `add_docs` or `query` with text (`MODEL_UNAVAILABLE`), and an embedding failure during those calls (`INTERNAL`). Code that catches `ValueError` around these calls should catch `MossError` as well.
> * Built-in model loads (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) are faster, most of all on arm64. No API change. Requires `inferedge-moss-core` 0.27.0.
> * `SessionIndex.add_docs` on a session with a built-in model embeds the documents in batches of at most 8,192 padded tokens, grouped by length, instead of one batch padded to the longest document. Large calls need far less memory and time: on an Apple M2, 5,000 short captions in one call took about 20 s with a 0.6 GB peak instead of about 119 s and 9.1 GB. A query embedding for the same model waits for one batch instead of the whole call. Embeddings come back in input order, with the same values to about 1e-7. Requires `inferedge-moss-core` 0.27.0.
> * **Behavior change:** a malformed `$near` filter value is rejected with a `ValueError` naming the expected `"lat,lng,maxDistanceMeters"` format instead of matching nothing.
> * **Breaking change:** `$gt`, `$gte`, `$lt` and `$lte` compare two plain decimals (`"42"`, `"-3.5"`) as numbers and two other values as text, and never match a plain decimal against any other value. Zero padded numbers such as `"07"` and forms such as `"1e3"` or `"NaN"` are text, so `"07"` no longer matches `$gt: "5"` and `"naming"` never matches `$gt: "999999"`. Sorting `get_docs` by a field (`sort_by`) and assembling a `ParentGrouping` by `order_field` put decimals first in numeric order, zero padded ones included, so `"099"` sorts before `"100"`, then every other value in text order, forms such as `"1e3"` or `"NaN"` included. A condition still never matches a document that lacks the field, `$ne` and `$nin` included.
> * Filter validation and ordering come from `inferedge-moss-core` 0.27.0.
> * **Behavior change:** `query_multi_index([])` and `query` without an embedding on a custom-model session raise `InvalidArgumentError`, still a `ValueError`, with code `INVALID_ARGUMENT`. A malformed metadata filter that raised a plain `ValueError` raises `InvalidArgumentError` with the same text; a filter value of the wrong type still raises `TypeError`. `InvalidArgumentError.code` is `"INVALID_ARGUMENT"` on the class too.
> * A load with a cache path that finds no usable snapshot while the Moss service is unreachable reports `NETWORK` instead of `DESERIALIZATION`. An auth URL that answers 404 or 410 reports `INTERNAL` instead of `NOT_FOUND`. A refused index name keeps the naming rule as its message, and a file with an unsupported content type reads `A file has an unsupported content type.` A text call on a session whose model cannot embed raises `InvalidArgumentError` with the message `This session's model cannot embed text. Pass embeddings with the documents and the query.`
> * `IndexManager.query` with an empty query embedding runs keyword-only at `alpha` 0, as `query_multi_index` does, and raises `InvalidArgumentError` at a higher `alpha` on an index that holds vectors.
>
> **Fixed**
>
> * Usage telemetry that fails to upload is retried on the next flush, every event under a stable `eventId`, for up to an hour and 20,000 events, instead of being dropped. A client or session garbage collected without `close()` blocks for at most 500 ms on its final flush instead of without limit. Requires `inferedge-moss-core` 0.27.0.
> * `load_index` with `auto_refresh=True` compares `updatedAt` as a point in time, so two spellings of one instant are no change, and a tick that finds a new snapshot fetches the index metadata once instead of twice. After a `load_index` served stale from `cache_path`, the first auto refresh that reaches the cloud warms the embedding model even when the snapshot is unchanged. Requires `inferedge-moss-core` 0.27.0.
> * A query whose stored vectors have another length than the query raises `MossError` with code `INTERNAL` instead of ranking those documents with score 0. `Index.serialize` in `inferedge-moss-core` raises `ValueError` for a vector it cannot read. Requires `inferedge-moss-core` 0.27.0.
>
> **2026-10-05**
>
> v1.16.0
>
> **Added**
>
> * `isMossError(error)` and the `MossError` / `MossErrorCode` types. An error from the native core is an `Error` whose `code` is one of `INVALID_ARGUMENT`, `NOT_FOUND`, `UNAUTHORIZED`, `NETWORK`, `DESERIALIZATION`, `MODEL_UNAVAILABLE` or `INTERNAL`; branch on `code` instead of the message. `detail` holds the core error text, diagnostic text for logs and support rather than a stable contract. Requires `@moss-js/moss-core` 0.31.0.
> * `LoadIndexesResult.failedCodes` maps each index that `loadIndexes` could not load to its `MossErrorCode`. Requires `@moss-js/moss-core` 0.31.0.
>
> **Changed**
>
> * **Behavior change:** errors from the native core carry fixed messages per kind of failure, such as `Index not found.`, with no URLs, file paths or index names. The reasons in `loadIndexes().failed` are the same fixed messages. `query` on an index that is not loaded rejects with code `NOT_FOUND`, and its message still names the load call. `queryMultiIndex` on an index that cannot embed text rejects with the core's own error (code `INVALID_ARGUMENT`, message `This index cannot embed text queries. Pass a query embedding, or use alpha 0 for keyword-only search.`) instead of rewording it.
> * Built-in model loads (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) are faster, most of all on arm64. No API change. Requires `@moss-js/moss-core` 0.31.0.
> * `SessionIndex.addDocs` on a session with a built-in model embeds the documents in batches of at most 8,192 padded tokens, grouped by length, instead of one batch padded to the longest document. Large calls need far less memory and time: on an Apple M2, 5,000 short captions in one call took about 20 s with a 0.6 GB peak instead of about 119 s and 9.1 GB. A query embedding for the same model waits for one batch instead of the whole call. Embeddings come back in input order, with the same values to about 1e-7. Requires `@moss-js/moss-core` 0.31.0.
> * **Behavior change:** a malformed `$near` filter value is rejected with an error naming the expected `"lat,lng,maxDistanceMeters"` format instead of matching nothing.
> * **Breaking change:** `$gt`, `$gte`, `$lt` and `$lte` compare two plain decimals (`"42"`, `"-3.5"`) as numbers and two other values as text, and never match a plain decimal against any other value. Zero padded numbers such as `"07"` and forms such as `"1e3"` or `"NaN"` are text, so `"07"` no longer matches `$gt: "5"` and `"naming"` never matches `$gt: "999999"`. A number in a filter is compared in its plain decimal form, so `0.000001` still orders as a number. A condition still never matches a document that lacks the field, `$ne` and `$nin` included.
> * **Behavior change:** saving a session keeps vectors that were loaded as INT8 in INT8. It used to widen them to FP32, a file about four times larger with no gain in precision.
> * Filter validation and ordering come from `@moss-js/moss-core` 0.31.0.
> * `queryMultiIndex([])` and `SessionIndex.query` without an embedding on a custom-model session throw an `Error` with code `INVALID_ARGUMENT`, so `isMossError` accepts them.
> * A load with a cache path that finds no usable snapshot while the Moss service is unreachable reports `NETWORK` instead of `DESERIALIZATION`. An auth URL that answers 404 or 410 reports `INTERNAL` instead of `NOT_FOUND`. A refused index name keeps the naming rule as its message, and a file with an unsupported content type reads `A file has an unsupported content type.` Requires `@moss-js/moss-core` 0.31.0.
>
> **Fixed**
>
> * `MossClient.close()` and `SessionIndex.close()` resolve once the final usage telemetry is delivered or 2 seconds pass, retrying a failing endpoint in that time, so a process that exits right after `await client.close()` reports its last queries. Telemetry a periodic flush could not deliver is retried on the next flush instead of dropped. Requires `@moss-js/moss-core` 0.31.0.
> * `loadIndex` with `autoRefresh` and session auto refresh compare `updatedAt` as a point in time, so two spellings of one instant are no change, and a tick that finds a new snapshot fetches the index metadata once instead of twice. After a `loadIndex` served stale from `cachePath`, the first auto refresh that reaches the cloud warms the embedding model even when the snapshot is unchanged. Requires `@moss-js/moss-core` 0.31.0.
> * A query whose stored vectors have another length than the query rejects with code `INTERNAL` instead of ranking those documents with score 0. Requires `@moss-js/moss-core` 0.31.0.
>
> **2026-10-05**
>
> v1.4.0
>
> **Added**
>
> * Usage telemetry, always on, as in the native SDKs: it carries the query counts Moss bills, and there is no option to turn it off. The client sends its query count every 3 seconds while there are new queries, on `dispose()` and on `pagehide`, with `keepalive` when the bodies fit in about 60 KB shared by the page, as an `index.usage.periodic_flush` or `index.usage.final_flush` body and `index.query` and `index.query_multi` events in JSON arrays of up to 500, the bodies the native SDKs send. The client gets a token before each timer send, and every 30 seconds while there are no new queries, the way its other requests do: a cached token costs no request, and a token that is not cached is a `getAuthToken()` call. Counts wait until the first token request succeeds. Every event carries a `deviceId`: a random UUID kept in `localStorage` under `moss-device-id`, or an id for the page, worker or process alone where storage is missing or throws. A query costs one counter increment. The README lists the events and fields. Requires `@moss-dev/moss-wasm` 0.17.0; 0.16.0 sends no telemetry.
> * `loadIndexes` results carry a `failedCodes` map from each failed index name to its stable code, such as `NOT_FOUND` or `NETWORK`, next to the message in `failed`. A failure without a code, such as one raised by an older `@moss-dev/moss-wasm`, has no entry.
>
> **Changed**
>
> * **Behavior change:** failures from the WASM core reject with an `Error` instead of a plain string. Its `code` is a stable string: `INVALID_ARGUMENT`, `NOT_FOUND`, `UNAUTHORIZED`, `NETWORK`, `DESERIALIZATION`, `MODEL_UNAVAILABLE` or `INTERNAL`. The message is fixed text per kind of failure, such as `Index not found.`, with no URLs or index names; `@moss-dev/moss-wasm` adds the core error text as `detail` in release builds too, which names the cloud operation instead of the request URL and keeps only the HTTP status and error code of a failed response. `detail` is diagnostic text for logs and support, at most 512 bytes, and not a stable contract. The WASM `query`, `queryWithModelIdentity`, `queryMultiIndex` and `queryMultiIndexWithModelIdentity` accept a missing (`null` or `undefined`) query embedding and reject with a coded error when the query needs one, instead of a `TypeError` from the generated glue. Requires `@moss-dev/moss-wasm` 0.17.0.
> * A `ModelDeliveryError` from a model artifact transfer names the file and host, such as `'model.mossml' from models.moss.link`, instead of the full artifact URL.
> * Opening `moss-minilm` in Node 24 on an Apple M2 takes about 90 ms instead of about 1.9 s, and a whole model load from memory about 0.3 s instead of about 2.1 s. The model no longer passes through wasm memory, which stays near 9 MB instead of growing past 95 MB. Where Web Crypto is unavailable, as on a plain HTTP page, the SDK opens the model in wasm. Requires `@moss-dev/moss-wasm` 0.17.0; with 0.16.0 the SDK opens the model as before. No API change.
> * The embedding model is hashed once per page load: with `@moss-dev/moss-wasm` 0.17.0 the SDK does not hash it again in wasm. Where the SDK opens the model in wasm, opening `moss-minilm` in V8 on an Apple M2 takes about 1.6 s instead of about 2.5 s. With 0.16.0 the SDK opens the model as before. No API change.
> * Where the SDK opens the embedding model in wasm, the load holds one full size copy of it in wasm memory instead of three, which lowers peak wasm memory. Requires `@moss-dev/moss-wasm` 0.17.0. No API change.
> * **Behavior change:** metadata filters validate `$near`. The value must be `"lat,lng,maxDistanceMeters"`; anything else, such as a bare number or a `"lat,lng"` pair, makes the query fail with an error naming that format instead of matching nothing. The `$near` type is `string`, so a bare number no longer type checks.
> * **Breaking change:** `$gt`, `$gte`, `$lt` and `$lte` compare two plain decimals (`"42"`, `"-3.5"`) as numbers and two other values as text, and never match a plain decimal against any other value. Zero padded numbers such as `"07"` and forms such as `"1e3"` or `"NaN"` are text, so `"07"` no longer matches `$gt: "5"` and `"naming"` never matches `$gt: "999999"`. A number in a filter is compared in its plain decimal form, so `0.000001` still orders as a number. A zip code such as `"01234"` no longer passes `$gt: "1000"` or `$lt: "1000"`. The README notes the ordering rule, the `$near` format and the rule that a condition never matches a document lacking the field, `$ne` and `$nin` included. Requires `@moss-dev/moss-wasm` 0.17.0.
> * A malformed metadata filter or query tuning passed to the WASM query methods rejects with code `INVALID_ARGUMENT` and the parser's reason as the message, such as `$and value must be an array`. Malformed documents and files keep a fixed message, with the reason in `detail`. A presigned upload answered with a 4xx other than 401 or 403 rejects with that status's code, such as `INVALID_ARGUMENT` for 413, instead of `NETWORK`. `query` and `queryWithModelIdentity` with a missing embedding run keyword-only at `alpha` 0, as the multi-index calls do. Requires `@moss-dev/moss-wasm` 0.17.0.
> * An auth URL that answers 404 or 410 reports `INTERNAL` instead of `NOT_FOUND`, and a refused index name keeps the naming rule as its message.
>
> **Fixed**
>
> * **`autoRefresh` takes effect:** `loadIndex(name, { autoRefresh: true })` refreshes the index every `pollingIntervalInSeconds` (600 when unset or 0, at least 1) until it is unloaded, loaded again without `autoRefresh`, or the client is disposed. A negative or non-finite interval is rejected before loading. The option used to be accepted and ignored. Requires `@moss-dev/moss-wasm` 0.17.0: an older one would download the whole index on every tick, so with it `autoRefresh` stays off, the index still loads, and the client logs one warning.
> * **`onProgress` takes effect:** `createIndex`, `createIndexFromFiles`, `addDocs` and `deleteDocs` call `onProgress` with each job status they poll. An exception thrown by the callback, or a rejected promise it returns, is ignored. With a `@moss-dev/moss-wasm` that cannot report progress, passing `onProgress` throws before the job starts. A null `onProgress` counts as none. Requires `@moss-dev/moss-wasm` 0.17.0.
> * **`refreshIndex` reports real changes:** when the cloud snapshot is no newer than the loaded one and uses the same model, `refreshIndex` downloads nothing and returns `wasUpdated: false`. It used to download the whole index and return `wasUpdated: true` every time. Requires `@moss-dev/moss-wasm` 0.17.0.
> * A query whose stored vectors have another length than the query rejects with code `INTERNAL` instead of ranking those documents with score 0. Requires `@moss-dev/moss-wasm` 0.17.0.
>
> **2026-10-05**
>
> v1.5.0
>
> **Added**
>
> * `Moss.Session.close/1`, `Moss.IndexManager.close/1` and `Moss.Client.close/1` send the final usage telemetry, waiting until it is delivered or 2 seconds pass, and stop the process. Closing a process that already stopped returns `:ok`.
> * `Moss.LoadIndexesResult` has `failed_codes`, mapping each name that did not load to the same code atom `Moss.Error` carries. The reasons in `failed` are the fixed messages, with no URLs, file paths or index names.
>
> **Changed**
>
> * Bumped `moss_core` dependency to 0.22.0.
> * **Behavior change:** `Moss.Session` and `Moss.IndexManager` trap exits, so a supervisor shutdown or the abnormal exit of a linked process runs the same close before the process stops. A process that starts one with `start_link/1` closes it when it exits, even normally. `Moss.Client.new/3` and `Moss.Client.session/3` start unlinked and then link, so a normal exit of their caller leaves the manager and the session running as before.
> * **Breaking:** every `{:error, reason}` from this SDK carries a `%Moss.Error{}` instead of a binary. `code` is an atom to match on: `:invalid_argument`, `:not_found`, `:unauthorized`, `:network`, `:deserialization`, `:model_unavailable` or `:internal`. `message` is fixed text per kind of failure (for example `"Index not found."`) with no URLs, file paths or index names, and `detail` holds the native error text in release and debug NIF builds alike: diagnostic text for logs and support, at most 512 bytes, and not a stable contract. That text names the operation or host in place of a request URL, and the file in place of an absolute path. A failed response contributes only its HTTP status and the error code its body names, such as `HTTP 403 Forbidden: AccessDenied` from the object store or `HTTP 409 Conflict: INDEX_EXISTS` from the Moss service, never the rest of the body. `Moss.Error` is an exception and implements `String.Chars`, so `raise reason`, `Exception.message(reason)`, `inspect(reason)` and `"#{reason}"` keep working; code that treats `reason` as a binary (`reason <> ...`, `reason =~ ...`, `when is_binary(reason)`) must read `reason.message` or match on `reason.code` instead. Option errors the NIF raises itself (`parse_options`, metadata filters, file maps) keep their descriptive text as the `message` with code `:invalid_argument`. A text query on an index that cannot embed text returns the core's message, `"This index cannot embed text queries. Pass a query embedding, or use alpha 0 for keyword-only search."`, instead of a reworded one. The NIF no longer uses Rust `Debug` formatting for error text.
> * The `detail` for a damaged on-device vector file or session snapshot names a numbered fault, such as `fault 1028` for a vector count that differs from the snapshot metadata, and no longer describes the file layout or the snapshot files. Build the core with its `diagnostics` Cargo feature to add the description.
> * Built-in model loads (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) are faster, most of all on arm64. No API change.
> * `Moss.Session.add_docs/3` on a session with a built-in model embeds the documents in batches of at most 8,192 padded tokens, grouped by length, instead of one batch padded to the longest document. Large calls need far less memory and time: on an Apple M2, 5,000 short captions in one call took about 20 s with a 0.6 GB peak instead of about 119 s and 9.1 GB. A query embedding for the same model waits for one batch instead of the whole call. Embeddings come back in input order, with the same values to about 1e-7.
> * **Behavior change:** a malformed `$near` filter value is rejected with an error naming the expected `"lat,lng,maxDistanceMeters"` format instead of matching nothing.
> * **Breaking change:** `$gt`, `$gte`, `$lt` and `$lte` compare two plain decimals (`"42"`, `"-3.5"`) as numbers and two other values as text, and never match a plain decimal against any other value. Zero padded numbers such as `"07"` and forms such as `"1e3"` or `"NaN"` are text, so `"07"` no longer matches `$gt: "5"` and `"naming"` never matches `$gt: "999999"`. A condition still never matches a document that lacks the field, `$ne` and `$nin` included.
> * A load with a cache path that finds no usable snapshot while the Moss service is unreachable reports `:network` instead of `:deserialization`. An auth URL that answers 404 or 410 reports `:internal` instead of `:not_found`. A refused index name keeps the naming rule as its message, and a file with an unsupported content type reads `A file has an unsupported content type.` A text call on a session whose model cannot embed returns `:invalid_argument` with the message `"This session's model cannot embed text. Pass embeddings with the documents and the query."`
>
> **Fixed**
>
> * Usage telemetry that fails to upload is retried on the next flush, every event under a stable `eventId`, for up to an hour and 20,000 events, instead of being dropped.
> * `load_index/3` on a `moss-minilm` or `moss-mediumlm` index returns `{:ok, info}` instead of `{:error, reason}` when the cloud is unreachable and it serves a `:cache_path` snapshot. The core warms the model inside the load and tolerates a warm that fails offline, so the SDK makes no second warm call after the load. The embedding model cannot be opened until the Moss cloud is reachable, so text queries with `alpha` above 0 fail until then. Keyword-only queries (`alpha: 0.0`) and queries that pass an `:embedding` keep working, and a later refresh or query warms the model once the cloud returns.
> * `refresh_index/2` downloads nothing and returns `was_updated: false` when the cloud snapshot is no newer than the loaded one and uses the same model. It used to download the whole index and return `was_updated: true` every time. On an index served stale from its cache, such a refresh still warms the embedding model.
> * A query whose stored vectors have another length than the query returns `{:error, %Moss.Error{code: :internal}}` instead of ranking those documents with score 0.
>
> **2026-10-05**
>
> v0.8.0
>
> **Added**
>
> * **`MossError` code constants and `detail`.** `MossError.notFound`, `.unauthorized`, `.network`, `.invalidArgument`, `.modelUnavailable`, `.deserialization`, `.internalError` and `.nullPointer` name the libmoss result codes, so callers can compare `error.code` without literals. `MossError.detail` carries the core error text when the linked libmoss exports `moss_last_error_detail`, release builds included, or the Foundation error when the model cache directory cannot be created, and is `nil` otherwise. It is diagnostic text for logs and support, at most 512 bytes, and not a stable contract. It names the operation or host in place of a request URL, and the file in place of an absolute path. A failed response contributes only its HTTP status and error code, such as `HTTP 403 Forbidden: AccessDenied`. A lock left unusable by a panic reads `internal state is unavailable after an earlier failure`.
> * **`LoadIndexesResult.failedCodes`.** `loadIndexes` maps each index it could not load to its `MossError` code, next to the message in `failed`. The message is the same fixed text a thrown `MossError` carries. Empty when the linked libmoss does not report codes.
>
> **Changed**
>
> * **`close()` delivers the final usage telemetry within 2 seconds.** `MossClient.close()` and `MossSession.close()`, and `deinit`, wait until the final flush is delivered or 2 seconds pass, retrying a failing endpoint in that time, instead of blocking without limit on a slow one. Telemetry a periodic flush could not deliver is retried on the next flush instead of dropped.
> * **Behavior change:** `MossError.code` follows the kind of failure instead of the call that failed. A missing index is `notFound` (-4), a rejected project key or token is `unauthorized` (-8, new), an unreachable or unresponsive service is `network` (-3), and undecodable data is `deserialization` (-9, new). A load or query used to report -3 for all of these. `message` is fixed text for each kind and carries no URLs, file paths or index names. A call that reports success but hands back no result throws `internalError` (-7) with its own message instead of repeating an earlier call's error text.
> * `MossError.detail` names a numbered fault for a damaged on-device vector file or session snapshot, such as `fault 1028` for a vector count that differs from the snapshot metadata, and no longer describes the file layout or the snapshot files. A release `Moss.xcframework` carries none of that description.
> * **Faster foundation model loads.** On an Apple M2, preparing a downloaded `moss-minilm` takes about 0.14 s instead of about 1.85 s. No API change.
> * **`MossSession.addDocs` embeds large calls in batches.** A session with a built-in model embeds the documents in batches of at most 8,192 padded tokens, grouped by length, instead of one batch padded to the longest document. On an Apple M2, 5,000 short captions in one call took about 20 s with a 0.6 GB peak instead of about 119 s and 9.1 GB. A query embedding for the same model waits for one batch instead of the whole call. No API change.
> * **Behavior change:** a `Filter.near` with a non-finite coordinate or a negative distance, or a raw filter with a malformed `$near` value, is rejected with an error naming the expected `"lat,lng,maxDistanceMeters"` format instead of matching nothing.
> * **Breaking change:** `$gt`, `$gte`, `$lt` and `$lte` compare two plain decimals (`"42"`, `"-3.5"`) as numbers and two other values as text, and never match a plain decimal against any other value. Zero padded numbers such as `"07"` and forms such as `"1e3"` or `"NaN"` are text, so `"07"` no longer matches `$gt: "5"` and `"naming"` never matches `$gt: "999999"`. Sorting `getDocs` by a field (`sortBy`) and assembling a `ParentGrouping` by `orderField` put decimals first in numeric order, zero padded ones included, so `"099"` sorts before `"100"`, then every other value in text order, forms such as `"1e3"` or `"NaN"` included. A number in a filter is compared in its plain decimal form, so `0.000001` still orders as a number. A condition still never matches a document that lacks the field, `$ne` and `$nin` included.
> * A load with a cache path that finds no usable snapshot while the Moss service is unreachable reports `network` instead of `deserialization`. An auth URL that answers 404 or 410 reports `internalError` instead of `notFound`. A refused index name keeps the naming rule as its message, and a file with an unsupported content type reads `A file has an unsupported content type.`
>
> **Fixed**
>
> * **`loadIndex` with a cache path checks the cached vector file against the index.** A `.mossvec` that holds as many vectors of the same size as the index, but other vectors, such as another index's file copied over it, is left unused and the index answers from memory. The check compares the first, middle and last vector. Requires a `Moss.xcframework` built from the matching libmoss.
> * **A local custom session stays custom when it loads a foundation snapshot.** To serve text queries from a restored foundation snapshot, open the session with the index's foundation `modelId`, for example `SessionOptions(modelId: "moss-minilm", autoLoadOnInit: false)`. Its constructor confirms the credentials with one token request, so it needs the network when the session opens, and `loadFromDisk` then restores the saved model from disk with no download. A session opened with `SessionOptions(modelId: "custom", autoLoadOnInit: false)` skips that check, and its `loadFromDisk` adopts a foundation model named by the snapshot only after `loadIndex` has confirmed the credentials in the same session. Before that the snapshot loads as `custom` and text queries need explicit embeddings. Saving such a session before it changes any document keeps the snapshot's foundation model on disk. Calling `loadIndex` again also restores text queries, but it downloads the whole index.
> * **`MossClient.createIndex` and `addDocs` refuse a document id holding U+0000.** They check their ids as `deleteDocs` does and throw `MossError` with code `-2` before any native call. The cloud stored such an id intact, `deleteDocs` could not remove it, and `query` after `loadIndex` returned it as an empty id.
> * **`refreshIndex` reports real changes.** When the cloud snapshot is no newer than the loaded one and uses the same model, `refreshIndex` downloads nothing and returns `wasUpdated` false. It used to download the whole index and return true every time. On an index served stale from its cache, such a refresh still warms the embedding model.
> * **Stored vectors the core cannot score fail the query.** A query whose stored vectors have another length than the query throws `MossError` with code `internalError` (-7). A release build used to rank those documents with score 0, and a debug build crashed. Load and add refuse such vectors, so only a fault inside the SDK reaches this. A v1 vector file that declares INT8 vectors is refused at load.
>
> Native runtime `sdkVersion`: `0.24.0`.
>
> **2026-10-05**
>
> v1.0.0-beta.4
>
> **Changed**
>
> * Depends on `@moss-js/moss` ^1.15.0 instead of `@inferedge/moss`, with no pinned `overrides`, and requires Node 20.4 or newer. There is no musl build, so Alpine is not supported. On Linux, x64 needs glibc 2.35 or newer and arm64 needs glibc 2.39 or newer.
> * `query` takes an optional `alpha` from 0 to 1. `alpha: 0` is keyword only and skips local embedding. At the default `alpha`, `query` returns an error for a custom-model index or an older index without a model artifact identity, and `alpha: 0` still searches them.
> * The SDK-backed tools read `MOSS_INDEX_URL` and `MOSS_AUTH_URL` instead of `MOSS_CLOUD_API_MANAGE_URL` and `MOSS_CLOUD_QUERY_URL`.
> * On stdin end, SIGINT or SIGTERM the server closes the SDK client, which sends its final telemetry, and exits within 8 seconds. On stdin end it first waits for running tool calls.
>
> **2026-10-02**
>
> **New onboarding**
>
> * Sign-up asks what you are building and which stack you use, then opens a ready-made index in your project so you can search it right away. **Just exploring?** opens the demo directly.
> * **Ready to use your own data?** builds your first index from a website or from PDF and DOCX files without leaving onboarding, or keeps the sample data for now.
> * **Connect your app** shows install, credentials, and a first search for your language against the index you just built. **Create key** mints a project key in place (shown once), and your app's first query is detected automatically.
>
> **Changed**
>
> * Every index page has a **Connect** tab with the install, keys, and first-search guide, replacing **Quick Start** under **Settings**.
>
> **Founding Agent setup**
>
> * The new-agent setup starts with **What are you building?** (optional), which shapes the drafted greeting, instructions, and suggested questions. The knowledge step lists the pages read from your website and the Q\&A or text you added, editable in place.
> * New **Suggested questions** step: about five questions visitors are likely to ask, each with an answer drafted from your website. Accept, edit, delete, or skip each one; accepted ones are saved as Q\&A.
> * Each agent opens on an **Overview** with conversations, leads, high-intent conversations, meetings booked, and unanswered questions, plus one suggested next action.
>
> **2026-10-01**
>
> **Changed**
>
> * Two-factor codes are entered one digit per box. Pasting a code or letting your phone fill it in still works.
> * Switching between the **Developer Portal** and **Founding Agent** is faster: the sidebar shows at once and the page loads behind it.
> * The **Playground** shows a score next to each result, and the dashboard no longer downloads the embedding model on every visit. Indexes built with an older SDK that does not record its model cannot be searched in the Playground.
>
> **Fixed**
>
> * The Founding Agent install snippet installs `@moss-js/founding-agent` with the packages the widget needs and includes the Tailwind setup its styling depends on.
>
> **2026-09-29**
>
> **Founding Agent Knowledge tab**
>
> * **Add website** crawls a site into the agent's knowledge, with a page limit, live progress, re-crawl, and remove. Bare domains like `docs.example.com` are accepted.
> * **Add files** uploads up to 10 PDF or DOCX files (20 MB each, 50 MB total). **My files are scanned** runs OCR and is available on paid plans.
> * The tab is organized into **Websites**, **Uploaded files**, and **Everything the agent knows**. Long pages collapse with **Show full page**, and Q\&A changes show up right away.
>
> **2026-09-29**
>
> v1.14.0
>
> **Added**
>
> * `MossClient(cache_path=...)` sets a client-level default `cache_path` for `load_index` / `load_indexes`, the directory for the on-disk index cache and the `.moss-device-id` file. A per-call `cache_path` overrides it. With neither, indexes are not cached on disk and the device id stays in `~/.moss`. Parity with the JS SDK's `MossClientOptions.cachePath`.
> * Offline-tolerant `load_index` and `load_indexes`. With a `cache_path` and a snapshot already on disk, a load whose cloud metadata check cannot reach the cloud, times out, or gets a 408, 429, 500, 502, 503 or 504 (only a 408, 429, 500 or 503 from the auth service) serves the cached snapshot instead of failing, probes the cloud with a few-second budget rather than the full retry window, and starts a refresh poller so the index self-heals when the cloud returns. A 401, 403 or real 404 still fails, so a forbidden or deleted index does not resurrect from cache. A snapshot written by 1.13.0 or earlier is not served until the index is downloaded again, which happens when the cloud copy changes. A snapshot fetched under another project or cloud origin is never served. `MossClient.was_served_stale(name)` reports whether an index is currently served from such a snapshot. The index loads, but a built-in embedding model cannot be opened until the Moss cloud is reachable, so text queries with `alpha` above 0 fail until then. Keyword-only queries (`alpha == 0`) and queries that pass their own `embedding` keep working, and a later refresh or query warms the model once the cloud returns. Requires `inferedge-moss-core` 0.26.0 (`was_served_stale` on `IndexManager`).
> * `QueryOptions.min_score` drops results whose `score` is below it; a query returns up to `top_k` results that clear it, in hybrid order. It takes a value from 0 to 1; anything else raises an error. Keyword-only queries (`alpha == 0`) and queries on indexes that hold no vectors have no embedding to score against, so `min_score` on them raises a clear error. Works in `query` and `query_multi_index`; `SessionIndex.query` ignores it.
> * `QueryOptions.candidate_depth` sets how many hits a hybrid query ranks on each signal (vector and keyword) before fusion. A hit outside both lists is never returned, so a deeper list raises recall and query time. Left unset, a hybrid query looks `2 * top_k` deep, as before. A set value must be at least 1 (0 raises an error) and is raised to `top_k` when below it. Keyword-only and vector-only queries (`alpha` 0 or 1) ignore it and rank `top_k` hits, since a deeper list returns the same results. Works in `query` and `query_multi_index`; `SessionIndex.query` ignores it. Requires `inferedge-moss-core` 0.26.0.
>
> **Changed**
>
> * **Behavior change:** `score` is the result's relevance to the query from 0 to 1, in `query`, `query_multi_index` and `SessionIndex.query` alike. Results keep their hybrid order, so a lower-ranked result can show a higher score. Scores depend on the embedding model: tune `min_score` on your own queries. Keyword-only queries (`alpha == 0`) score every result 0.0. Code that relied on the top result scoring about 1.0, or on multi-index `alpha=1.0` scores being raw similarity values, needs updating.
> * **Behavior change:** a query `embedding` whose length differs from the index dimension raises at `alpha` 0 as it does above 0; it used to be ignored at 0. An empty `embedding=[]` counts as wrong-size in `query` and `SessionIndex.query`, so it raises at every `alpha`, while `query_multi_index` reads it as no embedding. Requires `inferedge-moss-core` 0.26.0.
> * **Behavior change:** a blank query (empty or only whitespace) with no `embedding` returns no results at every `alpha` without running the embedding model. It used to embed the empty text above `alpha` 0 and rank every document against it. A blank query with an `embedding` ranks by the embedding. Requires `inferedge-moss-core` 0.26.0.
> * Requires `inferedge-moss-core` 0.26.0 (was 0.25.0). That core adds the `min_score` query parameter and the relevance `score`.
> * Queries no longer send one telemetry request each. `index.query`, `index.query_multi` and `session.query` events are buffered and sent with the usage flush every 3 seconds and at close, as JSON arrays of up to 500 events, one request per array. Each event keeps the fields it had, including its own `latencyMs`. Up to 10,000 events wait between flushes; events past that are dropped and the count is logged. Usage counts are unchanged. The README lists every telemetry event and its fields. Comes with `inferedge-moss-core` 0.26.0.
> * Keyword-only and hybrid queries without a `filter` that match many documents in a large index are faster, since keyword search sorts only the top hits instead of every match. Comes with `inferedge-moss-core` 0.26.0.
>
> **Fixed**
>
> * Every call that names a cloud index (`create_index`, `create_index_from_files`, `create_web_source`, `get_index`, `delete_index`, `add_docs`, `delete_docs`, `get_docs`, `load_index`, `SessionIndex.push_index`) raises `RuntimeError` for a name that is blank, `"."` or `".."`, contains `/` or a control character, or is longer than 256 bytes, before any request is sent; `load_indexes` lists such a name in `failed`. The message includes `Validation error: index name must not be blank, "." or "..", must not contain "/" or control characters, and must be at most 256 bytes`, the same text in every SDK. Any other name is percent-encoded, so names with spaces, `%`, `?` or `#` reach their own index. Pass the raw name: a name that is already percent-encoded, for example with `urllib.parse.quote`, is encoded again and addresses a different index. Requires `inferedge-moss-core` 0.26.0.
> * `get_docs` percent-encodes each document id, so an id containing `,`, `&` or a space returns that one document. An id with a comma used to arrive as two ids.
> * `add_docs` sends `MutationOptions.upsert` to the cloud when set. The service decides how to apply it. Requires `inferedge-moss-core` 0.26.0.
> * Malformed index data and tokenizer files raise an ordinary error instead of a `PanicException`. An index whose stored vectors differ in length fails to load. A `tokenizer.json` whose truncation stride is not less than 512 minus its special tokens fails the model load. Deleting from an index stored without vectors works, and adding documents to it raises. Requires `inferedge-moss-core` 0.26.0.
> * A vector holding NaN or infinity raises instead of reordering results without an error. Adding documents with one raises for the whole call, naming the document and the position, and stores nothing. A query `embedding` holding one raises at every `alpha`, and loading an index that stores one fails. Requires `inferedge-moss-core` 0.26.0.
> * `MossClient.query` with `QueryOptions(top_k=0)` returns no results, as `query_multi_index` and `SessionIndex.query` do. It used to search with `top_k=5`.
> * `moss.__version__` now reads the installed distribution metadata (`importlib.metadata.version("moss")`) instead of a hardcoded literal, so it always matches the published package version. In a source tree that is not installed as a distribution it reports `0.0.0+unknown`.
> * `load_index` and `load_indexes` with `auto_refresh=True` and `polling_interval_in_seconds=0` poll at the default interval of 600 seconds. Before, the refresh task panicked as it started, so the index never refreshed while the load reported success. An interval above one year polls once a year. Requires `inferedge-moss-core` 0.26.0.
> * Keyword-only and hybrid queries order documents with equal keyword scores by their position in the index, so the same query returns the same results on every call. That order used to vary from call to call. Requires `inferedge-moss-core` 0.26.0.
> * When the auth service answers 500, 503, 429 or 408, the error names the HTTP status without the service's response body. A 403 from it raises the same invalid-credentials error as a 401. Requires `inferedge-moss-core` 0.26.0.
>
> See [Score semantics](https://docs.moss.dev/docs/integrate/retrieval.md#score-semantics).
>
> **2026-09-29**
>
> v1.15.0
>
> **Added**
>
> * `QueryOptions.minScore` drops hits whose `score` is below the threshold, from 0 to 1; a query returns up to `topK` hits that clear it, in hybrid order. A value outside 0 to 1 is rejected, and so is setting it on a keyword-only query (`alpha === 0`) or when no queried index holds vectors. `query` and `queryMultiIndex` forward it to all four native query methods; session queries ignore it.
> * `QueryOptions.candidateDepth` sets how many hits a hybrid query ranks on each signal (vector and keyword) before fusion. A hit outside both lists is never returned, so a deeper list raises recall and query time. Left unset, a hybrid query looks `2 * topK` deep, as before. A set value must be at least 1 (0 is rejected) and is raised to `topK` when below it. Keyword-only and vector-only queries (`alpha` 0 or 1) ignore it and rank `topK` hits, since a deeper list returns the same results. `query` and `queryMultiIndex` forward it to all four native query methods; session queries ignore it. Requires `@moss-js/moss-core` 0.30.0.
> * `loadIndex` and `loadIndexes` with a `cachePath` serve the snapshot saved there when the cloud is unreachable, instead of failing. When a snapshot is on disk, the cloud check makes one attempt within 5 seconds. A transport error (unreachable network, timeout) or an HTTP 408, 429, 500, 502, 503 or 504 (only a 408, 429, 500 or 503 from the auth service) loads the snapshot and starts a refresh poller, even without `autoRefresh`, so the index catches up when the cloud returns. A 404 still fails, as does a 401 or 403, so a deleted or forbidden index does not come back from cache. A snapshot saved by an SDK before 1.15.0, or under another project or cloud origin, is not served, and the load fails after that one attempt. A load that finds the cloud copy unchanged keeps the old snapshot, so a snapshot saved before 1.15.0 is served only after the index is downloaded again, which happens when the cloud copy changes. After a load from the snapshot, text queries with `alpha` above 0 fail until the Moss cloud is reachable, since a built-in embedding model cannot open offline, unless the same model is already open in this process. Keyword-only queries (`alpha: 0`) and queries that pass their own embedding keep working. Requires `@moss-js/moss-core` 0.30.0.
>
> **Changed**
>
> * **Behavior change:** `score` is the relevance of the hit to the query, from 0 to 1, in `query`, `queryMultiIndex` and `SessionIndex.query` alike. Results stay in hybrid order, so a lower-ranked result can show a higher score. Scores depend on the embedding model: tune `minScore` on your own queries. A keyword-only query (`alpha === 0`) scores every hit 0.
> * Requires `@moss-js/moss-core` 0.30.0, which adds the `minScore` query parameter and the relevance `score`.
> * **Behavior change:** a query `embedding` whose length differs from the index dimension rejects at `alpha` 0 as it does above 0; it used to be ignored at 0. An empty `embedding: []` counts as wrong-size in `query` and `SessionIndex.query`, so it rejects at every `alpha`, while `queryMultiIndex` reads it as no embedding. Requires `@moss-js/moss-core` 0.30.0.
> * **Behavior change:** a blank query (empty or only whitespace) with no `embedding` returns no results at every `alpha` without running the embedding model. It used to embed the empty text above `alpha` 0 and rank every document against it. A blank query with an `embedding` ranks by the embedding. Requires `@moss-js/moss-core` 0.30.0.
> * Queries no longer send one telemetry request each. `index.query`, `index.query_multi` and `session.query` events are buffered and sent with the usage flush every 3 seconds and at close, as JSON arrays of up to 500 events, one request per array. Each event keeps the fields it had, including its own `latencyMs`. Up to 10,000 events wait between flushes; events past that are dropped and the count is logged. Usage counts are unchanged. The README lists every telemetry event and its fields. Requires `@moss-js/moss-core` 0.30.0.
> * `MossClient.close()` and `SessionIndex.close()` resolve after the final telemetry flush is sent, so a process that exits right after `await close()` keeps its buffered query events. A flush waits at most 5 seconds for authentication, once for all its events, and 3 seconds per request. Requires `@moss-js/moss-core` 0.30.0.
> * Keyword-only and hybrid queries without a `filter` that match many documents in a large index are faster, since keyword search sorts only the top hits instead of every match. Keyword scores are the same. Requires `@moss-js/moss-core` 0.30.0.
>
> **Fixed**
>
> * Malformed index data and tokenizer files reject with an ordinary error instead of a native panic. An index whose stored vectors differ in length fails to load. A `tokenizer.json` whose truncation stride is not less than 512 minus its special tokens fails the model load. Deleting from an index stored without vectors works, and adding documents to it rejects. Requires `@moss-js/moss-core` 0.30.0.
> * A vector holding NaN or infinity rejects instead of reordering results without an error. `SessionIndex.addDocs` with one rejects the whole call, naming the document and the position, and stores nothing. A query `embedding` holding one rejects at every `alpha`, and loading an index that stores one fails. Requires `@moss-js/moss-core` 0.30.0.
> * Every call that names a cloud index (`createIndex`, `createIndexFromFiles`, `createWebSource`, `getIndex`, `deleteIndex`, `addDocs`, `deleteDocs`, `getDocs`, `loadIndex`, `SessionIndex.loadIndex`, `SessionIndex.pushIndex`) rejects a name that is blank, `"."` or `".."`, contains `/` or a control character, or is longer than 256 bytes, before any request is sent; `loadIndexes` lists such a name in `failed`. The error message includes `Validation error: index name must not be blank, "." or "..", must not contain "/" or control characters, and must be at most 256 bytes`, the same text in every SDK. Any other name is percent-encoded, so names with spaces, `%`, `?` or `#` reach their own index. Pass the raw name: a name that is already percent-encoded, for example with `encodeURIComponent`, is encoded again and addresses a different index. Requires `@moss-js/moss-core` 0.30.0.
> * `getDocs` percent-encodes each document id, so an id containing `,`, `&` or a space returns that one document. An id with a comma used to arrive as two ids. Requires `@moss-js/moss-core` 0.30.0.
> * `addDocs` sends `MutationOptions.upsert` to the cloud when set. The service decides how to apply it. Requires `@moss-js/moss-core` 0.30.0.
> * `loadIndex` and `loadIndexes` with `autoRefresh: true` and `pollingIntervalInSeconds: 0` poll at the default interval of 600 seconds. Before, the refresh task panicked as it started, so the index never refreshed while the load reported success. An interval above one year polls once a year. Requires `@moss-js/moss-core` 0.30.0.
> * Keyword-only and hybrid queries order documents with equal keyword scores by their position in the index, so the same query returns the same results on every call. That order used to vary from call to call. Requires `@moss-js/moss-core` 0.30.0.
> * With a project key, when the auth service answers 408, 429, 500 or 503, the error names the HTTP status without the service's response body. A 403 from it rejects with the same invalid-credentials error as a 401. Web source methods and `getAuthToken` are not affected. Requires `@moss-js/moss-core` 0.30.0.
>
> See [Score semantics](https://docs.moss.dev/docs/integrate/retrieval.md#score-semantics).
>
> **2026-09-29**
>
> v1.3.0
>
> **Added**
>
> * `MossClientOptions.onProgress` reports the embedding model download that the first text query waits on. It receives `{ modelId, loadedBytes, totalBytes, fromCache }` after each chunk, and once with `fromCache: true` when the model comes from the Cache API. An error thrown from the callback is ignored. Its argument type, `ModelDownloadProgress`, is exported.
> * `QueryOptions.candidateDepth` sets how many hits a hybrid query ranks on each signal (vector and keyword) before fusion. A hit outside both lists is never returned, so a deeper list raises recall and query time. Left unset, a hybrid query looks `2 * topK` deep, as before. A set value must be at least 1 (0 is rejected) and is raised to `topK` when below it. Keyword-only and vector-only queries (`alpha` 0 or 1) ignore it and rank `topK` hits, since a deeper list returns the same results. All four query methods forward it to the runtime in a trailing `{ candidateDepth }` object. Requires `@moss-dev/moss-wasm` 0.16.0; an older runtime ignores it.
>
> **Changed**
>
> * A model artifact request aborts when its response or its next chunk takes more than 30 seconds. A stall, a dropped connection, a body shorter than the manifest size, a 408, a 429 or a 5xx is retried once; other errors are not. The model request fails with a `ModelDeliveryError` when the Moss service does not answer within 30 seconds. A response larger than the size in the release manifest is cut off as it arrives.
> * A verified model is kept in the browser Cache API (`moss-model-artifacts-v1`), keyed by the release manifest digest, so a later page load skips the model download when the HTTP cache is cold. The release manifest is fetched and verified on every load. A cached model is checked against its SHA-256 again before use, and one that does not match is dropped and downloaded again. Caching a release drops the other cached releases of that model. Where the Cache API is unavailable, such as on a plain HTTP page, the model downloads on each page load. Loading the model still needs the Moss service on every page load.
> * **Behavior change:** `score` is the relevance of the hit to the query, from 0 to 1, on single-index and multi-index queries alike. Results stay in hybrid order, so a lower-ranked result can show a higher score. Scores depend on the embedding model. A keyword-only query (`alpha` 0) scores every hit 0. A relevance floor (`minScore`) is not available in this SDK. Requires `@moss-dev/moss-wasm` 0.16.0.
> * A custom authenticator's token is cached until 60 seconds before it expires, or for 90% of its life when that is later, so a token that lasts a minute or less is cached too. An `expiresIn` that is not a positive finite number, such as `0`, `NaN`, `Infinity` or a missing value, is not cached.
> * With a project key, a 403 from the auth service rejects with an error that includes `Authentication failed: invalid credentials`, as a 401 does. A 500, 503, 429 or 408 from it rejects with one that includes `Authentication service temporarily unavailable (HTTP <status>)` and no response body. A 401, 403 or 404 from the Moss index API rejects without the response body in the error, except on `deleteIndex`. Requires `@moss-dev/moss-wasm` 0.16.0.
>
> **Deprecated**
>
> * `IAuthenticator.getAuthHeader()` is optional and deprecated. The client never calls it. It sends `Authorization: Bearer <token>` built from `getAuthToken()`. Under `strictNullChecks`, calling it through the `IAuthenticator` type is a type error unless the code first checks that it is defined.
>
> **Fixed**
>
> * **Behavior change:** `metadata` on query results and `getDocs` rows is a plain object. It was a `Map`, so property access, `Object.keys` and `JSON.stringify` saw no keys. Code that reads it with `Map` methods, such as `metadata.get(key)`, must read `metadata[key]` instead. Requires `@moss-dev/moss-wasm` 0.16.0.
> * Malformed data rejects with an error instead of trapping the WebAssembly module. `loadIndex` rejects an index whose stored vectors differ in length, or whose header declares a section length close to 4 GiB. A `tokenizer.json` whose truncation stride is not less than 512 minus its special tokens fails the model load. Requires `@moss-dev/moss-wasm` 0.16.0.
> * A vector holding NaN or infinity rejects instead of reordering results without an error. `loadIndex` rejects an index that stores one, naming the document and the position. A query embedding holding one, or one whose length differs from the index dimension, rejects at every `alpha`; a wrong length used to be ignored at `alpha` 0. Requires `@moss-dev/moss-wasm` 0.16.0.
> * **Behavior change:** `query` and `queryMultiIndex` with a blank query (empty or only whitespace) return no results at every `alpha` without running the embedding model. They used to embed the empty text and rank every document against it above `alpha` 0.
> * `createIndex`, `createIndexFromFiles`, `getIndex`, `deleteIndex`, `addDocs`, `deleteDocs`, `getDocs` and `loadIndex` reject an index name that is blank, `"."` or `".."`, contains `/` or a control character, or is longer than 256 bytes, before any request is sent, with an error that includes `Validation error: index name must not be blank, "." or "..", must not contain "/" or control characters, and must be at most 256 bytes`. `loadIndexes` lists such a name in `failed`. Any other name is percent-encoded, and `getDocs` percent-encodes each document id, so an id containing `,`, `&` or a space returns that one document. Pass the raw name: a name that is already percent-encoded, for example with `encodeURIComponent`, is encoded again and addresses a different index. Requires `@moss-dev/moss-wasm` 0.16.0.
> * `addDocs` sends `MutationOptions.upsert` to the cloud when set. The service decides how to apply it. Requires `@moss-dev/moss-wasm` 0.16.0.
>
> See [Score semantics](https://docs.moss.dev/docs/integrate/retrieval.md#score-semantics).
>
> **2026-09-29**
>
> v1.4.0
>
> **Added**
>
> * With a `:cache_path` and a snapshot of the index already on disk, `load_index/3` makes one metadata request with a 5 second budget instead of retrying. When that request fails on a transport error, or the auth service answers 500, 503, 429 or 408, the load serves the snapshot and starts the refresh poller, even without `auto_refresh: true`. A 404, 401 or 403 still returns `{:error, reason}`. Only a snapshot saved by `moss_core` 0.21.0 or later under the same project and cloud origin is served. For an index on `moss-minilm` or `moss-mediumlm`, `load_index/3` also opens the embedding model, which needs the cloud, so the load can still return `{:error, reason}` while the cloud is unreachable, though the index stays loaded.
>
> **Changed**
>
> * Bumped `moss_core` dependency to 0.21.0.
> * **Behavior change:** `Moss.QueryResultDoc.score` is the relevance of the hit to the query, from 0 to 1, in `query/4`, `query_multi_index/4` and `Moss.Session.query/3` alike. Results stay in hybrid order, so a lower-ranked result can show a higher score. Scores depend on the embedding model. A keyword-only query (`alpha: 0.0`) scores every hit 0.0. Code that relied on the top result scoring about 1.0, or on `query_multi_index/4` scores at `alpha: 1.0` being raw similarity, needs updating. A relevance floor (`:min_score`) is not available in this SDK.
> * **Behavior change:** a query `:embedding` whose length differs from the index dimension returns `{:error, reason}` at `alpha: 0.0` as it does above 0; it used to be ignored at 0. An empty `embedding: []` counts as wrong-size in `query/4` and `Moss.Session.query/3`, so it returns `{:error, reason}` at every `alpha`, while `query_multi_index/4` reads it as no embedding. An `:embedding` of all zeros returns `{:error, reason}` when `alpha` is above 0. A blank query (empty or only whitespace) with no `:embedding` returns no hits at every `alpha` without running the embedding model (a `"custom"` session still requires `:embedding`), and with an `:embedding` ranks by it when `alpha` is above 0.
> * Queries no longer send one telemetry request each. `index.query`, `index.query_multi` and `session.query` events are buffered and sent with the usage flush every 3 seconds and when the client or session process stops, as JSON arrays of up to 500 events, one request per array. Each event keeps the fields it had, including its own `latencyMs`. Up to 10,000 events wait between flushes; events past that are dropped and the count is logged. Usage counts are unchanged.
> * Broad keyword-only and hybrid queries on large indexes are faster.
>
> **Fixed**
>
> * A vector holding NaN or infinity returns `{:error, reason}` instead of reordering results without an error. Adding documents with one fails the whole call, naming the document and the position, and stores nothing. A query `:embedding` holding one fails at every `alpha`, and loading an index that stores one fails.
> * Malformed index data and tokenizer files return `{:error, reason}` instead of raising from the NIF. An index whose stored vectors differ in length fails to load. A `tokenizer.json` whose truncation stride is not less than 512 minus its special tokens fails the model load. Deleting from an index stored without vectors works, and adding documents to it returns `{:error, reason}`.
> * `load_index/3` and `load_indexes/3` with `auto_refresh: true` and `polling_interval: 0` poll at the default interval of 600 seconds. Before, the refresh task panicked as it started, so the index never refreshed while the load reported success. An interval above one year polls once a year.
> * `Moss.Client` calls that name a cloud index (`create_index`, `create_index_from_files`, `get_index`, `delete_index`, `add_docs`, `delete_docs`, `get_docs`, `load_index`), `Moss.Session.load_index/2` and `Moss.Session.push_index/1` return an error for a name that is blank, `"."` or `".."`, contains `/` or a control character, or is longer than 256 bytes, before any request is sent, with a message that includes `Validation error: index name must not be blank, "." or "..", must not contain "/" or control characters, and must be at most 256 bytes`. `load_indexes` lists such a name in `failed`. Any other name is percent-encoded, and `get_docs` percent-encodes each document id, so an id containing `,`, `&` or a space returns that one document. Pass the raw name: a name that is already percent-encoded is encoded again and addresses a different index.
> * `Moss.Client.add_docs/4` sends the `:upsert` option to the cloud when set. The service decides how to apply it.
> * Keyword-only and hybrid queries order documents with equal keyword scores by their position in the index, so the same query returns the same results on every call. That order used to vary from call to call.
> * When the auth service answers 500, 503, 429 or 408, the error includes `Authentication service temporarily unavailable (HTTP N)` and no response body. A 403 from the auth service returns `Authentication failed: invalid credentials`, as a 401 does.
>
> See [Score semantics](https://docs.moss.dev/docs/integrate/retrieval.md#score-semantics).
>
> **2026-09-29**
>
> v0.7.0
>
> **Changed**
>
> * **Batched query telemetry.** Queries no longer send one telemetry request each. `index.query`, `index.query_multi` and `session.query` events are buffered and sent with the usage flush every 3 seconds and at close, as JSON arrays of up to 500 events, one request per array. Each event keeps the fields it had, including its own `latencyMs`. Up to 10,000 events wait between flushes; events past that are dropped and the count is logged. Usage counts are unchanged.
> * **Faster keyword and hybrid queries on large indexes.** Keyword search sorts only the top hits instead of every matching document, so broad queries with `alpha` below 1 return sooner. Results are unchanged.
>
> **Fixed**
>
> * **A bad tokenizer file or an index stored without vectors no longer ends the app.** A `tokenizer.json` whose truncation stride is not less than 512 minus its special tokens fails the model load with a `MossError`. Deleting from an index stored without vectors works, `MossSession.pushIndex` on it no longer ends the app, and adding documents to it throws.
> * **`MossClient.addDocs` sends `upsert` to the Moss cloud.** It is `true` when the argument is left out, and the service decides how to apply it.
> * **A vector holding NaN or infinity throws instead of reordering results.** Adding documents to a `MossSession` with one throws a `MossError` naming the document and the position, and stores nothing. A query embedding holding one throws at every `alpha`, and `loadIndex` fails on a cloud index that stores one.
> * **Query boundaries behave the same at every `alpha`.** A query embedding whose length differs from the index dimension throws at `alpha` 0 as it does above 0; it used to be ignored at 0. A blank query (empty or only whitespace) with no embedding returns no hits at every `alpha` without running the embedding model, and with an embedding and `alpha` above 0 ranks by it. `topK` 0 keeps meaning the default (5, or 10 for `queryMultiIndex`), where the JavaScript and Python SDKs return no hits for it.
> * **An auto-refresh interval of 0 no longer aborts the app.** `MossClient.loadIndex` and `loadIndexes` with `autoRefresh: true` and `pollingIntervalSeconds: 0` poll at the default interval of 600 seconds. An interval above one year is capped at one year.
> * **Index names are checked before any request.** `deleteIndex`, `getIndex`, `getDocs`, `loadIndex` and the other calls that name a cloud index throw `MossError` with code `-3` for a name that is blank, `"."` or `".."`, contains `/` or a control character, or is longer than 256 bytes. `loadIndexes` lists such a name in `failed`. Any other name is percent-encoded, and `getDocs` encodes each document id, so an id containing `,`, `&` or a space returns that one document. Pass the raw name: a name that is already percent-encoded is encoded again and addresses a different index.
> * **An index name or document id holding U+0000 throws.** libmoss reads strings up to their first NUL, so such a name or id would reach a different index or document. `MossClient` calls that take an index name, `MossSession.loadIndex`, and the id arguments of `MossClient.deleteDocs` and of `MossSession.addDocs`, `deleteDocs` and `getDocs` throw `MossError` with code `-2`, the code for other argument errors, before any native call.
>
> Native runtime `sdkVersion`: `0.23.0`.
>
> **2026-09-26**
>
> **Added**
>
> * A **product switcher** under the Moss logo moves between the **Developer Portal** and **Founding Agent** from any page. It replaces **Back to Dashboard** in the Founding Agent account menu.
>
> **2026-09-25**
>
> v0.6.3
>
> A SwiftPM checkout that resolved `v0.6.3` before 2026-09-25 22:06 UTC may refuse the new fingerprint. Delete `~/Library/org.swift.swiftpm/security/fingerprints/moss-*.json` or resolve once with `-packageFingerprintPolicy warn`.
>
> **Added**
>
> * **`loadIndexes` and `unloadIndexes`.** Load or unload several indexes in one call. `loadIndexes` is best effort: it returns a `LoadIndexesResult` whose `loaded` names are retained even when others fail, with per-name reasons in `failed`. `unloadIndexes` is idempotent and ignores names that are not loaded.
> * **`queryMultiIndex` across indexes that share an embedding model.** `options.topK` caps the merged result (10 when unset, where single-index `query` defaults to 5) and `options.alpha` keeps its single-index meaning: 1.0 embedding-only, 0.0 keyword-only (no embedding is computed), anything between fuses the two with reciprocal rank fusion. `QueryResult.indexName` reports the source index for each hit and stays `nil` for single-index `query` results.
> * **Multi-index requires native runtime `0.22.0` or later.** Older `Moss.xcframework` builds fail closed: every multi-index call throws `MossError(code: -7)`, and `MossClient.multiIndexAPIAvailable` reports support up front.
>
> **Changed**
>
> * **Behavior change:** `QueryResult.score` is the relevance of the hit to the query, from 0 to 1, in `query` and `queryMultiIndex` alike. Results stay in hybrid order, so a lower-ranked result can show a higher score. Scores depend on the embedding model. A keyword-only query (`alpha` 0) scores every hit 0. A relevance floor (`minScore`) is not available in this SDK yet.
> * **`moss-minilm` and `moss-mediumlm` now run on iOS, and the default session model is `moss-minilm`.** `SessionOptions.modelId == nil` used to resolve to `moss-litelm`, which requires an organization entitlement; it now resolves to `moss-minilm`. `moss-mediumlm` is opt-in.
> * **Foundation models download in the native model format.** `moss-minilm`, `moss-mediumlm`, and `moss-litelm` resume interrupted downloads. A session on a model the project has no access to opens with `docCount == 0`, and its first `addDocs` or `query` fails. No API change.
>
> **Fixed**
>
> * **An index whose stored vectors differ in length fails to load.** The `MossError` names the vector and both lengths. Such an index used to load, and an embedding query on it could abort the process.
> * **A cached vector file of the wrong dimension is ignored instead of being read past its end.** Loading with a cache path keeps the vectors in memory when the cached `.mossvec` file's dimension differs from the index, so queries return correct results.
>
> **Removed**
>
> * **`MOSS_MODEL_ARTIFACT_TOKEN`.** The variable is ignored.
>
> See [Score semantics](https://docs.moss.dev/docs/integrate/retrieval.md#score-semantics).
>
> Native runtime `sdkVersion`: `0.22.0`.
>
> **2026-09-25**
>
> **Founding Agent redesign**
>
> * New navigation. The sidebar groups **Agents** (with **New agent**), **Monitor** (Live, Leads, Analytics), **Configure** (Integration), and **Settings**. Inside an agent, a switcher moves between agents, and its pages are grouped under **Configure** (Agent, Appearance, Knowledge Base, Q\&A, Demo Booking, Security, Sandbox) and **Monitor** (Live, Leads, Analytics). Handoffs are now part of **Live**.
> * The **Config** tab is split into **Agent**, **Demo Booking**, and **Security**, which now holds the agent's API keys. Each card saves on its own.
> * New **Appearance** tab for the widget's shape, colors, texture, and theme.
> * Agents can be published, unpublished, and deleted from the portal. Publishing and unpublishing need an org owner or admin and an active plan.
> * The create wizard is full screen, and the agent is created at the Knowledge step.
>
> **Changed**
>
> * Refreshed styling across the portal and sign-in screens.
> * Your profile has a single **Display Name** instead of first and last name.
> * New **Settings** > **Payment** page. The pay-as-you-go card shows your **Current balance** with a **Buy more** button.
> * **Voice minutes are now Session minutes** on the **Usage** page, in **Analytics**, and in the overage banner. The meter is unchanged.
>
> **2026-09-23**
>
> **Added**
>
> * **Website sources.** A new **Sources** tab on the index page lists the websites crawled into the index, with status, page count, and last crawl, and lets you **Add website**, **Re-crawl**, **Edit**, **Remove**, and **View pages**. Each crawl takes a website URL, max pages (default 500, up to 5,000), a re-crawl schedule (only when you ask, every day, or every week), and include and exclude path patterns (regular expressions, up to 50). Removing a source needs an org owner or admin. Crawled documents link back to their source page.
> * **Create index from a website or files.** **Create index** has two new sources: **From Website** crawls a site into a new index, and **Files** builds one from up to 20 PDF or DOCX files of up to 50 MB each, with optional **Run OCR on every page**. Neither is available for custom-model indexes, and **Files** creates a new index only.
>
> **Changed**
>
> * On graduated pricing, the overage banner shows your current rate and the next tier once usage passes the first tier. Monthly active devices are shown per device.
> * Committed voice plans with rollover count rolled-over minutes in the voice limit, shown as "incl. N rolled over".
>
> **Cancelling a plan**
>
> * Cancelling under **Settings** > **Billing** first checks the free plan limits (1 project, 3 indexes per project) and lists what to remove; nothing is deleted for you. It then asks why you are leaving.
> * While a cancellation is scheduled, new projects and indexes are held to the free limits. Existing ones keep working until the period ends, and undoing the cancellation restores the paid limits.
>
> **2026-09-21**
>
> v1.14.0
>
> **Added**
>
> * `SessionIndex.loadFromDisk` rebuilds a snapshot that an SDK older than 1.8 saved for a built-in model. Those snapshots carry no model provenance, so text `addDocs` and `query` on them failed with "requires explicit embeddings". The stored documents are re-embedded with the current model and the upgraded snapshot is saved back in one operation, so the rebuild runs once per device (about a minute for 10k chunks, off the main thread, with the Moss cloud reachable). It only runs for a session opened with the same built-in model; pass `{ rebuildLegacy: false }` to opt out. If the model cannot be loaded, `loadFromDisk` rejects with a message starting "Legacy snapshot rebuild needs the embedding model" and changes nothing, so retry later instead of discarding the snapshot.
> * `SessionIndex.inspectSnapshot(cachePath)` describes a snapshot without loading it. `SnapshotInfo` and `LoadFromDiskOptions` are exported.
>
> **Changed**
>
> * Every `SessionIndex` operation (`addDocs`, `deleteDocs`, `getDocs`, `query`, `saveToDisk`, `loadFromDisk`) and the model warm-up inside `MossClient.session()` run their native work on a worker thread instead of the Node main thread, so the event loop keeps serving while a large batch is embedded or a session is saved. Operations on one `SessionIndex` still run in call order, one at a time. `docCount` stays synchronous and reports the count as of the last completed operation. No API change.
> * Requires `@moss-js/moss-core` 0.29.0.
>
> See [Sessions](https://docs.moss.dev/docs/reference/js/sessions.md).
>
> **2026-09-20**
>
> v1.2.0
>
> **Added**
>
> * **Custom authenticator**: `new MossClient(projectId, authenticator)` and `MossClient.create(projectId, authenticator)` accept an `IAuthenticator` in place of the `projectKey`, so frontend code never ships the key. `IAuthenticator` and `AuthToken` are exported, and `getAuthToken()` returns the cached token. Requires `@moss-dev/moss-wasm` 0.15.0.
> * **Multi-index search**: `queryMultiIndex(names, queryText, options?)` and `queryMultiIndexWithEmbedding(names, queryText, embedding, options?)` search several loaded indexes in one call and return the global top-k, each document tagged with the `indexName` it came from. `topK` caps the merged result (default 10), and `alpha` works as in `query` (default 0.8).
> * `loadIndexes(names, options?)` returns `{ loaded, failed }` and keeps the indexes that did load; `unloadIndexes(names)` ignores names that are not loaded.
>
> **Changed**
>
> * Loading a built-in model requires the Moss service to be reachable, and a refused model request fails with `ModelDeliveryError` instead of falling back to the public model files.
> * `MossClientOptions.modelArtifactOrigin` overrides the model origin (`https://models.moss.link`); `http` is accepted only for loopback hosts.
>
> **Fixed**
>
> * Queries on `moss-mediumlm` indexes no longer fail: the SDK expected 1024 dimensions from a model that emits 512.
>
> See [Custom Authenticator](https://docs.moss.dev/docs/reference/js/custom-authenticator.md).
>
> **2026-09-20**
>
> v1.12.0
>
> **Changed**
>
> * Loading a built-in model (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) now requires the Moss cloud to be reachable and rejects with an error otherwise. No API change. Requires `@moss-js/moss-core` 0.27.0.
>
> **2026-09-20**
>
> v1.13.0
>
> **Changed**
>
> * Loading a built-in model (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) now requires the Moss cloud to be reachable and raises an error otherwise. No API change. Requires `inferedge-moss-core` 0.25.0.
>
> **2026-09-20**
>
> v1.3.0
>
> **Changed**
>
> * Loading a built-in model (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) now requires the Moss cloud to be reachable and fails with an error otherwise. No API change.
> * Bumped `moss_core` dependency to 0.20.0.
>
> **2026-09-18**
>
> **Added**
>
> * **Two-factor authentication by SMS**, required for every portal account, including GitHub and Google sign-ins. The next time you sign in, add a phone number and enter the 6-digit code sent to it. After that, each sign-in asks for a code. New accounts set it up before onboarding.
> * Change your number or add another one under **Settings** > **Profile** > **Two-factor authentication**. You get an email whenever a phone is added or removed. Two-factor authentication cannot be turned off, and there are no backup codes: if you lose your phone, contact Moss support to reset it.
> * API keys and the SDKs are not affected.
>
> **Changed**
>
> * Signing out ends the session in the current browser only, instead of on every device.
>
> **2026-09-16**
>
> **Founding Agent demo booking**
>
> * **Google Calendar booking.** **Connect Google Calendar** and pick the calendar to book on; only calendars that can create Google Meet links can be selected. Set the meeting length (15 to 240 minutes), time zone, bookable days and hours (default Monday to Friday, 9:00 to 17:00), buffer between meetings (up to 120 minutes), and minimum notice (default 4 hours, up to 7 days). Visitors get a calendar invite with a Meet link, and busy times are never offered.
> * **Connect Calendly** with OAuth instead of pasting a token, then choose a **Calendly event type**. Requires a paid Calendly plan (Standard or above). Event types that ask the visitor for a phone number or address, or that offer several locations, cannot be selected.
>
> See [Booking](https://docs.moss.dev/docs/founding-agent/embed/booking.md).
>
> **2026-09-15**
>
> v2.2.1
>
> **Fixed**
>
> * Closing the booking modal no longer discards the session's booking nonce. Asking to book again in the same session now reopens the slot picker instead of "Booking unavailable", and the intake form's nonce gate is unaffected by a dismissed booking. The nonce is cleared only when the session ends (`reset()`).
>
> **2026-09-15**
>
> v1.11.0
>
> **Changed**
>
> * The per-device id is now sourced by the native core (`@moss-js/moss-core` 0.26.0); `@moss-js/moss-core` users get it without the wrapper. Same file (`~/.moss/.moss-device-id`), same id. `MossClientOptions.cachePath` still uses `<cachePath>/.moss-device-id` (adopting an existing id, or creating one when the file is missing), and `identity.deviceId` still overrides the billable id.
> * Sessions opened through `client.session()` carry the client's resolved identity, including an id adopted by `loadIndex(name, { cachePath })`. The first id resolved on a client stays on every surface, and a per-call `loadIndex(name, { cachePath })` still creates `<cachePath>/.moss-device-id` when it is missing.
>
> **2026-09-15**
>
> v1.12.0
>
> **Changed**
>
> * The per-device id is now sourced by the native core (`inferedge-moss-core` 0.24.0); `moss_core` users get it without the wrapper. Same file (`~/.moss/.moss-device-id`), same id. `moss_core` `set_device_id(None)` and `set_identity(None, ...)` keep the current id.
> * Sessions created by a client now inherit that client's resolved device identity, and `load_index` / `load_indexes` create `<cache_path>/.moss-device-id` when it is missing. A client that passes `cache_path` is one Monthly Active Device across its index and session events instead of two. `moss_core.IndexManager` gains `set_identity` and `device_identity`, `moss_core.SessionIndex` gains `set_identity`.
>
> **2026-09-15**
>
> v1.2.0
>
> **Added**
>
> * `Moss.Client.query_multi_index/4`: search several loaded indexes in one call and get the global top-k, each result tagged with its source `index_name` on `Moss.QueryResultDoc`. `:alpha` works as in `query/4` (default 0.8): `1.0` embedding-only, `0.0` keyword-only, in between hybrid via Reciprocal Rank Fusion; keyword scoring runs each index's own BM25 and merges hits by score before fusion. `:top_k` (default 10) caps the merged result. Local-only: every name must be loaded and share one embedding model.
> * `Moss.Client.load_indexes/3`: best-effort bulk load returning `%Moss.LoadIndexesResult{loaded, failed}`; `Moss.Client.unload_indexes/2` releases loaded indexes idempotently.
> * Requires a `moss_core` NIF release with `manager_load_indexes`, `manager_unload_indexes`, `manager_query_multi_index`, and `manager_query_multi_index_text`.
>
> **Changed**
>
> * The per-device id is now sourced by the native core; `Moss.DeviceId` is removed. Same file (`~/.moss/.moss-device-id`), same id. `Moss.Client.new/3`'s `:cache_path` is forwarded to the core's `load_index`, which adopts `<cache_path>/.moss-device-id` (created when missing, as before) and also caches loaded indexes on disk under that directory; a blank `:cache_path` is treated as unset, and the `$XDG_CACHE_HOME/moss` location is no longer consulted. `Moss.Client.session/3` copies the client manager's resolved identity onto the session. `MossCore.Nif.manager_set_device_id/2` and `session_set_device_id/2` keep the current id when given `nil`; `manager_device_identity/1` and `session_set_identity/4` are new.
> * Improved on-device model loading for foundation models (`moss-minilm`, `moss-mediumlm`, `moss-litelm`). No API change.
>
> **Removed**
>
> * `MOSS_MODEL_ARTIFACT_TOKEN` is no longer used and is ignored.
>
> **2026-09-13**
>
> v1.11.0
>
> **Added**
>
> * `load_index` and `load_indexes` accept `cache_path`. The downloaded index is persisted under that directory and reused on later loads while the cloud copy is unchanged, so restarts skip the download; auto-refresh writes through to the same cache. Parity with the JS SDK's `cachePath`. Each load still contacts the cloud to check for a newer version.
>
> **2026-09-13**
>
> v1.10.0
>
> **Added**
>
> * Web source methods on `MossClient`: `createWebSource`, `listWebSources`, `getWebSource`, `updateWebSource`, `resyncWebSource`, and `deleteWebSource`, typed wrappers over the `/v1/manage` web source actions. `createWebSource`, `resyncWebSource`, and `updateWebSource` with `resync: true` return a `jobId` to poll with `getJobStatus`; `deleteWebSource` returns `purgeJobId` while the source's pages are removed.
> * Types `WebSource`, `CreateWebSourceOptions`, `CreateWebSourceResult`, `UpdateWebSourceOptions`, `UpdateWebSourceResult`, `ResyncWebSourceResult`, `DeleteWebSourceResult`, and `ManageApiError` (carries the HTTP `status`).
> * `MOSS_CLOUD_API_BASE_URL` overrides the host used by the web source methods.
>
> See [Web Sources](https://docs.moss.dev/docs/reference/js/web-sources.md).
>
> **2026-09-13**
>
> v1.10.0
>
> **Added**
>
> * Web source methods on `MossClient`: `create_web_source`, `list_web_sources`, `get_web_source`, `update_web_source`, `resync_web_source`, and `delete_web_source`, typed wrappers over the `/v1/manage` web source actions. `create_web_source`, `resync_web_source`, and `update_web_source` with `resync=True` return a `job_id` to poll with `get_job_status`; `delete_web_source` returns `purge_job_id` while the source's pages are removed.
> * Types `WebSource`, `CreateWebSourceResult`, `UpdateWebSourceResult`, `ResyncWebSourceResult`, `DeleteWebSourceResult`, and `ManageApiError` (carries the HTTP `status`).
> * `MOSS_CLOUD_API_BASE_URL` overrides the host used by the web source methods.
>
> See [Web Sources](https://docs.moss.dev/docs/reference/python/web-sources.md).
>
> **2026-09-13**
>
> * **Several web sources per index**: `createWebSource` now adds a site to an existing index instead of refusing it (up to 20 per index, each root URL once). Each source's pages are tracked separately: a crawl replaces only its own pages, and `deleteWebSource` removes the source's pages through a purge job (`purgeJobId` in the response) while the index and its other content stay.
> * `updateWebSource` accepts every crawl setting (`rootUrl`, `maxPages`, `maxDocuments`, `maxDepth`, `includePaths`, `excludePaths`, `respectRobots`, `parseDocuments`) as well as `refreshCadence`, plus `resync: true` to crawl right after saving.
> * `listWebSources` accepts an optional `indexName` filter.
> * A crawl requested while another crawl or build runs on the same index is queued (`getJobStatus` reports `queued`) instead of failing with `409`.
> * Unchanged pages are no longer re-embedded on refresh, and page boilerplate (navigation, footers, cookie banners, skip links) is stripped before indexing.
>
> **2026-09-13**
>
> **Added**
>
> * The **Usage** page shows **Crawled URLs** and **Parsed document pages** against your plan allowance, with the charge, once either is above zero. Counts cover the whole org, even with a project filter on. The overage banner includes both, with per-page rates shown to three decimals.
>
> **Changed**
>
> * JSON uploads in **Create Index** > **Custom Upload** are no longer capped at about 4.5 MB. A failed upload releases the index name, so you can retry right away. **Add Documents** on an existing index still has the 4.5 MB limit.
>
> **Fixed**
>
> * The voice minutes chart in **Analytics** splits a call that crosses midnight UTC across both days, and loads faster for large orgs.
>
> **2026-09-10**
>
> * **Several API keys per project.** The project's **API Keys** page now creates, lists, and deletes keys, so you can rotate with overlap: create a new key, move your clients to it, then delete the old one. New projects start with no key.
> * A key is shown once, at creation. Existing keys keep working but can no longer be viewed in the portal.
> * Deleting a key blocks new tokens right away. Tokens already issued with it stop working within about 20 seconds.
> * Any org member can see the list of keys. Org owners, admins, and the project owner can create and delete them.
>
> See [Managing project keys](https://docs.moss.dev/docs/integrate/authentication.md#managing-project-keys).
>
> **2026-09-09**
>
> v1.9.0
>
> * Reliability improvements to on-device model loading. No API changes. Requires `@moss-js/moss-core` 0.25.0.
>
> **2026-09-09**
>
> v1.9.0
>
> * Reliability improvements to on-device model loading. No API changes. Requires `inferedge-moss-core` 0.23.0.
>
> **2026-09-08**
>
> v2.2.0
>
> Published as `@moss-js/founding-agent`. Install with `npm install @moss-js/founding-agent`. `@moss-tools/founding-agent` stays at 2.1.0 and receives no further releases.
>
> **Added**
>
> * Typed chat panel in the bubble: a toggle opens a text input so visitors can type instead of talk. Typed messages are merged into the transcript with the voice turns, without duplicates, and the panel closes when the call ends.
> * Intake form: a config-driven modal that opens after the agent's configured number of answers. The mic pauses while the form is open and resumes on submit or dismiss; dismissing it keeps it closed for the rest of the session. Submissions post to the intake endpoint and publish an `intake_completed` event.
> * New `@moss-js/founding-agent/core` exports for custom UIs: the intake types, `normalizeIntakeForm`, `validateIntakeValues`, `postIntake`, and `mergeTranscript`.
>
> **Changed**
>
> * Your token route must return the whole session object from `createFoundingAgentSession`. Returning only `token` and `serverUrl` silently disables the booking and intake forms. See [Server token route](https://docs.moss.dev/docs/founding-agent/embed/server-token-route.md).
>
> **2026-09-08**
>
> v1.8.0
>
> **Changed**
>
> * Published as `@moss-js/moss`, depending on `@moss-js/moss-core` 0.24.0. Install with `npm install @moss-js/moss`. `@moss-dev/moss` stays at 1.7.1 and receives no further releases.
> * Improved on-device model loading for foundation models (`moss-minilm`, `moss-mediumlm`, `moss-litelm`). No API change.
>
> **Removed**
>
> * The cloud query fallback. `query` on an index that is not loaded now rejects with an error telling you to call `loadIndex` first. The `MOSS_QUERY_URL` override is gone.
> * `MOSS_MODEL_ARTIFACT_TOKEN` is no longer used and is ignored.
>
> **Added**
>
> * `MossClient.queryMultiIndex(indexNames, query, options)`: search several loaded indexes in one call and get the global top-k, each result tagged with its source `indexName`. `options.alpha` works as in `query` (default 0.8): `1.0` embedding-only, `0.0` keyword-only, in between hybrid via Reciprocal Rank Fusion.
> * `MossClient.loadIndexes(indexNames, options)`: best-effort bulk load returning `LoadIndexesResult { loaded, failed }`; `MossClient.unloadIndex(indexName)` and `MossClient.unloadIndexes(indexNames)` release loaded indexes.
> * `QueryResultDocumentInfo.indexName` (set on multi-index results) and the `LoadIndexesResult` type.
>
> **2026-09-08**
>
> v1.8.0
>
> **Removed**
>
> * The cloud query fallback. `query()` on an index that is not loaded now raises `RuntimeError` telling you to call `load_index` first. `MossClient` no longer depends on `httpx`, and the `MOSS_QUERY_URL` override is gone.
> * `MOSS_MODEL_ARTIFACT_TOKEN` is no longer used and is ignored.
>
> **Added**
>
> * Keyword and hybrid multi-index search: `query_multi_index` honors `QueryOptions.alpha` exactly like `query`. `1.0` is embedding-only, `0.0` is keyword-only, and values in between fuse both signals with Reciprocal Rank Fusion, merging each index's own BM25 hits by score before fusion.
>
> **Changed**
>
> * Improved on-device model loading for foundation models (`moss-minilm`, `moss-mediumlm`, `moss-litelm`). No API change.
> * `query_multi_index` defaults `alpha` to `0.8` to match `query`. Pass `QueryOptions(alpha=1.0)` for the previous embedding-only behavior. Requires `inferedge-moss-core` 0.22.0.
>
> **Fixed**
>
> * `QueryOptions(alpha=0.0)` is forwarded as given instead of being treated as unset, so keyword-only search works on loaded indexes.
> * Keyword-only text queries no longer embed the query first, so they no longer load an embedding model and work on custom-model and identity-less indexes.
> * Non-finite `alpha` (NaN, infinities) is rejected with a clear error instead of producing NaN scores.
>
> **2026-09-01**
>
> * **Web sources**: crawl a website into an index via new `/v1/manage` actions (`createWebSource`, `listWebSources`, `getWebSource`, `resyncWebSource`, `updateWebSource`, `deleteWebSource`), with optional daily or weekly refresh schedules and linked PDF/DOCX parsing. See [Create Web Source](https://docs.moss.dev/docs/api-reference/v1/web-sources/createWebSource.md).
>
> **2026-08-26**
>
> v1.7.3
>
> **Added**
>
> * `create_index_from_files` accepts `parse_options` (`ParseOptions`): `use_high_resolution`, `segmentation_method` ("smart\_layout\_detection" or "page\_by\_page"), `ocr_mode` ("auto\_ocr" or "full\_ocr"), and `merge_tables`.
> * `session()` accepts `artifact_version` and `manifest_sha256` keyword arguments to pin a foundation model's immutable publisher release.
>
> **Changed**
>
> * Supported `content_type` values are `application/pdf` and the DOCX MIME, matching the parse service's admission check.
> * `JobPhase` includes the crawl and parse pipeline phases.
> * Requires `inferedge-moss-core` 0.21.3 (parse options support and the moss-mediumlm 512 dimension fix).
>
> **Fixed**
>
> * Local text queries on foundation indexes without an exact model artifact identity keep the core's actionable error instead of a misleading "custom embeddings" message.
>
> See [Index from files](https://docs.moss.dev/docs/reference/python/files.md).
>
> **2026-08-26**
>
> v1.7.1
>
> **Fixed**
>
> * `createIndexFromFiles` with in-memory `data` (Uint8Array, ArrayBuffer, Blob, or File) failed at the native boundary with "Failed to get Array length on JsParseFileInput.data"; bytes are now marshalled in the representation the binding accepts. The `path` flow was unaffected.
>
> See [Index from files](https://docs.moss.dev/docs/reference/js/files.md).
>
> **2026-08-26**
>
> v1.7.0
>
> * New `CreateIndexFromFilesOptions.parseOptions` (`ParseOptions`, now exported): control server-side extraction with `useHighResolution`, `segmentationMethod` (`smart_layout_detection` or `page_by_page`), `ocrMode` (`auto_ocr` or `full_ocr`, the latter for scanned documents with no text layer), and `mergeTables`. Requires `@moss-dev/moss-core` `0.23.0`.
> * `ParseFileInput.contentType` supports `application/pdf` and the DOCX MIME, matching the parse service's admission check; unsupported types fail fast locally with a clear error.
> * `JobProgress.currentPhase` includes the crawl and parse pipeline phases (`queued`, `crawling`, `parsing_documents`, `parsing`, `waiting_for_parser`, `parsing_complete`).
> * Local text queries on server-built foundation indexes without an exact model artifact identity are refused with an actionable error instead of embedding against a guessed artifact; explicit query embeddings and cloud queries are unaffected.
>
> **2026-08-26**
>
> v1.1.0
>
> **Added**
>
> * `Client.create_index_from_files/5` accepts a `parse_options` map controlling server-side extraction: `:use_high_resolution`, `:segmentation_method` ("smart\_layout\_detection" or "page\_by\_page"), `:ocr_mode` ("auto\_ocr" or "full\_ocr"), and `:merge_tables`. Atom or string keys are accepted; unknown keys and wrong value types raise a clear error.
>
> **Changed**
>
> * Supported parse content types are `application/pdf` and the DOCX MIME, matching the parse service's admission check. Docs now state that `:name`, `:content_type`, and `:path` are all required per file.
> * Job status `current_phase` includes the crawl and parse phases ("crawling", "parsing\_documents", and the parser phases).
> * Bumped `moss_core` dependency to 0.18.0.
>
> **Fixed**
>
> * `Client.session/3` with invalid credentials returns `{:error, reason}` instead of exiting the calling process; sessions start unlinked and link on success.
>
> **Included from earlier unreleased work**
>
> * Device-id contract for usage tracking (#312): `Moss.Client.new/3` resolves a stable per-device id once and applies it to both manager and session telemetry, so a device counts once toward Monthly Active Devices across the whole client.
>
> **2026-08-06**
>
> v1.6.0
>
> * New `MossClientOptions.identity` (`MossIdentity`): pass a stable caller-managed `deviceId` and optional `userId` at construction. The caller's `deviceId` is emitted as the billable telemetry `deviceId` (Monthly Active Device key); Moss's stable UUID is always emitted alongside as `mossDeviceId` for correlation; `userId` is never billable. Values must be 1-256 UTF-8 bytes with no surrounding whitespace, control or format characters, lone surrogates, or replacement characters; invalid values throw at construction. Without a configured identity, `deviceId` and `mossDeviceId` both carry Moss's UUID, so existing billing behavior is unchanged. Requires `@moss-dev/moss-core` `0.22.0`; constructing with an identity on an older core fails fast with an actionable error.
>
> **2026-07-21**
>
> v0.1.0
>
> **Added**
>
> * `MossSessionManager.last_time_taken_ms` - the engine-measured retrieval time (ms) from the most recent `query_context` call (`SearchResult.time_taken_ms`); `None` before the first query or on error.
>
> **Changed**
>
> * First public release to PyPI (`pip install ten-moss`).
>
> **2026-07-20**
>
> v1.7.2
>
> **Dependencies**
>
> * Bump `inferedge-moss-core` to `0.21.0`. The core now publishes an **abi3 wheel** (`cp310-abi3`, installs on Python 3.10-3.14) and a **glibc ≥ 2.35 x86\_64 wheel**, so `moss` installs in common older-runtime environments - notably the TEN Framework dev container (Ubuntu 22.04 / Python 3.10), where the previous `cp312+` / `manylinux_2_38` wheels did not resolve. No API changes.
>
> **2026-07-15**
>
> v0.0.1
>
> **Added**
>
> * `MossSessionManager` - session-scoped Moss grounding for TEN extensions, built on the Moss Sessions API: `open`, `query_context`, `add_docs`, `get_docs`, `delete_docs`, `push_index`, `from_config`, `doc_count`.
> * `MossSessionConfig` - standardized `moss_*` properties for TEN extensions. The project key is a masked `SecretStr`; `moss_top_k`/`moss_alpha`/`moss_max_context_chars` are range-validated; unset `moss_model_id` adopts the stored index's model; `moss_max_context_chars` caps the injected grounding block.
> * `examples/create_index.py` - create and populate a demo index.
>
> **2026-07-14**
>
> v0.0.5
>
> **Changed**
>
> * Bumped `pipecat-ai` minimum from `>=1.1.0` to `>=1.5.0`.
>
> **2026-07-13**
>
> v1.4.0
>
> * New: SessionIndex.close() and MossClient.close(), both idempotent, plus Symbol.asyncDispose support so `await using` works on Node 24. Closing releases the native index, pollers, and the session's reference to the shared embedding model (the service is dropped when the last session using it closes; the allocator retains and reuses those pages for the next load, so footprint stays bounded at one model per model id). Threads are no longer per-session. Concurrent close() callers share one completion promise and all settle when disposal finishes.
> * Published type declarations no longer force consumers to enable the ESNext.Disposable lib (the bundle carries the reference itself); consumers need TypeScript 5.2 or newer.
> * README and samples now demonstrate the close() / await using lifecycle.
> * MossClient.close() now also closes every live session created by that client (tracked via weak references); sessions can still be closed individually first.
> * close() fails loudly when the installed @moss-dev/moss-core predates the lifecycle API instead of silently leaking; this release requires @moss-dev/moss-core 0.20.0.
> * Declared engines: node >= 20.4 (first Node release where Symbol.asyncDispose exists).
>
> **2026-07-10**
>
> v0.1.0
>
> **Added**
>
> * Semantic code search sidebar with live debounced queries
> * Manual **Create Index** / **Rebuild Index** workflow
> * Local index persistence (`saveToDisk` / `loadFromDisk`)
> * Moss Cloud sync via `pushIndex()` with restore on new machines
> * Sidebar gear settings for API credentials and cloud sync toggle
> * **Sync to Cloud** button and command
> * Hard exclusions for `node_modules`, build output, and common dependency folders
> * Moss native runtime isolated in a worker process
> * Marketplace packaging with cross-platform native binaries
>
> **2026-07-09**
>
> v1.7.1
>
> **Added**
>
> * **Verbatim payload round-trip** (`DocumentInfo.payload`): store an opaque structured payload (e.g. a JSON string) verbatim alongside a document and get it back as-is on query/get - never embedded or searched.
> * **Stable per-device id for usage tracking**: the SDK now sources a persisted device id (`~/.moss/.moss-device-id`) and hands it to the core, making per-device usage attribution stable across restarts.
> * **Non-blocking `create_index`.** `create_index(..., wait=False)` returns a `JobHandle` as soon as the build is submitted, instead of blocking until it completes:
>   * `handle.job_id` is available immediately.
>   * `handle.status()` gives a live progress readout (phase + percent) as a `JobStatusResponse`.
>   * `handle.wait()` blocks until the build finishes and returns the terminal `JobStatusResponse`. It polls asynchronously, so it parks no threads and never holds the GIL.
>   * New `MossClient.wait_for_job(job_id)` blocks by `job_id` alone - submit, tear down the machine, then reconnect in a fresh process to wait on or poll the build.
>   * The build runs server-side, so a submitted job completes regardless of the client. `wait` defaults to `True` and is keyword-only, so existing blocking callers are unaffected.
>
> **Dependencies**
>
> * Requires `inferedge-moss-core==0.20.1`.
>
> **2026-07-09**
>
> v1.3.2
>
> **Changed**
>
> * Picks up `@moss-dev/moss-core` `0.19.2` (dependency currency; native-binding `DocumentInfo.payload` round-trip fix). No SDK API changes. (Prior `1.3.1` release re-run failed because the version was not bumped; this restores a publishable version.)
>
> **2026-07-08**
>
> v1.0.0-beta.15
>
> **Changed**
>
> * LiveKit stack bumped atomically 1.5.7 -> 1.6.4 (`livekit-agents` + all `livekit-plugins-*`); live Deepgram -> Gemini -> Cartesia round-trip verified.
> * `transformers` constrained to turn-detector's validated line: `>=4.47.1,!=4.57.2,!=4.57.3,<5.0.0` (the previous `>=5.0.0` floor was unintentional).
> * `google-genai>=1.67,<2.0.0`; `livekit-api>=1.0.7`.
>
> **2026-07-07**
>
> v1.7.0 (superseded by 1.7.1)
>
> * First cut of non-blocking `create_index`. **Use 1.7.1 instead**, which finalized the API (`wait` is keyword-only; `JobHandle.wait()` and `MossClient.wait_for_job()` return `JobStatusResponse`) and fixed a GIL hold that could freeze the event loop while a build was submitted or awaited.
>
> **2026-06-30**
>
> v1.6.0
>
> **Added**
>
> * **Exact / graph retrieval on `SessionIndex`, at parity with the iOS SDK.** `get_docs` now accepts a deterministic-fetch `GetDocumentsOptions` - fetch by `doc_ids`, by a metadata `filter` (same dict shape as query filters; no query vector, no ranking), with `sort_by`/`ascending` ordering, and `group_by` parent grouping. New `ParentGrouping(parent_field, order_field)` collapses sibling chunks into one result per unit. `QueryOptions.group_by` applies the same grouping to semantic queries.
>
> ```python theme={null}
> from moss import GetDocumentsOptions, ParentGrouping
> scenes = await session.get_docs(GetDocumentsOptions(
>     filter={"field": "level", "condition": {"$eq": "scene"}}, sort_by="chunk_index"))
> units = await session.get_docs(GetDocumentsOptions(
>     group_by=ParentGrouping("unit_id", "chunk_index")))
> ```
>
> **Dependencies**
>
> * Bumped `inferedge-moss-core` to `0.19.0` (adds the graph-retrieval surface).
>
> **2026-06-30**
>
> v1.5.0
>
> **Added**
>
> * **Verbatim document `payload`.** `DocumentInfo` now carries an optional `payload` string - an opaque structured value (e.g. JSON) stored and returned unchanged, never embedded or searched. Set it when building/adding documents and read it back from `get_docs` / query results. Useful for keeping the full structured record alongside the embeddable `text`. Requires the new core and a current Moss backend.
>
> **Fixed**
>
> * Managed (cloud) query results now surface `payload` (previously dropped when mapping the response).
>
> **Dependencies**
>
> * Bumped `inferedge-moss-core` to `0.18.0` (adds payload support through the upload/build pipeline).
>
> **2026-06-29**
>
> v0.6.2
>
> **Fixed**
>
> * **Parent grouping on `query` no longer under-assembles units.** The engine truncated to `topK` before sibling collapse, so siblings ranked below the cutoff were dropped. `query(…, groupByParent:)` now over-fetches candidates and returns `topK` units assembled from a wider window. For guaranteed-complete units, prefer `getDocs(where:…, groupByParent:)`, which collapses over its full fetch.
> * **Deterministic sibling order under grouping.** Parent grouping breaks `orderField` ties by document id, so equal/missing order values yield a stable within-unit order.
>
> Native runtime `sdkVersion`: `0.21.2`.
>
> **2026-06-29**
>
> v0.6.1
>
> **Fixed**
>
> * **Restored `SessionOptions.autoLoadOnInit`.** It shipped in 0.5.0 but was absent from 0.6.0 (the graph-retrieval branch predated the feature and never picked it up), so code using `SessionOptions(autoLoadOnInit:)` failed to compile against 0.6.0. 0.6.1 carries both graph/exact retrieval *and* `autoLoadOnInit`. Upgrade straight from 0.5.0 or 0.6.0 to 0.6.1.
>
> Native runtime `sdkVersion`: `0.21.1`.
>
> **2026-06-28**
>
> v0.6.0
>
> **Added**
>
> * **Deterministic / exact ("graph") retrieval on a session.** `getDocs(ids:)` now returns documents in the order requested; new `getDocs(where:sortBy:ascending:)` fetches by a metadata predicate with no query vector and no similarity ranking.
> * **Typed metadata filter.** A `Filter` DSL (`.equals` / `.and` / `.greaterThanOrEqual` / `.isIn` / `.near` / …) with literal-expressible `FilterValue`, usable in both `getDocs(where:)` and `QueryOptions.filter` - no hand-written filter JSON.
> * **Parent-unit grouping.** `ParentGrouping(parentField:orderField:)` on `getDocs` / `query` collapses sibling documents that share a parent id into a single result, assembled in `orderField` order.
> * **Verbatim structured payload.** `DocumentInfo.payload` (and `QueryResult.payload`) stores and returns an opaque value unchanged - not embedded or searched. Codable sugar: `init(…, structured:)` and `decodedPayload(_:)`. Indexes saved without a payload load with `payload = nil`.
>
> Native runtime `sdkVersion`: `0.21.0`.
>
> **2026-06-27**
>
> v0.5.0
>
> **Added**
>
> * **`SessionOptions.autoLoadOnInit`.** Defaults to `true` (auto-load the named index from the cloud at session creation). Set `false` for a local-only, disk-first session: creation returns immediately and you populate it yourself (`loadFromDisk`, falling back to `loadIndex` only on a cache miss).
>
> Native runtime `sdkVersion`: `0.20.0`.
>
> **2026-06-26**
>
> v1.3.1
>
> **Fixed**
>
> * **Fixed a native crash when re-saving an on-disk session.** Calling `saveToDisk` on a session previously restored with `loadFromDisk` could crash the process while writing the on-disk index, because the index file was rewritten in place while the loaded session was still reading from it. `saveToDisk` still persists immediately, but now writes to a temporary file and atomically renames it into place, so the file the live session is reading from is never rewritten underneath it. Requires `@moss-dev/moss-core` `0.19.1`.
>
> **2026-06-25**
>
> v1.3.0
>
> **Added**
>
> * **Sessions work with a custom `IAuthenticator`.** `MossClient.session()` now works when the client is constructed with a custom authenticator (short-lived tokens / delegated auth), not just a static project key - it previously threw. The session authenticates (credential validation, `pushIndex`, `loadIndex`) and reports usage through the same auth bridge as `loadIndex`. Requires `@moss-dev/moss-core` `0.19.0` (adds the `SessionIndex.withAuthenticator` napi factory).
>
> **2026-06-25**
>
> v1.2.1
>
> **Added**
>
> * **Client-level `cachePath`.** `new MossClient(projectId, key, { cachePath })` (and the `IAuthenticator` overload) sets one location for the per-device telemetry id, honored by every operation that emits telemetry - `loadIndex`, `session`, and so on. Set it once instead of per call.
>
> **Fixed**
>
> * **Session telemetry now carries the per-device id.** `MossClient.session()` now attaches the anonymous `deviceId` to `session.*` telemetry events, matching `loadIndex`. Previously only the `loadIndex` path attached a `deviceId`, so usage from session-only clients was reported without one.
> * The per-device id is now resolved once and shared across `loadIndex` and `session()` within a client, so a client that uses both surfaces reports a single, consistent id.
>
> **Changed**
>
> * The per-device id location is now resolved with this precedence: the client-level `cachePath`, then the `cachePath` passed to `loadIndex` (back-compat), then a per-user fallback, `<home>/.moss/.moss-device-id`. Previously the id was only written when `loadIndex` was given a `cachePath`.
>
> **2026-06-23**
>
> v1.2.0
>
> **Added**
>
> * **Usage telemetry on the custom-authenticator path.** Automatic, privacy-light usage telemetry now works when the client is constructed with a custom `IAuthenticator` (e.g. short-lived tokens), not just a plain project key - previously it was silently disabled on that path. This enables device-level usage reporting for client-side / delegated-auth deployments.
> * A stable, anonymous per-device id is generated once and persisted at `<cachePath>/.moss-device-id` (the `cachePath` you already pass to `loadIndex`), then attached to telemetry as `deviceId`. It is a random UUID - no hardware identifier, no PII.
> * Bumped `@moss-dev/moss-core` to `0.18.0` (adds the `setDeviceId` napi binding and auth-provider telemetry).
>
> **2026-06-15**
>
> v1.4.1
>
> **Fixed**
>
> * Loading `moss-litelm` indexes could fail with `Deserialization error: unsupported version: 3`. These indexes use the v3 index format, which requires `inferedge-moss-core` `0.17.0`; installing `moss` now brings in that core version automatically, so `moss-litelm` indexes load out of the box with no manual dependency steps. (`moss-minilm` / `moss-mediumlm` indexes are unaffected.)
>
> **Dependencies**
>
> * Pinned `inferedge-moss-core==0.17.0`.
>
> **2026-06-03**
>
> v1.1.0
>
> **Added**
>
> * **`MossClient.session(name, modelId?)`** - local-first session index. Construct a session, add/delete/get documents and run queries entirely in-process (no cloud round-trip per operation), then `pushIndex()` to persist to the cloud. Also `loadIndex(indexName, { autoRefresh, pollingIntervalInSeconds })` to pull an existing cloud index into the session.
> * New top-level exports: `SessionIndex`, `PushIndexResult`, `LoadSessionOptions`.
> * Bumped `@moss-dev/moss-core` to `0.17.0` (adds the `SessionIndex` napi binding).
>
> **2026-06-03**
>
> v0.4.1
>
> * Clean re-release of the v0.4.0 fixes. The v0.4.0 tag was force-moved, which SwiftPM caches as a pin mismatch; v0.4.1 ships the same xcframework as v0.4.0 with the synced 4-argument Swift wrapper. Consume with `from: "0.4.0"` (resolves up) or `from: "0.4.1"`.
>
> **2026-06-02**
>
> v1.4.0
>
> **Dependencies**
>
> * Bumped `inferedge-moss-core` to `0.17.0`.
>
> **2026-06-02**
>
> v0.4.0
>
> * `Moss.xcframework` release with iOS device (arm64) and iOS simulator (arm64) slices, consumed via `.package(url: "https://github.com/usemoss/moss", from: "0.4.0")`.
>
> **2026-06-01**
>
> v0.3.0
>
> * First tagged SwiftPM release of the Moss iOS SDK: binary `Moss.xcframework` with iOS device (arm64) and iOS simulator (arm64) slices, consumed via `.package(url: "https://github.com/usemoss/moss", from: "0.3.0")`.
>
> **2026-05-31**
>
> v1.3.0
>
> **Added**
>
> * **Local-first session indexing** (merged from the separate `moss-session` package):
>   * `MossClient.session(index_name, model_id?)` - creates a `SessionIndex`; auto-loads from cloud if an index with that name already exists, otherwise starts empty.
>   * `SessionIndex.add_docs(docs, options?)` / `delete_docs(doc_ids)` / `get_docs(options?)` - local in-memory mutations and reads.
>   * `SessionIndex.query(query, options?)` - semantic search over the local session index (\~1-10ms, no network). Supports the same filter syntax as `MossClient.query()`.
>   * `SessionIndex.push_index()` - uploads the session index to cloud, creating or replacing the index with the same name. Documents are pushed with their locally-computed embeddings; no server-side re-embedding.
>   * New exports from `moss`: `SessionIndex`, `PushIndexResult`.
> * `model_id="custom"` is supported for sessions - bring your own embeddings via `DocumentInfo.embedding` and `QueryOptions.embedding`; no local model is loaded.
>
> **2026-05-27**
>
> v1.2.0
>
> **Changed**
>
> * **`pip install moss` is now \~64% smaller.**
>
> **Fixed**
>
> * Built-in model downloads (`moss-minilm`, `moss-mediumlm`) survive slow networks: resume after an interrupted connection instead of restarting, with automatic retries and exponential backoff on transient failures. (Also in 1.1.1.)
>
> **Dependencies**
>
> * Bumped `inferedge-moss-core` to `0.14.0`.
>
> **2026-05-27**
>
> v1.1.1
>
> **Fixed**
>
> * Built-in model downloads (`moss-minilm`, `moss-mediumlm`) survive slow networks: resume after an interrupted connection instead of restarting, with automatic retries and exponential backoff on transient failures.
> * Bumped `inferedge-moss-core` to `0.12.1`.
>
> **2026-05-21**
>
> v1.0.0
>
> First stable release of `moss-agent`.
>
> **Added**
>
> * `MossAgent` - process-wide Moss runtime. Holds a hot index cache shared across every room (voice) or every request (text).
> * **Voice path** - `MossAgent.attach(ctx) -> MossCall` binds a Moss call scope to a LiveKit `JobContext`. Idempotent on `ctx.room.name`. `MossCall.query` and `MossCall.query_multi_index` route through the call scope.
> * **Text path** - `MossAgent.query(name, query, options=None)` and `MossAgent.query_multi_index(names, query, options=None)` for HTTP / chat / non-LiveKit callers.
> * Full index CRUD (`create_index`, `add_docs`, `delete_docs`, `delete_index`, `list_indexes`, `get_index`, `get_docs`, `get_job_status`) and cache lifecycle (`load_index`, `load_indexes`, `unload_index`, `unload_indexes`) on `MossAgent`.
> * Re-exports of `DocumentInfo`, `IndexInfo`, `QueryOptions`, `SearchResult`, etc. from `moss_core`.
>
> **Requires**
>
> * `inferedge-moss-core == 0.12.0` - introduces the `moss_core.Agent` and `moss_core.CallScope` PyO3 bindings this package wraps.
>
> **2026-05-13**
>
> v0.2.0
>
> Breaking: top-level React component replaced.
>
> * Replaced `MossFoundingAgentCard` with `MossFoundingAgentBubble`, a compact click-to-talk FAB that morphs into a pill with mute, elapsed-time, and end-call controls while live. Supports `position="fixed"` (default, bottom-right with safe-area insets) or `position="inline"`. Keyboard: Esc = end, M = mute.
> * Added a curated 6-color palette (`violet`, `cobalt`, `teal`, `emerald`, `coral`, `amber`) exported as `BUBBLE_COLORS`. The bubble's `color` prop accepts a preset name.
> * Added `examples/bubble-playground/`, a local Vite playground for previewing the bubble across all presets.
>
> **2026-05-06**
>
> v1.1.0
>
> **Added**
>
> * `query_multi_index(names, query, options)`: search across multiple loaded indexes; returns the global top-K with each doc tagged by source `index_name`. Embedding-only; `options.alpha` is ignored.
> * `load_indexes(names, ...)` / `unload_indexes(names)`: bulk lifecycle. `load_indexes` is best-effort and returns `LoadIndexesResult { loaded, failed }`.
> * `index_name` field on `QueryResultDocumentInfo` (set on multi-index results).
> * Bumped `inferedge-moss-core` to `0.11.0`.
>
> **2026-05-05**
>
> v1.0.2
>
> **Changed**
>
> * Bumped `@moss-dev/moss-core` dependency from `0.9.1` to `0.10.0`, which adds prebuilt binaries for `x86_64-apple-darwin` (Intel Macs) and realigns the npm package version with the underlying Rust core.
>
> **2026-05-01**
>
> v0.0.4
>
> **Changed**
>
> * Updated `requires-python` from `>=3.10` to `>=3.11` to match `pipecat-ai 1.1.0` requirements.
>
> **2026-04-28**
>
> v1.0.0-beta.2
>
> **Changed**
>
> * Swapped runtime browser SDK from `@inferedge/moss` to `@moss-dev/moss-web`
>
> **2026-04-22**
>
> v0.1.0
>
> Initial release.
>
> * `MossFoundingAgent` server class and `createFoundingAgentSession` helper for minting voice sessions from a Node backend (Next.js, Express, anywhere with `fetch`).
> * `<MossFoundingAgent />` React component (exported from `@moss-tools/founding-agent/react`) that renders a voice UI - idle state, start button, visualizer, end-call - and connects to LiveKit via a company-supplied token endpoint.
>
> **2026-04-19**
>
> v1.0.0
>
> Initial release of @moss-dev/moss-web - browser SDK for in-browser semantic search.
>
> **Added**
>
> * **In-browser semantic search**: Full query pipeline runs entirely in the browser via WebAssembly
> * **Full CRUD operations**: `createIndex`, `addDocs`, `deleteDocs`, `deleteIndex`, `listIndexes`, `getIndex`, `getDocs`, `getJobStatus`
> * **File-based index creation**: `createIndexFromFiles` accepts `Uint8Array` data (no filesystem paths in browser)
> * **Local index operations**: `loadIndex`, `query`, `refreshIndex`, `unloadIndex`, `hasIndex`, `getIndexInfo`
> * **Lazy initialization**: WASM + model download happens automatically on first operation
> * **Metadata filtering**: Same filter syntax as Node SDK (`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$near`, `$and`, `$or`)
> * Embedding models: `moss-minilm` (default), `moss-mediumlm`
> * API shape aligned with `@moss-dev/moss` (Node SDK)
>
> **2026-04-17**
>
> v1.0.1
>
> **Added**
>
> * **Custom authenticator** for browser-safe authentication: new `MossClient.withAuthenticator()` and `IndexManager.withAuthenticator()` factory methods accept a JS-side token callback, backed by `JsAuthBridge` in `@moss-dev/moss-core` (#226).
>
> **Changed**
>
> * `CLOUD_API_MANAGE_URL` replaced by granular constants: `CLOUD_API_IDENTITY_URL`, `CLOUD_API_AUTH_URL`, etc. (#226).
>
> **2026-04-13**
>
> v1.0.0-beta.14
>
> **Added**
>
> * `submit_session_report(ctx, room_name)` method on `MossAgentSession` for submitting LiveKit session reports (transcripts) to the Moss backend. Call from your `on_session_end` callback to enable transcript download via the CLI.
>
> **2026-04-09**
>
> v0.9.0
>
> * Precompiled `libmoss` binaries for macOS ARM64, Linux x86\_64, Linux ARM64, and Windows x86\_64. Each archive ships `include/libmoss.h` plus shared and static libraries. See [C SDK](https://docs.moss.dev/docs/reference/c/getting-started.md).
>
> **2026-04-05**
>
> v1.0.1
>
> **Changed**
>
> * Bumped `moss_core` dependency to 0.9.0.
> * Session authentication now uses short-lived JWT tokens (enterprise plan required).
> * Removed `validate_credentials` call from `Client.session/3`; credential exchange happens inside the Rust core during session init.
> * Updated package metadata and README.
>
> **2026-04-04**
>
> * Refreshed dashboard aesthetic and added **multi-org support** with team management.
>
> **2026-04-01**
>
> v1.0.0
>
> **Architecture**
>
> * **Rust-native core**: The SDK now delegates all index management, querying, and embedding generation to `@moss-dev/moss-core` (Rust via NAPI-RS), replacing the previous pure-JavaScript implementations
> * **Node-only**: Dropped browser/WASM support; the SDK targets Node.js 20+ exclusively
> * Query embeddings are now generated in Rust (`queryText` / `loadQueryModel`), matching the Python SDK architecture
>
> **Changed**
>
> * Package renamed from `@inferedge/moss` to `@moss-dev/moss`
> * NAPI binding renamed from `moss-core` to `@moss-dev/moss-core` (v0.8.7, tracking Rust core version)
> * `query()` uses Rust-native `queryText()` for local queries (no JS embedding pipeline)
> * `query()` with `embedding` option uses Rust `query()` directly
> * `query()` falls back to cloud HTTP when index is not loaded locally
>
> **2026-04-01**
>
> v1.0.0
>
> **Changed**
>
> * Renamed package from `moss_session` to `moss`.
> * Published as a public Hex package (no longer requires `organization: "moss"`).
> * Bumped version to 1.0.0 stable.
>
> **2026-03-31**
>
> v0.1.1
>
> **Changed**
>
> * The README, which is the package description on PyPI, has no emojis. The code is the same as in 0.1.0.
>
> **2026-03-30**
>
> v1.0.0-beta.8
>
> **Added**
>
> * **Filesystem Index Caching**: `loadIndex()` now accepts an optional `cachePath` in `LoadIndexOptions` to cache index binaries and documents to disk (Node.js/Bun only)
>   * Cache is automatically invalidated when the cloud index is updated
>   * Auto-refresh also persists refreshed data to the cache
>   * Atomic writes prevent cache corruption from partial/interrupted writes
>   * Path traversal protection on index names
>   * Graceful fallback to re-download if cached data is corrupted
> * **Metadata Filtering**: `query()` now accepts an optional `filter` in `QueryOptions` to narrow results by document metadata on locally loaded indexes
>   * Comparison operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`
>   * Set operators: `$in`, `$nin`
>   * Composable with `$and` / `$or` for complex predicates (supports arbitrary nesting)
>   * Numeric coercion: number filter values are automatically stringified for consistent matching
> * **Geo-distance filtering**: new `$near` operator filters documents by haversine distance from a `"lat,lng,radiusMeters"` value
> * New exported types: `FilterCondition`, `MetadataFilter`
>
> **2026-03-30**
>
> v0.0.1
>
> **Added**
>
> * Initial release of `elevenlabs-moss` integration.
> * `MossClientTool` for registering Moss semantic search as an ElevenLabs client tool.
> * Example `moss-elevenlabs-demo.py` demonstrating tool registration.
>
> **2026-03-29**
>
> v1.0.0
>
> First stable release of the `moss` Python SDK (previously published as `inferedge-moss`).
>
> **Import path changed:** `from moss import MossClient` (was `from inferedge_moss import ...`)
>
> **Features**
>
> * **Semantic search** with built-in on-device models (`moss-minilm`, `moss-mediumlm`); embedding computation runs in Rust for speed; custom embeddings supported via `QueryOptions.embedding`
> * **Hybrid search** with keyword + semantic search and configurable alpha blending
> * **Metadata filtering** on locally loaded indexes with rich operators (`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$and`, `$or`, `$near` for geo-distance)
> * **Cloud query fallback**: `query()` automatically falls back to the cloud API when the index is not loaded locally
> * **Hot reload & auto-refresh**: `load_index()` supports `auto_refresh` with configurable polling interval to detect and reload updated indexes
> * **Async bulk index pipeline**: binary upload, server-side build, poll until completion
> * **Index mutations**: `create_index`, `add_docs`, `delete_docs` return `MutationResult` with `job_id`, `index_name`, `doc_count`
> * **Multi-index support** for isolated search spaces
> * **Python 3.10 to 3.14** supported
>
> **2026-03-29**
>
> v0.1.0
>
> * **Initial release** - CLI wrapper for the Moss Python SDK (v1.0.0)
> * Index management: `moss index create`, `list`, `get`, `delete`
> * Document management: `moss doc add`, `delete`, `get`
> * Semantic search: `moss query` with `--cloud`, `--filter`, `--alpha`, `--top-k`
> * Job tracking: `moss job status` with `--wait` for live progress
> * Interactive credential setup: `moss init`
> * Three-tier auth resolution: CLI flags > env vars > config file
> * JSON and CSV document input, stdin piping with `--file -`
> * `--json` flag on all commands for machine-readable output
> * Rich terminal output: tables, progress spinners, colored status
>
> **2026-03-24**
>
> v1.0.0-beta.19
>
> * Updated `inferedge-moss-core` dependency to `0.8.7`
> * Telemetry improvements
> * Embedding computation for built-in models (`moss-minilm`, `moss-mediumlm`) now runs in Rust; custom embeddings continue to be supported via `QueryOptions.embedding`
> * Fixed `list_indexes()` failing when the cloud API returns `null` for certain `IndexInfo` fields on indexes created by older SDK versions
>
> **2026-03-24**
>
> v0.0.3
>
> **Added**
>
> * Supports latest version of moss
>
> **2026-03-16**
>
> v1.0.0-beta.5
>
> **Changed**
>
> * Bumped `moss_core` dependency to 0.8.7, which fixes the precompiled NIF tarball for macOS - the file inside the archive is now named with the versioned filename so RustlerPrecompiled places it correctly in `priv/native`.
>
> **2026-03-16**
>
> v1.0.0-beta.4
>
> **Changed**
>
> * Bumped `moss_core` dependency to 0.8.6, which fixes precompiled NIF packaging for macOS - the binary is now correctly distributed as `.so` (required by RustlerPrecompiled) instead of `.dylib`.
>
> **2026-03-16**
>
> v1.0.0-beta.3
>
> **Changed**
>
> * Bumped `moss_core` dependency to 0.8.5.
>
> **2026-03-12**
>
> v1.0.0-beta.18
>
> * Telemetry improvements
>
> **2026-03-12**
>
> v1.0.0-beta.1
>
> Initial release of the `moss_session` Elixir SDK (later renamed to `moss` in 1.0.0) with local-first session indexing.
>
> **Added**
>
> * **`Moss.Client`** - single entry point for all operations
>   * `new/3` - creates a client; starts an internal local index manager
>   * `session/3` - auto-loads from cloud if the named index exists; starts empty otherwise; pre-warms built-in models (`"moss-minilm"` / `"moss-mediumlm"`) to eliminate cold-start delay on first query
>   * Cloud CRUD: `create_index/4` (model\_id optional, defaults to `"moss-minilm"`), `add_docs/4`, `delete_docs/3`, `get_job_status/2`, `get_index/2`, `list_indexes/1`, `delete_index/2`, `get_docs/3`
>   * Local index ops: `load_index/3`, `unload_index/2`, `has_index/2`, `query/4`, `refresh_index/2`, `get_index_info/2`
>   * Generates a per-client UUID (`client_id`) propagated to all sessions and managers for telemetry correlation
> * **`Moss.Session`** GenServer - local in-session index backed by Rust core
>   * `add_docs/3` - built-in models embed automatically; `model_id: "custom"` reads `.embedding` from each `DocumentInfo`; returns `{added, updated}`
>   * `delete_docs/2` - remove documents by ID
>   * `get_docs/2` - retrieve documents (optionally filtered by ID list)
>   * `query/3` - semantic search; built-in models embed automatically; `model_id: "custom"` requires `embedding:` opt; accepts metadata filters
>   * `load_index/2` - load an existing cloud index into the session
>   * `push_index/1` - push local index to cloud (create or replace); flushes telemetry
> * **`Moss.Models`** - Elixir structs: `DocumentInfo`, `SearchResult`, `QueryResultDoc`, `IndexInfo`, `PushIndexResult`, `RefreshResult`, `SerializedIndex`, `MutationResult`, `JobStatusResponse`, `CredentialsInfo`, `ModelRef`
> * **Metadata filtering** - all query functions accept `:filter` map with full operator support
>   * Field conditions: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$near`
>   * Logical combinators: `$and`, `$or` (fully nestable)
> * **Background telemetry** - aggregated telemetry handled by the Rust core
> * **Built-in models** - `"moss-minilm"` (fast) and `"moss-mediumlm"` (higher quality); embedding computation runs entirely in the Rust core via ONNX Runtime
> * **`model_id: "custom"`** - bring your own pre-computed embeddings; no local model required
>
> **2026-03-11**
>
> v1.0.0-beta.13
>
> **Fixed**
>
> * OpenAI TTS models (`tts-*` / `*-tts`) are no longer cached at worker startup. The TTS instance is created per-session instead.
>
> **2026-03-09**
>
> v1.0.0-beta.12
>
> **Added**
>
> * Support for passing Moss credentials (`project_id`, `project_key`, `voice_agent_id`) directly into the `MossAgentSession` constructor and `MossAgentSession.prewarm()`, falling back to `MOSS_*` environment variables when not provided.
> * TTS configuration via the `options` parameter on `MossAgentSession`, using `SessionOptions(tts=TTSOptions(...))`. Supported `TTSOptions` fields: `model`, `voice`, `language` (Cartesia), `emotion` (Cartesia), `instructions` (OpenAI `gpt-4o-mini-tts` only). All fields override the platform-configured defaults and are forwarded directly to the underlying provider.
> * `SessionOptions` and `TTSOptions` exported from `moss_voice_agent_manager` for IDE autocompletion support.
> * OpenAI TTS support: routes any model matching `tts-*` prefix or `*-tts` suffix (e.g. `tts-1`, `gpt-4o-mini-tts`) to the OpenAI plugin (optional dependency: `pip install 'moss-voice-agent-manager[openai]'`).
>
> **2026-03-05**
>
> v1.0.0-beta.1
>
> **Added**
>
> * Initial beta release of the Moss semantic search plugin for VitePress
> * `MossPlugin` VitePress plugin with automatic markdown indexing via `@moss-tools/md-indexer`
> * `Search.vue` component - full search modal with keyboard navigation
> * `SearchButton.vue` component - trigger button for the search modal
> * TypeScript types exported via `./types`
> * Support for both ESM and CJS consumers
> * Configurable `apiKey`, `indexId`, `placeholder`, and `maxResults` options
>
> **2026-03-03**
>
> v1.0.0-beta.9
>
> **Added**
>
> * `AgentServer` re-exported from `moss_voice_agent_manager`
> * `AgentSession` re-exported from `moss_voice_agent_manager`
> * `inference` module re-exported from `moss_voice_agent_manager`
> * `room_io` module re-exported from `moss_voice_agent_manager` (includes `RoomOptions`, `AudioInputOptions`)
> * `MultilingualModel` re-exported from `moss_voice_agent_manager` (turn detection)
> * `livekit-plugins-turn-detector==1.3.11` added as a dependency
> * `voice_agent_name` field added to `MossConfig` - populated from the platform credentials API, eliminating the need for a separate `httpx` call in agent code
>
> **2026-02-27**
>
> v1.0.0-beta.8
>
> **Fixed**
>
> * `MossAgentSession.prewarm()` no longer crashes with "no running event loop".
>
> **2026-02-27**
>
> v1.0.0-beta.7
>
> **Added**
>
> * `MossAgentSession.prewarm()` static method for use as `prewarm_fnc` in `WorkerOptions` - initializes providers once at worker startup instead of per session
> * `ctx` parameter on `MossAgentSession.__init__()` - when provided, reuses prewarmed providers from the worker process instead of creating new ones
> * `JobProcess` re-exported from `moss_voice_agent_manager`
>
> **Improved**
>
> * Reduced agent session startup latency by supporting the LiveKit prewarm pattern
>
> **Usage**
>
> ```python theme={null}
> from moss_voice_agent_manager import MossAgentSession, WorkerOptions, cli
>
> async def entrypoint(ctx):
>     session = MossAgentSession(userdata=data, ctx=ctx)
>     ...
>
> cli.run_app(WorkerOptions(
>     entrypoint_fnc=entrypoint,
>     prewarm_fnc=MossAgentSession.prewarm,
> ))
> ```
>
> **2026-02-26**
>
> v1.0.0-beta.17
>
> **Added**
>
> * **Metadata Filtering**: `query()` now accepts an optional `filter` dict to narrow results by document metadata on locally loaded indexes
>   * Comparison operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`
>   * Set operators: `$in`, `$nin`
>   * Composable with `$and` / `$or` for complex predicates (supports arbitrary nesting)
>   * Numeric coercion: int and float filter values are automatically converted to strings for consistent matching
> * **Geo-distance filtering**: new `$near` operator filters documents by haversine distance from a `"lat,lng,radiusMeters"` value
> * When `filter` is passed to `query()` but the index is not loaded locally, a warning is logged and the filter is skipped (cloud query API does not yet support filtering)
> * Updated `inferedge-moss-core` dependency to `0.6.0`
>
> **2026-02-24**
>
> * Billing UI updates.
>
> **2026-02-23**
>
> v1.0.0-beta.16
>
> * Bumped `inferedge-moss-core` dependency to `0.5.0` to support session index telemetry and `push_index` improvements
>
> **2026-02-23**
>
> * Self-service **password and profile updates** from account settings.
>
> **2026-02-21**
>
> v1.0.0-beta.3
>
> **Changed**
>
> * Only set room agent configuration when `agentName` is explicitly provided to `createParticipantToken()`
> * Removed automatic fallback to `voice_agent_name` from credentials, allowing dispatch rules to handle agent joining
>
> **2026-02-21**
>
> v1.0.0-beta.2
>
> **Fixed**
>
> * Updated API endpoint from `/api/voice-agent-deploy/get-voice-agent` to `/api/voice-agent/get-voice-agent` to match backend API changes
>
> **2026-02-19**
>
> v1.0.0-beta.4
>
> **Changed (Complete Rewrite)**
>
> Complete architectural rewrite. The SDK is now a runtime agent library instead of a deployment client.
>
> **Old SDK:** Deployment client that uploads code to backend
> **New SDK:** Drop-in replacement for LiveKit AgentSession with Moss platform integration
>
> **Added**
>
> * `MossAgentSession` - Drop-in replacement for LiveKit AgentSession
> * Dynamic configuration fetching from Moss platform API
> * Runtime config API endpoint (`/api/voice-agent/get-runtime-config`)
> * Voice agent credentials API endpoint (`/api/voice-agent/get-voice-agent`)
> * Automatic provider configuration (STT, LLM, TTS)
> * Built-in metrics tracking (LLM, TTS, STT, VAD, EOU)
> * Diagnostics reporting with performance metrics
> * Model/provider name masking for proprietary information
> * Auto-initialization of VAD (Voice Activity Detection)
> * `py.typed` marker for IDE IntelliSense support
>
> **Configuration**
>
> All configuration now comes from environment variables and platform API:
>
> **Required Environment Variables:**
>
> * `MOSS_PROJECT_ID` - Project identifier
> * `MOSS_PROJECT_KEY` - Project authentication key
> * `MOSS_VOICE_AGENT_ID` - Voice agent identifier
>
> **Optional:**
>
> * `MOSS_PLATFORM_API_URL` - Platform API URL (defaults to production)
>
> **Architecture**
>
> * **No fallbacks** - Fails hard if configuration/credentials missing
> * **Dynamic models** - Model selection fetched from backend at runtime
> * **Secure credentials** - LiveKit credentials fetched from Supabase via API
> * **No hardcoded secrets** - All secrets from environment or API
>
> **Removed**
>
> * `MossVoiceClient` class (replaced with `MossAgentSession`)
> * `deploy()` method (now runtime library, not deployment tool)
> * Custom tool source extraction
> * Static configuration files
>
> **Migration Guide**
>
> **This version is NOT backward compatible.** Complete migration required.
>
> **Before (v1.x - Deployment SDK):**
>
> ```python theme={null}
> from moss_voice_agent_manager import MossVoiceClient
>
> client = MossVoiceClient(project_id="...", project_key="...")
> client.deploy(
>     voice_agent_id="...",
>     prompt="...",
>     function_tools=[my_tool]
> )
> ```
>
> **After (v1.0.0-beta.4 - Runtime SDK):**
>
> ```python theme={null}
> from moss_voice_agent_manager import MossAgentSession
>
> # Set environment variables first
> session = MossAgentSession(
>     userdata=your_data,
>     vad=vad,  # optional
>     max_tool_steps=10
> )
>
> # Access platform API
> api = session.platform_api
>
> # Get metrics
> metrics = session.metrics
> diagnostics = session.diagnostics
> ```
>
> **2026-02-18**
>
> v1.0.0-beta.7
>
> **Added**
>
> * Async job-based mutations (`createIndex`, `addDocs`, `deleteDocs`) with built-in polling and `onProgress` callbacks
> * Large index support - up to 100k documents via presigned upload + server-side build
> * New binary index format with smaller payloads and faster deserialization; existing indexes using the previous format are still supported
>
> **2026-02-18**
>
> v1.0.0-beta.3
>
> * Internal maintenance
>
> **2026-02-17**
>
> v1.0.0-beta.15
>
> * All index mutations and reads now go through the Rust ManageClient, replacing the Python HTTP layer
> * Index creation uses an async bulk pipeline: binary upload → server-side build → poll until completion
> * `load_index` supports both V1 and V2 binary formats, with cloud query fallback when index isn't loaded locally
> * New return type `MutationResult` (with `job_id`, `index_name`, `doc_count`) for `create_index`, `add_docs`, `delete_docs`
> * `get_docs` takes `doc_ids` directly instead of wrapping in `GetDocumentsOptions`
>
> **2026-02-11**
>
> v1.0.0-beta.3
>
> **Changed (Breaking)**
>
> * **Removed `agent_id` parameter** from `deploy()` method
> * `voice_agent_id` is now used internally as the agent identifier
> * **Reordered parameters**: `voice_agent_id` now comes before `prompt` in `deploy()`
> * `project_name` parameter now defaults to `voice_agent_id` (previously defaulted to `agent_id`)
>
> **Migration Guide**
>
> **Before:**
>
> ```python theme={null}
> client.deploy(
>     agent_id="my-agent",
>     prompt="You are helpful",
>     voice_agent_id="agent-uuid"
> )
> ```
>
> **After:**
>
> ```python theme={null}
> client.deploy(
>     voice_agent_id="agent-uuid",
>     prompt="You are helpful"
> )
> ```
>
> **2026-02-11**
>
> v1.0.0-beta.1
>
> Initial beta release.
>
> **Added**
>
> * `MossVoiceClient` for deploying voice agents to LiveKit
> * `deploy()` method with custom Python function tools support
> * Automatic source code extraction for custom tools
> * Project-based authentication (X-Project-Id, X-Project-Key)
> * Zero external dependencies (uses Python standard library)
>
> **2026-02-11**
>
> v1.0.0-beta.1
>
> Initial beta release.
>
> **Added**
>
> * `MossVoiceServer` class for managing voice agent connections
> * `MossVoiceServer.create()` - Fetch and initialize credentials from Moss API
> * `voiceServer.getServerUrl()` - Get voice agent server URL
> * `voiceServer.createParticipantToken()` - Generate participant tokens
> * `voiceServer.getAgentName()` - Get configured agent name
> * Automatic credential caching
> * Full TypeScript support with JSDoc
>
> **2026-02-06**
>
> v1.0.0-beta.14
>
> * Query latency reduced from \~2,300ms to \~10ms for 100K vectors
> * Optimized search pipeline reducing memory allocations
> * Significantly reduced memory overhead for large indexes (100K+ documents) in the context of hybrid search (keyword + semantic)
> * Enhanced performance across all index sizes
>
> **2026-02-03**
>
> v1.0.0-beta.2
>
> * Fixed ESM related conflicts
>
> **2026-02-02**
>
> v1.0.0-beta.13
>
> **Added**
>
> * **Hot Reload & Auto-Refresh**: Indexes can now automatically detect and reload when updated in the cloud.
>   * `load_index()` now accepts optional `auto_refresh` and `polling_interval_in_seconds` parameters
>   * When `auto_refresh` is enabled, the SDK polls for updates at the configured interval (default: 600 seconds)
>   * To stop auto-refresh, call `load_index()` again without the `auto_refresh` option
> * `load_index()` now allows reloading an already-loaded index (previously threw an error)
> * Index management now uses Rust core for improved performance and reliability
>
> **2026-02-02**
>
> v1.0.0-beta.6
>
> **Added**
>
> * **Hot Reload & Auto-Refresh**: Indexes can now automatically detect and reload when updated in the cloud.
>   * `loadIndex()` now accepts optional `LoadIndexOptions` with `autoRefresh` and `pollingIntervalInSeconds` parameters
>   * When `autoRefresh` is enabled, the SDK polls for updates at the configured interval (default: 600 seconds)
>   * To stop auto-refresh, call `loadIndex()` again without the `autoRefresh` option
> * `loadIndex()` now allows reloading an already-loaded index (previously threw an error)
>
> **2026-01-30**
>
> v1.0.0-beta.12
>
> * Adds partial support for Python 3.14 by disabling local embedding service functionality. Full support coming soon.
>
> **2026-01-29**
>
> v1.0.0-beta.11
>
> * Adds support for user-supplied embeddings.
> * `query()` now automatically falls back to the cloud API when the index is not loaded locally, enabling queries without requiring `load_index()` first.
> * Adds better scoring evaluation for search results
>
> **2026-01-29**
>
> v1.0.0-beta.5
>
> **Added**
>
> * Query optimizations for custom-embedding workflow
>
> **2026-01-28**
>
> v1.0.0-beta.4
>
> **Fixed**
>
> * Fixed `ReferenceError: process is not defined` crash in browser environments. The SDK now works seamlessly across all JavaScript runtimes including browsers, Node.js, Deno, and Bun.
>
> **2026-01-26**
>
> v1.0.0-beta.10
>
> * Removes the '\<2' upper bound on numpy dependency.
>
> **2026-01-24**
>
> v1.0.0-beta.3
>
> **Added**
>
> * Support for user-supplied document embeddings during ingestion. The SDK supports optional `embedding` arrays in `DocumentInfo` payloads without using the native embedding service from moss.
> * Query overloads now accept `QueryOptions` so users can provide a custom embedding alongside query text.
> * Relaxed `modelId` requirement when creating indexes. The SDK aligns with the service default of `moss-minilm` when no explicit model is provided.
> * `query()` now automatically falls back to the cloud API when the index is not loaded locally, enabling queries without requiring `loadIndex()` first.
>
> **Enhancements**
>
> * New service endpoint with significant infrastructure upgrades. Management operations are now \~3× faster across most real-world use cases, providing faster index operations while also supporting larger payloads.
>
> **2026-01-18**
>
> v0.0.2
>
> **Added**
>
> * Support for Pipecat v0.0.99.
> * Support for LLMContext and LLMContextAggregatorPair
> * removed deprecated OpenAILLMContext and OpenAILLMContextAggregatorPair
>
> **2026-01-14**
>
> v1.0.0-beta.9
>
> * Drops support for Python 3.9 and below.
> * Bug fix: Keyword search now functions correctly after `load_index()`.
> * New service endpoint with significant infrastructure upgrades. Management operations are now \~3× faster across most real-world use cases, providing faster index operations while also supporting larger payloads.
>
> **2026-01-05**
>
> v1.0.0-beta.1
>
> * function-based API for programmatic usage
>   * Exported `sync()` function for building and uploading in one call
>   * Exported `buildJsonDocs()` function for building search index programmatically
>   * Exported `uploadDocuments()` function for uploading documents programmatically
>   * Exported `createIndex()` function for uploading an existing index file
>   * Functions can be imported and called directly in code
>   * Support for passing credentials via function options or environment variables
>   * Functions return structured data (e.g., `{ success: boolean, count: number }`)
>
> **2025-12-29**
>
> v0.0.1
>
> **Added**
>
> * Initial release of `pipecat-moss` integration.
> * `MossRetrievalService` for augmenting Pipecat LLM contexts with retrieved documents
> * Example `moss-retrieval-demo.py` demonstrating a full voice pipeline with retrieval.
> * `moss-create-index-demo.py` for creating and populating a Moss index.
>
> **2025-12-15**
>
> v1.0.0-beta.8
>
> * Updates `inferedge-moss-core` dependency to version 0.2.3 for new ARM64 wheel support.
>
> **2025-12-01**
>
> v1.0.0-beta.7
>
> Adds IntelliSense support in all the IDEs
>
> **2025-11-30**
>
> v1.0.0-beta.2
>
> **Fixed**
>
> * Fixed ESM (ES Module) import compatibility issue. The package now correctly exports as an ES module and can be imported using standard ESM syntax.
>
> **Upgrade Instructions**
>
> * Migrate from CommonJS (`require`) to ES Module syntax (`import`).
>
> **2025-11-29**
>
> v1.0.0-beta.6
>
> Adds support for keyword search and alpha blending between keyword and semantic search.
>
> **2025-10-23**
>
> v1.0.0-beta.5
>
> Removes Pipecat integration and MossContextRetriever from the SDK. Will be offered as a pipecat extension instead soon.
>
> **2025-10-09**
>
> v1.0.0-beta.4
>
> Performance improvements for query() calls.
>
> **2025-10-09**
>
> v1.0.0-beta.3
>
> **New Features**
>
> * **MossContextRetriever**: Added Pipecat integration for real-time voice AI applications
>   * Automatically enhances LLM conversations with semantic search results from Moss indexes
>   * Seamless integration with OpenAI LLM context frames
>
> **2025-10-01**
>
> v1.0.0-beta.1
>
> Initial release of @moss-dev/moss with core features:
>
> * Semantic search using transformer-based embeddings
> * Lightweight embedding models for edge computing; supports proprietary "moss-minilm" and "moss-mediumlm" models
> * Multi-index support for isolated search spaces
> * Add, update, and remove documents across indexes
> * Blazing fast querying support after loading indexes
> * TypeScript support with full type definitions
>
> **2025-09-14**
>
> v1.0.0-beta.1
>
> Initial release of inferedge-moss with core features:
>
> * Semantic search using transformer-based embeddings
> * Lightweight embedding models for edge computing; supports proprietary "moss-minilm" model
> * API key validation with secure host access
> * Cloudflare CDN support for fast model loading
> * Multi-index support for isolated search spaces
> * Add, update, and remove items across indexes
> * Query interface with configurable result count
> * Performance metrics tracking

> [tab] Python
>
> **2026-11-10**
>
> v1.24.0
>
> **Changed**
>
> * `tasks.create` and `tasks.run` take `api_key`, and send only that call's key as `X-Moss-Provider-Key`, for the task's model calls. They never send the client's `api_key`, which is for `responses`, so without a key in the call no provider key is sent; an empty one raises `InferenceError` before any request. The other task calls never send it. `MossInferenceSync` takes `api_key` too.
>
> **2026-11-07**
>
> v1.23.0
>
> **Added**
>
> * `MossInference.tasks` wraps the gateway's Tasks API: an agent reaches a goal in a browser within time and dollar limits. `create` queues a task from `goal`, `environment`, `output_schema`, `limits`, `model`, `effort` and `metadata`, and sends only the arguments given, so the gateway picks the defaults. `retrieve` and `cancel` return the `Task`, and `wait` polls it every `poll_interval` seconds (2 by default) until it is neither `queued` nor `running`, within `timeout`, and returns a `failed` task too. `run` creates a task and waits for it in one call. `trace` returns the agent's record, `files.list` a `TaskFileList`, and `files.content` a `TaskFileContent` with the bytes and `content_type`. `Task[T]` types `result.output`, and `TaskUsage.raw` keeps every field the gateway sends. `create` sends an `Idempotency-Key`, a new one per call or the one in that call's `extra_headers`, and the same one on every retry, so a retried create never starts a second task. Task calls never send `api_key`, and never retry a 409, which the files routes send until a task ends. `Task` has `files_expire_at`, when the gateway removes the trace and files. `InferenceError.task_id` names the task of an error of `wait` or `run`, so a task that `run` created can still be read or cancelled. `moss.inference.tasks` makes the same calls on a client built from the environment.
> * `MossInferenceSync` makes the `tasks` calls without an event loop. It runs them on an event loop in a daemon thread of its own, which `close()` or the end of `with` stops after cancelling the calls under way.
>
> **2026-11-02**
>
> v1.22.0
>
> **Changed**
>
> * **Breaking change:** `MossInference.responses.create` replaces `chat.completions.create`, in the shape of OpenAI's Responses API, and calls `/responses` under the base URL. It takes `input`, a string or a list of items, and `instructions` in place of `messages`, plus typed `max_output_tokens`. Function tools are flat. Without `stream=True` it returns a `Response`, whose `output` holds `ResponseOutputMessage`, `ResponseFunctionToolCall` and `McpCall` items and whose `output_text` joins the text. With it, it returns a `ResponseStream` of `ResponseStreamEvent`s, such as `response.output_text.delta`, that ends after `response.completed` or `response.incomplete`, and `get_final_response()` returns the whole response. A tool call's result goes back as a `function_call_output` item. Usage is a `ResponseUsage` with `input_tokens` and `output_tokens`. A `response.failed` or `error` event raises `InferenceError`, and once an `McpCall` has arrived every error has the code `failed_after_tool_call`. `moss.inference.responses.create` makes the same call on a client built from the environment.
> * Requires `inferedge-moss-core` 0.36.0.
> * Every request the native core makes, such as model and index downloads, control-plane calls, authentication, uploads and telemetry, sends a `moss-sdk/<version>` User-Agent.
>
> **Removed**
>
> * `chat.completions.create`, `ChatCompletionStream.get_final_completion()`, `ToolStep` and the chunk, choice, message, completion and logprob types.
>
> **Fixed**
>
> * On Linux, TLS no longer trusts emSign ECC Root CA - G3, which `webpki-roots` 1.0.10 drops after the private keys of eight eMudhra intermediate CAs were compromised. macOS and Windows use the system trust store.
>
> **2026-10-23**
>
> v1.21.0
>
> **Added**
>
> * `create` takes `tools`, `tool_choice` and `parallel_tool_calls` as typed arguments, sent only when given.
> * Tool calls keep every field the model sends, such as Gemini's `extra_content` with its thought signature. `raw` on `ChoiceDeltaToolCall` and `ChatCompletionMessageToolCall` holds them, and a reply message put back into `messages` sends them unchanged.
> * `moss.inference.McpServer` puts an MCP server in `tools`, and Moss runs its tools during the reply. Neither its `server_url` nor its `headers` show in a repr.
> * `ChatCompletionChunk.tool_step` and `ChatCompletion.tool_steps` hold each MCP tool call and result as a `ToolStep`.
> * `ChatCompletionStream.get_final_completion()` returns the whole reply as one `ChatCompletion`, joined from every chunk of the stream, the ones already read included.
> * Once a call has streamed a tool step, any error it raises has the code `failed_after_tool_call`, since a tool may have changed data.
> * `max_retries`, 2 by default, on `MossInference` or for one call of `create`, sends a call again when it fails before its reply starts: a connection failure, or a `408`, `409`, `429` or `5xx` response, unless its `x-should-retry` header says otherwise. The wait is the `Retry-After` in seconds when it is 60 or less, else 0.5 s doubled for each retry up to 8 s, and it counts against `timeout`. A stream that fails after it started is never retried.
> * `create(cache=False)` always asks the model, never Moss's reply cache.
> * `request_id` on `ChatCompletionStream` and `ChatCompletion` holds the `X-Moss-Request-Id` of the reply, or `None`.
> * `logprobs` on each choice of a chunk and of a `ChatCompletion`, as a `ChoiceLogprobs`. A joined choice's `content` and `refusal` lists are those of its chunks, in order. `CompletionUsage` has `completion_tokens_details` and `prompt_tokens_details`.
>
> **Changed**
>
> * `load_indexes` runs up to eight loads at once instead of one after another, so many indexes load in about the time of the slowest few. A name listed twice loads once.
> * `load_index` on an index that is already loaded checks the cloud version first. An unchanged copy stays loaded with no download or parse, and a changed one is swapped in without interrupting queries. Either way the call's `auto_refresh` and polling options replace the current ones.
> * Auto-refresh polls a loaded index first at a random point of its first interval, then every interval give or take 10%, so indexes loaded together no longer poll together.
> * On Linux with glibc, `unload_index`, `unload_indexes`, `close`, each refresh or reload that installs a newer version, and a `SessionIndex` that swaps in a refreshed version or is deleted hand the freed memory back to the operating system, so a long-running process shrinks when it unloads indexes. glibc used to keep those pages until something called `malloc_trim`, and each refresh left the replaced version resident.
>
> **Fixed**
>
> * `indexes=[]` searches no index. Leaving `indexes` out still searches every index of the project.
> * Tool call pieces with no `index` no longer merge parallel calls into one. A piece joins the call with its `id`. A new `id` starts the next call, unless the latest call has no id yet and takes it. A piece with no `id` joins the latest call.
> * A joined reply message always has `content`: its text, else `None` when it has tool calls and `""` when it has none. Put back into `messages`, it keeps that `content`.
>
> **2026-10-22**
>
> v1.20.0
>
> **Added**
>
> * `MossInference(project_id, project_key)` answers chat messages with facts from your Moss indexes. `await client.chat.completions.create(...)` takes the arguments of OpenAI's `chat.completions.create` plus `indexes` and `retrieve`, and returns a `ChatCompletionStream` of `ChatCompletionChunk` with `stream=True`, else one `ChatCompletion`, with OpenAI's field names. `model` is `"moss"` by default. `api_key`, on the client or for one call of `create`, is optional: your own OpenAI, Anthropic or Google key, for a vendor model such as `gpt-4o-mini`. `moss` ignores it, and a vendor model without one is refused. The client also takes `timeout` for a whole call, `idle_timeout` for each wait for data or a free connection (120 seconds by default or when `None`), and `default_headers`. A timeout of 0 or less is off. `create` can change the key and both timeouts for one call, and `None` there keeps the client's. The client checks its arguments when built, keeps one connection pool, and closes it with `close()` or `async with`. Failures raise `moss.inference.InferenceError` with `status`, `type` and `message`, and, once the service has answered, its `request_id`, error `code` and `retry_after` in seconds. A redirect is one of those failures, so credentials never reach another URL. Calls go to `https://inference.moss.dev/v1`, or to the base URL in `MOSS_INFERENCE_URL`, which a client reads when built. `moss.inference.chat.completions.create` makes the same call on a client built from `MOSS_PROJECT_ID`, `MOSS_PROJECT_KEY` and `MOSS_INFERENCE_URL`.
>
> **Changed**
>
> * Requires `httpx`, which `moss.inference` streams replies with, along with `h11` 0.16 or later and `anyio` 4.14.2 or later, the first releases of each without published advisories.
> * Requires `inferedge-moss-core` 0.34.0. Every native object shares one process-wide async runtime instead of starting its own 18 threads, so a process keeps the same few threads however many clients and sessions it opens. `MOSS_TOKIO_WORKER_THREADS` sets its worker count, by default the number of CPU cores, at least 2 and at most 4, and a forked child builds its own. The background flush a dropped object starts runs to the end.
> * A `429` with the code `USAGE_LIMIT_EXCEEDED`, which Moss sends while a project is paused, fails on the first response with the code `UNAUTHORIZED` and the message "The project's usage limit has been reached; billing must be updated before it can be used.", instead of retrying for about 90 seconds and failing with `NETWORK`. A cold start with a committed snapshot on disk fails the same way rather than serving the snapshot. Any other `429` still retries.
>
> **2026-10-20**
>
> v1.19.0
>
> **Added**
>
> * The package metadata declares its license, PolyForm Shield 1.0.0, as `LicenseRef-PolyForm-Shield-1.0.0`, so PyPI and license scanners show it.
> * The `inferedge-moss-core` wheels carry `LICENSE-THIRD-PARTY.txt`, the license and copyright notices of the third-party code the extension links: the Rust crates of that target, ONNX Runtime and the components it includes, and the Rust standard library.
> * `SessionIndex.save_to_disk` and `load_from_disk` take `cache_path` as optional. Without one, or with an empty one, snapshots go in `sessions/<project id>/` under the client's `cache_path`, else under the `MOSS_SESSION_CACHE_PATH` environment variable, which only session snapshots read, else under `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux, `%LOCALAPPDATA%\moss` on Windows. A directory you pass is used as before.
>
> **Changed**
>
> * Requires `inferedge-moss-core` 0.33.0.
> * The custom embeddings section of the README says to L2-normalize the vectors you provide. Thanks @VeshRaazThapa (usemoss/moss#529).
> * `inferedge-moss-core`, the native runtime of `moss`, is not supported for direct use, and its `moss_core` module no longer exports `Index`. Import every Moss type from `moss`. No change to the `moss` API.
> * `SessionIndex.add_docs` on a session with a built-in model embeds the documents in batches of at most 512 padded tokens instead of 8,192, and tokenizes each batch on the thread that embeds it. Each model session runs 2 inference threads on a desktop or server host (macOS, Linux or Windows) with 8 or more cores, and 1 on a smaller host, on Android and iOS, and for `moss-litelm`. Idle threads sleep instead of spinning. Embedding many documents needs less memory, and on a host that runs 2 threads it takes less time. Text queries on other sessions with the same model stay fast while it runs. `MOSS_EMBEDDING_INTRA_OP_THREADS` still sets the thread count on every platform.
> * `moss-litelm` embeds each document in its own batch, so a document's vector equals the vector of its text embedded alone. Embedded in a batch, its vectors used to differ from that, with a cosine similarity as low as 0.989.
>
> **Fixed**
>
> * Deleting a `MossClient` or `SessionIndex` waits at most 100 ms for a DNS lookup still in progress. It used to hold the GIL until DNS gave up.
>
> **2026-10-14**
>
> v1.18.0
>
> **Added**
>
> * `MossClient.create_index`, `MossClient.add_docs` and `SessionIndex.add_docs` take documents as dicts (or any `collections.abc.Mapping`), JSON array or JSON Lines text, or `.json`, `.jsonl`, `.ndjson`, `.txt`, `.md` and `.markdown` file paths, as well as `DocumentInfo` objects. Text and markdown files are chunked natively into documents `{path}#{n}` with metadata `parentId`. A word longer than `chunk_size` (1200 by default), such as a long URL or a run of text without spaces, is split into `chunk_size` pieces, so no text is dropped. Markdown front matter (a first `---` line through the next `---` or `...` line) is not indexed.
> * A keyword-only `chunker` argument on the same methods splits every document's text with your own function. Pass `chunker` or `chunking`, not both: using both raises `TypeError`. Neither can be used with `model_id="custom"`.
> * `moss.Chunking` and a keyword-only `chunking` argument on the same methods tune the native chunker within the embedding model's limits, with the names and limits of `ParseOptions`: `chunk_size` 200 to 2000 characters (default 1200), `chunk_overlap` 0 to half of `chunk_size` (default 200, capped at half of `chunk_size`), `mode` `"pages"` or `"sentences"`, and `markdown_header_depth` 1 to 6. With `chunking`, `DocumentInfo`, dict and JSON input is chunked too, not only text and markdown files. Out-of-range values raise `InvalidArgumentError` with `ParseOptions`-style messages, such as `Unsupported chunk_size 100. Supported: 200 to 2000`. Chunks from a user `chunker` longer than 2,000 characters raise `InvalidArgumentError`.
> * `moss.DocsInput`, `moss.Chunker` and `moss.Chunking` are new exports.
>
> **Changed**
>
> * Requires `inferedge-moss-core` 0.32.0, which adds `moss_core.parse_documents_json` and `moss_core.to_document_infos`.
>
> **Fixed**
>
> * The type stub declares `MossClient.create_index_from_files`, `ParseFileInput` and `ParseOptions`, and its `__all__` lists them and `ParentGrouping`. It also declares `SearchResult.model_id`, `IndexStatus.value` and the `JobPhase.CRAWLING` and `JobPhase.PARSING_DOCUMENTS` phases, types `create_index(..., wait=flag)` for a `bool` flag, and declares fields that are read-only at runtime, such as `MutationResult.job_id` and `SessionIndex.name`, as read-only properties. The `LoadIndexesResult` arguments no longer accept `None`, which the core refuses. No runtime change.
> * The type stub marks the classes of the native core, such as `DocumentInfo` and `QueryOptions`, final, since Python cannot subclass them, and declares their constructors with `__new__`, as the core defines them. No runtime change.
>
> **2026-10-14**
>
> v1.17.0
>
> **Added**
>
> * `ParseOptions.chunk_size` (200 to 2000 characters, default 1200) and `ParseOptions.chunk_overlap` (0 to half of `chunk_size`, default 200 capped at half of `chunk_size`) control how the parse pipeline splits extracted text. Out-of-range values raise `InvalidArgumentError` before any upload.
>
> **Changed**
>
> * Requires `inferedge-moss-core` 0.31.0.
>
> **2026-10-13**
>
> v1.16.1
>
> **Changed**
>
> * Requires `inferedge-moss-core` 0.30.1.
>
> **Fixed**
>
> * `MossClient.query`, `query_multi_index`, `unload_index`, `unload_indexes` and `was_served_stale` release the GIL while they run, so the event loop keeps running other tasks during a query or while an unload waits for one.
>
> **2026-10-12**
>
> v1.16.0
>
> **Added**
>
> * `SessionIndex.save_to_disk(cache_path)` and `SessionIndex.load_from_disk(cache_path, *, rebuild_legacy=True)` save a session to disk and restore it. `save_to_disk` writes the session under `<cache_path>/<name>/`, and a failed or interrupted save leaves the last saved snapshot loadable. `load_from_disk` restores it into a session with the same name and returns the number of documents loaded, and the session takes the snapshot's model. A session that already loaded the same model keeps it instead of loading it again. A missing or damaged snapshot raises `MossError` with code `DESERIALIZATION` and leaves the session as it was. A snapshot that an older core saved for a built-in model has no model artifact identity: by default `load_from_disk` rebuilds it for a session opened with the same model, re-embedding the stored documents and saving the snapshot back in the same call, which needs the cloud for the model. When the model cannot be loaded it raises `MossError` with code `MODEL_UNAVAILABLE` and changes nothing. `rebuild_legacy=False` loads such a snapshot as a custom-model session. Code that calls `load_from_disk` on the private `SessionIndex._inner` gets no rebuild unless it passes `rebuild_legacy=True`; the public method rebuilds by default.
> * `MossClient.session(name, auto_load_on_init=False)` opens the session without loading the cloud index of that name. The session starts empty with the given model, so `load_from_disk` restores a saved session with no index download. A `push_index` before any load replaces the cloud index with the session's documents.
> * `SessionIndex.model_id`, the embedding model the session uses, or `"custom"`. A load moves the session to the loaded model, and `add_docs` and `query` read it on every call. Reading it never waits for a call in progress, and it still reads after `close()`.
>
> **Changed**
>
> * Requires `inferedge-moss-core` 0.30.0.
> * `SessionIndex.add_docs` and `delete_docs` update the keyword index in place instead of rebuilding it, and loads build it in one pass. Scores are unchanged.
> * **Behavior change:** `SessionIndex.add_docs` checks every document of a call first, so a call with a vector whose length differs from the session's vectors raises `InvalidArgumentError` and adds nothing.
> * `SessionIndex` keeps one copy of each document, and adds and loads move documents into the index instead of copying them.
> * The token cache keeps a token until 60 seconds before it expires or for 90% of its life, whichever is later, so short-lived tokens are cached too.
> * A 401 drops only the token it rejected from the cache, and a refused telemetry request keeps the token.
> * A project key session fetches one token for its requests and its telemetry.
>
> **Fixed**
>
> * `MossClient.session` moves the session to the model of an existing cloud index that has no documents, as it does for one with documents. Without `model_id`, a session on an empty custom-model index opens and takes embeddings instead of raising `InvalidArgumentError` while it warms the default model, and an explicit `model_id` the index does not use raises `ValueError`.
> * When `MossClient.session` raises, it closes the session it opened, so the session's final telemetry is sent and its native memory freed then, not at `MossClient.close`.
>
> **2026-10-06**
>
> v1.15.1
>
> **Fixed**
>
> * `SessionIndex.push_index()` on a session with a built-in model (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) sends that model's id, so the service re-embeds the text with it and the pushed index loads and answers text queries like one built with `create_index`. It used to be stamped `custom`, so a pushed session could not be resumed with text queries. A custom-model session still pushes its own embeddings. Requires `inferedge-moss-core` 0.28.1.
>
> **2026-10-05**
>
> v1.15.0
>
> **Added**
>
> * `MossClient.close()` and `SessionIndex.close()`, and both work as `with` and `async with` context managers. `close()` sends the final usage telemetry, waiting until it is delivered or 2 seconds pass, and frees the native memory; `MossClient.close()` also closes the sessions the client opened. Afterwards every `MossClient` method raises `RuntimeError("MossClient is closed")` and every `SessionIndex` method but `name` raises `InvalidArgumentError`. Requires `inferedge-moss-core` 0.27.0.
> * `moss.MossError`, a `RuntimeError` subclass raised for every failure the native core reports. `code` is a stable string to branch on: `INVALID_ARGUMENT`, `NOT_FOUND`, `UNAUTHORIZED`, `NETWORK`, `DESERIALIZATION`, `MODEL_UNAVAILABLE` or `INTERNAL`. `moss.InvalidArgumentError` is the `INVALID_ARGUMENT` subclass and is also a `ValueError`. `detail` holds the core error text in released wheels too: diagnostic text for logs and support, at most 512 bytes, and not a stable contract. Requires `inferedge-moss-core` 0.27.0.
> * `LoadIndexesResult.failed_codes` maps each index that `load_indexes` could not load to its code, such as `"NOT_FOUND"`. Requires `inferedge-moss-core` 0.27.0.
>
> **Changed**
>
> * `MossError.detail` carries no request URL for a cloud or model download error: a cloud timeout, retry or response parse failure names the operation, such as `get_index_info`, and a model download names only the host. Cache, repair, snapshot and `MOSS_CA_BUNDLE` errors name the file, not its absolute path. Parser text from `.moss` payloads and from release and manifest files goes to the debug log, and ONNX Runtime and tokenizer failures give fixed text. A failed response contributes only its HTTP status and the error code its body names, such as `HTTP 403 Forbidden: AccessDenied` from the object store or `HTTP 409 Conflict: INDEX_EXISTS` from the Moss service, never the rest of the body. A `.moss` payload whose JSON does not parse, or whose document count does not match its header, gives the detail `index payload is malformed`; header and length errors keep their own short text, such as `binary data truncated`. A lock left unusable by an earlier panic raises `MossError` with code `INTERNAL` and the detail `internal state is unavailable after an earlier failure`, also when an embedding model load hits it.
> * `MossError.detail` names a numbered fault for a damaged on-device vector file or session snapshot, such as `fault 1028` for a vector count that differs from the snapshot metadata, and no longer describes the file layout or the snapshot files. Build the core with its `diagnostics` Cargo feature to add the description.
> * **Behavior change:** error messages from the native core are fixed text per kind of failure, such as `Index not found.` or `The Moss service could not be reached.`, and no longer carry URLs, file paths or index names. Code that matched on message text should branch on `MossError.code`. A failed `load_index` or `unload_index` now raises the core's `MossError` directly instead of wrapping it in a `RuntimeError` that names the index. A text query on an index that cannot embed it (a custom-embedding index, or a foundation index without an artifact identity) raises `InvalidArgumentError`, still a `ValueError`, with the core's message. The reasons in `load_indexes().failed` are the same fixed messages. `query` on an index that is not loaded raises `MossError` with code `NOT_FOUND`, still a `RuntimeError`, and its message still names the load call.
> * **Behavior change:** only `INVALID_ARGUMENT` failures are still a `ValueError`. These session failures were `ValueError` and are now a `MossError` (a `RuntimeError`) with the code shown: a rejected project key when opening a session (`UNAUTHORIZED`), a service or network failure when opening one (`NETWORK` or another cloud code), a model that cannot be downloaded or loaded during `add_docs` or `query` with text (`MODEL_UNAVAILABLE`), and an embedding failure during those calls (`INTERNAL`). Code that catches `ValueError` around these calls should catch `MossError` as well.
> * Built-in model loads (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) are faster, most of all on arm64. No API change. Requires `inferedge-moss-core` 0.27.0.
> * `SessionIndex.add_docs` on a session with a built-in model embeds the documents in batches of at most 8,192 padded tokens, grouped by length, instead of one batch padded to the longest document. Large calls need far less memory and time: on an Apple M2, 5,000 short captions in one call took about 20 s with a 0.6 GB peak instead of about 119 s and 9.1 GB. A query embedding for the same model waits for one batch instead of the whole call. Embeddings come back in input order, with the same values to about 1e-7. Requires `inferedge-moss-core` 0.27.0.
> * **Behavior change:** a malformed `$near` filter value is rejected with a `ValueError` naming the expected `"lat,lng,maxDistanceMeters"` format instead of matching nothing.
> * **Breaking change:** `$gt`, `$gte`, `$lt` and `$lte` compare two plain decimals (`"42"`, `"-3.5"`) as numbers and two other values as text, and never match a plain decimal against any other value. Zero padded numbers such as `"07"` and forms such as `"1e3"` or `"NaN"` are text, so `"07"` no longer matches `$gt: "5"` and `"naming"` never matches `$gt: "999999"`. Sorting `get_docs` by a field (`sort_by`) and assembling a `ParentGrouping` by `order_field` put decimals first in numeric order, zero padded ones included, so `"099"` sorts before `"100"`, then every other value in text order, forms such as `"1e3"` or `"NaN"` included. A condition still never matches a document that lacks the field, `$ne` and `$nin` included.
> * Filter validation and ordering come from `inferedge-moss-core` 0.27.0.
> * **Behavior change:** `query_multi_index([])` and `query` without an embedding on a custom-model session raise `InvalidArgumentError`, still a `ValueError`, with code `INVALID_ARGUMENT`. A malformed metadata filter that raised a plain `ValueError` raises `InvalidArgumentError` with the same text; a filter value of the wrong type still raises `TypeError`. `InvalidArgumentError.code` is `"INVALID_ARGUMENT"` on the class too.
> * A load with a cache path that finds no usable snapshot while the Moss service is unreachable reports `NETWORK` instead of `DESERIALIZATION`. An auth URL that answers 404 or 410 reports `INTERNAL` instead of `NOT_FOUND`. A refused index name keeps the naming rule as its message, and a file with an unsupported content type reads `A file has an unsupported content type.` A text call on a session whose model cannot embed raises `InvalidArgumentError` with the message `This session's model cannot embed text. Pass embeddings with the documents and the query.`
> * `IndexManager.query` with an empty query embedding runs keyword-only at `alpha` 0, as `query_multi_index` does, and raises `InvalidArgumentError` at a higher `alpha` on an index that holds vectors.
>
> **Fixed**
>
> * Usage telemetry that fails to upload is retried on the next flush, every event under a stable `eventId`, for up to an hour and 20,000 events, instead of being dropped. A client or session garbage collected without `close()` blocks for at most 500 ms on its final flush instead of without limit. Requires `inferedge-moss-core` 0.27.0.
> * `load_index` with `auto_refresh=True` compares `updatedAt` as a point in time, so two spellings of one instant are no change, and a tick that finds a new snapshot fetches the index metadata once instead of twice. After a `load_index` served stale from `cache_path`, the first auto refresh that reaches the cloud warms the embedding model even when the snapshot is unchanged. Requires `inferedge-moss-core` 0.27.0.
> * A query whose stored vectors have another length than the query raises `MossError` with code `INTERNAL` instead of ranking those documents with score 0. `Index.serialize` in `inferedge-moss-core` raises `ValueError` for a vector it cannot read. Requires `inferedge-moss-core` 0.27.0.
>
> **2026-09-29**
>
> v1.14.0
>
> **Added**
>
> * `MossClient(cache_path=...)` sets a client-level default `cache_path` for `load_index` / `load_indexes`, the directory for the on-disk index cache and the `.moss-device-id` file. A per-call `cache_path` overrides it. With neither, indexes are not cached on disk and the device id stays in `~/.moss`. Parity with the JS SDK's `MossClientOptions.cachePath`.
> * Offline-tolerant `load_index` and `load_indexes`. With a `cache_path` and a snapshot already on disk, a load whose cloud metadata check cannot reach the cloud, times out, or gets a 408, 429, 500, 502, 503 or 504 (only a 408, 429, 500 or 503 from the auth service) serves the cached snapshot instead of failing, probes the cloud with a few-second budget rather than the full retry window, and starts a refresh poller so the index self-heals when the cloud returns. A 401, 403 or real 404 still fails, so a forbidden or deleted index does not resurrect from cache. A snapshot written by 1.13.0 or earlier is not served until the index is downloaded again, which happens when the cloud copy changes. A snapshot fetched under another project or cloud origin is never served. `MossClient.was_served_stale(name)` reports whether an index is currently served from such a snapshot. The index loads, but a built-in embedding model cannot be opened until the Moss cloud is reachable, so text queries with `alpha` above 0 fail until then. Keyword-only queries (`alpha == 0`) and queries that pass their own `embedding` keep working, and a later refresh or query warms the model once the cloud returns. Requires `inferedge-moss-core` 0.26.0 (`was_served_stale` on `IndexManager`).
> * `QueryOptions.min_score` drops results whose `score` is below it; a query returns up to `top_k` results that clear it, in hybrid order. It takes a value from 0 to 1; anything else raises an error. Keyword-only queries (`alpha == 0`) and queries on indexes that hold no vectors have no embedding to score against, so `min_score` on them raises a clear error. Works in `query` and `query_multi_index`; `SessionIndex.query` ignores it.
> * `QueryOptions.candidate_depth` sets how many hits a hybrid query ranks on each signal (vector and keyword) before fusion. A hit outside both lists is never returned, so a deeper list raises recall and query time. Left unset, a hybrid query looks `2 * top_k` deep, as before. A set value must be at least 1 (0 raises an error) and is raised to `top_k` when below it. Keyword-only and vector-only queries (`alpha` 0 or 1) ignore it and rank `top_k` hits, since a deeper list returns the same results. Works in `query` and `query_multi_index`; `SessionIndex.query` ignores it. Requires `inferedge-moss-core` 0.26.0.
>
> **Changed**
>
> * **Behavior change:** `score` is the result's relevance to the query from 0 to 1, in `query`, `query_multi_index` and `SessionIndex.query` alike. Results keep their hybrid order, so a lower-ranked result can show a higher score. Scores depend on the embedding model: tune `min_score` on your own queries. Keyword-only queries (`alpha == 0`) score every result 0.0. Code that relied on the top result scoring about 1.0, or on multi-index `alpha=1.0` scores being raw similarity values, needs updating.
> * **Behavior change:** a query `embedding` whose length differs from the index dimension raises at `alpha` 0 as it does above 0; it used to be ignored at 0. An empty `embedding=[]` counts as wrong-size in `query` and `SessionIndex.query`, so it raises at every `alpha`, while `query_multi_index` reads it as no embedding. Requires `inferedge-moss-core` 0.26.0.
> * **Behavior change:** a blank query (empty or only whitespace) with no `embedding` returns no results at every `alpha` without running the embedding model. It used to embed the empty text above `alpha` 0 and rank every document against it. A blank query with an `embedding` ranks by the embedding. Requires `inferedge-moss-core` 0.26.0.
> * Requires `inferedge-moss-core` 0.26.0 (was 0.25.0). That core adds the `min_score` query parameter and the relevance `score`.
> * Queries no longer send one telemetry request each. `index.query`, `index.query_multi` and `session.query` events are buffered and sent with the usage flush every 3 seconds and at close, as JSON arrays of up to 500 events, one request per array. Each event keeps the fields it had, including its own `latencyMs`. Up to 10,000 events wait between flushes; events past that are dropped and the count is logged. Usage counts are unchanged. The README lists every telemetry event and its fields. Comes with `inferedge-moss-core` 0.26.0.
> * Keyword-only and hybrid queries without a `filter` that match many documents in a large index are faster, since keyword search sorts only the top hits instead of every match. Comes with `inferedge-moss-core` 0.26.0.
>
> **Fixed**
>
> * Every call that names a cloud index (`create_index`, `create_index_from_files`, `create_web_source`, `get_index`, `delete_index`, `add_docs`, `delete_docs`, `get_docs`, `load_index`, `SessionIndex.push_index`) raises `RuntimeError` for a name that is blank, `"."` or `".."`, contains `/` or a control character, or is longer than 256 bytes, before any request is sent; `load_indexes` lists such a name in `failed`. The message includes `Validation error: index name must not be blank, "." or "..", must not contain "/" or control characters, and must be at most 256 bytes`, the same text in every SDK. Any other name is percent-encoded, so names with spaces, `%`, `?` or `#` reach their own index. Pass the raw name: a name that is already percent-encoded, for example with `urllib.parse.quote`, is encoded again and addresses a different index. Requires `inferedge-moss-core` 0.26.0.
> * `get_docs` percent-encodes each document id, so an id containing `,`, `&` or a space returns that one document. An id with a comma used to arrive as two ids.
> * `add_docs` sends `MutationOptions.upsert` to the cloud when set. The service decides how to apply it. Requires `inferedge-moss-core` 0.26.0.
> * Malformed index data and tokenizer files raise an ordinary error instead of a `PanicException`. An index whose stored vectors differ in length fails to load. A `tokenizer.json` whose truncation stride is not less than 512 minus its special tokens fails the model load. Deleting from an index stored without vectors works, and adding documents to it raises. Requires `inferedge-moss-core` 0.26.0.
> * A vector holding NaN or infinity raises instead of reordering results without an error. Adding documents with one raises for the whole call, naming the document and the position, and stores nothing. A query `embedding` holding one raises at every `alpha`, and loading an index that stores one fails. Requires `inferedge-moss-core` 0.26.0.
> * `MossClient.query` with `QueryOptions(top_k=0)` returns no results, as `query_multi_index` and `SessionIndex.query` do. It used to search with `top_k=5`.
> * `moss.__version__` now reads the installed distribution metadata (`importlib.metadata.version("moss")`) instead of a hardcoded literal, so it always matches the published package version. In a source tree that is not installed as a distribution it reports `0.0.0+unknown`.
> * `load_index` and `load_indexes` with `auto_refresh=True` and `polling_interval_in_seconds=0` poll at the default interval of 600 seconds. Before, the refresh task panicked as it started, so the index never refreshed while the load reported success. An interval above one year polls once a year. Requires `inferedge-moss-core` 0.26.0.
> * Keyword-only and hybrid queries order documents with equal keyword scores by their position in the index, so the same query returns the same results on every call. That order used to vary from call to call. Requires `inferedge-moss-core` 0.26.0.
> * When the auth service answers 500, 503, 429 or 408, the error names the HTTP status without the service's response body. A 403 from it raises the same invalid-credentials error as a 401. Requires `inferedge-moss-core` 0.26.0.
>
> See [Score semantics](https://docs.moss.dev/docs/integrate/retrieval.md#score-semantics).
>
> **2026-09-20**
>
> v1.13.0
>
> **Changed**
>
> * Loading a built-in model (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) now requires the Moss cloud to be reachable and raises an error otherwise. No API change. Requires `inferedge-moss-core` 0.25.0.
>
> **2026-09-15**
>
> v1.12.0
>
> **Changed**
>
> * The per-device id is now sourced by the native core (`inferedge-moss-core` 0.24.0); `moss_core` users get it without the wrapper. Same file (`~/.moss/.moss-device-id`), same id. `moss_core` `set_device_id(None)` and `set_identity(None, ...)` keep the current id.
> * Sessions created by a client now inherit that client's resolved device identity, and `load_index` / `load_indexes` create `<cache_path>/.moss-device-id` when it is missing. A client that passes `cache_path` is one Monthly Active Device across its index and session events instead of two. `moss_core.IndexManager` gains `set_identity` and `device_identity`, `moss_core.SessionIndex` gains `set_identity`.
>
> **2026-09-13**
>
> v1.11.0
>
> **Added**
>
> * `load_index` and `load_indexes` accept `cache_path`. The downloaded index is persisted under that directory and reused on later loads while the cloud copy is unchanged, so restarts skip the download; auto-refresh writes through to the same cache. Parity with the JS SDK's `cachePath`. Each load still contacts the cloud to check for a newer version.
>
> **2026-09-13**
>
> v1.10.0
>
> **Added**
>
> * Web source methods on `MossClient`: `create_web_source`, `list_web_sources`, `get_web_source`, `update_web_source`, `resync_web_source`, and `delete_web_source`, typed wrappers over the `/v1/manage` web source actions. `create_web_source`, `resync_web_source`, and `update_web_source` with `resync=True` return a `job_id` to poll with `get_job_status`; `delete_web_source` returns `purge_job_id` while the source's pages are removed.
> * Types `WebSource`, `CreateWebSourceResult`, `UpdateWebSourceResult`, `ResyncWebSourceResult`, `DeleteWebSourceResult`, and `ManageApiError` (carries the HTTP `status`).
> * `MOSS_CLOUD_API_BASE_URL` overrides the host used by the web source methods.
>
> See [Web Sources](https://docs.moss.dev/docs/reference/python/web-sources.md).
>
> **2026-09-09**
>
> v1.9.0
>
> * Reliability improvements to on-device model loading. No API changes. Requires `inferedge-moss-core` 0.23.0.
>
> **2026-09-08**
>
> v1.8.0
>
> **Removed**
>
> * The cloud query fallback. `query()` on an index that is not loaded now raises `RuntimeError` telling you to call `load_index` first. `MossClient` no longer depends on `httpx`, and the `MOSS_QUERY_URL` override is gone.
> * `MOSS_MODEL_ARTIFACT_TOKEN` is no longer used and is ignored.
>
> **Added**
>
> * Keyword and hybrid multi-index search: `query_multi_index` honors `QueryOptions.alpha` exactly like `query`. `1.0` is embedding-only, `0.0` is keyword-only, and values in between fuse both signals with Reciprocal Rank Fusion, merging each index's own BM25 hits by score before fusion.
>
> **Changed**
>
> * Improved on-device model loading for foundation models (`moss-minilm`, `moss-mediumlm`, `moss-litelm`). No API change.
> * `query_multi_index` defaults `alpha` to `0.8` to match `query`. Pass `QueryOptions(alpha=1.0)` for the previous embedding-only behavior. Requires `inferedge-moss-core` 0.22.0.
>
> **Fixed**
>
> * `QueryOptions(alpha=0.0)` is forwarded as given instead of being treated as unset, so keyword-only search works on loaded indexes.
> * Keyword-only text queries no longer embed the query first, so they no longer load an embedding model and work on custom-model and identity-less indexes.
> * Non-finite `alpha` (NaN, infinities) is rejected with a clear error instead of producing NaN scores.
>
> **2026-08-26**
>
> v1.7.3
>
> **Added**
>
> * `create_index_from_files` accepts `parse_options` (`ParseOptions`): `use_high_resolution`, `segmentation_method` ("smart\_layout\_detection" or "page\_by\_page"), `ocr_mode` ("auto\_ocr" or "full\_ocr"), and `merge_tables`.
> * `session()` accepts `artifact_version` and `manifest_sha256` keyword arguments to pin a foundation model's immutable publisher release.
>
> **Changed**
>
> * Supported `content_type` values are `application/pdf` and the DOCX MIME, matching the parse service's admission check.
> * `JobPhase` includes the crawl and parse pipeline phases.
> * Requires `inferedge-moss-core` 0.21.3 (parse options support and the moss-mediumlm 512 dimension fix).
>
> **Fixed**
>
> * Local text queries on foundation indexes without an exact model artifact identity keep the core's actionable error instead of a misleading "custom embeddings" message.
>
> See [Index from files](https://docs.moss.dev/docs/reference/python/files.md).
>
> **2026-07-20**
>
> v1.7.2
>
> **Dependencies**
>
> * Bump `inferedge-moss-core` to `0.21.0`. The core now publishes an **abi3 wheel** (`cp310-abi3`, installs on Python 3.10-3.14) and a **glibc ≥ 2.35 x86\_64 wheel**, so `moss` installs in common older-runtime environments - notably the TEN Framework dev container (Ubuntu 22.04 / Python 3.10), where the previous `cp312+` / `manylinux_2_38` wheels did not resolve. No API changes.
>
> **2026-07-09**
>
> v1.7.1
>
> **Added**
>
> * **Verbatim payload round-trip** (`DocumentInfo.payload`): store an opaque structured payload (e.g. a JSON string) verbatim alongside a document and get it back as-is on query/get - never embedded or searched.
> * **Stable per-device id for usage tracking**: the SDK now sources a persisted device id (`~/.moss/.moss-device-id`) and hands it to the core, making per-device usage attribution stable across restarts.
> * **Non-blocking `create_index`.** `create_index(..., wait=False)` returns a `JobHandle` as soon as the build is submitted, instead of blocking until it completes:
>   * `handle.job_id` is available immediately.
>   * `handle.status()` gives a live progress readout (phase + percent) as a `JobStatusResponse`.
>   * `handle.wait()` blocks until the build finishes and returns the terminal `JobStatusResponse`. It polls asynchronously, so it parks no threads and never holds the GIL.
>   * New `MossClient.wait_for_job(job_id)` blocks by `job_id` alone - submit, tear down the machine, then reconnect in a fresh process to wait on or poll the build.
>   * The build runs server-side, so a submitted job completes regardless of the client. `wait` defaults to `True` and is keyword-only, so existing blocking callers are unaffected.
>
> **Dependencies**
>
> * Requires `inferedge-moss-core==0.20.1`.
>
> **2026-07-07**
>
> v1.7.0 (superseded by 1.7.1)
>
> * First cut of non-blocking `create_index`. **Use 1.7.1 instead**, which finalized the API (`wait` is keyword-only; `JobHandle.wait()` and `MossClient.wait_for_job()` return `JobStatusResponse`) and fixed a GIL hold that could freeze the event loop while a build was submitted or awaited.
>
> **2026-06-30**
>
> v1.6.0
>
> **Added**
>
> * **Exact / graph retrieval on `SessionIndex`, at parity with the iOS SDK.** `get_docs` now accepts a deterministic-fetch `GetDocumentsOptions` - fetch by `doc_ids`, by a metadata `filter` (same dict shape as query filters; no query vector, no ranking), with `sort_by`/`ascending` ordering, and `group_by` parent grouping. New `ParentGrouping(parent_field, order_field)` collapses sibling chunks into one result per unit. `QueryOptions.group_by` applies the same grouping to semantic queries.
>
> ```python theme={null}
> from moss import GetDocumentsOptions, ParentGrouping
> scenes = await session.get_docs(GetDocumentsOptions(
>     filter={"field": "level", "condition": {"$eq": "scene"}}, sort_by="chunk_index"))
> units = await session.get_docs(GetDocumentsOptions(
>     group_by=ParentGrouping("unit_id", "chunk_index")))
> ```
>
> **Dependencies**
>
> * Bumped `inferedge-moss-core` to `0.19.0` (adds the graph-retrieval surface).
>
> **2026-06-30**
>
> v1.5.0
>
> **Added**
>
> * **Verbatim document `payload`.** `DocumentInfo` now carries an optional `payload` string - an opaque structured value (e.g. JSON) stored and returned unchanged, never embedded or searched. Set it when building/adding documents and read it back from `get_docs` / query results. Useful for keeping the full structured record alongside the embeddable `text`. Requires the new core and a current Moss backend.
>
> **Fixed**
>
> * Managed (cloud) query results now surface `payload` (previously dropped when mapping the response).
>
> **Dependencies**
>
> * Bumped `inferedge-moss-core` to `0.18.0` (adds payload support through the upload/build pipeline).
>
> **2026-06-15**
>
> v1.4.1
>
> **Fixed**
>
> * Loading `moss-litelm` indexes could fail with `Deserialization error: unsupported version: 3`. These indexes use the v3 index format, which requires `inferedge-moss-core` `0.17.0`; installing `moss` now brings in that core version automatically, so `moss-litelm` indexes load out of the box with no manual dependency steps. (`moss-minilm` / `moss-mediumlm` indexes are unaffected.)
>
> **Dependencies**
>
> * Pinned `inferedge-moss-core==0.17.0`.
>
> **2026-06-02**
>
> v1.4.0
>
> **Dependencies**
>
> * Bumped `inferedge-moss-core` to `0.17.0`.
>
> **2026-05-31**
>
> v1.3.0
>
> **Added**
>
> * **Local-first session indexing** (merged from the separate `moss-session` package):
>   * `MossClient.session(index_name, model_id?)` - creates a `SessionIndex`; auto-loads from cloud if an index with that name already exists, otherwise starts empty.
>   * `SessionIndex.add_docs(docs, options?)` / `delete_docs(doc_ids)` / `get_docs(options?)` - local in-memory mutations and reads.
>   * `SessionIndex.query(query, options?)` - semantic search over the local session index (\~1-10ms, no network). Supports the same filter syntax as `MossClient.query()`.
>   * `SessionIndex.push_index()` - uploads the session index to cloud, creating or replacing the index with the same name. Documents are pushed with their locally-computed embeddings; no server-side re-embedding.
>   * New exports from `moss`: `SessionIndex`, `PushIndexResult`.
> * `model_id="custom"` is supported for sessions - bring your own embeddings via `DocumentInfo.embedding` and `QueryOptions.embedding`; no local model is loaded.
>
> **2026-05-27**
>
> v1.2.0
>
> **Changed**
>
> * **`pip install moss` is now \~64% smaller.**
>
> **Fixed**
>
> * Built-in model downloads (`moss-minilm`, `moss-mediumlm`) survive slow networks: resume after an interrupted connection instead of restarting, with automatic retries and exponential backoff on transient failures. (Also in 1.1.1.)
>
> **Dependencies**
>
> * Bumped `inferedge-moss-core` to `0.14.0`.
>
> **2026-05-27**
>
> v1.1.1
>
> **Fixed**
>
> * Built-in model downloads (`moss-minilm`, `moss-mediumlm`) survive slow networks: resume after an interrupted connection instead of restarting, with automatic retries and exponential backoff on transient failures.
> * Bumped `inferedge-moss-core` to `0.12.1`.
>
> **2026-05-06**
>
> v1.1.0
>
> **Added**
>
> * `query_multi_index(names, query, options)`: search across multiple loaded indexes; returns the global top-K with each doc tagged by source `index_name`. Embedding-only; `options.alpha` is ignored.
> * `load_indexes(names, ...)` / `unload_indexes(names)`: bulk lifecycle. `load_indexes` is best-effort and returns `LoadIndexesResult { loaded, failed }`.
> * `index_name` field on `QueryResultDocumentInfo` (set on multi-index results).
> * Bumped `inferedge-moss-core` to `0.11.0`.
>
> **2026-03-29**
>
> v1.0.0
>
> First stable release of the `moss` Python SDK (previously published as `inferedge-moss`).
>
> **Import path changed:** `from moss import MossClient` (was `from inferedge_moss import ...`)
>
> **Features**
>
> * **Semantic search** with built-in on-device models (`moss-minilm`, `moss-mediumlm`); embedding computation runs in Rust for speed; custom embeddings supported via `QueryOptions.embedding`
> * **Hybrid search** with keyword + semantic search and configurable alpha blending
> * **Metadata filtering** on locally loaded indexes with rich operators (`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$and`, `$or`, `$near` for geo-distance)
> * **Cloud query fallback**: `query()` automatically falls back to the cloud API when the index is not loaded locally
> * **Hot reload & auto-refresh**: `load_index()` supports `auto_refresh` with configurable polling interval to detect and reload updated indexes
> * **Async bulk index pipeline**: binary upload, server-side build, poll until completion
> * **Index mutations**: `create_index`, `add_docs`, `delete_docs` return `MutationResult` with `job_id`, `index_name`, `doc_count`
> * **Multi-index support** for isolated search spaces
> * **Python 3.10 to 3.14** supported
>
> **2026-03-24**
>
> v1.0.0-beta.19
>
> * Updated `inferedge-moss-core` dependency to `0.8.7`
> * Telemetry improvements
> * Embedding computation for built-in models (`moss-minilm`, `moss-mediumlm`) now runs in Rust; custom embeddings continue to be supported via `QueryOptions.embedding`
> * Fixed `list_indexes()` failing when the cloud API returns `null` for certain `IndexInfo` fields on indexes created by older SDK versions
>
> **2026-03-12**
>
> v1.0.0-beta.18
>
> * Telemetry improvements
>
> **2026-02-26**
>
> v1.0.0-beta.17
>
> **Added**
>
> * **Metadata Filtering**: `query()` now accepts an optional `filter` dict to narrow results by document metadata on locally loaded indexes
>   * Comparison operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`
>   * Set operators: `$in`, `$nin`
>   * Composable with `$and` / `$or` for complex predicates (supports arbitrary nesting)
>   * Numeric coercion: int and float filter values are automatically converted to strings for consistent matching
> * **Geo-distance filtering**: new `$near` operator filters documents by haversine distance from a `"lat,lng,radiusMeters"` value
> * When `filter` is passed to `query()` but the index is not loaded locally, a warning is logged and the filter is skipped (cloud query API does not yet support filtering)
> * Updated `inferedge-moss-core` dependency to `0.6.0`
>
> **2026-02-23**
>
> v1.0.0-beta.16
>
> * Bumped `inferedge-moss-core` dependency to `0.5.0` to support session index telemetry and `push_index` improvements
>
> **2026-02-17**
>
> v1.0.0-beta.15
>
> * All index mutations and reads now go through the Rust ManageClient, replacing the Python HTTP layer
> * Index creation uses an async bulk pipeline: binary upload → server-side build → poll until completion
> * `load_index` supports both V1 and V2 binary formats, with cloud query fallback when index isn't loaded locally
> * New return type `MutationResult` (with `job_id`, `index_name`, `doc_count`) for `create_index`, `add_docs`, `delete_docs`
> * `get_docs` takes `doc_ids` directly instead of wrapping in `GetDocumentsOptions`
>
> **2026-02-06**
>
> v1.0.0-beta.14
>
> * Query latency reduced from \~2,300ms to \~10ms for 100K vectors
> * Optimized search pipeline reducing memory allocations
> * Significantly reduced memory overhead for large indexes (100K+ documents) in the context of hybrid search (keyword + semantic)
> * Enhanced performance across all index sizes
>
> **2026-02-02**
>
> v1.0.0-beta.13
>
> **Added**
>
> * **Hot Reload & Auto-Refresh**: Indexes can now automatically detect and reload when updated in the cloud.
>   * `load_index()` now accepts optional `auto_refresh` and `polling_interval_in_seconds` parameters
>   * When `auto_refresh` is enabled, the SDK polls for updates at the configured interval (default: 600 seconds)
>   * To stop auto-refresh, call `load_index()` again without the `auto_refresh` option
> * `load_index()` now allows reloading an already-loaded index (previously threw an error)
> * Index management now uses Rust core for improved performance and reliability
>
> **2026-01-30**
>
> v1.0.0-beta.12
>
> * Adds partial support for Python 3.14 by disabling local embedding service functionality. Full support coming soon.
>
> **2026-01-29**
>
> v1.0.0-beta.11
>
> * Adds support for user-supplied embeddings.
> * `query()` now automatically falls back to the cloud API when the index is not loaded locally, enabling queries without requiring `load_index()` first.
> * Adds better scoring evaluation for search results
>
> **2026-01-26**
>
> v1.0.0-beta.10
>
> * Removes the '\<2' upper bound on numpy dependency.
>
> **2026-01-14**
>
> v1.0.0-beta.9
>
> * Drops support for Python 3.9 and below.
> * Bug fix: Keyword search now functions correctly after `load_index()`.
> * New service endpoint with significant infrastructure upgrades. Management operations are now \~3× faster across most real-world use cases, providing faster index operations while also supporting larger payloads.
>
> **2025-12-15**
>
> v1.0.0-beta.8
>
> * Updates `inferedge-moss-core` dependency to version 0.2.3 for new ARM64 wheel support.
>
> **2025-12-01**
>
> v1.0.0-beta.7
>
> Adds IntelliSense support in all the IDEs
>
> **2025-11-29**
>
> v1.0.0-beta.6
>
> Adds support for keyword search and alpha blending between keyword and semantic search.
>
> **2025-10-23**
>
> v1.0.0-beta.5
>
> Removes Pipecat integration and MossContextRetriever from the SDK. Will be offered as a pipecat extension instead soon.
>
> **2025-10-09**
>
> v1.0.0-beta.4
>
> Performance improvements for query() calls.
>
> **2025-10-09**
>
> v1.0.0-beta.3
>
> **New Features**
>
> * **MossContextRetriever**: Added Pipecat integration for real-time voice AI applications
>   * Automatically enhances LLM conversations with semantic search results from Moss indexes
>   * Seamless integration with OpenAI LLM context frames
>
> **2025-09-14**
>
> v1.0.0-beta.1
>
> Initial release of inferedge-moss with core features:
>
> * Semantic search using transformer-based embeddings
> * Lightweight embedding models for edge computing; supports proprietary "moss-minilm" model
> * API key validation with secure host access
> * Cloudflare CDN support for fast model loading
> * Multi-index support for isolated search spaces
> * Add, update, and remove items across indexes
> * Query interface with configurable result count
> * Performance metrics tracking

> [tab] JavaScript
>
> **2026-11-10**
>
> v1.24.0
>
> **Changed**
>
> * `tasks.create` and `tasks.run` send the `apiKey` of their options (`TaskCreateOptions`, `TaskRunOptions`) as `X-Moss-Provider-Key`, for the task's model calls. They never send the client's `apiKey`, which is for `responses`, so without a key in the call no provider key is sent; an empty one rejects with `invalid_request_error` before any request. The other task calls never send it.
>
> **2026-11-07**
>
> v1.23.0
>
> **Added**
>
> * `MossInference.tasks`, typed by the `Tasks` interface, wraps the gateway's Tasks API: an agent reaches a goal in a browser within time and dollar limits. `create` queues a task from `TaskCreateParams` (`goal`, `environment`, `output_schema`, `limits`, `model`, `effort`, `metadata`) and sends only the fields given, so the gateway picks the defaults. `retrieve` and `cancel` return the `Task`, and `wait` polls it every `pollInterval` (2000 ms by default) until it is neither `queued` nor `running`, with `timeout` and `signal` in `TaskWaitOptions`, and resolves on `failed` too. `run` creates a task and waits for it in one call. `trace` returns the agent's record, `files.list` a `TaskFileList`, and `files.content` a `TaskFileContent` with the bytes and `contentType`. `Task<Output>` types `result.output`. `usage` (`TaskUsage`) keeps every field the gateway sends. `create` sends an `Idempotency-Key`, a new one per call or the one in that call's `headers`, and the same one on every retry, so a retried create never starts a second task. Task calls never send `apiKey`, and never retry a 409, which the files routes send until a task ends. `Task` has `files_expire_at`, when the gateway removes the trace and files. `InferenceError.taskId` names the task of an error of `wait` or `run`, so a task that `run` created can still be read or cancelled. `inference.tasks` is the `tasks` of a client built from the environment. See Browser tasks in the README.
>
> **Changed**
>
> * `responses.create` rejects a body number that JSON cannot carry, such as `NaN` or `Infinity`, with `invalid_request_error`, where it sent `null`.
>
> **2026-11-02**
>
> v1.22.0
>
> **Changed**
>
> * **Breaking change:** `MossInference.responses.create`, typed by the `Responses` interface, replaces `chat.completions.create`, in the shape of OpenAI's Responses API, and calls `/responses` under the base URL. It takes `input`, a string or a list of `ResponseInputItem`s (an `EasyInputMessage`, a `FunctionCallOutput` or an output item), and `instructions` in place of `messages`, plus typed `max_output_tokens`, `text`, `reasoning` and `metadata`. A function tool is flat (`FunctionTool`), and `tool_choice` names a function as `{ type: "function", name }`. Without `stream: true` it returns a `Response`, the `response` object of the stream's last event plus `output_text`, whose `output` holds `ResponseOutputMessage`, `ResponseFunctionToolCall`, `McpCall` and `ResponseReasoningItem` items. With it, it returns a `ResponseStream` of `ResponseStreamEvent`s, such as `response.output_text.delta`, that ends after `response.completed` or `response.incomplete`, and `finalResponse()` returns the whole response. The `output` items go back into `input` unchanged, followed by one `function_call_output` item per function call. Usage is a `ResponseUsage` with `input_tokens` and `output_tokens`. A `response.failed` or `error` event throws `InferenceError`, and once an `mcp_call` item has arrived every error has the `errorCode` `failed_after_tool_call`. `inference.responses.create` makes the same call on a client built from the environment.
> * Requires `@moss-js/moss-core` 0.37.0.
> * Every request the native core makes, such as model and index downloads, control-plane calls, authentication, uploads and telemetry, sends a `moss-sdk/<version>` User-Agent.
>
> **Removed**
>
> * `chat.completions.create`, the `ChatCompletions` namespace, `ChatCompletionStream` and its `finalChatCompletion()`, `ToolStep` with `moss_tool_step` and `moss_tool_steps`, and the chat types: `ChatCompletion`, `ChatCompletionChoice`, `ChatCompletionChunk`, `ChatCompletionChunkChoice`, `ChatCompletionChunkDelta`, `ChatCompletionChunkToolCall`, `ChatCompletionContentPart`, `ChatCompletionCreateParams` with its `Base`, `Streaming` and `NonStreaming` forms, `ChatCompletionLogprobs`, `ChatCompletionMessage`, `ChatCompletionMessageParam`, `ChatCompletionMessageToolCall`, `ChatCompletionTokenLogprob`, `ChatCompletionTool` and `CompletionUsage`.
>
> **Fixed**
>
> * On Linux, TLS no longer trusts emSign ECC Root CA - G3, which `webpki-roots` 1.0.10 drops after the private keys of eight eMudhra intermediate CAs were compromised. macOS and Windows use the system trust store.
>
> **2026-10-23**
>
> v1.21.0
>
> **Added**
>
> * Tool calls keep every field the model sends, such as Gemini's `extra_content` with the thought signature that Gemini 3 needs back. A non-streaming call joins the pieces of each call with those fields, so pushing the reply message into `messages` sends each call back unchanged. `tools`, `tool_choice` and `parallel_tool_calls` are typed and documented.
> * `ChatCompletionStream.finalChatCompletion()` joins a stream into one completion, as a call without `stream: true` returns, so a streamed reply with tool calls can go back into `messages`.
> * `McpServer` entries in `tools` let the gateway call an MCP server's tools during the turn. Each tool step arrives as a chunk's `moss_tool_step` (`ToolStep`), and a non-streaming completion lists them in `moss_tool_steps`. `InferenceErrorType` names `capacity` and `mcp_error`. Once a step has arrived, every error of that call has the `errorCode` `failed_after_tool_call`. See the Inference section of the README.
> * `maxRetries` on the client and on each call, 2 by default and `0` for none. A connection that fails, or a 408, 409, 429 or 5xx response, before the stream starts is sent again after its `Retry-After` of up to 60 seconds, or else after a backoff of 0.5 s doubling up to 8 s with jitter. A response's `x-should-retry` forbids or forces a retry, the waits count against `timeout`, and an abort ends a wait at once. A stream that started is never retried, and after the last attempt the last error throws unchanged.
> * `cache: false` among the parameters sends `X-Moss-Cache: off`, so the gateway asks the model instead of answering an identical request from its reply cache.
> * `ChatCompletionStream.requestId` and a completion's `requestId` hold the response's `X-Moss-Request-Id`. On the completion it is not enumerable, so `JSON.stringify` gives the wire shape.
>
> **Changed**
>
> * `loadIndexes` runs up to eight loads at once instead of one after another, so many indexes load in about the time of the slowest few. A name listed twice loads once.
> * `loadIndex` on an index that is already loaded checks the cloud version first. An unchanged copy stays loaded with no download or parse, and a changed one is swapped in without interrupting queries. Either way the call's `autoRefresh` and polling options replace the current ones.
> * Auto-refresh polls a loaded index first at a random point of its first interval, then every interval give or take 10%, so indexes loaded together no longer poll together.
> * On Linux with glibc, `unloadIndex`, `unloadIndexes`, `close`, each refresh or reload that installs a newer version, and a `SessionIndex` that swaps in a refreshed version or is freed hand the freed memory back to the operating system, so a long-running process shrinks when it unloads indexes. glibc used to keep those pages until something called `malloc_trim`, and each refresh left the replaced version resident.
>
> **Fixed**
>
> * `indexes: []` skips the search, as `retrieve: false` does, instead of searching every index.
> * A completion's choices keep `logprobs`, each key holding the tokens of every chunk in order, or `null` when no chunk had any. `ChatCompletionChunkChoice` types `logprobs`, and `CompletionUsage` types `completion_tokens_details` and `prompt_tokens_details`, which `usage` keeps as the gateway sent them.
> * Parallel tool calls whose pieces carry no `index` stay apart. Such a piece joins the call of its choice with the same `id`. A piece with a new `id` starts a new call, unless the latest call has no id yet and takes it, and a piece with no `id` joins the latest call.
> * A completion's message always has `content`: the text, or with no text `null` when the model called tools and `""` otherwise, so the message goes back into `messages` whole.
>
> **2026-10-22**
>
> v1.20.0
>
> **Added**
>
> * `MossInference` answers OpenAI's `chat.completions.create` through the Moss inference gateway, which adds what it finds in the `indexes` you pass to the prompt. `new MossInference(projectId, projectKey, { apiKey, timeout, idleTimeout, headers })` checks its arguments when it is built, and `client.chat.completions.create(params, { apiKey, signal, timeout, idleTimeout, headers })` takes OpenAI's parameters plus `indexes` and `retrieve`, with `model` set to `"moss"` when it is left out. With `stream: true` it returns a `ChatCompletionStream` of `ChatCompletionChunk`s, and otherwise one `ChatCompletion`. `apiKey` is optional: your own OpenAI, Anthropic or Google key, for a vendor model such as `gpt-4o-mini`. `moss` ignores it, and a vendor model without one is refused. A call's `apiKey` wins over the client's, and an empty one is an error, as is `apiKey` or `api_key` among the parameters. Neither the client's nor a call's `headers` can set `Host`, `Content-Length` or `Transfer-Encoding`. `idleTimeout` limits the wait for response headers or for more of the body, 120 seconds by default. The client does not follow redirects. A client built with `MOSS_INFERENCE_URL` set calls that gateway instead of production, and a `baseURL` or `baseUrl` option is an error. `inference.chat.completions.create` uses a client built from `MOSS_PROJECT_ID`, `MOSS_PROJECT_KEY` and `MOSS_INFERENCE_URL`. Failures throw `InferenceError`, which carries a Moss `code` that `isMossError` accepts, and the gateway's `errorCode`, the `requestId` and `retryAfter` in milliseconds when the response has them. See the Inference section of the README.
>
> **Changed**
>
> * Requires `@moss-js/moss-core` 0.35.0. A `429` with the code `USAGE_LIMIT_EXCEEDED`, which Moss sends while a project is paused, fails on the first response with the code `UNAUTHORIZED` and the message "The project's usage limit has been reached; billing must be updated before it can be used.", instead of retrying for about 90 seconds and failing with `NETWORK`. A cold start with a committed snapshot on disk fails the same way rather than serving the snapshot. Any other `429` still retries.
>
> **2026-10-20**
>
> v1.19.0
>
> **Added**
>
> * The `license` field names `LICENSE.txt`, the file the package ships, so npm and license scanners find the PolyForm Shield 1.0.0 text.
> * `SessionIndex.saveToDisk`, `loadFromDisk` and `inspectSnapshot` take the directory as optional. Without one, or with an empty one, snapshots go in `sessions/<project id>/` under the client's `cachePath` option, else under the `MOSS_SESSION_CACHE_PATH` environment variable, which only session snapshots read, else under `moss` in the default cache directory: `~/.cache/moss` on macOS and Linux, `%LOCALAPPDATA%\moss` on Windows. A directory you pass is used as before.
> * `IndexInfo`, `IndexStatus` and `ModelRef` are exported, so code that types the results of `getIndex` and `listIndexes` imports them from `@moss-js/moss`. Import every Moss type from `@moss-js/moss`: `@moss-js/moss-core` is the SDK's native runtime and is not supported for direct use.
> * `IndexStatus`, `JobStatus` and `JobPhase` are exported as plain objects with matching string union types, so members such as `IndexStatus.Ready` work at runtime and type-check under `isolatedModules` and `verbatimModuleSyntax` (Vite, Next.js, tsx). Each member also names its own type, as an enum member did, so `let status: JobStatus.Completed` still compiles. The fields that hold them, such as `IndexInfo.status`, accept the same strings.
>
> **Changed**
>
> * Requires `@moss-js/moss-core` 0.34.0.
> * `@moss-js/moss-core` declares `IndexStatus`, `JobStatus` and `JobPhase` as types only, so code that imported their values from it, such as `IndexStatus.Ready`, imports them from `@moss-js/moss` instead.
> * The published type declarations no longer include internal members. No runtime change.
> * The custom embeddings section of the README says to L2-normalize the vectors you provide. Thanks @VeshRaazThapa (usemoss/moss#529).
> * `dist/index.esm.js` ships as plain JavaScript, not minified, so stack traces name the SDK's own functions. No API change.
> * `SessionIndex.addDocs` on a session with a built-in model embeds the documents in batches of at most 512 padded tokens instead of 8,192, and tokenizes each batch on the thread that embeds it. Each model session runs 2 inference threads on a desktop or server host (macOS, Linux or Windows) with 8 or more cores, and 1 on a smaller host, on Android and iOS, and for `moss-litelm`. Idle threads sleep instead of spinning. Embedding many documents needs less memory, and on a host that runs 2 threads it takes less time. Text queries on other sessions with the same model stay fast while it runs. `MOSS_EMBEDDING_INTRA_OP_THREADS` still sets the thread count on every platform.
> * `moss-litelm` embeds each document in its own batch, so a document's vector equals the vector of its text embedded alone. Embedded in a batch, its vectors used to differ from that, with a cosine similarity as low as 0.989.
>
> **2026-10-14**
>
> v1.18.0
>
> **Added**
>
> * `ParseOptions.chunkSize` (200 to 2000 characters, default 1200) and `ParseOptions.chunkOverlap` (0 to half of `chunkSize`, default 200 capped at half of `chunkSize`) control how the parse pipeline splits extracted text. Out-of-range values reject before any upload.
>
> **Changed**
>
> * Requires `@moss-js/moss-core` 0.33.0.
>
> **2026-10-12**
>
> v1.17.0
>
> **Added**
>
> * `MossModel` includes `"moss-litelm"`, so `session(name, "moss-litelm")` type-checks and `SessionIndex.modelId` names every model the core reports.
>
> **Changed**
>
> * Requires `@moss-js/moss-core` 0.32.0.
> * `@moss-js/moss-core` ships its native binary only in the `@moss-js/moss-core-<platform>` package that npm installs for the host as an optional dependency, so an install is about 60 MB smaller. Keep optional dependencies on: after an install with `npm install --omit=optional`, `optional=false` in `.npmrc` or `pnpm --no-optional`, importing `@moss-js/moss` throws `Cannot find native binding` with a hint to reinstall without that option. The same happens on `npm ci` from a lockfile that npm older than 11.3 rebuilt while `node_modules` existed, because that lockfile keeps only that machine's platform package. Before installing on another platform, regenerate it with `node_modules` removed, or with npm 11.3 or newer. No API change.
> * `SessionIndex.addDocs` and `deleteDocs` update the keyword index in place instead of rebuilding it, and loads build it in one pass. Scores are unchanged.
> * **Behavior change:** `SessionIndex.addDocs` checks every document of a call first, so a call with a vector of another length adds nothing.
> * `SessionIndex` keeps one copy of each document, and adds and loads move documents into the index instead of copying them.
> * A token is cached until 60 seconds before it expires or for 90% of its life, whichever is later, for custom authenticators and project keys.
> * With a project key, a 401 drops only the token it rejected, and a refused telemetry request keeps the cached token instead of fetching a new one.
> * A project key session fetches one token for its requests and its telemetry.
> * A session filled by `loadIndex` or restored by `loadFromDisk` keeps its loaded model when the index uses the same model, instead of loading it again.
>
> **Fixed**
>
> * `loadIndex` into a session that held documents kept them beside the loaded index, and `saveToDisk` then failed. A load now replaces them.
> * With a custom authenticator, the retry after a 401 resent the same cached token. It now drops the rejected token and asks the authenticator for a new one.
> * A client with a custom authenticator kept Node running after `close()`. The process now exits once its work is done.
> * On Windows, a process that first loaded the native addon from a `worker_threads` worker could crash with an access violation when that worker exited. The addon now stays loaded until the process exits, as on Linux and macOS.
> * `SessionIndex.modelId` is the model the native core reports after the last completed call, and `addDocs` and `query` pick their path by it on every call. `loadIndex` and `loadFromDisk` move the session to the model of the index or snapshot they load, which is `custom` for a custom-model one and for a built-in model one without a model artifact identity (such as a legacy snapshot loaded with `rebuildLegacy: false`), and auto-refresh can install a custom-model version into a built-in model session. After such a change, `addDocs` takes the documents' embeddings instead of rejecting, and `query` without an embedding rejects with code `INVALID_ARGUMENT`.
>
> **2026-10-06**
>
> v1.16.1
>
> **Fixed**
>
> * `SessionIndex.pushIndex()` on a session with a built-in model (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) sends that model's id, so the service re-embeds the text with it and the pushed index loads and answers text queries like one built with `createIndex`. It used to be stamped `custom`, so a pushed session could not be resumed with text queries. A custom-model session still pushes its own embeddings. Requires `@moss-js/moss-core` 0.31.1.
>
> **2026-10-05**
>
> v1.16.0
>
> **Added**
>
> * `isMossError(error)` and the `MossError` / `MossErrorCode` types. An error from the native core is an `Error` whose `code` is one of `INVALID_ARGUMENT`, `NOT_FOUND`, `UNAUTHORIZED`, `NETWORK`, `DESERIALIZATION`, `MODEL_UNAVAILABLE` or `INTERNAL`; branch on `code` instead of the message. `detail` holds the core error text, diagnostic text for logs and support rather than a stable contract. Requires `@moss-js/moss-core` 0.31.0.
> * `LoadIndexesResult.failedCodes` maps each index that `loadIndexes` could not load to its `MossErrorCode`. Requires `@moss-js/moss-core` 0.31.0.
>
> **Changed**
>
> * **Behavior change:** errors from the native core carry fixed messages per kind of failure, such as `Index not found.`, with no URLs, file paths or index names. The reasons in `loadIndexes().failed` are the same fixed messages. `query` on an index that is not loaded rejects with code `NOT_FOUND`, and its message still names the load call. `queryMultiIndex` on an index that cannot embed text rejects with the core's own error (code `INVALID_ARGUMENT`, message `This index cannot embed text queries. Pass a query embedding, or use alpha 0 for keyword-only search.`) instead of rewording it.
> * Built-in model loads (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) are faster, most of all on arm64. No API change. Requires `@moss-js/moss-core` 0.31.0.
> * `SessionIndex.addDocs` on a session with a built-in model embeds the documents in batches of at most 8,192 padded tokens, grouped by length, instead of one batch padded to the longest document. Large calls need far less memory and time: on an Apple M2, 5,000 short captions in one call took about 20 s with a 0.6 GB peak instead of about 119 s and 9.1 GB. A query embedding for the same model waits for one batch instead of the whole call. Embeddings come back in input order, with the same values to about 1e-7. Requires `@moss-js/moss-core` 0.31.0.
> * **Behavior change:** a malformed `$near` filter value is rejected with an error naming the expected `"lat,lng,maxDistanceMeters"` format instead of matching nothing.
> * **Breaking change:** `$gt`, `$gte`, `$lt` and `$lte` compare two plain decimals (`"42"`, `"-3.5"`) as numbers and two other values as text, and never match a plain decimal against any other value. Zero padded numbers such as `"07"` and forms such as `"1e3"` or `"NaN"` are text, so `"07"` no longer matches `$gt: "5"` and `"naming"` never matches `$gt: "999999"`. A number in a filter is compared in its plain decimal form, so `0.000001` still orders as a number. A condition still never matches a document that lacks the field, `$ne` and `$nin` included.
> * **Behavior change:** saving a session keeps vectors that were loaded as INT8 in INT8. It used to widen them to FP32, a file about four times larger with no gain in precision.
> * Filter validation and ordering come from `@moss-js/moss-core` 0.31.0.
> * `queryMultiIndex([])` and `SessionIndex.query` without an embedding on a custom-model session throw an `Error` with code `INVALID_ARGUMENT`, so `isMossError` accepts them.
> * A load with a cache path that finds no usable snapshot while the Moss service is unreachable reports `NETWORK` instead of `DESERIALIZATION`. An auth URL that answers 404 or 410 reports `INTERNAL` instead of `NOT_FOUND`. A refused index name keeps the naming rule as its message, and a file with an unsupported content type reads `A file has an unsupported content type.` Requires `@moss-js/moss-core` 0.31.0.
>
> **Fixed**
>
> * `MossClient.close()` and `SessionIndex.close()` resolve once the final usage telemetry is delivered or 2 seconds pass, retrying a failing endpoint in that time, so a process that exits right after `await client.close()` reports its last queries. Telemetry a periodic flush could not deliver is retried on the next flush instead of dropped. Requires `@moss-js/moss-core` 0.31.0.
> * `loadIndex` with `autoRefresh` and session auto refresh compare `updatedAt` as a point in time, so two spellings of one instant are no change, and a tick that finds a new snapshot fetches the index metadata once instead of twice. After a `loadIndex` served stale from `cachePath`, the first auto refresh that reaches the cloud warms the embedding model even when the snapshot is unchanged. Requires `@moss-js/moss-core` 0.31.0.
> * A query whose stored vectors have another length than the query rejects with code `INTERNAL` instead of ranking those documents with score 0. Requires `@moss-js/moss-core` 0.31.0.
>
> **2026-09-29**
>
> v1.15.0
>
> **Added**
>
> * `QueryOptions.minScore` drops hits whose `score` is below the threshold, from 0 to 1; a query returns up to `topK` hits that clear it, in hybrid order. A value outside 0 to 1 is rejected, and so is setting it on a keyword-only query (`alpha === 0`) or when no queried index holds vectors. `query` and `queryMultiIndex` forward it to all four native query methods; session queries ignore it.
> * `QueryOptions.candidateDepth` sets how many hits a hybrid query ranks on each signal (vector and keyword) before fusion. A hit outside both lists is never returned, so a deeper list raises recall and query time. Left unset, a hybrid query looks `2 * topK` deep, as before. A set value must be at least 1 (0 is rejected) and is raised to `topK` when below it. Keyword-only and vector-only queries (`alpha` 0 or 1) ignore it and rank `topK` hits, since a deeper list returns the same results. `query` and `queryMultiIndex` forward it to all four native query methods; session queries ignore it. Requires `@moss-js/moss-core` 0.30.0.
> * `loadIndex` and `loadIndexes` with a `cachePath` serve the snapshot saved there when the cloud is unreachable, instead of failing. When a snapshot is on disk, the cloud check makes one attempt within 5 seconds. A transport error (unreachable network, timeout) or an HTTP 408, 429, 500, 502, 503 or 504 (only a 408, 429, 500 or 503 from the auth service) loads the snapshot and starts a refresh poller, even without `autoRefresh`, so the index catches up when the cloud returns. A 404 still fails, as does a 401 or 403, so a deleted or forbidden index does not come back from cache. A snapshot saved by an SDK before 1.15.0, or under another project or cloud origin, is not served, and the load fails after that one attempt. A load that finds the cloud copy unchanged keeps the old snapshot, so a snapshot saved before 1.15.0 is served only after the index is downloaded again, which happens when the cloud copy changes. After a load from the snapshot, text queries with `alpha` above 0 fail until the Moss cloud is reachable, since a built-in embedding model cannot open offline, unless the same model is already open in this process. Keyword-only queries (`alpha: 0`) and queries that pass their own embedding keep working. Requires `@moss-js/moss-core` 0.30.0.
>
> **Changed**
>
> * **Behavior change:** `score` is the relevance of the hit to the query, from 0 to 1, in `query`, `queryMultiIndex` and `SessionIndex.query` alike. Results stay in hybrid order, so a lower-ranked result can show a higher score. Scores depend on the embedding model: tune `minScore` on your own queries. A keyword-only query (`alpha === 0`) scores every hit 0.
> * Requires `@moss-js/moss-core` 0.30.0, which adds the `minScore` query parameter and the relevance `score`.
> * **Behavior change:** a query `embedding` whose length differs from the index dimension rejects at `alpha` 0 as it does above 0; it used to be ignored at 0. An empty `embedding: []` counts as wrong-size in `query` and `SessionIndex.query`, so it rejects at every `alpha`, while `queryMultiIndex` reads it as no embedding. Requires `@moss-js/moss-core` 0.30.0.
> * **Behavior change:** a blank query (empty or only whitespace) with no `embedding` returns no results at every `alpha` without running the embedding model. It used to embed the empty text above `alpha` 0 and rank every document against it. A blank query with an `embedding` ranks by the embedding. Requires `@moss-js/moss-core` 0.30.0.
> * Queries no longer send one telemetry request each. `index.query`, `index.query_multi` and `session.query` events are buffered and sent with the usage flush every 3 seconds and at close, as JSON arrays of up to 500 events, one request per array. Each event keeps the fields it had, including its own `latencyMs`. Up to 10,000 events wait between flushes; events past that are dropped and the count is logged. Usage counts are unchanged. The README lists every telemetry event and its fields. Requires `@moss-js/moss-core` 0.30.0.
> * `MossClient.close()` and `SessionIndex.close()` resolve after the final telemetry flush is sent, so a process that exits right after `await close()` keeps its buffered query events. A flush waits at most 5 seconds for authentication, once for all its events, and 3 seconds per request. Requires `@moss-js/moss-core` 0.30.0.
> * Keyword-only and hybrid queries without a `filter` that match many documents in a large index are faster, since keyword search sorts only the top hits instead of every match. Keyword scores are the same. Requires `@moss-js/moss-core` 0.30.0.
>
> **Fixed**
>
> * Malformed index data and tokenizer files reject with an ordinary error instead of a native panic. An index whose stored vectors differ in length fails to load. A `tokenizer.json` whose truncation stride is not less than 512 minus its special tokens fails the model load. Deleting from an index stored without vectors works, and adding documents to it rejects. Requires `@moss-js/moss-core` 0.30.0.
> * A vector holding NaN or infinity rejects instead of reordering results without an error. `SessionIndex.addDocs` with one rejects the whole call, naming the document and the position, and stores nothing. A query `embedding` holding one rejects at every `alpha`, and loading an index that stores one fails. Requires `@moss-js/moss-core` 0.30.0.
> * Every call that names a cloud index (`createIndex`, `createIndexFromFiles`, `createWebSource`, `getIndex`, `deleteIndex`, `addDocs`, `deleteDocs`, `getDocs`, `loadIndex`, `SessionIndex.loadIndex`, `SessionIndex.pushIndex`) rejects a name that is blank, `"."` or `".."`, contains `/` or a control character, or is longer than 256 bytes, before any request is sent; `loadIndexes` lists such a name in `failed`. The error message includes `Validation error: index name must not be blank, "." or "..", must not contain "/" or control characters, and must be at most 256 bytes`, the same text in every SDK. Any other name is percent-encoded, so names with spaces, `%`, `?` or `#` reach their own index. Pass the raw name: a name that is already percent-encoded, for example with `encodeURIComponent`, is encoded again and addresses a different index. Requires `@moss-js/moss-core` 0.30.0.
> * `getDocs` percent-encodes each document id, so an id containing `,`, `&` or a space returns that one document. An id with a comma used to arrive as two ids. Requires `@moss-js/moss-core` 0.30.0.
> * `addDocs` sends `MutationOptions.upsert` to the cloud when set. The service decides how to apply it. Requires `@moss-js/moss-core` 0.30.0.
> * `loadIndex` and `loadIndexes` with `autoRefresh: true` and `pollingIntervalInSeconds: 0` poll at the default interval of 600 seconds. Before, the refresh task panicked as it started, so the index never refreshed while the load reported success. An interval above one year polls once a year. Requires `@moss-js/moss-core` 0.30.0.
> * Keyword-only and hybrid queries order documents with equal keyword scores by their position in the index, so the same query returns the same results on every call. That order used to vary from call to call. Requires `@moss-js/moss-core` 0.30.0.
> * With a project key, when the auth service answers 408, 429, 500 or 503, the error names the HTTP status without the service's response body. A 403 from it rejects with the same invalid-credentials error as a 401. Web source methods and `getAuthToken` are not affected. Requires `@moss-js/moss-core` 0.30.0.
>
> See [Score semantics](https://docs.moss.dev/docs/integrate/retrieval.md#score-semantics).
>
> **2026-09-21**
>
> v1.14.0
>
> **Added**
>
> * `SessionIndex.loadFromDisk` rebuilds a snapshot that an SDK older than 1.8 saved for a built-in model. Those snapshots carry no model provenance, so text `addDocs` and `query` on them failed with "requires explicit embeddings". The stored documents are re-embedded with the current model and the upgraded snapshot is saved back in one operation, so the rebuild runs once per device (about a minute for 10k chunks, off the main thread, with the Moss cloud reachable). It only runs for a session opened with the same built-in model; pass `{ rebuildLegacy: false }` to opt out. If the model cannot be loaded, `loadFromDisk` rejects with a message starting "Legacy snapshot rebuild needs the embedding model" and changes nothing, so retry later instead of discarding the snapshot.
> * `SessionIndex.inspectSnapshot(cachePath)` describes a snapshot without loading it. `SnapshotInfo` and `LoadFromDiskOptions` are exported.
>
> **Changed**
>
> * Every `SessionIndex` operation (`addDocs`, `deleteDocs`, `getDocs`, `query`, `saveToDisk`, `loadFromDisk`) and the model warm-up inside `MossClient.session()` run their native work on a worker thread instead of the Node main thread, so the event loop keeps serving while a large batch is embedded or a session is saved. Operations on one `SessionIndex` still run in call order, one at a time. `docCount` stays synchronous and reports the count as of the last completed operation. No API change.
> * Requires `@moss-js/moss-core` 0.29.0.
>
> See [Sessions](https://docs.moss.dev/docs/reference/js/sessions.md).
>
> **2026-09-20**
>
> v1.12.0
>
> **Changed**
>
> * Loading a built-in model (`moss-minilm`, `moss-mediumlm`, `moss-litelm`) now requires the Moss cloud to be reachable and rejects with an error otherwise. No API change. Requires `@moss-js/moss-core` 0.27.0.
>
> **2026-09-15**
>
> v1.11.0
>
> **Changed**
>
> * The per-device id is now sourced by the native core (`@moss-js/moss-core` 0.26.0); `@moss-js/moss-core` users get it without the wrapper. Same file (`~/.moss/.moss-device-id`), same id. `MossClientOptions.cachePath` still uses `<cachePath>/.moss-device-id` (adopting an existing id, or creating one when the file is missing), and `identity.deviceId` still overrides the billable id.
> * Sessions opened through `client.session()` carry the client's resolved identity, including an id adopted by `loadIndex(name, { cachePath })`. The first id resolved on a client stays on every surface, and a per-call `loadIndex(name, { cachePath })` still creates `<cachePath>/.moss-device-id` when it is missing.
>
> **2026-09-13**
>
> v1.10.0
>
> **Added**
>
> * Web source methods on `MossClient`: `createWebSource`, `listWebSources`, `getWebSource`, `updateWebSource`, `resyncWebSource`, and `deleteWebSource`, typed wrappers over the `/v1/manage` web source actions. `createWebSource`, `resyncWebSource`, and `updateWebSource` with `resync: true` return a `jobId` to poll with `getJobStatus`; `deleteWebSource` returns `purgeJobId` while the source's pages are removed.
> * Types `WebSource`, `CreateWebSourceOptions`, `CreateWebSourceResult`, `UpdateWebSourceOptions`, `UpdateWebSourceResult`, `ResyncWebSourceResult`, `DeleteWebSourceResult`, and `ManageApiError` (carries the HTTP `status`).
> * `MOSS_CLOUD_API_BASE_URL` overrides the host used by the web source methods.
>
> See [Web Sources](https://docs.moss.dev/docs/reference/js/web-sources.md).
>
> **2026-09-09**
>
> v1.9.0
>
> * Reliability improvements to on-device model loading. No API changes. Requires `@moss-js/moss-core` 0.25.0.
>
> **2026-09-08**
>
> v1.8.0
>
> **Changed**
>
> * Published as `@moss-js/moss`, depending on `@moss-js/moss-core` 0.24.0. Install with `npm install @moss-js/moss`. `@moss-dev/moss` stays at 1.7.1 and receives no further releases.
> * Improved on-device model loading for foundation models (`moss-minilm`, `moss-mediumlm`, `moss-litelm`). No API change.
>
> **Removed**
>
> * The cloud query fallback. `query` on an index that is not loaded now rejects with an error telling you to call `loadIndex` first. The `MOSS_QUERY_URL` override is gone.
> * `MOSS_MODEL_ARTIFACT_TOKEN` is no longer used and is ignored.
>
> **Added**
>
> * `MossClient.queryMultiIndex(indexNames, query, options)`: search several loaded indexes in one call and get the global top-k, each result tagged with its source `indexName`. `options.alpha` works as in `query` (default 0.8): `1.0` embedding-only, `0.0` keyword-only, in between hybrid via Reciprocal Rank Fusion.
> * `MossClient.loadIndexes(indexNames, options)`: best-effort bulk load returning `LoadIndexesResult { loaded, failed }`; `MossClient.unloadIndex(indexName)` and `MossClient.unloadIndexes(indexNames)` release loaded indexes.
> * `QueryResultDocumentInfo.indexName` (set on multi-index results) and the `LoadIndexesResult` type.
>
> **2026-08-26**
>
> v1.7.1
>
> **Fixed**
>
> * `createIndexFromFiles` with in-memory `data` (Uint8Array, ArrayBuffer, Blob, or File) failed at the native boundary with "Failed to get Array length on JsParseFileInput.data"; bytes are now marshalled in the representation the binding accepts. The `path` flow was unaffected.
>
> See [Index from files](https://docs.moss.dev/docs/reference/js/files.md).
>
> **2026-08-26**
>
> v1.7.0
>
> * New `CreateIndexFromFilesOptions.parseOptions` (`ParseOptions`, now exported): control server-side extraction with `useHighResolution`, `segmentationMethod` (`smart_layout_detection` or `page_by_page`), `ocrMode` (`auto_ocr` or `full_ocr`, the latter for scanned documents with no text layer), and `mergeTables`. Requires `@moss-dev/moss-core` `0.23.0`.
> * `ParseFileInput.contentType` supports `application/pdf` and the DOCX MIME, matching the parse service's admission check; unsupported types fail fast locally with a clear error.
> * `JobProgress.currentPhase` includes the crawl and parse pipeline phases (`queued`, `crawling`, `parsing_documents`, `parsing`, `waiting_for_parser`, `parsing_complete`).
> * Local text queries on server-built foundation indexes without an exact model artifact identity are refused with an actionable error instead of embedding against a guessed artifact; explicit query embeddings and cloud queries are unaffected.
>
> **2026-08-06**
>
> v1.6.0
>
> * New `MossClientOptions.identity` (`MossIdentity`): pass a stable caller-managed `deviceId` and optional `userId` at construction. The caller's `deviceId` is emitted as the billable telemetry `deviceId` (Monthly Active Device key); Moss's stable UUID is always emitted alongside as `mossDeviceId` for correlation; `userId` is never billable. Values must be 1-256 UTF-8 bytes with no surrounding whitespace, control or format characters, lone surrogates, or replacement characters; invalid values throw at construction. Without a configured identity, `deviceId` and `mossDeviceId` both carry Moss's UUID, so existing billing behavior is unchanged. Requires `@moss-dev/moss-core` `0.22.0`; constructing with an identity on an older core fails fast with an actionable error.
>
> **2026-07-13**
>
> v1.4.0
>
> * New: SessionIndex.close() and MossClient.close(), both idempotent, plus Symbol.asyncDispose support so `await using` works on Node 24. Closing releases the native index, pollers, and the session's reference to the shared embedding model (the service is dropped when the last session using it closes; the allocator retains and reuses those pages for the next load, so footprint stays bounded at one model per model id). Threads are no longer per-session. Concurrent close() callers share one completion promise and all settle when disposal finishes.
> * Published type declarations no longer force consumers to enable the ESNext.Disposable lib (the bundle carries the reference itself); consumers need TypeScript 5.2 or newer.
> * README and samples now demonstrate the close() / await using lifecycle.
> * MossClient.close() now also closes every live session created by that client (tracked via weak references); sessions can still be closed individually first.
> * close() fails loudly when the installed @moss-dev/moss-core predates the lifecycle API instead of silently leaking; this release requires @moss-dev/moss-core 0.20.0.
> * Declared engines: node >= 20.4 (first Node release where Symbol.asyncDispose exists).
>
> **2026-07-09**
>
> v1.3.2
>
> **Changed**
>
> * Picks up `@moss-dev/moss-core` `0.19.2` (dependency currency; native-binding `DocumentInfo.payload` round-trip fix). No SDK API changes. (Prior `1.3.1` release re-run failed because the version was not bumped; this restores a publishable version.)
>
> **2026-06-26**
>
> v1.3.1
>
> **Fixed**
>
> * **Fixed a native crash when re-saving an on-disk session.** Calling `saveToDisk` on a session previously restored with `loadFromDisk` could crash the process while writing the on-disk index, because the index file was rewritten in place while the loaded session was still reading from it. `saveToDisk` still persists immediately, but now writes to a temporary file and atomically renames it into place, so the file the live session is reading from is never rewritten underneath it. Requires `@moss-dev/moss-core` `0.19.1`.
>
> **2026-06-25**
>
> v1.3.0
>
> **Added**
>
> * **Sessions work with a custom `IAuthenticator`.** `MossClient.session()` now works when the client is constructed with a custom authenticator (short-lived tokens / delegated auth), not just a static project key - it previously threw. The session authenticates (credential validation, `pushIndex`, `loadIndex`) and reports usage through the same auth bridge as `loadIndex`. Requires `@moss-dev/moss-core` `0.19.0` (adds the `SessionIndex.withAuthenticator` napi factory).
>
> **2026-06-25**
>
> v1.2.1
>
> **Added**
>
> * **Client-level `cachePath`.** `new MossClient(projectId, key, { cachePath })` (and the `IAuthenticator` overload) sets one location for the per-device telemetry id, honored by every operation that emits telemetry - `loadIndex`, `session`, and so on. Set it once instead of per call.
>
> **Fixed**
>
> * **Session telemetry now carries the per-device id.** `MossClient.session()` now attaches the anonymous `deviceId` to `session.*` telemetry events, matching `loadIndex`. Previously only the `loadIndex` path attached a `deviceId`, so usage from session-only clients was reported without one.
> * The per-device id is now resolved once and shared across `loadIndex` and `session()` within a client, so a client that uses both surfaces reports a single, consistent id.
>
> **Changed**
>
> * The per-device id location is now resolved with this precedence: the client-level `cachePath`, then the `cachePath` passed to `loadIndex` (back-compat), then a per-user fallback, `<home>/.moss/.moss-device-id`. Previously the id was only written when `loadIndex` was given a `cachePath`.
>
> **2026-06-23**
>
> v1.2.0
>
> **Added**
>
> * **Usage telemetry on the custom-authenticator path.** Automatic, privacy-light usage telemetry now works when the client is constructed with a custom `IAuthenticator` (e.g. short-lived tokens), not just a plain project key - previously it was silently disabled on that path. This enables device-level usage reporting for client-side / delegated-auth deployments.
> * A stable, anonymous per-device id is generated once and persisted at `<cachePath>/.moss-device-id` (the `cachePath` you already pass to `loadIndex`), then attached to telemetry as `deviceId`. It is a random UUID - no hardware identifier, no PII.
> * Bumped `@moss-dev/moss-core` to `0.18.0` (adds the `setDeviceId` napi binding and auth-provider telemetry).
>
> **2026-06-03**
>
> v1.1.0
>
> **Added**
>
> * **`MossClient.session(name, modelId?)`** - local-first session index. Construct a session, add/delete/get documents and run queries entirely in-process (no cloud round-trip per operation), then `pushIndex()` to persist to the cloud. Also `loadIndex(indexName, { autoRefresh, pollingIntervalInSeconds })` to pull an existing cloud index into the session.
> * New top-level exports: `SessionIndex`, `PushIndexResult`, `LoadSessionOptions`.
> * Bumped `@moss-dev/moss-core` to `0.17.0` (adds the `SessionIndex` napi binding).
>
> **2026-05-05**
>
> v1.0.2
>
> **Changed**
>
> * Bumped `@moss-dev/moss-core` dependency from `0.9.1` to `0.10.0`, which adds prebuilt binaries for `x86_64-apple-darwin` (Intel Macs) and realigns the npm package version with the underlying Rust core.
>
> **2026-04-17**
>
> v1.0.1
>
> **Added**
>
> * **Custom authenticator** for browser-safe authentication: new `MossClient.withAuthenticator()` and `IndexManager.withAuthenticator()` factory methods accept a JS-side token callback, backed by `JsAuthBridge` in `@moss-dev/moss-core` (#226).
>
> **Changed**
>
> * `CLOUD_API_MANAGE_URL` replaced by granular constants: `CLOUD_API_IDENTITY_URL`, `CLOUD_API_AUTH_URL`, etc. (#226).
>
> **2026-04-01**
>
> v1.0.0
>
> **Architecture**
>
> * **Rust-native core**: The SDK now delegates all index management, querying, and embedding generation to `@moss-dev/moss-core` (Rust via NAPI-RS), replacing the previous pure-JavaScript implementations
> * **Node-only**: Dropped browser/WASM support; the SDK targets Node.js 20+ exclusively
> * Query embeddings are now generated in Rust (`queryText` / `loadQueryModel`), matching the Python SDK architecture
>
> **Changed**
>
> * Package renamed from `@inferedge/moss` to `@moss-dev/moss`
> * NAPI binding renamed from `moss-core` to `@moss-dev/moss-core` (v0.8.7, tracking Rust core version)
> * `query()` uses Rust-native `queryText()` for local queries (no JS embedding pipeline)
> * `query()` with `embedding` option uses Rust `query()` directly
> * `query()` falls back to cloud HTTP when index is not loaded locally
>
> **2026-03-30**
>
> v1.0.0-beta.8
>
> **Added**
>
> * **Filesystem Index Caching**: `loadIndex()` now accepts an optional `cachePath` in `LoadIndexOptions` to cache index binaries and documents to disk (Node.js/Bun only)
>   * Cache is automatically invalidated when the cloud index is updated
>   * Auto-refresh also persists refreshed data to the cache
>   * Atomic writes prevent cache corruption from partial/interrupted writes
>   * Path traversal protection on index names
>   * Graceful fallback to re-download if cached data is corrupted
> * **Metadata Filtering**: `query()` now accepts an optional `filter` in `QueryOptions` to narrow results by document metadata on locally loaded indexes
>   * Comparison operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`
>   * Set operators: `$in`, `$nin`
>   * Composable with `$and` / `$or` for complex predicates (supports arbitrary nesting)
>   * Numeric coercion: number filter values are automatically stringified for consistent matching
> * **Geo-distance filtering**: new `$near` operator filters documents by haversine distance from a `"lat,lng,radiusMeters"` value
> * New exported types: `FilterCondition`, `MetadataFilter`
>
> **2026-02-18**
>
> v1.0.0-beta.7
>
> **Added**
>
> * Async job-based mutations (`createIndex`, `addDocs`, `deleteDocs`) with built-in polling and `onProgress` callbacks
> * Large index support - up to 100k documents via presigned upload + server-side build
> * New binary index format with smaller payloads and faster deserialization; existing indexes using the previous format are still supported
>
> **2026-02-02**
>
> v1.0.0-beta.6
>
> **Added**
>
> * **Hot Reload & Auto-Refresh**: Indexes can now automatically detect and reload when updated in the cloud.
>   * `loadIndex()` now accepts optional `LoadIndexOptions` with `autoRefresh` and `pollingIntervalInSeconds` parameters
>   * When `autoRefresh` is enabled, the SDK polls for updates at the configured interval (default: 600 seconds)
>   * To stop auto-refresh, call `loadIndex()` again without the `autoRefresh` option
> * `loadIndex()` now allows reloading an already-loaded index (previously threw an error)
>
> **2026-01-29**
>
> v1.0.0-beta.5
>
> **Added**
>
> * Query optimizations for custom-embedding workflow
>
> **2026-01-28**
>
> v1.0.0-beta.4
>
> **Fixed**
>
> * Fixed `ReferenceError: process is not defined` crash in browser environments. The SDK now works seamlessly across all JavaScript runtimes including browsers, Node.js, Deno, and Bun.
>
> **2026-01-24**
>
> v1.0.0-beta.3
>
> **Added**
>
> * Support for user-supplied document embeddings during ingestion. The SDK supports optional `embedding` arrays in `DocumentInfo` payloads without using the native embedding service from moss.
> * Query overloads now accept `QueryOptions` so users can provide a custom embedding alongside query text.
> * Relaxed `modelId` requirement when creating indexes. The SDK aligns with the service default of `moss-minilm` when no explicit model is provided.
> * `query()` now automatically falls back to the cloud API when the index is not loaded locally, enabling queries without requiring `loadIndex()` first.
>
> **Enhancements**
>
> * New service endpoint with significant infrastructure upgrades. Management operations are now \~3× faster across most real-world use cases, providing faster index operations while also supporting larger payloads.
>
> **2025-11-30**
>
> v1.0.0-beta.2
>
> **Fixed**
>
> * Fixed ESM (ES Module) import compatibility issue. The package now correctly exports as an ES module and can be imported using standard ESM syntax.
>
> **Upgrade Instructions**
>
> * Migrate from CommonJS (`require`) to ES Module syntax (`import`).
>
> **2025-10-01**
>
> v1.0.0-beta.1
>
> Initial release of @moss-dev/moss with core features:
>
> * Semantic search using transformer-based embeddings
> * Lightweight embedding models for edge computing; supports proprietary "moss-minilm" and "moss-mediumlm" models
> * Multi-index support for isolated search spaces
> * Add, update, and remove documents across indexes
> * Blazing fast querying support after loading indexes
> * TypeScript support with full type definitions

> [tab] Moss CLI
>
> **2026-11-02**
>
> v0.3.0
>
> **Added**
>
> * With no credentials, `moss index`, `moss doc` and `moss query` run in offline mode. They keep one index in `~/.moss/offline`, built from documents that carry their own `embedding`. The index opens only for the OS user and device that created it, in one process at a time, and the CLI does not run it on Kubernetes, AWS Lambda and similar server platforms.
> * `--offline` (or `MOSS_OFFLINE=1`) selects offline mode, even with credentials. In CI, missing credentials fail without it.
> * Offline mode sends anonymous usage counts: a random device id, a session id, the CLI version, and document and query counts. Nothing from the index leaves the device.
> * `moss index push <name>` uploads that index to your project, embeddings included.
> * `moss query --embedding` takes the query vector as a JSON array or the path of a file holding one, with or without an account.
>
> **Changed**
>
> * moss-cli carries a native module and ships one wheel per platform: Linux x86\_64 and aarch64, macOS arm64 and Windows x86\_64, where `moss` already installs. It has no source distribution, and a build from a checkout needs a Rust toolchain.
>
> **2026-10-20**
>
> v0.2.1
>
> **Added**
>
> * The package metadata declares its license, PolyForm Shield 1.0.0, as `LicenseRef-PolyForm-Shield-1.0.0`, so PyPI and license scanners show it.
>
> **Fixed**
>
> * The README puts the global options `--project-id`, `--project-key` and `--json` before the command, where `moss` reads them.
>
> **2026-10-12**
>
> v0.2.0
>
> **Added**
>
> * `moss login` logs in through the browser and saves a CLI token to `~/.moss/config.json`. `moss logout` revokes the saved token and removes it, and `moss whoami` shows the account the token belongs to.
> * `moss projects list` lists the projects in the workspaces you belong to, with your role in each.
> * `moss keys create`, `list` and `delete` manage project keys with the CLI token (`--json` for agents). `create` shows the secret once, and `delete` asks first unless `--confirm` / `-y` or `--json` is passed.
> * `moss login --print-token --name ...` prints a separate token for an agent instead of saving it, and keeps your saved login.
> * `--token` / `MOSS_TOKEN` passes a CLI token, for agents, and `--api-url` / `MOSS_API_URL` points `login`, `whoami`, `projects` and `keys` at another dashboard, such as staging. The saved token is only sent to the dashboard that issued it.
>
> **Changed**
>
> * `moss init` keeps a token saved by `moss login` instead of overwriting the whole config file.
> * Requires `typer` 0.26.8 or later and `rich` 15.0.0 or later.
>
> **Removed**
>
> * The `--cloud` / `-c` flag on `moss query`. The cloud query service it targeted has been retired, so `moss query` always downloads the index and queries it on-device (the previous default).
>
> **Fixed**
>
> * A failing command prints only its error message, not a Python traceback.
>
> **2026-03-31**
>
> v0.1.1
>
> **Changed**
>
> * The README, which is the package description on PyPI, has no emojis. The code is the same as in 0.1.0.
>
> **2026-03-29**
>
> v0.1.0
>
> * **Initial release** - CLI wrapper for the Moss Python SDK (v1.0.0)
> * Index management: `moss index create`, `list`, `get`, `delete`
> * Document management: `moss doc add`, `delete`, `get`
> * Semantic search: `moss query` with `--cloud`, `--filter`, `--alpha`, `--top-k`
> * Job tracking: `moss job status` with `--wait` for live progress
> * Interactive credential setup: `moss init`
> * Three-tier auth resolution: CLI flags > env vars > config file
> * JSON and CSV document input, stdin piping with `--file -`
> * `--json` flag on all commands for machine-readable output
> * Rich terminal output: tables, progress spinners, colored status

> [tab] Portal
>
> **2026-11-03**
>
> **Moss Inference beta**
>
> * New **Moss Inference** page and sidebar card. On the Developer plan, request private beta access, then share your invite link to move up the waitlist; the page shows your place and how many people joined through your link.
> * On paid plans, the page and card offer **Talk to an engineer**, and an invite page shares your link without a waitlist rank.
>
> **2026-11-02**
>
> **Credits**
>
> * The **Billing** page has a **Credits** card in place of Pay-As-You-Go: see your balance, buy credits (\$5 minimum), and set auto-reload. Only organization owners can buy credits or redeem promo codes.
> * When credits run out, usage pauses and the sidebar says **Add credits to continue**.
> * Credit purchases show on the **Invoices** page.
> * The **Usage** page shows inference tokens per model and inference retrievals.
>
> **2026-10-16**
>
> **Founding Agent deal codes**
>
> * Redeem a Founding Agent deal, such as the [YC deal](https://moss.dev/product/founding-agent/yc), from the sign-up link in its email. Checkout opens with the code applied, and the plan activates once you confirm it.
> * If a code can't be used, the **Plan** page says why.
>
> **2026-10-07**
>
> **Founding Agent widget teaser**
>
> * A new **Widget teaser** setting on the agent's **Agent** tab shows a short message (up to 80 characters) above the idle widget on your site. Requires `@moss-js/founding-agent` 2.3.0.
>
> **Changed**
>
> * Agents open on their **Agent** settings, and the **Overview** page is removed.
>
> **2026-10-02**
>
> **New onboarding**
>
> * Sign-up asks what you are building and which stack you use, then opens a ready-made index in your project so you can search it right away. **Just exploring?** opens the demo directly.
> * **Ready to use your own data?** builds your first index from a website or from PDF and DOCX files without leaving onboarding, or keeps the sample data for now.
> * **Connect your app** shows install, credentials, and a first search for your language against the index you just built. **Create key** mints a project key in place (shown once), and your app's first query is detected automatically.
>
> **Changed**
>
> * Every index page has a **Connect** tab with the install, keys, and first-search guide, replacing **Quick Start** under **Settings**.
>
> **Founding Agent setup**
>
> * The new-agent setup starts with **What are you building?** (optional), which shapes the drafted greeting, instructions, and suggested questions. The knowledge step lists the pages read from your website and the Q\&A or text you added, editable in place.
> * New **Suggested questions** step: about five questions visitors are likely to ask, each with an answer drafted from your website. Accept, edit, delete, or skip each one; accepted ones are saved as Q\&A.
> * Each agent opens on an **Overview** with conversations, leads, high-intent conversations, meetings booked, and unanswered questions, plus one suggested next action.
>
> **2026-10-01**
>
> **Changed**
>
> * Two-factor codes are entered one digit per box. Pasting a code or letting your phone fill it in still works.
> * Switching between the **Developer Portal** and **Founding Agent** is faster: the sidebar shows at once and the page loads behind it.
> * The **Playground** shows a score next to each result, and the dashboard no longer downloads the embedding model on every visit. Indexes built with an older SDK that does not record its model cannot be searched in the Playground.
>
> **Fixed**
>
> * The Founding Agent install snippet installs `@moss-js/founding-agent` with the packages the widget needs and includes the Tailwind setup its styling depends on.
>
> **2026-09-29**
>
> **Founding Agent Knowledge tab**
>
> * **Add website** crawls a site into the agent's knowledge, with a page limit, live progress, re-crawl, and remove. Bare domains like `docs.example.com` are accepted.
> * **Add files** uploads up to 10 PDF or DOCX files (20 MB each, 50 MB total). **My files are scanned** runs OCR and is available on paid plans.
> * The tab is organized into **Websites**, **Uploaded files**, and **Everything the agent knows**. Long pages collapse with **Show full page**, and Q\&A changes show up right away.
>
> **2026-09-26**
>
> **Added**
>
> * A **product switcher** under the Moss logo moves between the **Developer Portal** and **Founding Agent** from any page. It replaces **Back to Dashboard** in the Founding Agent account menu.
>
> **2026-09-25**
>
> **Founding Agent redesign**
>
> * New navigation. The sidebar groups **Agents** (with **New agent**), **Monitor** (Live, Leads, Analytics), **Configure** (Integration), and **Settings**. Inside an agent, a switcher moves between agents, and its pages are grouped under **Configure** (Agent, Appearance, Knowledge Base, Q\&A, Demo Booking, Security, Sandbox) and **Monitor** (Live, Leads, Analytics). Handoffs are now part of **Live**.
> * The **Config** tab is split into **Agent**, **Demo Booking**, and **Security**, which now holds the agent's API keys. Each card saves on its own.
> * New **Appearance** tab for the widget's shape, colors, texture, and theme.
> * Agents can be published, unpublished, and deleted from the portal. Publishing and unpublishing need an org owner or admin and an active plan.
> * The create wizard is full screen, and the agent is created at the Knowledge step.
>
> **Changed**
>
> * Refreshed styling across the portal and sign-in screens.
> * Your profile has a single **Display Name** instead of first and last name.
> * New **Settings** > **Payment** page. The pay-as-you-go card shows your **Current balance** with a **Buy more** button.
> * **Voice minutes are now Session minutes** on the **Usage** page, in **Analytics**, and in the overage banner. The meter is unchanged.
>
> **2026-09-23**
>
> **Added**
>
> * **Website sources.** A new **Sources** tab on the index page lists the websites crawled into the index, with status, page count, and last crawl, and lets you **Add website**, **Re-crawl**, **Edit**, **Remove**, and **View pages**. Each crawl takes a website URL, max pages (default 500, up to 5,000), a re-crawl schedule (only when you ask, every day, or every week), and include and exclude path patterns (regular expressions, up to 50). Removing a source needs an org owner or admin. Crawled documents link back to their source page.
> * **Create index from a website or files.** **Create index** has two new sources: **From Website** crawls a site into a new index, and **Files** builds one from up to 20 PDF or DOCX files of up to 50 MB each, with optional **Run OCR on every page**. Neither is available for custom-model indexes, and **Files** creates a new index only.
>
> **Changed**
>
> * On graduated pricing, the overage banner shows your current rate and the next tier once usage passes the first tier. Monthly active devices are shown per device.
> * Committed voice plans with rollover count rolled-over minutes in the voice limit, shown as "incl. N rolled over".
>
> **Cancelling a plan**
>
> * Cancelling under **Settings** > **Billing** first checks the free plan limits (1 project, 3 indexes per project) and lists what to remove; nothing is deleted for you. It then asks why you are leaving.
> * While a cancellation is scheduled, new projects and indexes are held to the free limits. Existing ones keep working until the period ends, and undoing the cancellation restores the paid limits.
>
> **2026-09-18**
>
> **Added**
>
> * **Two-factor authentication by SMS**, required for every portal account, including GitHub and Google sign-ins. The next time you sign in, add a phone number and enter the 6-digit code sent to it. After that, each sign-in asks for a code. New accounts set it up before onboarding.
> * Change your number or add another one under **Settings** > **Profile** > **Two-factor authentication**. You get an email whenever a phone is added or removed. Two-factor authentication cannot be turned off, and there are no backup codes: if you lose your phone, contact Moss support to reset it.
> * API keys and the SDKs are not affected.
>
> **Changed**
>
> * Signing out ends the session in the current browser only, instead of on every device.
>
> **2026-09-16**
>
> **Founding Agent demo booking**
>
> * **Google Calendar booking.** **Connect Google Calendar** and pick the calendar to book on; only calendars that can create Google Meet links can be selected. Set the meeting length (15 to 240 minutes), time zone, bookable days and hours (default Monday to Friday, 9:00 to 17:00), buffer between meetings (up to 120 minutes), and minimum notice (default 4 hours, up to 7 days). Visitors get a calendar invite with a Meet link, and busy times are never offered.
> * **Connect Calendly** with OAuth instead of pasting a token, then choose a **Calendly event type**. Requires a paid Calendly plan (Standard or above). Event types that ask the visitor for a phone number or address, or that offer several locations, cannot be selected.
>
> See [Booking](https://docs.moss.dev/docs/founding-agent/embed/booking.md).
>
> **2026-09-13**
>
> **Added**
>
> * The **Usage** page shows **Crawled URLs** and **Parsed document pages** against your plan allowance, with the charge, once either is above zero. Counts cover the whole org, even with a project filter on. The overage banner includes both, with per-page rates shown to three decimals.
>
> **Changed**
>
> * JSON uploads in **Create Index** > **Custom Upload** are no longer capped at about 4.5 MB. A failed upload releases the index name, so you can retry right away. **Add Documents** on an existing index still has the 4.5 MB limit.
>
> **Fixed**
>
> * The voice minutes chart in **Analytics** splits a call that crosses midnight UTC across both days, and loads faster for large orgs.
>
> **2026-09-10**
>
> * **Several API keys per project.** The project's **API Keys** page now creates, lists, and deletes keys, so you can rotate with overlap: create a new key, move your clients to it, then delete the old one. New projects start with no key.
> * A key is shown once, at creation. Existing keys keep working but can no longer be viewed in the portal.
> * Deleting a key blocks new tokens right away. Tokens already issued with it stop working within about 20 seconds.
> * Any org member can see the list of keys. Org owners, admins, and the project owner can create and delete them.
>
> See [Managing project keys](https://docs.moss.dev/docs/integrate/authentication.md#managing-project-keys).
>
> **2026-04-04**
>
> * Refreshed dashboard aesthetic and added **multi-org support** with team management.
>
> **2026-02-24**
>
> * Billing UI updates.
>
> **2026-02-23**
>
> * Self-service **password and profile updates** from account settings.

> [tab] API
>
> **2026-11-06**
>
> **Changed**
>
> * **Moss Inference** searches only the indexes a call names, in `X-Moss-Indexes` or `indexes` in the Moss SDKs. A call that names no index is plain inference, with no search and no retrieval fee. It used to search every index of the project. See [Ground answers in your indexes](https://docs.moss.dev/docs/inference/retrieval.md).
>
> **2026-10-21**
>
> **Added**
>
> * **Moss Inference**: `POST https://inference.moss.dev/v1/chat/completions` takes an OpenAI chat completion request with `Authorization: Bearer <project_id>:<project_key>`, searches the project's indexes, adds the hits to the prompt, and answers in OpenAI's shape, so any OpenAI client works by changing the base URL and the key. `model` is `moss` (the default) or an OpenAI, Anthropic, or Google model name with your own key in `X-Moss-Provider-Key`. Headers, limits, errors, and billing are on the [Chat Completions](https://docs.moss.dev/docs/api-reference/v1/inference/chat-completions.md) page.
>
> **2026-10-14**
>
> **Changed**
>
> * Parsed PDF and DOCX files are split into chunks that end at sentence boundaries, and each chunk starts with the document's title and nearest section heading. Image descriptions are no longer indexed.
> * `parseOptions` takes `chunkSize` (200 to 2000 characters, default 1200) and `chunkOverlap` (default 200, at most half of `chunkSize`). See [Index from Files](https://docs.moss.dev/docs/reference/js/files.md).
> * Only files parsed from now on are affected.
>
> **2026-09-13**
>
> * **Several web sources per index**: `createWebSource` now adds a site to an existing index instead of refusing it (up to 20 per index, each root URL once). Each source's pages are tracked separately: a crawl replaces only its own pages, and `deleteWebSource` removes the source's pages through a purge job (`purgeJobId` in the response) while the index and its other content stay.
> * `updateWebSource` accepts every crawl setting (`rootUrl`, `maxPages`, `maxDocuments`, `maxDepth`, `includePaths`, `excludePaths`, `respectRobots`, `parseDocuments`) as well as `refreshCadence`, plus `resync: true` to crawl right after saving.
> * `listWebSources` accepts an optional `indexName` filter.
> * A crawl requested while another crawl or build runs on the same index is queued (`getJobStatus` reports `queued`) instead of failing with `409`.
> * Unchanged pages are no longer re-embedded on refresh, and page boilerplate (navigation, footers, cookie banners, skip links) is stripped before indexing.
>
> **2026-09-01**
>
> * **Web sources**: crawl a website into an index via new `/v1/manage` actions (`createWebSource`, `listWebSources`, `getWebSource`, `resyncWebSource`, `updateWebSource`, `deleteWebSource`), with optional daily or weekly refresh schedules and linked PDF/DOCX parsing. See [Create Web Source](https://docs.moss.dev/docs/api-reference/v1/web-sources/createWebSource.md).

## Packages covered

Each entry in the **All** tab is labelled with one of these tags. Dates are the release dates recorded in each package changelog.

| Tag | Package | Latest entry |
| - | - | - |
| Python SDK | `moss` on PyPI | v1.20.0 (2026-10-22) |
| JavaScript SDK | `@moss-js/moss` on npm | v1.20.0 (2026-10-22) |
| Browser SDK | `@moss-dev/moss-web` on npm | v1.6.0 (2026-10-22) |
| Swift SDK | SwiftPM tag on `usemoss/moss` | v0.11.0 (2026-10-22) |
| Android SDK | AAR GitHub release on `usemoss/moss` | v0.27.0 (2026-10-22) |
| Elixir SDK | `moss` on Hex | v1.9.0 (2026-10-22) |
| C SDK | `libmoss` GitHub release on `usemoss/moss` | v0.27.0 (2026-10-22) |
| CLI | `moss-cli` on PyPI | v0.2.1 (2026-10-20) |
| MCP Server | `@moss-tools/mcp-server` on npm | v1.0.0-beta.4 (2026-10-05) |
| moss-agent | `moss-agent` on PyPI | v2.0.1 (2026-10-19) |
| Voice Agent Manager | `moss-voice-agent-manager` on PyPI | v1.0.0-beta.15 (2026-07-08) |
| Voice Server | `@moss-tools/voice-server` on npm | v1.0.0-beta.3 (2026-02-21) |
| Founding Agent | `@moss-js/founding-agent` on npm | v2.2.1 (2026-09-15) |
| Pipecat | `pipecat-moss` on PyPI | v0.0.5 (2026-07-14) |
| TEN | `ten-moss` on PyPI | v0.1.0 (2026-07-21) |
| ElevenLabs | `elevenlabs-moss` on PyPI | v0.0.1 (2026-03-30) |
| VitePress | `vitepress-plugin-moss` on npm | v1.0.0-beta.2 (2026-04-28) |
| md-indexer | `@moss-tools/md-indexer` on npm | v1.0.0-beta.3 (2026-02-18) |
| VS Code | Moss for VS Code (Marketplace) | v0.1.0 (2026-07-10) |
| Portal | [portal.usemoss.dev](https://portal.usemoss.dev) | 2026-10-16 |
| API | [REST API v1](https://docs.moss.dev/docs/api-reference/v1/getting-started/introduction.md) | 2026-10-21 |
