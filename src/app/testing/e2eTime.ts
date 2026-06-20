export const METRO_E2E_TIME_KEY = "metro-e2e-now";
export const METRO_E2E_TIME_EVENT = "metro:e2e-time-change";

const isE2eBuild = import.meta.env.VITE_E2E === "true";

export function isMetroE2eTimeEnabled(): boolean {
  return isE2eBuild;
}

export function readMetroE2eNow(): Date | null {
  if (!isE2eBuild) {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(METRO_E2E_TIME_KEY);
    if (!storedValue) {
      return null;
    }

    const date = new Date(storedValue);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}
