import { stations } from "../src/data/stations";
import { directions } from "../src/data/directions";
import { schedule } from "../src/data/schedule";
import { driveTimes } from "../src/data/driveTimes";
import { metadata } from "../src/data/metadata";
import { specialDates } from "../src/data/specialDates";

import {
  StationSchema,
  DirectionSchema,
  ScheduleSchema,
  DriveTimeSchema,
  SpecialDateSchema,
  MetroMetadataSchema,
} from "../src/domain/metro/validation";

import type { DayType } from "../src/domain/metro/metro.types";

function validateData() {
  let hasErrors = false;
  let warnings = 0;
  let totalTimes = 0;

  console.log("Starting Metro Data Validation...\n");

  // 1. Zod Validation
  {
    const res = MetroMetadataSchema.safeParse(metadata);
    if (!res.success) {
      console.error("Critical: Metadata validation failed:", res.error.issues);
      hasErrors = true;
    } else {
      console.log(
        `Metadata appVersion: ${metadata.appVersion}, scheduleVersion: ${metadata.scheduleVersion}, validFrom: ${metadata.validFrom}`,
      );
    }
  }

  // const stationIds = new Set(stations.map((s) => s.id));
  if (stations.length !== 9) {
    console.error("Critical: There must be exactly 9 stations.");
    hasErrors = true;
  }
  if (
    stations[0]?.id !== "prospekt-kosmonavtov" ||
    stations[8]?.id !== "botanicheskaya"
  ) {
    console.error("Critical: Incorrect start or end station.");
    hasErrors = true;
  }

  for (const st of stations) {
    const res = StationSchema.safeParse(st);
    if (!res.success) {
      console.error(
        `Critical: Station validation failed for ${st.id}:`,
        res.error.issues,
      );
      hasErrors = true;
    }
  }

  for (const dir of directions) {
    const res = DirectionSchema.safeParse(dir);
    if (!res.success) {
      console.error(
        `Critical: Direction validation failed for ${dir.id}:`,
        res.error.issues,
      );
      hasErrors = true;
    }
  }

  for (const dt of driveTimes) {
    const res = DriveTimeSchema.safeParse(dt);
    if (!res.success) {
      console.error(`Critical: DriveTime validation failed:`, res.error.issues);
      hasErrors = true;
    }
  }

  for (const sd of specialDates) {
    const res = SpecialDateSchema.safeParse(sd);
    if (!res.success) {
      console.error(
        `Critical: SpecialDate validation failed for ${sd.date}:`,
        res.error.issues,
      );
      hasErrors = true;
    }
  }

  // 2. Logical Schedule Checks
  for (const st of stations) {
    const sch = schedule[st.id];
    if (!sch) {
      if (st.availableDirections.length > 0) {
        console.error(`Critical: Missing schedule for station ${st.id}`);
        hasErrors = true;
      }
      continue;
    }

    for (const dir of st.availableDirections) {
      const dirSchedule = sch[dir];
      if (!dirSchedule) {
        console.error(
          `Critical: Missing schedule for direction ${dir} at station ${st.id}`,
        );
        hasErrors = true;
        continue;
      }

      const res = ScheduleSchema.safeParse(dirSchedule);
      if (!res.success) {
        console.error(
          `Critical: TrainTime validation failed for ${st.id} -> ${dir}:`,
          res.error.issues,
        );
        hasErrors = true;
        continue;
      }

      const checkDay = (times: string[], dayStr: DayType) => {
        totalTimes += times.length;
        if (times.length === 0) {
          console.error(`Critical: Empty times array for ${st.id} -> ${dir} (${dayStr})`);
          hasErrors = true;
          return;
        }

        // Sort check & Intervals check
        let prevMins = -1;
        for (let i = 0; i < times.length; i++) {
          const t = times[i];
          if (!t) return;
          const [h, m] = t.split(":").map(Number);
          if (h === undefined || m === undefined) return;
          const currentMins = h * 60 + m;

          if (i > 0) {
            const interval = currentMins - prevMins;
            if (interval < 0) {
              console.error(
                `Critical: Times not sorted at ${st.id} -> ${dir} (${dayStr}): ${times[i - 1]} then ${t}`,
              );
              hasErrors = true;
            } else if (interval === 0) {
              console.error(
                `Critical: Duplicate time at ${st.id} -> ${dir} (${dayStr}): ${t}`,
              );
              hasErrors = true;
            } else if (interval > 30) {
              console.warn(
                `Warning: Large interval (${interval} mins) at ${st.id} -> ${dir} (${dayStr}) before ${t}`,
              );
              warnings++;
            } else if (interval < 3) {
              console.warn(
                `Warning: Small interval (${interval} mins) at ${st.id} -> ${dir} (${dayStr}) before ${t}`,
              );
              warnings++;
            }
          }
          prevMins = currentMins;
        }
      };

      checkDay(dirSchedule.weekdays, "weekday");
      checkDay(dirSchedule.weekends, "weekend");
    }
  }

  // 3. Stats & Report
  console.log("\n====== VALIDATION REPORT ======");
  console.log(`Stations: ${stations.length}`);
  console.log(`Directions: ${directions.length}`);
  console.log(`Special Dates: ${specialDates.length}`);
  console.log(`Drive Times: ${driveTimes.length}`);
  console.log(`Total Train Times: ${totalTimes}`);

  if (hasErrors) {
    console.error(
      `\nValidation FAILED with ${hasErrors ? "errors" : "0 errors"} and ${warnings} warnings.`,
    );
    process.exit(1);
  } else {
    console.log(`\nValidation PASSED with 0 errors and ${warnings} warnings.`);
  }
}

validateData();
