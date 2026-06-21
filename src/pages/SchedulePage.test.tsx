import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { App } from "../app/App";
import { useAppStore } from "../app/store";

vi.mock("../app/hooks/useLiveMetroTime", () => ({
  useLiveMetroTime: () => ({
    dateString: "2024-01-05",
    dayOfWeek: 5,
    isWeekend: false,
    hours: 18,
    minutes: 24,
    seconds: 0,
    totalSeconds: 18 * 3600 + 24 * 60,
  }),
}));

vi.mock("../app/usePwa", () => ({
  usePwa: () => ({
    installMethod: "manual",
    shouldShowInstallPrompt: false,
    dismissInstallPrompt: vi.fn(),
    openInstallPrompt: vi.fn(),
  }),
}));

describe("SchedulePage flow", () => {
  beforeEach(() => {
    useAppStore.setState({
      screen: "trains",
      selectedStationId: "geologicheskaya",
      selectedDirectionId: "to-botanicheskaya",
      selectedDestinationId: "botanicheskaya",
      isDirectionModalOpen: false,
      isDestinationSheetOpen: false,
      activeToast: null,
    });
  });

  it("shows the first-last card on the trains page and opens the full schedule", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText("Первый и последний поезд")).toBeInTheDocument();
    expect(screen.getByText("06:02")).toBeInTheDocument();
    expect(screen.getByText("00:15")).toBeInTheDocument();
    expect(screen.getByText("после полуночи")).toBeInTheDocument();

    await user.click(screen.getByText("Первый и последний поезд"));

    expect(screen.getByRole("heading", { name: "Расписание" })).toBeInTheDocument();
    expect(screen.getByText("Геологическая")).toBeInTheDocument();
    expect(screen.getByText("В сторону Ботанической")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Сегодня" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByText("Ближайший")).toBeInTheDocument();
    expect(screen.getByText("После полуночи")).toBeInTheDocument();
    expect(screen.queryByText("24:01")).not.toBeInTheDocument();
    expect(screen.queryByText("24:15")).not.toBeInTheDocument();
  });

  it("returns back to trains without resetting the route context", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText("Первый и последний поезд"));
    await user.click(screen.getByRole("button", { name: /Назад/i }));

    expect(screen.getByText("Следующий поезд")).toBeInTheDocument();
    expect(screen.getAllByText("Геологическая").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ботаническая").length).toBeGreaterThan(0);
    expect(useAppStore.getState().selectedDestinationId).toBe("botanicheskaya");
    expect(useAppStore.getState().selectedDirectionId).toBe("to-botanicheskaya");
  });

  it("switches between today, weekday and weekend schedule modes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText("Первый и последний поезд"));

    await user.click(screen.getByRole("radio", { name: "Будни" }));
    expect(screen.getByText("Типовое расписание рабочего дня")).toBeInTheDocument();
    expect(screen.queryByText("Ближайший")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Выходные" }));
    expect(screen.getByText("Типовое расписание выходного дня")).toBeInTheDocument();
    expect(screen.getAllByText("06:02").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("radio", { name: "Сегодня" }));
    expect(screen.getByText("Будний день")).toBeInTheDocument();
    expect(screen.getByText("Ближайший")).toBeInTheDocument();
  });

  it("scrolls the nearest train group below the sticky header", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText("Первый и последний поезд"));

    const nearestTrainGroup = screen.getByText("Ближайший").closest("section");
    expect(nearestTrainGroup).not.toBeNull();

    const stickyHeader = screen
      .getByRole("heading", { name: "Расписание" })
      .closest("div.sticky");
    expect(stickyHeader).not.toBeNull();

    vi.mocked(window.scrollTo).mockClear();
    vi.spyOn(nearestTrainGroup!, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 420,
      width: 320,
      height: 96,
      top: 420,
      right: 320,
      bottom: 516,
      left: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(stickyHeader!, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 320,
      height: 240,
      top: 0,
      right: 320,
      bottom: 240,
      left: 0,
      toJSON: () => ({}),
    });

    await user.click(screen.getByRole("button", { name: "К ближайшему" }));

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 164,
      behavior: "smooth",
    });
  });
});
