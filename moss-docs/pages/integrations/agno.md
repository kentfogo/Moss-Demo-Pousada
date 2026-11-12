<!-- Source: https://docs.moss.dev/docs/integrations/agno.md -->
# Agno

> Use Moss as the in-memory semantic search runtime for Agno agents.

Connect [Agno](https://docs.agno.com) agents to Moss with `agno-moss`. Moss manages embeddings internally and serves queries from an in-memory runtime, so Agno agents get fast response without running a separate embedder or vector database.

## Why use Moss with Agno?

Agno's `Knowledge` interface is the standard way to plug external knowledge into agents. Moss delivers sub-10ms semantic search that slots directly into this interface via `MossRuntime`, giving your agents fast, accurate retrieval without the latency overhead of a standalone vector database.

## Required tools

* Moss project credentials from the [Moss Portal](https://portal.usemoss.dev)
* Python 3.10+
* An Agno-compatible model provider, such as OpenAI or Anthropic

## Integration guide

**1. Install**

```bash theme={null}
pip install agno-moss
# or
uv add agno-moss
```

**2. Configure credentials**

Set your Moss credentials in the environment. `MossRuntime` reads these automatically when `project_id` and `project_key` are omitted.

```bash theme={null}
export MOSS_PROJECT_ID="your_project_id"
export MOSS_PROJECT_KEY="your_project_key"
```

**3. Create Agno knowledge backed by Moss**

Point Agno `Knowledge` at `MossRuntime`, then enable `search_knowledge` on your agent.

```python theme={null}
from agno.agent import Agent
from agno.knowledge.knowledge import Knowledge
from agno.models.anthropic import Claude
from agno_moss import MossRuntime

knowledge = Knowledge(
    vector_db=MossRuntime(
        index_name="my-index",
        # Falls back to MOSS_PROJECT_ID / MOSS_PROJECT_KEY env vars
    ),
)

agent = Agent(
    model=Claude(id="claude-sonnet-4-20250514"),
    knowledge=knowledge,
    search_knowledge=True,
    markdown=True,
)

knowledge.load(recreate=False)
agent.print_response("What do you know about our return policy?", stream=True)
```

## Configuration

### MossRuntime

| Parameter | Default | Description |
| - | - | - |
| `index_name` | Required | Name of the Moss index |
| `project_id` | `MOSS_PROJECT_ID` env var | Moss project ID |
| `project_key` | `MOSS_PROJECT_KEY` env var | Moss project key |
| `embedding_model` | `"moss-minilm"` | `"moss-minilm"` for speed or `"moss-mediumlm"` for higher accuracy |
| `alpha` | `0.8` | Hybrid search blend. `1.0` = semantic only, `0.0` = keyword only |
| `auto_refresh` | `False` | Auto-refresh the in-memory index when new docs are added |
| `polling_interval_in_seconds` | `600` | Refresh interval when `auto_refresh=True` |

## Model providers

Use any Agno-compatible model provider. For example:

```python theme={null}
from agno.models.openai import OpenAIChat

agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    knowledge=knowledge,
    search_knowledge=True,
)
```
