<!-- Source: https://docs.moss.dev/docs/integrations/dspy.md -->
# DSPy

> Use Moss as a retrieval module in DSPy programs.

Use `dspy-moss` to add Moss semantic search to [DSPy](https://dspy.ai/) programs. The package provides `MossRM`, a DSPy retrieval model (RM) that plugs into DSPy's retrieval interface for sub-10ms knowledge retrieval after the index is loaded locally.

## Why use Moss with DSPy?

DSPy's retrieval modules connect external knowledge sources to composable LLM programs. Moss provides a standard retriever backed by an in-memory semantic search runtime, so `dspy.Retrieve`, RAG modules, and ReAct agents can query your knowledge base without managing a vector database.

## Required tools

* Moss project credentials from the [Moss Portal](https://portal.usemoss.dev)
* Python 3.10+
* A DSPy-compatible LLM provider

## Integration guide

**1. Install**

```bash theme={null}
pip install dspy-moss
# or
uv add dspy-moss
```

**2. Configure credentials**

`MossRM` can create its own `MossClient` from environment variables.

```bash theme={null}
export MOSS_PROJECT_ID="your_project_id"
export MOSS_PROJECT_KEY="your_project_key"
```

**3. Use as DSPy's default retriever**

Create a `MossRM`, load the index into local memory, and register it with `dspy.configure()`.

```python theme={null}
import dspy
from dspy_moss import MossRM

rm = MossRM(index_name="my-index")
rm.load_index()

dspy.configure(lm=dspy.LM("openai/gpt-4o"), rm=rm)

retrieve = dspy.Retrieve(k=3)
result = retrieve("What is the refund policy?")

for passage in result.passages:
    print(f"[{passage['score']:.3f}] {passage['long_text']}")
```

**4. Use inside a RAG module**

Any `dspy.Retrieve()` in your program now uses Moss.

```python theme={null}
import dspy
from dspy_moss import MossRM

rm = MossRM(index_name="support-kb", k=5, alpha=0.8)
rm.load_index()
dspy.configure(lm=dspy.LM("openai/gpt-4o"), rm=rm)

class RAG(dspy.Module):
    def __init__(self):
        self.retrieve = dspy.Retrieve(k=3)
        self.generate = dspy.ChainOfThought("context, question -> answer")

    def forward(self, question):
        context = self.retrieve(question).passages
        return self.generate(context=context, question=question)

rag = RAG()
print(rag("How long do refunds take?").answer)
```

**5. Use as a ReAct tool**

`MossRM.forward()` is synchronous, so you can pass the retriever instance directly to a DSPy ReAct agent.

```python theme={null}
import dspy
from dspy_moss import MossRM

rm = MossRM(index_name="support-kb", k=5)
rm.load_index()

agent = dspy.ReAct(signature="question -> answer", tools=[rm])
print(agent(question="What payment methods do you accept?").answer)
```

## Configuration

### MossRM

| Parameter | Default | Description |
| - | - | - |
| `index_name` | Required | Name of the Moss index to query |
| `moss_client` | `None` | Existing `MossClient`. When omitted, one is created from credentials |
| `project_id` | `MOSS_PROJECT_ID` env var | Moss project ID |
| `project_key` | `MOSS_PROJECT_KEY` env var | Moss project key |
| `k` | `3` | Default number of passages per query |
| `alpha` | `0.8` | Search blend. `1.0` = semantic only, `0.0` = keyword only |

## Passage format

Each entry in `result.passages` is a dictionary:

| Key | Type | Description |
| - | - | - |
| `long_text` | `str` | Document text in DSPy's standard passage field |
| `id` | `str` | Document ID |
| `score` | `float` | Relevance score |
| `metadata` | `dict` | Metadata stored with the document |

## Mutable index helpers

`MossRM` also exposes helpers for agents that read or update the knowledge base:

```python theme={null}
# Read documents
objects = rm.get_objects(num_samples=10)

# Add or upsert documents
rm.insert([{"id": "doc-1", "text": "New fact.", "metadata": {"source": "agent"}}])
```
