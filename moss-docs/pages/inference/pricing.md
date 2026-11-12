<!-- Source: https://docs.moss.dev/docs/inference/pricing.md -->
# Pricing

> How Moss Inference bills: credits, tokens, prompt caching, retrievals and your own vendor key.

Moss Inference bills tokens and retrievals from your credits. This page covers credits, the `moss/fastlane-1` prices, vendor models, your own key and caching.

## Credits

Inference bills from credits on every plan, with no included allowance.

* Buy credits on the Billing page of the [Moss portal](https://portal.usemoss.dev). The minimum purchase is \$5.
* Set auto-reload on the same page.
* Only organization owners can buy credits.

> [!WARNING]
>
> When your credits run out, requests return `429 usage_limit_exceeded` until you add credits.

## The Moss model

| Item | Price |
| - | - |
| Input tokens | \$0.25 / 1M tokens |
| Cached input tokens | \$0.03 / 1M tokens |
| Output tokens | \$1.75 / 1M tokens |
| Retrieval | \$0.50 / 1k retrievals |

Tokens are the `usage` counts of each reply. Input tokens include the retrieved facts.

## Vendor models on the Moss key

A vendor model called without your own key bills your credits per token. [Models](https://docs.moss.dev/docs/inference/models.md#model-table) lists the input, cached input, cache write and output prices of each model.

Retrievals bill at the same price as on `moss/fastlane-1`.

## Your own key

With your own key in `X-Moss-Provider-Key`, the vendor bills the tokens to your vendor account. Moss bills only the retrievals. See [Bring your own key](https://docs.moss.dev/docs/inference/bring-your-own-key.md).

## Prompt caching

Prompt tokens a model already holds from an earlier call bill at the cached input price.

* On `moss/fastlane-1`, these are in the prefix cache, such as a repeated system prompt or the earlier turns of a conversation.
* The Chat Completions field `usage.prompt_tokens_details.cached_tokens` counts them, and Responses uses `usage.input_tokens_details.cached_tokens`. The rest of the prompt bills at the input price.
* Where a model lists a cache-write price, prompt tokens written to the vendor's cache bill at that price.

The reply cache is separate. It answers a repeated request without a model call, and the reply reports 0 prompt tokens (`usage.prompt_tokens` on Chat Completions, `usage.input_tokens` on Responses). A reply-cache hit is free.

## Retrievals

A retrieval is one search of your indexes: the search that `X-Moss-Indexes` runs before the model, or one call of the [Moss search tool](https://docs.moss.dev/docs/inference/moss-search.md) that an index answered. It bills the same on every model, your own key included.

* The price is \$0.50 / 1k retrievals.
* A call that names no index in `X-Moss-Indexes` and has no `moss_search` tool has no search and no retrieval charge.
* A reply-cache hit is not a retrieval.

[Ground answers in your indexes](https://docs.moss.dev/docs/inference/retrieval.md) covers choosing indexes.

## Usage

Inference is not billed as session minutes. The Usage page in the [Moss portal](https://portal.usemoss.dev) shows inference tokens per model and retrievals.
