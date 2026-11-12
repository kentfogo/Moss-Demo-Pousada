<!-- Source: https://docs.moss.dev/docs/integrate/indexing-data.md -->
# Indexing Data

> Prepare and upsert your content into Moss indexes

## Data model

Each document has an `id` and `text` (plus optional metadata). Use `moss-minilm` as the default model.

## Examples

```ts JavaScript theme={null}
import { MossClient } from '@moss-js/moss'
const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
await client.createIndex('my-index', [
  { id: 'doc-1', text: '...', metadata: { category: 'faq', tags: 'returns,shipping', lang: 'en' } },
  { id: 'doc-2', text: '...' }
], { modelId: 'moss-minilm' })

// Upsert more docs later
await client.addDocs('my-index', [
  { id: 'doc-2', text: 'updated text' }, // will be updated
  { id: 'doc-3', text: 'new text' }
], { upsert: true })

// Fetch specific docs
const subset = await client.getDocs('my-index', { docIds: ['doc-1', 'doc-3'] })

// Delete docs or the index when done
await client.deleteDocs('my-index', ['doc-3'])
await client.deleteIndex('my-index')
```

```python Python theme={null}
from moss import MossClient, DocumentInfo, MutationOptions, GetDocumentsOptions

client = MossClient(project_id, project_key)
await client.create_index('my-index', [
    DocumentInfo(id='doc-1', text='...', metadata={'category': 'faq', 'tags': 'returns,shipping', 'lang': 'en'}),
    DocumentInfo(id='doc-2', text='...')
], 'moss-minilm')

# Upsert more docs later
await client.add_docs('my-index', [
    DocumentInfo(id='doc-2', text='updated text'),
    DocumentInfo(id='doc-3', text='new text')
], MutationOptions(upsert=True))

# Fetch specific docs
subset = await client.get_docs('my-index', GetDocumentsOptions(doc_ids=['doc-1', 'doc-3']))

# Delete docs or the index when done
await client.delete_docs('my-index', ['doc-3'])
await client.delete_index('my-index')
```

## From JSON or TXT files

