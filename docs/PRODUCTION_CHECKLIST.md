# Production Checklist

## Release readiness

- Automated tests pass: `npm run test:run`
- Types pass: `npm run typecheck`
- Lint passes with no warnings: `npm run lint`
- Production build succeeds: `npm run build`
- Metro data validation succeeds with 0 errors and 0 warnings
- Web manifest, service worker, and offline assets are generated in `dist/`

## Functional coverage

- All 9 stations are reachable from the UI
- Terminus stations auto-select the only valid direction
- Intermediate stations allow explicit direction choice
- Trip estimate updates after destination selection
- Schedule states cover before open, active service, arriving, last train, and closed
- Operating day stays correct after midnight in Yekaterinburg time
- Settings screen exposes update checks and user actions
- Install screen handles iPhone, Android, and desktop guidance

## PWA and offline

- Service worker registers successfully in production build
- Offline-ready notification is shown once per app version
- Update availability is surfaced through banner and toast flows
- Manual update check reports `latest`, `available`, `offline`, and `error` states correctly
- App shell remains bootable without network after initial cache warm-up

## Accessibility and UX

- Bottom sheet supports close button, overlay close, and `Escape`
- Focus returns after dialog dismissal
- Navigation remains reachable on narrow screens
- Toasts and update prompts do not block core train information

## Follow-up after publish

- Smoke-test on real iPhone and Android hardware
- Re-run manual schedule spot-checks against source timetable before each data release
- Record future ideas separately instead of expanding scope in the release branch
