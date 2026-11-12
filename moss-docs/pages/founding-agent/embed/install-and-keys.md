<!-- Source: https://docs.moss.dev/docs/founding-agent/embed/install-and-keys.md -->
# Install and keys

> Install the Founding Agent SDK and set up your publishable and API keys.

## Install

```bash npm theme={null}
npm install @moss-js/founding-agent @livekit/components-react @livekit/components-styles livekit-client motion lucide-react zustand tslib
```

```bash pnpm theme={null}
pnpm add @moss-js/founding-agent @livekit/components-react @livekit/components-styles livekit-client motion lucide-react zustand tslib
```

```bash yarn theme={null}
yarn add @moss-js/founding-agent @livekit/components-react @livekit/components-styles livekit-client motion lucide-react zustand tslib
```

The SDK's React and LiveKit dependencies are optional peer dependencies, so the package manager does not install them on its own. List them in the install command as above, or the widget fails to load.

> [!NOTE]
>
> The Founding Agent SDK moved from `@moss-tools/founding-agent` to `@moss-js/founding-agent` with 2.2.0. Existing `@moss-tools/founding-agent` installs keep working but stay on 2.1.0; switch the dependency name to receive updates.

## Styling

The React widget is styled with [Tailwind CSS](https://tailwindcss.com) v4 classes and ships no stylesheet of its own. Your app needs Tailwind v4, with a `@source` line so Tailwind generates the classes the widget uses. Without it, the bubble renders as an unstyled button.

```css theme={null}
/* app/globals.css */
@import "tailwindcss";
@source "../node_modules/@moss-js/founding-agent/dist/**/*.{js,mjs}";
```

The `@source` path is relative to the CSS file, so adjust it if your stylesheet lives elsewhere.

> [!WARNING]
>
> If your site doesn't already use Tailwind, `@import "tailwindcss"` also applies Tailwind's base styles to your pages, which reset default margins, heading sizes and list styles.

## Keys

> [card] Publishable key
>
> Starts with `pk_`. Safe to expose in the browser. Used by the React provider to identify your agent.

> [card] API key
>
> Starts with `sk_`. A server secret used to mint sessions. Shown once, so store it safely and never ship it to the browser.

Find both keys in the portal under your agent's Deploy step at [https://portal.usemoss.dev/fa](https://portal.usemoss.dev/fa).

> [!WARNING]
>
> Never ship the `sk_...` API key to the browser. Keep it in server-side environment variables only.

## Environment variables

Keep the API key in a server-side environment variable so it never reaches the browser. The token route reads it as `MOSS_FA_API_KEY`.

```env theme={null}
MOSS_FA_API_KEY=sk_yourcompany_...
```

The publishable key is browser-safe. Pass it to the provider directly, or read it from a `NEXT_PUBLIC_` variable if you prefer. See [React components](https://docs.moss.dev/docs/founding-agent/embed/react-components.md).

## Next steps

> [card] [Server token route](https://docs.moss.dev/docs/founding-agent/embed/server-token-route.md)
>
> Create the server route that mints a short-lived session for the browser.
