<!-- Source: https://docs.moss.dev/docs/integrations/vitepress.md -->
# VitePress

> Add semantic search to your VitePress documentation site with zero configuration using Moss.

Add semantic search to your [VitePress](https://vitepress.dev/) documentation site using the `vitepress-plugin-moss` package. The plugin automatically indexes your content at build time and replaces the default search with a fast, semantic search interface powered by Moss.

> **Note:** For the full plugin source and a demo site, see the [vitepress-plugin-moss package](https://github.com/usemoss/moss/tree/main/packages/vitepress-plugin-moss).

## Why use Moss with VitePress?

VitePress's built-in search relies on keyword matching, which misses results when users phrase queries differently than the docs. Moss semantic search understands meaning, so users find what they need even when their wording doesn't match the docs exactly. Queries run in under 10ms once the local index loads.

## Required tools

* [Moss](https://www.moss.dev/) account with project credentials
* [VitePress](https://vitepress.dev/) 1.0+
* [Node.js](https://nodejs.org/) 18+

## Integration guide

**1. Installation**

> [tab] npm
>
> ```bash theme={null}
> npm install vitepress-plugin-moss
> ```

> [tab] pnpm
>
> ```bash theme={null}
> pnpm add vitepress-plugin-moss
> ```

> [tab] yarn
>
> ```bash theme={null}
> yarn add vitepress-plugin-moss
> ```

> [!WARNING]
>
> Your project's `package.json` must have `"type": "module"` because VitePress is ESM-only.

**2. Environment setup**

Create a `.env` file in your project root (add it to `.gitignore`).

```bash .env theme={null}
MOSS_PROJECT_ID=your_project_id
MOSS_PROJECT_KEY=your_api_key
MOSS_INDEX_NAME=my-docs
```

**3. Configure VitePress**

Add the Moss plugin and search options to your VitePress config.

```typescript docs/.vitepress/config.ts theme={null}
import { defineConfig } from 'vitepress'
import { mossIndexerPlugin } from 'vitepress-plugin-moss'

export default defineConfig({
  title: 'My Docs',
  themeConfig: {
    search: {
      provider: 'moss' as any,
      options: {
        projectId: process.env.MOSS_PROJECT_ID!,
        projectKey: process.env.MOSS_PROJECT_KEY!,
        indexName: process.env.MOSS_INDEX_NAME!,
      },
    },
  },
  vite: {
    plugins: [mossIndexerPlugin()],
  },
})
```

**4. Build and test**

When you run `vitepress build`, the plugin automatically parses your Markdown, chunks it into semantic segments, and uploads them to Moss. For local development, start the dev server and press `Ctrl+K` or `Cmd+K` to test search.

```bash theme={null}
vitepress dev docs
```

## How it works

The plugin uses a two-phase search architecture:

1. **Cloud hot-path** -- From the first keystroke, queries route to Moss cloud for instant results.
2. **Local WebAssembly** -- In the background, the local model and index download in parallel. Once ready, queries switch to sub-10ms on-device search automatically.

## Excluding pages

Add `search: false` to a page's frontmatter to exclude it from the index.

```yaml theme={null}
---
search: false
---
```

## Configuration

### Search options

All options go under `themeConfig.search.options` in your VitePress config.

| Parameter | Type | Default | Description |
| :- | :- | :- | :- |
| `projectId` | `string` | Required | Your Moss Project ID. |
| `projectKey` | `string` | Required | Your Moss Project Key. |
| `indexName` | `string` | Required | Name of the index to create on every build. |
| `topK` | `number` | `10` | Number of results to return. |
| `placeholder` | `string` | `"Search docs..."` | Search input placeholder text. |
| `buttonText` | `string` | `"Search"` | Nav bar search button label. |

### Keyboard shortcuts

| Key | Action |
| :- | :- |
| `Ctrl+K` / `Cmd+K` | Open or close search |
| `/` | Open search (when not focused on an input) |
| `Up` / `Down` | Navigate results |
| `Enter` | Go to selected result |
| `Esc` | Close search |
