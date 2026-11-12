<!-- Source: https://docs.moss.dev/docs/reference/python/web-sources.md -->
# Web Sources (Python SDK)

> Create and resync website sources in the Moss Python SDK to keep searchable index content current.

A web source crawls a website into an index and keeps it up to date. The `MossClient` web
source methods are typed wrappers over the [`/v1/manage` web source
actions](https://docs.moss.dev/docs/api-reference/v1/web-sources/createWebSource): each call goes to the Moss
cloud API with your project key, needs no index loaded locally, and works wherever the SDK
runs.

> [!NOTE]
>
> Requires `moss` **1.10.0+**. Also available in JavaScript as
> [`createWebSource`](../js/web-sources) and the other web source methods (`@moss-js/moss`
> **1.10.0+**). Crawling, manual re-sync, and scheduled refresh are plan gated; see
> [Pricing](https://docs.moss.dev/docs/pricing.md).

```python theme={null}
import asyncio
from moss import JobStatus, ManageApiError, MossClient

client = MossClient(project_id, project_key)

async def wait_for_job(job_id: str) -> None:
    while True:
        job = await client.get_job_status(job_id)
        if job.status.value == JobStatus.COMPLETED:
            return
        if job.status.value == JobStatus.FAILED:
            raise RuntimeError(f"job {job_id} failed")
        await asyncio.sleep(5)

# Two sites, one index. The first call creates the index; the second adds to it.
docs = await client.create_web_source(
    "https://docs.yoursite.com", "support-kb", max_pages=500, max_depth=3, refresh_cadence="weekly"
)
blog = await client.create_web_source("https://blog.yoursite.com", "support-kb", max_pages=200)
await wait_for_job(docs.job_id)
await wait_for_job(blog.job_id)

await client.load_index("support-kb")
results = await client.query("support-kb", "how do I rotate an API key")
```

## Methods

All methods are `async` and the crawl settings are keyword-only.

| Method | Returns | What it does |
| - | - | - |
| `create_web_source(root_url, index_name, *, ...)` | `CreateWebSourceResult` | Registers the site on the index and starts a crawl. `job_id` polls the crawl. |
| `list_web_sources(index_name=None)` | `List[WebSource]` | Every source in the project, newest first, or only the sources on one index. |
| `get_web_source(source_id)` | `WebSource` | One source with its settings, schedule, and last-run stats. |
| `update_web_source(source_id, *, ...)` | `UpdateWebSourceResult` | Changes settings or cadence. With `resync=True` a crawl starts right away and `job_id` is set. |
| `resync_web_source(source_id)` | `ResyncWebSourceResult` | Re-crawls one source. `job_id` polls the crawl. |
| `delete_web_source(source_id)` | `DeleteWebSourceResult` | Removes the source and its pages. `purge_job_id` polls the removal. The index is kept. |

## Several sites on one index

* An index holds up to 20 web sources. Each root URL can be registered once per index; the
  URL with and without a trailing slash is the same source, and a repeat is refused with
  status 409.
* Each source's pages are tracked separately. A crawl or re-sync replaces only that source's
  pages, and `delete_web_source` removes only that source's pages. Other sources and
  documents added with `add_docs` are never touched.
* Crawls on the same index run one at a time. A crawl requested while another runs queues
  and starts on its own; you do not need to wait between `create_web_source` calls.
* Every source on an index uses the index's embedding model, fixed when the index is
  created.

## Create options

Keyword arguments of `create_web_source`, all optional:

| Argument | Default | Notes |
| - | - | - |
| `max_pages` | `500` | Page cap per crawl run, max `5000`. Your plan's crawl size caps it further. |
| `max_depth` | `3` | Link depth from `root_url`, max `10`. |
| `max_documents` | `50000` | Cap on indexed chunks. |
| `include_paths` | none | Only crawl matching path globs, e.g. `["/blog/*"]`. Up to 50. |
| `exclude_paths` | none | Skip matching path globs. Up to 50. |
| `respect_robots` | `True` | Honor robots.txt. |
| `parse_documents` | `True` | Parse linked PDF and DOCX files into the index (50 MB per file, 20 per run). |
| `refresh_cadence` | none | `"daily"` or `"weekly"` for scheduled re-crawls. Omit for a manual source. |
| `model_id` | `"moss-minilm"` | Or `"moss-mediumlm"`. Only used when the index is created. |

## Update options

Keyword arguments of `update_web_source`. Arguments you leave out stay unchanged; crawl
settings apply on the next crawl.

| Argument | Notes |
| - | - |
| `refresh_cadence` | `"daily"`, `"weekly"`, or `"manual"`. Changing it resets the schedule to now plus the interval. |
| `root_url` | Re-point the source. The next crawl indexes the new site and drops the old site's pages. |
| `include_paths`, `exclude_paths` | Path globs. Pass `[]` to clear. |
| `max_depth`, `max_pages` | New caps for future crawls. |
| `resync` | `True` starts a crawl after saving; the result carries `job_id`. |

Crawl settings cannot change while the source is crawling (status 409); the cadence can.
`max_documents`, `respect_robots`, and `parse_documents` are changed through the
[`updateWebSource` API action](https://docs.moss.dev/docs/api-reference/v1/web-sources/updateWebSource).

## The WebSource record

Every method except delete returns a frozen `WebSource` dataclass:

| Field | Notes |
| - | - |
| `id` | Source ID, used by the other methods. |
| `index_name`, `root_url` | The index and the registered URL (a bare origin gains a trailing slash). |
| `max_pages`, `max_documents`, `max_depth`, `include_paths`, `exclude_paths`, `respect_robots`, `parse_documents` | Crawl settings. |
| `refresh_cadence`, `next_refresh_at` | `"daily"`, `"weekly"`, or `"manual"`, and when the next scheduled run is due (`None` for manual). |
| `status` | `"crawling"` while a run is queued or active, `"idle"`, `"failed"`, or `"removing"` while a delete purges its pages. |
| `last_crawled_at`, `last_page_count`, `last_doc_count` | Stats from this source's last completed run. |
| `last_error_code` | Moss error code from the last failed run, or `None`. |

`CreateWebSourceResult` adds `job_id`. `UpdateWebSourceResult` adds `job_id` when `resync`
was `True`. `ResyncWebSourceResult` has `id`, `job_id`, and `status`. `DeleteWebSourceResult`
has `deleted`, `id`, and `purge_job_id`, which is `None` when there was nothing to purge, for
example when the index was already deleted.

## Polling jobs

Crawl and purge jobs are polled with `get_job_status(job_id)`, which returns a
[`JobStatusResponse`](./interfaces/JobStatusResponse). Its `status` is a
[`JobStatus`](./interfaces/JobStatus) object: compare `status.value` with the `JobStatus`
constants, as in the example above, rather than the object itself. `current_phase.value`
moves through `"queued"` (waiting for another crawl or build on the index), `"crawling"`,
`"parsing_documents"` when linked files were found, and `"building_index"`. A queued crawl
reports `status.value == JobStatus.BUILDING` with the phase `"queued"`.

## Errors

Every method raises `ManageApiError` with the HTTP `status` and the API's JSON error body in
the message, which includes the Moss error code.

| `status` | Error code | Cause |
| - | - | - |
| `400` | `VALIDATION_FAILED` | A limit out of range, a non-public `root_url`, an unsupported `model_id`, or a 21st source on the index. |
| `403` | `PLAN_FEATURE_NOT_INCLUDED` | Scheduled refresh or manual re-sync is not on your plan. |
| `404` | `WEB_SOURCE_NOT_FOUND` | Unknown `source_id`. |
| `409` | `WEB_SOURCE_EXISTS` | The root URL is already registered on this index. |
| `409` | `BUILD_IN_PROGRESS` | Crawl settings changed, a re-sync requested, or a delete attempted while the source is crawling. |
| `429` | `USAGE_LIMIT_EXCEEDED` | Concurrent job, crawled URL, index, or credit limits. |
| `503` | | Crawling or the plan check is temporarily unavailable. |

```python theme={null}
try:
    await client.create_web_source("https://docs.yoursite.com", "support-kb")
except ManageApiError as e:
    if e.status == 409:
        pass  # already registered on this index
    else:
        raise
```

## Environment

`MOSS_CLOUD_API_BASE_URL` overrides the API host used by the web source methods (default
`https://service.usemoss.dev`). It does not affect the client's other calls.
