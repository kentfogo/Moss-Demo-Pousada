<!-- Source: https://docs.moss.dev/docs/start/what-is-moss.md -->
# What is Moss?

> Real-time semantic search that runs where your agent lives

Moss is the runtime for real-time semantic search in conversational apps. It delivers sub-10 ms lookups and instant index updates without extra infrastructure. It runs in the browser, on-device, or in the cloud - wherever your agent lives - so search feels native. Connect your data once; Moss packages, distributes, and keeps indexes fresh. Because the index lives next to your agent, retrieval is a function you call, not a service you query.

* Sub-10 ms lookups with instant updates
* Real-time sessions (Python, JavaScript, Swift, Elixir, C): index and query locally during a conversation, then sync to the cloud
* No infra to run; local-first with optional sync
* Browser, device, or cloud - same API

## Use cases

* Sub-10 ms answers for docs, FAQ, and in-app search
* Grounding agents with your data without centralizing user info
* Local or hybrid embeddings with minimal infrastructure

## Capabilities

> [card] [Real-Time Local Indexing](https://docs.moss.dev/docs/build/real-time-local-indexing.md)
>
> Index and query on-device in milliseconds, with no network round trip.

> [card] [Live-Call Context](https://docs.moss.dev/docs/build/live-call-context.md)
>
> Short-term session context plus long-term knowledge, during a call.

> [card] [Data Hydration & Sync](https://docs.moss.dev/docs/build/data-hydration-sync.md)
>
> Hydrate from the cloud and stay fresh with zero-downtime hot-swaps.

> [card] [Cross-Agent Handoff](https://docs.moss.dev/docs/build/cross-agent-handoff.md)
>
> Carry full context across agents, channels, and devices.

## SDKs

One model across every surface: JavaScript (Node), Python, Swift (iOS), Android, Elixir, C, and an in-browser/WASM build.

## Using Moss Portal

* Sign up at Moss, confirm email, and sign in
* From the portal, copy your **Project ID**, then open **API Keys** and create a key
* Join our Discord to get onboarded: [Moss Discord](https://discord.gg/eMXExuafBR)

![Moss Portal walkthrough](https://github.com/user-attachments/assets/c3db9d2d-0df5-4cec-99fd-7d49d0a30844)

## Samples

* View samples repo: [moss on GitHub](https://github.com/usemoss/moss)
* JavaScript: `javascript/comprehensive_sample.ts`, `javascript/load_and_query_sample.ts`
* Python: `python/comprehensive_sample.py`, `python/load_and_query_sample.py`
* Adapt by swapping the FAQ data with your own, or plug Moss calls into your app

## How it works (at a glance)

* **Index:** Convert your data into an efficient local index
* **Embeddings:** Generate vectors on-device (`moss-minilm`, `moss-mediumlm`) or supply your own
* **Sessions:** Index and query locally in real time during a live interaction, then sync to the cloud
* **Retrieval:** Load the index, then query in-memory with semantic or hybrid search
* **Storage:** Persist indexes locally and optionally sync to cloud

## Next steps

* [Quickstart (JS/Python)](https://docs.moss.dev/docs/start/quickstart.md)
* [Core Concepts](https://docs.moss.dev/docs/start/core-concepts.md)
* [Authentication](https://docs.moss.dev/docs/integrate/authentication.md)
