import { afterEach, describe, expect, it } from "vitest";

import { specialDates } from "../../data/specialDates";
import { buildArrivalPlanRequest, planArrivalByTime } from "./arrival-planner.service";

describe("arrival planner service", () => {
  afterEach(() => {
    specialDates.length = 0;
  });

  it("chooses the latest train that still arrives on time", () => {
    const result = planArrivalByTime(
      buildArrivalPlanRequest({
        originStationId: "geologicheskaya",
        destinationStationId: "botanicheskaya",
        directionId: "to-botanicheskaya",
        desiredDateString: "2024-01-05",
        desiredTimeString: "19:00",
        nowTimestamp: new Date("2024-01-05T18:24:00+05:00").getTime(),
      }),
    );

    expect(result.status).toBe("success");
    expect(result.recommended?.departureDisplayTime).toBe("18:50");
    expect(result.recommended?.arrivalDisplayTime).toBe("18:56");
    expect(result.recommended?.bufferMinutes).toBe(4);
  });

  it("prefers a later suitable train over earlier alternatives", () => {
    const result = planArrivalByTime(
      buildArrivalPlanRequest({
        originStationId: "geologicheskaya",
        destinationStationId: "botanicheskaya",
        directionId: "to-botanicheskaya",
        desiredDateString: "2024-01-05",
        desiredTimeString: "19:00",
        nowTimestamp: new Date("2024-01-05T18:24:00+05:00").getTime(),
      }),
    );

    expect(result.status).toBe("success");
    expect(result.recommended?.departureDisplayTime).toBe("18:50");
    expect(result.earlierAlternatives.map((item) => item.departureDisplayTime)).toEqual([
      "18:45",
      "18:40",
    ]);
  });

  it("supports exact arrival with zero buffer", () => {
    const result = planArrivalByTime(
      buildArrivalPlanRequest({
        originStationId: "geologicheskaya",
        destinationStationId: "botanicheskaya",
        directionId: "to-botanicheskaya",
        desiredDateString: "2024-01-05",
        desiredTimeString: "18:56",
        nowTimestamp: new Date("2024-01-05T18:24:00+05:00").getTime(),
      }),
    );

    expect(result.status).toBe("success");
    expect(result.recommended?.departureDisplayTime).toBe("18:50");
    expect(result.recommended?.arrivalDisplayTime).toBe("18:56");
    expect(result.recommended?.bufferMinutes).toBe(0);
  });

  it("excludes trains that already passed for today", () => {
    const result = planArrivalByTime(
      buildArrivalPlanRequest({
        originStationId: "geologicheskaya",
        destinationStationId: "botanicheskaya",
        directionId: "to-botanicheskaya",
        desiredDateString: "2024-01-05",
        desiredTimeString: "18:28",
        nowTimestamp: new Date("2024-01-05T18:29:00+05:00").getTime(),
      }),
    );

    expect(result.status).toBe("failure");
    expect(result.failureReason).toBe("all-trains-passed");
  });

  it("keeps after-midnight trains on the previous operational day", () => {
    const result = planArrivalByTime(
      buildArrivalPlanRequest({
        originStationId: "geologicheskaya",
        destinationStationId: "botanicheskaya",
        directionId: "to-botanicheskaya",
        desiredDateString: "2024-01-06",
        desiredTimeString: "00:20",
        nowTimestamp: new Date("2024-01-05T18:24:00+05:00").getTime(),
      }),
    );

    expect(result.status).toBe("success");
    expect(result.recommended?.sourceTime).toBe("24:01");
    expect(result.recommended?.departureDisplayTime).toBe("00:01");
    expect(result.recommended?.arrivalDisplayTime).toBe("00:07");
    expect(result.recommended?.serviceDate).toBe("2024-01-05");
  });

  it("returns too-early when the requested arrival is before the first possible trip", () => {
    const result = planArrivalByTime(
      buildArrivalPlanRequest({
        originStationId: "geologicheskaya",
        destinationStationId: "botanicheskaya",
        directionId: "to-botanicheskaya",
        desiredDateString: "2024-01-08",
        desiredTimeString: "00:00",
        nowTimestamp: new Date("2024-01-07T18:24:00+05:00").getTime(),
      }),
    );

    expect(result.status).toBe("failure");
    expect(result.failureReason).toBe("too-early");
    expect(result.firstPossibleArrival?.arrivalDisplayTime).toBe("00:01");
  });

  it("returns missing-route when the route itself is invalid", () => {
    const result = planArrivalByTime(
      buildArrivalPlanRequest({
        originStationId: "botanicheskaya",
        destinationStationId: "chkalovskaya",
        directionId: "to-botanicheskaya",
        desiredDateString: "2024-01-06",
        desiredTimeString: "19:00",
        nowTimestamp: new Date("2024-01-05T18:24:00+05:00").getTime(),
      }),
    );

    expect(result.status).toBe("failure");
    expect(result.failureReason).toBe("missing-route");
  });

  it("uses a special date with higher priority than the weekend default", () => {
    specialDates.push({
      date: "2024-01-06",
      type: "weekday",
      reason: "Тестовый рабочий день",
    });

    const result = planArrivalByTime(
      buildArrivalPlanRequest({
        originStationId: "geologicheskaya",
        destinationStationId: "botanicheskaya",
        directionId: "to-botanicheskaya",
        desiredDateString: "2024-01-06",
        desiredTimeString: "06:20",
        nowTimestamp: new Date("2024-01-05T18:24:00+05:00").getTime(),
      }),
    );

    expect(result.desiredDayType).toBe("special");
    expect(result.status).toBe("success");
    expect(result.recommended?.departureDisplayTime).toBe("06:10");
  });
});
