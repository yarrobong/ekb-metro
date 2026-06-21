import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

describe("Arrival plan flow", () => {
  beforeEach(() => {
    useAppStore.setState({
      screen: "trains",
      selectedStationId: "geologicheskaya",
      selectedDirectionId: "to-botanicheskaya",
      selectedDestinationId: null,
      arrivalPlanDraftDate: null,
      arrivalPlanDraftTime: null,
      arrivalPlanSubmittedDate: null,
      arrivalPlanSubmittedTime: null,
      scheduleContextDate: null,
      scheduleHighlightedTrainTime: null,
      scheduleHighlightLabel: null,
      scheduleReturnScreen: null,
      isDirectionModalOpen: false,
      isDestinationSheetOpen: false,
      activeToast: null,
    });
  });

  it("shows the entry point only after selecting a destination", () => {
    const { rerender } = render(<App />);

    expect(screen.queryByText("Прибыть ко времени")).not.toBeInTheDocument();

    useAppStore.setState({ selectedDestinationId: "botanicheskaya" });
    rerender(<App />);

    expect(screen.getAllByText("Прибыть ко времени").length).toBeGreaterThan(0);
  });

  it("opens the planner screen with today selected by default", async () => {
    const user = userEvent.setup();
    useAppStore.setState({ selectedDestinationId: "botanicheskaya" });
    render(<App />);

    await user.click(screen.getByText("Прибыть ко времени"));

    expect(
      screen.getByRole("heading", { name: "Прибыть ко времени" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Геологическая/)).toBeInTheDocument();
    expect(screen.getByText(/Ботаническая/)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Сегодня" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("shows the custom date field after clicking another date", async () => {
    const user = userEvent.setup();
    useAppStore.setState({ selectedDestinationId: "botanicheskaya" });
    render(<App />);

    await user.click(screen.getByText("Прибыть ко времени"));
    await user.click(screen.getByRole("radio", { name: "Другая дата" }));

    expect(screen.getByText("Дата поездки")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2024-01-05")).toBeInTheDocument();
  });

  it("calculates and shows a successful arrival plan", async () => {
    const user = userEvent.setup();
    useAppStore.setState({ selectedDestinationId: "botanicheskaya" });
    render(<App />);

    await user.click(screen.getByText("Прибыть ко времени"));

    const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
    fireEvent.change(timeInput, { target: { value: "19:00" } });
    await user.click(screen.getByRole("button", { name: "Рассчитать поездку" }));

    expect(screen.getByText("Успеваете")).toBeInTheDocument();
    expect(screen.getByText("18:50")).toBeInTheDocument();
    expect(screen.getByText("Прибытие примерно в 18:56")).toBeInTheDocument();
    expect(screen.getByText("Запас: 4 минуты")).toBeInTheDocument();
    expect(screen.getByText("Более ранние варианты")).toBeInTheDocument();
  });

  it("opens the full schedule from the result and keeps the highlighted train context", async () => {
    const user = userEvent.setup();
    useAppStore.setState({ selectedDestinationId: "botanicheskaya" });
    render(<App />);

    await user.click(screen.getByText("Прибыть ко времени"));
    fireEvent.change(document.querySelector('input[type="time"]') as HTMLInputElement, {
      target: { value: "19:00" },
    });
    await user.click(screen.getByRole("button", { name: "Рассчитать поездку" }));
    await user.click(screen.getByRole("button", { name: "Открыть полное расписание" }));

    expect(screen.getByRole("heading", { name: "Расписание" })).toBeInTheDocument();
    expect(screen.getByText("Подходит для прибытия к 19:00")).toBeInTheDocument();
    expect(useAppStore.getState().scheduleReturnScreen).toBe("arrival-plan");
  });
});
