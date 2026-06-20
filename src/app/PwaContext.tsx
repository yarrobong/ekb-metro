import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

import { useAppStore } from "./store";
import { PwaContext, type InstallMethod, type PwaContextValue } from "./pwa-context";
import { getDeviceInfo } from "../lib/device";
import {
  currentUpdateMetadata,
  getUpdateMetadataUrl,
  resolveAvailableUpdate,
  updateMetadataSchema,
  type AvailableUpdateDetails,
} from "./update/updateMetadata";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const INSTALL_DISMISS_KEY = "metro-install-dismissed-at";
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
  const [availableUpdate, setAvailableUpdate] = useState<AvailableUpdateDetails | null>(
    null,
  );
  const [dismissedUpdateSignature, setDismissedUpdateSignature] = useState<string | null>(
    null,
  );
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  const [hasWaitingWorker, setHasWaitingWorker] = useState(false);
  const [isRegistrationReady, setIsRegistrationReady] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: false,
    onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
      registrationRef.current = registration;
      setHasWaitingWorker(Boolean(registration?.waiting));
      setIsRegistrationReady(true);
    },
    onOfflineReady() {},
    onRegisterError() {},
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

  useEffect(() => {
    setHasWaitingWorker(needRefresh || Boolean(registrationRef.current?.waiting));
  }, [needRefresh]);

  const checkForUpdatesInternal = useCallback(async (): Promise<{
    result: "latest" | "available" | "offline" | "error";
    update: AvailableUpdateDetails | null;
  }> => {
    if (!navigator.onLine) {
      return { result: "offline", update: null };
    }

    if (!registrationRef.current) {
      return { result: "error", update: null };
    }

    try {
      setIsCheckingForUpdates(true);
      const response = await fetch(getUpdateMetadataUrl(), {
        cache: "no-store",
        headers: {
          accept: "application/json",
        },
      });

      await registrationRef.current.update();

      if (!response.ok) {
        return { result: "error", update: null };
      }

      const remoteUpdate = updateMetadataSchema.parse(await response.json());
      const resolvedUpdate = resolveAvailableUpdate(currentUpdateMetadata, remoteUpdate);
      const workerReady = Boolean(registrationRef.current.waiting) || needRefresh;

      setAvailableUpdate(resolvedUpdate);
      setHasWaitingWorker(workerReady);

      return {
        result: resolvedUpdate && workerReady ? "available" : "latest",
        update: resolvedUpdate,
      };
    } catch {
      return {
        result: navigator.onLine ? "error" : "offline",
        update: null,
      };
    } finally {
      setIsCheckingForUpdates(false);
    }
  }, [needRefresh]);

  useEffect(() => {
    if (!isRegistrationReady) {
      return;
    }

    const initialCheckTimeout = window.setTimeout(() => {
      void checkForUpdatesInternal();
    }, 0);

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
      window.clearTimeout(initialCheckTimeout);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [checkForUpdatesInternal, isRegistrationReady]);

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
    if (isApplyingUpdate) {
      return;
    }

    setIsApplyingUpdate(true);

    try {
      const registration = registrationRef.current;

      if (!registration) {
        throw new Error("Service worker is not registered");
      }

      await registration.update();
      const workerReady = Boolean(registration.waiting) || needRefresh;

      setHasWaitingWorker(workerReady);

      if (!workerReady) {
        throw new Error("Updated service worker is not ready");
      }

      await updateServiceWorker(true);
    } catch {
      showToast("Не удалось обновить приложение", "error");
    } finally {
      setIsApplyingUpdate(false);
    }
  }

  function dismissUpdatePrompt() {
    if (availableUpdate) {
      setDismissedUpdateSignature(availableUpdate.signature);
    }
  }

  async function checkForUpdates() {
    const { result, update } = await checkForUpdatesInternal();

    if (result === "available") {
      showToast(update?.title ?? "Доступно обновление", "success");
    } else if (result === "latest") {
      showToast("Установлена последняя версия", "info");
    } else if (result === "offline") {
      showToast("Нет подключения к интернету", "warning");
    } else if (result === "error") {
      showToast("Не удалось проверить обновления", "error");
    }

    return result;
  }

  const updateInfo =
    availableUpdate &&
    dismissedUpdateSignature !== availableUpdate.signature &&
    hasWaitingWorker
      ? availableUpdate
      : null;

  const value: PwaContextValue = {
    isStandalone,
    installMethod,
    shouldShowInstallPrompt,
    updateAvailable: updateInfo !== null,
    updateInfo,
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
