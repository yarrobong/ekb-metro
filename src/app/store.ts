import { create } from "zustand";

import type { AppScreen, ToastMessage, ToastType } from "./app.types";
import type { StationId, DirectionId } from "../domain/metro/metro.types";

interface AppState {
  screen: AppScreen;
  showSeconds: boolean;
  selectedStationId: StationId | null;
  selectedDirectionId: DirectionId | null;
  selectedDestinationId: StationId | null;
  isDirectionModalOpen: boolean;
  isDestinationSheetOpen: boolean;
  activeToast: ToastMessage | null;

  setScreen: (screen: AppScreen) => void;
  setShowSeconds: (showSeconds: boolean) => void;
  selectStation: (stationId: StationId) => void;
  selectDirection: (directionId: DirectionId) => void;
  selectDestination: (stationId: StationId) => void;
  clearDestination: () => void;
  openDirectionModal: () => void;
  closeDirectionModal: () => void;
  openDestinationSheet: () => void;
  closeDestinationSheet: () => void;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
  clearSelection: () => void;
}

const readShowSeconds = (): boolean => {
  try {
    const savedValue = window.localStorage.getItem("metro-show-seconds");

    if (savedValue === null) {
      return true;
    }

    return savedValue === "true";
  } catch {
    return true;
  }
};

export const useAppStore = create<AppState>((set) => ({
  screen: "stations",
  showSeconds: readShowSeconds(),
  selectedStationId: null,
  selectedDirectionId: null,
  selectedDestinationId: null,
  isDirectionModalOpen: false,
  isDestinationSheetOpen: false,
  activeToast: null,

  setScreen: (screen) => {
    set({ screen });
  },

  setShowSeconds: (showSeconds) => {
    try {
      window.localStorage.setItem("metro-show-seconds", String(showSeconds));
    } catch {
      // Приложение продолжает работать,
      // даже если LocalStorage недоступен.
    }

    set({ showSeconds });
  },

  selectStation: (stationId) => {
    set({
      selectedStationId: stationId,
      selectedDirectionId: null,
      selectedDestinationId: null,
      isDestinationSheetOpen: false,
    });
  },

  selectDirection: (directionId) => {
    set({
      selectedDirectionId: directionId,
      selectedDestinationId: null,
      isDirectionModalOpen: false,
      isDestinationSheetOpen: false,
    });
  },

  selectDestination: (stationId) =>
    set({
      selectedDestinationId: stationId,
      isDestinationSheetOpen: false,
    }),

  clearDestination: () =>
    set({
      selectedDestinationId: null,
      isDestinationSheetOpen: false,
    }),

  openDirectionModal: () => set({ isDirectionModalOpen: true }),
  closeDirectionModal: () => set({ isDirectionModalOpen: false }),
  openDestinationSheet: () => set({ isDestinationSheetOpen: true }),
  closeDestinationSheet: () => set({ isDestinationSheetOpen: false }),
  showToast: (message, type = "info") =>
    set((state) => {
      if (state.activeToast?.message === message && state.activeToast.type === type) {
        return state;
      }

      return {
        activeToast: {
          id: Date.now(),
          message,
          type,
        },
      };
    }),
  hideToast: () => set({ activeToast: null }),

  clearSelection: () => {
    set({
      selectedStationId: null,
      selectedDirectionId: null,
      selectedDestinationId: null,
      isDirectionModalOpen: false,
      isDestinationSheetOpen: false,
    });
  },
}));
