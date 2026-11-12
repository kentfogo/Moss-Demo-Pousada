<!-- Source: https://docs.moss.dev/docs/reference/js/files.md -->
# Index from Files (JavaScript SDK)

> Create a Moss index from PDF and DOCX files in JavaScript with server-side text extraction and configurable parsing.

`createIndexFromFiles` builds a new index directly from raw documents. You upload PDF and DOCX
files; the server parses them, splits them into chunks, generates embeddings, and builds the
index. The call resolves when the index is ready to query.

> [!NOTE]
>
> Requires `@moss-js/moss` **1.8.0+**. Also available in Python as
> `create_index_from_files` (`moss` **1.7.3+**). `chunkSize` and `chunkOverlap` need **1.18.0+** (Python **1.17.0+**).

```typescript theme={null}
import { MossClient } from '@moss-js/moss'

const client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)

await client.createIndexFromFiles('contracts', [
  { name: 'report.pdf', contentType: 'application/pdf', path: '/docs/report.pdf' },
  {
    name: 'manual.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    data: docxBytes, // Uint8Array, Buffer, ArrayBuffer, Blob, or File
  },
], {
  parseOptions: { ocrMode: 'full_ocr' }, // scanned documents with no text layer
  onProgress: (p) => console.log(p.status, p.currentPhase, `${p.progress}%`),
})

// Load the new index, then query it in memory
await client.loadIndex('contracts')
const results = await client.query('contracts', 'termination clause')
```

## How it works

The call handles the full flow: it registers the files, uploads each one, and triggers
parsing, embedding, and the index build server-side. It polls the job every \~2 seconds
(reporting through `onProgress`) and resolves to a
[`MutationResult`](./interfaces/MutationResult) when the index is ready. Jobs time out after
30 minutes.

## Files

Each entry is a [`ParseFileInput`](./interfaces/ParseFileInput):

