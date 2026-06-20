import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  APPLICATION_INIT_TIMEOUT_MS,
  initializeApplication,
} from "./initializeApplication";

describe("initializeApplication", () => {
  it("returns the app component after successful initialization", async () => {
    const App: ComponentType = () => null;

    await expect(
      initializeApplication(() =>
        Promise.resolve({
          App,
        }),
      ),
    ).resolves.toBe(App);
  });

  it("times out a stalled initialization", async () => {
    vi.useFakeTimers();

    const initialization = initializeApplication(() => new Promise(() => undefined));
    const expectation = expect(initialization).rejects.toThrow(
      "Приложение не успело инициализироваться",
    );

    await vi.advanceTimersByTimeAsync(APPLICATION_INIT_TIMEOUT_MS);

    await expectation;

    vi.useRealTimers();
  });
});
