# Test Matrix

## Automated checks

| Check                   | Scope                                                                                         | Status |
| ----------------------- | --------------------------------------------------------------------------------------------- | ------ |
| `npm run test:run`      | Unit + component scenarios for time, schedules, stations, destination, settings, install flow | Passed |
| `npm run typecheck`     | TypeScript build graph                                                                        | Passed |
| `npm run lint`          | ESLint + React rules                                                                          | Passed |
| `npm run build`         | Data validation + production bundle + PWA generation                                          | Passed |
| `npm run validate:data` | Schedule consistency, counts, missing combinations                                            | Passed |

## Station and direction matrix

| Station              | Toward Prospekt Kosmonavtov | Toward Botanicheskaya | Notes                             |
| -------------------- | --------------------------- | --------------------- | --------------------------------- |
| Prospekt Kosmonavtov | No                          | Yes                   | Terminus, direction auto-selected |
| Uralmash             | Yes                         | Yes                   | Intermediate                      |
| Mashinostroiteley    | Yes                         | Yes                   | Intermediate                      |
| Uralskaya            | Yes                         | Yes                   | Intermediate                      |
| Dinamo               | Yes                         | Yes                   | Intermediate                      |
| Ploshchad 1905 Goda  | Yes                         | Yes                   | Intermediate                      |
| Geologicheskaya      | Yes                         | Yes                   | Intermediate                      |
| Chkalovskaya         | Yes                         | Yes                   | Intermediate                      |
| Botanicheskaya       | Yes                         | No                    | Terminus, direction auto-selected |

## Time and state matrix

| Scenario                                | Covered by                                                          |
| --------------------------------------- | ------------------------------------------------------------------- |
| Before opening                          | `schedule.test.ts`, `TrainsPage.test.tsx`                           |
| Active daytime service                  | `schedule.test.ts`, `travel.test.ts`, `App.test.tsx`                |
| Last train                              | `schedule.test.ts`, `TrainsPage.test.tsx`                           |
| After closing                           | `schedule.test.ts`, `App.test.tsx`                                  |
| Crossing midnight                       | `schedule.test.ts`, `time.service` tests                            |
| Friday to Saturday                      | `schedule.test.ts`                                                  |
| Sunday to Monday                        | `schedule.test.ts`                                                  |
| Weekend / weekday switching             | `schedule.test.ts`                                                  |
| Destination selection and trip estimate | `travel.test.ts`, `TrainsPage.test.tsx`                             |
| Settings, install, update prompts       | `SettingsPage.test.tsx`, `InstallPage.test.tsx`, `PwaContext` flows |

## Device matrix

| Device class            | Coverage                                                                  |
| ----------------------- | ------------------------------------------------------------------------- |
| iPhone / iOS Safari     | Manual install instructions, standalone detection, safe-area layout paths |
| Android Chrome          | Prompt install flow, standalone mode, offline cache paths                 |
| Desktop Chrome / Edge   | Manual install flow, update checks, keyboard navigation                   |
| Narrow mobile viewport  | Bottom navigation and bottom sheet behavior verified by component tests   |
| Offline / flaky network | PWA context handles offline update checks and cached app shell            |

## Findings fixed during stage

| Area                      | Fix                                                              |
| ------------------------- | ---------------------------------------------------------------- |
| Destination calculation   | Corrected destination ordering for both directions               |
| Night schedule boundaries | Updated tests to match real post-midnight operating-day behavior |
| PWA testability           | Added virtual module shim for `virtual:pwa-register/react`       |
| Install flow typing       | Made install-method branches exhaustive                          |
| UI state                  | Preserved destination and update flows across refresh checks     |
