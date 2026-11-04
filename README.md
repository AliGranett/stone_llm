# Asterion Crystal Laboratory

A study app about learning by investigation. A person tries to work out the hidden rules of a set of fictional crystals by running experiments. While they do that, a chat assistant called the Research Partner talks with them about the evidence.

## What it does

Each crystal has three properties you can see:

- **Affinity** — Water, Fire, Wind, or Earth
- **Strength** — 1, 2, or 3
- **Charge** — positive or negative

You pick two crystals, predict what will happen, and say which property you think matters most, or that you are not sure. The app then shows the result. One crystal can win, the pair can end in a stalemate, or the two crystals can cancel each other out. You note whether that result fits your idea.

Everyone sees the same 12 crystals, in the same order. The result of every pair is fixed. A rule engine in the browser computes it. The Research Partner is not told those hidden rules. It only sees what the person sees: the crystals on screen, the predictions, the results, the notes, and the chat.

The partner can follow one of two styles. You choose the style on the welcome screen before the study starts.

- **Analytical.** The partner helps analyze the evidence and offers its own reading of the patterns.
- **Hypothesis-driven.** The partner asks you to state a testable idea and to check it against the results.

The written instructions for those two styles are `prompts/analytical_prompt.txt` and `prompts/hypothesis_driven_prompt.txt`.

## Why it matters

The app runs the whole study from start to finish. It takes someone from a short background form, through instructions and a limited number of experiments, to a final account of the rules. The session stays in the browser, and Testing Mode can export what happened, so the two partner styles can be compared on the same task. The public demo lets anyone click through that interface with sample partner replies, and it does not need an API key.

## Key features

- **Welcome screen.** Participant Mode starts the study and asks for background information: age, education, field or occupation, and how the person uses AI tools. Testing Mode skips that form so you can preview the study. Both modes ask you to pick a Research Partner style first.
- **Instructions.** Before any experiment, the app explains the crystal properties and the affinity relationships that are given up front. Fire beats Earth, Earth beats Wind, Wind beats Water, and Water beats Fire. Fire with Wind, and Water with Earth, are neutral. The task is to discover when those relationships decide the result, and when strength or charge does instead.
- **Three investigation rounds.** Each round shows a smaller group of crystals. A round allows up to 4 experiments and up to 4 Research Partner messages. At least 2 of those messages are required before the round can be finished.
- **One experiment.** Choose two crystals, predict the outcome, note your current idea, run the experiment, read the result, and say whether it supported your idea.
- **Research Partner chat.** During the three rounds the chat sits beside the experiment area. In the final stage the partner stops replying. The earlier conversation stays on screen.
- **Final investigation.** All 12 crystals are available, with 4 more experiments. From round 2 on, you build a decision tree that describes how you think any two crystals are decided. You rate your confidence from 1 to 7 and submit that model.
- **Three languages.** English, Hebrew, and Arabic. Hebrew and Arabic use a right-to-left layout.
- **Saved progress.** The browser stores the session under the key `asterion-study:asterion-v1:v4`. Refreshing the page restores it.
- **Exports.** After you submit, Testing Mode can download a final report, the experiments, the participant record, and the partner chats as CSV files, plus the whole session as JSON. A local `npm run dev` session also shows a DEV panel for resetting the session, skipping ahead, reading the event log, and the same exports. The DEV panel is shown only while that development server is running.

If the welcome screen does not send a style, the app can still take one from a `?condition=ANALYTICAL` or `?condition=HYPOTHESIS_DRIVEN` link, or from `fixedCondition` in `src/config/studyConfig.ts`.

## Tech stack

- TypeScript
- React 19 and Vite 7 for the interface
- Express 5 for a small API server
- The OpenAI SDK, used only when sample replies are turned off. `.env.example` names the model `gpt-4o`
- Vitest for tests
- Node.js 22 (the version in `.nvmrc`)
- Plain CSS. There is no component library and no separate state library. Study state is a React context and a reducer.

## How the app is built

The screens and the crystal rules run in the browser. The OpenAI key stays on the server.

```
Browser (React, port 5173 in development)
  screens, crystal rules, saved session
        |
        |  POST /api/research-partner
        v
Express server (port 3001)
  loads the analytical or hypothesis-driven prompt
  calls OpenAI, or returns a sample reply
```

During development, Vite forwards `/api` to the Express server, so the page talks only to its own address.

The public demo is a separate static build (`npm run build:demo`). It uses those same sample replies inside the browser. The demo bundle contains no API key. A banner at the top says the replies are samples.

| Piece | Where it lives |
| --- | --- |
| Screens | `src/components/` |
| Study flow | `src/state/studyReducer.ts` |
| Saved session | `src/services/studyPersistence.ts` |
| Crystal rules | `src/engine/asterionRuleEngine.ts` |
| Round limits and which crystals appear | `src/config/roundConfig.ts`, `src/config/stoneSet.ts` |
| Partner prompt text | `prompts/` |
| API server | `server/` |
| English, Hebrew, and Arabic text | `src/i18n/` |

## Install and run it locally

You need Node.js 22. If you use nvm:

```bash
nvm use
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API listens on [http://localhost:3001](http://localhost:3001).

`.env.example` sets `USE_MOCK_LLM=true`, so the Research Partner answers with sample text and you do not need an OpenAI key. To call a real model, set `USE_MOCK_LLM=false` in `.env` and replace `OPENAI_API_KEY`. `.env` is git-ignored.

If `USE_MOCK_LLM` is left unset and no key is configured, the server also uses sample replies.

Other commands:

```bash
npm run dev:web       # frontend only
npm run dev:server    # API only
npm run build         # typecheck and production build
npm run build:demo    # static demo with sample replies
npm run preview       # serve the production build
```

## Run the tests

```bash
npm test
```

That runs Vitest once, over `src/**/*.test.ts` and `server/**/*.test.ts`: the crystal rules, the study flow, saved sessions, and the API. Use `npm run test:watch` to re-run tests as you edit.

## Try the live demo

[https://aligranett.github.io/stone_llm/](https://aligranett.github.io/stone_llm/)

That site is the static demo from `npm run build:demo`. The Research Partner uses sample replies, and a banner says so. A push to `main` publishes it with GitHub Actions (`.github/workflows/pages.yml`).
