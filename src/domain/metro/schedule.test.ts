import { describe, expect, it } from "vitest";

import type { MetroTime } from "../time";
import {
  getUpcomingTrains,
  resolveMetroState,
  resolveMetroStateFromSchedules,
} from "./schedule.service";

const MOCK_TIME: MetroTime = {
  dateString: "2024-01-01",
  dayOfWeek: 1,
  isWeekend: false,
  hours: 12,
  minutes: 0,
  seconds: 0,
  totalSeconds: 12 * 3600,
};

const MOCK_SCHEDULE = ["11:50", "11:58", "12:05", "12:10", "12:15", "12:20", "12:25"];

describe("Schedule Service", () => {
  it("finds next trains correctly", () => {
    const result = getUpcomingTrains(MOCK_SCHEDULE, MOCK_TIME);
    expect(result.status).toBe("ok");
    expect(result.nearest?.scheduleTime).toBe("12:05");
    expect(result.nearest?.status).toBe("waiting");
    expect(result.next.map((train) => train.scheduleTime)).toEqual([
      "12:10",
      "12:15",
      "12:20",
      "12:25",
    ]);
  });

  it("limits the secondary list to four trains after the nearest one", () => {
    const result = getUpcomingTrains(
      ["11:55", "12:05", "12:10", "12:15", "12:20", "12:25", "12:30"],
      MOCK_TIME,
    );

    expect(result.nearest?.scheduleTime).toBe("12:05");
    expect(result.next).toHaveLength(4);
    expect(result.next.map((train) => train.scheduleTime)).toEqual([
      "12:10",
      "12:15",
      "12:20",
      "12:25",
    ]);
  });

  it("returns fewer than four trains when fewer future trains remain", () => {
    const result = getUpcomingTrains(["11:55", "12:05", "12:10", "12:15"], MOCK_TIME);

    expect(result.nearest?.scheduleTime).toBe("12:05");
    expect(result.next.map((train) => train.scheduleTime)).toEqual(["12:10", "12:15"]);
  });

  it("handles empty schedule", () => {
    const result = getUpcomingTrains([], MOCK_TIME);
    expect(result.status).toBe("error");
  });

  it("handles approaching state (<= 30 seconds)", () => {
    const time: MetroTime = { ...MOCK_TIME, totalSeconds: 12 * 3600 + 4 * 60 + 40 };
    const result = getUpcomingTrains(MOCK_SCHEDULE, time);
    expect(result.nearest?.scheduleTime).toBe("12:05");
    expect(result.nearest?.status).toBe("approaching");
    expect(result.nearest?.secondsLeft).toBe(20);
  });

  it("handles arriving state (0 to 15 seconds after)", () => {
    const time: MetroTime = { ...MOCK_TIME, totalSeconds: 12 * 3600 + 5 * 60 + 5 };
    const result = getUpcomingTrains(MOCK_SCHEDULE, time);
    expect(result.nearest?.scheduleTime).toBe("12:05");
    expect(result.nearest?.status).toBe("arriving");
    expect(result.nearest?.secondsLeft).toBe(-5);
  });

  it("does not mark a regular nearest train as the last one", () => {
    const result = getUpcomingTrains(["12:05", "12:10"], MOCK_TIME);

    expect(result.nearest?.scheduleTime).toBe("12:05");
    expect(result.nearest?.isLastTrain).toBe(false);
  });

  it("marks the nearest train as the last one during waiting, approaching and arriving", () => {
    const waiting = getUpcomingTrains(["12:05"], MOCK_TIME);
    const approaching = getUpcomingTrains(["12:05"], {
      totalSeconds: 12 * 3600 + 4 * 60 + 40,
    });
    const arriving = getUpcomingTrains(["12:05"], {
      totalSeconds: 12 * 3600 + 5 * 60 + 5,
    });

    expect(waiting.nearest?.isLastTrain).toBe(true);
    expect(approaching.nearest?.status).toBe("approaching");
    expect(approaching.nearest?.isLastTrain).toBe(true);
    expect(arriving.nearest?.status).toBe("arriving");
    expect(arriving.nearest?.isLastTrain).toBe(true);
  });

  it("switches to next train after arriving window", () => {
    const time: MetroTime = { ...MOCK_TIME, totalSeconds: 12 * 3600 + 5 * 60 + 20 };
    const result = getUpcomingTrains(MOCK_SCHEDULE, time);
    expect(result.nearest?.scheduleTime).toBe("12:10");
    expect(result.nearest?.status).toBe("waiting");
    expect(result.next.map((train) => train.scheduleTime)).toEqual([
      "12:15",
      "12:20",
      "12:25",
    ]);
    expect(result.next.map((train) => train.scheduleTime)).not.toContain("12:10");
  });

  it("returns not_found if all trains passed", () => {
    const time: MetroTime = { ...MOCK_TIME, totalSeconds: 23 * 3600 };
    const result = getUpcomingTrains(MOCK_SCHEDULE, time);
    expect(result.status).toBe("not_found");
    expect(result.nearest).toBeNull();
  });

  it("keeps next-day calendar times readable after midnight", () => {
    const time: MetroTime = {
      ...MOCK_TIME,
      hours: 23,
      minutes: 58,
      totalSeconds: 23 * 3600 + 58 * 60,
    };
    const result = getUpcomingTrains(["23:55", "24:05", "24:31", "24:40"], time);

    expect(result.nearest?.displayTime).toBe("00:05");
    expect(result.next.map((train) => train.displayTime)).toEqual(["00:31", "00:40"]);
  });
});

