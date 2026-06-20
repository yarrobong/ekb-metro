import { describe, it, expect } from "vitest";

import { stations } from "../../data/stations";
import { directions } from "../../data/directions";
import { schedule } from "../../data/schedule";
import { driveTimes } from "../../data/driveTimes";
import { metadata } from "../../data/metadata";

import {
  StationSchema,
  DirectionSchema,
  ScheduleSchema,
  DriveTimeSchema,
  MetroMetadataSchema,
} from "./validation";

describe("Metro Data Tests", () => {
  it("should have exactly 9 stations in correct order", () => {
    expect(stations.length).toBe(9);
    expect(stations[0]?.id).toBe("prospekt-kosmonavtov");
    expect(stations[8]?.id).toBe("botanicheskaya");

    stations.forEach((st, idx) => {
      expect(st.index).toBe(idx);
    });
  });

  it("should validate all stations with Zod", () => {
    stations.forEach((st) => {
      const res = StationSchema.safeParse(st);
      expect(res.success).toBe(true);
    });
  });

  it("should have exactly 2 directions and valid schemas", () => {
    expect(directions.length).toBe(2);
    directions.forEach((dir) => {
      const res = DirectionSchema.safeParse(dir);
      expect(res.success).toBe(true);
    });
  });

  it("should have schedule for every station and available direction", () => {
    stations.forEach((st) => {
      st.availableDirections.forEach((dir) => {
        const dirSchedule = schedule[st.id]?.[dir];
        expect(dirSchedule).toBeDefined();

        const res = ScheduleSchema.safeParse(dirSchedule);
        expect(res.success).toBe(true);
        expect(dirSchedule?.weekdays.length).toBeGreaterThan(0);
        expect(dirSchedule?.weekends.length).toBeGreaterThan(0);
      });
    });
  });

  it("should validate drive times", () => {
    expect(driveTimes.length).toBe(16);
    driveTimes.forEach((dt) => {
      const res = DriveTimeSchema.safeParse(dt);
      expect(res.success).toBe(true);
    });
  });

  it("should validate metadata", () => {
    const res = MetroMetadataSchema.safeParse(metadata);
    expect(res.success).toBe(true);
    expect(metadata.timezone).toBe("Asia/Yekaterinburg");
    expect(metadata.lastVerifiedAt).toBe("2026-06-21");
  });

  it("should ensure schedules are sorted with no duplicates and handle after midnight", () => {
    stations.forEach((st) => {
      st.availableDirections.forEach((dir) => {
        const dirSchedule = schedule[st.id]?.[dir];
        if (!dirSchedule) throw new Error("Missing schedule");
        for (const type of ["weekdays", "weekends"] as const) {
          const times = dirSchedule[type];
          let prevMins = -1;
          times.forEach((t) => {
            const [h, m] = t.split(":").map(Number);
            if (h === undefined || m === undefined) return;
            const currentMins = h * 60 + m;
            expect(currentMins).toBeGreaterThan(prevMins);
            prevMins = currentMins;
          });
        }
      });
    });
  });
});
