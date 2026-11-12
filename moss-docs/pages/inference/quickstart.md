<!-- Source: https://docs.moss.dev/docs/inference/quickstart.md -->
# Quickstart

> Call the moss model, stream the reply, then ground it in your own index.

Six steps from a project key to a streamed reply that answers from your data. Run the steps in order, and every block runs as written once the two environment variables are set.

**1. Get your project id and key**

In the [Moss portal](https://portal.usemoss.dev), copy the project id, then open API Keys and create a key. Inference bills from credits with no included allowance, so add credits on the Billing page first (see [Pricing](https://docs.moss.dev/docs/inference/pricing.md#credits)). Export the id and key:

```bash theme={null}
export MOSS_PROJECT_ID=your_project_id
export MOSS_PROJECT_KEY=your_project_key
```

**2. Install a client**

curl needs no install until step 5, which creates the index with the Python or JavaScript SDK.

```bash Python theme={null}
pip install "moss>=1.22.0"
```

```bash JavaScript theme={null}
npm install @moss-js/moss@^1.22.0
```

```bash OpenAI client theme={null}
pip install openai
```

**3. Get a response**

```bash curl theme={null}
curl https://inference.moss.dev/v1/responses \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" \
  -H "Content-Type: application/json" \
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
)
print(response.output_text)
```

The model is `moss/fastlane-1` unless you name another. The reply is an OpenAI [Response object](https://docs.moss.dev/docs/api-reference/v1/inference/responses.md#response), and the SDKs expose its text as `output_text`. On a new project nothing is grounded yet, so the answer is generic. Step 5 fixes that.

**4. Stream it**

Add `stream: true` and read `response.output_text.delta` events as they arrive.

```bash curl theme={null}
curl -N https://inference.moss.dev/v1/responses \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "moss/fastlane-1",
    "stream": true,
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
    stream = await client.responses.create(
        instructions="You are the support agent for Acme.",
        input="Do you ship to Canada?",
        stream=True,
    )
    async with stream:
        async for event in stream:
            if event.type == "response.output_text.delta":
                print(event.delta, end="", flush=True)


asyncio.run(main())
```

```typescript JavaScript theme={null}
import { MossInference } from '@moss-js/moss'

const client = new MossInference(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
const stream = await client.responses.create({
  instructions: 'You are the support agent for Acme.',
  input: 'Do you ship to Canada?',
  stream: true,
})
for await (const event of stream) {
  if (event.type === 'response.output_text.delta') process.stdout.write(event.delta ?? '')
}
```

[Streaming](https://docs.moss.dev/docs/inference/streaming.md) lists every event and shows the Chat Completions form.

**5. Ground it in your data**

Create an index named `faq` with four documents, then name it in the call. Pick another name if `faq` is taken.

```python Python theme={null}
import asyncio
import os

from moss import DocumentInfo, MossClient, MossInference

client = MossClient(os.environ["MOSS_PROJECT_ID"], os.environ["MOSS_PROJECT_KEY"])
inference = MossInference(os.environ["MOSS_PROJECT_ID"], os.environ["MOSS_PROJECT_KEY"])

documents = [
    DocumentInfo(id="doc1", text="How do I track my order? You can track your order by logging into your account.", metadata={"category": "shipping"}),
    DocumentInfo(id="doc2", text="What is your return policy? We offer a 30-day return policy for most items.", metadata={"category": "returns"}),
    DocumentInfo(id="doc3", text="How can I change my shipping address? Contact our customer service team.", metadata={"category": "support"}),
    DocumentInfo(id="doc4", text="Do you ship to Canada? Yes, we ship to Canada and the US. Delivery takes 5 to 7 business days.", metadata={"category": "shipping"}),
]


async def main():
    await client.create_index("faq", documents, "moss-minilm")
    response = await inference.responses.create(
        instructions="You are the support agent for Acme.",
        input="Do you ship to Canada?",
        indexes=["faq"],
    )
    print(response.output_text)


asyncio.run(main())
```

```typescript JavaScript theme={null}
import { MossClient, MossInference, type DocumentInfo } from '@moss-js/moss'

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
const inference = new MossInference(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

const documents: DocumentInfo[] = [
  { id: 'doc1', text: 'How do I track my order? You can track your order by logging into your account.', metadata: { category: 'shipping' } },
  { id: 'doc2', text: 'What is your return policy? We offer a 30-day return policy for most items.', metadata: { category: 'returns' } },
  { id: 'doc3', text: 'How can I change my shipping address? Contact our customer service team.', metadata: { category: 'support' } },
  { id: 'doc4', text: 'Do you ship to Canada? Yes, we ship to Canada and the US. Delivery takes 5 to 7 business days.', metadata: { category: 'shipping' } },
]

await client.createIndex('faq', documents, { modelId: 'moss-minilm' })
const response = await inference.responses.create({
  instructions: 'You are the support agent for Acme.',
  input: 'Do you ship to Canada?',
  indexes: ['faq'],
})
console.log(response.output_text)
```

The reply should now mention delivery in 5 to 7 business days. With curl or an OpenAI client, send the header `X-Moss-Indexes: faq` instead of `indexes`. Without the header, Moss does not search before the model runs. [Ground answers in your indexes](https://docs.moss.dev/docs/inference/retrieval.md) covers the options and the cost.

**6. Pick a model**

Name any model from the [Models](https://docs.moss.dev/docs/inference/models.md) page in `model`. The search of your indexes works the same on all of them.

```bash curl theme={null}
curl https://inference.moss.dev/v1/responses \
  -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Moss-Indexes: faq" \
  -d '{
    "model": "anthropic/claude-haiku-5.5",
    "instructions": "You are the support agent for Acme.",
    "input": "Do you ship to Canada?"
  }'
```

```python Python theme={null}
import asyncio
import os

from moss import MossInference

inference = MossInference(os.environ["MOSS_PROJECT_ID"], os.environ["MOSS_PROJECT_KEY"])


async def main():
    response = await inference.responses.create(
        model="anthropic/claude-haiku-5.5",
        instructions="You are the support agent for Acme.",
        input="Do you ship to Canada?",
        indexes=["faq"],
    )
    print(response.output_text)


asyncio.run(main())
```

```typescript JavaScript theme={null}
import { MossInference } from '@moss-js/moss'

const inference = new MossInference(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
const response = await inference.responses.create({
  model: 'anthropic/claude-haiku-5.5',
  instructions: 'You are the support agent for Acme.',
  input: 'Do you ship to Canada?',
  indexes: ['faq'],
})
console.log(response.output_text)
```

## Next steps

> [card] [Models](https://docs.moss.dev/docs/inference/models.md)
>
> Prompt limits, prices and notes for every model.

> [card] [Streaming](https://docs.moss.dev/docs/inference/streaming.md)
>
> Every event, stopping early, errors mid-stream.

> [card] [Tool calling](https://docs.moss.dev/docs/inference/tool-calling.md)
>
> Function tools, the loop, structured output.

> [card] [SDKs](https://docs.moss.dev/docs/inference/sdks.md)
>
> Python, JavaScript, Swift, Android, Elixir, browser and C.

> [card] [Pricing](https://docs.moss.dev/docs/inference/pricing.md)
>
> Credits, tokens, caching and retrievals.

> [card] [Errors and limits](https://docs.moss.dev/docs/inference/errors-and-limits.md)
>
> Every status and code, limits, retries.

> [card] [Ground answers in your indexes](https://docs.moss.dev/docs/inference/retrieval.md)
>
> Choose indexes, turn retrieval off, what it costs.
