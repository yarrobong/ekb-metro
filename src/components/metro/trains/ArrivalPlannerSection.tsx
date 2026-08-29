import { CalendarClock } from "lucide-react";

import type { ArrivalPlanResult, Station } from "../../../domain/metro";

interface ArrivalPlannerSectionProps {
  destination: Station | null;
  plannedArrivalResult: ArrivalPlanResult | null;
  onOpen: () => void;
}

export function ArrivalPlannerSection({
  destination,
  plannedArrivalResult,
  onOpen,
}: ArrivalPlannerSectionProps) {
  if (!destination) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="focus-ring w-full rounded-card border border-border-light bg-surface p-5 text-left shadow-card transition hover:bg-surface-hover active:scale-[0.995]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <CalendarClock size={18} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              {plannedArrivalResult?.status === "success"
                ? `Прибыть к ${plannedArrivalResult.request.desiredTimeString}`
                : "Прибыть ко времени"}
            </h3>
            {plannedArrivalResult?.status === "success" &&
            plannedArrivalResult.recommended ? (
              <>
                <p className="mt-1 text-sm text-text-secondary">
                  Поезд в{" "}
                  <span className="font-semibold text-text-primary tabular-nums">
                    {plannedArrivalResult.recommended.departureDisplayTime}
                  </span>
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Прибытие примерно в{" "}
                  {plannedArrivalResult.recommended.arrivalDisplayTime}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                Рассчитаем, на какой поезд сесть, чтобы приехать к нужному времени.
              </p>
            )}
          </div>
        </div>
        <span className="shrink-0 text-sm font-medium text-accent">
          {plannedArrivalResult?.status === "success" ? "Изменить" : "Настроить"}
        </span>
      </div>
    </button>
  );
}
