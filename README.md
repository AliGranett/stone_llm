# Asterion Crystals — Inquiry Learning Study Interface

An experimental web interface for a research study on inquiry learning with an
LLM-based "Research Partner". Participants investigate a deterministic hidden
system governing interactions between fictional stones (Asterion Crystals) by
selecting stone pairs, predicting outcomes, stating hypotheses, running
experiments, and reflecting on results before submitting a final explanation
of the hidden rules.

## Tech stack

- React 19 + TypeScript, built with Vite
- Plain CSS with design tokens (no CSS framework)
- React context + reducer for state (no external state library)
- localStorage persistence via a dedicated service
- A minimal Express backend (`server/`) that owns the OpenAI credentials
- Vitest for tests

## Running the project

Requires Node 22 (an `.nvmrc` is included — `nvm use`).

```bash
npm install
cp .env.example .env      # mock replies by default; add a real key only for a live study
npm run dev               # starts the backend (:3001) and the frontend (:5173)
npm test                  # rule engine, state, persistence, server, and prompt tests
npm run build             # typecheck + production build (dev controls disabled)
npm run build:demo        # static demo: sample Research Partner replies, no API key
npm run preview           # serve the production build
```

`npm run dev` runs both processes. To run them separately use `npm run dev:server`
and `npm run dev:web`. Vite proxies `/api` to the backend, so the browser only
ever talks to its own origin.

`.env.example` sets `USE_MOCK_LLM=true`, so a fresh checkout answers with sample
Research Partner text and does not need an OpenAI key. Set `USE_MOCK_LLM=false`
and put a real key in `.env` only when you are running the actual study. If
`USE_MOCK_LLM` is left unset and no key is configured, the server also uses
sample replies.

## Try it on GitHub Pages

The hosted demo is a static build (`npm run build:demo`). The Research Partner
answers in the browser with the same sample replies as mock mode. No server
runs, and no API key is included. Pushing to `main` deploys it with
`.github/workflows/pages.yml`.

In the repository on GitHub, open **Settings → Pages** and set **Source** to
**GitHub Actions** if the site is not already publishing. The interface is the
full study UI: stones, experiments, and the Research Partner chat. A banner at
the top says the replies are samples.

## Where things are configured

| What | Where |
| --- | --- |
| Experiment limit, phase label, feature toggles, LLM endpoint | `src/config/studyConfig.ts` |
| Stone set (fixed fixture, same for every participant) | `src/config/stoneSet.ts` |
| Affinity colors/labels, outcome/charge labels | `src/config/affinities.ts` (CSS tokens mirrored in `src/styles/theme.css`) |
| Hidden rule engine | `src/engine/asterionRuleEngine.ts` |
| Session state + all study flow rules | `src/state/studyReducer.ts` |

## The Research Partner (GPT-4o)

The browser never talks to OpenAI. It posts participant-observable state to the
local backend, which loads the prompt, calls the model, and returns only the
reply text.

```
Browser  ──POST /api/research-partner──▶  server/  ──▶  OpenAI (gpt-4o)
                                          loads prompts/<condition>.txt
                                          appends study context
                                          holds OPENAI_API_KEY
```

### Editing the experimental prompts

The two system prompts are plain text files, and they are the only place the
experimental manipulation lives:

| Condition | File |
| --- | --- |
| `ANALYTICAL` | `prompts/analytical_prompt.txt` |
| `HYPOTHESIS_DRIVEN` | `prompts/hypothesis_driven_prompt.txt` |

They are read from disk on every request, so editing a file changes the
partner's behaviour on the next message — no restart, no code change. Bump
`ANALYTICAL_PROMPT_VERSION` / `HYPOTHESIS_DRIVEN_PROMPT_VERSION` in `.env` when
you edit them, so collected data records which text produced it.

The frontend sends only the condition name. The filename mapping lives in
`server/promptLoader.ts` and is keyed off that fixed enum, so a client cannot
request an arbitrary path.

### What the model is and is not given

`server/contextBuilder.ts` is the only place study data becomes model input. It
reads a fixed whitelist of participant-observable fields: study phase,
experiments remaining, the stone set, the current selection and hypothesis, and
for each completed experiment the stones, prediction, observed outcome,
hypothesis, justification, evidence assessment, observation, and revision.

It never reads the hidden rule engine's `appliedRule` or `internalExplanation`,
and there is no answer key in the payload — the partner reasons from the same
evidence the participant has. Both conditions receive byte-identical context;
only `instructions` differs. Both properties are covered by tests in
`server/contextBuilder.test.ts` and `server/services/openaiService.test.ts`.

### Mock mode

`USE_MOCK_LLM=true` in `.env` swaps in `server/services/mockService.ts`, which
returns clearly marked `[Development mock response]` messages and needs no API
key. This is a server-side setting: the participant-facing UI is identical
either way and never offers a choice.

The GitHub Pages build sets `VITE_DEMO_MODE=true` instead. That build never
calls `/api/research-partner`; `sendResearchPartnerMessage` uses the same
sample replies directly in the browser. A live study build does not set that
flag, so participants still go through the server.

The condition is assigned manually when you start a session. On the entry
screen, both Participant Mode and Testing Mode let you choose the Research Partner
style (`ANALYTICAL` or `HYPOTHESIS_DRIVEN`) before continuing. URL parameters
(`?condition=…`) and `fixedCondition` in `studyConfig.ts` remain available as
fallbacks when no style is selected in the UI. The assignment persists across
refreshes and is never rendered in the participant UI.

## Data, persistence, and logging

- The full session (phase, experiments, chat, drafts, event log) is saved to
  a versioned localStorage key (`asterion-study:<studyVersion>:v1`) through
  `src/services/studyPersistence.ts`, debounced on every state change.
  Refreshing the page restores the session.
- Every meaningful action produces a structured event
  (`src/services/studyLogger.ts` + reducer). Text fields log on blur, not per
  keystroke. Hidden rule explanations are never written to the event log.
- `buildStudyExport` / `downloadStudyExport` produce a structured JSON export
  (session metadata, experiment records, chat, LLM interactions, events, final
  submission) — available from the DEV panel.
- Every completed Research Partner exchange is stored as an
  `LlmInteractionRecord` and exported as `llm_interactions.csv`
  (`buildLlmInteractionsCsv`, also in the DEV panel) with columns:
  `participant_id, session_id, experiment_id, interaction_id, llm_mode,
  study_phase, user_message, llm_response, user_message_timestamp,
  llm_response_timestamp, response_latency_ms, prompt_version, model`.
  `llm_response` holds the actual model output. System prompt text, API keys,
  and environment values are never written to any export.

## Development controls

When `import.meta.env.DEV` is true (i.e. `npm run dev`), a floating **DEV**
button exposes: reset session, an **LLM condition** dropdown (this is the
Testing Mode condition selection — it decides which prompt file the backend
loads for the session), change experiment limit, skip to final submission, view
the applied rule for the pending experiment, view the event log, and export the
study JSON and `llm_interactions.csv`. None of this is present in production
builds, so participants can neither see nor choose the condition.

## Assumptions and placeholders

- Study data still lives in localStorage; the backend is a stateless proxy to
  OpenAI and stores nothing, so export remains manual via the DEV panel.
- There is no formal Participant Mode / Testing Mode switch in the app. The DEV
  panel is the testing surface, and a production build is participant mode.
- There is no participant background questionnaire.
- Participant IDs are generated locally per session; a real deployment would
  supply them via the recruiting platform / URL parameter.
- Earth stones use the `V-` id prefix to avoid colliding with Wind's `G-`.
