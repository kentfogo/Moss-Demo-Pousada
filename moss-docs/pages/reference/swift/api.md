<!-- Source: https://docs.moss.dev/docs/reference/swift/api.md -->
# Moss Swift SDK overview

> On-device semantic search for iOS with the Moss Swift SDK.

The Moss Swift SDK brings semantic search to iOS. It wraps the native `libmoss`
runtime and exposes an idiomatic `async`/`await` API. Documents are embedded
and queried **on-device**, with optional cloud sync.

## Requirements

* iOS 15+
* Xcode 15+
* Apple Silicon for the simulator (the SDK ships arm64 device + simulator slices)

## Install

Add the package in Xcode via **File ▸ Add Package Dependencies…** and enter
`https://github.com/usemoss/moss`, or declare it in `Package.swift`:

```swift theme={null}
dependencies: [
  .package(url: "https://github.com/usemoss/moss", from: "0.15.0"),
],
targets: [
  .target(name: "YourTarget", dependencies: [
    .product(name: "Moss", package: "moss"),
  ]),
]
```

On first build, Xcode downloads the precompiled `Moss.xcframework` from the
GitHub release and verifies its checksum.

## Two ways to search

The Swift SDK exposes two entry points:

* [`MossClient`](./classes/MossClient) - the entry point. Construct it with
  your credentials, open sessions, and track push jobs.
* [`MossSession`](./classes/MossSession) - an **on-device** index. Embed and
  query documents locally with no network calls, persist to disk, and sync to
  the cloud with `pushIndex` / `loadIndex`.

Model responses grounded in your indexes come from a separate client,
`MossInference`. See [Inference](https://docs.moss.dev/docs/inference/sdks/swift.md).

## Indexing & sync

Indexes are created **locally**: open a session, call `addDocs`, and the
documents are embedded and stored on-device - no network required.

To share an index across devices or back it up, sync it through the cloud:

* **Push** - [`MossSession.pushIndex()`](./classes/MossSession#pushindex)
  publishes the local index to the cloud.
* **Pull** - [`MossSession.loadIndex(_:)`](./classes/MossSession#loadindex-_)
  hydrates a fresh session from a cloud index.

The cloud is the source of truth, so an index built on one device can be pulled
and queried on another. By default `loadIndex` is a one-time pull, so re-pull to
pick up later changes; continuous **auto-sync** - keeping a loaded index current
automatically - is also available if you'd rather not re-pull by hand.

## Quick start

Build an index on-device, push it to the cloud, then load it back:

```swift theme={null}
import Moss

let client = try MossClient(projectId: "your_project_id", projectKey: "your_project_key")
defer { client.close() }

// 1. Build an index on-device. Documents are embedded locally and can carry
//    metadata you filter on later.
let session = try await client.session("products")
try await session.addDocs([
  .init(id: "p1", text: "Running shoes with breathable mesh.",
        metadata: ["category": "shoes", "brand": "swiftfit", "price": "79", "city": "new-york"]),
  .init(id: "p2", text: "Lightweight city backpack.",
        metadata: ["category": "bags", "brand": "urbanpack", "price": "95", "city": "seattle"]),
])

// 2. Query locally. Tune `alpha` and add metadata filters - see the Querying guide.
let hits = try await session.query("something to run in", options: .init(topK: 3))
hits.docs.forEach { print($0.score, $0.id) }

// 3. Push it to the cloud and wait for the job to finish.
let push = try await session.pushIndex()
session.close()
while try await client.getJobStatus(push.jobId).status != "ready" {
  try await Task.sleep(nanoseconds: 1_000_000_000)
}

// 4. Load it back into a new session and query - still on-device.
let restored = try await client.session(push.indexName)
defer { restored.close() }
_ = try await restored.loadIndex(push.indexName)
let results = try await restored.query("something to run in", options: .init(topK: 3))
print(results.docs.map(\.id))
```

## Models

The on-device embedding model defaults to `moss-litelm` on iOS. Pass
`"custom"` as the session `modelId` to supply your own pre-computed embeddings
via [`DocumentInfo.embedding`](./types#documentinfo).

## Preparing documents

A few guidelines for the best retrieval quality and a compact index:

* **Document size** - aim for roughly **100-250 tokens of text per document**.
  Split long content (a chapter, a transcript) into focused chunks rather than
  one large document.
* **Metadata** - metadata is free-form `[String: String]`. Put anything you'll
  filter on (category, ids, coordinates) here - see the
  [Querying guide](https://docs.moss.dev/docs/reference/swift/querying.md).

## Cross-platform

All Moss SDKs - **Swift (iOS)**, **Python**, and **JavaScript** - are
interoperable and read the same indexes. An index built or pushed from one SDK
can be loaded and queried from another.

## Reference

* **Classes** - [MossClient](https://docs.moss.dev/docs/reference/swift/classes/MossClient.md), [MossSession](https://docs.moss.dev/docs/reference/swift/classes/MossSession.md)
* **Guides** - [Querying](https://docs.moss.dev/docs/reference/swift/querying.md) (hybrid search + metadata filtering), [Custom Authenticator](https://docs.moss.dev/docs/reference/swift/custom-authenticator.md)
* **Types** - [DocumentInfo, QueryOptions, SearchResult, and more](https://docs.moss.dev/docs/reference/swift/types.md)

## Example app

A complete SwiftUI sample app is in
[`examples/ios`](https://github.com/usemoss/moss/tree/main/examples/ios).
