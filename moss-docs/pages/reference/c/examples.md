<!-- Source: https://docs.moss.dev/docs/reference/c/examples.md -->
# Examples

> Runnable libmoss programs: session workflow, cloud CRUD, and metadata filtering.

[C SDK](https://docs.moss.dev/docs/reference/c/getting-started.md) / Examples

Three complete programs you can build and run against your own project. Each
expects credentials as command-line arguments:

```bash theme={null}
./your_app <project_id> <project_key>
```

See [Getting started](https://docs.moss.dev/docs/reference/c/getting-started.md#link) for compile and link commands.
All three share this small helper that checks a `MossResult` and prints the
last error on failure:

```c theme={null}
static void check(MossResult r, const char *context) {
    if (r != OK) {
        const char *err = moss_last_error();
        fprintf(stderr, "ERROR [%s]: %s\n", context, err ? err : "(no details)");
        exit(1);
    }
}
```

## Session workflow

Open a session, add documents with metadata, query (with and without a filter),
fetch documents, and push the index to the cloud. Queries run locally on the
session.

```c theme={null}
#include "libmoss.h"
#include <stdio.h>
#include <stdlib.h>

static void check(MossResult r, const char *context) {
    if (r != OK) {
        const char *err = moss_last_error();
        fprintf(stderr, "ERROR [%s]: %s\n", context, err ? err : "(no details)");
        exit(1);
    }
}

int main(int argc, char *argv[]) {
    if (argc < 3) {
        fprintf(stderr, "Usage: %s <project_id> <project_key>\n", argv[0]);
        return 1;
    }

    printf("Moss SDK version: %s\n\n", moss_sdk_version());

    // 1. Create client.
    MossClient *client = NULL;
    check(moss_client_new(argv[1], argv[2], &client), "client_new");

    // 2. Open a session.
    MossSession *session = NULL;
    check(moss_client_session(client, "c-sdk-demo", NULL, &session), "session");
    printf("Session: name=%s, doc_count=%zu\n",
           moss_session_name(session), moss_session_doc_count(session));

    // 3. Add documents with metadata.
    MossMetadataEntry meta1[] = {
        { .key = "type",     .value = "billing" },
        { .key = "priority", .value = "high"    },
    };
    MossMetadataEntry meta2[] = {
        { .key = "type", .value = "gardening" },
    };
    MossDocumentInfo docs[] = {
        { .id = "doc-1",
          .text = "Customer requested a billing refund and invoice review.",
          .metadata = meta1, .metadata_count = 2 },
        { .id = "doc-2",
          .text = "How to prune tomato plants in a home garden.",
          .metadata = meta2, .metadata_count = 1 },
    };
    size_t added = 0, updated = 0;
    check(moss_session_add_docs(session, docs, 2, NULL, &added, &updated), "add_docs");
    printf("Added %zu, updated %zu. Total: %zu\n\n",
           added, updated, moss_session_doc_count(session));

    // 4. Query.
    MossSearchResult *result = NULL;
    check(moss_session_query(session, "billing refund", NULL, NULL, NULL, &result), "query");
    printf("Query \"%s\" - %zu results in %llu ms\n",
           result->query, result->doc_count,
           (unsigned long long)result->time_taken_ms);
    for (size_t i = 0; i < result->doc_count; i++) {
        printf("  %s  score=%.4f\n", result->docs[i].id, result->docs[i].score);
    }
    moss_free_search_result(result);

    // 5. Query with a metadata filter.
    MossQueryOptions opts = {
        .top_k       = 5,
        .alpha       = 0.8f,
        .filter_json = "{\"field\": \"type\", \"condition\": {\"$eq\": \"billing\"}}",
    };
    MossSearchResult *filtered = NULL;
    check(moss_session_query(session, "refund", &opts, NULL, NULL, &filtered), "query_filtered");
    printf("\nFiltered query - %zu results\n", filtered->doc_count);
    for (size_t i = 0; i < filtered->doc_count; i++) {
        printf("  %s  score=%.4f\n", filtered->docs[i].id, filtered->docs[i].score);
    }
    moss_free_search_result(filtered);

    // 6. Fetch all documents: no ids, filter, sort or grouping.
    MossDocumentInfo *fetched = NULL;
    size_t fetched_count = 0;
    check(moss_session_get_docs(session, NULL, 0, NULL, NULL, true, NULL, NULL,
                                &fetched, &fetched_count),
          "get_docs");
    printf("\nAll docs (%zu):\n", fetched_count);
    for (size_t i = 0; i < fetched_count; i++) {
        printf("  %s\n", fetched[i].id);
    }
    moss_free_documents(fetched, fetched_count);

    // 7. Push to the cloud.
    MossPushIndexResult *push = NULL;
    check(moss_session_push_index(session, &push), "push_index");
    printf("\nPushed: job_id=%s  status=%s  doc_count=%zu\n",
           push->job_id, push->status, push->doc_count);
    moss_free_push_index_result(push);

    // 8. Cleanup.
    moss_session_free(session);
    moss_client_free(client);
    printf("\nDone.\n");
    return 0;
}
```

## Cloud CRUD

A full client-side workflow against a cloud index: create with documents, read
metadata, list, add more, fetch, load for querying, query, delete documents,
and delete the index. Note that querying requires loading the index into memory
first.

```c theme={null}
#include "libmoss.h"
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

static void check(MossResult r, const char *context) {
    if (r != OK) {
        const char *err = moss_last_error();
        fprintf(stderr, "ERROR [%s]: %s\n", context, err ? err : "(no details)");
        exit(1);
    }
}

int main(int argc, char *argv[]) {
    if (argc < 3) {
        fprintf(stderr, "Usage: %s <project_id> <project_key>\n", argv[0]);
        return 1;
    }

    MossClient *client = NULL;
    check(moss_client_new(argv[1], argv[2], &client), "client_new");

    // Build a unique index name.
    char index_name[64];
    time_t now = time(NULL);
    struct tm *t = localtime(&now);
    snprintf(index_name, sizeof(index_name),
             "example-cloud-index-%04d%02d%02d-%02d%02d%02d",
             t->tm_year + 1900, t->tm_mon + 1, t->tm_mday,
             t->tm_hour, t->tm_min, t->tm_sec);

    // 1. Create the index with documents.
    MossMetadataEntry meta_ml[] = {
        { .key = "category", .value = "ai" },
        { .key = "topic",    .value = "machine_learning" },
    };
    MossMetadataEntry meta_dl[] = {
        { .key = "category", .value = "ai" },
        { .key = "topic",    .value = "deep_learning" },
    };
    MossDocumentInfo docs[] = {
        { .id = "doc1",
          .text = "Machine learning enables computers to learn from experience without being explicitly programmed.",
          .metadata = meta_ml, .metadata_count = 2 },
        { .id = "doc2",
          .text = "Deep learning uses neural networks with multiple layers to model complex patterns in data.",
          .metadata = meta_dl, .metadata_count = 2 },
    };
    MossMutationResult *created = NULL;
    check(moss_client_create_index(client, index_name, docs, 2, NULL, &created), "create_index");
    printf("Created: job_id=%s  doc_count=%zu\n", created->job_id, created->doc_count);
    moss_free_mutation_result(created);

    // 2. Get index metadata.
    MossIndexInfo *info = NULL;
    check(moss_client_get_index(client, index_name, &info), "get_index");
    printf("Index %s: %zu docs, model=%s, status=%s\n",
           info->name, info->doc_count, info->model.id, info->status);
    moss_free_index_info(info);

    // 3. List all indexes.
    MossIndexInfo *indexes = NULL;
    size_t index_count = 0;
    check(moss_client_list_indexes(client, &indexes, &index_count), "list_indexes");
    printf("Found %zu indexes\n", index_count);
    moss_free_index_info_list(indexes, index_count);

    // 4. Add more documents (upsert).
    MossMetadataEntry meta_ds[] = {
        { .key = "category", .value = "data_science" },
    };
    MossDocumentInfo new_docs[] = {
        { .id = "doc3",
          .text = "Data science combines statistics, programming, and domain expertise to extract insights.",
          .metadata = meta_ds, .metadata_count = 1 },
    };
    MossMutationOptions mut_opts = { .upsert = true };
    MossMutationResult *add_result = NULL;
    check(moss_client_add_docs(client, index_name, new_docs, 1, &mut_opts, &add_result), "add_docs");
    moss_free_mutation_result(add_result);

    // 5. Fetch specific documents.
    const char *ids[] = { "doc1", "doc3" };
    MossDocumentInfo *some = NULL;
    size_t some_count = 0;
    check(moss_client_get_docs(client, index_name, ids, 2, &some, &some_count), "get_docs");
    for (size_t i = 0; i < some_count; i++) {
        printf("  %s\n", some[i].id);
    }
    moss_free_documents(some, some_count);

    // 6. Load the index into memory (required before querying).
    MossIndexInfo *loaded = NULL;
    check(moss_client_load_index(client, index_name, NULL, &loaded), "load_index");
    printf("Loaded %s (%zu docs)\n", loaded->name, loaded->doc_count);
    moss_free_index_info(loaded);

    // 7. Query the loaded index.
    MossQueryOptions qopts = { .top_k = 3, .alpha = 0.6f };
    MossSearchResult *search = NULL;
    check(moss_client_query(client, index_name,
                            "artificial intelligence and neural networks",
                            &qopts, &search), "query");
    printf("Found %zu results:\n", search->doc_count);
    for (size_t i = 0; i < search->doc_count; i++) {
        printf("  %s  score=%.3f\n", search->docs[i].id, search->docs[i].score);
    }
    moss_free_search_result(search);

    // 8. Delete a document.
    const char *del_ids[] = { "doc3" };
    MossMutationResult *del_result = NULL;
    check(moss_client_delete_docs(client, index_name, del_ids, 1, &del_result), "delete_docs");
    moss_free_mutation_result(del_result);

    // 9. Unload and delete the index.
    check(moss_client_unload_index(client, index_name), "unload_index");
    bool deleted = false;
    check(moss_client_delete_index(client, index_name, &deleted), "delete_index");
    printf("Index deleted: %s\n", deleted ? "true" : "false");

    moss_client_free(client);
    return 0;
}
```

## Metadata filtering

Create a cloud index, load it locally, then run `$eq`, `$and`, `$in`, and
`$near` filters. Filtering requires a loaded index, so the program loads before
querying.

```c theme={null}
#include "libmoss.h"
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

static void check(MossResult r, const char *context) {
    if (r != OK) {
        const char *err = moss_last_error();
        fprintf(stderr, "ERROR [%s]: %s\n", context, err ? err : "(no details)");
        exit(1);
    }
}

static void print_results(MossSearchResult *res) {
    for (size_t i = 0; i < res->doc_count; i++) {
        MossQueryResultDoc *doc = &res->docs[i];
        printf("   - %s | score=%.3f", doc->id, doc->score);
        if (doc->metadata_count > 0) {
            printf(" | metadata={");
            for (size_t j = 0; j < doc->metadata_count; j++) {
                if (j > 0) printf(", ");
                printf("%s: %s", doc->metadata[j].key, doc->metadata[j].value);
            }
            printf("}");
        }
        printf("\n");
    }
}

int main(int argc, char *argv[]) {
    if (argc < 3) {
        fprintf(stderr, "Usage: %s <project_id> <project_key>\n", argv[0]);
        return 1;
    }

    MossClient *client = NULL;
    check(moss_client_new(argv[1], argv[2], &client), "client_new");

    char index_name[64];
    time_t now = time(NULL);
    struct tm *t = localtime(&now);
    snprintf(index_name, sizeof(index_name),
             "metadata-filter-sample-%04d%02d%02d-%02d%02d%02d",
             t->tm_year + 1900, t->tm_mon + 1, t->tm_mday,
             t->tm_hour, t->tm_min, t->tm_sec);

    // Documents with rich metadata.
    MossMetadataEntry meta1[] = {
        { .key = "category", .value = "shoes" },
        { .key = "brand",    .value = "swiftfit" },
        { .key = "price",    .value = "79" },
        { .key = "city",     .value = "new-york" },
        { .key = "location", .value = "40.7580,-73.9855" },
    };
    MossMetadataEntry meta2[] = {
        { .key = "category", .value = "shoes" },
        { .key = "brand",    .value = "peakstride" },
        { .key = "price",    .value = "149" },
        { .key = "city",     .value = "seattle" },
        { .key = "location", .value = "47.6062,-122.3321" },
    };
    MossMetadataEntry meta3[] = {
        { .key = "category", .value = "bags" },
        { .key = "brand",    .value = "urbanpack" },
        { .key = "price",    .value = "95" },
        { .key = "city",     .value = "new-york" },
        { .key = "location", .value = "40.7505,-73.9934" },
    };
    MossDocumentInfo docs[] = {
        { .id = "doc1", .text = "Running shoes with breathable mesh for daily training.",
          .metadata = meta1, .metadata_count = 5 },
        { .id = "doc2", .text = "Trail running shoes built for rocky mountain terrain.",
          .metadata = meta2, .metadata_count = 5 },
        { .id = "doc3", .text = "Lightweight city backpack with laptop compartment.",
          .metadata = meta3, .metadata_count = 5 },
    };

    // 1. Create the index.
    MossMutationResult *cr = NULL;
    check(moss_client_create_index(client, index_name, docs, 3, NULL, &cr), "create_index");
    moss_free_mutation_result(cr);

    // 2. Load the index locally (required for filtering).
    MossIndexInfo *loaded = NULL;
    check(moss_client_load_index(client, index_name, NULL, &loaded), "load_index");
    moss_free_index_info(loaded);

    // 3. $eq - category == shoes
    printf("$eq: category == shoes\n");
    MossQueryOptions eq_opts = {
        .top_k = 5, .alpha = 0.5f,
        .filter_json = "{\"field\": \"category\", \"condition\": {\"$eq\": \"shoes\"}}",
    };
    MossSearchResult *eq_res = NULL;
    check(moss_client_query(client, index_name, "running gear", &eq_opts, &eq_res), "query_eq");
    print_results(eq_res);
    moss_free_search_result(eq_res);

    // 4. $and - shoes AND price < 100
    printf("\n$and: shoes and price < 100\n");
    MossQueryOptions and_opts = {
        .top_k = 5, .alpha = 0.6f,
        .filter_json = "{\"$and\": ["
                        "{\"field\": \"category\", \"condition\": {\"$eq\": \"shoes\"}},"
                        "{\"field\": \"price\", \"condition\": {\"$lt\": \"100\"}}"
                       "]}",
    };
    MossSearchResult *and_res = NULL;
    check(moss_client_query(client, index_name, "running shoes", &and_opts, &and_res), "query_and");
    print_results(and_res);
    moss_free_search_result(and_res);

    // 5. $in - city in [new-york]
    printf("\n$in: city in [new-york]\n");
    MossQueryOptions in_opts = {
        .top_k = 5,
        .filter_json = "{\"field\": \"city\", \"condition\": {\"$in\": [\"new-york\"]}}",
    };
    MossSearchResult *in_res = NULL;
    check(moss_client_query(client, index_name, "city essentials", &in_opts, &in_res), "query_in");
    print_results(in_res);
    moss_free_search_result(in_res);

    // 6. $near - within 5km of Times Square
    printf("\n$near: within 5km of a coordinate\n");
    MossQueryOptions near_opts = {
        .top_k = 5,
        .filter_json = "{\"field\": \"location\", \"condition\": {\"$near\": \"40.7580,-73.9855,5000\"}}",
    };
    MossSearchResult *near_res = NULL;
    check(moss_client_query(client, index_name, "city products", &near_opts, &near_res), "query_near");
    print_results(near_res);
    moss_free_search_result(near_res);

    // 7. Cleanup.
    bool deleted = false;
    check(moss_client_delete_index(client, index_name, &deleted), "delete_index");

    moss_client_free(client);
    return 0;
}
```

For the filter format and the full operator list, see
[Metadata filters](https://docs.moss.dev/docs/reference/c/api.md#metadata-filters) in the API reference.
