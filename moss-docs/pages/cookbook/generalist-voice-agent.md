<!-- Source: https://docs.moss.dev/docs/cookbook/generalist-voice-agent.md -->
# Generalist Voice Agent

> A LiveKit voice agent that routes calls to different Moss indexes based on persona — switch knowledge bases without touching code.

A persona-agnostic voice agent built on [LiveKit Agents](https://docs.livekit.io/agents/). Each conversation persona maps to its own Moss index, and the active persona is set via room metadata at call time — no restarts or code changes needed when you add a new knowledge domain.

> **Full example** — see the [Generalist Voice Agent cookbook](https://github.com/usemoss/moss/tree/main/examples/cookbook/generalist-moss-voice-agent) for the complete runnable demo with sample docs and persona config.

## Why Moss for voice agents?

Voice agents are latency-sensitive. A retrieval step that takes 200–500ms is audible as a pause. Moss loads indexes into local memory at session start so every `moss_search` call during the call returns in \~1–10ms — fast enough to stay below the perceptual threshold.

The persona model also means you can run a single agent binary against many knowledge bases. Add `hr_policies` as a new index, register it in `personas.json`, and the next call routed to that persona immediately has access to it.

## Architecture

```
Caller speaks
    └─▶ Deepgram STT
            └─▶ GPT-4.1-mini (with moss_search tool)
                    └─▶ moss_search()  ──▶  Moss index (local, ~1–10ms)
                            └─▶ Cartesia TTS ──▶ Caller hears answer
```

## Required tools

* [Moss](https://moss.dev/) account with project credentials
* [LiveKit](https://livekit.io/) account (URL, API key, API secret)
* [OpenAI](https://platform.openai.com/) API key
* [Deepgram](https://deepgram.com/) API key
* [Cartesia](https://cartesia.ai/) API key
* Python 3.10+

## Integration guide

**1. Installation**

```bash theme={null}
pip install "livekit-agents>=1.0.0" \
  livekit-plugins-openai livekit-plugins-deepgram \
  livekit-plugins-silero livekit-plugins-cartesia \
  moss python-dotenv
```

**2. Environment setup**

```bash .env theme={null}
# LiveKit
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Moss
MOSS_PROJECT_ID=your_moss_project_id
MOSS_PROJECT_KEY=your_moss_project_key
# Index cache. In production, point it at persistent storage.
MOSS_CACHE_PATH=./moss-cache

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Deepgram
DEEPGRAM_API_KEY=your_deepgram_api_key

# Cartesia (TTS)
CARTESIA_API_KEY=your_cartesia_api_key
```

**3. Index your documents**

Place `.txt` or `.md` files in a folder named after the knowledge domain. The folder name becomes the Moss index name and is what the agent routes to.

```
docs/
  customer_support/   ← refunds, account help, shipping policies
  product_faq/        ← features, pricing, integrations
  hr_policies/        ← leave, benefits, onboarding
```

Run `create_index.py` once per folder:

```bash theme={null}
python create_index.py --index-name customer_support --docs-dir ./docs/customer_support
python create_index.py --index-name product_faq      --docs-dir ./docs/product_faq
```

To add a new knowledge base later, index a new folder — no agent restart needed.

**4. Register personas**

`personas.json` maps a persona ID to an index name and a system prompt. Each persona is a distinct voice and knowledge domain.

```json personas.json theme={null}
{
  "customer_support": {
    "index_name": "customer_support",
    "instructions": "You are a friendly, patient customer support agent. Resolve the user's issue quickly and leave them feeling helped. Greet them warmly and confirm they are satisfied before ending the call."
  },
  "product_faq": {
    "index_name": "product_faq",
    "instructions": "You are a knowledgeable product specialist. Help users understand features and pricing. Be enthusiastic but concise."
  }
}
```

**5. Build the voice agent**

`MossVoiceAgent` extends `livekit.agents.Agent`. The `@function_tool` decorator exposes `moss_search` to the LLM. Each worker process creates one `MossClient` with a `cache_path` in `prewarm`, and each call starts loading its persona's index before `ctx.connect()`, so the load runs while the call connects and retrieval stays in local memory. See [Process model and index loading](https://docs.moss.dev/docs/integrations/livekit.md#process-model-and-index-loading).

```python theme={null}
from __future__ import annotations
import asyncio, json, logging, os
from typing import Annotated
from dotenv import load_dotenv
from livekit.agents import Agent, AgentSession, JobContext, JobProcess, WorkerOptions, cli, function_tool
from livekit.plugins import cartesia, deepgram, openai, silero
from moss import MossClient, QueryOptions

load_dotenv()

VOICE_RULES = """
- Speak in short, natural sentences — this is a phone call, not a chat UI.
- Never read out bullet points, markdown, URLs, or document IDs.
- Never mention searching or databases.
- If you cannot find the answer, say so and offer to help with something else.
"""

class MossVoiceAgent(Agent):
    def __init__(self, moss_client: MossClient, index_name: str, instructions: str):
        super().__init__(instructions=instructions + VOICE_RULES)
        self._moss = moss_client
        self._index_name = index_name

    @function_tool
    async def moss_search(
        self,
        query: Annotated[str, "Concise query capturing what the caller wants to know."],
    ) -> str:
        """Retrieve relevant information to answer the caller's question.
        Call this whenever you need factual context before responding.
        """
        result = await self._moss.query(
            self._index_name, query, QueryOptions(top_k=5, alpha=0.5)
        )
        if not result.docs:
            return "No relevant information found."
        return "\n\n---\n\n".join(doc.text for doc in result.docs)

def prewarm(proc: JobProcess) -> None:
    # Runs once in each new worker process, before a call is assigned to it.
    proc.userdata["vad"] = silero.VAD.load()
    proc.userdata["moss"] = MossClient(
        os.environ["MOSS_PROJECT_ID"],
        os.environ["MOSS_PROJECT_KEY"],
        cache_path=os.getenv("MOSS_CACHE_PATH", "./moss-cache"),
    )

async def entrypoint(ctx: JobContext) -> None:
    # Resolve persona from the room metadata the job carries: {"persona": "customer_support"}
    metadata = json.loads(ctx.job.room.metadata or "{}")
    persona_id = metadata.get("persona", "customer_support")

    with open("personas.json", encoding="utf-8") as f:
        personas = json.load(f)
    persona = personas.get(persona_id, next(iter(personas.values())))
    moss_client: MossClient = ctx.proc.userdata["moss"]

    # Pull the index into local memory while the call connects.
    loading = asyncio.create_task(moss_client.load_index(persona["index_name"]))
    await ctx.connect()

    session = AgentSession(
        stt=deepgram.STT(model="nova-2"),
        llm=openai.LLM(model="gpt-4.1-mini"),
        tts=cartesia.TTS(),
        vad=ctx.proc.userdata["vad"],
    )
    await loading

    agent = MossVoiceAgent(moss_client, persona["index_name"], persona["instructions"])
    await session.start(agent=agent, room=ctx.room)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
```

**6. Start the agent and connect**

```bash theme={null}
# Development (auto-reloads on file changes)
python agent.py dev

# Production
python agent.py start
```

Open the [LiveKit Agents Playground](https://agents-playground.livekit.io), enter your LiveKit credentials, and connect. To test a different persona, set the room metadata before connecting:

```json theme={null}
{"persona": "product_faq"}
```

## Switching personas at call time

The persona is resolved from room metadata at the start of each session. This means you can route different callers to different knowledge bases — support line vs. product FAQ vs. HR helpdesk — from a single running agent worker. Each call loads only its persona's index, from the disk cache when the cloud copy is unchanged.

| Room metadata | Persona loaded | Moss index searched |
| - | - | - |
| `{"persona": "customer_support"}` | Customer support | `customer_support` |
| `{"persona": "product_faq"}` | Product specialist | `product_faq` |
| `{"persona": "hr_policies"}` | HR assistant | `hr_policies` |

Adding a new persona is three steps: add files to a docs folder, run `create_index.py`, and add a new entry to `personas.json`. No restart required.
