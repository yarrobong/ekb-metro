import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("launch html shell", () => {
  it("defines the dark launch shell directly in index.html", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf-8");

    expect(html).toContain('name="theme-color" content="#0B0E12"');
    expect(html).toContain("background: #0b0e12");
    expect(html).toContain("viewport-fit=cover");
    expect(html).toContain('class="launch-screen"');
    expect(html).toContain("Метро Екатеринбурга");
    expect(html).toContain("Загружаем расписание");
  });

  it("keeps the dark redirect shell in the offline fallback page", () => {
    const html = readFileSync(resolve(process.cwd(), "public/404.html"), "utf-8");

    expect(html).toContain('name="theme-color" content="#0B0E12"');
    expect(html).toContain("background: #0b0e12");
    expect(html).toContain("viewport-fit=cover");
  });
});
