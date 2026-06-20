import { useEffect } from "react";
import type { ReactNode } from "react";

import { PwaProvider } from "./PwaContext";
import { useAppStore } from "./store";
import { PwaUpdateBanner } from "../components/app/PwaUpdateBanner";
import { BottomNavigation } from "../components/layout/BottomNavigation";
import { ToastViewport } from "../components/ui/ToastViewport";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const showToast = useAppStore((state) => state.showToast);

  useEffect(() => {
    const handleOffline = () => showToast("Нет подключения к интернету", "warning");
    const handleOnline = () => showToast("Подключение восстановлено", "success");

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [showToast]);

  return (
    <PwaProvider>
      <div className="min-h-screen bg-app-bg text-text-primary">
        <main className="app-safe-area mx-auto w-full max-w-[520px] pb-28">
          {children}
        </main>

        <BottomNavigation />
        <PwaUpdateBanner />
        <ToastViewport />
      </div>
    </PwaProvider>
  );
}