| Field | Required | Notes |
| - | - | - |
| `name` | Yes | Identifier for the file. Names must be unique within the call - uploads are matched back to files by name. |
| `contentType` | Yes | `application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX). Not inferred from the file name; any other value is rejected before upload. |
| `path` | One of `path` / `data` | Filesystem path (Node.js). |
| `data` | One of `path` / `data` | In-memory bytes: `Uint8Array`, `Buffer`, `ArrayBuffer`, `Blob`, or `File`. Takes precedence over `path` when both are set. |

Limits:

* 1 to 20 files per call. Each call creates a new index, and files cannot be appended to an
  existing index afterwards, so an index is built from at most 20 files.
* 50 MB per file, enforced server-side. The SDK does not pre-check size; an oversized file
  fails during the job.
* Prefer `path` on Node.js. In-memory `data` is copied byte by byte across the native
  boundary, which is memory-hungry for large files.

## Options

[`CreateIndexFromFilesOptions`](./interfaces/CreateIndexFromFilesOptions):

| Option | Notes |
| - | - |
| `modelId?` | `"moss-minilm"` (default) or `"moss-mediumlm"`. `"custom"` is not supported - the server generates embeddings during parsing. |
| `parseOptions?` | Extraction controls, below. |
| `onProgress?` | Callback invoked with progress updates (\~every 2s) while the server is processing. |

### Parse options

All fields of [`ParseOptions`](./interfaces/ParseOptions) are optional; omitted fields use the
server defaults.

| Option | Values | What it does |
| - | - | - |
| `ocrMode` | `"auto_ocr"` \| `"full_ocr"` | `full_ocr` forces OCR on every page, which is what scanned documents with no text layer need. `auto_ocr` runs OCR only where it looks necessary. |
| `useHighResolution` | boolean | Slower, higher-fidelity extraction. Useful for dense tables. |
| `segmentationMethod` | `"smart_layout_detection"` \| `"page_by_page"` | How the document is segmented before extraction. |
| `mergeTables` | boolean | Merge a table split across a page break into a single segment. |
| `chunkSize` | integer (characters) | Maximum chunk length, 200-2000; default `1200`. Chunks end at `.`, `!` or `?` before a capital letter; a longer sentence is cut at spaces, or mid-word if it has none. The title prefix is not counted. *(@moss-js/moss 1.18.0+)* |
| `chunkOverlap` | integer (characters) | Characters repeated from the end of one chunk at the start of the next, 0 to half of `chunkSize`; default `200`, or half of `chunkSize` when smaller. The overlap moves forward to a sentence start when one falls inside it, and is absent around long sentences. *(@moss-js/moss 1.18.0+)* |

The extraction options shape the text the parser extracts; chunking then runs over it as one stream per file.

## Progress

`onProgress` receives a [`JobProgress`](./interfaces/JobProgress) roughly every 2 seconds
while the server is working (there is no per-byte upload progress):

```typescript theme={null}
{
  jobId: string,
  status: 'pending_upload' | 'uploading' | 'building' | 'completed' | 'failed',
  progress: number, // 0-100
  currentPhase: JobPhase | null
}
```

File-parse jobs move through the phases `queued`, `parsing`, `waiting_for_parser`,
`parsing_complete`, `generating_embeddings`, and `building_index`. Guard phase checks with
`if (p.currentPhase)` - it can be unset on some events. Progress is advisory; the awaited
promise is the authoritative signal.

## What gets indexed

Documents are split into chunks of up to `chunkSize` characters overlapping by up to `chunkOverlap`,
each prefixed with a title (the document's title or first heading, else the file name) that
is part of the hit text returned by `query`. Repeating page
headers, footers, page numbers, and images are excluded from the indexed text.
A scanned or
image-only document produces no readable text unless OCR runs - if a file fails with
"No readable text was found", retry with `parseOptions: { ocrMode: 'full_ocr' }`.

## Querying a parse-built index

Load the index, then query it like any other index. Queries run in memory, and querying an
index that is not loaded throws a `MossError` with code `NOT_FOUND`:

```typescript theme={null}
await client.loadIndex('contracts')
const results = await client.query('contracts', 'termination clause', { topK: 5 })
```

> [!NOTE]
>
> If a text query on a parse-built index throws a `MossError` with code `INVALID_ARGUMENT`, the
> index records no embedding model version. Keyword-only queries (`alpha: 0`) and queries that
> pass their own embedding in `QueryOptions.embedding` still work.

## Errors

Failures throw a [`MossError`](./interfaces/MossError); `message` is fixed text, `detail` starts with:

| `detail` starts with | Cause |
| - | - |
| `Validation error: files must not exceed 20` | More than 20 files in one call. |
| `Unsupported content type` | `contentType` is not PDF or DOCX. |
| `Validation error: create_index_from_files does not support model_id='custom'` | `modelId: 'custom'` was passed. |
| `Validation error: Unsupported chunk_size` | `chunkSize` outside 200-2000. Rejected before upload, not clamped. |
| `Validation error: Unsupported chunk_overlap` | `chunkOverlap` negative or above half of `chunkSize` (600 when `chunkSize` is omitted). |
| `Model not allowed:` | The model is not enabled for your organization. |
| `Upload failed:` | A file could not be read or uploaded. |
| `Job failed:` | Parsing or the index build failed server-side. |
| `Job timed out after 1800 seconds` | The job exceeded the 30 minute polling ceiling. |

## Python

```python theme={null}
from moss import MossClient, ParseFileInput, ParseOptions

client = MossClient(project_id, project_key)
await client.create_index_from_files("contracts", [
    ParseFileInput(name="report.pdf", content_type="application/pdf", path="/docs/report.pdf"),
], parse_options=ParseOptions(ocr_mode="full_ocr"))
```

Same behavior and limits; there is no progress callback in Python. See the
[Python guide](https://docs.moss.dev/docs/reference/python/files.md).

## Browser

`@moss-dev/moss-web` also exposes `createIndexFromFiles`, with a reduced surface: files must
supply `data` as a `Uint8Array` (no `path`), and `parseOptions` and progress reporting are
not available. See [Browser vs Node](https://docs.moss.dev/docs/reference/browser/browser-vs-node.md).
