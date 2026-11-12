<!-- Source: https://docs.moss.dev/docs/integrations/mastra.md -->
# Mastra

> Use Moss semantic search tools inside Mastra agents.

Use `@moss-tools/mastra` to expose Moss as native [Mastra](https://mastra.ai) tools. The package wraps `MossClient` in `createTool()` primitives that can search or update a Moss index from a Mastra agent.

## Why use Moss with Mastra?

Mastra agents can call tools while reasoning. Moss gives those tools sub-10ms knowledge retrieval after an index is loaded locally, without running an external embedder or vector database.

## Required tools

* Moss project credentials from the [Moss Portal](https://portal.usemoss.dev)
* Node.js 20.4+
* A Mastra project

## Integration guide

**1. Install**

```bash theme={null}
npm install @moss-tools/mastra @moss-js/moss @mastra/core zod
```

> [!NOTE]
>
> Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to 1.9.0+ before then.

**2. Configure credentials**

```bash theme={null}
export MOSS_PROJECT_ID="your_project_id"
export MOSS_PROJECT_KEY="your_project_key"
```

**3. Add Moss search to a Mastra agent**

Load the Moss index once at startup, then pass `mossSearchTool()` into the agent's tools.

```ts theme={null}
import { Agent } from '@mastra/core/agent';
import { MossClient } from '@moss-js/moss';
import { mossSearchTool } from '@moss-tools/mastra';

const client = new MossClient(
  process.env.MOSS_PROJECT_ID!,
  process.env.MOSS_PROJECT_KEY!
);

await client.loadIndex('my-index');

const agent = new Agent({
  id: 'support-agent',
  name: 'Knowledge Support Copilot',
  instructions: 'Use moss_search to find relevant information before answering.',
  model: 'openai/gpt-4.1-mini',
  tools: {
    search: mossSearchTool({ client, indexName: 'my-index' }),
  },
});

const response = await agent.generate('What is your refund policy?');
console.log(response.text);
```

## Available tools

### `mossSearchTool`

Searches a Moss index and returns ranked documents.

```ts theme={null}
import { mossSearchTool } from '@moss-tools/mastra';

// Pre-bound to an index. The LLM only supplies { query }.
const searchBound = mossSearchTool({ client, indexName: 'my-index' });

// Dynamic. The LLM supplies { indexName, query }.
const searchDynamic = mossSearchTool({ client });
```

| Option | Default | Description |
| - | - | - |
| `client` | Required | `MossClient` instance |
| `indexName` | Optional | Pre-bind to an index. When omitted, the LLM supplies it |
| `topK` | `5` | Number of results to return |
| `alpha` | `0.8` | Search blend. `1.0` = semantic only, `0.0` = keyword only |
| `id` | `"moss_search"` | Mastra tool ID |
| `description` | Auto-generated | Tool description shown to the LLM |

### `mossAddDocsTool`

Adds or upserts documents into a Moss index. Use it for agents that need to remember new facts during a conversation.

```ts theme={null}
import { mossAddDocsTool } from '@moss-tools/mastra';

const addDocs = mossAddDocsTool({ client, indexName: 'support-kb' });
```

## Agent with search and memory

```ts theme={null}
const agent = new Agent({
  id: 'learning-agent',
  instructions:
    'You are a support assistant. Search the knowledge base with moss_search. ' +
    'If you learn something new that should be remembered, store it with moss_add_docs.',
  model: 'openai/gpt-4.1-mini',
  tools: {
    search: mossSearchTool({ client, indexName: 'support-kb' }),
    addDocs: mossAddDocsTool({ client, indexName: 'support-kb' }),
  },
});
```
