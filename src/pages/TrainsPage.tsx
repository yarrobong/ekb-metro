import { useEffect, useMemo, useRef } from "react";
import {
  Clock3,
  MapPin,
  ArrowRightLeft,
  AlertTriangle,
  Route,
  TrainFront,
  X,
  Download,
} from "lucide-react";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { BottomSheet } from "../components/ui/BottomSheet";
import { DestinationSelectorSheet } from "../components/metro/DestinationSelectorSheet";
import { RouteProgressCard } from "../components/metro/RouteProgressCard";
import { useAppStore } from "../app/store";
import { usePwa } from "../app/usePwa";
import { getStationById, getDirectionById, getNextStation } from "../domain/metro";
import { cn } from "../lib/cn";
import { useLiveMetroTime } from "../app/hooks/useLiveMetroTime";
import { resolveMetroState } from "../domain/metro/schedule.service";
import { formatRelativeTime, formatTimer } from "../domain/time";
import { buildTravelEstimate, getDestinationOptions } from "../domain/metro";
import { reportIssue } from "../lib/userActions";

function formatDateRussian(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function shiftDateString(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getTrainCalendarDate(operationalDate: string, scheduleTime: string) {
  const [hours] = scheduleTime.split(":");
  const dayOffset = Math.floor(Number(hours) / 24);
  return shiftDateString(operationalDate, dayOffset);
}

function getRelativeDateLabel(targetDate: string, referenceDate: string) {
  if (targetDate === referenceDate) {
    return "сегодня";
  }

  if (targetDate === shiftDateString(referenceDate, 1)) {
    return "завтра";
  }

  return formatDateRussian(targetDate);
}

export function TrainsPage() {
  const {
    selectedStationId,
    selectedDirectionId,
    selectedDestinationId,
    setScreen,
    selectDirection,
    selectDestination,
    clearDestination,
    isDestinationSheetOpen,
    openDestinationSheet,
    closeDestinationSheet,
    showSeconds,
    showToast,
  } = useAppStore();
  const {
    installMethod,
    shouldShowInstallPrompt,
    dismissInstallPrompt,
    openInstallPrompt,
  } = usePwa();

  const metroTime = useLiveMetroTime();
  const destinationTriggerRef = useRef<HTMLButtonElement>(null);
  const hasRouteSelection = Boolean(selectedStationId && selectedDirectionId);
  const station = selectedStationId ? getStationById(selectedStationId) : null;
  const nextStation =
    selectedStationId && selectedDirectionId
      ? getNextStation(selectedStationId, selectedDirectionId)
      : null;
  const direction = selectedDirectionId ? getDirectionById(selectedDirectionId) : null;
  const metroState =
    selectedStationId && selectedDirectionId
      ? resolveMetroState(selectedStationId, selectedDirectionId, metroTime)
      : null;
  const destinationOptions = useMemo(() => {
    if (!selectedStationId || !selectedDirectionId) {
      return [];
    }

    return getDestinationOptions(selectedStationId, selectedDirectionId);
  }, [selectedDirectionId, selectedStationId]);
  const selectedDestination = selectedDestinationId
    ? getStationById(selectedDestinationId)
    : null;
  const isDestinationValid = destinationOptions.some(
    (option) => option.station.id === selectedDestinationId,
  );
  const travelEstimate =
    selectedStationId &&
    selectedDirectionId &&
    selectedDestinationId &&
    isDestinationValid &&
    metroState
      ? buildTravelEstimate(
          selectedStationId,
          selectedDestinationId,
          selectedDirectionId,
          metroState,
          metroTime,
        )
      : null;

  useEffect(() => {
    if (selectedDestinationId && !isDestinationValid) {
      clearDestination();
    }
  }, [clearDestination, isDestinationValid, selectedDestinationId]);

  if (!hasRouteSelection) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Следующий поезд"
          description="Сначала необходимо выбрать текущую станцию."
        />

        <Card className="text-center">
          <Clock3 size={44} className="mx-auto text-accent" aria-hidden="true" />

          <p className="mt-4 text-lg font-semibold">Станция не выбрана</p>

          <p className="mt-2 text-sm leading-6 text-text-secondary">
            После выбора станции здесь появятся таймер и следующие поезда.
          </p>

          <Button
            fullWidth
            className="mt-6"
            onClick={() => {
              setScreen("stations");
            }}
          >
            Выбрать станцию
          </Button>
        </Card>
      </div>
    );
  }

  if (!metroState) {
    return null;
  }

  const firstTrainCalendarDate = metroState.firstTrain
    ? getTrainCalendarDate(metroState.operationalDate, metroState.firstTrain.scheduleTime)
    : null;
  const firstTrainRelativeDate = firstTrainCalendarDate
    ? getRelativeDateLabel(firstTrainCalendarDate, metroTime.dateString)
    : null;
  const beforeOpenDateLabel =
    firstTrainCalendarDate === metroTime.dateString
      ? "Первый поезд сегодня"
      : firstTrainCalendarDate
        ? `Первый поезд ${formatDateRussian(firstTrainCalendarDate)}`
        : "Первый поезд";

  const handleCloseDestinationSheet = () => {
    closeDestinationSheet();
    window.requestAnimationFrame(() => {
      destinationTriggerRef.current?.focus();
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Current Station Header */}
      <div className="flex items-center justify-between bg-surface-raised p-4 rounded-2xl">
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
            Текущая станция
          </p>
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-accent" />
            <h2 className="text-lg font-bold text-text-primary">{station?.name}</h2>
          </div>
        </div>
        <button
          onClick={() => setScreen("stations")}
          className="focus-ring text-sm font-medium text-accent hover:text-accent-hover transition px-3 py-1.5 bg-accent/10 rounded-lg"
        >
          Изменить
        </button>
      </div>

      {/* Direction Toggle */}
      {station && station.availableDirections.length > 1 && (
        <div className="bg-surface-raised p-1.5 rounded-xl flex gap-1 relative overflow-hidden">
          {station.availableDirections.map((dirId) => {
            const dir = getDirectionById(dirId);
            const isActive = dirId === selectedDirectionId;
            return (
              <button
                key={dirId}
                type="button"
                aria-pressed={isActive}
                onClick={() => selectDirection(dirId)}
                className={cn(
                  "focus-ring relative flex-1 py-2.5 text-sm font-medium rounded-lg transition-all",
                  isActive
                    ? "text-white bg-surface shadow-sm"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {dir?.shortName || dir?.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Single direction info (if terminus) */}
      {station && station.availableDirections.length === 1 && (
        <div className="bg-surface-raised p-4 rounded-xl flex items-center justify-center">
          <p className="text-sm font-medium text-text-secondary text-center">
            Направление: <span className="text-text-primary">{direction?.name}</span>
          </p>
        </div>
      )}

      {/* Next Station Info */}
      {nextStation && (
        <div className="flex items-center gap-3 px-2">
          <ArrowRightLeft size={16} className="text-text-disabled" />
          <p className="text-sm text-text-secondary">
            Следующая станция:{" "}
            <span className="font-medium text-text-primary">{nextStation.name}</span>
          </p>
        </div>
      )}
      {!nextStation && (
        <div className="flex items-center gap-3 px-2">
          <ArrowRightLeft size={16} className="text-error" />
          <p className="text-sm text-error">Не удалось определить следующую станцию.</p>
        </div>
      )}

      {/* Timer Card */}
      {metroState?.status === "error" ? (
        <Card className="text-center py-10">
          <AlertTriangle size={36} className="mx-auto text-warning mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Нет данных</h3>
          <p className="text-sm text-text-secondary px-4">
            {metroState.message ||
              "Не удалось обработать расписание для выбранного направления."}
          </p>
          <Button
            variant="ghost"
            className="mt-5"
            onClick={() => {
              reportIssue({
                stationId: selectedStationId,
                directionId: selectedDirectionId,
                destinationId: selectedDestinationId,
                metroState,
              });
            }}
          >
            Сообщить об ошибке
          </Button>
        </Card>
      ) : metroState?.status === "before_open" || metroState?.status === "after_close" ? (
        <Card className="overflow-hidden border-border/80 bg-linear-to-b from-surface-raised via-surface-raised to-surface py-8">
          <div className="text-center">
            <p className="text-sm font-medium text-text-secondary mb-4 uppercase tracking-wider">
              {metroState.status === "before_open"
                ? "Метро пока закрыто"
                : "Метро закрыто"}
            </p>

            <div className="tabular-nums text-6xl sm:text-7xl font-bold tracking-tight mb-4 text-text-primary">
              {formatTimer(metroState.secondsUntilFirstTrain ?? 0, showSeconds)}
            </div>

            <p className="text-lg font-medium text-text-primary">
              {metroState.status === "before_open"
                ? "До первого поезда"
                : "До первого поезда следующего дня"}
            </p>

            {metroState.status === "after_close" && (
              <p className="mt-3 text-sm text-text-secondary">
                Поездов по этому направлению больше нет
              </p>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-white/8 bg-black/10 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
                  {metroState.status === "before_open"
                    ? beforeOpenDateLabel
                    : "Первый поезд следующего операционного дня"}
                </p>
                <div className="mt-3 flex items-end gap-3">
                  <p className="text-3xl font-bold tabular-nums text-text-primary">
                    {metroState.firstTrain?.displayTime}
                  </p>
                  {firstTrainRelativeDate && (
                    <span className="rounded-full bg-accent/12 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                      {firstTrainRelativeDate}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-wide text-text-secondary">
                  Направление
                </p>
                <p className="mt-2 max-w-44 text-sm font-medium leading-5 text-text-primary">
                  {direction?.name}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-surface px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Точное время
                </p>
                <p className="mt-2 text-lg font-semibold tabular-nums text-text-primary">
                  {metroState.firstTrain?.displayTime}
                </p>
              </div>

              <div className="rounded-xl bg-surface px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                  Время до отправления
                </p>
                <p className="mt-2 text-lg font-semibold text-text-primary">
                  {formatRelativeTime(
                    metroState.secondsUntilFirstTrain ?? 0,
                    showSeconds,
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>
      ) : metroState?.nearest ? (
        <Card
          className={cn(
            "text-center py-8 relative overflow-hidden transition-colors duration-500",
            metroState.nearest.status === "approaching" &&
              "border-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]",
            metroState.nearest.status === "arriving" && "bg-accent/10 border-accent",
          )}
        >
          <p className="text-sm font-medium text-text-secondary mb-4 uppercase tracking-wider">
            {metroState.isPreviousOperationalDay
              ? "Ночной поезд предыдущего дня"
              : "Следующий поезд"}
          </p>

          <div className="tabular-nums text-6xl sm:text-7xl font-bold tracking-tight mb-4 text-text-primary">
            {metroState.nearest.status === "arriving" ? (
              <span className="text-5xl sm:text-6xl text-accent motion-safe:animate-pulse">
                Поезд прибывает
              </span>
            ) : metroState.nearest.status === "approaching" && !showSeconds ? (
              <span className="text-5xl sm:text-6xl text-accent">Меньше минуты</span>
            ) : (
              formatTimer(metroState.nearest.secondsLeft, showSeconds)
            )}
          </div>

          <p
            className={cn(
              "text-lg font-medium",
              metroState.nearest.status === "approaching" &&
                "text-accent motion-safe:animate-pulse",
              metroState.nearest.status === "arriving" && "text-accent",
            )}
          >
            {metroState.nearest.status === "arriving"
              ? "По расписанию"
              : metroState.nearest.status === "approaching"
                ? "Поезд приближается"
                : `Прибытие в ${metroState.nearest.displayTime}`}
          </p>

          {metroState.nearest.status !== "waiting" && (
            <p className="mt-2 text-sm text-text-secondary">
              Точное время: {metroState.nearest.displayTime}
            </p>
          )}

          {metroState.nearest.isLastTrain && (
            <div className="mx-auto mt-4 max-w-md rounded-2xl border border-warning/35 bg-warning/10 px-4 py-3">
              <p className="flex items-center justify-center gap-2 text-sm font-semibold text-text-primary">
                <TrainFront
                  size={16}
                  className="shrink-0 text-warning"
                  aria-hidden="true"
                />
                Последний поезд
              </p>
              <p className="mt-1 text-sm leading-5 text-text-secondary">
                После него поездов по этому направлению сегодня больше не будет
              </p>
            </div>
          )}
        </Card>
      ) : null}

      {/* Next Trains List */}
      {metroState && metroState.next.length > 0 && (
        <div className="bg-surface-raised rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3 px-2">
            Следующие поезда
          </h3>
          <ul className="space-y-1">
            {metroState.next.map((train) => (
              <li
                key={train.scheduleTime}
                className="grid grid-cols-[minmax(0,max-content)_minmax(0,1fr)] items-center gap-x-4 gap-y-1 rounded-lg px-2 py-2 sm:gap-x-6"
              >
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <span className="text-lg font-medium tabular-nums text-text-primary">
                    {train.displayTime}
                  </span>
                  {train.isLastTrain && (
                    <span className="shrink-0 rounded bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                      последний
                    </span>
                  )}
                </div>
                <span className="min-w-0 text-right text-sm font-medium text-text-secondary">
                  через {formatRelativeTime(train.secondsLeft, showSeconds)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
              onClick={clearDestination}
              className="focus-ring rounded-full p-2 text-text-secondary transition hover:bg-surface-hover hover:text-text-primary"
              aria-label="Сбросить станцию назначения"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        {!travelEstimate ? (
          selectedDestinationId && isDestinationValid ? (
            <div className="mt-5 rounded-2xl border border-warning/40 bg-warning/10 p-4">
              <p className="font-medium text-text-primary">
                Не удалось рассчитать поездку
              </p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Попробуйте выбрать станцию назначения заново или отправьте отчёт, если
                проблема повторяется.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="secondary" onClick={openDestinationSheet}>
                  Изменить станцию
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    reportIssue({
                      stationId: selectedStationId,
                      directionId: selectedDirectionId,
                      destinationId: selectedDestinationId,
                      metroState,
                    });
                  }}
                >
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
              onClick={openDestinationSheet}
            >
              <MapPin size={18} aria-hidden="true" />
              Выбрать станцию
            </Button>
          )
        ) : (
          <div className="mt-5 space-y-4">
            <RouteProgressCard
              currentStation={station!}
              destinationStation={travelEstimate.destination}
              routeStations={travelEstimate.routeStations}
              stationCount={travelEstimate.stationCount}
              travelSeconds={travelEstimate.travelSeconds}
            />

            <div className="rounded-2xl border border-border bg-surface-raised p-4">
              <div className="flex items-start justify-between gap-4">
                <Button
                  ref={destinationTriggerRef}
                  variant="ghost"
                  className="ml-auto shrink-0"
                  onClick={openDestinationSheet}
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
                  <p className="mt-2 text-lg font-semibold tabular-nums text-text-primary">
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
            </div>
          </div>
        )}
      </Card>

      {shouldShowInstallPrompt && (
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
            {installMethod === "prompt" ? (
              <Button onClick={() => void openInstallPrompt()}>Установить</Button>
            ) : (
              <Button
                onClick={() => {
                  setScreen("install");
                }}
              >
                Как установить
              </Button>
            )}
            <Button variant="ghost" onClick={dismissInstallPrompt}>
              Позже
            </Button>
          </div>
        </Card>
      )}

      <div className="text-center space-y-2 mt-8 opacity-60">
        <p className="text-xs font-medium text-text-primary bg-surface-raised inline-block px-3 py-1.5 rounded-lg mb-2">
          {metroState.dayType === "weekend" ? "Выходной день" : "Рабочий день"}
        </p>
        <p className="text-[11px] leading-relaxed text-text-secondary max-w-xs mx-auto">
          Время рассчитано по расписанию. Фактическое движение поездов может отличаться.
        </p>
      </div>

      <BottomSheet
        isOpen={isDestinationSheetOpen}
        onClose={handleCloseDestinationSheet}
        title="Выберите станцию назначения"
        description={`Направление: ${direction?.terminus === "botanicheskaya" ? "Ботаническая" : "Проспект Космонавтов"}`}
      >
        <DestinationSelectorSheet
          options={destinationOptions}
          selectedDestinationId={selectedDestinationId}
          onSelect={(stationId) => {
            selectDestination(stationId);
            showToast("Маршрут обновлён", "success");
            window.requestAnimationFrame(() => {
              destinationTriggerRef.current?.focus();
            });
          }}
        />
      </BottomSheet>
    </div>
  );
}
