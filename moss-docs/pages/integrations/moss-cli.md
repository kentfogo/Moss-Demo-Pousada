<!-- Source: https://docs.moss.dev/docs/integrations/moss-cli.md -->
# Moss CLI

> Manage indexes, documents, and queries from the terminal

Manage indexes, documents, and queries from the terminal.

```bash theme={null}
pip install moss-cli
```

The installed binary is `moss`.

## Authentication

The index, document, job and query commands use project credentials, resolved in this order:

1. CLI flags: `--project-id` and `--project-key`
2. Environment variables: `MOSS_PROJECT_ID` and `MOSS_PROJECT_KEY`
3. Config file: `~/.moss/config.json`, written by `moss init`

```bash theme={null}
# Interactive setup (recommended)
moss init

# Environment variables
export MOSS_PROJECT_ID="your-project-id"
export MOSS_PROJECT_KEY="your-project-key"

# Inline flags, before the command
moss --project-id "..." --project-key "..." index list
```

`moss init` asks before it replaces saved credentials, unless you pass `--force`. It keeps a
token saved by `moss login`.

## Quick start

```bash theme={null}
# 1. Save credentials
moss init

# 2. List indexes
moss index list

# 3. Create an index from a JSON file
moss index create my-index -f docs.json --wait

# 4. Search it
moss query my-index "what is machine learning"
```

## Log in and manage keys

`moss login` connects the CLI to your Moss account, so you can list your projects and manage
project keys from the terminal. These commands use a CLI token instead of a project key.

```bash theme={null}
# Approve the login in the browser. The CLI token is saved to ~/.moss/config.json
moss login
moss login --no-browser    # print the link instead, for example over SSH

# Show the account the token belongs to
moss whoami

# Projects in the workspaces you belong to, with your role in each
moss projects list

# Project keys. keys create shows the secret only once.
moss keys create --project <project-id> --name "prod server"
moss keys list --project <project-id>
moss keys delete <key-id> --project <project-id>

# Revoke the saved token and remove it from ~/.moss/config.json
moss logout
```

| Flag | Description |
| - | - |
| `--no-browser` | `login`: print the link instead of opening a browser |
| `--print-token` | `login`: print a new token for an agent instead of saving it. Your saved login is kept |
| `--name` | `login`: token name shown in Settings. `keys create`: key label |
| `--project` | `keys`: project ID. Defaults to `--project-id`, `MOSS_PROJECT_ID`, then the project saved by `moss init` |
| `--confirm` / `-y` | `keys delete`: skip the confirmation prompt |
| `--json` | Machine-readable JSON output. `keys delete --json` does not prompt |

The CLI token comes from `--token`, then `MOSS_TOKEN`, then the token `moss login` saved. It
acts as you, and you can revoke it in Settings > API Keys.

### Agents and CI

CI that only queries or uploads to one project needs a project key, not a login. Create one with
`moss keys create` and store it as `MOSS_PROJECT_ID` and `MOSS_PROJECT_KEY`. An agent that
creates or deletes keys needs its own CLI token, so logging in or out on your machine doesn't
affect it:

```bash theme={null}
# Approve in the browser. The token is printed, not saved.
moss login --print-token --name "deploy agent"

# In the agent's environment
export MOSS_TOKEN="..."
moss keys create --project <project-id> --json
```

`--api-url` or `MOSS_API_URL` points `login`, `whoami`, `projects` and `keys` at another
dashboard, such as staging. The saved token is only sent to the dashboard that issued it, so
log in there with `moss --api-url <url> login`, or pass `--token`. A `--token` or `MOSS_TOKEN`
goes to `https://portal.usemoss.dev` unless `--api-url` or `MOSS_API_URL` names another one.

## Index management

```bash theme={null}
# Create
moss index create my-index -f documents.json --model moss-minilm
moss index create my-index -f documents.json --wait

# List
moss index list

# Inspect
moss index get my-index

# Delete
moss index delete my-index
moss index delete my-index --confirm     # skip prompt
```

| Flag | Description |
| - | - |
| `--file` / `-f` | Path to JSON/CSV document file, or `-` for stdin |
| `--model` / `-m` | Embedding model (default: `moss-minilm`) |
| `--wait` / `-w` | Block until the build job finishes |
| `--poll-interval` | Seconds between status checks (default: `2.0`) |
| `--confirm` / `-y` | Skip confirmation prompt on delete |

## Document management

```bash theme={null}
# Add documents
moss doc add my-index -f new-docs.json
moss doc add my-index -f docs.json --upsert --wait

# Retrieve documents
moss doc get my-index
moss doc get my-index --ids doc1,doc2,doc3

# Delete documents
moss doc delete my-index --ids doc1,doc2
```

| Flag | Description |
| - | - |
| `--file` / `-f` | Path to JSON/CSV document file, or `-` for stdin |
| `--upsert` / `-u` | Update documents that already exist |
| `--ids` / `-i` | Comma-separated document IDs |
| `--wait` / `-w` | Block until the job finishes |

## Query

`moss query` downloads the index and queries it on-device.

```bash theme={null}
# Query (downloads the index first)
moss query my-index "what is deep learning"

# Tune results
moss query my-index "neural networks" --top-k 20 --alpha 0.3

# Metadata filter
moss query my-index "shoes" --filter '{"field": "category", "condition": {"$eq": "footwear"}}'

# Pipe from stdin
echo "what is AI" | moss query my-index

# JSON output for scripting
moss --json query my-index "query" | jq '.docs[0].text'
```

| Flag | Description |
| - | - |
| `--top-k` / `-k` | Number of results (default: `10`) |
| `--alpha` / `-a` | Semantic weight; `0.0` is pure keyword, `1.0` is pure semantic (default: `0.8`) |
| `--filter` | Metadata filter as a JSON string |

## Job tracking

```bash theme={null}
# Check status
moss job status <job-id>

# Wait with live progress
moss job status <job-id> --wait
```

## Document file formats

### JSON

```json theme={null}
[
  {"id": "doc1", "text": "Machine learning fundamentals", "metadata": {"topic": "ml"}},
  {"id": "doc2", "text": "Deep learning with neural networks"},
  {"id": "doc3", "text": "Natural language processing", "metadata": {"topic": "nlp"}}
]
```

A wrapper form is also accepted: `{"documents": [...]}`.

### CSV

```csv theme={null}
id,text,metadata
doc1,Machine learning fundamentals,"{""topic"": ""ml""}"
doc2,Deep learning with neural networks,
doc3,Natural language processing,"{""topic"": ""nlp""}"
```

### stdin

```bash theme={null}
cat docs.json | moss index create my-index -f -
cat docs.json | moss doc add my-index -f -
```

## Global options

Global options go before the command, as in `moss --json index list`.

| Flag | Short | Description |
| - | - | - |
| `--project-id` | `-p` | Project ID; overrides `MOSS_PROJECT_ID` and config |
| `--project-key` | | Project key; overrides `MOSS_PROJECT_KEY` and config |
| `--token` | | CLI token from `moss login`; overrides `MOSS_TOKEN` and the saved login |
| `--api-url` | | Dashboard URL for `login`, `whoami`, `projects` and `keys`, such as staging; overrides `MOSS_API_URL` |
| `--json` | | Machine-readable JSON output |
| `--verbose` | `-v` | Enable debug logging |

## Models

| Model | Description |
| - | - |
| `moss-minilm` | Lightweight, optimized for speed (default) |
| `moss-mediumlm` | Higher accuracy with reasonable performance |
| `custom` | Used automatically when documents include pre-computed embeddings |
