<!-- Source: https://docs.moss.dev/docs/founding-agent/portal/create-and-configure.md -->
# Create and configure an agent

> Set up your Founding Agent in the portal: identity, voice, teaching, and deploy.

Create and configure your agent in the portal at [https://portal.usemoss.dev/fa](https://portal.usemoss.dev/fa).

## The create wizard

**1. Identify**

Enter your company name. Your agent slug is derived from it and cannot be changed later, so choose carefully. Enter your website URL, which seeds your initial list of allowed domains.

**2. Voice**

Set the greeting your agent speaks at the start of each call, the exit message it speaks when ending a call, and any extra instructions that shape its tone and behavior. These instructions apply to every conversation.

**3. Teach**

Optionally add question-and-answer pairs now to give your agent its first round of knowledge. You can skip this step and come back later from the [Teach](https://docs.moss.dev/docs/founding-agent/portal/teach.md) tab.

**4. Deploy**

The portal shows your publishable key, your API key, and an embed snippet. Copy these before leaving this screen.

> [!WARNING]
>
> Your API key is shown only once: at creation and again when you rotate it. Store it in a secret manager immediately. If you lose it, rotate it from the Security tab to generate a new one.

## Edit configuration later

After creation, open the agent and go to the Agent tab. From there you can update:

* Name and description
* Voice
* Greeting and exit message
* Extra instructions

The Security tab holds your allowed domains and keys. Allowed domains control which origins can embed the agent. Use `*` to allow any origin, or `*.example.com` to allow all subdomains of a specific domain. You can add, edit, and remove domain entries at any time.

The Demo Booking tab turns booking on and off. When booking is enabled, your agent can offer to book a meeting. See [Booking](https://docs.moss.dev/docs/founding-agent/embed/booking.md) for setup details.

## Customize the appearance

Open the agent and go to the Appearance tab to style the voice bubble on your site:

* **Shape**: the animated pattern inside the orb. One of Pixel, Flow, Radio, Stripes, or Conic.
* **Colors**: up to two colors. With one color, the orb animates between lighter and darker shades of it.
* **Texture**: Soften blurs the pattern and Noise adds a grain overlay.
* **Widget theme**: light or dark styling for the bubble and its chat panel.

The Preview card shows the orb idle, listening, and talking. Click **Save** to apply your changes. There is nothing to redeploy: the widget loads its appearance from Moss when your page loads, so visitors see the new look the next time they load your site.

> [!NOTE]
>
> Until you save an appearance for the first time, the widget shows the `color` preset from your embed code. A `themeMode` or `appearance` prop set in code overrides the portal. See [React components](https://docs.moss.dev/docs/founding-agent/embed/react-components.md#appearance).

## Next steps

> [card] [Teach your agent](https://docs.moss.dev/docs/founding-agent/portal/teach.md)
>
> Add the knowledge your agent answers from.

> [card] [Embed on your site](https://docs.moss.dev/docs/founding-agent/embed/install-and-keys.md)
>
> Install the SDK and add the agent to your site.
