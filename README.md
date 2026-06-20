# Метро Екатеринбурга

Неофициальное статическое PWA-приложение с расчётным временем прибытия поездов Екатеринбургского метрополитена. Приложение помогает выбрать станцию и направление, увидеть ближайший поезд, следующие рейсы и оценить время поездки до станции назначения.

Предполагаемый production URL для GitHub Pages:
`https://yarrobong.github.io/ekb-metro/`

## Статус

- Приложение остаётся release candidate и не должно описываться как уже опубликованный production.
- Расчёты основаны на локально сохранённом расписании и не заменяют фактическую информацию метрополитена.
- Приложение не является официальным сервисом Екатеринбургского метрополитена.

## Стек

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Zod
- Lucide React
- Vitest + React Testing Library
- `vite-plugin-pwa`

## Менеджер пакетов

В проекте используется только `npm`.

```bash
npm ci
```

## Команды

```bash
npm run dev
npm run validate:data
npm run typecheck
npm run lint
npm run format:check
npm run test:run
npm run build
```

## Локальный запуск

```bash
npm ci
npm run dev
```

Dev-сервер поднимается на `http://localhost:3000`.

## Production preview

```bash
npm run build
npm run preview
```

Production base path для сборки: `/ekb-metro/`.

## Что умеет приложение

- выбор текущей станции по интерактивной схеме линии;
- выбор допустимого направления;
- отображение ближайшего поезда, точного времени и ещё четырёх следующих поездов;
- корректная обработка операционного дня после полуночи в часовом поясе `Asia/Yekaterinburg`;
- расчёт количества станций, ориентировочного времени в пути и прибытия;
- PWA-установка и офлайн-работа после первой успешной загрузки.

## Офлайн и PWA

- используется Service Worker со стратегией `generateSW`;
- приложение кэширует app shell и локальные данные расписания;
- после первой онлайн-загрузки основные экраны работают без сети;
- обновление применяется только после явного действия пользователя.

## Источник данных

Основной локальный источник расписания:

- `src/data/schedule.ts`
- `src/data/stations.ts`
- `src/data/directions.ts`
- `src/data/driveTimes.ts`
- `src/data/specialDates.ts`
- `src/data/metadata.ts`

Официальный источник для сверки:
[metro-ektb.ru/rezhim-raboty-metropolitena-grafik_1211](https://metro-ektb.ru/rezhim-raboty-metropolitena-grafik_1211/)

Важно:

- не придумывать времена поездов;
- не подменять реальные данные демо-значениями;
- любые изменения расписания проверять через `npm run validate:data`.

## Структура проекта

```text
src/app        оболочка приложения, Zustand store, PWA context
src/components UI и метро-компоненты
src/pages      основные экраны приложения
src/domain     доменная логика времени, расписания и маршрутов
src/data       локальные данные метро
src/lib        клиентские пользовательские действия и утилиты
src/test       test setup и моки
scripts        служебные проверки данных
public         иконки, favicon, 404 fallback
docs           эксплуатационная документация
```

## Обратная связь

Основной канал сообщений об ошибках:
[GitHub Issues](https://github.com/yarrobong/ekb-metro/issues)

Приложение подготавливает текст issue с контекстом маршрута, временем Екатеринбурга, версией приложения и версией расписания, но без персональных данных, IP и геолокации.
