import { create } from "zustand";

import type { AppScreen, ToastMessage, ToastType } from "./app.types";
import type { StationId, DirectionId } from "../domain/metro/metro.types";

interface AppState {
  screen: AppScreen;
  showSeconds: boolean;
  selectedStationId: StationId | null;
  selectedDirectionId: DirectionId | null;
  selectedDestinationId: StationId | null;
  arrivalPlanDraftDate: string | null;
  arrivalPlanDraftTime: string | null;
  arrivalPlanSubmittedDate: string | null;
  arrivalPlanSubmittedTime: string | null;
  scheduleContextDate: string | null;
  scheduleHighlightedTrainTime: string | null;
  scheduleHighlightLabel: string | null;
  scheduleReturnScreen: "trains" | "arrival-plan" | null;
  isDirectionModalOpen: boolean;
  isDestinationSheetOpen: boolean;
  activeToast: ToastMessage | null;

  setScreen: (screen: AppScreen) => void;
  setShowSeconds: (showSeconds: boolean) => void;
  selectStation: (stationId: StationId) => void;
  selectDirection: (directionId: DirectionId) => void;
  selectDestination: (stationId: StationId) => void;
  clearDestination: () => void;
  setArrivalPlanDraft: (payload: { date: string; time: string }) => void;
  submitArrivalPlan: (payload: { date: string; time: string }) => void;
  clearArrivalPlanResult: () => void;
  setScheduleContext: (payload: {
    date: string | null;
    highlightedTrainTime?: string | null;
    highlightLabel?: string | null;
    returnScreen?: "trains" | "arrival-plan" | null;
  }) => void;
  clearScheduleContext: () => void;
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
  arrivalPlanDraftDate: null,
  arrivalPlanDraftTime: null,
  arrivalPlanSubmittedDate: null,
  arrivalPlanSubmittedTime: null,
  scheduleContextDate: null,
  scheduleHighlightedTrainTime: null,
  scheduleHighlightLabel: null,
  scheduleReturnScreen: null,
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
      arrivalPlanSubmittedDate: null,
      arrivalPlanSubmittedTime: null,
      scheduleContextDate: null,
      scheduleHighlightedTrainTime: null,
      scheduleHighlightLabel: null,
      scheduleReturnScreen: null,
      isDestinationSheetOpen: false,
    });
  },

  selectDirection: (directionId) => {
    set({
      selectedDirectionId: directionId,
      selectedDestinationId: null,
      arrivalPlanSubmittedDate: null,
      arrivalPlanSubmittedTime: null,
      scheduleContextDate: null,
      scheduleHighlightedTrainTime: null,
      scheduleHighlightLabel: null,
      scheduleReturnScreen: null,
      isDirectionModalOpen: false,
      isDestinationSheetOpen: false,
    });
  },

  selectDestination: (stationId) =>
    set({
      selectedDestinationId: stationId,
      arrivalPlanSubmittedDate: null,
      arrivalPlanSubmittedTime: null,
      scheduleContextDate: null,
      scheduleHighlightedTrainTime: null,
      scheduleHighlightLabel: null,
      scheduleReturnScreen: null,
      isDestinationSheetOpen: false,
    }),

  clearDestination: () =>
    set({
      selectedDestinationId: null,
      arrivalPlanSubmittedDate: null,
      arrivalPlanSubmittedTime: null,
      scheduleContextDate: null,
      scheduleHighlightedTrainTime: null,
      scheduleHighlightLabel: null,
      scheduleReturnScreen: null,
      isDestinationSheetOpen: false,
    }),

  setArrivalPlanDraft: ({ date, time }) =>
    set({
      arrivalPlanDraftDate: date,
      arrivalPlanDraftTime: time,
    }),

  submitArrivalPlan: ({ date, time }) =>
    set({
      arrivalPlanDraftDate: date,
      arrivalPlanDraftTime: time,
      arrivalPlanSubmittedDate: date,
      arrivalPlanSubmittedTime: time,
    }),

  clearArrivalPlanResult: () =>
    set({
      arrivalPlanSubmittedDate: null,
      arrivalPlanSubmittedTime: null,
      scheduleContextDate: null,
      scheduleHighlightedTrainTime: null,
      scheduleHighlightLabel: null,
      scheduleReturnScreen: null,
    }),

  setScheduleContext: ({
    date,
    highlightedTrainTime = null,
    highlightLabel = null,
    returnScreen = null,
  }) =>
    set({
      scheduleContextDate: date,
      scheduleHighlightedTrainTime: highlightedTrainTime,
      scheduleHighlightLabel: highlightLabel,
      scheduleReturnScreen: returnScreen,
    }),

  clearScheduleContext: () =>
    set({
      scheduleContextDate: null,
      scheduleHighlightedTrainTime: null,
      scheduleHighlightLabel: null,
      scheduleReturnScreen: null,
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
      arrivalPlanDraftDate: null,
      arrivalPlanDraftTime: null,
      arrivalPlanSubmittedDate: null,
      arrivalPlanSubmittedTime: null,
      scheduleContextDate: null,
      scheduleHighlightedTrainTime: null,
      scheduleHighlightLabel: null,
      scheduleReturnScreen: null,
      isDirectionModalOpen: false,
      isDestinationSheetOpen: false,
    });
  },
}));
