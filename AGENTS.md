# AGENTS

## Project

Static PWA for estimated train arrivals in the Yekaterinburg Metro. Keep the app fully client-side with React, TypeScript, Vite, Tailwind, Zustand, Zod, Vitest, and `vite-plugin-pwa`.

## Package Manager

Use `npm` only. Keep `package-lock.json` authoritative and do not introduce pnpm workflows.

## Verification

Run these checks before finishing substantial changes:

- `npm run validate:data`
- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- `npm run test:run`
- `npm run build`

## Data And Time Rules

- Production base path is `/ebk-metro/`.
- All metro time calculations must use `Asia/Yekaterinburg`.
- Schedule data lives in `src/data/*`; do not invent train times or replace real data with mocks.
- Any schedule change must preserve validation integrity and be checked with tests.

## Architecture Constraints

- No backend, Express server, database, auth, AI features, or runtime API dependency.
- Route and destination selection must remain session-only; only explicit user settings may go to LocalStorage.

## Git Rules

- Work only in the current worktree and branch unless explicitly told otherwise.
- Do not push to `main`.
- Do not force-push.
- Do not merge into `main`.
