# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Turkish educational platform for BILSEM (gifted education) exam prep with cognitive games, brain trainers, and arcade games. React 18 + TypeScript + Vite PWA, backed by Supabase.

## Commands

```bash
npm run dev              # Dev server (Vite, 4GB heap)
npm run build            # Production build + sitemap
npm run lint             # ESLint check
npm run lint:strict      # ESLint with zero warnings
npm run typecheck        # tsc --noEmit

npm test                 # Unit + smoke tests
npm run test:unit        # Unit tests only (Node test runner)
npm run test:smoke       # Smoke tests only
npm run test:critical    # Critical flow subset

# Run a single test file:
node --import ./scripts/register-test-alias-loader.mjs --test --experimental-strip-types "tests/unit/path/to/file.test.ts"

npm run test:e2e         # Playwright full suite
npm run test:e2e:anon    # E2E anonymous routes only
npm run test:coverage:domain  # Domain coverage (70% threshold)
```

## Architecture — Layer Model

```
src/app/          → Bootstrap, providers, router shell
src/shared/       → Framework-agnostic types, utils, game logic (imports NOTHING above)
src/features/     → Domain use cases & models (imports only shared + own modules)
src/server/       → Repositories (Supabase) + AI provider adapters
src/pages/        → Route-level page components
src/components/   → UI components & game presentations
```

### Enforced Import Boundaries (ESLint `no-restricted-imports`)

- **`shared/`** cannot import from any upper layer.
- **`features/`** and **`server/`** cannot import from pages, components, contexts, hooks, routes, or app.
- **UI layers** (pages, components, hooks, contexts, routes, services, utils) cannot import `@/lib/supabase` directly — all data access goes through `src/server/repositories/` or feature use cases.
- **AI provider calls** only from `src/server/ai/`.

### Data Access Pattern

UI → feature use case → repository (`src/server/repositories/`) → Supabase client. No `supabase.from(...)` in UI code.

## Game Architecture

Two game families with shared shells:

**Arcade Games** (`src/components/Arcade/`):
- Wrap in `KidGameShell` with `playAreaRef` prop
- Use `useGameViewportFocus()` for scroll/focus on start/restart
- Use `useArcadeSoundEffects()` for standardized sound events
- Show feedback via `KidGameFeedbackBanner`
- Overlays via `KidGameStatusOverlay`

**Brain Trainers** (`src/components/BrainTrainer/`):
- Wrap in `BrainTrainerShell` (has built-in viewport focus)
- Use `useGameEngine` for shared game loop (score, level, timing)
- Split into: `logic.ts` (pure functions), `useXxxController.ts` (state), `XxxBoard.tsx` (presentation)

### Game File Organization

Large game components are split: container / presentation / logic / constants / types. Canvas rendering goes in dedicated files.

## Key Conventions

- **Language**: All user-facing text is Turkish with proper UTF-8 characters (no ASCII substitutes).
- **Path alias**: `@/*` maps to `src/*` (tsconfig paths).
- **File size**: Keep under ~400 lines; split by responsibility.
- **Testing**: Node built-in test runner (`node:test` + `node:assert/strict`). Tests use a custom alias loader (`scripts/register-test-alias-loader.mjs`).
- **Sound events**: `start`, `launch`, `hit`, `success`, `reward`, `levelUp`, `fail` — defined in `src/components/Arcade/Shared/arcadeSoundModel.ts`.
- **No direct `window.scrollTo(0,0)`** in game controllers — use `useGameViewportFocus` instead.

## CI Pipeline

Typecheck → Lint → Critical smoke tests → E2E (Playwright) → Unit+smoke tests → Domain coverage gate (70%) → Build + bundle budget check.
