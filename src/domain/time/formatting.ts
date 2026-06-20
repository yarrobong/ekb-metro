export function formatMinutes(minutes: number): string {
  const m10 = minutes % 10;
  const m100 = minutes % 100;

  if (m100 >= 11 && m100 <= 14) {
    return `${minutes} минут`;
  }

  if (m10 === 1) {
    return `${minutes} минута`;
  }

  if (m10 >= 2 && m10 <= 4) {
    return `${minutes} минуты`;
  }

  return `${minutes} минут`;
}

export function formatHours(hours: number): string {
  const h10 = hours % 10;
  const h100 = hours % 100;

  if (h100 >= 11 && h100 <= 14) {
    return `${hours} часов`;
  }

  if (h10 === 1) {
    return `${hours} час`;
  }

  if (h10 >= 2 && h10 <= 4) {
    return `${hours} часа`;
  }

  return `${hours} часов`;
}

export function formatTimer(secondsDiff: number, showSeconds: boolean): string {
  if (secondsDiff < 0) secondsDiff = 0;

  if (!showSeconds) {
    const m = Math.ceil(secondsDiff / 60);
    if (m === 0) return "Меньше минуты";

    const h = Math.floor(m / 60);
    const mins = m % 60;

    // Only return text here if it doesn't show seconds, but for Timer card we want text?
    // Wait, the prompt says for unshown seconds:
    // Timer card: "4 минуты". "1 час 4 минуты".
    if (h > 0) {
      if (mins === 0) return formatHours(h);
      return `${formatHours(h)} ${formatMinutes(mins)}`;
    }
    return formatMinutes(mins);
  }

  const h = Math.floor(secondsDiff / 3600);
  const m = Math.floor((secondsDiff % 3600) / 60);
  const s = secondsDiff % 60;

  const mStr = m.toString().padStart(2, "0");
  const sStr = s.toString().padStart(2, "0");

  if (h > 0) {
    return `${h}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
}

export function formatRelativeTime(secondsDiff: number, showSeconds: boolean): string {
  void showSeconds;
  const safeSeconds = Math.max(0, secondsDiff);
  const m = Math.ceil(safeSeconds / 60);
  if (m === 0) return "меньше минуты";

  const h = Math.floor(m / 60);
  const mins = m % 60;

  if (h > 0) {
    if (mins === 0) return formatHours(h);
    return `${formatHours(h)} ${formatMinutes(mins)}`;
  }

  return formatMinutes(mins);
}
