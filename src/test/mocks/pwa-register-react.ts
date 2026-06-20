export function useRegisterSW() {
  return {
    needRefresh: [false, () => undefined] as [boolean, (value: boolean) => void],
    offlineReady: [false, () => undefined] as [boolean, (value: boolean) => void],
    updateServiceWorker: () => Promise.resolve(),
  };
}
