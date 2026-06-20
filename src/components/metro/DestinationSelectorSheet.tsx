import { Check, ChevronRight, Route, TrainFront } from "lucide-react";

import {
  formatApproximateTravelTime,
  formatStationCount,
  type DestinationOption,
} from "../../domain/metro";
import type { StationId } from "../../domain/metro/metro.types";
import { cn } from "../../lib/cn";

interface DestinationSelectorSheetProps {
  options: DestinationOption[];
  selectedDestinationId: StationId | null;
  onSelect: (stationId: StationId) => void;
}

export function DestinationSelectorSheet({
  options,
  selectedDestinationId,
  onSelect,
}: DestinationSelectorSheetProps) {
  return (
    <div className="max-h-[70vh] overflow-y-auto pr-1">
      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const isSelected = option.station.id === selectedDestinationId;

          return (
            <button
              key={option.station.id}
              type="button"
              onClick={() => onSelect(option.station.id)}
              aria-pressed={isSelected}
              className={cn(
                "focus-ring group flex min-h-[72px] items-center justify-between rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99]",
                isSelected
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface hover:border-accent hover:bg-accent-muted",
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full transition",
                    isSelected
                      ? "bg-accent text-white"
                      : "bg-surface-raised text-text-secondary group-hover:text-accent",
                  )}
                >
                  <TrainFront size={20} aria-hidden="true" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-text-primary">
                      {option.station.name}
                    </p>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                        <Check size={12} aria-hidden="true" />
                        Выбрано
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-text-secondary">
                    {formatStationCount(option.stationCount)} ·{" "}
                    {formatApproximateTravelTime(option.travelSeconds).toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-text-secondary group-hover:text-text-primary">
                <Route size={16} aria-hidden="true" />
                <ChevronRight size={18} aria-hidden="true" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
