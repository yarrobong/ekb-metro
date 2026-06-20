import { defineConfig, devices } from "@playwright/test";

const previewOrigin = "http://127.0.0.1:4173";
const basePath = "/ekb-metro/";
const baseURL = new URL(basePath.slice(1), `${previewOrigin}/`).toString();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    locale: "ru-RU",
    timezoneId: "Asia/Yekaterinburg",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: "npm run build:e2e && npm run preview:e2e",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
