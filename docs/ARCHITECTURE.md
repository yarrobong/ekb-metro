# Architecture

## Goal

`ekb-metro` is a fully static client-side PWA for estimated Yekaterinburg Metro arrivals and trip calculations. There is no backend, database, or runtime API.

## Main layers

- `src/data`: canonical local schedule, station, direction, and drive-time data.
- `src/domain/time`: timezone-aware current time and formatting helpers for `Asia/Yekaterinburg`.
- `src/domain/metro`: schedule resolution, operating-day logic, full day schedule grouping, destination options, and travel estimates.
- `src/app`: shell, global store, PWA context, and top-level app state.
- `src/pages`: station selection, trains, settings, install, and about screens.
- `src/components`: reusable UI plus metro-specific interaction components.

The trains screen keeps composition, data preparation, and presentation separate:

- `src/pages/TrainsPage.tsx` composes the screen and wires actions together;
- `src/pages/trains/useTrainsPageModel.ts` reads session state and prepares domain data;
- `src/pages/trains/trainsPage.utils.ts` contains view-specific labels and ordering helpers;
- `src/components/metro/trains`: props-driven empty, direction, timer, upcoming-trains,
  destination, and arrival-planner blocks.

## State model

- Zustand stores the current screen, route selection, destination selection, and toast state.
- A dedicated lightweight theme store keeps only the user's theme preference and the resolved theme.
- Route selection is session-only and must not persist across full app launches.
- LocalStorage is limited to explicit user settings and non-critical PWA hints.
- Theme preference defaults to `system`, follows `prefers-color-scheme`, and updates the root `data-theme` plus runtime `theme-color`.
- The nested schedule screen reuses the same store state as `TrainsPage`, so going back must preserve station, direction, destination, and theme context.

## Time and schedule

- Every schedule calculation must use `Asia/Yekaterinburg`.
- Calendar day and operational day are distinct concepts.
- Internal train times may exceed `24:00`; UI formatting must wrap them for display.
- The compact first/last card and the full daily schedule must both be fed by one shared domain service, not by duplicated JSX calculations.
- Daily schedule mode `today` must respect the current operational day, while `weekday` and `weekend` expose static templates without real-time highlighting.
- Schedule edits must stay in `src/data/*` and always pass validation.

## PWA

- Vite production base is `/ekb-metro/`.
- `vite-plugin-pwa` generates the manifest and service worker.
- Offline readiness and update prompts are handled in `src/app/PwaContext.tsx`.
- Updates must not reload the app automatically without user action.
- The launch shell in `index.html` and `public/404.html` must set the correct theme before React starts to avoid a flash of the wrong theme.
