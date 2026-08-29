import { MapPin, Route, TrainFront, X } from "lucide-react";
import type { RefObject } from "react";

import type { ArrivalPlanResult, Station, TravelEstimate } from "../../../domain/metro";
import { formatRelativeTime } from "../../../domain/time";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { RouteProgressCard } from "../RouteProgressCard";

interface DestinationSectionProps {
  currentStation: Station;
  selectedDestination: Station | null;
  isDestinationValid: boolean;
  travelEstimate: TravelEstimate | null;
  plannedArrivalResult: ArrivalPlanResult | null;
  destinationTriggerRef: RefObject<HTMLButtonElement | null>;
  onClearDestination: () => void;
  onOpenDestinationSheet: () => void;
  onReportIssue: () => void;
}

export function DestinationSection({
  currentStation,
  selectedDestination,
  isDestinationValid,
  travelEstimate,
  plannedArrivalResult,
  destinationTriggerRef,
  onClearDestination,
  onOpenDestinationSheet,
  onReportIssue,
}: DestinationSectionProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Route size={18} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Куда едете?</h3>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              Выберите станцию, чтобы рассчитать время поездки.
            </p>
          </div>
        </div>
        {selectedDestination && isDestinationValid && (
          <button
            type="button"
            onClick={onClearDestination}
            className="focus-ring rounded-full p-2 text-text-secondary transition hover:bg-surface-hover hover:text-text-primary"
            aria-label="Сбросить станцию назначения"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {!travelEstimate ? (
        selectedDestination && isDestinationValid ? (
          <div className="mt-5 rounded-2xl border border-warning/40 bg-warning/10 p-4">
            <p className="font-medium text-text-primary">Не удалось рассчитать поездку</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Попробуйте выбрать станцию назначения заново или отправьте отчёт, если
              проблема повторяется.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={onOpenDestinationSheet}>
                Изменить станцию
              </Button>
              <Button variant="ghost" onClick={onReportIssue}>
                Сообщить об ошибке
              </Button>
            </div>
          </div>
        ) : (
          <Button
            ref={destinationTriggerRef}
            fullWidth
            variant="secondary"
            className="mt-5 justify-start"
            onClick={onOpenDestinationSheet}
          >
            <MapPin size={18} aria-hidden="true" />
            Выбрать станцию
          </Button>
        )
      ) : (
        <div className="mt-5 space-y-4">
          <RouteProgressCard
            currentStation={currentStation}
            destinationStation={travelEstimate.destination}
            routeStations={travelEstimate.routeStations}
            stationCount={travelEstimate.stationCount}
            travelSeconds={travelEstimate.travelSeconds}
          />
          <div className="rounded-2xl border border-border bg-surface-raised p-4">
            <div className="flex justify-end">
              <Button
                ref={destinationTriggerRef}
                variant="ghost"
                className="shrink-0"
                onClick={onOpenDestinationSheet}
              >
                Изменить
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-surface px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                  {travelEstimate.trainLabel}
                </p>
                <div className="mt-2 flex items-center gap-2 text-text-primary">
                  <TrainFront size={16} aria-hidden="true" className="text-accent" />
                  <span className="text-lg font-semibold tabular-nums">
                    {travelEstimate.boardingTimeLabel}
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-surface px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Ориентировочное прибытие
                </p>
                <p className="mt-2 text-lg font-semibold text-text-primary tabular-nums">
                  {travelEstimate.arrivalTimeLabel}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-text-secondary">
              До прибытия вместе с ожиданием: примерно{" "}
              {travelEstimate.roundedTotalMinutesUntilArrival === 1
                ? "1 минута"
                : formatRelativeTime(
                    travelEstimate.roundedTotalMinutesUntilArrival * 60,
                    false,
                  )}
              .
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              Расчёт ориентировочный и основан на нормативных временах перегонов.
            </p>
            {plannedArrivalResult?.status === "success" &&
              plannedArrivalResult.recommended && (
                <div className="mt-4 rounded-xl border border-accent/20 bg-accent/8 px-4 py-3">
                  <p className="text-sm font-medium text-text-primary">
                    План: прибыть к {plannedArrivalResult.request.desiredTimeString}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Рекомендуемый поезд в{" "}
                    <span className="font-semibold text-text-primary tabular-nums">
                      {plannedArrivalResult.recommended.departureDisplayTime}
                    </span>
                  </p>
                </div>
              )}
          </div>
        </div>
      )}
    </Card>
  );
}
