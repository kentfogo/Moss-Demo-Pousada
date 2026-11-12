<!-- Source: https://docs.moss.dev/docs/inference/models.md -->
# Models

> Every model Moss Inference serves, with its prompt limit, prices, routes and the parameters it refuses.

Every model is one id in the `model` field. Retrieval from your indexes works the same on all of them, and `GET /v1/models` lists the ones served now.

> [!NOTE]
>
> For voice agents, use `moss/fastlane-1` when the prompt and the retrieved facts fit in 262,144 tokens. For a larger context, use `anthropic/claude-haiku-5.5` or `google/gemini-3.5-flash-lite`. `google/gemini-3.8-flash` thinks before it answers, which delays the first token. Set `reasoning` to `{"effort": "none"}` to turn it off.

## Model table

Prices in USD per 1M tokens, as of 2026-11-05. A dash in Cache write means the model has no separate cache-write price.

Prompt limit is the most prompt tokens a request can send on the Moss key. With your own key, a vendor model takes prompts of up to 200,000 tokens. The other limits are on [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#limits).

### Moss

| Model | Prompt limit | Input | Cached input | Cache write | Output |
| - | - | - | - | - | - |
| Fastlane 1 `moss/fastlane-1` | 262,144 (whole context) | \$0.25 | \$0.03 | - | \$1.75 |

`moss` still works as a deprecated alias of `moss/fastlane-1`. The reply shows `moss/fastlane-1`.

### OpenAI

| Model | Prompt limit | Input | Cached input | Cache write | Output |
| - | - | - | - | - | - |
| GPT-6 Luna `openai/gpt-6-luna` | 128,000 | \$0.10 | \$0.01 | \$0.125 | \$0.50 |
| GPT-6.1 Terra `openai/gpt-6.1-terra` | 128,000 | \$1.00 | \$0.05 | \$1.25 | \$5.00 |
| GPT-6.1 Sol `openai/gpt-6.1-sol` | 128,000 | \$2.00 | \$0.10 | \$2.50 | \$10.00 |
| GPT-6 Astra `openai/gpt-6-astra` | 128,000 | \$10.00 | \$1.00 | \$12.50 | \$50.00 |

### Anthropic

| Model | Prompt limit | Input | Cached input | Cache write | Output |
| - | - | - | - | - | - |
| Claude Haiku 5.5 `anthropic/claude-haiku-5.5` | 64,000 | \$0.10 | \$0.01 | \$0.125 | \$0.50 |
| Claude Sonnet 5.5 `anthropic/claude-sonnet-5.5` | 128,000 | \$2.00 | \$0.10 | \$2.50 | \$10.00 |
| Claude Opus 5.5 `anthropic/claude-opus-5.5` | 128,000 | \$4.00 | \$0.20 | \$5.00 | \$20.00 |
| Claude Fable 5.1 `anthropic/claude-fable-5.1` | 128,000 | \$10.00 | \$0.25 | \$12.50 | \$50.00 |

### Google

| Model | Prompt limit | Input | Cached input | Cache write | Output |
| - | - | - | - | - | - |
| Gemini 3.8 Flash `google/gemini-3.8-flash` | 128,000 | \$0.75 | \$0.075 | \$0.75 | \$3.75 |
| Gemini 3.5 Flash-Lite `google/gemini-3.5-flash-lite` | 128,000 | \$0.30 | \$0.03 | \$0.30 | \$2.50 |
| Gemini 4 Argon `google/gemini-4-argon` | 128,000 | \$2.00 | \$0.10 | \$2.00 | \$10.00 |

### Open models

| Model | Prompt limit | Input | Cached input | Cache write | Output |
| - | - | - | - | - | - |
| GLM 5.3 `z-ai/glm-5.3` | 128,000 | \$0.084 | \$0.083 | - | \$1.68 |
| GLM 5.3 Flash `z-ai/glm-5.3-flash` | 128,000 | \$0.18 | \$0.036 | - | \$0.60 |
| Kimi K3 `moonshotai/kimi-k3` | 128,000 | \$0.29 | \$0.25 | - | \$12.96 |
| DeepSeek V4.1 Flash `deepseek/deepseek-v4.1-flash` | 128,000 | \$0.054 | \$0.0072 | - | \$0.60 |
| DeepSeek V4.1 Flash 1017 `deepseek/deepseek-v4.1-flash-1017` | 128,000 | \$0.18 | \$0.0036 | - | \$0.72 |
| MiniMax M3.1 Flash `minimax/minimax-m3.1-flash` | 128,000 | \$0.09 | \$0.009 | - | \$0.36 |
| Qwen3.8 Flash `qwen/qwen3.8-flash` | 128,000 | \$0.18 | \$0.019 | - | \$0.56 |

## Routes

The model you send and whether you send your own key decide where a call runs and who bills it.

| You send | Runs on | Billed to |
| - | - | - |
| `moss/fastlane-1`, or no `model` | Moss GPUs | Your credits, at the [Moss model prices](https://docs.moss.dev/docs/inference/pricing.md#the-moss-model) |
| A vendor id from the table, without your key | The vendor, on the Moss key | Your credits, at the table prices |
| Any vendor model, with your key | The vendor, on your key | Your vendor account |

Every route also bills a retrieval for each search of your indexes. See [Pricing](https://docs.moss.dev/docs/inference/pricing.md#retrievals). [Bring your own key](https://docs.moss.dev/docs/inference/bring-your-own-key.md) covers the third route.

## The Moss model

`moss/fastlane-1` is the default model. It runs on Moss GPUs and bills your credits.

* It runs on the same machines as the search of your indexes, which is the fast lane in its name. A grounded call streams its first token in under 200 ms.
* Its window is 262,144 tokens, shared by the prompt, the retrieved facts and the reply.
* A prompt that does not fit the window returns `400` with `code` `context_length_exceeded`.
* It takes text only.
* It keeps a prefix cache. A repeated system prompt or the earlier turns of a conversation bill at the cached input price.

Use it for grounded answers, tool calls and structured output.

## Parameters refused on the Moss key

On the Moss key, Moss sends a vendor only the fields that model takes. A request that sets any other field returns `400 unsupported_parameter` before the vendor is called.

A null, `false` or empty value counts as unset. So does a penalty or `top_logprobs` of 0, and a `temperature` or `top_p` of 1.

| Vendor | Fields refused on the Moss key |
| - | - |
| OpenAI | `seed`, `logit_bias`, `frequency_penalty`, `presence_penalty`, `stop`, `logprobs`, `top_logprobs` |
| Anthropic | `seed`, `logit_bias`, `frequency_penalty`, `presence_penalty`, `logprobs`, `top_logprobs`, `temperature`, `top_p`, a `text.format` or `response_format` of type `json_object` (use `json_schema`); on `claude-sonnet-5.5`, `claude-opus-5.5` and `claude-fable-5.1`, a `tool_choice` of `required` or a named tool |
| Google | `seed`, `logit_bias`, `frequency_penalty`, `presence_penalty`, `logprobs`, `top_logprobs` |
| Open models | None |

Google models on the Moss key also refuse message parts other than text and base64 data URL images. Open models refuse `file` parts.

With your own key, the request reaches the vendor as you send it. See [Bring your own key](https://docs.moss.dev/docs/inference/bring-your-own-key.md).

## List models

`GET /v1/models` returns the models served now, in OpenAI's list shape. An OpenAI client reads it with `client.models.list()`.

```bash curl theme={null}
curl https://inference.moss.dev/v1/models \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY"
```

```python OpenAI client theme={null}
import os

from openai import OpenAI

client = OpenAI(
    base_url="https://inference.moss.dev/v1",
    api_key=f"{os.environ['MOSS_PROJECT_ID']}:{os.environ['MOSS_PROJECT_KEY']}",
)
for model in client.models.list():
    print(model.id)
```

```json Response theme={null}
{
  "object": "list",
  "data": [
    {"id": "moss/fastlane-1", "object": "model", "created": 0, "owned_by": "moss"},
    {"id": "openai/gpt-6-luna", "object": "model", "created": 0, "owned_by": "moss"},
    {"id": "anthropic/claude-haiku-5.5", "object": "model", "created": 0, "owned_by": "moss"}
  ]
}
```

The [List models](https://docs.moss.dev/docs/api-reference/v1/inference/models.md) reference describes each field.

## Changes

New models and retirements appear in the [Changelog](https://docs.moss.dev/docs/changelog.md). A retired id returns `400 model_not_found`.
