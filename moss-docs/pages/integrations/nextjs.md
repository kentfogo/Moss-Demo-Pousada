<!-- Source: https://docs.moss.dev/docs/integrations/nextjs.md -->
# Next.js

> Add semantic search to a Next.js application using Moss with Server Actions.

Integrate Moss semantic search into a [Next.js](https://nextjs.org/) application using Server Actions. This pattern keeps your API keys secure on the server while giving your frontend sub-10ms search results.

> **Note:** For the complete demo application, see the [Next.js example](https://github.com/usemoss/moss/tree/main/apps/next-js).

## Why use Moss with Next.js?

Server Actions provide a clean boundary between client and server code. Moss runs server-side to keep credentials secure, while the client gets fast, relevant search results without managing API infrastructure or exposing keys.

## Required tools

* [Moss](https://www.moss.dev/) account with project credentials
* [Node.js](https://nodejs.org/) 20.4+

## Integration guide

**1. Installation**

```bash theme={null}
npm install @moss-js/moss
```

> [!NOTE]
>
> Versions below 1.9.0 will stop loading models when the legacy download path is retired. Upgrade to 1.9.0+ before then.

**2. Environment setup**

Create a `.env.local` file in your project root with your Moss credentials.

```bash .env.local theme={null}
MOSS_PROJECT_ID=your_project_id
MOSS_PROJECT_KEY=your_project_key
MOSS_INDEX_NAME=your_index_name
```

**3. Create a Server Action**

Create a Server Action that initializes the Moss client, loads the index, and runs queries.

```typescript app/actions.ts theme={null}
"use server";

import { MossClient } from "@moss-js/moss";

const client = new MossClient(
  process.env.MOSS_PROJECT_ID!,
  process.env.MOSS_PROJECT_KEY!,
);

const indexName = process.env.MOSS_INDEX_NAME!;
const indexReady = client.loadIndex(indexName);

export async function searchMoss(query: string) {
  await indexReady;

  const results = await client.query(indexName, query, { topK: 5 });

  return results.docs.map((doc) => ({
    id: doc.id,
    text: doc.text,
    score: doc.score,
    metadata: doc.metadata,
  }));
}
```

**4. Call from a client component**

Call the Server Action from any client component to display search results.

```tsx app/page.tsx theme={null}
"use client";

import { useState, useTransition } from "react";
import { searchMoss } from "./actions";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  function handleSearch() {
    if (!query.trim()) return;
    startTransition(async () => {
      const data = await searchMoss(query);
      setResults(data);
    });
  }

  return (
    <main>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="Search..."
      />
      <button onClick={handleSearch} disabled={isPending}>
        {isPending ? "Searching..." : "Search"}
      </button>
      {results.map((r, i) => (
        <div key={r.id}>
          <p>{r.text}</p>
          <span>#{i + 1}</span>
        </div>
      ))}
    </main>
  );
}
```
