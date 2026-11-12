<!-- Source: https://docs.moss.dev/docs/reference/python/interfaces/Chunking.md -->
# Chunking

> Options for the native chunker that splits text, markdown and document text into passages before indexing.

[moss](https://docs.moss.dev/docs/reference/python/api.md) / Chunking

# Interface: Chunking

Options for the native chunker. Pass a `Chunking` as the keyword-only `chunking` argument of
[`MossClient.create_index()`](../classes/MossClient#create_index-name-docs-model_id-wait),
[`MossClient.add_docs()`](../classes/MossClient#add_docs-name-docs-options) or
[`SessionIndex.add_docs()`](../classes/SessionIndex#add_docs-docs-options) to tune how documents
are split, within bounds sized for the embedding model's input limit (about 512 tokens of
English). Every argument is optional, and the properties are read-only. *(moss 1.18.0+)*

Without `chunking` or [`chunker`](#chunker), `.txt`, `.md` and `.markdown` files are still
chunked, with the defaults below. With `chunking`, `DocumentInfo`, dict and JSON input is chunked
too, as plain text, so `markdown_header_depth` applies to markdown files only.

## Constructor

### `Chunking(chunk_size, chunk_overlap, mode, markdown_header_depth)`

Raises [`InvalidArgumentError`](./InvalidArgumentError) when a value is out of range. See
[Errors](#errors).

```python theme={null}
from moss import Chunking

chunking = Chunking(chunk_size=800, chunk_overlap=100)
```

## Properties

* **chunk\_size**: `int` - maximum chunk length in characters, 200-2000; default `1200`. A word longer than `chunk_size`, such as a long URL, is split into `chunk_size` pieces, so no text is dropped. In a markdown chunk, the heading path counts toward `chunk_size`.
* **chunk\_overlap**: `int` - characters repeated from the end of one chunk at the start of the next, 0 to half of `chunk_size`; default `200`, or half of `chunk_size` when smaller. Applies in `"pages"` mode only.
* **mode**: `str` - `"pages"` (default) packs sentences into chunks of up to `chunk_size` characters; `"sentences"` makes one chunk per sentence, with no overlap. A sentence ends at `.`, `!` or `?` followed by whitespace and a capital letter or quote.
* **markdown\_header\_depth**: `int` - the deepest markdown heading level that starts a new section, 1-6; default `6`.

The constructor takes each of these as an optional argument (`chunk_size=None`, `chunk_overlap=None`, `mode="pages"`, `markdown_header_depth=None`), and a property reads back the value in use, default included.

## How documents are chunked

Each chunk becomes its own document:

* The id is `{id}#{n}`, numbered from 0, where `{id}` is the document's id or, for a file, the path as you passed it (use relative paths for stable ids).
* The metadata is the document's metadata plus `parentId`, set to `{id}`.
* The `payload` is copied onto every chunk, so its size is multiplied by the chunk count.
* A chunk that is only whitespace is dropped before numbering.

For `.md` and `.markdown` files:

* A section starts at each `#` to `######` heading, down to `markdown_header_depth`. Headings inside code fences are ignored.
* Each chunk starts with its heading path, such as `Returns > Refunds`, then a blank line, then the text. Text before the first heading has no heading path.
* A section with no letters or digits, such as a lone `---` rule, produces no chunk.
* Front matter is not indexed: a first `---` line (not followed by a blank line) through the next `---` or `...` line outside a code fence. Without a closing line, nothing is skipped.

Notes:

* Re-ingesting a file that now has fewer chunks leaves its old higher-numbered chunks in the index. Remove them with [`delete_docs()`](../classes/MossClient#delete_docs-name-doc_ids).
* Native chunking is tuned for English. Text in scripts without spaces, such as Chinese or Japanese, is split by length only, and at the default `chunk_size` a chunk of it exceeds the embedding model's 512-token limit, so pass a smaller `chunk_size` for such text.
* There is no client-side batching. `create_index` uploads one blob and `add_docs` sends one request body, and the service can reject a very large one, which surfaces as `InvalidArgumentError`.

## Errors

All of these raise [`InvalidArgumentError`](./InvalidArgumentError), except where noted. The first four are raised by `Chunking(...)` itself.

| Message | Cause |
| - | - |
| `Unsupported chunk_size 100. Supported: 200 to 2000` | `chunk_size` is outside 200-2000 |
| `Unsupported chunk_overlap 201. Supported: 0 to 200 (half of chunk_size 400)` | `chunk_overlap` is outside 0 to half of `chunk_size`. Without `chunk_size`, the message ends `(half of the default chunk_size 1200)` |
| `Unsupported markdown_header_depth 7. Supported: 1 to 6` | `markdown_header_depth` is outside 1-6 |
| `Unsupported mode 'words'. Supported: pages, sentences` | `mode` is not `"pages"` or `"sentences"` |
| `chunk 1 of document "faq" has 2001 characters; chunks may have at most 2000 (about 512 tokens of English, the embedding model's input limit)` | A [`chunker`](#chunker) returned a chunk of more than 2,000 characters |
| `no text to index in: a.md, b.txt` | The listed files or documents produced no chunk, such as a markdown file with only headings |
| `cannot chunk document "faq" because it has an embedding` | A document with an `embedding` was passed with `chunker` or `chunking` |

Passing both `chunker` and `chunking` raises `TypeError`, and passing either with `model_id="custom"` (or to a session that uses the custom model) raises `ValueError`. See [Error reference](https://docs.moss.dev/docs/reference/errors.md#error-reference).

## Related types

### `DocsInput`

The type of the `docs` argument of `create_index` and both `add_docs` methods. *(moss 1.18.0+ for everything but a list of `DocumentInfo`)*

| Value | Meaning |
| - | - |
| list of [`DocumentInfo`](./DocumentInfo) | Documents as before |
| list of `dict` (or any `collections.abc.Mapping`) | Documents with the `DocumentInfo` fields: `id` (`str` or `int`), `text` (`str`), and optional `metadata`, `embedding` and `payload` |
| `str` or `bytes` | JSON array or JSON Lines text, detected from the first character (`[` or `{`). `bytes` must be UTF-8. A `str` is always JSON text, never a path |
| `pathlib.Path` | One `.json`, `.jsonl`, `.ndjson`, `.txt`, `.md` or `.markdown` file. JSON files hold a JSON array or JSON Lines |
| list of `pathlib.Path` | Several such files. A list cannot mix paths with other items (`TypeError`) |

Metadata values in a dict or JSON can be strings, numbers or booleans (`None` is skipped). Numbers are stored as their decimal string, and booleans as `"true"` or `"false"`. Any other file type is rejected, with a pointer to [`create_index_from_files()`](../classes/MossClient#create_index_from_files-name-files-model_id-parse_options) for PDF and DOCX. A bad JSON record raises `InvalidArgumentError` naming its position (`index 3:` in an array, `line 3:` in JSON Lines).

### `Chunker`

```python theme={null}
Chunker = Callable[[str], List[str]]
```

A function that splits one document's text into chunk texts. Pass it as the keyword-only `chunker` argument. It runs on a worker thread, once for every document (files included), and must be synchronous: it must return a `list` or `tuple` of `str`, and an `async def` raises `TypeError`. Each chunk may have at most 2,000 characters. Chunks follow the same id, `parentId` and `payload` rules as native chunks. Pass `chunker` or `chunking`, not both.

```python theme={null}
await client.create_index("kb", Path("notes.md"), chunker=lambda text: text.split("\n---\n"))
```