describe("Operational day handling", () => {
  it("moves to after_close once the last train arrival window finishes", () => {
    const time: MetroTime = {
      ...MOCK_TIME,
      dateString: "2024-01-03",
      dayOfWeek: 3,
      isWeekend: false,
      hours: 23,
      minutes: 59,
      seconds: 16,
      totalSeconds: 23 * 3600 + 59 * 60 + 16,
    };

    const state = resolveMetroStateFromSchedules({
      currentSchedule: ["06:00", "23:59"],
      currentDayType: "weekday",
      currentDate: "2024-01-03",
      currentTime: time,
      nextSchedule: ["06:10", "23:30"],
      nextDayType: "weekday",
      nextDate: "2024-01-04",
      previousSchedule: ["06:00", "23:40"],
      previousDayType: "weekday",
      previousDate: "2024-01-02",
    });

    expect(state.status).toBe("after_close");
    expect(state.nearest).toBeNull();
    expect(state.firstTrain?.displayTime).toBe("06:10");
  });

  it("keeps previous operational day active after midnight while the last train is arriving", () => {
    const time: MetroTime = {
      ...MOCK_TIME,
      dateString: "2024-01-06",
      dayOfWeek: 6,
      isWeekend: true,
      hours: 0,
      minutes: 0,
      seconds: 5,
      totalSeconds: 5,
    };

    const state = resolveMetroState("prospekt-kosmonavtov", "to-botanicheskaya", time);

    expect(state.status).toBe("running");
    expect(state.isPreviousOperationalDay).toBe(true);
    expect(state.operationalDate).toBe("2024-01-05");
    expect(state.nearest?.scheduleTime).toBe("24:02");
    expect(state.nearest?.status).toBe("waiting");
    expect(state.dayType).toBe("weekday");
  });

  it("shows before_open after midnight when previous operational day has already finished", () => {
    const time: MetroTime = {
      ...MOCK_TIME,
      dateString: "2024-01-06",
      dayOfWeek: 6,
      isWeekend: true,
      hours: 0,
      minutes: 20,
      seconds: 0,
      totalSeconds: 20 * 60,
    };

    const state = resolveMetroState("prospekt-kosmonavtov", "to-botanicheskaya", time);

    expect(state.status).toBe("before_open");
    expect(state.isPreviousOperationalDay).toBe(false);
    expect(state.operationalDate).toBe("2024-01-06");
    expect(state.firstTrain?.displayTime).toBe("05:49");
    expect(state.secondsUntilFirstTrain).toBe(5 * 3600 + 29 * 60);
    expect(state.dayType).toBe("weekend");
  });

  it("switches to after_close and points to the first train of the next day", () => {
    const time: MetroTime = {
      ...MOCK_TIME,
      dateString: "2024-01-03",
      dayOfWeek: 3,
      isWeekend: false,
      hours: 23,
      minutes: 50,
      seconds: 0,
      totalSeconds: 23 * 3600 + 50 * 60,
    };

    const state = resolveMetroStateFromSchedules({
      currentSchedule: ["06:00", "23:40"],
      currentDayType: "weekday",
      currentDate: "2024-01-03",
      currentTime: time,
      nextSchedule: ["06:10", "23:30"],
      nextDayType: "weekday",
      nextDate: "2024-01-04",
      previousSchedule: ["06:00", "23:50"],
      previousDayType: "weekday",
      previousDate: "2024-01-02",
    });

    expect(state.status).toBe("after_close");
    expect(state.firstTrain?.displayTime).toBe("06:10");
    expect(state.secondsUntilFirstTrain).toBe(6 * 3600 + 20 * 60);
    expect(state.operationalDate).toBe("2024-01-04");
  });

  it("returns a readable error when schedule data is missing", () => {
    const state = resolveMetroStateFromSchedules({
      currentSchedule: null,
      currentDayType: "weekday",
      currentDate: "2024-01-03",
      currentTime: MOCK_TIME,
    });

    expect(state.status).toBe("error");
    expect(state.message).toMatch(/Расписание/);
  });
});
