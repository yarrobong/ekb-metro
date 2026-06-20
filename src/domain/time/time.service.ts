export interface MetroTime {
  dateString: string;
  dayOfWeek: number;
  isWeekend: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export function getCurrentMetroTime(overrideDate?: Date): MetroTime {
  const now = overrideDate || new Date();

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Yekaterinburg",
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
  const localDateStr = `${year}-${month}-${day}T${hourValue}:${pMinute}:${pSecond}+05:00`;
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
