import { ArrowDownLeft, ArrowUpRight, ArrowRight } from "lucide-react";

import type { DirectionId, Station } from "../../domain/metro/metro.types";
import { getDirectionById } from "../../domain/metro";
import { cn } from "../../lib/cn";

export function DirectionSelectorModal({
  station,
  onSelect,
}: DirectionSelectorModalProps) {
  const directions = station.availableDirections
    .map((id) => getDirectionById(id)!)
    .sort((left, right) => left.indexDelta - right.indexDelta);

  return (
    <div className="flex flex-col gap-4">
      <div className="px-1">
        <p className="text-sm font-medium text-text-secondary">Выберите направление</p>
      </div>

      {directions.map((dir) => {
        const DirectionIcon = dir.indexDelta === 1 ? ArrowDownLeft : ArrowUpRight;

        return (
          <button
            key={dir.id}
            type="button"
            onClick={() => onSelect(dir.id)}
            aria-label={dir.name}
            className={cn(
              "focus-ring group relative overflow-hidden rounded-2xl border border-border-strong bg-surface px-5 py-4 text-left text-text-primary shadow-[0_12px_28px_-24px_rgba(16,24,32,0.4)] transition duration-200 hover:border-accent/50 hover:bg-accent-muted/60 active:scale-[0.985]",
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-raised text-text-secondary transition group-hover:border-accent/30 group-hover:bg-accent/10 group-hover:text-accent",
                  )}
                >
                  <DirectionIcon size={20} aria-hidden="true" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm leading-5 text-text-secondary">В сторону</p>
                  <p className="text-base font-semibold leading-5">
                    {dir.name.replace(/^В сторону\s+/i, "")}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-text-secondary transition group-hover:bg-accent/10 group-hover:text-accent",
                )}
              >
                <ArrowRight size={22} aria-hidden="true" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface DirectionSelectorModalProps {
  station: Station;
  onSelect: (directionId: DirectionId) => void;
}
