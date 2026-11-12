<!-- Source: https://docs.moss.dev/docs/api-reference/v1/inference/models.md -->
# List models

> Reference for GET /v1/models, which lists every model Moss Inference serves now.

`GET /v1/models` lists every model Moss Inference serves now. It answers in OpenAI's [list shape](https://platform.openai.com/docs/api-reference/models/list), so `client.models.list()` in an OpenAI client reads it.

## List models

```text theme={null}
GET https://inference.moss.dev/v1/models
Authorization: Bearer <project_id>:<project_key>
```

The bearer token is your project id and key, the same as on [Chat Completions](https://docs.moss.dev/docs/api-reference/v1/inference/chat-completions.md#authentication). The request has no body.

## Response

```json 200 - OK theme={null}
{
  "object": "list",
  "data": [
    {"id": "moss/fastlane-1", "object": "model", "created": 0, "owned_by": "moss"},
    {"id": "openai/gpt-6-luna", "object": "model", "created": 0, "owned_by": "moss"},
    {"id": "anthropic/claude-haiku-5.5", "object": "model", "created": 0, "owned_by": "moss"}
  ]
}
```

`data` holds one entry per model:

| Field | Meaning |
| - | - |
| `id` | The name to send in `model`. |
| `object` | Always `model`. |
| `created` | A Unix timestamp in OpenAI's shape, sent as `0`. |
| `owned_by` | `moss`, on vendor models too. |

Every vendor model in the list can run on the Moss key.

## Examples

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

## Model list

The [Models](https://docs.moss.dev/docs/inference/models.md) page has every model with its prompt limit, prices and notes. Call `GET /v1/models` for the list served right now.

## Your own key

Send your OpenAI, Anthropic or Google key in `X-Moss-Provider-Key`, and the call runs on your vendor account. [Bring your own key](https://docs.moss.dev/docs/inference/bring-your-own-key.md) lists the model names that work with it.

## Errors

A model you cannot use returns `400` with `code` `model_not_enabled`, `missing_provider_key`, `model_not_found` or `unsupported_parameter`. [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#errors) has the cause and the fix for each.
