import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { useAppStore } from "./store";

vi.mock("./hooks/useLiveMetroTime", () => ({
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

describe("App", () => {
  beforeEach(() => {
    useAppStore.setState({
      screen: "stations",
      selectedStationId: null,
      selectedDirectionId: null,
      selectedDestinationId: null,
      isDirectionModalOpen: false,
      isDestinationSheetOpen: false,
      activeToast: null,
    });
  });

  it("отображает экран выбора станции", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Выберите станцию",
      }),
    ).toBeInTheDocument();
  });

  it("navigates between main screens via bottom navigation", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Go to Settings
    await user.click(screen.getByText("Настройки"));
    expect(await screen.findByText("Показывать секунды")).toBeInTheDocument();

    // Go to About
    await user.click(screen.getByText("О приложении", { selector: "button *" }));
    expect(await screen.findByText("Метро Екатеринбурга")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Настройки" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    // Go to Stations
    await user.click(screen.getByText("Станции"));
    expect(await screen.findByText("Выберите станцию")).toBeInTheDocument();
  });

  it("completes full E2E selection flow", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Select station 'Geologicheskaya'
    await user.click(screen.getByText("Геологическая"));

    // Select direction 'Botanicheskaya'
    const botanicalBtn = await screen.findByRole("button", {
      name: "В сторону Ботанической",
    });
    await user.click(botanicalBtn);

    // Verify Trains screen
    expect(await screen.findByText("Следующий поезд")).toBeInTheDocument();
    expect(screen.getByText("Геологическая")).toBeInTheDocument();
    expect(screen.getByText("Чкаловская")).toBeInTheDocument();

    // Change direction on Trains screen
    await user.click(screen.getByText("К Пр. Космонавтов"));

    // Validate next station changed to Ploshchad 1905 goda
    expect(await screen.findByText("Площадь 1905 года")).toBeInTheDocument();

    // Change station
    await user.click(screen.getByText("Изменить"));
    expect(screen.getByText("Выберите станцию")).toBeInTheDocument();

    // Pick Terminus
    await user.click(screen.getByText("Ботаническая"));

    // Ensure direction skipped straight to Trains
    expect(await screen.findByText("Следующий поезд")).toBeInTheDocument();
    expect(screen.getByText("Чкаловская")).toBeInTheDocument();
    expect(screen.queryByText("В сторону Проспекта Космонавтов")).toBeInTheDocument();
  });

  it("selects destination and resets it after changing direction", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText("Геологическая"));
    await user.click(
      await screen.findByRole("button", { name: "В сторону Ботанической" }),
    );

    await user.click(await screen.findByRole("button", { name: /Выбрать станцию/i }));
    await user.click(await screen.findByRole("button", { name: /Ботаническая/i }));

    expect((await screen.findAllByText("2 станции")).length).toBeGreaterThan(0);

    await user.click(screen.getByText("К Пр. Космонавтов"));

    expect(screen.getByRole("button", { name: /Выбрать станцию/i })).toBeInTheDocument();
  });
});
