import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useAppStore } from "../app/store";
import { StationsPage } from "./StationsPage";

describe("StationsPage component", () => {
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

  it("renders all 9 stations in the correct order", () => {
    render(<StationsPage />);

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(9);
    expect(listItems[0]).toHaveTextContent("Проспект Космонавтов");
    expect(listItems[8]).toHaveTextContent("Ботаническая");
  });

  it("opens DirectionModal when an intermediate station is clicked", async () => {
    const user = userEvent.setup();
    render(<StationsPage />);

    const geolochicheskaya = screen.getByText("Геологическая");
    await user.click(geolochicheskaya);

    const sheetTitle = await screen.findByText("Выберите направление");
    expect(sheetTitle).toBeInTheDocument();

    const buttons = screen.getAllByRole("button", { name: /Направление/i });
    expect(buttons.length).toBe(2);
  });

  it("handles direction selection correctly inside Modal", async () => {
    const user = userEvent.setup();
    render(<StationsPage />);

    // Select intermediate station
    await user.click(screen.getByText("Уральская"));

    // Wait for the modal
    const directions = await screen.findAllByRole("button", { name: /Направление/i });

    // Click on the direction pointing towards Botanicheskaya
    const towardsBotanicheskaya = directions.find((btn) =>
      btn.textContent?.includes("Ботанической"),
    );
    expect(towardsBotanicheskaya).toBeDefined();

    await user.click(towardsBotanicheskaya as HTMLElement);

    // Verify store
    const state = useAppStore.getState();
    expect(state.selectedDirectionId).toBe("to-botanicheskaya");
    expect(state.screen).toBe("trains");
  });

  it("handles terminus station Selection automatically without Modal", async () => {
    const user = userEvent.setup();
    render(<StationsPage />);

    const kosmonavtov = screen.getByText("Проспект Космонавтов");
    await user.click(kosmonavtov);

    // Modal shouldn't show up
    expect(screen.queryByText("Выберите направление")).not.toBeInTheDocument();

    const state = useAppStore.getState();
    expect(state.selectedStationId).toBe("prospekt-kosmonavtov");
    expect(state.selectedDirectionId).toBe("to-botanicheskaya"); // automatically to Bota
    expect(state.screen).toBe("trains");
  });

  it("shows active station highlighted", () => {
    useAppStore.setState({ selectedStationId: "dinamo" });
    render(<StationsPage />);

    const listItems = screen.getAllByRole("listitem");
    const dinamoItem = listItems.find((item) => item.textContent?.includes("Динамо"));

    expect(dinamoItem).toHaveAttribute("aria-current", "true");
  });
});
