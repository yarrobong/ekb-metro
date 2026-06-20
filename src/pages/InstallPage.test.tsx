import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { useAppStore } from "../app/store";
import { InstallPage } from "./InstallPage";

const { openInstallPrompt, copyAppLink } = vi.hoisted(() => ({
  openInstallPrompt: vi.fn(),
  copyAppLink: vi.fn().mockResolvedValue(true),
}));

vi.mock("../app/usePwa", () => ({
  usePwa: () => ({
    installMethod: "prompt",
    isStandalone: false,
    openInstallPrompt,
  }),
}));

vi.mock("../lib/userActions", () => ({
  copyAppLink,
}));

vi.mock("../lib/device", () => ({
  getDeviceInfo: () => ({
    kind: "iphone",
    browserName: "Safari",
    isInAppBrowser: false,
    isStandalone: false,
  }),
}));

describe("InstallPage", () => {
  beforeEach(() => {
    openInstallPrompt.mockClear();
    copyAppLink.mockClear();
    useAppStore.setState({
      screen: "install",
      showSeconds: true,
      selectedStationId: null,
      selectedDirectionId: null,
      selectedDestinationId: null,
      isDirectionModalOpen: false,
      isDestinationSheetOpen: false,
      activeToast: null,
    });
  });

  it("shows install button when system prompt is available", () => {
    render(<InstallPage />);

    fireEvent.click(screen.getByRole("button", { name: /Установить приложение/i }));
    expect(openInstallPrompt).toHaveBeenCalled();
  });

  it("copies link as fallback", () => {
    render(<InstallPage />);

    fireEvent.click(screen.getByRole("button", { name: /Скопировать ссылку/i }));

    expect(copyAppLink).toHaveBeenCalled();
  });
});
