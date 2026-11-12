<!-- Source: https://docs.moss.dev/docs/cookbook/mortgage-lending-agent.md -->
# Mortgage Lending Agent

> A two-agent voice assistant that hands off from mortgage Q&A to a structured payment flow, sharing session state across the switch.

A LiveKit voice agent that splits a mortgage servicing call into two agents. `MortgageRetrievalAgent` answers complex loan questions grounded in a Moss knowledge base. When the customer is ready to pay, a single `@function_tool` hands the call to `PaymentFlowAgent`, which walks through a structured payment flow — with no repeated questions, because both agents share the same session state.

> **Full example** — see the [Mortgage Lending cookbook](https://github.com/usemoss/moss/tree/main/examples/voice-agents/mortgage-lending) for the complete agent, 41-document knowledge base, and index builder.

## Architecture

```
Caller
  └─▶ MortgageRetrievalAgent
          └─▶ search_mortgage_kb()  ──▶  Moss index (~1–10ms)
          └─▶ transfer_to_payment_flow()  ──▶  PaymentFlowAgent
                                                    └─▶ reads MortgageSessionData
                                                    └─▶ submit_payment()
```

Handoff is one line. LiveKit preserves the full chat history across the switch so the conversation feels continuous to the caller.

## What this demonstrates

| Pattern | Where to look |
| - | - |
| Multi-agent handoff | `transfer_to_payment_flow`, `return_to_advisor` |
| Shared session state across agents | `MortgageSessionData` dataclass |
| In-process semantic search | `search_mortgage_kb` |
| Reusing a warm `MossClient` across handoffs | `data.moss_client` passed through userdata |

## Required tools

* [Moss](https://moss.dev/) account with project credentials
* [OpenAI](https://platform.openai.com/) API key (LLM)
* [Deepgram](https://deepgram.com/) API key (STT)
* [Cartesia](https://cartesia.ai/) API key (TTS)
* Python 3.10+

## Integration guide

**1. Installation**

```bash theme={null}
pip install "livekit-agents>=1.0.0" \
  livekit-plugins-openai livekit-plugins-deepgram \
  livekit-plugins-silero livekit-plugins-cartesia \
  moss python-dotenv
```

**2. Environment setup**

```bash .env theme={null}
MOSS_PROJECT_ID=your-moss-project-id
MOSS_PROJECT_KEY=your-moss-project-key
MOSS_INDEX_NAME=mortgage-lending-kb
# Index cache. In production, point it at persistent storage.
MOSS_CACHE_PATH=./moss-cache

OPENAI_API_KEY=your-openai-api-key
DEEPGRAM_API_KEY=your-deepgram-api-key
CARTESIA_API_KEY=your-cartesia-api-key
```

**3. Define shared session state**

Both agents read from and write to a single dataclass stored on `session.userdata`. The `moss_client` field carries the already-loaded client so handoffs reuse the warm in-process index. A new client constructed after the handoff has no indexes loaded, and its queries raise `MossError` with code `NOT_FOUND`.

```python theme={null}
from dataclasses import dataclass, field
from typing import Optional
from moss import MossClient

@dataclass
class MortgageSessionData:
    loan_number: Optional[str] = None
    customer_name: Optional[str] = None
    last_four_ssn: Optional[str] = None
    payment_amount: Optional[float] = None
    payment_method: Optional[str] = None
    questions_answered: list[str] = field(default_factory=list)
    moss_client: Optional[MossClient] = None
```

**4. Build the retrieval agent**

`MortgageRetrievalAgent` answers loan questions and calls `transfer_to_payment_flow` when the customer is ready to pay.

```python theme={null}
from livekit.agents import Agent, RunContext, function_tool
from moss import MossClient, QueryOptions

class MortgageRetrievalAgent(Agent):
    def __init__(self, moss_client: MossClient):
        self._moss = moss_client
        super().__init__(instructions="""
            You are a mortgage lending voice assistant.
            ALWAYS call search_mortgage_kb before answering any factual question.
            Keep answers short — this is voice, no bullet points or markdown.
            When the customer says they want to make a payment, call transfer_to_payment_flow.
        """)

    async def on_enter(self) -> None:
        await self.session.say(
            "Hi, this is Moss from mortgage services. I can help with questions "
            "about your loan, payment options, or rates. What can I help you with?"
        )

    @function_tool
    async def search_mortgage_kb(self, context: RunContext, question: str) -> str:
        """Search the mortgage knowledge base. Use for any factual question
        about loan products, eligibility, closing costs, or payment options."""
        results = await self._moss.query(
            "mortgage-lending-kb", question, QueryOptions(top_k=4, alpha=0.75)
        )
        if not results.docs:
            return "No relevant information found."
        data: MortgageSessionData = self.session.userdata
        data.questions_answered.append(question)
        return "\n".join(f"- {d.text}" for d in results.docs)

    @function_tool
    async def capture_loan_number(self, context: RunContext, loan_number: str) -> str:
        """Save the customer's loan number to session state."""
        data: MortgageSessionData = self.session.userdata
        data.loan_number = loan_number.strip()
        return f"Saved loan number {data.loan_number}."

    @function_tool
    async def transfer_to_payment_flow(self, context: RunContext) -> tuple:
        """Hand off to the payment flow agent when the customer wants to pay."""
        data: MortgageSessionData = self.session.userdata
        greeting = (
            "Got it. I have your loan number on file — connecting you to payments now."
            if data.loan_number
            else "Got it, let me hand you over to our payment flow."
        )
        return PaymentFlowAgent(), greeting
```

**5. Build the payment flow agent**

`PaymentFlowAgent` reads the session state the retrieval agent already populated, so the customer never has to repeat their loan number.

```python theme={null}
class PaymentFlowAgent(Agent):
    def __init__(self):
        super().__init__(instructions="""
            You are the payment flow agent. Steps in order:
            1. Read session state with read_session_state — skip any field already captured.
            2. Ask for last 4 SSN to verify identity. Call verify_identity.
            3. Ask for the payment amount. Call set_payment_amount.
            4. Ask for the payment method (bank transfer, debit card, autopay).
               Call set_payment_method.
            5. Read back all four facts and ask for confirmation.
            6. On confirmation, call submit_payment.
            Never ask for full SSN or full card numbers. Last 4 only.
            If the customer asks a mortgage question, call return_to_advisor.
        """)

    async def on_enter(self) -> None:
        data: MortgageSessionData = self.session.userdata
        if data.loan_number:
            await self.session.say(
                f"Hi, I'll get your payment set up. I have loan number "
                f"{data.loan_number} on file — is that the one you want to pay?"
            )
        else:
            await self.session.say("Hi, I'll get your payment set up. What's your loan number?")

    @function_tool
    async def read_session_state(self, context: RunContext) -> str:
        """Return what's already known about the customer this call."""
        data: MortgageSessionData = self.session.userdata
        known = {k: v for k, v in {
            "loan_number": data.loan_number,
            "last_four_ssn": data.last_four_ssn,
            "payment_amount": data.payment_amount,
            "payment_method": data.payment_method,
        }.items() if v}
        return ", ".join(f"{k}={v}" for k, v in known.items()) or "nothing on file yet"

    @function_tool
    async def verify_identity(self, context: RunContext, last_four_ssn: str) -> str:
        """Save the last four digits of SSN for verification."""
        digits = "".join(c for c in last_four_ssn if c.isdigit())
        if len(digits) != 4:
            return "Please ask the customer to repeat the last four digits clearly."
        self.session.userdata.last_four_ssn = digits
        return "Identity captured."

    @function_tool
    async def set_payment_amount(self, context: RunContext, amount: float) -> str:
        """Record the payment amount in dollars."""
        self.session.userdata.payment_amount = amount
        return f"Recorded ${amount:,.2f}."

    @function_tool
    async def set_payment_method(self, context: RunContext, method: str) -> str:
        """Record the payment method."""
        self.session.userdata.payment_method = method.strip().lower()
        return f"Recorded {method}."

    @function_tool
    async def submit_payment(self, context: RunContext) -> str:
        """Submit the payment after customer confirmation."""
        data: MortgageSessionData = self.session.userdata
        confirmation = f"MOSS-{abs(hash(data.loan_number)) % 10_000_000:07d}"
        return (
            f"Payment of ${data.payment_amount:,.2f} submitted via "
            f"{data.payment_method}. Confirmation number {confirmation}."
        )

    @function_tool
    async def return_to_advisor(self, context: RunContext) -> tuple:
        """Hand back to the retrieval agent for mortgage questions."""
        data: MortgageSessionData = self.session.userdata
        return MortgageRetrievalAgent(data.moss_client), "Sure, let me get you back to the advisor."
```

**6. Wire up the entrypoint**

Each worker process creates one `MossClient` with a `cache_path` in `prewarm`. The call starts loading the index before `ctx.connect()` and stores the client on `userdata` so both agents can reuse it across the handoff. See [Process model and index loading](https://docs.moss.dev/docs/integrations/livekit.md#process-model-and-index-loading).

```python theme={null}
import asyncio
import os
from livekit.agents import AgentSession, JobContext, JobProcess, WorkerOptions, cli
from livekit.plugins import cartesia, deepgram, openai, silero
from moss import MossClient

def prewarm(proc: JobProcess) -> None:
    # Runs once in each new worker process, before a call is assigned to it.
    proc.userdata["vad"] = silero.VAD.load()
    proc.userdata["moss"] = MossClient(
        os.environ["MOSS_PROJECT_ID"],
        os.environ["MOSS_PROJECT_KEY"],
        cache_path=os.getenv("MOSS_CACHE_PATH", "./moss-cache"),
    )

async def entrypoint(ctx: JobContext):
    moss_client: MossClient = ctx.proc.userdata["moss"]

    # Load the index while the call connects.
    loading = asyncio.create_task(moss_client.load_index("mortgage-lending-kb"))
    await ctx.connect()

    session = AgentSession[MortgageSessionData](
        userdata=MortgageSessionData(moss_client=moss_client),
        stt=deepgram.STT(model="nova-2"),
        llm=openai.LLM(model="gpt-4o"),
        tts=cartesia.TTS(),
        vad=ctx.proc.userdata["vad"],
    )
    await loading
    await session.start(agent=MortgageRetrievalAgent(moss_client), room=ctx.room)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
```

Run in console mode to test without a LiveKit server:

```bash theme={null}
python agent.py console
```

## How the handoff works

LiveKit Agents 1.0+ supports first-class handoff: a `@function_tool` can return `(NextAgent, "transition message")` instead of a string. LiveKit runs the transition utterance through TTS, tears down the current agent's tools and instructions, and starts the new agent with the same chat history and `session.userdata`. Both agents share `MortgageSessionData` — no re-asking, no lost context.
