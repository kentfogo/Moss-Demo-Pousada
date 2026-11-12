<!-- Source: https://docs.moss.dev/docs/reference/errors.md -->
# Errors & Troubleshooting

> Reference for common Moss SDK errors and how to fix them

## Error codes

Every failure the native core reports carries a stable code. Branch on the code, not on the
message: a core failure's message is fixed text for each kind of failure, such as
`Index not found.`, with no URLs, file paths or index names. An argument the SDK rejects
itself keeps a message that describes it. *(Python moss 1.15.0+, @moss-js/moss 1.16.0+,
@moss-dev/moss-web 1.4.0+, Elixir moss 1.5.0+, Swift SDK 0.8.0+)*

| Code | Meaning |
| - | - |
| `INVALID_ARGUMENT` | The caller passed a value the operation cannot accept. |
| `NOT_FOUND` | The index or other named resource does not exist or is not loaded. |
| `UNAUTHORIZED` | The credentials, token or plan do not permit the operation. |
| `NETWORK` | The Moss service could not be reached or did not answer in time. |
| `DESERIALIZATION` | Index data, a snapshot or a service response could not be decoded. |
| `MODEL_UNAVAILABLE` | The embedding model could not be downloaded, verified or loaded. |
| `INTERNAL` | A failure inside the SDK that the caller cannot correct. |

Each SDK exposes the code in its own form:

