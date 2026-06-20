# Test Matrix

## Automated checks

| Check                   | Scope                                                     |
| ----------------------- | --------------------------------------------------------- |
| `npm run validate:data` | Schedule consistency, counts, station graph integrity     |
| `npm run typecheck`     | TypeScript build graph                                    |
| `npm run lint`          | ESLint and React Hooks rules                              |
| `npm run format:check`  | Prettier formatting validation                            |
| `npm run test:run`      | Unit and component behavior                               |
| `npm run build`         | Validation, TypeScript build, Vite bundle, PWA generation |

## Time and operating-day coverage

| Scenario                                     | Coverage                                                             |
| -------------------------------------------- | -------------------------------------------------------------------- |
| `31`, `30`, `1`, `0`, `15` second boundaries | `src/domain/metro/schedule.test.ts`                                  |
| Before opening                               | `src/domain/metro/schedule.test.ts`, `src/pages/TrainsPage.test.tsx` |
| After closing                                | `src/domain/metro/schedule.test.ts`                                  |
| Last train and post-midnight arrival         | `src/domain/metro/schedule.test.ts`                                  |
| Friday to Saturday                           | `src/domain/metro/schedule.test.ts`                                  |
| Sunday to Monday                             | `src/domain/metro/schedule.test.ts`                                  |
| Yekaterinburg timezone handling              | `src/domain/time/time.test.ts`, metadata validation                  |

## Route and destination coverage

| Scenario                                | Coverage                                                           |
| --------------------------------------- | ------------------------------------------------------------------ |
| Station selection and direction choice  | `src/app/App.test.tsx`, `src/pages/StationsPage.test.tsx`          |
| Terminus auto-direction                 | `src/pages/StationsPage.test.tsx`, `src/pages/TrainsPage.test.tsx` |
| Destination list ordering               | `src/domain/metro/travel.test.ts`                                  |
| Destination selection                   | `src/pages/TrainsPage.test.tsx`, `src/app/App.test.tsx`            |
| Destination reset on direction change   | `src/app/App.test.tsx`                                             |
| Travel estimate and arrival calculation | `src/domain/metro/travel.test.ts`, `src/pages/TrainsPage.test.tsx` |

## Settings, PWA, and support coverage

| Scenario                           | Coverage                                                         |
| ---------------------------------- | ---------------------------------------------------------------- |
| LocalStorage-backed seconds toggle | `src/pages/SettingsPage.test.tsx`                                |
| Install flow actions               | `src/pages/InstallPage.test.tsx`                                 |
| Support action wiring              | `src/pages/SettingsPage.test.tsx`, `src/lib/userActions.test.ts` |
| GitHub Issues prefilled template   | `src/lib/userActions.test.ts`                                    |
| PWA registration shim              | `src/test/setup.ts`                                              |

## Manual coverage still required

- iPhone add-to-home-screen flow and safe-area behavior
- Android install prompt and offline reopening
- Desktop install prompt behavior
- Real-device validation of live regions and focus handling
