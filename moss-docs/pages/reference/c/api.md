<!-- Source: https://docs.moss.dev/docs/reference/c/api.md -->
# API reference

> MossClient and MossSession functions, memory management, and error handling for libmoss.

[C SDK](https://docs.moss.dev/docs/reference/c/getting-started.md) / API reference

The `libmoss` API is split across two opaque handles, `MossClient` and
`MossSession`. Every fallible function returns a `MossResult` code and writes
its output through an out-parameter. See [Getting started](https://docs.moss.dev/docs/reference/c/getting-started.md)
for build and link instructions.

Inference uses a third handle, `MossInference` (`moss_inference_new`,
`moss_inference_responses_create`, `moss_inference_free`). See
[Inference](https://docs.moss.dev/docs/inference/sdks/c.md).

Include the header and link against `libmoss`:

```c theme={null}
#include "libmoss.h"
```

## MossClient

The entry point. Construct it with your project credentials, then manage cloud
indexes, load an index for querying, or open sessions.

| Function | Description |
| - | - |
| `moss_client_new` | Create a client with project credentials. |
| `moss_client_new_with_device_id` | Create a client that also reports your own stable device id. |
| `moss_client_free` | Send the final usage report (waiting up to 2 seconds), then destroy the client. Sessions opened from it stay valid. |
| `moss_client_session` | Open a local session (auto-loads from the cloud if the index exists). |
| `moss_client_create_index` | Create a cloud index. |
| `moss_client_add_docs` | Add documents to a cloud index. |
| `moss_client_delete_docs` | Delete documents from a cloud index. |
| `moss_client_delete_index` | Delete a cloud index. |
| `moss_client_get_index` | Get index metadata. |
| `moss_client_list_indexes` | List all indexes. |
| `moss_client_get_docs` | Fetch documents from a cloud index. |
| `moss_client_get_job_status` | Poll a mutation job. |
| `moss_client_load_index` | Load a cloud index into memory for local queries. |
| `moss_client_unload_index` | Unload a loaded index. |
| `moss_client_query` | Query a loaded index. |
| `moss_client_refresh_index` | Refresh a loaded index from the cloud. |

### Signatures

```c theme={null}
MossResult moss_client_new(const char *project_id,
                           const char *project_key,
                           MossClient **out);

// device_id: a stable, NUL-terminated UTF-8 string, sent beside Moss's own
// random id. NULL uses the id stored in ~/.moss/.moss-device-id.
MossResult moss_client_new_with_device_id(const char *project_id,
                                          const char *project_key,
                                          const char *device_id,
                                          MossClient **out);

void moss_client_free(MossClient *client);

MossResult moss_client_session(MossClient *client,
                               const char *name,
                               const MossSessionOptions *opts,
                               MossSession **out);

MossResult moss_client_create_index(MossClient *client,
                                    const char *name,
                                    const MossDocumentInfo *docs,
                                    uintptr_t doc_count,
                                    const char *model_id,
                                    MossMutationResult **out);

MossResult moss_client_add_docs(MossClient *client,
                                const char *name,
                                const MossDocumentInfo *docs,
                                uintptr_t doc_count,
                                const MossMutationOptions *opts,
                                MossMutationResult **out);

MossResult moss_client_delete_docs(MossClient *client,
                                   const char *name,
                                   const char *const *doc_ids,
                                   uintptr_t count,
                                   MossMutationResult **out);

MossResult moss_client_delete_index(MossClient *client,
                                    const char *name,
                                    bool *out_deleted);

MossResult moss_client_get_index(MossClient *client,
                                 const char *name,
                                 MossIndexInfo **out);

MossResult moss_client_list_indexes(MossClient *client,
                                    MossIndexInfo **out,
                                    uintptr_t *out_count);

MossResult moss_client_get_docs(MossClient *client,
                                const char *name,
                                const char *const *doc_ids,
                                uintptr_t id_count,
                                MossDocumentInfo **out_docs,
                                uintptr_t *out_count);

MossResult moss_client_get_job_status(MossClient *client,
                                      const char *job_id,
                                      MossJobStatusResponse **out);

MossResult moss_client_load_index(MossClient *client,
                                  const char *name,
                                  const MossLoadIndexOptions *opts,
                                  MossIndexInfo **out);

MossResult moss_client_unload_index(MossClient *client, const char *name);

MossResult moss_client_query(MossClient *client,
                             const char *name,
                             const char *query,
                             const MossQueryOptions *opts,
                             MossSearchResult **out);

MossResult moss_client_refresh_index(MossClient *client,
                                     const char *name,
                                     MossRefreshResult **out);
```

> [!NOTE]
>
> **Load before you query.** `moss_client_query` runs against an index that is
> already loaded into memory. Call `moss_client_load_index` first, then
> `moss_client_query`. Querying a cloud index that has not been loaded is not
> supported.

When you no longer need a loaded index, free its memory with
`moss_client_unload_index`. To pick up changes pushed since the index was
loaded, call `moss_client_refresh_index`.

#### `model_id` on create

`moss_client_create_index` takes a `model_id` argument. Pass `NULL` for the
default model, or a model id such as `"moss-mediumlm"`. The `"custom"` model is
not supported for cloud index creation.

## MossSession

A local index. Add and query documents on the same machine, persist them, and
sync with the cloud. Session queries run locally on the session, so no load
step is needed before querying.

| Function | Description |
| - | - |
| `moss_session_free` | Send the final usage report (waiting up to 2 seconds), then destroy the session. |
| `moss_session_name` | Get the session name. |
| `moss_session_doc_count` | Get the document count. |
| `moss_session_add_docs` | Add documents (auto-embeds for built-in models). |
| `moss_session_delete_docs` | Delete documents by id. |
| `moss_session_get_docs` | Fetch documents (`NULL` ids = all). |
| `moss_session_query` | Hybrid search, run locally. |
| `moss_session_load_index` | Load an existing cloud index into the session. |
| `moss_session_push_index` | Push the session to the cloud. |

### Signatures

```c theme={null}
void moss_session_free(MossSession *session);

const char *moss_session_name(const MossSession *session);

uintptr_t moss_session_doc_count(const MossSession *session);

MossResult moss_session_add_docs(MossSession *session,
                                 const MossDocumentInfo *docs,
                                 uintptr_t doc_count,
                                 const MossAddDocsOptions *opts,
                                 uintptr_t *out_added,
                                 uintptr_t *out_updated);

MossResult moss_session_delete_docs(MossSession *session,
                                    const char *const *doc_ids,
                                    uintptr_t count,
                                    uintptr_t *out_deleted);

MossResult moss_session_get_docs(MossSession *session,
                                 const char *const *doc_ids,
                                 uintptr_t id_count,
                                 const char *filter_json,
                                 const char *sort_by,
                                 bool ascending,
                                 const char *group_parent_field,
                                 const char *group_order_field,
                                 MossDocumentInfo **out_docs,
                                 uintptr_t *out_count);

MossResult moss_session_query(MossSession *session,
                              const char *query,
                              const MossQueryOptions *opts,
                              const char *group_parent_field,
                              const char *group_order_field,
                              MossSearchResult **out);

MossResult moss_session_load_index(MossSession *session,
                                   const char *index_name,
                                   const MossLoadIndexOptions *opts,
                                   uintptr_t *out_doc_count);

MossResult moss_session_push_index(MossSession *session,
                                   MossPushIndexResult **out);
```

`moss_session_name` returns a pointer owned by the session - it is valid for the
lifetime of the session and must not be freed.

`moss_session_get_docs` returns every document when `doc_ids` is `NULL`, and
none for a non-`NULL` list with `id_count` 0. `filter_json` is an optional
metadata filter in the format below, and `sort_by` an optional metadata field
to order the results by, in `ascending` order or descending when `false`. Pass
`NULL` to skip either. Ids passed in `doc_ids` set the order themselves.

`moss_session_query` and `moss_session_get_docs` can collapse documents that
share a parent into one result. `group_parent_field` names the metadata field
that identifies the parent, such as `"unit_id"`, and `group_order_field` the
field that orders the siblings, such as `"chunk_index"`. Grouping applies only
when both are set; pass `NULL` for both to skip it.

`moss_session_load_index` accepts an optional `MossLoadIndexOptions`. When
`opts.auto_refresh` is set, the session polls the cloud index every
`opts.polling_interval_secs` and pulls newer versions in on the next
`moss_session_query`, `moss_session_get_docs`, or `moss_session_doc_count`.
Auto-refresh pauses while the session has un-pushed local edits (after
`moss_session_add_docs` / `moss_session_delete_docs`, until
`moss_session_push_index`), so it never clobbers local work. Pass `NULL` for the
default behavior (no auto-refresh).

## Memory management

These rules govern literal C memory (`malloc` / `free`) ownership across the C
ABI.

**Rule:** every pointer returned by `libmoss` through an out-parameter must be
freed with the matching `moss_free_*()` function.

| Allocated by | Free with |
| - | - |
| `moss_session_query`, `moss_client_query` | `moss_free_search_result` |
| `moss_session_get_docs`, `moss_client_get_docs` | `moss_free_documents` |
| `moss_client_get_index` | `moss_free_index_info` |
| `moss_client_list_indexes` | `moss_free_index_info_list` |
| `moss_client_create_index`, `moss_client_add_docs`, `moss_client_delete_docs` | `moss_free_mutation_result` |
| `moss_session_push_index` | `moss_free_push_index_result` |
| `moss_client_get_job_status` | `moss_free_job_status_response` |
| `moss_client_refresh_index` | `moss_free_refresh_result` |

Free signatures:

```c theme={null}
void moss_free_string(char *s);
void moss_free_documents(MossDocumentInfo *docs, uintptr_t count);
void moss_free_search_result(MossSearchResult *result);
void moss_free_index_info(MossIndexInfo *info);
void moss_free_index_info_list(MossIndexInfo *infos, uintptr_t count);
void moss_free_mutation_result(MossMutationResult *result);
void moss_free_push_index_result(MossPushIndexResult *result);
void moss_free_job_status_response(MossJobStatusResponse *resp);
void moss_free_refresh_result(MossRefreshResult *result);
```

**Input data** (documents, strings, id arrays) is copied during the call, so the
caller owns and frees its own input buffers. The `MossClient` and `MossSession`
handles themselves are freed with `moss_client_free` and `moss_session_free`.
Each waits up to 2 seconds for the final usage report, or sends it in the
background when called from inside a Tokio runtime. Passing `NULL` is a no-op.
Free each handle once: freeing the same handle twice is undefined behavior.

## Error handling

Every fallible function returns a `MossResult` (`int32_t`):

* `OK` (`0`) means success.
* Negative values are errors.

```c theme={null}
enum MossResult {
    OK                  =  0,
    ERR_NULL_POINTER    = -1,
    ERR_INVALID_ARG     = -2,
    ERR_CLOUD           = -3,
    ERR_INDEX_NOT_FOUND = -4,
    ERR_MODEL           = -5,
    ERR_IO              = -6,
    ERR_INTERNAL        = -7,
    ERR_UNAUTHORIZED    = -8,
    ERR_DESERIALIZATION = -9,
};
```

Call `moss_last_error()` to get a human-readable message for the most recent
failed `moss_*` call on the current thread. The returned pointer is valid until
the next `moss_*` call on the same thread, and is `NULL` if no error is stored.
Do not free it.

```c theme={null}
MossResult r = moss_client_new(id, key, &client);
if (r != OK) {
    const char *err = moss_last_error();
    fprintf(stderr, "Error: %s\n", err ? err : "(no details)");
}
```

## Thread safety

`MossClient` and `MossSession` handles are internally mutex-protected and may be
shared across threads safely. Concurrent calls on the same handle serialize.

Do not free a `MossClient` or `MossSession` handle while another thread is still
using it.

## Metadata filters

Pass filters as a JSON string through `MossQueryOptions.filter_json`. A
single-field filter has the shape:

```json theme={null}
{ "field": "<name>", "condition": { "<operator>": <value> } }
```

Combine clauses with `$and` / `$or`:

```json theme={null}
{ "$and": [ { "field": "...", "condition": { ... } }, { "field": "...", "condition": { ... } } ] }
```

In C, the JSON quotes have to be escaped inside the string literal:

```c theme={null}
MossQueryOptions opts = {
    .top_k       = 5,
    .alpha       = 0.8f,
    .filter_json = "{\"field\": \"type\", \"condition\": {\"$eq\": \"billing\"}}",
};
```

### Operators

| Operator | Meaning | Example value |
| - | - | - |
| `$eq` / `$ne` | equals / not equals | `"billing"` |
| `$gt` / `$gte` / `$lt` / `$lte` | greater than, greater than or equal to, less than, less than or equal to: as numbers when both values are plain decimals, as text when neither is, never otherwise ([how ranges compare](https://docs.moss.dev/docs/integrate/metadata-filtering.md#how-ranges-compare)) | `"100"` |
| `$in` / `$nin` | in / not in a list | `["new-york", "seattle"]` |
| `$near` | within a radius of a point, `"lat,lng,radiusMeters"` | `"40.7580,-73.9855,5000"` |
| `$and` / `$or` | combine clauses | array of clauses |

The same filter format applies to `moss_session_query` and `moss_client_query`.
See [Examples](https://docs.moss.dev/docs/reference/c/examples.md#metadata-filtering) for runnable filter usage.

## Query options

`MossQueryOptions` controls result count, the semantic/keyword blend, and
filtering:

```c theme={null}
typedef struct MossQueryOptions {
    uintptr_t   top_k;          // number of results to return
    float       alpha;          // hybrid blend: 1.0 = semantic, 0.0 = keyword
    const char *filter_json;    // optional metadata filter (NULL = none)
    const float *embedding;     // optional query embedding (custom model)
    uintptr_t   embedding_dim;  // length of `embedding`, 0 when NULL
} MossQueryOptions;
```

Pass `NULL` for the whole options struct to use defaults. `alpha` blends dense
(semantic) and sparse (keyword) scoring; `1.0` is pure semantic, `0.0` is pure
keyword. Set `embedding` / `embedding_dim` only when the session or index uses
the `custom` model.
