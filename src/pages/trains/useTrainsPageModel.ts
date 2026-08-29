import { useEffect, useMemo, useRef } from "react";

import { useLiveMetroTime } from "../../app/hooks/useLiveMetroTime";
import { useAppStore } from "../../app/store";
import { usePwa } from "../../app/usePwa";
import {
  buildArrivalPlanRequest,
  buildTravelEstimate,
  getDestinationOptions,
  getDirectionById,
  getNextStation,
  getStationById,
  planArrivalByTime,
} from "../../domain/metro";
import {
  resolveDaySchedule,
  resolveMetroState,
} from "../../domain/metro/schedule.service";
import type { Direction, Station } from "../../domain/metro/metro.types";
import { metroTimeToTimestamp } from "../../domain/time";
import { compareDirectionLayoutOrder } from "./trainsPage.utils";

export type DirectionOption = Pick<Direction, "id" | "name" | "shortName">;

export function useTrainsPageModel() {
  const store = useAppStore();
  const pwa = usePwa();
  const metroTime = useLiveMetroTime();
  const destinationTriggerRef = useRef<HTMLButtonElement>(null);

  const station = store.selectedStationId
    ? (getStationById(store.selectedStationId) ?? null)
    : null;
  const direction = store.selectedDirectionId
    ? (getDirectionById(store.selectedDirectionId) ?? null)
    : null;
  const nextStation =
    store.selectedStationId && store.selectedDirectionId
      ? (getNextStation(store.selectedStationId, store.selectedDirectionId) ?? null)
      : null;
  const metroState =
    store.selectedStationId && store.selectedDirectionId
      ? resolveMetroState(store.selectedStationId, store.selectedDirectionId, metroTime)
      : null;
  const daySchedule =
    store.selectedStationId && store.selectedDirectionId
      ? resolveDaySchedule(
          store.selectedStationId,
          store.selectedDirectionId,
          metroTime,
          "today",
        )
      : null;
  const destinationOptions = useMemo(() => {
    if (!store.selectedStationId || !store.selectedDirectionId) {
      return [];
    }

    return getDestinationOptions(store.selectedStationId, store.selectedDirectionId);
  }, [store.selectedDirectionId, store.selectedStationId]);
  const selectedDestination = store.selectedDestinationId
    ? (getStationById(store.selectedDestinationId) ?? null)
    : null;
  const directions = useMemo<DirectionOption[]>(() => {
    if (!station) {
      return [];
    }

    return [...station.availableDirections]
      .sort(compareDirectionLayoutOrder)
      .map((directionId) => getDirectionById(directionId))
      .filter((item): item is Direction => item !== undefined);
  }, [station]);
  const isDestinationValid = destinationOptions.some(
    (option) => option.station.id === store.selectedDestinationId,
  );
  const travelEstimate =
    store.selectedStationId &&
    store.selectedDirectionId &&
    store.selectedDestinationId &&
    isDestinationValid &&
    metroState
      ? buildTravelEstimate(
          store.selectedStationId,
          store.selectedDestinationId,
          store.selectedDirectionId,
          metroState,
          metroTime,
        )
      : null;
  const plannedArrivalResult =
    store.selectedStationId &&
    store.selectedDirectionId &&
    store.selectedDestinationId &&
    store.arrivalPlanSubmittedDate &&
    store.arrivalPlanSubmittedTime
      ? planArrivalByTime(
          buildArrivalPlanRequest({
            originStationId: store.selectedStationId,
            destinationStationId: store.selectedDestinationId,
            directionId: store.selectedDirectionId,
            desiredDateString: store.arrivalPlanSubmittedDate,
            desiredTimeString: store.arrivalPlanSubmittedTime,
            nowTimestamp: metroTimeToTimestamp(metroTime),
          }),
        )
      : null;

  useEffect(() => {
    if (store.selectedDestinationId && !isDestinationValid) {
      store.clearDestination();
    }
  }, [isDestinationValid, store]);

  const restoreDestinationFocus = () => {
    window.requestAnimationFrame(() => {
      destinationTriggerRef.current?.focus();
    });
  };

  return {
    ...store,
    ...pwa,
    metroTime,
    station,
    direction,
    nextStation,
    metroState,
    daySchedule,
    directions,
    destinationOptions,
    selectedDestination,
    isDestinationValid,
    travelEstimate,
    plannedArrivalResult,
    destinationTriggerRef,
    hasRouteSelection: Boolean(store.selectedStationId && store.selectedDirectionId),
    closeDestinationSheetAndRestoreFocus: () => {
      store.closeDestinationSheet();
      restoreDestinationFocus();
    },
    selectDestinationAndRestoreFocus: (stationId: Station["id"]) => {
      store.selectDestination(stationId);
      store.showToast("Маршрут обновлён", "success");
      restoreDestinationFocus();
    },
  };
}
