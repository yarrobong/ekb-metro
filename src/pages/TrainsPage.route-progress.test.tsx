import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppStore } from "../app/store";
import { TrainsPage } from "./TrainsPage";

let mockMetroTime = {
  dateString: "2024-01-05",
  dayOfWeek: 5,
  isWeekend: false,
  hours: 18,
  minutes: 24,
  seconds: 0,
  totalSeconds: 18 * 3600 + 24 * 60,
};

vi.mock("../app/hooks/useLiveMetroTime", () => ({
  useLiveMetroTime: () => mockMetroTime,
}));

vi.mock("../app/usePwa", () => ({
  usePwa: () => ({
    installMethod: "manual",
    shouldShowInstallPrompt: false,
    dismissInstallPrompt: vi.fn(),
    openInstallPrompt: vi.fn(),
  }),
}));

describe("TrainsPage route progress", () => {
  beforeEach(() => {
    mockMetroTime = {
      dateString: "2024-01-05",
      dayOfWeek: 5,
      isWeekend: false,
      hours: 18,
      minutes: 24,
      seconds: 0,
      totalSeconds: 18 * 3600 + 24 * 60,
    };

    useAppStore.setState({
      screen: "trains",
      showSeconds: true,
      selectedStationId: null,
      selectedDirectionId: null,
      selectedDestinationId: null,
      isDirectionModalOpen: false,
      isDestinationSheetOpen: false,
      activeToast: null,
    });
  });

  it("renders the vertical route progress only after destination selection", () => {
    useAppStore.setState({
      selectedStationId: "geologicheskaya",
      selectedDirectionId: "to-botanicheskaya",
      selectedDestinationId: "botanicheskaya",
    });

    render(<TrainsPage />);

    expect(screen.getAllByText("Станция назначения")).toHaveLength(1);
    expect(screen.getAllByText("Ботаническая").length).toBeGreaterThan(0);
    expect(screen.getByText("2 станции")).toBeInTheDocument();
    expect(screen.getByText("Примерно 6 минут в пути")).toBeInTheDocument();
    expect(screen.getByText("Сейчас")).toBeInTheDocument();
    expect(screen.getByText("По пути")).toBeInTheDocument();
    expect(screen.getByText("Назначение")).toBeInTheDocument();
  });

  it("updates the route when destination changes", () => {
    useAppStore.setState({
      selectedStationId: "geologicheskaya",
      selectedDirectionId: "to-botanicheskaya",
      selectedDestinationId: "chkalovskaya",
    });

    render(<TrainsPage />);

    expect(screen.getAllByText("Чкаловская").length).toBeGreaterThan(0);
    expect(screen.getByText("1 станция")).toBeInTheDocument();
    expect(screen.getByText("Примерно 3 минуты в пути")).toBeInTheDocument();

    act(() => {
      useAppStore.getState().selectDestination("botanicheskaya");
    });

    expect(screen.getAllByText("Ботаническая").length).toBeGreaterThan(0);
    expect(screen.getByText("2 станции")).toBeInTheDocument();
    expect(screen.getByText("Примерно 6 минут в пути")).toBeInTheDocument();
  });

  it("resets the route after direction change", () => {
    useAppStore.setState({
      selectedStationId: "geologicheskaya",
      selectedDirectionId: "to-botanicheskaya",
      selectedDestinationId: "botanicheskaya",
    });

    render(<TrainsPage />);

    expect(screen.getAllByText("Станция назначения")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /К Пр. Космонавтов/i }));

    expect(screen.queryByText("Станция назначения")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Выбрать станцию/i })).toBeInTheDocument();
  });
});
