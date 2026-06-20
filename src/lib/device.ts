export type DeviceKind = "iphone" | "ipad" | "android" | "desktop";

export interface DeviceInfo {
  kind: DeviceKind;
  browserName: string;
  isInAppBrowser: boolean;
  isStandalone: boolean;
}

export function getDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") {
    return {
      kind: "desktop",
      browserName: "Неизвестный браузер",
      isInAppBrowser: false,
      isStandalone: false,
    };
  }

  const userAgent = window.navigator.userAgent;
  const standalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    // iOS Safari standalone flag.
    ("standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));

  return {
    kind: detectDeviceKind(userAgent),
    browserName: detectBrowserName(userAgent),
    isInAppBrowser: detectInAppBrowser(userAgent),
    isStandalone: standalone,
  };
}

export function getCurrentAppUrl(): string {
  if (typeof window === "undefined") {
    return "https://example.com";
  }

  return window.location.href;
}

function detectDeviceKind(userAgent: string): DeviceKind {
  const normalized = userAgent.toLowerCase();

  if (normalized.includes("iphone")) {
    return "iphone";
  }

  if (
    normalized.includes("ipad") ||
    (normalized.includes("macintosh") && "ontouchend" in window)
  ) {
    return "ipad";
  }

  if (normalized.includes("android")) {
    return "android";
  }

  return "desktop";
}

function detectBrowserName(userAgent: string): string {
  const normalized = userAgent.toLowerCase();

  if (normalized.includes("edg/")) {
    return "Edge";
  }

  if (normalized.includes("opr/") || normalized.includes("opera")) {
    return "Opera";
  }

  if (normalized.includes("chrome/") && !normalized.includes("edg/")) {
    return "Chrome";
  }

  if (normalized.includes("safari/") && !normalized.includes("chrome/")) {
    return "Safari";
  }

  if (normalized.includes("firefox/")) {
    return "Firefox";
  }

  return "браузер";
}

function detectInAppBrowser(userAgent: string): boolean {
  const normalized = userAgent.toLowerCase();

  return ["instagram", "telegram", "vk", "fbav", "fban", "wv"].some((marker) =>
    normalized.includes(marker),
  );
}
