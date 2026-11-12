<!-- Source: https://docs.moss.dev/docs/founding-agent/embed/react-components.md -->
# React components

> Drop the Founding Agent voice UI onto your site with the React provider and bubble.

## Minimal example

Render `MossFoundingAgentProvider` with `MossFoundingAgentBubble` inside it. Both are exported from the `/react` subpath. Point `tokenEndpoint` at your [server token route](https://docs.moss.dev/docs/founding-agent/embed/server-token-route.md); it defaults to `/api/moss-token`. The widget needs Tailwind CSS v4 in your app; see [Styling](https://docs.moss.dev/docs/founding-agent/embed/install-and-keys.md#styling).

```tsx Next.js App Router theme={null}
// components/moss-agent.tsx
"use client";
import {
  MossFoundingAgentBubble,
  MossFoundingAgentProvider,
} from "@moss-js/founding-agent/react";

export function MossAgent() {
  return (
    <MossFoundingAgentProvider publishableKey="pk_your_publishable_key">
      <MossFoundingAgentBubble color="emerald" />
    </MossFoundingAgentProvider>
  );
}

// app/layout.tsx
import { MossAgent } from "@/components/moss-agent";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <MossAgent />
      </body>
    </html>
  );
}
```

```tsx Any React app theme={null}
import {
  MossFoundingAgentBubble,
  MossFoundingAgentProvider,
} from "@moss-js/founding-agent/react";

export default function App() {
  return (
    <MossFoundingAgentProvider
      publishableKey="pk_your_publishable_key"
      tokenEndpoint="/your/token/endpoint"
    >
      <MossFoundingAgentBubble color="emerald" />
    </MossFoundingAgentProvider>
  );
}
```

> [!NOTE]
>
> In Next.js, keep `app/layout.tsx` a server component. The provider is a client component, so it lives in its own `"use client"` file that the layout renders.

## MossFoundingAgentProvider

**publishableKey** `string` *required*

Your `pk_...` key. Safe to expose in the browser.

**tokenEndpoint** `string` (default: /api/moss-token)

Your server route that mints the session (see the [server token route](https://docs.moss.dev/docs/founding-agent/embed/server-token-route.md) page).

**serviceUrl** `string`

Optional override of the Moss service base. Leave unset in production.

## MossFoundingAgentBubble

**position** `"inline" | "fixed"`

Inline renders the bubble in the page flow; fixed pins it to a corner of the viewport.

**color** `string` (default: violet)

Orb color used until you save an appearance in the portal. One of `violet`, `cobalt`, `teal`, `emerald`, `coral`, or `amber`, or a hex color such as `#3E7B4F`. Ignored once the agent has a saved appearance.

**themeMode** `"light" | "dark"`

Forces the widget's color scheme. When omitted, the widget uses the theme from the agent's appearance, or `light` if none is saved.

**appearance** `object`

Sets the orb in code and overrides the portal's Appearance tab. Leave it unset to manage the look from the portal. See [Appearance](#appearance).

**hideOnSelector** `string`

Optional CSS selector. The bubble hides while a matching element is visible on the page.

## Appearance

By default the bubble uses the appearance saved in the portal's [Appearance tab](https://docs.moss.dev/docs/founding-agent/portal/create-and-configure.md#customize-the-appearance). The provider fetches it when it mounts, so a saved change reaches visitors the next time they load your site, with no redeploy.

Props on `MossFoundingAgentBubble` take precedence over the portal:

| Setting | Order of precedence |
| - | - |
| Orb | `appearance` prop, then the portal appearance, then the `color` preset |
| Theme | `themeMode` prop, then the `widget_theme` of the `appearance` prop, then the portal theme, then `light` |

To pin the look in code instead, pass a full `appearance` object:

```tsx theme={null}
<MossFoundingAgentBubble
  appearance={{
    shape: "flow",
    colors: ["#ABE6C7", "#BFDBFE"],
    soften: 10,
    noise: 0,
    widget_theme: "light",
  }}
/>
```

`shape` is one of `pixel`, `flow`, `radio`, `stripes`, or `conic`. `colors` holds one or two hex colors. `soften` ranges from 0 to 24 and `noise` from 0 to 1; out-of-range values are clamped. `widget_theme` is `light` or `dark`.

## Live transcript

Add `<MossLiveTranscript />` as a child of the provider to render the running transcript.

```tsx theme={null}
// components/moss-agent.tsx
"use client";
import {
  MossFoundingAgentBubble,
  MossFoundingAgentProvider,
  MossLiveTranscript,
} from "@moss-js/founding-agent/react";

export function MossAgent() {
  return (
    <MossFoundingAgentProvider publishableKey="pk_your_publishable_key">
      <MossFoundingAgentBubble color="emerald" />
      <MossLiveTranscript />
    </MossFoundingAgentProvider>
  );
}
```

## Custom UI

If you want to build your own controls, `useVoiceAgentStore` from `@moss-js/founding-agent/react` exposes read-only state including `connectionState`, `voiceState`, and `transcript`. Import the hook inside a component that is already wrapped by the provider.

## Advanced experiences

> [!NOTE]
>
> Guided, conversation-driven site control (scrolling and navigating your site from within the call) is possible with Moss. Contact the Moss team to enable it.

## Next steps

> [card] [Demo booking](https://docs.moss.dev/docs/founding-agent/embed/booking.md)
>
> Let visitors book a demo by voice, backed by your Cal.com, Calendly or Google Calendar.
