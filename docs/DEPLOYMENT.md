# Deployment

## Target

The intended static host is GitHub Pages at:
`https://yarrobong.github.io/ekb-metro/`

## Production assumptions

- Vite `base` must stay `/ekb-metro/`.
- Manifest `start_url` and `scope` must match `/ekb-metro/`.
- `public/404.html` must redirect to `/ekb-metro/`.
- Only the `dist` directory should be uploaded to GitHub Pages.

## Local verification

```bash
npm ci
npm run validate:data
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
```

Then check the built artifact with:

```bash
npm run preview
```

## GitHub Actions

The workflow should:

- run on pull requests, pushes to `main`, and manual dispatch;
- use `npm ci`;
- validate formatting, types, lint, schedule data, tests, and production build;
- deploy only after successful checks;
- use standard GitHub Pages actions without personal tokens.

## Manual release checks

- Confirm the build opens from the `/ekb-metro/` base path.
- Confirm install prompt behavior on Android and desktop.
- Confirm manual install instructions on iPhone.
- Confirm offline launch after the first online visit.
