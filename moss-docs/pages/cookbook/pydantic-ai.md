<!-- Source: https://docs.moss.dev/docs/cookbook/pydantic-ai.md -->
# Customer Support Agent

> Expose Moss semantic search as a typed, reusable tool inside a Pydantic AI agent.

Wrap [Moss](https://moss.dev/) as a `pydantic_ai.Tool` and pass it directly to any [Pydantic AI](https://ai.pydantic.dev/) agent. The agent will call `moss_search` automatically whenever it needs to look up facts from your knowledge base, keeping all answers grounded in indexed content.

> **Full example** — see the [Pydantic AI cookbook](https://github.com/usemoss/moss/tree/main/examples/cookbook/pydantic-ai) for the complete `MossSearchTool` class, demo script, and unit tests.

## Why use Moss with Pydantic AI?

Pydantic AI's tool system infers the input schema directly from the function signature, so there's no schema boilerplate to maintain. Moss's `load_index()` pulls the index into local memory before the agent starts, meaning every tool call during the agent's run hits the \~1–10ms in-memory path rather than a remote API.

## Required tools

* [Moss](https://moss.dev/) account with project credentials
* OpenAI API key (or any Pydantic AI-supported LLM)
* Python 3.11+

## Integration guide

**1. Installation**

```bash theme={null}
uv add pydantic-ai moss python-dotenv
```

**2. Environment setup**

```bash .env theme={null}
MOSS_PROJECT_ID=your-project-id
MOSS_PROJECT_KEY=your-project-key
MOSS_INDEX_NAME=your-index-name
OPENAI_API_KEY=your-openai-api-key
```

**3. Create MossSearchTool**

`MossSearchTool` wraps a `MossClient` and exposes a `.tool` property that returns a ready-to-use `pydantic_ai.Tool`. Pydantic AI derives the input schema from the inner function's type annotations automatically.

```python theme={null}
from moss import MossClient, QueryOptions
from pydantic_ai import Tool

class MossSearchTool:
    def __init__(
        self,
        client: MossClient,
        index_name: str,
        top_k: int = 5,
        alpha: float = 0.8,
    ):
        self._client = client
        self._index_name = index_name
        self._top_k = top_k
        self._alpha = alpha
        self._tool = self._build_tool()

    async def load_index(self) -> None:
        """Pull the index into local memory for fast queries."""
        await self._client.load_index(self._index_name)

    async def search(self, query: str) -> str:
        result = await self._client.query(
            self._index_name,
            query,
            QueryOptions(top_k=self._top_k, alpha=self._alpha),
        )
        if not result.docs:
            return "No relevant results found."
        lines = ["Relevant results:", ""]
        for i, doc in enumerate(result.docs, 1):
            score = getattr(doc, "score", None)
            suffix = f" (score={score:.3f})" if score is not None else ""
            lines.append(f"{i}. {doc.text}{suffix}")
        return "\n".join(lines)

    @property
    def tool(self) -> Tool:
        return self._tool

    def _build_tool(self) -> Tool:
        instance = self

        async def moss_search(query: str) -> str:
            """Search the knowledge base for relevant documents.

            Args:
                query: Natural-language question or lookup text.
            """
            return await instance.search(query)

        return Tool(
            moss_search,
            takes_ctx=False,
            description=(
                "Search the Moss knowledge base. Use this tool whenever the user "
                "asks for factual information that should come from indexed content."
            ),
        )
```

**4. Load the index and run the agent**

Call `load_index()` before `agent.run()`. On the first run this may download the local query model cache — subsequent runs start immediately.

```python theme={null}
import asyncio
from moss import MossClient
from pydantic_ai import Agent

async def main():
    client = MossClient("your-project-id", "your-project-key")
    moss = MossSearchTool(client=client, index_name="your-index-name")

    # Pull vectors into local memory before the agent starts
    await moss.load_index()

    agent = Agent(
        "openai:gpt-4o",
        system_prompt=(
            "Answer user questions using the Moss knowledge base. "
            "Use moss_search for any factual lookup."
        ),
        tools=[moss.tool],
    )

    result = await agent.run("How do I reset my password?")
    print(result.output)

asyncio.run(main())
```

**5. Customize retrieval behaviour**

Adjust `top_k` and `alpha` to tune the retrieval:

| Parameter | Default | Effect |
| - | - | - |
| `top_k` | `5` | Number of results returned per query |
| `alpha` | `0.8` | Blend: `1.0` = pure semantic, `0.0` = pure keyword |

```python theme={null}
# Fewer, highly semantic results
moss = MossSearchTool(client=client, index_name="your-index-name", top_k=3, alpha=1.0)

# More results with keyword influence
moss = MossSearchTool(client=client, index_name="your-index-name", top_k=8, alpha=0.5)
```

## How it works

```
agent.run("How do I reset my password?")
      │
      │  decides to call moss_search
      ▼
MossSearchTool.search(query)
      │
      ▼
client.query()  ──▶  local in-memory index (~1–10ms)
      │
      ▼
formatted results string
      │
      ▼
LLM receives results as tool output  ──▶  grounded answer
```

The index is loaded once before the agent starts. All `moss_search` calls during the agent's execution hit the in-memory path, so retrieval doesn't add meaningful latency to tool-call round trips.
