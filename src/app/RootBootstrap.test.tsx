import type { ComponentType } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppErrorBoundary } from "../components/app/AppErrorBoundary";
import { RootBootstrap } from "./RootBootstrap";
import { LAUNCH_STATUS_DELAY_MS, initializeApplication } from "./initializeApplication";

vi.mock("./initializeApplication", () => ({
  LAUNCH_STATUS_DELAY_MS: 160,
  APPLICATION_INIT_TIMEOUT_MS: 8_000,
  initializeApplication: vi.fn(),
}));

function createDeferredAppImport() {
  let resolvePromise!: (value: ComponentType) => void;
  let rejectPromise!: (reason?: unknown) => void;

  const promise = new Promise<ComponentType>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise,
  };
}

const initializeApplicationMock = vi.mocked(initializeApplication);

describe("RootBootstrap", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("quickly opens the app without showing the delayed loading text", async () => {
    initializeApplicationMock.mockResolvedValue(() => <h1>Приложение готово</h1>);

    render(<RootBootstrap />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByRole("heading", { name: "Приложение готово" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Загружаем расписание")).not.toBeInTheDocument();
  });

  it("keeps the launch shell during a slow initialization and then removes it", async () => {
    vi.useFakeTimers();

    const deferred = createDeferredAppImport();
    initializeApplicationMock.mockReturnValue(deferred.promise);

    render(<RootBootstrap />);

    expect(
      screen.getByRole("heading", { name: "Метро Екатеринбурга" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Загружаем расписание")).toHaveAttribute(
      "data-visible",
      "false",
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(LAUNCH_STATUS_DELAY_MS);
    });

    expect(screen.getByText("Загружаем расписание")).toHaveAttribute(
      "data-visible",
      "true",
    );

    await act(async () => {
      deferred.resolve(() => <h1>Станции</h1>);
      await Promise.resolve();
    });

    expect(screen.getByRole("heading", { name: "Станции" })).toBeInTheDocument();
    expect(screen.queryByText("Загружаем расписание")).not.toBeInTheDocument();
  });

  it("passes initialization errors to the existing error boundary", async () => {
    initializeApplicationMock.mockRejectedValue(new Error("bootstrap failed"));

    render(
      <AppErrorBoundary>
        <RootBootstrap />
      </AppErrorBoundary>,
    );

    expect(
      await screen.findByRole("heading", { name: "Что-то пошло не так" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Повторить" })).toBeInTheDocument();
  });

  it("respects reduced motion for the launch animation", () => {
    vi.useFakeTimers();

    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const deferred = createDeferredAppImport();
    initializeApplicationMock.mockReturnValue(deferred.promise);

    render(<RootBootstrap />);

    expect(
      screen.getByText("Метро Екатеринбурга").closest("[data-reduced-motion]"),
    ).toHaveAttribute("data-reduced-motion", "true");
  });

  it("opens offline after installation without a network dependency", async () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });

    initializeApplicationMock.mockResolvedValue(() => <h1>Офлайн запуск</h1>);

    render(<RootBootstrap />);

    expect(
      await screen.findByRole("heading", { name: "Офлайн запуск" }),
    ).toBeInTheDocument();
  });
});
