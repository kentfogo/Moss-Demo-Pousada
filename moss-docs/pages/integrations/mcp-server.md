<!-- Source: https://docs.moss.dev/docs/integrations/mcp-server.md -->
# MCP Server

> Connect Moss semantic search to any MCP-compatible AI client - Claude Desktop, Cursor, VS Code, and more.

Expose Moss semantic search and index management as tools for any [MCP](https://modelcontextprotocol.io/)-compatible client using `@moss-tools/mcp-server`. Your AI assistant can create indexes, add documents, and run sub-10ms semantic queries without leaving the conversation.

## Why use Moss with MCP?

MCP (Model Context Protocol) lets AI clients call external tools in a standardized way. The Moss MCP server gives any compatible client direct access to your knowledge base - no custom code, no API wrappers, no context window stuffing.

## Required tools

* [Moss](https://www.moss.dev/) account with project credentials
* [Node.js](https://nodejs.org/) 18+
* An MCP-compatible client (Claude Desktop, Cursor, VS Code, etc.)

## Integration guide

**1. Get your Moss credentials**

Sign in to the [Moss Portal](https://portal.usemoss.dev/auth/login) and copy your **Project ID**. Then open the project's **API Keys** page and create a key.

**2. Configure your MCP client**

Add the Moss MCP server to your client's configuration. Below are examples for common clients.

> [tab] Claude Desktop
>
> Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):
>
> ```json claude_desktop_config.json theme={null}
> {
>   "mcpServers": {
>     "moss": {
>       "command": "npx",
>       "args": ["-y", "@moss-tools/mcp-server"],
>       "env": {
>         "MOSS_PROJECT_ID": "your-project-id",
>         "MOSS_PROJECT_KEY": "your-project-key"
>       }
>     }
>   }
> }
> ```

> [tab] Cursor
>
> Add to your Cursor MCP settings (`.cursor/mcp.json`):
>
> ```json .cursor/mcp.json theme={null}
> {
>   "mcpServers": {
>     "moss": {
>       "command": "npx",
>       "args": ["-y", "@moss-tools/mcp-server"],
>       "env": {
>         "MOSS_PROJECT_ID": "your-project-id",
>         "MOSS_PROJECT_KEY": "your-project-key"
>       }
>     }
>   }
> }
> ```

> [tab] Direct usage
>
> Run the server directly from your terminal:
>
> ```bash theme={null}
> MOSS_PROJECT_ID=your-id MOSS_PROJECT_KEY=your-key npx @moss-tools/mcp-server
> ```

**3. Start using Moss from your AI client**

Once configured, your AI client can use Moss tools directly. Try prompts like:

* *"Create a Moss index called 'product-docs' with these FAQs..."*
* *"Search my 'product-docs' index for return policy information"*
* *"List all my Moss indexes"*
* *"Load the 'product-docs' index for faster queries"*

## Available tools

The MCP server exposes the following tools to your AI client:

### Search

| Tool | Description |
| :- | :- |
| `query` | Semantic search over an index. Returns matching documents ranked by similarity. The index must be loaded with `load_index` first; queries run locally (\~1-10ms). |
| `load_index` | Download an index into memory for fast local querying. Call this before querying an index repeatedly. |

### Index management

| Tool | Description |
| :- | :- |
| `create_index` | Create a new index with documents. Supports `moss-minilm` and `moss-mediumlm` embedding models. |
| `list_indexes` | List all indexes in the project. |
| `get_index` | Get metadata and status for a specific index. |
| `delete_index` | Delete an index and all its documents. |

### Document operations

| Tool | Description |
| :- | :- |
| `add_docs` | Add documents to an existing index. Supports upsert to update existing documents by ID. |
| `get_docs` | Retrieve documents from an index. Returns all documents if no IDs are specified. |
| `delete_docs` | Delete documents from an index by their IDs. |

### Jobs

| Tool | Description |
| :- | :- |
| `get_job_status` | Check the status of an async job (e.g., index builds triggered by other SDKs). |

## Configuration

### Environment variables

| Variable | Required | Description |
| :- | :- | :- |
| `MOSS_PROJECT_ID` | Yes | Your Moss project ID. |
| `MOSS_PROJECT_KEY` | Yes | Your Moss project key. |

You can optionally set `MOSS_CLOUD_API_BASE_URL` to override the API base URL. Defaults to `https://service.usemoss.dev`.
