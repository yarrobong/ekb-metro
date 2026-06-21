import { expect, test } from "@playwright/test";

import { openApp, seedMetroTime, selectRoute, TEST_TIME_31_SECONDS } from "./helpers";

test.describe("critical metro flows", () => {
  test("covers the main route flow and resets destination after direction change", async ({
    page,
  }) => {
    await seedMetroTime(page, TEST_TIME_31_SECONDS);
    await openApp(page);

    await selectRoute(page, "Геологическая", "В сторону Ботанической");

    await expect(page.getByText("Следующая станция: Чкаловская")).toBeVisible();
    await expect(page.getByText("00:31")).toBeVisible();
    await expect(page.getByText("Прибытие в 18:31")).toBeVisible();

    await page.getByRole("button", { name: "Выбрать станцию" }).click();
    await expect(
      page.getByRole("heading", { name: "Выберите станцию назначения" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Ботаническая/i }).click();

    const routeProgressCard = page.getByRole("region", {
      name: "Станция назначения",
    });
    await expect(routeProgressCard).toBeVisible();
    await expect(routeProgressCard.getByText("Ботаническая").first()).toBeVisible();
    await expect(routeProgressCard.getByText("2 станции")).toBeVisible();
    await expect(routeProgressCard.getByText("Примерно 6 минут в пути")).toBeVisible();

    await page.getByRole("button", { name: "К Пр. Космонавтов" }).click();

    await expect(page.getByText("Следующая станция: Площадь 1905 года")).toBeVisible();
    await expect(page.getByRole("button", { name: "Выбрать станцию" })).toBeVisible();
    await expect(page.getByText("Станция назначения")).not.toBeVisible();
  });

  test("auto-selects the only direction for a terminus station", async ({ page }) => {
    await seedMetroTime(page, TEST_TIME_31_SECONDS);
    await openApp(page);

    await selectRoute(page, "Проспект Космонавтов");

    await expect(page.getByText("Проспект Космонавтов")).toBeVisible();
    await expect(page.getByText("01:31")).toBeVisible();
    await expect(page.getByText("Прибытие в 18:32")).toBeVisible();
    await expect(page.getByText("Уралмаш")).toBeVisible();
    await expect(page.getByText(/В сторону Ботанической/i)).toBeVisible();
  });

  test("opens the full schedule, switches modes and returns without losing the route", async ({
    page,
  }) => {
    await seedMetroTime(page, TEST_TIME_31_SECONDS);
    await openApp(page);

    await selectRoute(page, "Геологическая", "В сторону Ботанической");
    await page.getByText("Первый и последний поезд").click();

    await expect(
      page.getByRole("heading", {
        name: "Расписание",
      }),
    ).toBeVisible();
    await expect(page.getByText("Геологическая")).toBeVisible();
    await expect(page.getByText("В сторону Ботанической")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Сегодня" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.getByText("Ближайший")).toBeVisible();
    await expect(page.getByText("После полуночи", { exact: true })).toBeVisible();
    await expect(page.getByText("00:15")).toBeVisible();

    await page.getByRole("radio", { name: "Будни" }).click();
    await expect(page.getByText("Типовое расписание рабочего дня")).toBeVisible();

    await page.getByRole("radio", { name: "Выходные" }).click();
    await expect(page.getByText("Типовое расписание выходного дня")).toBeVisible();

    await page.getByRole("button", { name: /Назад/i }).click();
    await expect(page.getByText("Следующий поезд")).toBeVisible();
    await expect(page.getByText("Геологическая")).toBeVisible();
    await expect(page.getByText("Чкаловская")).toBeVisible();
  });

  test("plans an arrival time, opens the full schedule and keeps the result on return", async ({
    page,
  }) => {
    await seedMetroTime(page, TEST_TIME_31_SECONDS);
    await openApp(page);

    await selectRoute(page, "Геологическая", "В сторону Ботанической");
    await page.getByRole("button", { name: "Выбрать станцию" }).click();
    await page.getByRole("button", { name: /Ботаническая/i }).click();

    await page.getByRole("button", { name: /Прибыть ко времени/i }).click();
    await page.locator('input[type="time"]').fill("19:00");
    await page.getByRole("button", { name: "Рассчитать поездку" }).click();

    await expect(page.getByText("Успеваете")).toBeVisible();
    await expect(page.getByText("18:50")).toBeVisible();
    await expect(page.getByText("Прибытие примерно в 18:56")).toBeVisible();
    await expect(page.getByText("Запас: 4 минуты")).toBeVisible();

    await page.getByRole("button", { name: "Открыть полное расписание" }).click();

    await expect(page.getByRole("heading", { name: "Расписание" })).toBeVisible();
    await expect(page.getByText("Подходит для прибытия к 19:00")).toBeVisible();

    await page.getByRole("button", { name: /Назад/i }).click();

    await expect(page.getByRole("heading", { name: "Прибыть ко времени" })).toBeVisible();
    await expect(page.getByText("18:50")).toBeVisible();

    await page.getByRole("button", { name: /Назад/i }).click();

    await expect(page.getByText("Следующий поезд")).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: /Прибыть к 19:00[\s\S]*Поезд в 18:50[\s\S]*Прибытие примерно в 18:56/i,
      }),
    ).toBeVisible();
  });
});
