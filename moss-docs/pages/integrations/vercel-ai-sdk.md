<!-- Source: https://docs.moss.dev/docs/integrations/vercel-ai-sdk.md -->
# Vercel AI SDK

> Give AI agents semantic search capabilities using Moss tools for the Vercel AI SDK.

Integrate Moss semantic search into [Vercel AI SDK](https://sdk.vercel.ai/) agents using the `@moss-tools/vercel-sdk` package. This setup exposes Moss operations as AI SDK tools, so language models can search, create indexes, and manage documents as part of agentic workflows.

> **Note:** For the full package source and tests, see the [vercel-sdk package](https://github.com/usemoss/moss/tree/main/packages/vercel-sdk).

## Why use Moss with the Vercel AI SDK?

The Vercel AI SDK's tool system lets language models call external functions during generation. Moss tools give your agents direct access to a semantic knowledge base with sub-10ms retrieval, enabling RAG workflows and knowledge base operations within a single `generateText` or `streamText` call.

## Required tools

* [Moss](https://www.moss.dev/) account with project credentials
* [Node.js](https://nodejs.org/) 20.4+

## Integration guide

**1. Installation**

```bash theme={null}
npm install @moss-tools/vercel-sdk @moss-js/moss ai zod
```

> [!NOTE]
>
> Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to 1.9.0+ before then.

**2. Environment setup**

```bash .env.local theme={null}
MOSS_PROJECT_ID=your_project_id
MOSS_PROJECT_KEY=your_project_key
OPENAI_API_KEY=sk-...
```

**3. Create tools and use with an agent**

Import the tool factories and initialize them with a Moss client. Each factory returns a standard AI SDK tool with typed input/output schemas.

```typescript theme={null}
import { MossClient } from "@moss-js/moss";
import {
  mossSearchTool,
  mossAddDocsTool,
  mossDeleteDocsTool,
  mossCreateIndexTool,
  mossListIndexesTool,
} from "@moss-tools/vercel-sdk";
import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";

const client = new MossClient(
  process.env.MOSS_PROJECT_ID!,
  process.env.MOSS_PROJECT_KEY!,
);

// Prebind tools to a specific index for simpler schemas
const tools = {
  search: mossSearchTool({ client, indexName: "docs" }),
  addDocs: mossAddDocsTool({ client, indexName: "docs" }),
  deleteDocs: mossDeleteDocsTool({ client, indexName: "docs" }),
  createIndex: mossCreateIndexTool({ client }),
  listIndexes: mossListIndexesTool({ client }),
};

const result = await generateText({
  model: openai("gpt-4o"),
  tools,
  stopWhen: stepCountIs(5),
  prompt: "Search the docs index for return policy info and summarize it.",
});
```

## Moss Inference as the model

Instead of giving the model a search tool, point the AI SDK's OpenAI provider at Moss Inference.
Moss searches your indexes on every call and adds the hits to the prompt, so `streamText` and
`generateText` need no tools for retrieval. Use `.chat()`, which calls
[Chat Completions](https://docs.moss.dev/docs/api-reference/v1/inference/chat-completions.md). See
[OpenAI compatibility](https://docs.moss.dev/docs/inference/openai-compatibility.md) for the base URL, the key and the Moss headers.

```bash theme={null}
npm install @ai-sdk/openai ai
```

```typescript theme={null}
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const moss = createOpenAI({
  baseURL: "https://inference.moss.dev/v1",
  apiKey: `${process.env.MOSS_PROJECT_ID}:${process.env.MOSS_PROJECT_KEY}`,
  headers: { "X-Moss-Indexes": "docs" },
});

const result = streamText({
  model: moss.chat("moss/fastlane-1"),
  prompt: "What is the return policy?",
});
for await (const text of result.textStream) process.stdout.write(text);
```

`model: "moss/fastlane-1"` runs on Moss GPUs and is billed per token, plus a retrieval fee on each request that searches your indexes
(see [Inference pricing](https://docs.moss.dev/docs/inference/pricing.md)). A listed `vendor/model` id, such as `openai/gpt-6-luna`,
also runs on the Moss key and bills your credits (see [routes](https://docs.moss.dev/docs/inference/models.md#routes)).
A vendor model (`gpt-*`, `claude-*`, `gemini-*`) also works with your own key in an
`X-Moss-Provider-Key` header. The vendor then bills those tokens, and Moss bills only the retrieval fee. Both patterns can be combined: the mutating tools above keep the
index current while Moss answers from it.

## Available tools

### Read-only

| Tool | Description |
| :- | :- |
| `mossSearchTool` | Semantic search over an index. Returns matching documents ranked by similarity. |
| `mossListIndexesTool` | List all available indexes in the Moss project. |

### Mutating (requires approval)

Mutating tools have `needsApproval: true`, so the AI SDK prompts for user confirmation before execution.

| Tool | Description |
| :- | :- |
| `mossAddDocsTool` | Add documents to an existing index. Supports upsert by document ID. |
| `mossDeleteDocsTool` | Delete documents from an index by their IDs. |
| `mossCreateIndexTool` | Create a new index with initial documents. |

## Configuration

### Index binding

Tools accept an optional `indexName` parameter. When provided, the tool is prebound to that index and the LLM only needs to provide the query or document data. When omitted, the LLM chooses the index name dynamically.

```typescript theme={null}
// Prebound: simpler schema, LLM only provides query
const search = mossSearchTool({ client, indexName: "docs" });

// Dynamic: LLM chooses the index
const search = mossSearchTool({ client });
```

### mossSearchTool options

| Parameter | Type | Default | Description |
| :- | :- | :- | :- |
| `client` | `MossClient` | Required | An initialized Moss client instance. |
| `indexName` | `string` | `undefined` | Prebind to a specific index. |
| `description` | `string` | Auto-generated | Custom tool description for the LLM. |
