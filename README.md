# Metro EKB

Неофициальное PWA-приложение для Екатеринбургского метрополитена: выберите станцию и направление, посмотрите ближайшие отправления, рассчитайте поездку до станции назначения и подберите поезд к нужному времени прибытия.

## Live Demo

[Открыть Metro EKB на GitHub Pages](https://yarrobong.github.io/ekb-metro/)

![Metro EKB — основной экран](docs/screenshots/hero-desktop.png)

## Возможности

- выбор текущей станции по интерактивной схеме линии;
- выбор допустимого направления, ближайший поезд и следующие четыре отправления;
- первый и последний поезд для текущей станции и полный дневной график;
- расчёт количества станций, времени в пути и ориентировочного прибытия;
- планирование поездки к указанному времени, включая рейсы после полуночи;
- автоматическая, светлая и тёмная темы с сохранением пользовательского выбора;
- установка как PWA и работа основных экранов без сети после первой загрузки;
- mobile-first интерфейс с keyboard-friendly controls и focus states.

## Tech Stack

- React 19 + TypeScript;
- Vite + Tailwind CSS;
- Zustand для session state и пользовательских настроек;
- Zod для валидации локальных данных расписания;
- Vitest + React Testing Library для unit/component tests;
- Playwright для end-to-end сценариев;
- `vite-plugin-pwa` для manifest и service worker;
- GitHub Actions + GitHub Pages для CI/CD и production deployment.

## Технические особенности

### Domain-слой и page model

Расписание, операционный день, временные зоны, маршрут и расчёт поездки находятся в `src/domain`. UI-компоненты получают подготовленные данные через props и не дублируют алгоритмы расчёта.

`TrainsPage` отвечает за композицию экрана. Store-подключение и подготовка данных собраны в `src/pages/trains/useTrainsPageModel.ts`, а самостоятельные блоки находятся в `src/components/metro/trains/`.

### Операционный день метро

Календарная дата и операционный день метро — не одно и то же. Рейсы после полуночи могут логически относиться к предыдущему операционному дню. Domain-сервис учитывает эту границу отдельно: ночная часть расписания остаётся в конце графика, а в интерфейсе отображается обычное время `00:xx`, без искусственных значений вроде `24:xx`.

Все расчёты используют часовой пояс `Asia/Yekaterinburg`. Переходы до открытия, после закрытия, первый/последний поезд и arrival planner покрыты тестами.

### Локальные данные

Приложение полностью client-side. Расписание и нормативные времена перегонов входят в production bundle из `src/data/*`; runtime API, backend, база данных и GPS/realtime tracking не используются. Скрипт `npm run validate:data` проверяет целостность станций, направлений, графика и времён перегонов до сборки.

## Screenshots

![Выбор станции и направления](docs/screenshots/station-selection.png)

![Ближайший поезд и маршрут до станции назначения](docs/screenshots/train-details.png)

![Arrival planner](docs/screenshots/route-planner.png)

![Mobile dark theme](docs/screenshots/mobile-dark.png)

## Архитектура

```text
src/
├── app/                  shell, Zustand store, theme и PWA context
├── components/
│   ├── metro/             карта, destination sheet и route cards
│   └── metro/trains/      props-driven блоки TrainsPage
├── data/                 локальные станции, направления и расписание
├── domain/
│   ├── metro/             расписание, операционный день и поездки
│   └── time/              timezone-aware time helpers
├── pages/                 экраны приложения
│   └── trains/            TrainsPage model и presentation utils
└── styles/                Tailwind/CSS tokens и responsive styles
```

## Testing и CI/CD

Локальный release-check:

```bash
npm run format:check
npm run typecheck
npm run lint
npm run validate:data
npm run test:run
npm run test:e2e
npm run build
```

Проверки включают domain-логику времени и расписания, component behavior, маршруты и destination selection, theme/PWA flows, offline smoke test, responsive layout и сценарии после полуночи.

GitHub Actions запускает `verify` и отдельный `playwright` job. GitHub Pages deployment разрешён только после успешного завершения обоих jobs; для pull request deployment не выполняется.

## PWA и offline

Production build генерирует manifest и service worker через `vite-plugin-pwa` (`generateSW`). App shell и bundled local data кэшируются после первой успешной загрузки, поэтому основные экраны доступны без сети. Обновление приложения применяется только после явного действия пользователя через update prompt.

Base path production-сборки: `/ekb-metro/`.

## Локальный запуск

В проекте используется только `npm`:

```bash
npm ci
npm run dev
```

Dev server: `http://localhost:3000`.

Для production preview:

```bash
npm run build
npm run preview
```

E2E запускается кроссплатформенно через `npm run test:e2e`; Playwright автоматически собирает E2E build и поднимает preview server на `http://127.0.0.1:4173/ekb-metro/`.

## Источник расписания

Канонические данные находятся в:

- `src/data/schedule.ts`;
- `src/data/stations.ts`;
- `src/data/directions.ts`;
- `src/data/driveTimes.ts`;
- `src/data/specialDates.ts`;
- `src/data/metadata.ts`.

Для сверки используется [официальный график работы Екатеринбургского метрополитена](https://metro-ektb.ru/rezhim-raboty-metropolitena-grafik_1211/). Изменения расписания нужно вносить только после проверки источника и обязательно подтверждать `npm run validate:data`.

## Disclaimer

Metro EKB — неофициальное приложение и не связано с Екатеринбургским метрополитеном. Расчёты выполняются на основе локально сохранённого расписания и нормативных времён перегонов; они не показывают фактическое положение поездов в реальном времени и могут отличаться от реального движения.

## Release

Текущая версия проекта: `1.0.0`.

Планируемый tag: `v1.0.0`

Название: **Metro EKB v1.0 — Portfolio Release**

## Feedback

[Сообщить об ошибке через GitHub Issues](https://github.com/yarrobong/ekb-metro/issues)
