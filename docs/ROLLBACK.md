# Rollback

## When to rollback

Rollback should be considered if a change introduces:

- wrong GitHub Pages base path;
- broken offline boot;
- incorrect train state transitions;
- corrupted schedule data;
- regressions in destination calculations.

## Safe rollback principles

- Prefer reverting the specific commit that introduced the regression.
- Do not rewrite shared branch history.
- Do not use force-push on protected or collaborative branches.
- Verify that rollback does not discard legitimate schedule updates made after the bad change.

## After rollback

Run the full verification set again:

```bash
npm run validate:data
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
```

## Notes

- Keep rollback commits separate from forward fixes when practical.
- Re-check the generated PWA artifact and GitHub Pages base path after reverting.
