import type { ReactNode } from "react";
import { useEffect } from "react";
import { ChevronDown } from "lucide-react";

import { IconButton } from "./IconButton";

interface FullScreenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function FullScreenDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
}: FullScreenDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fullscreen-dialog-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-app-bg"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="fullscreen-dialog-title"
              className="text-3xl font-bold tracking-tight text-text-primary"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-base leading-6 text-text-secondary">
                {description}
              </p>
            )}
          </div>

          <IconButton
            onClick={onClose}
            label="Закрыть выбор направления"
            className="shrink-0 border-border-light bg-surface-raised"
          >
            <ChevronDown size={22} aria-hidden="true" />
          </IconButton>
        </div>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
