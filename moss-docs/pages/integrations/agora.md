<!-- Source: https://docs.moss.dev/docs/integrations/agora.md -->
# Agora

> Add real-time knowledge base access to Agora Conversational AI voice agents with Moss semantic search over MCP.

Integrate Moss semantic search into an [Agora Conversational AI](https://docs.agora.io/en/conversational-ai/overview/product-overview) voice agent using the `agora-moss` package. Moss is exposed as a single MCP tool (`search_knowledge_base`) over streamable HTTP - wire it into ConvoAI's `llm.mcp_servers` join-body field and your voice agent can look up knowledge base answers in under 10ms during a live call.

> **Note:** For a complete working example, see the [agora-moss app](https://github.com/usemoss/moss/tree/main/apps/agora-moss).

## Why use Moss with Agora?

Agora ConvoAI agents accept MCP servers as tools the LLM can call mid-conversation. Moss drops in as one of those servers: your agent keeps whichever LLM, ASR, and TTS vendors you already use, and gains fast, hallucination-free knowledge base lookups with no LLM-side plumbing.

## Required tools

* [Moss](https://www.moss.dev/) account with project credentials
* [Agora](https://www.agora.io/) account with Conversational AI enabled (App ID, App Certificate, Customer ID, Customer Secret)
* An OpenAI-compatible LLM endpoint (OpenAI, Groq, Together, vLLM, etc.) plus ASR/TTS vendor keys (Deepgram, Cartesia, or any other Agora-supported provider)
* A public URL for your MCP server (production host, or `ngrok` / `cloudflared` for local dev)
* [Python](https://www.python.org/) 3.10+

## Integration guide

**1. Installation**

```bash theme={null}
pip install agora-moss
```

**2. Environment setup**

Create a `.env` file in your project root with your credentials.

```bash .env theme={null}
# Moss Credentials
MOSS_PROJECT_ID=your_project_id
MOSS_PROJECT_KEY=your_project_key
MOSS_INDEX_NAME=support-docs

# Agora Credentials
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_app_certificate
AGORA_CUSTOMER_ID=your_customer_id
AGORA_CUSTOMER_SECRET=your_customer_secret
```

**3. Run the MCP server**

Build a FastMCP app from `MossAgoraSearch` and serve it at a public HTTPS URL. The index is preloaded into memory during the server's lifespan so every tool call runs in-process.

```python server.py theme={null}
import os
import uvicorn
from agora_moss import MossAgoraSearch, create_mcp_app

search = MossAgoraSearch(
    project_id=os.environ["MOSS_PROJECT_ID"],
    project_key=os.environ["MOSS_PROJECT_KEY"],
    index_name=os.environ["MOSS_INDEX_NAME"],
    top_k=5,
    alpha=0.8,
)

mcp = create_mcp_app(search)
app = mcp.streamable_http_app()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
```

Run it and expose `/mcp` publicly:

```bash theme={null}
uv run uvicorn server:app --host 0.0.0.0 --port 8080
# in another terminal, for local dev only:
ngrok http 8080
```

**4. Wire into the Agora ConvoAI join body**

Point Agora's ConvoAI REST `/join` endpoint at your MCP server by adding one `mcp_servers` entry under `llm` and flipping `advanced_features.enable_tools` on. Everything else - vendor, LLM URL, ASR, TTS - stays exactly as you already have it.

```json theme={null}
{
  "properties": {
    "llm": {
      "mcp_servers": [{
        "name": "moss",
        "endpoint": "https://<your-mcp-host>/mcp",
        "transport": "streamable_http",
        "allowed_tools": ["search_knowledge_base"]
      }]
    },
    "advanced_features": { "enable_tools": true }
  }
}
```

Agora rules to watch:

* Server-entry `name` must be **≤48 characters and alphanumeric only** (no hyphens, underscores, or dots).
* Transport must be `streamable_http`.
* `advanced_features.enable_tools` must be `true`.

## Configuration

### MossAgoraSearch

| Parameter | Type | Default | Description |
| :- | :- | :- | :- |
| `project_id` | `str \| None` | `None` | Your Moss Project ID. Read it from `MOSS_PROJECT_ID` and pass it in. |
| `project_key` | `str \| None` | `None` | Your Moss Project Key. Read it from `MOSS_PROJECT_KEY` and pass it in. |
| `index_name` | `str` | Required | The name of the Moss index to query. |
| `top_k` | `int` | `5` | Number of results to retrieve per query. |
| `alpha` | `float` | `0.8` | Hybrid search weighting. `0.0` = keyword only, `1.0` = semantic only. |

`MossAgoraSearch.search()` returns an `AgoraSearchResult` with `documents: list[dict]` (`{"content": str, "similarity": float}`) and `time_taken_ms: int | None`.

### create\_mcp\_app

| Argument | Type | Description |
| :- | :- | :- |
| `search` | `MossAgoraSearch` | A configured adapter. The returned FastMCP app awaits `search.load_index()` in its lifespan before accepting tool calls. |

Returns a `FastMCP` instance exposing a single tool: `search_knowledge_base(query: str)`. Exceptions from the adapter are surfaced to the LLM as MCP tool-errors.
