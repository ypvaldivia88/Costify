# AGENTS.md

## Cursor Cloud specific instructions

Costify is a single Next.js 15 (App Router) + React 19 frontend app — a Spanish-language cost/pricing calculator and inventory manager for small businesses. There is no backend, database, or external service: all state is persisted in the browser's `localStorage`. The `@google/genai` dependency is listed in `package.json` but is not imported anywhere in `app/`, `components/`, `lib/`, or `hooks/`, so no `GEMINI_API_KEY` (or any secret) is required to run, build, or test the app.

Standard scripts live in `package.json`:
- Dev server: `npm run dev` (serves on `http://localhost:3000`; ready in ~1s).
- Build: `npm run build` (production build; passes type-checking).
- Lint: `npm run lint`.

Non-obvious caveats:
- `npm run lint` currently reports pre-existing errors (React Compiler `react-hooks/set-state-in-effect` in `hooks/use-tax-settings.ts`, `hooks/use-theme.ts`, etc.). These are existing code issues, not environment problems — do not "fix" them as part of unrelated work.
- The build does NOT fail on lint: `next.config.ts` sets `eslint.ignoreDuringBuilds: true`. It DOES type-check (`typescript.ignoreBuildErrors: false`).
- The app is fully client-rendered behind a hydration spinner, so the initial server HTML from `curl http://localhost:3000` will not contain the tab labels/UI text — verify the UI in a browser, not via curl body scraping.
- There is no test runner configured (no `test` script, no test files).