| SDK | Error | Code |
| - | - | - |
| Python | [`MossError`](https://docs.moss.dev/docs/reference/python/interfaces/MossError), a `RuntimeError`. [`InvalidArgumentError`](https://docs.moss.dev/docs/reference/python/interfaces/InvalidArgumentError) is its `INVALID_ARGUMENT` subclass and also a `ValueError`. | `error.code`, a string such as `"NOT_FOUND"` |
| JavaScript | An `Error` that [`isMossError`](https://docs.moss.dev/docs/reference/js/functions/isMossError) accepts, typed [`MossError`](https://docs.moss.dev/docs/reference/js/interfaces/MossError) | `error.code`, a [`MossErrorCode`](https://docs.moss.dev/docs/reference/js/type-aliases/MossErrorCode) |
| Browser | An `Error` with a `code` property. See [Errors](https://docs.moss.dev/docs/reference/browser/api.md#errors). | `error.code`, a string such as `"NOT_FOUND"` |
| Elixir | [`%Moss.Error{}`](https://docs.moss.dev/docs/reference/elixir/types#error), the `reason` in `{:error, reason}` | `reason.code`, an atom such as `:not_found` |
| Swift | [`MossError`](https://docs.moss.dev/docs/reference/swift/types#mosserror) | `error.code`, an `Int32` to compare with a constant such as `MossError.notFound` |

Some errors an SDK raises before it calls the core carry no code. In Python a closed
`MossClient` raises `RuntimeError` and some argument checks raise `ValueError` or `TypeError`;
in JavaScript a closed client or session and `createIndex` with no documents throw a plain
`Error`; in the browser `queryMultiIndex([])` throws a plain `Error`. The Python and
JavaScript web source methods raise `ManageApiError`. Elixir and Swift report their own
argument checks as a `%Moss.Error{}` and a `MossError` too.

`detail` holds the core error text: diagnostic text for logs and support, at most 512 bytes,
and not a stable contract. It names the operation or host instead of a request URL, and the
file instead of an absolute path. A failed response contributes only its HTTP status and the
error code its body names, such as `HTTP 403 Forbidden: AccessDenied`.

A bulk load reports the code of each index it could not load next to the message:
`LoadIndexesResult.failed_codes` in [Python](https://docs.moss.dev/docs/reference/python/interfaces/LoadIndexesResult.md)
and [Elixir](https://docs.moss.dev/docs/reference/elixir/types.md#loadindexesresult), and `failedCodes` in
[JavaScript](https://docs.moss.dev/docs/reference/js/interfaces/LoadIndexesResult.md),
[the browser](https://docs.moss.dev/docs/reference/browser/classes/MossClient.md#loadindexes) and
[Swift](https://docs.moss.dev/docs/reference/swift/types.md#loadindexesresult).

***

## Error reference

| Error | Cause | Fix |
| - | - | - |
| `Unauthorized` | Missing or invalid credentials | Set `MOSS_PROJECT_ID` and `MOSS_PROJECT_KEY` in your environment |
| `Cannot find native binding` | `@moss-js/moss` was installed without optional dependencies, so the native binary for your platform is missing | Reinstall with optional dependencies. See [Install](https://docs.moss.dev/docs/reference/js/api.md#install) |
| `Index not found` | Querying or loading an index that doesn't exist | Call `createIndex()` first; verify the name matches exactly (case-sensitive) |
| `Index not loaded` | Calling `query()` before `loadIndex()` | Call `loadIndex(name)` before `query()`. `query()` throws if the index isn't loaded locally |
| `Index already exists` | Calling `createIndex()` on an existing index name | Use `addDocs()` with `upsert: true` to update documents, or delete the index first |
| `Missing embeddings runtime` | Invalid or unrecognised `modelId` | Use `moss-minilm`, `moss-mediumlm`, or `custom` |
| `Embedding required` | Using `modelId: 'custom'` without providing `embedding` | Supply an `embedding` array on every document and every `query()` call |
| `Job failed` | Async mutation error | Inspect `JobStatusResponse.error` via `getJobStatus(jobId)` |
| `Validation error: index name must not be blank, "." or "..", must not contain "/" or control characters, and must be at most 256 bytes` | An index name that is blank, `.` or `..`, contains `/` or a control character, or is longer than 256 bytes. The SDK rejects it before sending any request | Use a name within these rules. Pass the raw name: the SDK percent-encodes it, so an already encoded name addresses a different index. *(Python moss 1.14.0+, @moss-js/moss 1.15.0+, @moss-dev/moss-web 1.3.0+, Elixir moss 1.4.0+, Swift SDK 0.7.0+)* |
| `Unsupported chunk_size 100. Supported: 200 to 2000` (also `chunk_overlap`, `markdown_header_depth` and `mode`) | Python `Chunking(...)` got a value out of range. It raises `InvalidArgumentError` | Use `chunk_size` 200 to 2000, `chunk_overlap` 0 to half of `chunk_size`, `markdown_header_depth` 1 to 6, and `mode` `"pages"` or `"sentences"`. See [`Chunking`](https://docs.moss.dev/docs/reference/python/interfaces/Chunking). *(Python moss 1.18.0+)* |
| `chunk 1 of document "faq" has 2001 characters; chunks may have at most 2000 (about 512 tokens of English, the embedding model's input limit)` | A Python `chunker` returned a chunk of more than 2,000 characters. It raises `InvalidArgumentError` | Return chunks of at most 2,000 characters from `chunker`. *(Python moss 1.18.0+)* |
| `pass chunker or chunking, not both` | Python `create_index` or `add_docs` got both `chunker=` and `chunking=`. It raises `TypeError` | Pass one of them. *(Python moss 1.18.0+)* |
| `chunker and chunking cannot be used with model_id='custom': chunks have no embeddings` | Python `create_index` with `model_id="custom"`, or `SessionIndex.add_docs` on a custom-model session, got `chunker=` or `chunking=`. It raises `ValueError` | Chunk and embed the text yourself, then pass the chunks as documents with their `embedding`, without `chunker` or `chunking`. *(Python moss 1.18.0+)* |
| `no text to index in: a.md` | A Python file or document had no text left to index after chunking, such as a markdown file with only headings. It raises `InvalidArgumentError` | Add text to the listed files or documents, or leave them out. *(Python moss 1.18.0+)* |
| `cannot chunk document "faq" because it has an embedding` | A Python document with an `embedding` was passed with `chunker=` or `chunking=`. It raises `InvalidArgumentError` | Remove `embedding` and let the model embed each chunk, or chunk the text yourself and pass the chunks with their embeddings. *(Python moss 1.18.0+)* |

***

## Common scenarios

### Search results are irrelevant

* **Try hybrid search**: lower `alpha` for more keyword matching (default is `0.8`):
  ```ts theme={null}
  await client.query('my-index', 'query text', { topK: 5, alpha: 0.5 })
  ```
* **Check document chunking**: very long documents dilute embedding signal. Keep chunks under about 1200 characters, cut at sentence boundaries - see [Chunking tips](https://docs.moss.dev/docs/integrate/indexing-data.md#chunking-tips).
* **Switch models**: try `moss-mediumlm` for higher accuracy.

***

## SDK error behaviour

* Most methods throw if the target index does not exist.
* `createIndex()` throws if the index already exists.
* `loadIndex()` throws if the index does not exist in cloud storage or loading fails. With a `cachePath` (`cache_path` in Python) and a snapshot already on disk, it serves that snapshot instead when the cloud is unreachable or answers with a temporary error, while a 401, 403 or 404 still throws. *(Python moss 1.14.0+, @moss-js/moss 1.15.0+)*

If a job reaches `"failed"`, its `JobStatusResponse.error` will be non-null. The job's `currentPhase` (see [JobPhase](https://docs.moss.dev/docs/reference/js/type-aliases/JobPhase.md)) can hint at where it failed - a job stuck on `downloading` usually means a network issue.

***

## Still stuck?

* Join the [Moss Discord](https://discord.gg/eMXExuafBR) for community help
* Open an issue on [GitHub](https://github.com/usemoss/moss)
