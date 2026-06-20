import { useEffect, useState } from "react";
import { vi } from "vitest";

interface RegisterSWOptions {
  onRegisteredSW?: (
    swScriptUrl: string,
    registration: ServiceWorkerRegistration | undefined,
  ) => void;
}

let registerSWOptions: RegisterSWOptions | undefined;
let needRefreshValue = false;

const needRefreshSubscribers = new Set<(value: boolean) => void>();

export const updateServiceWorkerMock = vi.fn<(reloadPage?: boolean) => Promise<void>>(
  () => Promise.resolve(),
);

export function useRegisterSW(options?: RegisterSWOptions) {
  const [needRefresh, setNeedRefresh] = useState(needRefreshValue);

  useEffect(() => {
    registerSWOptions = options;
    needRefreshSubscribers.add(setNeedRefresh);

    return () => {
      needRefreshSubscribers.delete(setNeedRefresh);
    };
  }, [options]);

  return {
    needRefresh: [needRefresh, setNeedRefreshMock] as [boolean, (value: boolean) => void],
    offlineReady: [false, () => undefined] as [boolean, (value: boolean) => void],
    updateServiceWorker: updateServiceWorkerMock,
  };
}

export function getRegisterSWOptions() {
  return registerSWOptions;
}

export function setNeedRefreshMock(value: boolean) {
  needRefreshValue = value;

  for (const subscriber of needRefreshSubscribers) {
    subscriber(value);
  }
}

export function resetPwaRegisterMock() {
  registerSWOptions = undefined;
  needRefreshValue = false;
  needRefreshSubscribers.clear();
  updateServiceWorkerMock.mockReset();
  updateServiceWorkerMock.mockResolvedValue(undefined);
}
