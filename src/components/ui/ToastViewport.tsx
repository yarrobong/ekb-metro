import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { useAppStore } from "../../app/store";
import { usePwa } from "../../app/usePwa";
import { cn } from "../../lib/cn";

const toastIcons = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

export function ToastViewport() {
  const activeToast = useAppStore((state) => state.activeToast);
  const hideToast = useAppStore((state) => state.hideToast);
  const { updateAvailable } = usePwa();

  useEffect(() => {
    if (!activeToast) {
      return;
    }

    const timer = window.setTimeout(() => {
      hideToast();
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [activeToast, hideToast]);

  if (!activeToast) {
    return null;
  }

  const Icon = toastIcons[activeToast.type];

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-50 px-4 pb-[env(safe-area-inset-bottom)]",
        updateAvailable ? "bottom-52" : "bottom-24",
      )}
    >
      <div className="mx-auto max-w-[520px]">
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl",
            activeToast.type === "success" &&
              "border-success/40 bg-success/15 text-white",
            activeToast.type === "info" &&
              "border-accent/40 bg-surface-raised text-white",
            activeToast.type === "warning" &&
              "border-warning/40 bg-warning/15 text-white",
            activeToast.type === "error" && "border-danger/40 bg-danger/15 text-white",
          )}
        >
          <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
          <p className="flex-1 text-sm leading-6">{activeToast.message}</p>
          <button
            type="button"
            onClick={hideToast}
            className="focus-ring rounded-full p-1 text-white/75 transition hover:bg-white/10 hover:text-white"
            aria-label="Закрыть уведомление"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
