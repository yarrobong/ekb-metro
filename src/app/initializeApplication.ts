import type { ComponentType } from "react";

export const LAUNCH_STATUS_DELAY_MS = 160;
export const APPLICATION_INIT_TIMEOUT_MS = 8_000;

interface AppModule {
  App: ComponentType;
}

function loadAppModule() {
  return import("./App");
}

function createInitializationTimeoutError() {
  return new Error("Приложение не успело инициализироваться");
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(createInitializationTimeoutError());
    }, timeoutMs);

    promise.then(
      (result) => {
        window.clearTimeout(timeoutId);
        resolve(result);
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

export async function initializeApplication(
  loadModule: () => Promise<AppModule> = loadAppModule,
): Promise<ComponentType> {
  const module = await withTimeout(loadModule(), APPLICATION_INIT_TIMEOUT_MS);

  return module.App;
}
