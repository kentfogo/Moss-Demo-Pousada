<!-- Source: https://docs.moss.dev/docs/integrations/sim.md -->
# sim.ai

> Add sub-10ms semantic search to sim.ai workflows via a Moss-powered webhook tool.

Connect [sim.ai](https://sim.ai/) workflows to a Moss knowledge base. `MossSimSearch` wraps a Moss index and returns results in sim.ai's expected shape — ready to serve from a webhook that sim.ai calls as an external HTTP tool.

> **Note:** For a complete FastAPI server and setup guide, see the [sim.ai cookbook](https://github.com/usemoss/moss/tree/main/examples/cookbook/sim).

## How it works

sim.ai workflows call external HTTP tools. You run a small webhook server backed by `MossSimSearch` and point an **HTTP tool node** at it. When the workflow triggers the tool, Moss answers in under 10 ms and the result flows back into the workflow.

```
sim.ai workflow
  └─ HTTP tool node  POST /search {"query": "..."}
       └─ server.py (FastAPI)
            └─ MossSimSearch  ──▶  Moss index (on-device, <10ms)
                 └─ {"results": [...], "time_taken_ms": 4}
```

## Required tools

* [Moss Portal](https://portal.usemoss.dev) project with credentials
* Python 3.10+
* [uv](https://docs.astral.sh/uv/) (optional but recommended)
* A sim.ai workspace with a deployed workflow

## Integration guide

**1. Installation**

Install `sim-moss` along with FastAPI and Uvicorn:

```bash theme={null}
pip install sim-moss fastapi pydantic uvicorn python-dotenv
```

If you are using the cookbook example, you can sync the dependencies directly using `uv`:

```bash theme={null}
cd examples/cookbook/sim
uv sync
```

**2. Environment setup**

Set your Moss credentials as environment variables. You can create a `.env` file or export them directly:

```bash theme={null}
export MOSS_PROJECT_ID="your_project_id"
export MOSS_PROJECT_KEY="your_project_key"
export MOSS_INDEX_NAME="sim-docs" # Optional, defaults to "sim-docs"
```

**3. Serve from a webhook**

Wrap the search in a FastAPI webhook server:

```python theme={null}
from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from sim_moss import MossSimSearch

load_dotenv()

search = MossSimSearch(
    project_id=os.environ["MOSS_PROJECT_ID"],
    project_key=os.environ["MOSS_PROJECT_KEY"],
    index_name=os.environ.get("MOSS_INDEX_NAME", "sim-docs"),
    top_k=5,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the Moss index once at startup so every request hits a warm index."""
    await search.load_index()
    yield

app = FastAPI(
    title="Moss Knowledge Base for sim.ai",
    description="Webhook server that serves Moss semantic search results to sim.ai workflows.",
    lifespan=lifespan,
)

class SearchRequest(BaseModel):
    """Request body for the /search endpoint."""
    query: str

@app.post("/search")
async def handle_search(req: SearchRequest):
    """Handle a knowledge base query from a sim.ai workflow tool node.

    Returns documents in sim.ai's expected shape:
        {"results": [{"content": "...", "score": 0.94, "source": "..."}], "time_taken_ms": 4}
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="query must not be empty")

    result = await search.search(req.query)
    return {"results": result.results, "time_taken_ms": result.time_taken_ms}

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "index_loaded": search._index_loaded}
```

Start the webhook server locally using `uvicorn` (or `uv run uvicorn`):

```bash theme={null}
uvicorn server:app --host 0.0.0.0 --port 8000
```

The server pre-loads the Moss index on startup. Check `/health` to confirm readiness.

**4. Add the tool to your sim.ai workflow**

In your sim.ai workflow editor, add an **HTTP tool** node:

| Field | Value |
| - | - |
| Method | `POST` |
| URL | `https://your-server.com/search` |
| Body | `{"query": "{{user_message}}"}` |

Map the response: `results[*].content` → injected into the LLM context block.

## API

### `POST /search`

**Request**

```json theme={null}
{
  "query": "how do I reset my password?"
}
```

**Response**

```json theme={null}
{
  "results": [
    {
      "content": "To reset your password...",
      "score": 0.94,
      "source": "faq.md"
    },
    {
      "content": "Account recovery steps...",
      "score": 0.87,
      "source": "help.md"
    }
  ],
  "time_taken_ms": 4
}
```

### `GET /health`

Returns `{"status": "ok", "index_loaded": true}` once the index is warm.

## Configuration

### MossSimSearch

| Parameter | Default | Description |
| - | - | - |
| `project_id` | `MOSS_PROJECT_ID` env var | Moss project ID (required) |
| `project_key` | `MOSS_PROJECT_KEY` env var | Moss project key (required) |
| `index_name` | `MOSS_INDEX_NAME` env var or `"sim-docs"` | Name of the Moss index to query |
| `top_k` | `MOSS_TOP_K` env var or `5` | Number of results to retrieve per query |
| `alpha` | `0.8` | Blend: `1.0` = semantic only, `0.0` = keyword only |

### SimSearchResult

| Field | Type | Description |
| - | - | - |
| `results` | `list[dict]` | Documents with `content`, `score`, and optional `source` |
| `time_taken_ms` | `int \| None` | Moss query latency in milliseconds |
