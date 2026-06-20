import { Download, RefreshCcw } from "lucide-react";

import { usePwa } from "../../app/usePwa";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function PwaUpdateBanner() {
  const { updateAvailable, isApplyingUpdate, applyUpdate, dismissUpdatePrompt } =
    usePwa();

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 px-4 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-[520px]">
        <Card className="pointer-events-auto border-accent/40 bg-surface-raised/95 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Download size={18} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-text-primary">Доступно обновление</p>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                Обновлено расписание или улучшена работа приложения.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button disabled={isApplyingUpdate} onClick={() => void applyUpdate()}>
              <RefreshCcw size={16} aria-hidden="true" />
              {isApplyingUpdate ? "Обновляем..." : "Обновить"}
            </Button>
            <Button variant="ghost" onClick={dismissUpdatePrompt}>
              Позже
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
