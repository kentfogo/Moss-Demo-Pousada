<!-- Source: https://docs.moss.dev/docs/build/electron-local-search.md -->
# Electron App Local Search

> Run a Moss index in the Electron main process and query it from the renderer over IPC.

The Electron main process owns the Moss client and the index; the renderer calls it over
IPC to run queries. The index is queried in-process, so search is a local function call
rather than a network request and works offline. The index persists to the user data
directory and syncs in the background when a connection is available.

## Architecture

![An Electron renderer searches over IPC through the main process, which owns the Moss client and an index on disk](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/electron-local-search-light.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=1367dfcb0372cb3d285f63cab27cf59d)

![An Electron renderer searches over IPC through the main process, which owns the Moss client and an index on disk](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/electron-local-search-dark.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=439b1020e270ea7958e1be7a184482cf)

* Main process owns a Moss client
* Renderer calls main via IPC for index/query
* Index persisted to the user data directory

## Example (main process)

```ts theme={null}
// main.ts
import { app, ipcMain } from 'electron'
import { MossClient } from '@moss-js/moss'

let client: MossClient
const INDEX = 'electron-docs'

app.whenReady().then(async () => {
  client = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!)
  await client.createIndex(INDEX, initialDocs, { modelId: 'moss-minilm' })
})

ipcMain.handle('search', async (_e, q: string) => {
  await client.loadIndex(INDEX)
  return client.query(INDEX, q, { topK: 5 })
})
```

## Related

> [card] [Offline-first search](https://docs.moss.dev/docs/build/offline-first-search.md)
>
> The retrieval pipeline in depth.

> [card] [Local embeddings](https://docs.moss.dev/docs/build/local-embeddings.md)
>
> Embed on-device for privacy.
