<!-- Source: https://docs.moss.dev/docs/integrations/strands-agents.md -->
# Strands Agents

> Give Strands Agents sub-10ms semantic retrieval from a Moss knowledge base.

Integrate Moss into [Strands Agents](https://strandsagents.com) as a search tool. The agent calls `moss_search` automatically when it needs to look something up — no retrieval glue code required.

> **Note:** For a complete example, see the [Strands Agents cookbook](https://github.com/usemoss/moss/tree/main/packages/strands-agents-moss/examples).

## Why use Moss with Strands Agents?

Strands Agents exposes tools as first-class primitives. `MossSearchTool` wraps a Moss index as a Strands-compatible tool, so the agent decides when to retrieve — and gets answers back in under 10 ms.

## Required tools

* [Moss](https://www.moss.dev/) account with project credentials
* Python 3.10+
* **Model provider credentials** — Strands Agents defaults to [Amazon Bedrock](https://aws.amazon.com/bedrock/). Configure `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION`, or pass a different model provider (see below).

## Integration guide

**1. Installation**

```bash theme={null}
pip install strands-agents-moss
```

**2. Environment setup**

```bash theme={null}
export MOSS_PROJECT_ID=your_project_id
export MOSS_PROJECT_KEY=your_project_key
```

**3. Create an agent with Moss search**

```python theme={null}
import asyncio
import os
from strands import Agent
from strands_agents_moss import MossSearchTool

async def main():
    moss = MossSearchTool(
        project_id=os.getenv("MOSS_PROJECT_ID"),
        project_key=os.getenv("MOSS_PROJECT_KEY"),
        index_name="my-index",
    )
    await moss.load_index()

    agent = Agent(tools=[moss.tool])
    agent("What is your refund policy?")

asyncio.run(main())
```

## Choosing a model provider

Strands defaults to Amazon Bedrock. To use a different provider, pass a `model` argument:

```python theme={null}
# Assumes you already created moss = MossSearchTool(...) and awaited moss.load_index()

# OpenAI
from strands.models.openai import OpenAIModel
agent = Agent(model=OpenAIModel("gpt-4o"), tools=[moss.tool])

# Anthropic
from strands.models.anthropic import AnthropicModel
agent = Agent(model=AnthropicModel("claude-sonnet-4-20250514"), tools=[moss.tool])
```

See the [Strands model providers docs](https://strandsagents.com/docs/user-guide/concepts/model-providers/) for all supported providers.

## Multi-agent example

Moss tools compose with Strands' agents-as-tools pattern:

```python theme={null}
import asyncio
from strands import Agent
from strands_agents_moss import MossSearchTool

async def main():
    moss = MossSearchTool(index_name="product-docs")
    await moss.load_index()

    researcher = Agent(
        system_prompt="You are a research assistant. Use moss_search to find information.",
        tools=[moss.tool],
    )

    orchestrator = Agent(
        system_prompt="You coordinate research tasks. Delegate questions to the researcher.",
        tools=[researcher.as_tool(
            name="researcher",
            description="A research assistant with access to the knowledge base",
        )],
    )

    orchestrator("Summarise our return and refund policies.")

asyncio.run(main())
```

## Configuration

### MossSearchTool

| Parameter | Default | Description |
| - | - | - |
| `project_id` | `MOSS_PROJECT_ID` env var | Moss project ID |
| `project_key` | `MOSS_PROJECT_KEY` env var | Moss project key |
| `index_name` | (required) | Name of the Moss index to query |
| `tool_name` | `moss_search` | Tool name exposed to the LLM |
| `tool_description` | *(auto-generated)* | Tool description exposed to the LLM |
| `top_k` | `5` | Number of results to retrieve per query |
| `alpha` | `0.8` | Blend: `1.0` = semantic only, `0.0` = keyword only |
| `result_prefix` | `Relevant knowledge base results:\n\n` | Prefix prepended to formatted results |

### Methods

| Method | Description |
| - | - |
| `load_index()` | Async. Pre-load the Moss index — call once at startup |
| `search(query)` | Async. Query Moss and return formatted results as a string |
| `tool` | Property. Returns the Strands-compatible tool to pass to `Agent(tools=[...])` |
