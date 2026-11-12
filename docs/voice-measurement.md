# Measuring voice to voice

**Voice to voice** is the time from the moment you stop speaking to the moment you hear Moss. It needs a real browser, a real microphone and real speakers, so it can't be measured from a cloud container. This takes about 15 minutes.

## What gets measured

Each voice turn is split into four stages that add up to the total:

| Stage | From → to | What it includes |
|---|---|---|
| Hearing you finish | you stop speaking → the request is sent | the transcriber catching up, deciding you've finished, and the app's short pause |
| Moss reply | request sent → the spoken reply arrives | network to the server, retrieval, Moss inference (the talker call) |
| Speech synthesis | reply arrives → the first sound plays | text-to-speech and audio start-up, plus the audio device's own delay |
| Other waits | anything left over | for example waiting for a sentence to finish |

"You stop speaking" comes from the microphone's level (a voice-activity detector), not from the transcript, which arrives 100–300 ms after your last word. The detector runs on the Deepgram mic, or on the browser's recognizer when the URL has `?measure`.

## Setup

1. Install and configure:

   ```bash
   npm install
   cp .env.example .env
   ```

   In `.env`, set `MOSS_PROJECT_ID` and `MOSS_PROJECT_KEY`. For Deepgram voices (Aura) and Deepgram transcription, also set `DEEPGRAM_API_KEY`. The key needs the **Member** role or higher to mint browser tokens. Without Deepgram, the browser's own speech is used.

2. Start the server:

   ```bash
   npm start
   ```

3. In **Chrome**, open `http://localhost:3000/?debug&measure`. The latency panel opens (`?debug`), and the voice detector runs even without Deepgram (`?measure`).

4. **Use headphones.** On speakers, the mic hears Moss's voice, which confuses the voice detector and can interrupt Moss.

## Run

1. Click the **mic** button to start a live conversation, and allow the microphone.
2. Say these turns, one at a time. Wait until Moss has finished speaking and the page has changed before the next one:
   1. "Just build a landing page for a small bakery in Leeds called Crumb."
   2. "Make the headline punchier."
   3. "Add a FAQ about delivery."
   4. "Make it warmer."
   5. "Move the testimonials above the features."
   6. "Add a page for our opening hours."
   7. "Make the buttons bigger."
   8. "Shorten the hero text."
   9. "Add a section with three customer quotes."
   10. "Go back to the home page."
   Turns 4, 7 and 10 are answered on the page without calling Moss. They show the floor: the voice-to-voice time with no model call at all.
3. In the latency panel, click **Voice report**. It copies a summary (p50 and p95 per stage, then every turn) to the clipboard. Paste it back into the chat.
4. Optional: in the panel's **Voice** switch, pick another engine (Aura, Kokoro or Browser) and repeat a few turns, then copy the report again.

## Optional: an independent check

The app's numbers come from the browser's clocks. To check them from outside, record the session with a second device (a phone on the desk is fine), with Moss on speakers for just this part. Open the recording in an audio editor such as Audacity, and for three turns measure the silence between the end of your last word and Moss's first sound. It should match the report's "Voice to voice" within about 50 ms.

## Reading the result

For a natural conversation, voice agents aim for about 500–800 ms voice to voice. In typical systems the largest stage is **hearing you finish**, because the transcriber waits for a pause before it decides you're done. Next comes **speech synthesis**. Moss's own reply is usually the smallest stage here: its first token takes about 100 ms. The report shows which stage to work on first.
