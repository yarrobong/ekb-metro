import { ArrowRightLeft, Download, MapPin } from "lucide-react";

import { useTrainsPageModel } from "./trains/useTrainsPageModel";
import {
  buildScheduleCardContext,
  buildSummaryAriaLabel,
  getRuntimeDayTypeLabel,
} from "./trains/trainsPage.utils";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DestinationSelectorSheet } from "../components/metro/DestinationSelectorSheet";
import { ScheduleSummaryCard } from "../components/metro/ScheduleSummaryCard";
import { ArrivalPlannerSection } from "../components/metro/trains/ArrivalPlannerSection";
import { DestinationSection } from "../components/metro/trains/DestinationSection";
import { DirectionSelector } from "../components/metro/trains/DirectionSelector";
import { EmptyTrainState } from "../components/metro/trains/EmptyTrainState";
import { NextTrainCard } from "../components/metro/trains/NextTrainCard";
import { UpcomingTrainsList } from "../components/metro/trains/UpcomingTrainsList";
import { reportIssue } from "../lib/userActions";

export function TrainsPage() {
  const model = useTrainsPageModel();

  if (!model.hasRouteSelection) {
    return <EmptyTrainState onSelectStation={() => model.setScreen("stations")} />;
  }

  if (!model.metroState || !model.station) {
    return null;
  }

  const handleReportIssue = () => {
    if (!model.selectedStationId || !model.selectedDirectionId) {
      return;
    }

    reportIssue({
      stationId: model.selectedStationId,
      directionId: model.selectedDirectionId,
      destinationId: model.selectedDestinationId,
      metroState: model.metroState,
    });
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between gap-3 rounded-2xl bg-surface-raised p-4">
        <div className="min-w-0">
          <p className="mb-1 text-xs uppercase tracking-wider text-text-secondary">
            Текущая станция
          </p>
          <div className="flex min-w-0 items-start gap-2">
            <MapPin
              size={18}
              className="mt-0.5 shrink-0 text-accent"
              aria-hidden="true"
            />
            <h2 className="station-name min-w-0 text-lg font-bold leading-tight text-text-primary">
              {model.station.name}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => model.setScreen("stations")}
          className="focus-ring shrink-0 rounded-lg bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent transition hover:text-accent-hover"
        >
          Изменить
        </button>
      </div>

      <DirectionSelector
        directions={model.directions}
        selectedDirectionId={model.selectedDirectionId}
        onSelect={model.selectDirection}
      />

      <div className="flex items-start gap-3 px-2">
        <ArrowRightLeft
          size={16}
          className={`mt-0.5 shrink-0 ${model.nextStation ? "text-text-disabled" : "text-danger"}`}
          aria-hidden="true"
        />
        <p
          className={`min-w-0 text-sm leading-5 ${model.nextStation ? "text-text-secondary" : "text-danger"}`}
        >
          {model.nextStation ? (
            <>
              Следующая станция:{" "}
              <span className="station-name font-medium text-text-primary">
                {model.nextStation.name}
              </span>
            </>
          ) : (
            "Не удалось определить следующую станцию."
          )}
        </p>
      </div>

      <NextTrainCard
        state={model.metroState}
        showSeconds={model.showSeconds}
        onReportIssue={handleReportIssue}
      />
      <UpcomingTrainsList
        trains={model.metroState.next}
        showSeconds={model.showSeconds}
      />

      {model.daySchedule && (
        <ScheduleSummaryCard
          contextLabel={buildScheduleCardContext(model.daySchedule)}
          firstTrain={model.daySchedule.firstTrain}
          lastTrain={model.daySchedule.lastTrain}
          onOpen={() => {
            model.clearScheduleContext();
            model.setScreen("schedule");
          }}
          accessibleSummary={buildSummaryAriaLabel(model.daySchedule)}
        />
      )}

      <DestinationSection
        currentStation={model.station}
        selectedDestination={model.selectedDestination}
        isDestinationValid={model.isDestinationValid}
        travelEstimate={model.travelEstimate}
        plannedArrivalResult={model.plannedArrivalResult}
        destinationTriggerRef={model.destinationTriggerRef}
        onClearDestination={model.clearDestination}
        onOpenDestinationSheet={model.openDestinationSheet}
        onReportIssue={handleReportIssue}
      />

      {model.selectedDestination && model.isDestinationValid && (
        <ArrivalPlannerSection
          destination={model.selectedDestination}
          plannedArrivalResult={model.plannedArrivalResult}
          onOpen={() => model.setScreen("arrival-plan")}
        />
      )}

      {model.shouldShowInstallPrompt && (
        <Card className="border-accent/30 bg-surface-raised/90">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Download size={18} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary">
                Добавьте приложение на главный экран
              </h3>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                Так расписание будет открываться быстрее и сможет работать без интернета.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {model.installMethod === "prompt" ? (
              <Button onClick={() => void model.openInstallPrompt()}>Установить</Button>
            ) : (
              <Button onClick={() => model.setScreen("install")}>Как установить</Button>
            )}
            <Button variant="ghost" onClick={model.dismissInstallPrompt}>
              Позже
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-8 space-y-2 text-center opacity-60">
        <p className="mb-2 inline-block rounded-lg bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-primary">
          {getRuntimeDayTypeLabel(model.metroState.dayType)}
        </p>
        {model.metroState.isPreviousOperationalDay && (
          <p className="text-xs text-text-secondary">
            После полуночи показывается поезд предыдущего операционного дня.
          </p>
        )}
        <p className="mx-auto max-w-xs text-[11px] leading-relaxed text-text-secondary">
          Время рассчитано по расписанию. Фактическое движение поездов может отличаться.
        </p>
      </div>

      <BottomSheet
        isOpen={model.isDestinationSheetOpen}
        onClose={model.closeDestinationSheetAndRestoreFocus}
        title="Выберите станцию назначения"
        description={`Направление: ${model.direction?.terminus === "botanicheskaya" ? "Ботаническая" : "Проспект Космонавтов"}`}
      >
        <DestinationSelectorSheet
          options={model.destinationOptions}
          selectedDestinationId={model.selectedDestinationId}
          onSelect={model.selectDestinationAndRestoreFocus}
        />
      </BottomSheet>
    </div>
  );
}
