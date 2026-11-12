<!-- Source: https://docs.moss.dev/docs/integrations/md-indexer.md -->
# Markdown Indexer

> Build and upload a Moss search index from any Markdown or VitePress docs directory.

`@moss-tools/md-indexer` parses a Markdown (or VitePress) docs directory and syncs it to a Moss index in one call. Use it in CI to keep your search index current whenever docs change.

## Installation

```bash theme={null}
pnpm add @moss-tools/md-indexer
# or
npm install @moss-tools/md-indexer
```

**Peer dependency:** VitePress `^1.0.0` (used to resolve config and parse markdown).

## Environment setup

```bash theme={null}
# .env
MOSS_PROJECT_ID=your-project-id
MOSS_PROJECT_KEY=your-project-key
MOSS_INDEX_NAME=your-index-name
MOSS_MODEL_NAME=moss-minilm   # optional, defaults to moss-minilm
```

## Usage

### `sync` — build and upload in one step

The most common path: parse docs and push to Moss immediately.

```typescript theme={null}
import { sync } from '@moss-tools/md-indexer'

// Uses .env variables and the current directory
await sync()

// Custom config
await sync({
  root: './src/docs',
  creds: {
    projectId: 'your-project-id',
    projectKey: 'your-project-key',
    indexName: 'your-index-name',
    modelName: 'moss-minilm',  // optional
  },
})
```

### `buildJsonDocs` — build the index without uploading

Useful for inspecting the output or caching it between steps.

```typescript theme={null}
import { buildJsonDocs } from '@moss-tools/md-indexer'

// Save to a file
await buildJsonDocs('./src/docs', { outputFile: './search-index.json' })

// Or get the array in memory
const documents = await buildJsonDocs('./src/docs')
```

### `createIndex` — upload a pre-built index file

```typescript theme={null}
import { createIndex } from '@moss-tools/md-indexer'

await createIndex('./search-index.json', {
  creds: {
    projectId: 'your-project-id',
    projectKey: 'your-project-key',
    indexName: 'your-index-name',
  },
})
```

## VitePress config resolution

The indexer calls `vp.resolveConfig()` on the path you pass to `sync()` or `buildJsonDocs()`.

* **Config file present** — if `.vitepress/config.ts` (or `.js`) exists, the indexer honours `srcDir`, markdown options, and all other VitePress settings.
* **No config file** — VitePress zero-config mode: all `.md` files in the directory are auto-discovered and processed with default settings. No config file needed for simple doc trees.

If config resolution fails entirely (e.g. invalid path), the indexer throws: `Could not resolve VitePress config in <path>`.

## CI example

Add a step to your pipeline that runs after docs are built:

```yaml theme={null}
- name: Sync docs to Moss
  run: npx tsx scripts/sync-index.ts
  env:
    MOSS_PROJECT_ID: ${{ secrets.MOSS_PROJECT_ID }}
    MOSS_PROJECT_KEY: ${{ secrets.MOSS_PROJECT_KEY }}
    MOSS_INDEX_NAME: docs
```

```typescript theme={null}
// scripts/sync-index.ts
import { sync } from '@moss-tools/md-indexer'
await sync({ root: './docs' })
```
