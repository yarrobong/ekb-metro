import { describe, it, expect } from "vitest";
import {
  formatMinutes,
  formatHours,
  formatRelativeTime,
  formatTimer,
} from "./formatting";
import { timeStringToSeconds } from "./time.service";

describe("Time Formatting", () => {
  it("formats minutes correctly", () => {
    expect(formatMinutes(1)).toBe("1 минута");
    expect(formatMinutes(2)).toBe("2 минуты");
    expect(formatMinutes(5)).toBe("5 минут");
    expect(formatMinutes(11)).toBe("11 минут");
    expect(formatMinutes(21)).toBe("21 минута");
    expect(formatMinutes(22)).toBe("22 минуты");
  });

  it("formats hours correctly", () => {
    expect(formatHours(1)).toBe("1 час");
    expect(formatHours(2)).toBe("2 часа");
    expect(formatHours(5)).toBe("5 часов");
    expect(formatHours(11)).toBe("11 часов");
    expect(formatHours(21)).toBe("21 час");
  });

  it("formats relative time text (showSeconds = false)", () => {
    expect(formatRelativeTime(45, false)).toBe("1 минута");
    expect(formatRelativeTime(60, false)).toBe("1 минута");
    expect(formatRelativeTime(65, false)).toBe("2 минуты");
    expect(formatRelativeTime(3605, false)).toBe("1 час 1 минута");
    expect(formatRelativeTime(3600, false)).toBe("1 час");
  });

  it("clamps negative relative time and keeps Russian declensions", () => {
    expect(formatRelativeTime(-5, false)).toBe("меньше минуты");
    expect(formatRelativeTime(21 * 60, false)).toBe("21 минута");
    expect(formatRelativeTime(22 * 60, false)).toBe("22 минуты");
    expect(formatRelativeTime(25 * 60, false)).toBe("25 минут");
  });

  it("formats timer display (showSeconds = true)", () => {
    expect(formatTimer(45, true)).toBe("00:45");
    expect(formatTimer(65, true)).toBe("01:05");
    expect(formatTimer(3605, true)).toBe("1:00:05");
  });

  it("formats timer display (showSeconds = false)", () => {
    expect(formatTimer(45, false)).toBe("1 минута");
    expect(formatTimer(65, false)).toBe("2 минуты");
    expect(formatTimer(3605, false)).toBe("1 час 1 минута");
  });
});

describe("Time Parsing", () => {
  it("converts time string to seconds", () => {
    expect(timeStringToSeconds("00:00")).toBe(0);
    expect(timeStringToSeconds("01:05")).toBe(3900);
    expect(timeStringToSeconds("24:10")).toBe(87000);
  });
});
