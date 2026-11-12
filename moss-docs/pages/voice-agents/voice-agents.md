<!-- Source: https://docs.moss.dev/docs/voice-agents/voice-agents.md -->
# Voice Agents

> Build and deploy AI voice agents with Moss

Moss provides three layers for building voice agents: an **Agent SDK** (Python) for agent logic, a **Backend SDK** (Node.js or Python) that your web app uses to mint session tokens, and an **Agent CLI** for deployment.

## Agent SDK

`moss-voice-agent-manager`: Python package for building voice agents. Handles STT, LLM, and TTS provider configuration automatically.

```bash theme={null}
pip install moss-voice-agent-manager
```

### Basic Agent

```python theme={null}
from moss_voice_agent_manager import (
    Agent, MossAgentSession, MossConfig, JobContext, AutoSubscribe,
    WorkerOptions, WorkerType, RunContext, cli, llm,
)

class MyAgent(Agent):
    instructions = "You are a helpful assistant."

    @llm.function_tool
    async def lookup(self, context: RunContext, query: str) -> str:
        """Look up information."""
        return "results..."

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    session = MossAgentSession(userdata=None, ctx=ctx, max_tool_steps=10)
    await session.start(agent=MyAgent(), room=ctx.room)

def run():
    moss_config = MossConfig.from_platform()
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint,
        ws_url=moss_config.platform_ws_url,
        api_key=moss_config.platform_api_key,
        api_secret=moss_config.platform_api_secret,
        agent_name=moss_config.voice_agent_name,
        worker_type=WorkerType.ROOM,
        prewarm_fnc=MossAgentSession.prewarm,
    ))

if __name__ == "__main__":
    run()
```

### Multi-Agent Transfers

Define multiple agents and transfer between them using function tools:

```python theme={null}
from moss_voice_agent_manager import Agent, RunContext, llm

class GreeterAgent(Agent):
    instructions = "Welcome the user, then call transfer_to_support."

    def __init__(self):
        super().__init__(instructions=self.instructions, tools=[transfer_to_support])

class SupportAgent(Agent):
    instructions = "Help the user with their issue."

@llm.function_tool()
async def transfer_to_support(context: RunContext) -> Agent:
    """Hand off to the support agent."""
    # userdata.agents is a dict you populate at session start
    return context.userdata.agents["support"]
```

### TTS Customization

Override platform TTS defaults per session:

```python theme={null}
from moss_voice_agent_manager import MossAgentSession, SessionOptions, TTSOptions

session = MossAgentSession(
    userdata=None,
    options=SessionOptions(
        tts=TTSOptions(model="sonic-2", voice="custom-voice-id", language="en")
    ),
)
```

### Key Exports

| Export | Description |
| - | - |
| `MossAgentSession` | Agent session with auto-configured providers |
| `Agent` | Base class for agent behavior and instructions |
| `RunContext` | Context passed to tool functions |
| `llm.function_tool` | Decorator for agent tools |
| `SessionOptions` / `TTSOptions` | TTS override options |
| `MossConfig` | Platform configuration |
| `WorkerOptions` / `cli` | Worker lifecycle management |

### Session Transcripts

Store session transcripts so they can be downloaded later via `moss-agent transcripts download`. Call `submit_session_report` in a shutdown callback to capture the transcript when a session ends.

Requires `moss-voice-agent-manager>=1.0.0b14`.

```python theme={null}
session = MossAgentSession(userdata=None, ctx=ctx, max_tool_steps=10)

async def on_shutdown():
    await session.submit_session_report(ctx, ctx.room.name)

ctx.add_shutdown_callback(on_shutdown)
```

***

## Backend SDK

Your frontend should never hold LiveKit API secrets. Mint short-lived participant tokens from your backend and return them to the browser. Pick the package that matches your server stack.

> [tab] Node.js
>
> `@moss-tools/voice-server`: Use in Next.js, Express, or any Node.js server.
>
> ```bash theme={null}
> npm install @moss-tools/voice-server
> ```
>
> #### Next.js API Route
>
> ```typescript theme={null}
> import { MossVoiceServer } from "@moss-tools/voice-server";
> import { NextResponse } from "next/server";
>
> let server: Awaited<ReturnType<typeof MossVoiceServer.create>> | null = null;
>
> async function getServer() {
>   if (!server) {
>     server = await MossVoiceServer.create({
>       projectId: process.env.MOSS_PROJECT_ID!,
>       projectKey: process.env.MOSS_PROJECT_KEY!,
>       voiceAgentId: process.env.MOSS_VOICE_AGENT_ID!,
>     });
>   }
>   return server;
> }
>
> export async function POST() {
>   const srv = await getServer();
>   const roomName = `session-${Date.now()}`;
>   const identity = `user-${Math.random().toString(36).slice(2, 8)}`;
>
>   const token = await srv.createParticipantToken(
>     { identity, name: "User" },
>     roomName,
>     srv.getAgentName()
>   );
>
>   return NextResponse.json({ token, serverUrl: srv.getServerUrl() });
> }
> ```
>
> #### API Reference
>
> | Method | Description |
> | - | - |
> | `MossVoiceServer.create(config)` | Initialize with Moss credentials. Caches credentials. |
> | `server.createParticipantToken(userInfo, roomName, agentName?)` | Generate a signed JWT (15-min TTL) for a participant. |
> | `server.getServerUrl()` | Returns the WebSocket URL for client connections. |
> | `server.getAgentName()` | Returns the configured agent name. |

