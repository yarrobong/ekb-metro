import { createContext } from "react";

export type InstallMethod = "prompt" | "manual" | "unavailable";

export interface PwaContextValue {
  isStandalone: boolean;
  installMethod: InstallMethod;
  shouldShowInstallPrompt: boolean;
  updateAvailable: boolean;
  isCheckingForUpdates: boolean;
  isApplyingUpdate: boolean;
  dismissInstallPrompt: () => void;
  openInstallPrompt: () => Promise<void>;
  checkForUpdates: () => Promise<"latest" | "available" | "offline" | "error">;
  applyUpdate: () => Promise<void>;
  dismissUpdatePrompt: () => void;
}

export const PwaContext = createContext<PwaContextValue | null>(null);
