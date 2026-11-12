<!-- Source: https://docs.moss.dev/docs/cookbook/candidate-screening-agent.md -->
# Candidate Screening Agent

> A voice screening interviewer that grounds every question in two Moss indexes — one for the job description, one for the candidate's resume — and emits a structured scorecard.

A LiveKit voice agent that conducts a structured 25-minute screening interview grounded in two Moss indexes: the job description and the candidate's resume. The agent asks calibrated questions based on what the JD requires and what the resume actually says, captures rubric scores (1–5) during the conversation, and writes a structured scorecard JSON at the end.

> **Full example** — see the [Candidate Screening cookbook](https://github.com/usemoss/moss/tree/main/examples/voice-agents/candidate-screening) for the complete agent, three sample candidates (strong match, partial match, junior/reach), and an eval suite.

## Architecture

```
Agent starts
  └─▶ lookup_job_requirement("role title, company, team")
          └─▶ Moss JD index (~1–10ms)  ──▶  greeting grounded in real role data

During interview
  ├─▶ lookup_job_requirement(query)  ──▶  Moss JD index (must-haves, comp, process)
  └─▶ lookup_resume_fact(query)       ──▶  Moss Resume index (projects, skills, history)

At close
  └─▶ submit_scorecard()  ──▶  scorecard JSON written to disk
```

Two separate tools — `lookup_job_requirement` and `lookup_resume_fact` — keep the retrieval sources explicit in the logs and give the LLM clear semantics for which index answers which type of question.

## What this demonstrates

| Pattern | Where to look |
| - | - |
| Multi-index retrieval | `lookup_job_requirement`, `lookup_resume_fact` |
| Live rubric capture | `record_rubric_entry` (1–5 score + evidence) |
| Bias mitigation in the system prompt | `SYSTEM_PROMPT` — protected attributes listed |
| Structured scorecard output | `submit_scorecard`, `_build_scorecard` |
| Consent gating | `record_consent` required before scorecard |

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
# Index cache. In production, point it at persistent storage.
MOSS_CACHE_PATH=./moss-cache

# Default index names, for a call whose job metadata names none
MOSS_JOB_INDEX_NAME=job-senior-backend-payments
MOSS_CANDIDATE_INDEX_NAME=candidate-strong-match

OPENAI_API_KEY=your-openai-api-key
DEEPGRAM_API_KEY=your-deepgram-api-key
CARTESIA_API_KEY=your-cartesia-api-key
```

**3. Define session state**

Rubric entries and candidate questions are captured during the call as the conversation happens — not reconstructed from a transcript after the fact.

```python theme={null}
from dataclasses import dataclass, field
from typing import Optional
from moss import MossClient

@dataclass
class RubricEntry:
    score: int       # 1–5: 1=no signal, 3=competent, 5=strong
    evidence: str    # candidate's words, briefly paraphrased
    skill: str       # JD skill tag e.g. "postgres", "payments_domain"

@dataclass
class CandidateQuestion:
    question: str
    answer_summary: str

@dataclass
class ScreeningSessionData:
    candidate_id: str
    role_id: str
    consent_to_record: Optional[bool] = None
    rubric: dict[str, RubricEntry] = field(default_factory=dict)
    candidate_questions: list[CandidateQuestion] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    moss_client: Optional[MossClient] = None
```

**4. Build the screening agent**

The agent has two retrieval tools with distinct semantics. `on_enter` pre-fetches role context from the JD index so the opening greeting is grounded in real data.

```python theme={null}
import os
from livekit.agents import Agent, AgentSession, RunContext, function_tool
from moss import MossClient, QueryOptions

JOB_INDEX = os.getenv("MOSS_JOB_INDEX_NAME", "job-senior-backend-payments")
CANDIDATE_INDEX = os.getenv("MOSS_CANDIDATE_INDEX_NAME", "candidate-strong-match")

class ScreeningAgent(Agent):
    def __init__(self, moss_client: MossClient, job_index: str, candidate_index: str):
        self._moss = moss_client
        self._job_index = job_index
        self._candidate_index = candidate_index
        super().__init__(instructions="""
            You are a voice screening interviewer. You have two retrieval tools:
              - lookup_job_requirement — searches the JOB DESCRIPTION
              - lookup_resume_fact     — searches the CANDIDATE RESUME

            Ground every factual statement in tool output. Never invent requirements,
            compensation, team details, or claims about the candidate.

            Run a 5-phase interview: intro/consent → background → role-fit →
            candidate Q&A → close. Capture rubric scores with record_rubric_entry.

            Bias rules (these override everything else): do NOT ask about or infer
            age, marital status, family plans, religion, national origin, or disability.
            If the candidate volunteers any of these, acknowledge briefly and move on.

            Voice style: one question at a time, allow silence, keep replies short.
        """)

    async def on_enter(self) -> None:
        # Pre-fetch role context before the first word
        role_context = await self._query(self._job_index, "role title, company name, team", "JD")
        await self.session.generate_reply(
            instructions=(
                "Greet the candidate warmly. Name the role, company, and team "
                "using ONLY the context below — do not invent any detail. "
                "Explain this is a ~25-minute recorded screening and ask for consent.\n\n"
                f"Role context:\n{role_context}"
            ),
        )

    @function_tool
    async def lookup_job_requirement(self, context: RunContext, query: str) -> str:
        """Search the job description for requirements, team info, comp, and process.
        Use before making any statement about the role or answering a candidate question."""
        return await self._query(self._job_index, query, "JD")

    @function_tool
    async def lookup_resume_fact(self, context: RunContext, query: str) -> str:
        """Search the candidate's resume for projects, skills, and experience.
        Use before asking a follow-up so the question is specific, not generic."""
        return await self._query(self._candidate_index, query, "Resume")

    async def _query(self, index: str, query: str, source: str) -> str:
        results = await self._moss.query(index, query, QueryOptions(top_k=4, alpha=0.75))
        if not results.docs:
            return f"No relevant {source.lower()} content found."
        return "\n".join(f"- {d.text}" for d in results.docs)

    @function_tool
    async def record_consent(self, context: RunContext, consented: bool) -> str:
        """Record consent to be recorded. Call immediately after asking. End if declined."""
        self.session.userdata.consent_to_record = consented
        return "Consent captured." if consented else "Consent declined; end the screening."

    @function_tool
    async def record_rubric_entry(
        self, context: RunContext, skill: str, score: int, evidence: str
    ) -> str:
        """Record one rubric row. score: 1=no signal, 3=competent, 5=strong.
        evidence: brief paraphrase of what the candidate said."""
        if not 1 <= score <= 5:
            return "Score must be 1–5."
        self.session.userdata.rubric[skill] = RubricEntry(
            score=score, evidence=evidence.strip(), skill=skill
        )
        return f"Recorded {skill}={score}."

    @function_tool
    async def record_candidate_question(
        self, context: RunContext, question: str, answer_summary: str
    ) -> str:
        """Log a question the candidate asked during Q&A."""
        self.session.userdata.candidate_questions.append(
            CandidateQuestion(question=question.strip(), answer_summary=answer_summary.strip())
        )
        return "Question logged."

    @function_tool
    async def submit_scorecard(self, context: RunContext) -> str:
        """Write the final scorecard JSON. Call once at the end of the screening."""
        data: ScreeningSessionData = self.session.userdata
        if data.consent_to_record is not True:
            return "Cannot submit a scorecard without recorded consent."
        scorecard = _build_scorecard(data)
        # Write to disk (replace with your own storage in production)
        import json
        from pathlib import Path
        path = Path("./scorecards") / f"{data.candidate_id}.json"
        path.parent.mkdir(exist_ok=True)
        path.write_text(json.dumps(scorecard, indent=2) + "\n", encoding="utf-8")
        return f"Scorecard written. Tell the candidate the team reviews within 3 business days."

    @function_tool
    async def end_screening(self, context: RunContext, reason: str) -> str:
        """End the screening immediately. Use only if consent was declined."""
        return "Thank the candidate politely and stop."
```

**5. Build the scorecard**

```python theme={null}
def _recommendation_from_rubric(rubric: dict) -> str:
    if not rubric:
        return "no_signal"
    scores = [e.score for e in rubric.values()]
    avg = sum(scores) / len(scores)
    low_count = sum(1 for s in scores if s <= 2)
    if avg >= 4.0 and low_count == 0:
        return "advance_to_technical"
    if avg >= 3.0 and low_count <= 1:
        return "borderline_review"
    return "do_not_advance"

def _build_scorecard(data: ScreeningSessionData) -> dict:
    return {
        "candidate_id": data.candidate_id,
        "role_id": data.role_id,
        "rubric": {
            skill: {"score": e.score, "evidence": e.evidence}
            for skill, e in data.rubric.items()
        },
        "candidate_questions": [
            {"question": q.question, "answer_summary": q.answer_summary}
            for q in data.candidate_questions
        ],
        "notes": data.notes,
        "recommendation": _recommendation_from_rubric(data.rubric),
        "schema_version": 1,
    }
```

**6. Wire up the entrypoint**

Each worker process creates one `MossClient` with a `cache_path` in `prewarm`. Each call reads its two index names from the job metadata and starts both loads before `ctx.connect()`, so every retrieval during the interview hits the in-process path. See [Process model and index loading](https://docs.moss.dev/docs/integrations/livekit.md#process-model-and-index-loading).

```python theme={null}
import asyncio
import json
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

    # The dispatch names this screening's indexes, for example
    # {"job_index": "job-senior-backend-payments", "candidate_index": "candidate-strong-match"}.
    metadata = json.loads(ctx.job.metadata or "{}")
    job_index = metadata.get("job_index", JOB_INDEX)
    candidate_index = metadata.get("candidate_index", CANDIDATE_INDEX)

    # Load both indexes concurrently while the call connects.
    loading = asyncio.gather(
        moss_client.load_index(job_index), moss_client.load_index(candidate_index)
    )
    await ctx.connect()

    session = AgentSession[ScreeningSessionData](
        userdata=ScreeningSessionData(
            candidate_id=metadata.get("candidate_id", os.getenv("SCREENING_CANDIDATE_ID", "candidate")),
            role_id=metadata.get("role_id", os.getenv("SCREENING_ROLE_ID", "role")),
            moss_client=moss_client,
        ),
        stt=deepgram.STT(model="nova-2"),
        llm=openai.LLM(model="gpt-4o"),
        tts=cartesia.TTS(),
        vad=ctx.proc.userdata["vad"],
    )
    await loading
    await session.start(
        agent=ScreeningAgent(moss_client, job_index, candidate_index), room=ctx.room
    )

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
```

```bash theme={null}
python agent.py console
```

## Scorecard output

```json theme={null}
{
  "candidate_id": "strong-match",
  "role_id": "senior-backend-payments",
  "rubric": {
    "python":           { "score": 5, "evidence": "7 years, led settlement rewrite" },
    "postgres":         { "score": 4, "evidence": "5 years, designed ledger schema" },
    "payments_domain":  { "score": 5, "evidence": "ISO 8583, card network reconciliation" },
    "distributed_systems": { "score": 4, "evidence": "Kafka pipelines, on-call rotation" }
  },
  "candidate_questions": [
    { "question": "What does the on-call rotation look like?", "answer_summary": "1-week rotation, P1 SLA 15 min" }
  ],
  "recommendation": "advance_to_technical",
  "schema_version": 1
}
```

The recommendation is computed from the rubric automatically — the hiring team makes the final call, not the agent.
