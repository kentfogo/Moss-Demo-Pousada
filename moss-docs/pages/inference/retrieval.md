<!-- Source: https://docs.moss.dev/docs/inference/retrieval.md -->
# Ground answers in your indexes

> Choose the indexes Moss searches, turn the search off, and see what it costs and how long it takes.

Name an index in the call and the model answers from it. This page covers choosing indexes, turning the search off, the cost and the timing header.

On each call that names an index, Moss:

1. searches those indexes for the user's question,
2. adds the hits to the prompt,
3. sends the prompt to the model, which answers.

A call that names no index is plain inference: no search and no retrieval fee.

The search reads only the text of user messages, never images. It works the same on every model.

## Choose indexes

Name the indexes to search in `indexes` in the Moss SDKs. With curl or an OpenAI client, send the `X-Moss-Indexes` header.

```bash curl theme={null}
curl https://inference.moss.dev/v1/responses \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Moss-Indexes: faq" \
  -d '{
    "model": "moss/fastlane-1",
    "instructions": "You are the support agent for Acme.",
    "input": "Do you ship to Canada?"
  }'
```

```python Python theme={null}
import asyncio
import os

from moss import MossInference

client = MossInference(os.environ["MOSS_PROJECT_ID"], os.environ["MOSS_PROJECT_KEY"])


async def main():
    response = await client.responses.create(
        instructions="You are the support agent for Acme.",
        input="Do you ship to Canada?",
        indexes=["faq"],
    )
    print(response.output_text)


asyncio.run(main())
```

```typescript JavaScript theme={null}
import { MossInference } from '@moss-js/moss'

const client = new MossInference(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
const response = await client.responses.create({
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
)
response = client.responses.create(
    model="moss/fastlane-1",
    instructions="You are the support agent for Acme.",
    input="Do you ship to Canada?",
    extra_headers={"X-Moss-Indexes": "faq"},
)
print(response.output_text)
```

Name several indexes as a list, or as a comma-separated header such as `X-Moss-Indexes: faq,policies`.

* One request searches at most 32 indexes. The names in `X-Moss-Indexes` and in a `moss_search` tool count together. More than 32 names returns `400`.
* An index outside this project returns `403`.

The full error list is in [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md#errors).

## Turn it off

To skip the search, name no index and send no [`moss_search`](https://docs.moss.dev/docs/inference/moss-search) tool. The model then answers from `input` alone.

To skip it on a call that still names indexes, set `retrieve` to `False` in Python or `false` in JavaScript, or send `X-Moss-Retrieve: off`. This does not turn off the [Moss search tool](https://docs.moss.dev/docs/inference/moss-search.md).

```bash curl theme={null}
curl https://inference.moss.dev/v1/responses \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Moss-Indexes: faq" \
  -H "X-Moss-Retrieve: off" \
  -d '{
    "model": "moss/fastlane-1",
    "instructions": "You are the support agent for Acme.",
    "input": "Do you ship to Canada?"
  }'
```

```python Python theme={null}
import asyncio
import os

from moss import MossInference

client = MossInference(os.environ["MOSS_PROJECT_ID"], os.environ["MOSS_PROJECT_KEY"])


async def main():
    response = await client.responses.create(
        instructions="You are the support agent for Acme.",
        input="Do you ship to Canada?",
        indexes=["faq"],
        retrieve=False,
    )
    print(response.output_text)


asyncio.run(main())
```

```typescript JavaScript theme={null}
import { MossInference } from '@moss-js/moss'

const client = new MossInference(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
const response = await client.responses.create({
  instructions: 'You are the support agent for Acme.',
  input: 'Do you ship to Canada?',
  indexes: ['faq'],
  retrieve: false,
})
console.log(response.output_text)
```

```python OpenAI client theme={null}
import os

from openai import OpenAI

client = OpenAI(
    base_url="https://inference.moss.dev/v1",
    api_key=f"{os.environ['MOSS_PROJECT_ID']}:{os.environ['MOSS_PROJECT_KEY']}",
)
response = client.responses.create(
    model="moss/fastlane-1",
    instructions="You are the support agent for Acme.",
    input="Do you ship to Canada?",
    extra_headers={"X-Moss-Indexes": "faq", "X-Moss-Retrieve": "off"},
)
print(response.output_text)
```

## Check what it costs

Each request that searches your indexes before the model runs is one retrieval, however many indexes it names. Each [Moss search tool](https://docs.moss.dev/docs/inference/moss-search.md#billing) call that an index answered is one more retrieval. The price is \$0.50 / 1k retrievals.

* The fee is the same on every model, and with your own vendor key.
* A request that names no index, or has the search off, has no retrieval before the model. Its `moss_search` calls still count.
* A reply-cache hit is not a retrieval.

The retrieved facts also count as input tokens. `usage.input_tokens` on Responses and `usage.prompt_tokens` on Chat Completions include them. See [Pricing](https://docs.moss.dev/docs/inference/pricing.md#retrievals).

## See how long it took

The reply header `X-Moss-Retrieve-Ms` holds how long the search took, in milliseconds. This call prints it:

```bash theme={null}
curl -s -D - -o /dev/null https://inference.moss.dev/v1/responses \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Moss-Indexes: faq" \
  -d '{"model": "moss/fastlane-1", "instructions": "You are the support agent for Acme.", "input": "Do you ship to Canada?"}' \
  | grep -i x-moss-retrieve-ms
```

## Get better answers

* Keep `instructions` short and on one job, such as "You are the support agent for Acme."
* Name only the indexes a use case needs. Hits from unrelated documents then stay out of the prompt.
* On `moss/fastlane-1`, the prompt, the retrieved facts and the reply share 262,144 tokens. Leave room for `max_output_tokens`. See [Models](https://docs.moss.dev/docs/inference/models.md#the-moss-model).
* Keep your indexes current. To create and update them, see [Indexing data](https://docs.moss.dev/docs/integrate/indexing-data.md).