> [tab] Python
>
> `moss-voice-server`: Use in FastAPI, Flask, Django, or any Python server. Both async and sync APIs are provided.
>
> ```bash theme={null}
> pip install moss-voice-server
> ```
>
> #### FastAPI Route
>
> ```python theme={null}
> import os
> from contextlib import asynccontextmanager
> from fastapi import FastAPI
> from moss_voice_server import MossVoiceServer, ParticipantInfo
>
>
> @asynccontextmanager
> async def lifespan(app: FastAPI):
>     app.state.voice_server = await MossVoiceServer.create(
>         project_id=os.environ["MOSS_PROJECT_ID"],
>         project_key=os.environ["MOSS_PROJECT_KEY"],
>         voice_agent_id=os.environ["MOSS_VOICE_AGENT_ID"],
>     )
>     yield
>
>
> app = FastAPI(lifespan=lifespan)
>
>
> @app.post("/voice/token")
> async def issue_token(user_id: str, room: str) -> dict[str, str]:
>     server: MossVoiceServer = app.state.voice_server
>     token = server.create_participant_token(
>         ParticipantInfo(identity=user_id, name="User"),
>         room_name=room,
>         agent_name=server.get_agent_name(),
>     )
>     return {"token": token, "server_url": server.get_server_url()}
> ```
>
> For Flask or Django, use `MossVoiceServerSync.create(...)` - same arguments, blocking initialization.
>
> #### API Reference
>
> | Method | Description |
> | - | - |
> | `MossVoiceServer.create(...)` / `MossVoiceServerSync.create(...)` | Initialize with Moss credentials. Async for FastAPI; sync for Flask/Django. |
> | `server.create_participant_token(participant, room_name, agent_name=None)` | Generate a signed JWT (15-min TTL). Sync on both flavors. |
> | `server.get_server_url()` | Returns the WebSocket URL for client connections. |
> | `server.get_agent_name()` | Returns the configured agent name. |

***

## Agent CLI

`moss-agent-cli`: Deploy and manage voice agents from the command line.

```bash theme={null}
pip install moss-agent-cli
```

### Deploy

```bash theme={null}
cd your-agent-directory
moss-agent deploy
```

The CLI validates your agent, fetches deployment credentials, and builds and deploys it.

Your local `.env` file is intentionally **excluded** from the deployment package. Use `moss-agent env push` (below) to make those values available to the running agent.

### Push Env Vars

Requires `moss-agent-cli>=0.4.0`.

Upload runtime environment variables to the deployed agent:

```bash theme={null}
moss-agent env push                       # uses ./.env
moss-agent env push --env-file .env.prod  # custom file
```

Pushing restarts the running agent. Run this after every `moss-agent deploy`, after rotating provider keys, or whenever you change runtime configuration. Pass `--no-overwrite` to fail-fast on any pre-existing keys instead of replacing them.

### Stream Logs

```bash theme={null}
moss-agent logs
moss-agent logs --log-type build
```

### Transcripts

Requires `moss-agent-cli>=0.3.0`.

List recent voice agent sessions:

```bash theme={null}
moss-agent transcripts list
moss-agent transcripts list --period 3d
moss-agent transcripts list --from 2026-03-01 --to 2026-03-15
```

Download session transcripts:

```bash theme={null}
moss-agent transcripts download
moss-agent transcripts download --session-id <session-id>
moss-agent transcripts download --output ./transcripts --format json
```

### Agent Directory Structure

```
my-agent/
├── agent.py           # Entry point (or main.py)
├── requirements.txt   # Must include moss-voice-agent-manager
└── .env               # Local-only - read by the CLI; push to the agent with `moss-agent env push`
```

***

## Environment Variables

All three packages use the same credentials:

| Variable | Description |
| - | - |
| `MOSS_PROJECT_ID` | Your Moss project ID |
| `MOSS_PROJECT_KEY` | Your Moss project API key |
| `MOSS_VOICE_AGENT_ID` | The voice agent ID |

## Requirements

* **Agent SDK / CLI**: Python 3.10+
* **Backend SDK**: Node.js 18+ (`@moss-tools/voice-server`) or Python 3.10+ (`moss-voice-server`)
