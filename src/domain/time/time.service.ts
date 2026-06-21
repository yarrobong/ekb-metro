export interface MetroTime {
  dateString: string;
  dayOfWeek: number;
  isWeekend: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export const METRO_TIME_ZONE = "Asia/Yekaterinburg";
export const METRO_UTC_OFFSET = "+05:00";

export function getCurrentMetroTime(overrideDate?: Date): MetroTime {
  const now = overrideDate || new Date();

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: METRO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const p = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  const year = p.year || new Date().getFullYear().toString();
  const month = p.month || "01";
  const day = p.day || "01";
  const pMinute = p.minute || "00";
  const pSecond = p.second || "00";
  const pHour = p.hour || "00";

  // We need to parse this properly to determine day of week for Yekaterinburg
  const hourValue = pHour === "24" ? "00" : pHour;
  const localDateStr = `${year}-${month}-${day}T${hourValue}:${pMinute}:${pSecond}${METRO_UTC_OFFSET}`;
  const localDate = new Date(localDateStr);

  const dayOfWeek = localDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let h = parseInt(pHour, 10);
  if (h === 24) h = 0;

  return {
    dateString: `${year}-${month}-${day}`, // Note: this is the calendar date, which is fine for looking up special dates
    dayOfWeek,
    isWeekend,
    hours: h,
    minutes: parseInt(pMinute, 10),
    seconds: parseInt(pSecond, 10),
    totalSeconds: h * 3600 + parseInt(pMinute, 10) * 60 + parseInt(pSecond, 10),
  };
}

export function timeStringToSeconds(timeStr: string): number {
  const [hStr, mStr] = timeStr.split(":");
  if (!hStr || !mStr) return 0;

  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  return h * 3600 + m * 60;
}

export function shiftMetroDateString(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isWeekendMetroDate(dateString: string): boolean {
  const date = new Date(`${dateString}T00:00:00Z`);
  const dayOfWeek = date.getUTCDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

export function metroDateTimeToTimestamp(
  dateString: string,
  timeString: string,
  seconds = 0,
): number {
  return new Date(
    `${dateString}T${timeString}:${String(seconds).padStart(2, "0")}${METRO_UTC_OFFSET}`,
  ).getTime();
}

export function metroOperationalSecondsToTimestamp(
  serviceDate: string,
  operationalSeconds: number,
): number {
  return (
    new Date(`${serviceDate}T00:00:00${METRO_UTC_OFFSET}`).getTime() +
    operationalSeconds * 1000
  );
}

export function metroTimeToTimestamp(metroTime: MetroTime): number {
  return new Date(
    `${metroTime.dateString}T${String(metroTime.hours).padStart(2, "0")}:${String(
      metroTime.minutes,
    ).padStart(2, "0")}:${String(metroTime.seconds).padStart(2, "0")}${METRO_UTC_OFFSET}`,
  ).getTime();
}

export function timestampToMetroDateString(timestamp: number): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: METRO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date(timestamp));
  const mapped = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${mapped.year}-${mapped.month}-${mapped.day}`;
}

export function timestampToMetroTimeString(timestamp: number): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: METRO_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return formatter.format(new Date(timestamp));
}
