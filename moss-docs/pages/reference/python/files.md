<!-- Source: https://docs.moss.dev/docs/reference/python/files.md -->
# Index from Files (Python SDK)

> Create a Moss index from PDF and DOCX files in Python with server-side text extraction and configurable parsing.

`create_index_from_files` builds a new index directly from raw documents. You upload PDF and
DOCX files; the server parses them, splits them into chunks, generates embeddings, and builds
the index. The call returns when the index is ready to query.

> [!NOTE]
>
> Requires `moss` **1.7.3+**. Also available in JavaScript as
> [`createIndexFromFiles`](../js/files) (`@moss-js/moss` **1.8.0+**). `chunk_size` and `chunk_overlap` need **1.17.0+** (JavaScript **1.18.0+**).

```python theme={null}
from moss import MossClient, ParseFileInput, ParseOptions

client = MossClient(MOSS_PROJECT_ID, MOSS_PROJECT_KEY)

await client.create_index_from_files("contracts", [
    ParseFileInput(name="report.pdf", content_type="application/pdf", path="/docs/report.pdf"),
    ParseFileInput(
        name="manual.docx",
        content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        data=docx_bytes,  # raw bytes also work
    ),
], parse_options=ParseOptions(ocr_mode="full_ocr"))  # scanned documents with no text layer

# Load the new index, then query it in memory
await client.load_index("contracts")
results = await client.query("contracts", "termination clause")
```

## How it works

The call handles the full flow: it registers the files, uploads each one, and triggers
parsing, embedding, and the index build server-side. It blocks until the index is ready and
returns a [`MutationResult`](./interfaces/MutationResult). Jobs time out after 30 minutes.
There is no progress callback in Python.

## Files

Each entry is a [`ParseFileInput`](./interfaces/ParseFileInput):

| Field | Required | Notes |
| - | - | - |
| `name` | Yes | Identifier for the file. Names must be unique within the call - uploads are matched back to files by name. |
| `content_type` | Yes | `application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX). Not inferred from the file name; any other value is rejected before upload. |
| `path` | One of `path` / `data` | Filesystem path. |
| `data` | One of `path` / `data` | Raw file bytes (`bytes`). Takes precedence over `path` when both are set. |

Limits:

* 1 to 20 files per call. Each call creates a new index, and files cannot be appended to an
  existing index afterwards, so an index is built from at most 20 files.
* 50 MB per file, enforced server-side. The SDK does not pre-check size; an oversized file
  fails during the job.

## Options

* **model\_id** (`Optional[str]` = `None`) - defaults to `"moss-minilm"`; `"moss-mediumlm"`
  is also supported. `"custom"` is not supported - the server generates embeddings during
  parsing.
* **parse\_options** (Optional\[[`ParseOptions`](./interfaces/ParseOptions)] = `None`) -
  extraction controls, below.

### Parse options

All fields of [`ParseOptions`](./interfaces/ParseOptions) are optional; omitted fields use
the server defaults.

| Option | Values | What it does |
| - | - | - |
| `ocr_mode` | `"auto_ocr"` \| `"full_ocr"` | `full_ocr` forces OCR on every page, which is what scanned documents with no text layer need. `auto_ocr` runs OCR only where it looks necessary. |
| `use_high_resolution` | bool | Slower, higher-fidelity extraction. Useful for dense tables. |
| `segmentation_method` | `"smart_layout_detection"` \| `"page_by_page"` | How the document is segmented before extraction. |
| `merge_tables` | bool | Merge a table split across a page break into a single segment. |
| `chunk_size` | int (characters) | Maximum chunk length, 200-2000; default `1200`. Chunks end at `.`, `!` or `?` before a capital letter; a longer sentence is cut at spaces, or mid-word if it has none. The title prefix is not counted. *(moss 1.17.0+)* |
| `chunk_overlap` | int (characters) | Characters repeated from the end of one chunk at the start of the next, 0 to half of `chunk_size`; default `200`, or half of `chunk_size` when smaller. The overlap moves forward to a sentence start when one falls inside it, and is absent around long sentences. *(moss 1.17.0+)* |

The extraction options shape the text the parser extracts; chunking then runs over it as one stream per file.

## What gets indexed

Documents are split into chunks of up to `chunk_size` characters overlapping by up to `chunk_overlap`,
each prefixed with a title (the document's title or first heading, else the file name) that
is part of the hit text returned by `query`. Repeating page
headers, footers, page numbers, and images are excluded from the indexed text.
A scanned or
image-only document produces no readable text unless OCR runs - if a file fails with
"No readable text was found", retry with `parse_options=ParseOptions(ocr_mode="full_ocr")`.

## Querying a parse-built index

Load the index, then query it like any other index. Queries run in memory, and querying an
index that is not loaded raises `MossError` with code `NOT_FOUND`:

```python theme={null}
from moss import QueryOptions

await client.load_index("contracts")
results = await client.query("contracts", "termination clause", QueryOptions(top_k=5))
```

> [!NOTE]
>
> If a text query on a parse-built index raises `InvalidArgumentError`, the index records no
> embedding model version. Keyword-only queries (`alpha=0`) and queries that pass their own
> embedding in `QueryOptions.embedding` still work.

## Errors

Passing `model_id="custom"` raises `ValueError` before anything is uploaded. Other failures
raise [`MossError`](./interfaces/MossError); `str(e)` is fixed text, `e.detail` starts with:

| `detail` starts with | Cause |
| - | - |
| `Validation error: files must not exceed 20` | More than 20 files in one call. |
| `Unsupported content type` | `content_type` is not PDF or DOCX. |
| `Validation error: Unsupported chunk_size` | `chunk_size` outside 200-2000. Rejected before upload, not clamped. |
| `Validation error: Unsupported chunk_overlap` | `chunk_overlap` negative or above half of `chunk_size` (600 when `chunk_size` is omitted). |
| `Model not allowed:` | The model is not enabled for your organization. |
| `Upload failed:` | A file could not be read or uploaded. |
| `Job failed:` | Parsing or the index build failed server-side. |
| `Job timed out after 1800 seconds` | The job exceeded the 30 minute polling ceiling. |
