<!-- Source: https://docs.moss.dev/docs/founding-agent/embed/server-token-route.md -->
# Server token route

> Mint a Founding Agent session from your server so your API key never reaches the browser.

## Why a server route

Your API key must stay on the server. The browser calls your own route; your route calls Moss with the secret key and returns a short-lived session token to the browser. This keeps your `sk_...` key out of client bundles entirely.

> [!WARNING]
>
> The API key is a server secret. Never ship it to the browser or commit it to client code.

## Create the route

The example below uses Next.js App Router. The same `createFoundingAgentSession` call works from any Node server.

```ts theme={null}
// app/api/moss-token/route.ts
import { createFoundingAgentSession } from "@moss-js/founding-agent";

export async function POST() {
  const session = await createFoundingAgentSession({
    apiKey: process.env.MOSS_FA_API_KEY!,
  });
  return Response.json(session);
}
```

## Response

The route returns a JSON object with the following fields.

**token** `string`

LiveKit access token for the browser to join the session.

**serverUrl** `string`

LiveKit server URL to connect to.

**roomName** `string`

The session's room name.

**bookingNonce** `string`

Optional. One-time value that enables the booking and intake forms.

> [!NOTE]
>
> Return the whole session object, as the example above does. Returning only `token` and `serverUrl` silently disables the booking and intake forms, which need `bookingNonce`.

> [!NOTE]
>
> `createFoundingAgentSession` also accepts `serviceUrl` and `timeoutMs`. The defaults are correct for production, so you can omit them.

## Next steps

> [card] [React components](https://docs.moss.dev/docs/founding-agent/embed/react-components.md)
>
> Add the provider and voice bubble to your React app.
