<!-- Source: https://docs.moss.dev/docs/start/vibecoding.md -->
# Vibecoding with Moss

> Starter prompts, LLM-friendly docs, and MCP setup for building Moss-powered apps with AI coding tools.

Every page in these docs has a **Copy page** button paste any page directly into Claude, Cursor, ChatGPT, or your preferred AI coding tool to give it full context.

We publish an [`llms.txt`](https://llmstxt.org) file a compact, machine-readable index of all Moss documentation that AI tools can fetch at the start of a session.

> [card] [llms.txt](https://docs.moss.dev/llms.txt)
>
> Full index of Moss documentation in a format AI tools can parse

## MCP Server

The Moss MCP server lets any MCP compatible client Claude Desktop, Cursor, VS Code call Moss tools directly. No SDK code needed: your AI assistant can create indexes, add documents, and run semantic search queries from within the conversation.

```json theme={null}
{
  "mcpServers": {
    "moss": {
      "command": "npx",
      "args": ["-y", "@moss-tools/mcp-server"],
      "env": {
        "MOSS_PROJECT_ID": "your-project-id",
        "MOSS_PROJECT_KEY": "your-project-key"
      }
    }
  }
}
```

Add this to your client's config file - `~/Library/Application Support/Claude/claude_desktop_config.json` for Claude Desktop, or `.cursor/mcp.json` for Cursor. Get your Project ID and create a key on the API Keys page in the [Moss Portal](https://portal.usemoss.dev).

> [card] [MCP Server setup](https://docs.moss.dev/docs/integrations/mcp-server.md)
>
> Full setup guide with client-specific instructions and available tools

## Starter Prompt for Vibecoding

Paste this into your AI coding tool before starting a Moss project.

```
You are helping me build an application that uses Moss for real-time semantic search.

## About Moss
Moss is a semantic search runtime for conversational AI with sub-10ms local queries, instant index
updates, same SDK for browser, on-device, and cloud. No separate search infrastructure needed.

## Documentation
- Quickstart:    https://docs.moss.dev/docs/start/quickstart
- Core concepts: https://docs.moss.dev/docs/start/core-concepts
- SDK reference: https://docs.moss.dev/docs/reference/sdk
- API reference: https://docs.moss.dev/api-reference/v1
- MCP server:    https://docs.moss.dev/docs/integrations/mcp-server
- Full doc index (LLM-friendly): https://docs.moss.dev/llms.txt

## Setup
- JS package: @moss-js/moss 1.9.0+  |  Python package: moss 1.9.0+
- Credentials: MOSS_PROJECT_ID from the project page and MOSS_PROJECT_KEY from the API Keys page at https://portal.usemoss.dev

## Key concepts
- createIndex / loadIndex / query is the core flow - see the quickstart for full examples
- Hybrid search: pass alpha (0.0 = keyword, 1.0 = semantic, default 0.8) to query()
- Mutations (createIndex, addDocs, deleteDocs) are async jobs; SDK polls until completion
- Embedding models: moss-minilm (fast, default), moss-mediumlm (higher accuracy), custom (bring your own vectors)
- Metadata filtering on local indexes: $eq, $ne, $in, $gt, $lt, $and, $or operators

## Common errors
- Unauthorized: missing or wrong MOSS_PROJECT_ID / MOSS_PROJECT_KEY
- Index not found: call createIndex() before loading or querying
- Index not loaded: call loadIndex() before query() - query() throws if the index isn't loaded locally
- Missing embeddings runtime: use moss-minilm or moss-mediumlm unless supplying custom vectors
```

## Go deeper

> [card] [Quickstart](https://docs.moss.dev/docs/start/quickstart.md)
>
> Working index and query in under 5 minutes

> [card] [Core Concepts](https://docs.moss.dev/docs/start/core-concepts.md)
>
> Indexes, documents, embeddings, and hybrid search

> [card] [MCP Server](https://docs.moss.dev/docs/integrations/mcp-server.md)
>
> Use Moss tools directly from Claude Desktop or Cursor

> [card] [Voice Agent (LiveKit)](https://docs.moss.dev/docs/build/voice-agent-livekit.md)
>
> Inject real-time context into a voice agent pipeline
