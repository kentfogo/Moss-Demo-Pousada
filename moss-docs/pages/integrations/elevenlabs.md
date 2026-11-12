<!-- Source: https://docs.moss.dev/docs/integrations/elevenlabs.md -->
# ElevenLabs

> Add real-time knowledge base access to ElevenLabs Conversational AI agents with Moss semantic search.

Integrate Moss semantic search into an [ElevenLabs](https://elevenlabs.io/) Conversational AI agent using the `elevenlabs-moss` package. This setup gives your voice agent real-time access to a knowledge base during live conversations, with sub-10ms retrieval that keeps responses natural and fluid.

> **Note:** For a complete working example, see the [elevenlabs-moss app](https://github.com/usemoss/moss/tree/main/apps/elevenlabs-moss).

## Why use Moss with ElevenLabs?

ElevenLabs Conversational AI agents support client tools that run during live voice sessions. Moss plugs into this system to deliver instant knowledge base lookups, so your agent can answer questions accurately without noticeable delays or hallucination.

## Required tools

* [Moss](https://www.moss.dev/) account with project credentials
* [ElevenLabs](https://elevenlabs.io/) account with a Conversational AI agent
* [Python](https://www.python.org/) 3.10+

## Integration guide

**1. Installation**

```bash theme={null}
pip install elevenlabs-moss
```

**2. Environment setup**

Create a `.env` file in your project root with your credentials.

```bash .env theme={null}
# Moss Credentials
MOSS_PROJECT_ID=your_project_id
MOSS_PROJECT_KEY=your_project_key
MOSS_INDEX_NAME=support-docs

# ElevenLabs Credentials
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_agent_id
```

**3. Configure the ElevenLabs agent**

In the [ElevenLabs dashboard](https://elevenlabs.io/):

1. Open your Conversational AI agent settings
2. Navigate to **Tools** and add a new **Client** tool
3. Set **Tool name** to `search_knowledge_base` (case-sensitive)
4. Add a parameter: **name** = `query`, **type** = `string`, **required** = `true`
5. Set the parameter description to: "The user's question to search the knowledge base for"
6. Enable **Wait for response** so tool output feeds back into the conversation

**4. Register the Moss tool**

Create a `MossClientTool`, load the index, and register it with ElevenLabs `ClientTools`.

```python theme={null}
from elevenlabs.conversational_ai.conversation import ClientTools, Conversation
from elevenlabs.conversational_ai.default_audio_interface import DefaultAudioInterface
from elevenlabs import ElevenLabs
from elevenlabs_moss import MossClientTool

# Create and configure the Moss tool
moss_tool = MossClientTool(
    index_name="support-docs",
    tool_name="search_knowledge_base",
    top_k=3,
)

# Pre-load the index for fast queries
await moss_tool.load_index()

# Register with ElevenLabs ClientTools
client_tools = ClientTools()
moss_tool.register(client_tools)

# Start the conversation
conversation = Conversation(
    client=ElevenLabs(api_key="your-api-key"),
    agent_id="your-agent-id",
    requires_auth=False,
    audio_interface=DefaultAudioInterface(),
    client_tools=client_tools,
)
conversation.start_session()
```

## Configuration

### MossClientTool

| Parameter | Type | Default | Description |
| :- | :- | :- | :- |
| `project_id` | `str` | `None` | Your Moss Project ID. Falls back to `MOSS_PROJECT_ID` env var. |
| `project_key` | `str` | `None` | Your Moss Project Key. Falls back to `MOSS_PROJECT_KEY` env var. |
| `index_name` | `str` | Required | The name of the Moss index to query. |
| `tool_name` | `str` | `"search_knowledge_base"` | ElevenLabs tool name. Must match the name configured in the dashboard (case-sensitive). |
| `top_k` | `int` | `5` | Number of results to retrieve per query. |
| `alpha` | `float` | `0.8` | Hybrid search weighting. `0.0` = keyword only, `1.0` = semantic only. |
| `result_prefix` | `str` | `"Relevant knowledge base results:\n\n"` | Prefix added before formatted results. |
