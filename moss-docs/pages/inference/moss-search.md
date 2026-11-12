<!-- Source: https://docs.moss.dev/docs/inference/moss-search.md -->
# Moss search tool

> Give the model a moss_search tool, and Moss searches your project's indexes each time the model asks.

A `tools` entry of type `moss_search` gives the model a `moss_search(query)` tool. Moss runs each search on your project's indexes and returns the passages to the model. Your code does not run it.

[Retrieval](https://docs.moss.dev/docs/inference/retrieval.md) with `X-Moss-Indexes` searches once, before the model runs, with the user's message as the query. `moss_search` searches when the model asks, with the model's query. You can use both.

## Add the tool

```json theme={null}
{
  "type": "moss_search",
  "indexes": ["docs", "faq"],
  "top_k": 5
}
```

| Field | Required | Notes |
| - | - | - |
| `type` | yes | `moss_search` |
| `indexes` | yes | 1 to 32 index names in your project. A name outside the project returns `403` before the model runs. |
| `top_k` | no | Passages for each search, 1 to 20. The default is 5. |
| `description` | no | The tool description the model reads, up to 1000 characters. Use it to say what the indexes hold. |

One `moss_search` entry per request. An unknown field returns `400`. So does a function tool of your own named `moss_search`.

## Run a request with the tool

```bash curl theme={null}
curl -N https://inference.moss.dev/v1/chat/completions \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "moss/fastlane-1",
    "stream": true,
    "messages": [
      {"role": "system", "content": "You are the support agent for Acme."},
      {"role": "user", "content": "How much is the Pro plan, and does it work offline?"}
    ],
    "tools": [{
      "type": "moss_search",
      "indexes": ["docs"],
      "description": "Search the Acme product docs and pricing pages."
    }]
  }'
```

The same entry works in `tools` on [`/v1/responses`](https://docs.moss.dev/docs/api-reference/v1/inference/responses).

To make the model search first, set `tool_choice`. On Chat Completions, send `{"type": "function", "function": {"name": "moss_search"}}`. On Responses, send `{"type": "function", "name": "moss_search"}` or `{"type": "mcp", "server_label": "moss", "name": "moss_search"}`.

`moss_search` does not need `X-Moss-Indexes`. `X-Moss-Retrieve: off` and `X-Moss-Retrieve-Ms` apply only to the search before the model. They do not turn off or time `moss_search`.

## What the model gets back

Each call searches every named index and returns the best passages, numbered, best first, marked as data, not instructions. A query is cut at 2000 characters.

A failed search, an empty query or a timeout goes back to the model as the tool result, and the request goes on.

## Tool steps

Each search is a tool step, the same as an MCP call, with `server_label` `moss` and `name` `moss_search`.

* On Chat Completions, a stream carries a `moss_tool_step` chunk before and after each search. A reply without `stream` lists the steps in `moss_tool_steps`. See [Read steps on Chat Completions](https://docs.moss.dev/docs/inference/mcp-servers.md#read-steps-on-chat-completions).
* On Responses, each search is an `mcp_call` output item, with the `response.mcp_call.*` events in [Read steps on Responses](https://docs.moss.dev/docs/inference/mcp-servers.md#read-steps-on-responses). There is no `moss_tool_step` chunk.

On Responses, send the `mcp_call` items back in `input` unchanged. The model sees the earlier searches and does not run them again. Chat Completions does not add searches to the message history.

## Limits and errors

The tool loop and its errors are the same as for [MCP servers](https://docs.moss.dev/docs/inference/mcp-servers.md#errors), including `mcp_loops_busy` and `failed_after_tool_call`.

| Limit | Value |
| - | - |
| Tool rounds per request | 10 |
| Tool calls per round | 8. A ninth call does not run, and the model reads an error. |
| Time for one search | 30 s |
| Time for all tool rounds | 150 s |
| Time for the whole turn | 180 s |
| Text of one search result | up to 8,000 characters. Whole passages go in, best first. A last line says how many passages did not fit. |

Beside `moss_search`, an MCP server with `server_label` `moss` returns `400`.

A streamed reply has the header `x-should-retry: false`, so a client does not replay it. So does every reply on Responses. On Chat Completions, a reply without `stream` has it only when it fails after a tool step.

`moss_search`, MCP servers and your own [function tools](https://docs.moss.dev/docs/inference/tool-calling.md) can share a request. When the model calls one of your functions, the loop ends and returns the call to your code. If the same round also calls `moss_search`, that search does not run.

## Billing

Each `moss_search` call that an index answered is one retrieval, however many indexes it names. A tool over `faq` and `policies` called twice is two retrievals. A failed search or an empty query is not billed. `X-Moss-Retrieve: off` does not change this. [Pricing](https://docs.moss.dev/docs/inference/pricing.md#retrievals) has the price of a retrieval.
