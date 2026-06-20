import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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
    hours: 23,
    minutes: 58,
    seconds: 0,
    totalSeconds: 23 * 3600 + 58 * 60,
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
      scheduleTime: "24:05",
      displayTime: "00:05",
      totalSeconds: 24 * 3600 + 5 * 60,
      secondsLeft: 7 * 60,
      status: "waiting",
      isLastTrain: true,
      originalIndex: 9,
    },
    next: [],
    firstTrain: null,
    lastTrain: null,
    secondsUntilFirstTrain: null,
    ...overrides,
  };
}

describe("TrainsPage last train states", () => {
  beforeEach(() => {
    useAppStore.setState({
      screen: "trains",
      selectedStationId: "geologicheskaya",
      selectedDirectionId: "to-botanicheskaya",
      selectedDestinationId: null,
      isDirectionModalOpen: false,
      isDestinationSheetOpen: false,
      activeToast: null,
    });

    resolveMetroStateMock.mockReset();
  });

  it("shows the last-train explanation for the nearest train", () => {
    resolveMetroStateMock.mockReturnValue(createMetroState());

    render(<TrainsPage />);

    expect(screen.getByText("Последний поезд")).toBeInTheDocument();
    expect(
      screen.getByText("После него поездов по этому направлению сегодня больше не будет"),
    ).toBeInTheDocument();
  });

  it("marks the last upcoming train in the secondary list", () => {
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

    expect(screen.getByText("последний")).toBeInTheDocument();
  });
});
