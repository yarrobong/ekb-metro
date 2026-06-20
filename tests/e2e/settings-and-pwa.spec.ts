import { expect, test } from "@playwright/test";

import {
  createContextFromStorage,
  expectStationsScreen,
  openApp,
  seedMetroTime,
  selectRoute,
  waitForServiceWorkerControl,
  TEST_TIME_30_SECONDS,
  TEST_TIME_31_SECONDS,
} from "./helpers";

interface WebManifestShape {
  start_url: string;
  scope: string;
}

function assertManifestShape(value: unknown): asserts value is WebManifestShape {
  if (typeof value !== "object" || value === null) {
    throw new Error("Manifest has an unexpected shape");
  }

  const manifest = value as Partial<Record<keyof WebManifestShape, unknown>>;

  if (typeof manifest.start_url !== "string" || typeof manifest.scope !== "string") {
    throw new Error("Manifest has an unexpected shape");
  }
}

test.describe("settings, offline mode and PWA smoke", () => {
  test("persists the seconds setting after reload but not the station selection", async ({
    context,
    page,
  }) => {
    await seedMetroTime(page, TEST_TIME_31_SECONDS);
    await openApp(page);
    await selectRoute(page, "Геологическая", "В сторону Ботанической");

    await page.getByRole("button", { name: "Настройки" }).click();
    await expect(page.getByRole("heading", { name: "Настройки" })).toBeVisible();

    await page.getByRole("switch", { name: "Показывать секунды" }).click();
    await page.getByRole("button", { name: "Поезда" }).click();

    await expect(page.getByText("1 минута")).toBeVisible();

    await page.reload();
    await expectStationsScreen(page);

    const nextContext = await createContextFromStorage(context);
    const nextPage = await nextContext.newPage();

    await seedMetroTime(nextPage, TEST_TIME_30_SECONDS);
    await openApp(nextPage);

    await selectRoute(nextPage, "Геологическая", "В сторону Ботанической");
    await expect(nextPage.getByText("меньше минуты", { exact: false })).toBeVisible();

    await nextContext.close();
  });

  test("works offline after the service worker is ready", async ({ context, page }) => {
    await seedMetroTime(page, TEST_TIME_31_SECONDS);
    await openApp(page);
    await waitForServiceWorkerControl(page);

    await context.setOffline(true);
    await page.reload();

    await expectStationsScreen(page);

    await selectRoute(page, "Геологическая", "В сторону Ботанической");
    await expect(page.getByText("00:31")).toBeVisible();

    await page.getByRole("button", { name: "Выбрать станцию" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Выберите станцию назначения",
      }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Ботаническая/i })).toBeVisible();
  });

  test("exposes a valid manifest, service worker and critical production assets", async ({
    page,
  }) => {
    await seedMetroTime(page, TEST_TIME_31_SECONDS);
    await openApp(page);

    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(manifestHref).toBeTruthy();

    const manifestUrl = new URL(manifestHref ?? "", page.url()).toString();
    const manifestResponse = await page.request.get(manifestUrl);
    expect(manifestResponse.ok()).toBeTruthy();

    const manifestValue: unknown = await manifestResponse.json();
    assertManifestShape(manifestValue);
    const manifest: WebManifestShape = manifestValue;
    const basePath = new URL(page.url()).pathname;
    expect(manifest.start_url).toBe(basePath);
    expect(manifest.scope).toBe(basePath);

    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });

    const registration = await page.evaluate(async () => {
      const swRegistration = await navigator.serviceWorker.getRegistration();
      return swRegistration?.active?.scriptURL ?? null;
    });
    expect(registration).toBeTruthy();

    const criticalResources = await page.evaluate(() => {
      const resourceUrls = new Set<string>();
      const selectors = [
        "script[src]",
        'link[rel="stylesheet"]',
        'link[rel="manifest"]',
        'link[rel="icon"]',
        'link[rel="apple-touch-icon"]',
      ];

      for (const selector of selectors) {
        for (const node of document.querySelectorAll<HTMLElement>(selector)) {
          const url = node.getAttribute("src") ?? node.getAttribute("href");
          if (url) {
            resourceUrls.add(new URL(url, window.location.href).toString());
          }
        }
      }

      return [...resourceUrls];
    });

    for (const resourceUrl of criticalResources) {
      const response = await page.request.get(resourceUrl);
      expect(response.status(), `${resourceUrl} should not return 404`).not.toBe(404);
    }
  });
});
