<!-- Source: https://docs.moss.dev/docs/founding-agent/concepts.md -->
# Core concepts

> The vocabulary of the Founding Agent: keys, knowledge, sessions, leads, handoff, and booking.

The terms you will run into across these docs and the portal.

## Setup

**Founding agent and slug.** Your founding agent is the configured voice assistant you create in the portal. The slug is a short identifier derived from your company name, used in room and index names behind the scenes.

**Publishable key and API key.** The publishable key (`pk_...`) is safe to ship in the browser and identifies your agent to the widget. The API key (`sk_...`) is a server secret used to mint sessions, and is shown only once.

**Allowed domains.** The website origins permitted to run your agent. Requests from any other origin are rejected, which prevents unauthorized use of your publishable key.

**Knowledge base.** What the agent answers from, built from question-and-answer pairs and free-form knowledge chunks you add in the portal. Every response is grounded in this content.

## Conversations and leads

**Session.** One voice conversation between a visitor and the agent, from the moment the visitor clicks to talk until the call ends or hands off.

**Visitor and lead.** A visitor is anyone who talks to the agent. A lead is the captured record of that conversation, with a summary and contact details when the visitor provides them.

**Intent label and lead score.** The intent label is an automatic read on how ready a visitor is to buy. The lead score is a numeric value derived from it, shown on each lead in the portal.

**Demo booking.** Letting a visitor schedule a meeting by voice during the conversation, backed by your calendar.

## Live help

**Human handoff.** The transfer of a live conversation from the agent to a person on your team, triggered by the visitor asking for a human or by a high-intent signal the agent detects.

**Operator signal.** An automatic notification that flags a high-intent conversation to your team as a potential lead worth following up on immediately.
