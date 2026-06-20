import { beforeEach, describe, expect, it } from "vitest";

import { useAppStore } from "./store";

describe("app store route selection", () => {
  beforeEach(() => {
    useAppStore.setState({
      screen: "stations",
      showSeconds: true,
      selectedStationId: null,
      selectedDirectionId: null,
      selectedDestinationId: null,
      isDirectionModalOpen: false,
      isDestinationSheetOpen: false,
      activeToast: null,
    });
  });

  it("clears destination after current station change", () => {
    useAppStore.getState().selectStation("geologicheskaya");
    useAppStore.getState().selectDirection("to-botanicheskaya");
    useAppStore.getState().selectDestination("botanicheskaya");

    useAppStore.getState().selectStation("uralskaya");

    expect(useAppStore.getState().selectedStationId).toBe("uralskaya");
    expect(useAppStore.getState().selectedDirectionId).toBeNull();
    expect(useAppStore.getState().selectedDestinationId).toBeNull();
  });

  it("clears destination after direction change", () => {
    useAppStore.getState().selectStation("geologicheskaya");
    useAppStore.getState().selectDirection("to-botanicheskaya");
    useAppStore.getState().selectDestination("botanicheskaya");

    useAppStore.getState().selectDirection("to-prospekt-kosmonavtov");

    expect(useAppStore.getState().selectedDirectionId).toBe("to-prospekt-kosmonavtov");
    expect(useAppStore.getState().selectedDestinationId).toBeNull();
  });

  it("keeps destination until station or direction changes", () => {
    useAppStore.getState().selectStation("geologicheskaya");
    useAppStore.getState().selectDirection("to-botanicheskaya");
    useAppStore.getState().selectDestination("botanicheskaya");

    useAppStore.getState().showToast("Маршрут обновлён", "success");

    expect(useAppStore.getState().selectedDestinationId).toBe("botanicheskaya");
  });
});
