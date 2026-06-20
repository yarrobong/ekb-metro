import { expect, test } from "@playwright/test";

import {
  openApp,
  seedMetroTime,
  selectDestination,
  selectRoute,
  TEST_TIME_31_SECONDS,
} from "./helpers";

test.describe("critical metro flows", () => {
  test("covers the main route flow and resets destination after direction change", async ({
    page,
  }) => {
    await seedMetroTime(page, TEST_TIME_31_SECONDS);
    await openApp(page);

    await selectRoute(page, "Геологическая", "В сторону Ботанической");

    await expect(page.getByRole("heading", { name: "Куда едете?" })).toBeVisible();
    await expect(page.getByText("00:31")).toBeVisible();
    await expect(page.getByText("Чкаловская")).toBeVisible();

    await selectDestination(page, "Ботаническая");

    await expect(page.getByText("Станция назначения")).toBeVisible();
    await expect(page.getByText("2 станции")).toBeVisible();
    await expect(page.getByText("Примерно 6 минут в пути")).toBeVisible();

    await page.getByRole("button", { name: "К Пр. Космонавтов" }).click();

    await expect(page.getByText("Площадь 1905 года")).toBeVisible();
    await expect(page.getByRole("button", { name: "Выбрать станцию" })).toBeVisible();
    await expect(page.getByText("Станция назначения")).not.toBeVisible();
  });

  test("auto-selects the only direction for a terminus station", async ({ page }) => {
    await seedMetroTime(page, TEST_TIME_31_SECONDS);
    await openApp(page);

    await selectRoute(page, "Проспект Космонавтов");

    await expect(page.getByText("Проспект Космонавтов")).toBeVisible();
    await expect(page.getByText("01:31")).toBeVisible();
    await expect(page.getByText("Уралмаш")).toBeVisible();
    await expect(page.getByText(/В сторону Ботанической/i)).toBeVisible();
  });
});
