import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { useAppStore } from "../app/store";
import * as scheduleService from "../domain/metro/schedule.service";
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

describe("TrainsPage component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

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

  it("shows empty state when no station is selected", () => {
    render(<TrainsPage />);

    expect(screen.getByText("Станция не выбрана")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Выбрать станцию" })).toBeInTheDocument();
  }, 15000);

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
    expect(
      screen.getByText(
        "Маршрут от Геологической до Ботанической, две станции, примерно шесть минут.",
      ),
    ).toHaveClass("sr-only");
    expect(screen.getByText("Сейчас")).toBeInTheDocument();
    expect(screen.getByText("По пути")).toBeInTheDocument();
    expect(screen.getByText("Назначение")).toBeInTheDocument();
    expect(screen.getByText("Ориентировочное прибытие")).toBeInTheDocument();
  });

  it("shows the pre-opening state with the first train details", () => {
    mockMetroTime = {
      dateString: "2024-01-06",
      dayOfWeek: 6,
      isWeekend: true,
      hours: 0,
      minutes: 20,
      seconds: 0,
      totalSeconds: 20 * 60,
    };

    useAppStore.setState({
      selectedStationId: "prospekt-kosmonavtov",
      selectedDirectionId: "to-botanicheskaya",
    });

    render(<TrainsPage />);

    expect(screen.getByText("Метро пока закрыто")).toBeInTheDocument();
    expect(screen.getByText("До первого поезда")).toBeInTheDocument();
    expect(screen.getByText("Первый поезд сегодня")).toBeInTheDocument();
    expect(screen.getAllByText("05:49").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/В сторону Ботанической/i).length).toBeGreaterThan(0);
    expect(screen.queryByText("Поезда не найдены")).not.toBeInTheDocument();
  });

  it("shows the closed state without rendering the next trains list", () => {
    mockMetroTime = {
      dateString: "2024-01-03",
      dayOfWeek: 3,
      isWeekend: false,
      hours: 23,
      minutes: 50,
      seconds: 0,
      totalSeconds: 23 * 3600 + 50 * 60,
    };

    const resolveMetroStateMock = vi.spyOn(scheduleService, "resolveMetroState").mockReturnValue({
      status: "after_close",
      dayType: "weekday",
      operationalDate: "2024-01-04",
      isPreviousOperationalDay: false,
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
      lastTrain: null,
      secondsUntilFirstTrain: 6 * 3600 + 20 * 60,
    });

    useAppStore.setState({
      selectedStationId: "prospekt-kosmonavtov",
      selectedDirectionId: "to-botanicheskaya",
    });

    render(<TrainsPage />);

    expect(screen.getByText("Метро закрыто")).toBeInTheDocument();
    expect(screen.getByText("Поездов по этому направлению больше нет")).toBeInTheDocument();
    expect(screen.getByText("До первого поезда следующего дня")).toBeInTheDocument();
    expect(screen.getByText("Первый поезд следующего операционного дня")).toBeInTheDocument();
    expect(screen.getByText("завтра")).toBeInTheDocument();
    expect(screen.queryByText("Следующие поезда")).not.toBeInTheDocument();
    expect(screen.queryByText("Поезда не найдены")).not.toBeInTheDocument();

    resolveMetroStateMock.mockRestore();
  });

  it("shows countdown text without seconds in closed states", () => {
    mockMetroTime = {
      dateString: "2024-01-03",
      dayOfWeek: 3,
      isWeekend: false,
      hours: 5,
      minutes: 48,
      seconds: 29,
      totalSeconds: 5 * 3600 + 48 * 60 + 29,
    };

    useAppStore.setState({
      showSeconds: false,
      selectedStationId: "prospekt-kosmonavtov",
      selectedDirectionId: "to-botanicheskaya",
    });

    render(<TrainsPage />);

    expect(screen.getAllByText("1 минута").length).toBeGreaterThan(0);
  });

  it("updates the route when destination changes", () => {
    useAppStore.setState({
      selectedStationId: "geologicheskaya",
      selectedDirectionId: "to-botanicheskaya",
      selectedDestinationId: "chkalovskaya",
    });

    render(<TrainsPage />);

    expect(screen.getByText("1 станция")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Маршрут от Геологической до Чкаловской, одна станция, примерно три минуты.",
      ),
    ).toBeInTheDocument();

    act(() => {
      useAppStore.getState().selectDestination("botanicheskaya");
    });

    expect(screen.getByText("2 станции")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Маршрут от Геологической до Ботанической, две станции, примерно шесть минут.",
      ),
    ).toBeInTheDocument();
  });

  it("shows route stations in reverse direction order", () => {
    useAppStore.setState({
      selectedStationId: "botanicheskaya",
      selectedDirectionId: "to-prospekt-kosmonavtov",
      selectedDestinationId: "uralskaya",
    });

    render(<TrainsPage />);

    expect(
      screen.getByText(
        "Маршрут от Ботанической до Уральской, пять станций, примерно двенадцать минут.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Ботаническая").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Чкаловская").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Геологическая").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Площадь 1905 года").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Динамо").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Уральская").length).toBeGreaterThan(0);
  });

  it("resets the route after direction change", () => {
    useAppStore.setState({
      selectedStationId: "geologicheskaya",
      selectedDirectionId: "to-botanicheskaya",
      selectedDestinationId: "botanicheskaya",
    });

    render(<TrainsPage />);

    expect(screen.getByText("Станция назначения")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /К Пр. Космонавтов/i }));

    expect(screen.queryByText("Станция назначения")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Выбрать станцию/i })).toBeInTheDocument();
  });

  it("shows last-train messaging without hiding the approaching state", () => {
    mockMetroTime = {
      dateString: "2024-01-06",
      dayOfWeek: 6,
      isWeekend: true,
      hours: 0,
      minutes: 14,
      seconds: 40,
      totalSeconds: 14 * 60 + 40,
    };

    useAppStore.setState({
      selectedStationId: "geologicheskaya",
      selectedDirectionId: "to-botanicheskaya",
    });

    render(<TrainsPage />);

    expect(screen.getByText("Ночной поезд предыдущего дня")).toBeInTheDocument();
    expect(screen.getByText("Поезд приближается")).toBeInTheDocument();
    expect(screen.getByText("Последний поезд")).toBeInTheDocument();
    expect(screen.getByText("Точное время: 00:15")).toBeInTheDocument();
  });

  it("shows last-train messaging while the train is arriving", () => {
    mockMetroTime = {
      dateString: "2024-01-06",
      dayOfWeek: 6,
      isWeekend: true,
      hours: 0,
      minutes: 15,
      seconds: 5,
      totalSeconds: 15 * 60 + 5,
    };

    useAppStore.setState({
      selectedStationId: "geologicheskaya",
      selectedDirectionId: "to-botanicheskaya",
    });

    render(<TrainsPage />);

    expect(screen.getByText("Поезд прибывает")).toBeInTheDocument();
    expect(screen.getByText("По расписанию")).toBeInTheDocument();
    expect(screen.getByText("Точное время: 00:15")).toBeInTheDocument();
    expect(screen.getByText("Последний поезд")).toBeInTheDocument();
  });

  it("shows a compact last-train badge in the next trains list", () => {
    mockMetroTime = {
      dateString: "2024-01-05",
      dayOfWeek: 5,
      isWeekend: false,
      hours: 23,
      minutes: 50,
      seconds: 0,
      totalSeconds: 23 * 3600 + 50 * 60,
    };

    useAppStore.setState({
      selectedStationId: "geologicheskaya",
      selectedDirectionId: "to-botanicheskaya",
    });

    render(<TrainsPage />);

    expect(screen.getByText("Следующие поезда")).toBeInTheDocument();
    expect(screen.getByText("Прибытие в 00:01")).toBeInTheDocument();
    expect(screen.getByText("00:15")).toBeInTheDocument();
    expect(screen.getByText("последний")).toBeInTheDocument();
  });

  it("does not show a false last-train badge for a regular train", () => {
    useAppStore.setState({
      selectedStationId: "geologicheskaya",
      selectedDirectionId: "to-botanicheskaya",
    });

    render(<TrainsPage />);

    expect(screen.queryByText("Последний поезд")).not.toBeInTheDocument();
    expect(screen.queryByText("Последний")).not.toBeInTheDocument();
  });
});
