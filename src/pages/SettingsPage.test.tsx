import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { useAppStore } from "../app/store";
import { SettingsPage } from "./SettingsPage";

vi.mock("../lib/userActions", () => ({
  reportIssue: vi.fn(),
  shareApp: vi.fn().mockResolvedValue("copied"),
}));

vi.mock("../app/usePwa", () => ({
  usePwa: () => ({
    checkForUpdates: vi.fn(),
    isCheckingForUpdates: false,
  }),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    useAppStore.setState({
      screen: "settings",
      showSeconds: true,
      selectedStationId: "geologicheskaya",
      selectedDirectionId: "to-botanicheskaya",
      selectedDestinationId: "botanicheskaya",
      isDirectionModalOpen: false,
      isDestinationSheetOpen: false,
      activeToast: null,
    });
  });

  it("toggles seconds and keeps the setting in store", () => {
    render(<SettingsPage />);

    const switchButton = screen.getByRole("switch", { name: "Показывать секунды" });
    fireEvent.click(switchButton);

    expect(useAppStore.getState().showSeconds).toBe(false);
    expect(useAppStore.getState().activeToast?.message).toBe("Настройка сохранена");
  });

  it("navigates to helper screens from settings", () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: /Как установить/i }));
    expect(useAppStore.getState().screen).toBe("install");

    useAppStore.setState({ screen: "settings" });
    fireEvent.click(screen.getByRole("button", { name: /О приложении/i }));
    expect(useAppStore.getState().screen).toBe("about");
  });
});
