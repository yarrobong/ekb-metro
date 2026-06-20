import { describe, expect, it } from "vitest";

import type { MetroTime } from "../time";
import type { MetroServiceState } from "./schedule.service";
import {
  buildTravelEstimate,
  formatApproximateTravelTime,
  formatStationCount,
  getDestinationOptions,
  getTravelSummary,
} from "./travel.service";

const MOCK_TIME: MetroTime = {
  dateString: "2024-01-05",
  dayOfWeek: 5,
  isWeekend: false,
  hours: 18,
  minutes: 24,
  seconds: 0,
  totalSeconds: 18 * 3600 + 24 * 60,
};

describe("Travel Service", () => {
  it("returns destinations only in the selected direction order", () => {
    const options = getDestinationOptions("geologicheskaya", "to-prospekt-kosmonavtov");

    expect(options.map((option) => option.station.id)).toEqual([
      "ploshchad-1905-goda",
      "dinamo",
      "uralskaya",
      "mashinostroiteley",
      "uralmash",
      "prospekt-kosmonavtov",
    ]);
  });

  it("calculates travel time and station count", () => {
    const summary = getTravelSummary(
      "geologicheskaya",
      "botanicheskaya",
      "to-botanicheskaya",
    );

    expect(summary).toEqual({
      stationCount: 2,
      segmentCount: 2,
      travelSeconds: 360,
      includesApproximateSegments: true,
    });
  });

  it("rejects invalid destination against direction", () => {
    const summary = getTravelSummary(
      "geologicheskaya",
      "ploshchad-1905-goda",
      "to-botanicheskaya",
    );

    expect(summary).toBeNull();
  });

  it("builds an arrival estimate from the nearest train", () => {
    const metroState: MetroServiceState = {
      status: "running",
      dayType: "weekday",
      operationalDate: "2024-01-05",
      isPreviousOperationalDay: false,
      nearest: {
        scheduleTime: "18:27",
        displayTime: "18:27",
        totalSeconds: 18 * 3600 + 27 * 60,
        secondsLeft: 180,
        status: "waiting",
        isLast: false,
        originalIndex: 12,
      },
      next: [],
      firstTrain: null,
      lastTrain: null,
      secondsUntilFirstTrain: null,
    };

    const estimate = buildTravelEstimate(
      "geologicheskaya",
      "botanicheskaya",
      "to-botanicheskaya",
      metroState,
      MOCK_TIME,
    );

    expect(estimate?.boardingTimeLabel).toBe("18:27");
    expect(estimate?.arrivalTimeLabel).toBe("18:33");
    expect(estimate?.roundedTravelMinutes).toBe(6);
    expect(estimate?.roundedTotalMinutesUntilArrival).toBe(9);
  });

  it("marks tomorrow when arrival is after midnight", () => {
    const metroState: MetroServiceState = {
      status: "running",
      dayType: "weekday",
      operationalDate: "2024-01-05",
      isPreviousOperationalDay: false,
      nearest: {
        scheduleTime: "23:58",
        displayTime: "23:58",
        totalSeconds: 23 * 3600 + 58 * 60,
        secondsLeft: 60,
        status: "waiting",
        isLast: true,
        originalIndex: 99,
      },
      next: [],
      firstTrain: null,
      lastTrain: null,
      secondsUntilFirstTrain: null,
    };

    const currentTime: MetroTime = {
      ...MOCK_TIME,
      hours: 23,
      minutes: 57,
      totalSeconds: 23 * 3600 + 57 * 60,
    };

    const estimate = buildTravelEstimate(
      "uralskaya",
      "prospekt-kosmonavtov",
      "to-prospekt-kosmonavtov",
      metroState,
      currentTime,
    );

    expect(estimate?.arrivalTimeLabel).toBe("завтра в 00:05");
  });

  it("formats station and travel labels for the UI", () => {
    expect(formatStationCount(1)).toBe("1 станция");
    expect(formatStationCount(2)).toBe("2 станции");
    expect(formatStationCount(5)).toBe("5 станций");
    expect(formatApproximateTravelTime(130)).toBe("Примерно 3 минуты в пути");
  });
});
