import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { useAppStore } from "../app/store";
import { TrainsPage } from "./TrainsPage";

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

describe("TrainsPage component", () => {
  beforeEach(() => {
    useAppStore.setState({
      screen: "trains",
      selectedStationId: null,
      selectedDirectionId: null,
      selectedDestinationId: null,
      isDirectionModalOpen: false,
      isDestinationSheetOpen: false,
      activeToast: null,
    });
  });

  it("shows empty state when no station is selected", () => {
    render(<TrainsPage />);

    expect(screen.getByText("Станция не выбрана")).toBeInTheDocument();

    // Check navigation to stations
    const btn = screen.getByRole("button", { name: "Выбрать станцию" });
    fireEvent.click(btn);
    expect(useAppStore.getState().screen).toBe("stations");
  });

  it("shows station details perfectly for intermediate station", () => {
    useAppStore.setState({
      selectedStationId: "uralskaya",
      selectedDirectionId: "to-botanicheskaya",
    });

    render(<TrainsPage />);

    expect(screen.getByText("Уральская")).toBeInTheDocument();

    // Next station for Uralsakaya -> Botanicheskaya should be Dinamo
    expect(screen.getByText("Динамо")).toBeInTheDocument();

    // Change direction
    const btn = screen.getByRole("button", { name: /К Пр. Космонавтов/i });
    fireEvent.click(btn);

    expect(useAppStore.getState().selectedDirectionId).toBe("to-prospekt-kosmonavtov");
  });

  it("handles terminus properly", () => {
    useAppStore.setState({
      selectedStationId: "botanicheskaya",
      selectedDirectionId: "to-prospekt-kosmonavtov",
    });

    render(<TrainsPage />);

    expect(screen.getByText("Ботаническая")).toBeInTheDocument();
    // Only one direction, verify it shows the direction text.
    expect(screen.getByText(/В сторону Проспекта Космонавтов/i)).toBeInTheDocument();
  });

  it("lets the user pick a destination and shows the trip estimate", () => {
    useAppStore.setState({
      selectedStationId: "geologicheskaya",
      selectedDirectionId: "to-botanicheskaya",
    });

    render(<TrainsPage />);

    fireEvent.click(screen.getByRole("button", { name: /Выбрать станцию/i }));

    expect(screen.getByText("Выберите станцию назначения")).toBeInTheDocument();
    expect(screen.getAllByText("Чкаловская").length).toBeGreaterThan(0);
    expect(screen.getByText("Ботаническая")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Ботаническая/i }));

    expect(screen.getByText("Станция назначения")).toBeInTheDocument();
    expect(screen.getAllByText("Ботаническая").length).toBeGreaterThan(0);
    expect(screen.getByText("2 станции")).toBeInTheDocument();
    expect(screen.getByText("Примерно 6 минут в пути")).toBeInTheDocument();
    expect(screen.getByText("Ориентировочное прибытие")).toBeInTheDocument();
  });
});
