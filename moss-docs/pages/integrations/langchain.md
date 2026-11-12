<!-- Source: https://docs.moss.dev/docs/integrations/langchain.md -->
# LangChain

> Use Moss as a retriever in LangChain chains and agents for sub-10ms semantic search.

Integrate Moss semantic search into [LangChain](https://python.langchain.com/) using a custom retriever and agent tool. This setup lets you use Moss in standard LangChain RAG pipelines and agentic workflows with sub-10ms retrieval latency.

> **Note:** For complete examples including RAG chains and ReAct agents, see the [LangChain cookbook](https://github.com/usemoss/moss/tree/main/examples/cookbook/langchain).

## Why use Moss with LangChain?

LangChain's retriever interface is the standard way to plug external knowledge into LLM chains. Moss delivers sub-10ms semantic search that slots directly into this interface, giving your chains and agents fast, accurate retrieval without the latency overhead of traditional vector databases.

## Required tools

* [Moss](https://www.moss.dev/) account with project credentials
* [OpenAI](https://openai.com/api/) API key (for LLM and agent usage)
* [Python](https://www.python.org/) 3.11+

## Integration guide

**1. Installation**

```bash theme={null}
pip install moss langchain langchain-openai python-dotenv
```

> [!NOTE]
>
> Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to 1.9.0+ before then.

**2. Environment setup**

Create a `.env` file in your project root.

```bash .env theme={null}
# Moss Credentials
MOSS_PROJECT_ID=your_project_id
MOSS_PROJECT_KEY=your_project_key
MOSS_INDEX_NAME=your_index_name

# OpenAI
OPENAI_API_KEY=sk-...
```

**3. Add the Moss retriever**

Moss's LangChain retriever ships in the [cookbook](https://github.com/usemoss/moss/tree/main/examples/cookbook/langchain) as a single file, `moss_langchain.py`. It is not a PyPI package: Moss does not publish `moss-langchain` or `moss-sdk` (those names on PyPI belong to an unrelated project). Copy the file next to your script:

```bash theme={null}
curl -O https://raw.githubusercontent.com/usemoss/moss/main/examples/cookbook/langchain/moss_langchain.py
```

The steps below import `MossRetriever` and `get_moss_tool` from that file.

**4. Use as a retriever**

`moss_langchain.py` provides a `MossRetriever` class that implements LangChain's `BaseRetriever` interface. It loads the Moss index once and returns `Document` objects with metadata and relevance scores.

```python theme={null}
from moss_langchain import MossRetriever

retriever = MossRetriever(
    project_id="your-project-id",
    project_key="your-project-key",
    index_name="your-index-name",
    top_k=3,
    alpha=0.5,
)

# Use in async contexts (recommended)
docs = await retriever.ainvoke("What is the return policy?")
for doc in docs:
    print(doc.page_content, doc.metadata["score"])
```

**5. Use as an agent tool**

`get_moss_tool()` builds a retriever from your credentials and wraps it as a LangChain `Tool`, so agents can search the knowledge base autonomously. Pass the credentials directly, not a retriever instance.

```python theme={null}
from moss_langchain import get_moss_tool

tool = get_moss_tool(
    project_id="your-project-id",
    project_key="your-project-key",
    index_name="your-index-name",
    top_k=5,
    alpha=0.5,
)
# tool.name == "moss_search"
# Use with create_openai_functions_agent or any LangChain agent
```
