import { expect, test } from "@playwright/test";

import {
  openApp,
  seedMetroTime,
  selectRoute,
  setMetroTime,
  TEST_TIME_1_SECOND,
  TEST_TIME_30_SECONDS,
  TEST_TIME_31_SECONDS,
  TEST_TIME_AFTER_CLOSE,
  TEST_TIME_ARRIVING,
  TEST_TIME_BEFORE_OPEN,
  TEST_TIME_NEXT_TRAIN,
} from "./helpers";

test.describe("metro time states", () => {
  test("covers normal waiting, thresholds, arrival and switching to the next train", async ({
    page,
  }) => {
    await seedMetroTime(page, TEST_TIME_31_SECONDS);
    await openApp(page);
    await selectRoute(page, "Геологическая", "В сторону Ботанической");

    await expect(page.getByText("00:31")).toBeVisible();
    await expect(page.getByText("Прибытие в 18:31")).toBeVisible();

    await setMetroTime(page, TEST_TIME_30_SECONDS);
    await expect(page.getByText("00:30")).toBeVisible();
    await expect(page.getByText("Поезд приближается")).toBeVisible();

    await setMetroTime(page, TEST_TIME_1_SECOND);
    await expect(page.getByText("00:01")).toBeVisible();
    await expect(page.getByText("Поезд приближается")).toBeVisible();

    await setMetroTime(page, TEST_TIME_ARRIVING);
    await expect(page.getByText("Поезд прибывает")).toBeVisible();
    await expect(page.getByText("По расписанию", { exact: true })).toBeVisible();

    await setMetroTime(page, TEST_TIME_NEXT_TRAIN);
    await expect(page.getByText("04:44")).toBeVisible();
    await expect(page.getByText("Прибытие в 18:36")).toBeVisible();
  });

  test("shows the before-open state for the current operational day", async ({
    page,
  }) => {
    await seedMetroTime(page, TEST_TIME_BEFORE_OPEN);
    await openApp(page);
    await selectRoute(page, "Геологическая", "В сторону Ботанической");

    await expect(page.getByText("Метро пока закрыто")).toBeVisible();
    await expect(page.getByText("03:01")).toBeVisible();
    await expect(page.getByText("Первый поезд в 06:02")).toBeVisible();
  });

  test("returns to the closed overnight state after the final train passes", async ({
    page,
  }) => {
    await seedMetroTime(page, TEST_TIME_31_SECONDS);
    await openApp(page);
    await selectRoute(page, "Геологическая", "В сторону Ботанической");

    await setMetroTime(page, TEST_TIME_AFTER_CLOSE);
    await expect(page.getByText("Метро пока закрыто")).toBeVisible();
    await expect(page.getByText("Первый поезд в 06:02")).toBeVisible();
  });

  test("keeps after-midnight departures at the end of the full schedule", async ({
    page,
  }) => {
    await seedMetroTime(page, "2024-01-06T00:00:05+05:00");
    await openApp(page);
    await selectRoute(page, "Геологическая", "В сторону Ботанической");

    await page.getByText("Первый и последний поезд").click();

    const afterMidnightGroup = page.getByLabel("Отправления в 00 часов");

    await expect(
      page.getByText("Ночная часть расписания за 5 января").first(),
    ).toBeVisible();
    await expect(page.getByText("После полуночи", { exact: true })).toBeVisible();
    await expect(afterMidnightGroup.getByText("00")).toBeVisible();
    await expect(afterMidnightGroup.getByText("01")).toBeVisible();
    await expect(afterMidnightGroup.getByText("15")).toBeVisible();
    await expect(page.getByText("Ближайший")).toBeVisible();
    await expect(page.getByText("24:01")).not.toBeVisible();
  });

  test("plans an after-midnight arrival without showing 24-hour overflow", async ({
    page,
  }) => {
    await seedMetroTime(page, TEST_TIME_31_SECONDS);
    await openApp(page);

    await selectRoute(page, "Геологическая", "В сторону Ботанической");
    await page.getByRole("button", { name: "Выбрать станцию" }).click();
    await page.getByRole("button", { name: /Ботаническая/i }).click();

    await page.getByRole("button", { name: /Прибыть ко времени/i }).click();
    await page.getByRole("radio", { name: "Завтра" }).click();
    await page.locator('input[type="time"]').fill("00:20");
    await page.getByRole("button", { name: "Рассчитать поездку" }).click();

    await expect(page.getByText("Успеваете")).toBeVisible();
    await expect(page.getByText("00:01")).toBeVisible();
    await expect(page.getByText("Прибытие примерно в 00:07")).toBeVisible();
    await expect(page.getByText("Запас: 13 минут")).toBeVisible();
    await expect(page.getByText("24:01")).not.toBeVisible();
  });
});
