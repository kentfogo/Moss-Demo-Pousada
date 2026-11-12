<!-- Source: https://docs.moss.dev/docs/inference/sdks.md -->
# SDKs

> The inference client in each Moss SDK, with its package and minimum version.

Each Moss SDK has an inference client for the Responses endpoint, separate from `MossClient`. Any OpenAI client also works with the base URL changed: see [OpenAI compatibility](https://docs.moss.dev/docs/inference/openai-compatibility.md).

## Packages

| SDK | Package | Minimum version | Client |
| - | - | - | - |
| [Python](https://docs.moss.dev/docs/inference/sdks/python.md) | `moss` | 1.22.0 | `MossInference` |
| [JavaScript](https://docs.moss.dev/docs/inference/sdks/javascript.md) | `@moss-js/moss` | 1.22.0 | `MossInference` |
| [Browser](https://docs.moss.dev/docs/inference/sdks/browser.md) | `@moss-dev/moss-web` | 1.8.0 | `MossInference` |
| [Swift](https://docs.moss.dev/docs/inference/sdks/swift.md) | `Moss` Swift package | 0.13.0 | `MossInference` |
| [Android](https://docs.moss.dev/docs/inference/sdks/android.md) | `moss-android` AAR | 0.29.0 | `dev.usemoss.moss.MossInference` |
| [Elixir](https://docs.moss.dev/docs/inference/sdks/elixir.md) | `moss` | 1.11.0 | `Moss.Inference` |
| [C](https://docs.moss.dev/docs/inference/sdks/c.md) | `libmoss` | 0.29.0 | `moss_inference_new`, `moss_inference_free` |

## Guides

> [card] [Python](https://docs.moss.dev/docs/inference/sdks/python.md)
>
> An async client in the `moss` package.

> [card] [JavaScript](https://docs.moss.dev/docs/inference/sdks/javascript.md)
>
> A drop-in for OpenAI's client, plus `indexes`.

> [card] [Browser](https://docs.moss.dev/docs/inference/sdks/browser.md)
>
> Call from a page, with the project key kept on your server.

> [card] [Swift](https://docs.moss.dev/docs/inference/sdks/swift.md)
>
> `responses.create`, and `createStreaming` for events.

> [card] [Android](https://docs.moss.dev/docs/inference/sdks/android.md)
>
> A Kotlin client to call from `Dispatchers.IO`.

> [card] [Elixir](https://docs.moss.dev/docs/inference/sdks/elixir.md)
>
> `Moss.Inference.Responses.create/3`, from any process.

> [card] [C](https://docs.moss.dev/docs/inference/sdks/c.md)
>
> Requests and responses as JSON, with an event callback.
