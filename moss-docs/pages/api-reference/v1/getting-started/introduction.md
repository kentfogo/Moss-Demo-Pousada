<!-- Source: https://docs.moss.dev/docs/api-reference/v1/getting-started/introduction.md -->
# Introduction

> Base URL and overview for the Moss Control Plane API.

The Moss Control Plane API powers all index lifecycle operations for Moss. It exposes a single authenticated control plane endpoint for managing indexes. This page documents every supported action, request shape, and response payload so you can wire the service into your applications or SDKs.

> **Base URL**
>
> ```text theme={null}
> https://service.usemoss.dev/v1
> ```

[Moss Inference](https://docs.moss.dev/docs/inference/overview.md), which serves [responses](https://docs.moss.dev/docs/api-reference/v1/inference/responses.md) and [chat completions](https://docs.moss.dev/docs/api-reference/v1/inference/chat-completions.md) grounded in your indexes, has its own base URL and bearer-token auth:

> **Inference base URL**
>
> ```text theme={null}
> https://inference.moss.dev/v1
> ```
