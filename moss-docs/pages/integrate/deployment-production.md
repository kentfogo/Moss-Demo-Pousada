<!-- Source: https://docs.moss.dev/docs/integrate/deployment-production.md -->
# Deployment / Production

> Checklist for shipping Moss-backed features

## Checklist

* Configure API keys via env vars
* Persist indexes to a durable path
* Size each process for the embedding model and its loaded indexes
  ([Memory sizing](https://docs.moss.dev/docs/integrate/memory-sizing.md))
* Monitor index size and query latency
* Enable sync (optional) and test offline mode
* Add health checks for embedding/runtime services
* Close clients and sessions on shutdown, and close idle ones in apps that search in bursts
  ([Releasing resources](https://docs.moss.dev/docs/integrate/releasing-resources.md))

## Security

* Keep data local whenever possible
* Review what the SDKs send to Moss ([Telemetry](https://docs.moss.dev/docs/reference/telemetry.md))
* Encrypt synced data at rest/in transit

## Observability

* Track query latency (p50/p95) and index size growth
* Log index lifecycle events (create/load/delete, rebuilds)
* Establish backup/export cadence for disaster recovery
