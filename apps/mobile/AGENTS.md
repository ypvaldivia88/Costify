# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

> **Staging / secrets / URLs de producción:** ver [`/AGENTS.md`](../../AGENTS.md) en la raíz del monorepo.

## Monorepo

This app lives at `apps/mobile` inside the Costify monorepo. Shared business logic is in `packages/shared` (`@costify/shared`) and client hooks/sync in `packages/client-data` (`@costify/client-data`).

From the repo root:

```bash
pnpm install
pnpm dev:mobile
```

Type-check: `pnpm --filter costify-mobile typecheck`

## Cursor Cloud specific instructions

**What this is:** `costify-mobile` ("Costify") is a single, fully offline Expo SDK 56 / React Native app (no backend, no DB, no network — all data lives in on-device AsyncStorage). The only dev service is the Expo/Metro dev server.

**Running the app:** There is no Android emulator in the cloud VM, so use the web target to interact with the app:

```bash
cd apps/mobile
EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1 npx expo start --web --port 8081
```

- `EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1` is **required** to bundle. SDK 56 throws (`expo-router is no longer compatible with react-navigation`) when both packages are installed. This app actually uses React Navigation (`src/navigation/AppNavigator.tsx`); `expo-router` is an unused leftover dependency, so disabling the check is safe.
- Add `CI=1` to disable Metro watch mode for one-shot/background runs.
- First web bundle takes ~30s. Confirm a clean build by fetching the bundle: `curl "http://localhost:8081/index.ts.bundle?platform=web&dev=true"` should return HTTP 200 (not a JSON `InternalError`).

**Dependency gotchas:**
- Use `pnpm install` from the monorepo root (not `npm install` in this folder).
- `metro.config.js` is configured for the monorepo (`watchFolders` includes repo root).
- Shared code imports use `@costify/shared/*`.

**Lint/test/build:** There is no ESLint config and no test framework. Type-check with `pnpm typecheck`. Production builds use EAS (`eas build`), which needs an Expo account + real `projectId` in `app.json`.
