import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { useAppStore } from "../app/store";
import type { MetroServiceState } from "../domain/metro";
import { TrainsPage } from "./TrainsPage";

const { resolveMetroStateMock } = vi.hoisted(() => ({
  resolveMetroStateMock: vi.fn(),
}));

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

vi.mock("../domain/metro/schedule.service", () => {
  return {
    resolveMetroState: resolveMetroStateMock,
  };
});

function createMetroState(overrides: Partial<MetroServiceState> = {}): MetroServiceState {
  return {
    status: "running",
    dayType: "weekday",
    operationalDate: "2024-01-05",
    isPreviousOperationalDay: false,
    nearest: {
      scheduleTime: "18:27",
      displayTime: "18:27",
      totalSeconds: 18 * 3600 + 27 * 60,
      secondsLeft: 3 * 60,
      status: "waiting",
      isLastTrain: false,
      originalIndex: 2,
    },
    next: [],
    firstTrain: null,
    lastTrain: null,
    secondsUntilFirstTrain: null,
    ...overrides,
  };
}

describe("TrainsPage upcoming trains list", () => {
  beforeEach(() => {
    useAppStore.setState({
      screen: "trains",
      selectedStationId: "uralskaya",
      selectedDirectionId: "to-botanicheskaya",
      selectedDestinationId: null,
      isDirectionModalOpen: false,
      isDestinationSheetOpen: false,
      activeToast: null,
    });

    resolveMetroStateMock.mockReset();
  });

  it("renders exactly four rows and excludes the primary train", () => {
    resolveMetroStateMock.mockReturnValue(
      createMetroState({
        next: [
          {
            scheduleTime: "18:31",
            displayTime: "18:31",
            totalSeconds: 18 * 3600 + 31 * 60,
            secondsLeft: 7 * 60,
            status: "waiting",
            isLastTrain: false,
            originalIndex: 3,
          },
          {
            scheduleTime: "18:34",
            displayTime: "18:34",
            totalSeconds: 18 * 3600 + 34 * 60,
            secondsLeft: 10 * 60,
            status: "waiting",
            isLastTrain: false,
            originalIndex: 4,
          },
          {
            scheduleTime: "18:40",
            displayTime: "18:40",
            totalSeconds: 18 * 3600 + 40 * 60,
            secondsLeft: 16 * 60,
            status: "waiting",
            isLastTrain: false,
            originalIndex: 5,
          },
          {
            scheduleTime: "24:31",
            displayTime: "00:31",
            totalSeconds: 24 * 3600 + 31 * 60,
            secondsLeft: 6 * 3600 + 7 * 60,
            status: "waiting",
            isLastTrain: true,
            originalIndex: 6,
          },
        ],
      }),
    );

    render(<TrainsPage />);

    const section = screen.getByText("Следующие поезда").closest("div");
    expect(section).not.toBeNull();

    const rows = within(section!).getAllByRole("listitem");
    expect(rows).toHaveLength(4);
    expect(within(section!).queryByText(/^18:27$/)).not.toBeInTheDocument();
    expect(within(section!).getByText("00:31")).toBeInTheDocument();
    expect(within(section!).getByText("через 6 часов 7 минут")).toBeInTheDocument();
    expect(within(section!).getByText("последний")).toBeInTheDocument();
  });

  it("renders fewer rows when fewer future trains remain", () => {
    resolveMetroStateMock.mockReturnValue(
      createMetroState({
        nearest: {
          scheduleTime: "23:58",
          displayTime: "23:58",
          totalSeconds: 23 * 3600 + 58 * 60,
          secondsLeft: 0,
          status: "arriving",
          isLastTrain: false,
          originalIndex: 8,
        },
        next: [
          {
            scheduleTime: "24:05",
            displayTime: "00:05",
            totalSeconds: 24 * 3600 + 5 * 60,
            secondsLeft: 7 * 60,
            status: "waiting",
            isLastTrain: true,
            originalIndex: 9,
          },
        ],
      }),
    );

    render(<TrainsPage />);

    const section = screen.getByText("Следующие поезда").closest("div");
    expect(section).not.toBeNull();
    expect(within(section!).getAllByRole("listitem")).toHaveLength(1);
    expect(within(section!).getByText("через 7 минут")).toBeInTheDocument();
  });

  it("hides the upcoming list when the metro is closed", () => {
    resolveMetroStateMock.mockReturnValue(
      createMetroState({
        status: "after_close",
        nearest: null,
        next: [],
        firstTrain: {
          scheduleTime: "06:10",
          displayTime: "06:10",
          totalSeconds: 6 * 3600 + 10 * 60,
          secondsLeft: 6 * 3600 + 20 * 60,
          status: "waiting",
          isLastTrain: false,
          originalIndex: 0,
        },
        secondsUntilFirstTrain: 6 * 3600 + 20 * 60,
      }),
    );

    render(<TrainsPage />);

    expect(screen.queryByText("Следующие поезда")).not.toBeInTheDocument();
    expect(screen.getByText("Метро закрыто")).toBeInTheDocument();
  });
});
