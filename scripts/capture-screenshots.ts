import { mkdir } from "node:fs/promises";

import { chromium, type Page } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:4173/ekb-metro/";
const SCREENSHOTS_DIR = "docs/screenshots";
const E2E_TIME = "2024-01-05T18:30:29+05:00";

await mkdir(SCREENSHOTS_DIR, { recursive: true });

const browser = await chromium.launch();

try {
  const heroPage = await createPage(browser, 1440, 1000);
  await openRoute(heroPage);
  await heroPage.screenshot({
    path: `${SCREENSHOTS_DIR}/hero-desktop.png`,
    fullPage: true,
  });
  await heroPage.close();

  const stationPage = await createPage(browser, 1440, 1000);
  await stationPage.goto(BASE_URL);
  await stationPage.getByRole("heading", { name: "Выберите станцию" }).waitFor();
  await stationPage.screenshot({
    path: `${SCREENSHOTS_DIR}/station-selection.png`,
    fullPage: true,
  });
  await stationPage.close();

  const detailsPage = await createPage(browser, 1440, 1000);
  await openRoute(detailsPage);
  await chooseDestination(detailsPage);
  await detailsPage.screenshot({
    path: `${SCREENSHOTS_DIR}/train-details.png`,
    fullPage: true,
  });
  await detailsPage.close();

  const plannerPage = await createPage(browser, 1440, 1000);
  await openRoute(plannerPage);
  await chooseDestination(plannerPage);
  await plannerPage.getByRole("button", { name: /Прибыть ко времени/i }).click();
  await plannerPage.locator('input[type="time"]').fill("19:00");
  await plannerPage.getByRole("button", { name: "Рассчитать поездку" }).click();
  await plannerPage.getByText("Успеваете").waitFor();
  await plannerPage.screenshot({
    path: `${SCREENSHOTS_DIR}/route-planner.png`,
    fullPage: true,
  });
  await plannerPage.close();

  const mobilePage = await createPage(browser, 390, 844);
  await mobilePage.emulateMedia({ colorScheme: "dark" });
  await openRoute(mobilePage);
  await chooseDestination(mobilePage);
  await mobilePage.screenshot({
    path: `${SCREENSHOTS_DIR}/mobile-dark.png`,
    fullPage: true,
  });
  await mobilePage.close();
} finally {
  await browser.close();
}

async function createPage(
  browserInstance: Awaited<ReturnType<typeof chromium.launch>>,
  width: number,
  height: number,
) {
  const page = await browserInstance.newPage({
    locale: "ru-RU",
    timezoneId: "Asia/Yekaterinburg",
    viewport: { width, height },
  });
  await page.addInitScript((time) => {
    window.localStorage.setItem("metro-e2e-now", time);
  }, E2E_TIME);
  return page;
}

async function openRoute(page: Page) {
  await page.goto(BASE_URL);
  await page.getByRole("heading", { name: "Выберите станцию" }).waitFor();
  await page.getByText("Геологическая", { exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /В сторону Ботанической/i })
    .click();
}

async function chooseDestination(page: Page) {
  await page.getByRole("button", { name: "Выбрать станцию" }).click();
  await page.getByRole("button", { name: /Ботаническая/i }).click();
  await page.getByRole("region", { name: "Станция назначения" }).waitFor();
}
