<!-- Source: https://docs.moss.dev/docs/integrations/livekit.md -->
# LiveKit

> Add a persistent knowledge base and per-call conversation memory to a LiveKit voice agent with Moss search function tools.

Integrate Moss Semantic Search SDK directly into a LiveKit Voice Agent. This setup allows your voice AI to perform ultra-low latency searches over your custom data to answer user questions in real-time. It pairs a persistent knowledge base with a per-call session that indexes the conversation as it happens.

## Why Use Moss with LiveKit?

Moss delivers sub-10ms semantic retrieval, ensuring your voice agents respond naturally without noticeable delays. A session gives each call its own local index, so the agent can recall what was said earlier in the conversation with no cloud round trip.

## Required Tools

* [Moss](https://www.moss.dev/)
* [LiveKit](https://livekit.io/)
* [OpenAI](https://openai.com/api/)
* [Deepgram](https://deepgram.com/)

## Integration Guide

**1. Installation**

Install the Moss SDK.

```bash theme={null}
pip install moss \
    python-dotenv
```

> [!NOTE]
>
> Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to 1.9.0+ before then.

**2. Environment Setup**

Create a `.env` file in your project root directory with your API keys.

**File: `.env`**

```bash theme={null}
# LiveKit Credentials, keep it as it is for local deployment, don't change it.
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

# Moss Credentials
MOSS_PROJECT_ID=your-moss-id
MOSS_PROJECT_KEY=your-moss-key

# Moss index cache. In production, point it at persistent storage.
MOSS_CACHE_PATH=./moss-cache

# AI Provider Keys
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=your-deepgram-key
```

**3. Creating the Knowledge Base with Moss**

Before the agent can answer questions, build the long-term knowledge base. Run this script once to upload your documents to Moss as a cloud index.

**File: `build_index.py`**

```python theme={null}
import asyncio
import os
from dotenv import load_dotenv
from moss import MossClient, DocumentInfo

load_dotenv()

async def main():
    # Initialize the Moss Client
    client = MossClient(
        project_id=os.environ["MOSS_PROJECT_ID"],
        project_key=os.environ["MOSS_PROJECT_KEY"]
    )
    
    index_name = os.getenv("MOSS_INDEX_NAME", "product-knowledge")

    # Define documents
    docs = [
        DocumentInfo(
            id="1", 
            text="Our return policy allows returns within 30 days of purchase with a receipt."
        ),
        DocumentInfo(
            id="2", 
            text="Standard shipping takes 3-5 business days. Express shipping takes 1-2 days."
        ),
        DocumentInfo(
            id="3", 
            text="Technical support is available 24/7 via email at support@example.com."
        ),
    ]

    print(f"Creating index '{index_name}'...")
    
    await client.create_index(index_name, docs, model_id="moss-minilm")
    
    print("Index created successfully.")

if __name__ == "__main__":
    asyncio.run(main())
```

Run the builder:

```bash theme={null}
python build_index.py
```

**4. Building the Agent**

This agent exposes Moss search as **function tools**. The LLM decides when to call them during a turn, reads the results, and uses them to answer, so it can search, refine, or skip retrieval on turns that don't need it.

Two tools are registered:

* `search_knowledge_base` queries the persistent knowledge base you built above (long-term context).
* `search_conversation` queries this call's [session](https://docs.moss.dev/docs/reference/python/sessions.md) (short-term context) to recall something said earlier.

Each user turn is also recorded into the session, and the session is pushed to the cloud when the call ends, so the conversation can be resumed or handed to another agent later.

The Moss client is created once per worker process in `prewarm`, with a `cache_path`. Each call reads
its knowledge base names from the job metadata and starts loading them before `ctx.connect()`, so
the loads run while the call connects. See [Process model and index loading](#process-model-and-index-loading)
for why.

**File: `agent.py`**

```python theme={null}
import asyncio
import json
import logging
import os
from dotenv import load_dotenv
from livekit.plugins import openai, deepgram, silero
from livekit.plugins.turn_detector.english import EnglishModel
from livekit.agents import (
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    Agent,
    AgentSession,
    ChatContext,
    ChatMessage,
    RunContext,
    function_tool,
)

# Moss imports
from moss import MossClient, DocumentInfo, QueryOptions

load_dotenv()

# Knowledge bases for a call dispatched without "moss_indexes" in its metadata
DEFAULT_INDEXES = [os.getenv("MOSS_INDEX_NAME", "product-knowledge")]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("moss-agent")


class MossSemanticRetrievalAgent(Agent):

    def __init__(self, moss_client: MossClient, indexes: list[str], moss_session):
        super().__init__(
            instructions="""
                You are a helpful customer support voice assistant.
                When you need facts about products or policies, call
                search_knowledge_base. To recall something said earlier in this
                call, call search_conversation. If the tools return nothing
                useful, say you don't know.
            """
        )
        self.moss = moss_client
        self.indexes = indexes  # long-term knowledge bases loaded for this call
        self.moss_session = moss_session  # short-term, per-call SessionIndex
        self._turn = 0

    @function_tool
    async def search_knowledge_base(self, context: RunContext, query: str) -> str:
        """Search the product and support knowledge base.

        Args:
            query: A focused query describing the facts to look up.
        """
        if not self.indexes:
            return "The knowledge base is unavailable."
        # Searches every loaded knowledge base at once. They must share one embedding model.
        results = await self.moss.query_multi_index(
            self.indexes, query, QueryOptions(top_k=5, alpha=0.8)
        )
        if not results.docs:
            return "No relevant entries found."
        return "\n".join(f"- {d.text}" for d in results.docs)

    @function_tool
    async def search_conversation(self, context: RunContext, query: str) -> str:
        """Recall something said earlier in this same call.

        Args:
            query: What to look for in the conversation so far.
        """
        results = await self.moss_session.query(query, QueryOptions(top_k=3))
        if not results.docs:
            return "Nothing relevant was said earlier in this call."
        return "\n".join(f"- {d.text}" for d in results.docs)

    async def on_user_turn_completed(self, turn_ctx: ChatContext, new_message: ChatMessage) -> None:
        # Record each turn in the session (local, ~1-5 ms) so it can be recalled
        # later via search_conversation and persisted at call end. This only
        # writes to the session; it does not inject anything into the prompt.
        self._turn += 1
        try:
            await self.moss_session.add_docs(
                [DocumentInfo(id=f"user-turn-{self._turn}", text=new_message.text_content)]
            )
        except Exception as e:
            logger.error(f"Failed to index turn: {e}")

        await super().on_user_turn_completed(turn_ctx, new_message)


def prewarm(proc: JobProcess) -> None:
    # Runs once in each new worker process, before a call is assigned to it.
    proc.userdata["vad"] = silero.VAD.load()
    proc.userdata["moss"] = MossClient(
        os.environ["MOSS_PROJECT_ID"],
        os.environ["MOSS_PROJECT_KEY"],
        cache_path=os.getenv("MOSS_CACHE_PATH", "./moss-cache"),
    )


async def load_knowledge(moss: MossClient, names: list[str]) -> list[str]:
    # Concurrent loads overlap their round trips to the cloud.
    results = await asyncio.gather(
        *(moss.load_index(name) for name in names), return_exceptions=True
    )
    loaded = []
    for name, result in zip(names, results):
        if isinstance(result, BaseException):
            logger.warning(f"Knowledge index '{name}' not loaded: {result}")
        else:
            loaded.append(name)
    return loaded


async def entrypoint(ctx: JobContext):
    moss: MossClient = ctx.proc.userdata["moss"]

    # The dispatch names the call's knowledge bases in the job metadata,
    # for example {"moss_indexes": ["acme-faq", "acme-policies"]}.
    metadata = json.loads(ctx.job.metadata or "{}")
    indexes = metadata.get("moss_indexes", DEFAULT_INDEXES)

    # Short-term context: a session keyed to this call. It auto-loads if a cloud
    # index with this name already exists (an earlier handoff), or starts empty
    # for a brand-new call.
    call_id = f"call-{ctx.job.room.name}"

    # Start loading before connecting, so the loads run while the call connects.
    loading = asyncio.gather(load_knowledge(moss, indexes), moss.session(index_name=call_id))

    await ctx.connect()

    # Create the LiveKit voice pipeline.
    session = AgentSession(
        stt=deepgram.STT(),
        llm=openai.LLM(model="gpt-4o"),
        tts=openai.TTS(),
        turn_detection=EnglishModel(),
        vad=ctx.proc.userdata["vad"],
    )

    loaded, moss_session = await loading
    logger.info(f"Loaded {loaded}, opened session '{call_id}' ({moss_session.doc_count} docs)")

    # When the call ends, push the session to the cloud so the conversation can
    # be resumed later or handed off to another agent.
    async def persist_session():
        try:
            result = await moss_session.push_index()
            logger.info(f"Pushed session '{call_id}': {result.doc_count} docs")
        except Exception as e:
            logger.error(f"Failed to push session: {e}")

    ctx.add_shutdown_callback(persist_session)

    # Start the session with our custom MossSemanticRetrievalAgent.
    await session.start(
        agent=MossSemanticRetrievalAgent(moss, loaded, moss_session),
        room=ctx.room,
    )

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
```

> [!NOTE]
>
> The session indexes each turn locally during the call and pushes to the cloud
> at the end, so a later session opened with the same name resumes the
> conversation, which is the basis for cross-agent handoff. See
> [Sessions](https://docs.moss.dev/docs/reference/python/sessions.md) for the full API.

**5. Running the Agent**

First, start the LiveKit server in development mode:

```bash theme={null}
livekit-server --dev
```

Then, in a separate terminal, start your worker. The necessary VAD models will handle themselves or be downloaded automatically if needed by the plugin.

```bash theme={null}
python agent.py download-files
python agent.py console
```

## Process model and index loading

By default, LiveKit Agents runs each call in its own process. The worker keeps idle processes
ready, runs `prewarm` once in each new process before a call is assigned to it, then gives the
process one call. The process exits when the call ends, so nothing loaded for a call carries
over to the next one.

That decides where each piece of Moss work goes:

* **`prewarm` creates the client.** It holds what every call needs: the VAD model, and a
  `MossClient` with its `cache_path`.
* **The entrypoint loads the call's indexes.** Only the job knows which knowledge bases a call
  needs. Read their names from the job metadata and start one `load_index` per index under
  `asyncio.gather` before `ctx.connect()`, so the loads run concurrently while the call connects.
* **Index loads stay out of `prewarm`.** It runs in every new process before any call is known, so
  loading every knowledge base there makes each process download, parse and hold all of them. It
  must also finish within `initialize_process_timeout`, 10 seconds by default.
* **`cache_path` keeps loads short.** Without it, each load makes four round trips to the cloud,
  the last one downloading the index. With the index already in the cache it makes two and reads
  the index from disk. If the cloud is unreachable or answers with a temporary error, it serves the
  cached copy instead of failing; a 401, 403 or 404 still fails
  ([Storage & Persistence](https://docs.moss.dev/docs/integrate/storage-persistence.md#loading-from-the-cache-offline)).
  With a process per call, the embedding model opens fresh in every call and cannot open while
  the cloud is unreachable, so queries with `alpha` above 0 fail during an outage; keyword-only
  queries (`alpha=0`) and queries that pass their own embedding keep working.
  Put the directory on storage that outlives the container.
* **The first load in a process also opens the embedding model**, about half a second when the
  model is on disk. The model is cached under `~/.cache/moss-models/`. Keep that directory in the
  image or on persistent storage too, or every new container downloads the model (about 91 MB for
  `moss-minilm`) on its first call.

Each process holds its own embedding model, about 150 MiB, and its own copy of every index it
loads. Nothing is shared between processes, even with a common `cache_path`. See
[Memory sizing](https://docs.moss.dev/docs/integrate/memory-sizing.md) to estimate a host's memory. When many concurrent
calls use the same knowledge bases, two setups share that memory:

* **The thread executor.** `WorkerOptions(job_executor_type=JobExecutorType.THREAD)` runs every
  call of a worker in one process, so calls share one client, one model and one copy of each
  index. Calls are no longer isolated: a crash or a blocking call affects every call on the
  worker. In this mode `prewarm` runs once per call, so keep the client at module level, as below.
* **A retrieval service per host.** One process holds the client and the indexes and answers
  queries from every worker process on the host over a local connection. It fits when you want to
  keep one call per process, or when several services need the same indexes.

> [accordion] A shared client for the thread executor
>
> `MossClient` is not tied to an event loop: every method runs the core on a worker thread, so one
> module-level client serves the loop of every call. Each call loads its indexes: for an index that is
> already loaded, `load_index` checks the cloud for a newer version, and each load is also where Moss
> checks the project's account, for example a paused project.
>
> ```python theme={null}
> import asyncio
> import json
> import os
>
> from livekit.agents import JobContext, JobExecutorType, WorkerOptions, cli
> from moss import MossClient
>
> # One client for every call on the worker: one embedding model, one copy of each index.
> moss = MossClient(
>     os.environ["MOSS_PROJECT_ID"],
>     os.environ["MOSS_PROJECT_KEY"],
>     cache_path=os.getenv("MOSS_CACHE_PATH", "./moss-cache"),
> )
>
>
> async def entrypoint(ctx: JobContext):
>     indexes = json.loads(ctx.job.metadata or "{}")["moss_indexes"]
>     # Loads each index, or checks a loaded one for a newer version.
>     loading = asyncio.gather(*(moss.load_index(name) for name in indexes))
>     await ctx.connect()
>     # ... create the AgentSession, then:
>     await loading
>     # ... start the session with an agent that calls moss.query_multi_index(indexes, text, options)
>
>
> if __name__ == "__main__":
>     cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, job_executor_type=JobExecutorType.THREAD))
> ```
>
> With `moss` 1.20 and earlier, loading an index that is already loaded reads it again from
> `cache_path`. The worker keeps every index a call has used until it exits; if it can see more
> knowledge bases than its memory holds, unload the idle ones as in
> [Unload idle indexes](https://docs.moss.dev/docs/integrate/memory-sizing.md#unload-idle-indexes). Leave `auto_refresh` off in
> a worker like this: its periodic refresh counts as session time, so a worker that runs for days is
> billed for session minutes around the clock, with or without calls.

## Retrieval and preemptive generation

LiveKit's `AgentSession` runs **preemptive generation** by default: it starts drafting the reply
speculatively as soon as a final transcript arrives, before the turn is confirmed. In current LiveKit
Agents it is set through `turn_handling` (`TurnHandlingOptions(preemptive_generation={"enabled": ...})`);
the older top-level `preemptive_generation` argument is deprecated.

`on_user_turn_completed` runs later, at turn confirmation, after that draft has started. Injecting
retrieval there with `turn_ctx.add_message` makes the draft stale, so LiveKit discards and regenerates
it on every injected turn. So expose retrieval as a `@function_tool` (as the agent above does, and as
the [Founding Agent](https://docs.moss.dev/docs/founding-agent/overview.md) runs in production): `turn_ctx` stays stable at the
boundary, and retrieval composes with preemptive generation. An ambient pattern that injects every turn
must instead turn preemptive generation off
(`turn_handling=TurnHandlingOptions(preemptive_generation={"enabled": False})`); see the
[airline customer agent](https://docs.moss.dev/docs/cookbook/airline-customer-agent.md).
