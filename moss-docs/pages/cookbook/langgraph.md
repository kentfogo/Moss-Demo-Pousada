<!-- Source: https://docs.moss.dev/docs/cookbook/langgraph.md -->
# Grounded FAQ Agent

> Use Moss as a retrieval node inside a LangGraph stateful agent graph for grounded, sub-10ms answers.

Wire Moss into a [LangGraph](https://www.langchain.com/langgraph) graph as a dedicated `retrieve` node. The graph passes the user query through retrieval, writes the Moss results into shared state, then feeds that context to a `generate` node — keeping all LLM responses grounded in your knowledge base.

> **Full example** — see the [LangGraph cookbook](https://github.com/usemoss/moss/tree/main/examples/cookbook/langgraph) for the complete runnable demo with interactive mode, metadata filter support, and tests.

## Why use Moss with LangGraph?

LangGraph's state-machine model is a natural fit for retrieval-augmented workflows: each node reads from and writes to a shared typed state, so retrieval latency and results are transparent at every step. Moss plugs in as a single async node and keeps query latency in the 1–10ms range when the index is loaded locally — fast enough that retrieval never becomes the bottleneck in a multi-node graph.

## Required tools

* [Moss](https://moss.dev/) account with project credentials
* [Groq](https://groq.com/) API key (or swap in any LangChain-compatible LLM)
* Python 3.11+

## Integration guide

**1. Installation**

```bash theme={null}
uv add langgraph langchain-groq moss python-dotenv
```

**2. Environment setup**

Create a `.env` file in your project root:

```bash .env theme={null}
MOSS_PROJECT_ID=your-project-id
MOSS_PROJECT_KEY=your-project-key
MOSS_INDEX_NAME=your-index-name
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.3-70b-versatile
```

**3. Define the graph state**

LangGraph nodes communicate through a shared `TypedDict`. Moss results slot in naturally alongside the query and answer fields.

```python theme={null}
from typing import Any, NotRequired, TypedDict
from moss import SearchResult

class MossGraphState(TypedDict):
    query: str
    metadata_filter: NotRequired[dict[str, Any] | None]
    top_k: NotRequired[int]
    retrieval_results: NotRequired[SearchResult]
    retrieval_context: NotRequired[str]
    answer: NotRequired[str]
```

**4. Build the retrieve → generate graph**

The `retrieve` node queries Moss and writes results to state. The `generate` node reads that context and produces the final answer.

```python theme={null}
from langgraph.graph import END, START, StateGraph
from moss import MossClient, QueryOptions

def build_moss_graph(client: MossClient, index_name: str, llm):
    async def retrieve(state: MossGraphState) -> dict:
        result = await client.query(
            index_name,
            state["query"],
            QueryOptions(
                top_k=state.get("top_k", 4),
                filter=state.get("metadata_filter"),
            ),
        )
        context = "\n\n".join(
            f"[{i+1}] score={doc.score:.3f}\n{doc.text}"
            for i, doc in enumerate(result.docs)
        )
        return {
            "retrieval_results": result,
            "retrieval_context": context,
        }

    async def generate(state: MossGraphState) -> dict:
        response = await llm.ainvoke([
            (
                "system",
                "Answer only from the Moss context below. "
                "If the context is insufficient, say so clearly.",
            ),
            (
                "human",
                f"Question:\n{state['query']}\n\n"
                f"Context:\n{state.get('retrieval_context', 'None')}",
            ),
        ])
        return {"answer": response.content}

    graph = StateGraph(MossGraphState)
    graph.add_node("retrieve", retrieve)
    graph.add_node("generate", generate)
    graph.add_edge(START, "retrieve")
    graph.add_edge("retrieve", "generate")
    graph.add_edge("generate", END)
    return graph.compile()
```

**5. Load the index and run**

Call `load_index()` **before** the graph runs. This pulls the index into local memory, where every query runs in about 1 to 10 ms. Querying an index that is not loaded raises `MossError` with code `NOT_FOUND`; there is no cloud query.

```python theme={null}
import asyncio
from langchain_groq import ChatGroq
from moss import MossClient

async def main():
    client = MossClient("your-project-id", "your-project-key")

    # Load once before the graph starts
    await client.load_index("your-index-name")

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key="your-groq-api-key",
        temperature=0,
    )
    graph = build_moss_graph(client, "your-index-name", llm)

    result = await graph.ainvoke({"query": "What is the refund policy?"})
    print(result["answer"])

asyncio.run(main())
```

You can pass an optional `metadata_filter` through graph state to scope retrieval to a specific category:

```python theme={null}
result = await graph.ainvoke({
    "query": "What is the refund policy?",
    "metadata_filter": {"field": "category", "condition": {"$eq": "returns"}},
})
```

## How it works

```
User question
      │
      ▼
 retrieve node  ──▶  client.query()  ──▶  Moss index (local, ~1–10ms)
      │
      │  writes retrieval_results + retrieval_context to state
      ▼
 generate node  ──▶  LLM (Groq)  ──▶  grounded answer
      │
      ▼
   Answer
```

The index is loaded into local memory once at startup. Every subsequent `query()` call inside the graph hits the in-memory path, so even graphs with many retrieval steps stay fast.