JSON and text files don't need server-side parsing: read them in your code and pass the
contents to `createIndex` / `create_index` or `addDocs` / `add_docs` as documents. A JSON array
of `{id, text, metadata}` records maps one to one; metadata values must be strings (Python
1.18.0+ converts numbers and booleans in dict and JSON input, see below). Split text files into
passages (see [Chunking tips](#chunking-tips)) rather than indexing a whole file as
one document. In Python, `create_index` and `add_docs` can also take the JSON or the file itself,
and can chunk text for you; see [Python: JSON, JSON Lines and files](#python-json-json-lines-and-files).

```ts JavaScript theme={null}
import { readFile } from 'node:fs/promises'
import { MossClient } from '@moss-js/moss'

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

// JSON: [{ "id": "faq-1", "text": "...", "metadata": { "category": "billing" } }, ...]
const docs = JSON.parse(await readFile('faqs.json', 'utf8'))
await client.createIndex('my-index', docs, { modelId: 'moss-minilm' })

// TXT: one document per paragraph
const paragraphs = (await readFile('policies.txt', 'utf8'))
  .split('\n\n')
  .map((p) => p.trim())
  .filter(Boolean)
await client.addDocs('my-index', paragraphs.map((text, i) => ({
  id: `policies-${i}`,
  text,
  metadata: { source: 'policies.txt' },
})))
```

```python Python theme={null}
import json
from pathlib import Path
from moss import MossClient, DocumentInfo

client = MossClient(project_id, project_key)

# JSON: [{"id": "faq-1", "text": "...", "metadata": {"category": "billing"}}, ...]
records = json.loads(Path('faqs.json').read_text(encoding='utf-8'))
docs = [DocumentInfo(id=str(r['id']), text=r['text'], metadata=r.get('metadata')) for r in records]
await client.create_index('my-index', docs, 'moss-minilm')

# TXT: one document per paragraph
text = Path('policies.txt').read_text(encoding='utf-8')
paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
await client.add_docs('my-index', [
    DocumentInfo(id=f'policies-{i}', text=p, metadata={'source': 'policies.txt'})
    for i, p in enumerate(paragraphs)
])
```

### Python: JSON, JSON Lines and files

In Python, `create_index`, `add_docs` and `SessionIndex.add_docs` take JSON, dicts and file
paths directly, so the code above is optional. *(moss 1.18.0+)*

```python theme={null}
from pathlib import Path

# JSON array or JSON Lines text, or a .json, .jsonl or .ndjson file
await client.create_index("faqs", '[{"id": "1", "text": "Track your order in your account."}]')
await client.create_index("faqs-jsonl", Path("faqs.jsonl"))  # one JSON object per line

# Dicts with the DocumentInfo fields
await client.add_docs("faqs", [{"id": "2", "text": "30-day returns.", "metadata": {"days": 30}}])

# Text and markdown files are chunked for you, into handbook.md#0, handbook.md#1, ...
await client.create_index("handbook", [Path("docs/handbook.md"), Path("docs/faq.txt")])
```

* A `str` is always read as JSON text, so wrap file paths in `pathlib.Path`. Supported files are `.json`, `.jsonl`, `.ndjson`, `.txt`, `.md` and `.markdown`; use `create_index_from_files` for PDF and DOCX.
* Each JSON record has an `id` and `text`, plus optional `metadata`, `embedding` and `payload`. Integer ids become strings, and number and boolean metadata values are stored as strings: booleans as `"true"` and `"false"`.
* Chunks of a `.txt` or `.md` file get the ids `{path}#{n}` and the metadata `parentId`. Markdown chunks start with their heading path, such as `Returns > Refunds`, and front matter is not indexed. Pass relative paths for stable ids.
* Re-ingesting a file that now has fewer chunks leaves its old higher-numbered chunks in the index; remove them with `delete_docs`. A document's `payload` is copied onto every chunk.

Pass `chunking=` to tune the native chunker. With it, `DocumentInfo`, dict and JSON input is chunked too, which is how you split documents that you add yourself:

```python theme={null}
from pathlib import Path
from moss import Chunking

# chunk_size 200 to 2000 characters (default 1200), chunk_overlap 0 to half of chunk_size (default 200),
# mode "pages" or "sentences", markdown_header_depth 1 to 6
await client.create_index("kb", Path("notes.md"), chunking=Chunking(chunk_size=800, chunk_overlap=100))
await client.add_docs("kb", [{"id": "policy", "text": long_text}], chunking=Chunking())
```

Pass `chunker=` instead to split the text yourself. It is a synchronous function from a document's text to a list of chunk strings, it runs for every document, files included, and each chunk may have at most 2,000 characters. Pass `chunker` or `chunking`, not both, and neither with `model_id="custom"`.

```python theme={null}
await client.create_index("kb", Path("notes.md"), chunker=lambda text: text.split("\n---\n"))
```

See [`Chunking`](https://docs.moss.dev/docs/reference/python/interfaces/Chunking) for the limits, defaults and errors.

## From files (PDF and DOCX)

Build an index directly from raw documents - the server parses, chunks, and embeds them.
Up to 20 files per call, 50 MB per file. Parsed document pages count against your plan's
monthly allowance; see [Pricing & Limits](https://docs.moss.dev/docs/pricing.md). When the allowance is used up on a
plan without overage billing, `createIndexFromFiles` fails with `429 USAGE_LIMIT_EXCEEDED` at
init or at confirm; a denial at confirm marks the job failed. PDF pages are counted before
parsing. A PDF that cannot be page-counted before parsing (larger than 10 MB, unreadable, or
past the page-counting budget of 200 MB or 20 seconds per request) is also denied on those
plans. A confirm denied because your organization is running its maximum number of crawl and
parse jobs leaves the job open: retry the confirm once a job finishes.

```ts JavaScript theme={null}
await client.createIndexFromFiles('contracts', [
  { name: 'report.pdf', contentType: 'application/pdf', path: '/docs/report.pdf' },
], { parseOptions: { ocrMode: 'full_ocr' } }) // full_ocr for scanned documents
```

```python Python theme={null}
from moss import ParseFileInput, ParseOptions

await client.create_index_from_files('contracts', [
    ParseFileInput(name='report.pdf', content_type='application/pdf', path='/docs/report.pdf'),
], parse_options=ParseOptions(ocr_mode='full_ocr'))
```

See [Index from files](https://docs.moss.dev/docs/reference/js/files.md) for parse options, limits, and querying notes.

## From a website

Register a site as a web source and Moss crawls it into an index - optionally on a daily or
weekly refresh schedule (scheduled refresh requires the Startup plan or above; omit
`refreshCadence` on Developer and Hobbyist and re-sync manually on Hobbyist). Linked PDF and
DOCX files found during the crawl are parsed into the same index.

An index can hold up to 20 web sources. Each site is crawled and refreshed on its own, and a
crawl only replaces that source's pages, so several sites can share one index together with
documents you add directly. The first source creates the index; later ones add to it, and a
crawl requested while another is running on the index simply queues behind it.

```ts JavaScript theme={null}
import { MossClient } from '@moss-js/moss' // 1.10.0+

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

const docs = await client.createWebSource('https://docs.yoursite.com', 'support-kb', {
  maxPages: 500,
  refreshCadence: 'weekly',
})
const blog = await client.createWebSource('https://blog.yoursite.com', 'support-kb', {
  maxPages: 200,
})
// Poll docs.jobId and blog.jobId with client.getJobStatus until status is 'completed'
```

```python Python theme={null}
from moss import MossClient  # 1.10.0+

client = MossClient(project_id, project_key)

docs = await client.create_web_source('https://docs.yoursite.com', 'support-kb',
                                      max_pages=500, refresh_cadence='weekly')
blog = await client.create_web_source('https://blog.yoursite.com', 'support-kb',
                                      max_pages=200)
# Poll docs.job_id and blog.job_id with client.get_job_status until status.value == 'completed'
```

```bash curl theme={null}
curl -X POST "https://service.usemoss.dev/v1/manage" \
  -H "Content-Type: application/json" \
  -H "x-service-version: v1" \
  -H "x-project-key: moss_access_key_xxxxx" \
  -d '{
    "action": "createWebSource",
    "projectId": "project_123",
    "rootUrl": "https://docs.yoursite.com",
    "indexName": "support-kb",
    "refreshCadence": "weekly"
  }'
```

See [Web Sources](https://docs.moss.dev/docs/reference/js/web-sources.md) for the JavaScript SDK,
[Web Sources](https://docs.moss.dev/docs/reference/python/web-sources.md) for Python, and
[Create Web Source](https://docs.moss.dev/docs/api-reference/v1/web-sources/createWebSource.md) for crawl limits,
scheduling, and the full set of web source actions.

## Local-first indexing (sessions)

`createIndex` / `create_index` builds an index through the cloud (then keeps it usable locally). When you need to index *during* a live interaction - adding transcript turns mid-call or building a per-user working set - use a **session** instead. A session indexes documents locally in real time with no cloud round trip, embedding each document on-device, and lets you optionally push the result to the cloud when you're done.

```python theme={null}
import asyncio
from moss import DocumentInfo, MossClient

async def main():
    client = MossClient(project_id, project_key)

    # Create or resume a local index by name.
    session = await client.session(index_name="my-session-index")

    # Index locally in real time - embedded on-device, no network.
    await session.add_docs([
        DocumentInfo(id="turn-1", text="Customer confirmed the refund was received."),
    ])

    # Optionally push the session to the cloud when done.
    await session.push_index()

asyncio.run(main())
```

See [Sessions](https://docs.moss.dev/docs/integrate/sessions.md) for the full create-resume-query-push lifecycle.

## Notes

* `createIndex` / `create_index` will sync indexes to cloud (if enabled) while remaining usable locally
* Supports multiple indexes per project; pick the model per index:
  * `moss-minilm`: fast, lightweight (default)
  * `moss-mediumlm`: higher accuracy, still efficient
  * Use `moss-minilm` for speed-first, edge/offline use; use `moss-mediumlm` when you need higher recall/precision

## Chunking tips

Uploaded files and web sources are chunked automatically; see Files ([JavaScript](https://docs.moss.dev/docs/reference/js/files.md), [Python](https://docs.moss.dev/docs/reference/python/files.md)). Documents you add yourself are indexed as given, so split them first. In Python, `chunking=` and `chunker=` can do that for you, and `.txt` and `.md` files are chunked by default (see [Python: JSON, JSON Lines and files](#python-json-json-lines-and-files)). If you split documents yourself:

* Keep chunks under about 1200 characters, cut at sentence boundaries, overlapping by about 200 characters
* Start each chunk with the document title so a hit identifies its source
* Normalize whitespace and strip boilerplate
