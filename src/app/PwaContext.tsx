import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

import { useAppStore } from "./store";
import { PwaContext, type InstallMethod, type PwaContextValue } from "./pwa-context";
import { metadata } from "../data/metadata";
import { getDeviceInfo } from "../lib/device";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const INSTALL_DISMISS_KEY = "metro-install-dismissed-at";
const OFFLINE_READY_KEY = `metro-offline-ready-${metadata.version}`;
const INSTALL_DISMISS_MS = 3 * 24 * 60 * 60 * 1000;

export function PwaProvider({ children }: { children: ReactNode }) {
  const device = getDeviceInfo();
  const showToast = useAppStore((state) => state.showToast);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [isStandalone, setIsStandalone] = useState(device.isStandalone);
  const [installDismissedAt, setInstallDismissedAt] = useState<number>(() =>
    readNumberFromStorage(INSTALL_DISMISS_KEY),
  );
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: false,
    onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
      registrationRef.current = registration;
    },
    onOfflineReady() {
      if (!readBooleanFromStorage(OFFLINE_READY_KEY)) {
        showToast("Приложение готово к работе без интернета", "success");
        writeBooleanToStorage(OFFLINE_READY_KEY, true);
      }
    },
    onRegisterError() {
      showToast("Не удалось подготовить офлайн-режим", "warning");
    },
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      writeNumberToStorage(INSTALL_DISMISS_KEY, Date.now());
      showToast("Приложение установлено", "success");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [showToast]);

  const installMethod: InstallMethod = useMemo(() => {
    if (isStandalone) {
      return "unavailable";
    }

    if (deferredPrompt) {
      return "prompt";
    }

    if (device.kind === "iphone" || device.kind === "ipad" || device.isInAppBrowser) {
      return "manual";
    }

    return "manual";
  }, [deferredPrompt, device, isStandalone]);

  const shouldShowInstallPrompt =
    !isStandalone &&
    Date.now() - installDismissedAt > INSTALL_DISMISS_MS &&
    installMethod !== "unavailable";

  const checkForUpdatesInternal = useCallback(async (): Promise<
    "latest" | "available" | "offline" | "error"
  > => {
    if (!navigator.onLine) {
      return "offline";
    }

    if (!registrationRef.current) {
      return "error";
    }

    try {
      setIsCheckingForUpdates(true);
      await registrationRef.current.update();
      return registrationRef.current.waiting || needRefresh ? "available" : "latest";
    } catch {
      return "error";
    } finally {
      setIsCheckingForUpdates(false);
    }
  }, [needRefresh]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void checkForUpdatesInternal();
      }
    };

    const interval = window.setInterval(
      () => {
        void checkForUpdatesInternal();
      },
      15 * 60 * 1000,
    );

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [checkForUpdatesInternal]);

  async function openInstallPrompt() {
    if (installMethod !== "prompt" || !deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    } else {
      dismissInstallPrompt();
    }
  }

  function dismissInstallPrompt() {
    const now = Date.now();
    setInstallDismissedAt(now);
    writeNumberToStorage(INSTALL_DISMISS_KEY, now);
  }

  async function applyUpdate() {
    setIsApplyingUpdate(true);
    try {
      await updateServiceWorker(true);
    } finally {
      setIsApplyingUpdate(false);
    }
  }

  function dismissUpdatePrompt() {
    setNeedRefresh(false);
  }

  async function checkForUpdates() {
    const result = await checkForUpdatesInternal();

    if (result === "latest") {
      showToast("Установлена последняя версия", "info");
    } else if (result === "available") {
      showToast("Доступно обновление", "success");
    } else if (result === "offline") {
      showToast("Нет подключения к интернету", "warning");
    } else {
      showToast("Не удалось проверить обновления", "error");
    }

    return result;
  }

  const value: PwaContextValue = {
    isStandalone,
    installMethod,
    shouldShowInstallPrompt,
    updateAvailable: needRefresh,
    isCheckingForUpdates,
    isApplyingUpdate,
    dismissInstallPrompt,
    openInstallPrompt,
    checkForUpdates,
    applyUpdate,
    dismissUpdatePrompt,
  };

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}
function readNumberFromStorage(key: string): number {
  try {
    return Number(window.localStorage.getItem(key) || 0);
  } catch {
    return 0;
  }
}

function writeNumberToStorage(key: string, value: number) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Ignore storage errors for non-critical PWA hints.
  }
}

function readBooleanFromStorage(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeBooleanToStorage(key: string, value: boolean) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Ignore storage errors for non-critical PWA hints.
  }
}
