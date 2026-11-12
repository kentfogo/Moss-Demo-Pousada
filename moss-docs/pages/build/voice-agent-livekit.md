<!-- Source: https://docs.moss.dev/docs/build/voice-agent-livekit.md -->
# Voice Agent (LiveKit)

> Ground a LiveKit voice agent in your Moss index for real-time retrieval.

LiveKit provides the real-time audio pipeline (speech-to-text, LLM, text-to-speech); Moss
supplies retrieval. The agent loads a Moss index (and optionally opens a session for the live
conversation), then queries it in-process to ground its answers - each lookup is a local call,
not a network request.

## Pipeline

![Voice agent pipeline from mic to speech-to-text, Moss retrieval, LLM, and speaker](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/voice-agent-livekit-light.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=6b53d2e180b30870c6a709180c1d7f83)

![Voice agent pipeline from mic to speech-to-text, Moss retrieval, LLM, and speaker](https://mintcdn.com/moss-afcfb0b6/qKHE-zU1VqxhLNDK/images/diagrams/voice-agent-livekit-dark.svg?fit=max\&auto=format\&n=qKHE-zU1VqxhLNDK\&q=85\&s=8858b7b6e293775c3d94081e05a91a39)

## Two ways to build it

> [card] [LiveKit integration (DIY)](https://docs.moss.dev/docs/integrations/livekit.md)
>
> Add Moss to your own LiveKit agent: load a knowledge index, open a per-call session, and
> expose search as function tools. Full, copy-pasteable recipe.

> [card] [Managed Voice Agents](https://docs.moss.dev/docs/voice-agents/voice-agents.md)
>
> Let Moss host the agent: the Agent SDK, backend token minting, and the deploy CLI.

> [!NOTE]
>
> Prefer to start from a working app? Clone the
> [LiveKit voice agent sample](https://github.com/usemoss/moss/tree/main/apps/livekit-moss-vercel/livekit-voice-agent/livekit-moss-agent)
> and add your own keys.

## How retrieval fits

* Load a Moss index into memory at start; retrieval then runs in-process (single-digit ms).
* For live conversation memory, open a [session](https://docs.moss.dev/docs/integrate/sessions.md) and index transcript
  turns as they arrive - see [Live-call context](https://docs.moss.dev/docs/build/live-call-context.md).
* Expose retrieval to the LLM as a function tool so it searches only when it needs to. This keeps the
  chat context stable at the turn boundary, so retrieval composes with LiveKit preemptive generation -
  see [Retrieval and preemptive generation](https://docs.moss.dev/docs/integrations/livekit.md#retrieval-and-preemptive-generation).

## Related

> [card] [Live-call context](https://docs.moss.dev/docs/build/live-call-context.md)
>
> Short-term session context plus long-term knowledge during a call.

> [card] [Sub-10ms knowledge retrieval](https://docs.moss.dev/docs/build/offline-first-search.md)
>
> The load-then-query retrieval pipeline.
