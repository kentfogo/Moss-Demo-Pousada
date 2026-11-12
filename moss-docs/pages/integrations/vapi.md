<!-- Source: https://docs.moss.dev/docs/integrations/vapi.md -->
# VAPI

> Connect Moss semantic search to VAPI voice agents via a Custom Knowledge Base webhook.

Integrate Moss semantic search into a [VAPI](https://vapi.ai/) voice agent using the `vapi-moss` package. VAPI sends knowledge-base requests to your endpoint, where Moss searches a loaded index and returns documents for the assistant to use.

> **Note:** See the [vapi-moss app source](https://github.com/usemoss/moss/tree/main/apps/vapi-moss) for an endpoint example. Match its assistant configuration and authentication to the current VAPI contract below; this guide does not establish a tested end-to-end voice call.

## Why use Moss with VAPI?

Moss runs retrieval in your webhook application's process after the index is loaded. VAPI requests knowledge-base information when the assistant needs it; retrieval is not guaranteed on every user turn. Network time, model generation and audio processing also affect the complete voice response.

## Required tools

* [Moss](https://www.moss.dev/) account with project credentials
* [VAPI](https://vapi.ai/) account with a Conversational AI agent
* [Python](https://www.python.org/) 3.10+

## Integration guide

**1. Installation**

```bash theme={null}
pip install vapi-moss
```

**2. Environment setup**

Create a `.env` file in your project root with your credentials.

```bash .env theme={null}
# Moss Credentials
MOSS_PROJECT_ID=your_project_id
MOSS_PROJECT_KEY=your_project_key
MOSS_INDEX_NAME=your_index_name

# Endpoint authentication
# Provision the server-side secret/token for the VAPI Custom Credential
# you configure below. Never expose project or endpoint secrets to clients.
```

**3. Load and search your index**

Use `MossVapiSearch` in your asynchronous application. Load the index at server startup, then call `search()` from the authenticated request handler. The snippet below shows retrieval, not a complete HTTP server or voice call.

```python theme={null}
from vapi_moss import MossVapiSearch

# Initialize the search client
search = MossVapiSearch(
    index_name="my-faq-index",
    top_k=5,
    alpha=0.8,
)

# Load the index at startup
await search.load_index()

# Search
result = await search.search("How do I return an item?")
print(result.documents)    # [{"content": "...", "similarity": 0.92}, ...]
print(result.time_taken_ms)
```

**4. Implement and authenticate the endpoint**

Expose a public HTTPS POST endpoint that handles `message.type: "knowledge-base-request"`. Extract the query from the conversation messages, authenticate the request, then use `search()` to retrieve documents. Return a JSON object containing a `documents` array:

```json theme={null}
{
  "documents": [
    {
      "content": "An illustrative passage from your indexed knowledge base.",
      "similarity": 0.92
    }
  ]
}
```

This is a response-format illustration, not an observed search result. If you include `uuid`, it must be a UUID v4; omit it when your source IDs use another format. See VAPI's [custom endpoint contract](https://docs.vapi.ai/knowledge-base/implement-custom-endpoint).

Create a [VAPI Custom Credential](https://docs.vapi.ai/server-url/server-authentication) for the endpoint and make your server validate the selected authentication method before retrieval. For example, a Bearer Token credential can send `Authorization: Bearer <token>`. HMAC credentials require validation of their configured signing header, algorithm and payload format; setting a secret alone does not establish that format.

**5. Configure the assistant through the VAPI API**

Set `model.knowledgeBase` in the [assistant API](https://docs.vapi.ai/api-reference/assistants/update) to a custom knowledge base with your server URL and credential ID. The following object is the **value of `model.knowledgeBase`**, not a complete assistant update:

```json theme={null}
{
  "provider": "custom-knowledge-base",
  "server": {
    "url": "https://your-server.com/kb/search",
    "credentialId": "YOUR_VAPI_CUSTOM_CREDENTIAL_ID"
  }
}
```

Preserve the existing model configuration, including its provider, model, messages and tools, when updating the assistant. Use the current embedded `model.knowledgeBase` configuration; the standalone `/knowledge-base` endpoint and `model.knowledgeBaseId` were removed in VAPI's [September 2025 API cleanup](https://docs.vapi.ai/whats-new/2025/9/29).

## Configuration

### MossVapiSearch

| Parameter | Type | Default | Description |
| :- | :- | :- | :- |
| `project_id` | `str` | `None` | Your Moss Project ID. Falls back to `MOSS_PROJECT_ID` env var. |
| `project_key` | `str` | `None` | Your Moss Project Key. Falls back to `MOSS_PROJECT_KEY` env var. |
| `index_name` | `str` | Required | The name of the Moss index to query. |
| `top_k` | `int` | `5` | Number of results to retrieve per query. |
| `alpha` | `float` | `0.8` | Hybrid search weighting. `0.0` = keyword only, `1.0` = semantic only. |

### Optional raw-body HMAC helper

`vapi-moss` also exports `verify_vapi_signature(raw_body, signature_header, secret)`. This helper checks a SHA-256 HMAC over the raw request body against a hexadecimal signature, with an optional `sha256=` prefix. Use it only when the VAPI HMAC credential is configured to produce that exact format and your endpoint reads its configured signature header.

The helper does not validate Bearer tokens or a timestamp-based signing format. For other credential settings, implement the matching validator from VAPI's [authentication guidance](https://docs.vapi.ai/server-url/server-authentication). Do not assume all VAPI knowledge-base requests carry a fixed `x-vapi-signature` header.
