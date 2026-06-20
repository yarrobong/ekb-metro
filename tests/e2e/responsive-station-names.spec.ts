import { expect, type Locator, test, type Page } from "@playwright/test";

import { expectStationsScreen, openApp, seedMetroTime, selectRoute } from "./helpers";

const TEST_TIME = "2024-01-05T18:30:29+05:00";
const VIEWPORTS = [320, 360, 390, 430] as const;
const STATION_NAMES = [
  "Проспект Космонавтов",
  "Площадь 1905 года",
  "Машиностроителей",
  "Геологическая",
  "Ботаническая",
] as const;

test.describe("responsive station names", () => {
  test("keeps compact station blocks readable without horizontal overflow", async ({
    page,
  }) => {
    await seedMetroTime(page, TEST_TIME);

    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 });
      await openApp(page);

      for (const stationName of STATION_NAMES) {
        await expect(page.getByText(stationName, { exact: true })).toBeVisible();
      }

      await expectNoHorizontalOverflow(page);

      await selectRoute(page, "Геологическая", "В сторону Ботанической");
      await expect(page.getByText("Следующая станция: Чкаловская")).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.getByRole("button", { name: "Выбрать станцию" }).click();
      await expect(
        page.getByRole("heading", { name: "Выберите станцию назначения" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: /Ботаническая/i })).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.getByRole("button", { name: /Ботаническая/i }).click();

      const routeProgressCard = page.getByRole("region", {
        name: "Станция назначения",
      });
      await expect(routeProgressCard).toBeVisible();
      await expect(routeProgressCard.getByText("Ботаническая").first()).toBeVisible();
      await expect(routeProgressCard.getByText("2 станции")).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectNoHorizontalOverflow(page, routeProgressCard);

      await expectStationsScreenAfterReset(page);
    }
  });
});

async function expectNoHorizontalOverflow(page: Page, locator?: Locator) {
  const metrics = locator
    ? await locator.evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }))
    : await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function expectStationsScreenAfterReset(page: Page) {
  await page.goto("./");
  await expectStationsScreen(page);
}
