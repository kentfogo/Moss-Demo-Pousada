<!-- Source: https://docs.moss.dev/docs/build/agent-context.md -->
# Agent Context

> Persist and recall agent context as documents in a Moss index.

Persist agent context as documents in a Moss index. On each turn the agent queries the
index for relevant context, grounds its response in the results, then writes new context
back with `addDocs`. The pattern is: store documents, query per turn, write new context back.

Two kinds of context live in the same index and surface through the same semantic query:

* **Working context** - unstructured insights drawn from conversations: preferences, tone,
  recurring topics, and decisions. Updated after each interaction.
* **Durable context** - stable facts about the user: profile, account tier, identifiers,
  long-standing preferences. Changes rarely.

## Capture and recall loop

![An agent recalls relevant context for a user turn, grounds the LLM response, then captures the turn back into context](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/agent-context-light.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=a0b247fe2cbd8af32b09d232fb365bc8)

![An agent recalls relevant context for a user turn, grounds the LLM response, then captures the turn back into context](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/agent-context-dark.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=eed1944cdc5569f1bfe7163c1e861ecf)

On each turn the agent queries the index for the most relevant context, grounds its
response in it, then writes new context back with `addDocs`. Subsequent turns query the
updated index.

## Example (JavaScript)

```ts theme={null}
import { MossClient } from '@moss-js/moss'
const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

const index = 'agent-context'
await client.createIndex(index, [
  { id: 'user_profile', text: 'User prefers concise answers.' }
], { modelId: 'moss-minilm' })

// Load before querying.
await client.loadIndex(index)

// Recall: pull relevant context for this turn.
const context = await client.query(index, 'preferences for responses', { topK: 3 })

// Capture: write new insights back so the next turn can use them.
await client.addDocs(index, [
  { id: 'pref_format', text: 'User asked for bullet-point summaries.' }
], { upsert: true })
```

## Related

> [card] [Live-call context](https://docs.moss.dev/docs/build/live-call-context.md)
>
> Short-term + long-term context during a call.

> [card] [Cross-agent handoff](https://docs.moss.dev/docs/build/cross-agent-handoff.md)
>
> Carry context across agents and channels.
