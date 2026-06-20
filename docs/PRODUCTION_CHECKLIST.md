# Production Checklist

## Pre-build

- `npm ci` completed successfully
- `npm run validate:data` passes with `0` errors and `0` warnings
- `npm run typecheck` passes
- `npm run lint` passes
- `npm run format:check` passes
- `npm run test:run` passes

## Build artifact

- `npm run build` succeeds
- Vite production base is `/ekb-metro/`
- `dist/manifest.webmanifest` is generated
- `dist/sw.js` and Workbox assets are generated
- `public/404.html` redirects to `/ekb-metro/`

## Functional checks

- All 9 stations are available in correct order
- Terminus stations expose only the valid direction
- Intermediate stations allow both valid directions
- Next train, countdown, exact time, and next four trains render correctly
- Destination selection excludes the current station and only shows forward stations
- Destination resets when station or direction changes
- Route state is not persisted between full launches

## PWA and offline

- App opens after first successful online load even without network
- Offline-ready notice is shown once per app version
- Update banner appears when a new version is waiting
- Update is applied only after explicit user action
- No unexpected automatic reload happens

## Release notes

- App should still be described as an unofficial client
- GitHub Pages publication must not be claimed until actually confirmed
- Manual smoke tests on iPhone and Android remain required before merge to `main`
