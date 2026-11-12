<!-- Source: https://docs.moss.dev/docs/inference/errors-and-limits.md -->
# Errors and limits

> Rate and size limits, every error status and code, and when to retry.

Every limit, error status and error code of Moss Inference, with what to do about each. Responses and Chat Completions share them.

## Limits

Limits apply per project.

| Limit | `moss/fastlane-1` | Vendor model |
| - | - | - |
| Requests per minute (sustained / burst) | 120 / 10 | 300 / 50 |
| Input tokens per minute | 600,000 | None |
| Prompt tokens per request | 262,144 | 128,000 on the Moss key, 200,000 on your key |
| Indexes per request | 32 | 32 |
| Request body | 4 MB | 4 MB |

On `moss/fastlane-1`, the 262,144 tokens are the whole context. The prompt, the retrieved facts and the reply share them.

On the Moss key, `anthropic/claude-haiku-5.5` takes up to 64,000 prompt tokens. [Models](https://docs.moss.dev/docs/inference/models.md) lists the prompt limit of every model.

One request searches at most 32 indexes, named in `X-Moss-Indexes` and in a [`moss_search`](https://docs.moss.dev/docs/inference/moss-search) tool together.

MCP servers and the [`moss_search`](https://docs.moss.dev/docs/inference/moss-search) tool add limits of their own. A request with too many servers or tools returns `400`. Too many requests with these tools at once return `429` with `code` `mcp_loops_busy`. A request with these tools can run for a few minutes.

To raise a limit for your project, ask through [Support](https://docs.moss.dev/docs/start/support).

### Rate limit headers

These headers show how much of the project's limits is left.

| Header | Value |
| - | - |
| `x-ratelimit-limit-requests`, `x-ratelimit-limit-tokens` | The limit |
| `x-ratelimit-remaining-requests`, `x-ratelimit-remaining-tokens` | What is left of it |
| `x-ratelimit-reset-requests`, `x-ratelimit-reset-tokens` | When it resets |

The `tokens` headers come on `moss/fastlane-1` only.

## Errors

Every error has OpenAI's shape: an `error` object with `message`, `type` and `code`.

```json 429 Too Many Requests theme={null}
{
  "error": {
    "message": "Rate limit reached for project 1a2b3c: too many requests per minute. Please try again in 1s.",
    "type": "requests",
    "code": "rate_limit_exceeded"
  }
}
```

| Status | `type` | `code` | Cause | What to do |
| - | - | - | - | - |
| `400` | `invalid_request_error` | | A malformed body, more than 32 index names, or a bad `tools` entry | Fix the request. |
| `400` | `invalid_request_error` | `context_length_exceeded` | A prompt over the model's [limit](#limits) | Shorten the prompt. On `moss/fastlane-1`, leave room for the reply. |
| `400` | `invalid_request_error` | `model_not_enabled` | A listed model, on the Moss key, that is not served right now | Send `moss/fastlane-1`, or the model on your own key. |
| `400` | `invalid_request_error` | `missing_provider_key` | A vendor's own model name, such as `gpt-6-luna`, without your key | Send your key. See [Bring your own key](https://docs.moss.dev/docs/inference/bring-your-own-key.md). |
| `400` | `invalid_request_error` | `model_not_found` | A model name Moss does not serve | Pick an id from [Models](https://docs.moss.dev/docs/inference/models.md). |
| `400` | `invalid_request_error` | `unsupported_parameter` | A field or message part the model does not take on the Moss key | Remove it, or use your own key. See [Models](https://docs.moss.dev/docs/inference/models.md#parameters-refused-on-the-moss-key). |
| `400` | `model_error` | | The model rejected the prompt | Change the prompt. |
| `400` | `mcp_error` | `mcp_server_error` | `server_url` is not a public `https` URL on port 443 | Use a public `https` URL on port 443. |
| `401` | `authentication_error` | | A missing or wrong `Authorization` token | Send `Authorization: Bearer <project_id>:<project_key>`. |
| `403` | `permission_error` | | `X-Moss-Indexes` or a `moss_search` entry names an index outside this project | Name only this project's indexes. |
| `413` | `invalid_request_error` | | A body over 4 MB | Send a smaller body. |
| `424` | `mcp_error` | `mcp_server_error` | The MCP server did not connect, refused the credentials, or failed to list its tools | Check `server_url` and `headers`. |
| `424` | | `failed_after_tool_call` | A failure after an MCP tool or `moss_search` ran. An MCP tool may have changed data | Do not replay it. See [MCP servers](https://docs.moss.dev/docs/inference/mcp-servers.md#errors). |
| `429` | `requests`, `tokens` | `rate_limit_exceeded` | Over a per-minute [limit](#limits) | Wait for `Retry-After`, then retry. |
| `429` | `usage_limit` | `usage_limit_exceeded` | Your credits ran out, so usage is paused | Add credits. See [Pricing](https://docs.moss.dev/docs/inference/pricing.md#credits). |
| `429` | `capacity` | `mcp_loops_busy` | Too many requests with MCP servers or `moss_search` at once | Wait for `Retry-After`, then retry. |
| Vendor `4xx` | `model_error` | `upstream_error` | The vendor refused a call on your own key, with its own status | Read the vendor's message, which follows `The model rejected the prompt`. |
| `502` | `model_error` | | The model failed, or a vendor returned `5xx` | Retry with backoff. |
| `503` | `server_error` | | Moss could not check the project | Retry with backoff. |
| `503` | `server_error` | `project_settings_unavailable` | Moss could not read the project's [system prompt](https://docs.moss.dev/docs/api-reference/v1/inference/chat-completions.md#system-prompt), so it did not answer without it | Wait the 2 seconds of `Retry-After`, then retry. |
| `503` | `server_error` | `billing_unavailable` | Moss cannot meter a call on the Moss key right now | Wait the 5 seconds of `Retry-After`, or send `moss/fastlane-1`. |
| `503` | `capacity` | `server_overloaded` | Moss is at capacity, or the vendor rate limited the Moss key | Wait for `Retry-After`, then retry. |
| `503` | `capacity` | `vendor_unavailable` | The vendor refused or could not serve a call on the Moss key, such as on Anthropic's `529` overload | Wait for `Retry-After`, then retry. |

On your own key, a bad key returns the vendor's status: `401` from OpenAI and Anthropic, `400` from Google.

### Errors after a stream starts

A failure after a stream starts arrives as a stream event. On Responses, the stream ends with `response.failed`, whose `response.error` has `type`, `code` and `message`. On Chat Completions, a last `data:` frame carries `error` in place of `choices`, then `data: [DONE]` follows. Without `stream`, the same failure returns `502`, or `424` once an MCP call or a `moss_search` call ran. [Streaming](https://docs.moss.dev/docs/inference/streaming.md#errors-after-the-stream-starts) shows both stream forms.

## Retry rules

The Moss SDKs retry on their own, 2 times by default. They retry a connection failure, or a `408`, `409`, `429` or `5xx`, before the response starts. Each retry waits for `Retry-After` when it is 60 seconds or less, and backs off otherwise. In the Moss SDKs, `x-should-retry: false` stops a retry, and `x-should-retry: true` forces one. They never retry a stream that has started. The OpenAI SDKs retry on their own as well. If you call the endpoint directly, follow the same rules.

Fix a `400`, `401`, `403` or `413` before you send the request again.

**Never replay a request that failed with `failed_after_tool_call`.** An MCP tool or `moss_search` already ran, and an MCP tool may have changed data. The `424` carries `x-should-retry: false`, so the SDKs do not retry it either.

Every response carries `X-Moss-Request-Id`, a refused one included. Include it when you report a problem. Each SDK exposes it as the request id of the response and of the error.

## SDK errors

Each Moss SDK has one error for a failed call.

| SDK | Error |
| - | - |
| [Python](https://docs.moss.dev/docs/inference/sdks/python.md#errors) | `moss.inference.InferenceError` |
| [JavaScript](https://docs.moss.dev/docs/inference/sdks/javascript.md#errors) | `InferenceError` |
| [Browser](https://docs.moss.dev/docs/inference/sdks/browser.md#errors) | `InferenceError` |
| [Swift](https://docs.moss.dev/docs/inference/sdks/swift.md#errors) | `InferenceError` |
| [Android](https://docs.moss.dev/docs/inference/sdks/android.md#errors) | `InferenceError` |
| [Elixir](https://docs.moss.dev/docs/inference/sdks/elixir.md#errors) | `Moss.Inference.Error` |
| [C](https://docs.moss.dev/docs/inference/sdks/c.md#errors) | A negative `MossResult`, with the fields in `moss_last_error_detail()` |

The error holds the `status`, `type` and `code` from the [Errors](#errors) table. It also holds the request id and the `Retry-After` wait. JavaScript and the browser name the code `errorCode`.

The SDK sets five types itself, with no `status`:

| `type` | Cause |
| - | - |
| `invalid_request_error` | An argument the SDK rejects before sending, such as an empty key or an index name with a comma |
| `connection_error` | Moss Inference could not be reached, or the connection broke |
| `timeout` | A time limit ran out, such as the call's timeout or idle timeout |
| `incomplete_stream` | The stream ended before `response.completed` or `response.incomplete` |
| `server_error` | The stream sent an event over 1 MiB, or one that is not a JSON object |

Android throws `IllegalArgumentException` in place of `invalid_request_error`. In C, a rejected argument returns `ERR_NULL_POINTER` or `ERR_INVALID_ARG`, with a `NULL` detail.
