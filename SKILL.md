---
name: qnalyze
description: Working guide for the Qnalyze project - WXT web extension for analyzing exam questions on web pages + questions-test dashboard (backend/frontend) for generating sample questions.
---

# Qnalyze

This skill describes the Qnalyze project context so an agent can help with development, debugging, and feature additions consistently.

## Project Overview

Qnalyze consists of 2 main parts:

1. **`extension/` — WXT Web Extension for exam-question analysis.**
   Main flow: the user opens a web page containing a question (e.g. a prompt plus multiple-choice answers), highlights/selects the question and answer text, the extension saves the question, then an AI behind the extension returns an answer/analysis response.
2. **`questions-test/` — Dashboard for generating sample questions.**
   Consists of a backend (`api/`) and a frontend (`ui/`). Used to create, store, and manage a bank of sample questions for testing.

## Repo Structure

```text
/
├── SKILL.md
├── README.md
├── .env.dev / .example.env      # example DB env (Postgres)
├── docker-compose.db.yml        # dev Postgres service (postgres:16)
├── extension/                   # WXT web extension (currently only .gitkeep, not implemented yet)
└── questions-test/
    ├── api/                     # Express + TypeScript backend
    │   ├── src/config/express.ts  # express setup, /health route, registerDocs
    │   ├── src/config/vars.ts     # PORT config (default 3000)
    │   ├── src/config/docs.ts     # serves /openapi + /docs via redoc-express
    │   ├── src/main.ts            # listen entrypoint
    │   └── openapi/openapi.yaml   # API contract: Health, Auth, Users, Questions
    └── ui/                      # frontend dashboard (currently only .gitkeep, not implemented yet)
```

## Extension (WXT) — Exam Question Analysis

Goal: help the user answer questions on any web page.

Expected flow:

1. The user selects (highlights) the question text plus multiple-choice options on the web page.
2. The extension (content script) captures the selected text plus page context (URL, title).
3. The extension saves the question to local storage or sends it to a backend/AI.
4. The AI behind the extension returns a response: suggested answer plus explanation/analysis.
5. The response is shown in the extension popup/sidepanel/overlay.

When working on `extension/`:

- Use the WXT framework (structure `entrypoints/`: `background/`, `content/`, `popup/` / `sidepanel/`).
- Separate concerns: `content script` for selection/DOM extraction, `background` for orchestration plus AI calls, `popup/sidepanel` for answer UI.
- Do not scrape the DOM indiscriminately; prioritize user-highlighted text, fall back to parsing the question container only if needed.
- Always include source context (page URL, raw question text, options A/B/C/D) in the AI payload so answers are verifiable.

## questions-test — Question Generation Dashboard

### Backend: `questions-test/api/`

Stack: Node 24, pnpm 12, Express 5 (ESM, `type: module`), TypeScript, `tsc-alias` with `@/*` alias, `nodemon` + `tsx` for dev, Prettier + Biome for format/lint, `redoc-express` for docs.

API contract is defined in `openapi/openapi.yaml`:

Docs: `GET /openapi/openapi.yaml` (static file), `GET /docs` (Redoc UI).

Dev database: Postgres 16 via `docker-compose.db.yml` (`question_test_db`, volume `pg_dev`). Credentials from `.env.dev` / `.example.env`: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

Key commands (from `questions-test/api/`):

```bash
pnpm dev        # nodemon (see nodemon.json)
pnpm build      # tsc && tsc-alias
pnpm start      # node ./dist/main.js
pnpm typecheck  # tsc --noEmit
pnpm lint       # biome check .
```

### Frontend: `questions-test/ui/`

Not implemented yet. If asked to build it: dashboard to generate, list (with `page/limit` pagination plus search), view, create/edit/delete sample questions, consuming the API above with Bearer JWT, and linking backend docs at `/docs`.

## When to Use

Use this skill when the user asks to:

- Develop/fix the question-analysis extension (content script, text selection, question storage, AI integration, popup/sidepanel).
- Develop `questions-test/api` (auth/questions endpoints, `express-validator` validation, OpenAPI, Postgres connection).
- Create/develop the `questions-test/ui` question-generation dashboard.
- Run the local DB, dev backend, or sync the OpenAPI contract with the implementation.

## Instructions

1. Identify the working area first: `extension/`, `questions-test/api/`, or `questions-test/ui/`. Do not mix changes across areas unless asked.
2. Do not read the entire project unnecessarily. Before starting a task, identify and read the relevant skills, and use them when applicable. For example, always use the `drizzle-orm-patterns` skill when working with the database
3. For `questions-test/api/`: read `openapi/openapi.yaml` plus files under `openapi/paths/` and `openapi/components/` as the contract source of truth before changing code. If the contract changes, update the OpenAPI files as well.
4. For `extension/`: since the folder is still empty, agree on or set up the standard WXT structure before coding (manifest permissions, `entrypoints/background.ts`, `entrypoints/content.ts`, `entrypoints/popup/`). Do not guess the AI API — ask the user which endpoint/model to use if none exists yet.
5. For the local DB: use `docker compose -f docker-compose.db.yml --env-file .env.dev up -d` (`docker-db` alias in README). Do not hardcode credentials; use env vars.
6. After changing API code: run `pnpm typecheck` and `pnpm lint` in `questions-test/api/`. For extension/UI, follow whatever tooling gets added later.
7. Verify by execution when possible: `curl GET /health`, check `/docs`, or test text-selection → save question → AI response for the extension.

## Git Branching Rules

The project uses four main branches:

- `main`: The stable branch containing production-ready code. Never commit directly to this branch unless explicitly instructed.
- `feat`: For implementing new features and functional changes.
- `docs`: For general documentation changes, including README files, guides, and project documentation.
- `api-spec`: Exclusively for API specification and Redoc documentation, including OpenAPI schemas, endpoint definitions, request/response examples, and API documentation configuration.

### Branch Selection Rules

1. Always check the current Git branch and working tree status before starting a task.
2. Select the appropriate branch based on the task requirements.
3. Use `feat` for application features and functional code changes.
4. Use `docs` for general project documentation.
5. Use `api-spec` for OpenAPI specification changes and Redoc documentation updates.
6. Do not mix unrelated changes across branches.
7. Never commit directly to `main` unless explicitly instructed.
8. Do not switch branches if doing so could overwrite or interfere with uncommitted changes.
9. Do not merge branches, push changes, or create pull requests unless explicitly instructed.
10. Follow Conventional Commits for all commit messages.

### API Specification Rules

- Keep OpenAPI specifications consistent with the actual API implementation.
- Use the `api-spec` branch when modifying OpenAPI schemas, endpoint definitions, parameters, authentication specifications, and request/response examples.
- Update Redoc documentation configuration when necessary.
- Do not modify application business logic on the `api-spec` branch.
- If API implementation changes are required, make those changes on `feat` and update the API specification on `api-spec` separately.
- Verify that the specification is valid and that the Redoc documentation renders correctly before committing.
