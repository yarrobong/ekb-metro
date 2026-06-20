import { expect, type BrowserContext, type Page } from "@playwright/test";

export const TEST_TIME_31_SECONDS = "2024-01-05T18:30:29+05:00";
export const TEST_TIME_30_SECONDS = "2024-01-05T18:30:30+05:00";
export const TEST_TIME_1_SECOND = "2024-01-05T18:30:59+05:00";
export const TEST_TIME_ARRIVING = "2024-01-05T18:31:05+05:00";
export const TEST_TIME_NEXT_TRAIN = "2024-01-05T18:31:16+05:00";
export const TEST_TIME_BEFORE_OPEN = "2024-01-08T05:58:59+05:00";
export const TEST_TIME_AFTER_CLOSE = "2024-01-06T00:15:16+05:00";
const METRO_E2E_TIME_KEY = "metro-e2e-now";
const METRO_E2E_TIME_EVENT = "metro:e2e-time-change";

export async function seedMetroTime(page: Page, isoString: string) {
  await page.addInitScript(
    ([storageKey, value]) => {
      window.localStorage.setItem(storageKey, value);
    },
    [METRO_E2E_TIME_KEY, isoString] as const,
  );
}

export async function setMetroTime(page: Page, isoString: string) {
  await page.evaluate(
    ([storageKey, eventName, value]) => {
      window.localStorage.setItem(storageKey, value);
      window.dispatchEvent(new Event(eventName));
    },
    [METRO_E2E_TIME_KEY, METRO_E2E_TIME_EVENT, isoString] as const,
  );
}

export async function openApp(page: Page) {
  await page.goto("./");
  await expectStationsScreen(page);
}

export async function expectStationsScreen(page: Page) {
  await expect(
    page.getByRole("heading", {
      name: "Выберите станцию",
    }),
  ).toBeVisible({ timeout: 15_000 });
}

export async function selectRoute(
  page: Page,
  stationName: string,
  directionName?: string,
) {
  await page.getByText(stationName, { exact: true }).click();

  if (directionName) {
    await page
      .getByRole("dialog")
      .getByRole("button", { name: new RegExp(directionName, "i") })
      .click();
  }
}

export async function waitForServiceWorkerControl(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });

  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
}

export async function createContextFromStorage(context: BrowserContext) {
  const browser = context.browser();
  if (!browser) {
    throw new Error("Browser instance is not available");
  }

  const storageState = await context.storageState();

  return browser.newContext({
    storageState,
    locale: "ru-RU",
    timezoneId: "Asia/Yekaterinburg",
  });
}
