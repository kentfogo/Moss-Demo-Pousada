<!-- Source: https://docs.moss.dev/docs/inference/bring-your-own-key.md -->
# Bring your own key

> Run vendor models on your own OpenAI, Anthropic or Google key, with the same search of your indexes.

Send your OpenAI, Anthropic or Google key with a call, and the call runs on your vendor account. Moss still searches your indexes and adds the hits to the prompt.

## Send your key

Put the key in the `X-Moss-Provider-Key` header. In the SDKs, pass it as `api_key` in Python or `apiKey` in JavaScript, and the SDK sends the header for you. These examples read an OpenAI key from `OPENAI_API_KEY`.

```bash curl theme={null}
curl https://inference.moss.dev/v1/responses \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Moss-Indexes: faq" \
  -H "X-Moss-Provider-Key: $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-6-luna",
    "instructions": "You are the support agent for Acme.",
    "input": "Do you ship to Canada?"
  }'
```

```python Python theme={null}
import asyncio
import os

from moss import MossInference

client = MossInference(
    os.environ["MOSS_PROJECT_ID"],
    os.environ["MOSS_PROJECT_KEY"],
    api_key=os.environ["OPENAI_API_KEY"],
)


async def main():
    response = await client.responses.create(
        model="gpt-6-luna",
        instructions="You are the support agent for Acme.",
        input="Do you ship to Canada?",
        indexes=["faq"],
    )
    print(response.output_text)


asyncio.run(main())
```

```typescript JavaScript theme={null}
import { MossInference } from '@moss-js/moss'

const client = new MossInference(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!, {
  apiKey: process.env.OPENAI_API_KEY,
})
const response = await client.responses.create({
  model: 'gpt-6-luna',
  instructions: 'You are the support agent for Acme.',
  input: 'Do you ship to Canada?',
  indexes: ['faq'],
})
console.log(response.output_text)
```

```python OpenAI client theme={null}
import os

from openai import OpenAI

client = OpenAI(
    base_url="https://inference.moss.dev/v1",
    api_key=f"{os.environ['MOSS_PROJECT_ID']}:{os.environ['MOSS_PROJECT_KEY']}",
    default_headers={"X-Moss-Indexes": "faq", "X-Moss-Provider-Key": os.environ["OPENAI_API_KEY"]},
)
response = client.responses.create(
    model="gpt-6-luna",
    instructions="You are the support agent for Acme.",
    input="Do you ship to Canada?",
)
print(response.output_text)
```

A key on the client applies to every call. To use a key for one call, pass `api_key` to `responses.create` in Python. In JavaScript, pass `apiKey` in the second argument of `responses.create`. In JavaScript, a request field named `apiKey` or `api_key` throws, so keep the key out of the first argument.

Moss sends the key only to that vendor and never stores it. The SDKs send it as a header, never in the body. The reply's `model` is the name you sent.

## Which names work

With your key, `model` takes a listed id or the vendor's own model name.

| You send | Runs on |
| - | - |
| A listed OpenAI, Anthropic or Google id, such as `openai/gpt-6-luna` | That model, on your key |
| `gpt-*`, `chatgpt-*`, or `o1` to `o9` | OpenAI |
| `claude-*` | Anthropic |
| `gemini-*` | Google |

For example, `gpt-6-luna` goes to OpenAI and `claude-haiku-5-5` goes to Anthropic. [Models](https://docs.moss.dev/docs/inference/models.md) lists the ids.

A vendor's own name works only with your key. Without the key, the call returns `400` with `code` `missing_provider_key`.

## Use the vendor's own fields

The request reaches the vendor as you sent it, so it takes that vendor's own fields. Moss does not hold it to the [parameters refused on the Moss key](https://docs.moss.dev/docs/inference/models.md#parameters-refused-on-the-moss-key). The vendor decides what it accepts.

On your key, a prompt can hold up to 200,000 tokens. [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#limits) has the other limits.

## Handle vendor errors

A wrong or refused key gets the vendor's own error and status. The error has `type` `model_error` and `code` `upstream_error`. Its message starts with `The model rejected the prompt`, followed by the vendor's message.

A bad key is `401` from OpenAI and Anthropic, and `400` from Google. Moss never retries the call on the Moss key, so fix the key and send the call again.

## Know who bills what

| Cost | Billed by |
| - | - |
| Tokens | Your vendor account |
| Retrievals | Moss, from your credits, at \$0.50 / 1k retrievals |

Moss bills one retrieval for each search of your indexes, on any model: the `X-Moss-Indexes` search before the model, and each `moss_search` call. A call that searches no index has no retrieval fee. [Pricing](https://docs.moss.dev/docs/inference/pricing.md#retrievals) has the details.
