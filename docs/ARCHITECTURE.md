# Architecture

## Goal

`ebk-metro` is a fully static client-side PWA for estimated Yekaterinburg Metro arrivals and trip calculations. There is no backend, database, or runtime API.

## Main layers

- `src/data`: canonical local schedule, station, direction, and drive-time data.
- `src/domain/time`: timezone-aware current time and formatting helpers for `Asia/Yekaterinburg`.
- `src/domain/metro`: schedule resolution, operating-day logic, destination options, and travel estimates.
- `src/app`: shell, global store, PWA context, and top-level app state.
- `src/pages`: station selection, trains, settings, install, and about screens.
- `src/components`: reusable UI plus metro-specific interaction components.

## State model

- Zustand stores the current screen, route selection, destination selection, and toast state.
- Route selection is session-only and must not persist across full app launches.
- LocalStorage is limited to explicit user settings and non-critical PWA hints.

## Time and schedule

- Every schedule calculation must use `Asia/Yekaterinburg`.
- Calendar day and operational day are distinct concepts.
- Internal train times may exceed `24:00`; UI formatting must wrap them for display.
- Schedule edits must stay in `src/data/*` and always pass validation.

## PWA

- Vite production base is `/ebk-metro/`.
- `vite-plugin-pwa` generates the manifest and service worker.
- Offline readiness and update prompts are handled in `src/app/PwaContext.tsx`.
- Updates must not reload the app automatically without user action.
