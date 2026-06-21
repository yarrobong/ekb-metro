import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarClock } from "lucide-react";

import { useLiveMetroTime } from "../app/hooks/useLiveMetroTime";
import { useAppStore } from "../app/store";
import {
  buildArrivalPlanRequest,
  formatApproximateTravelTime,
  formatStationCount,
  getDirectionById,
  getServiceDayContextForDate,
  getStationById,
  getTravelSummary,
  planArrivalByTime,
} from "../domain/metro";
import {
  formatMinutes,
  formatRussianDayMonth,
  formatRussianWeekdayDate,
  metroTimeToTimestamp,
  shiftMetroDateString,
  timestampToMetroDateString,
  timestampToMetroTimeString,
} from "../domain/time";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { cn } from "../lib/cn";

export function ArrivalPlanPage() {
  const {
    selectedStationId,
    selectedDirectionId,
    selectedDestinationId,
    arrivalPlanDraftDate,
    arrivalPlanDraftTime,
    arrivalPlanSubmittedDate,
    arrivalPlanSubmittedTime,
    setArrivalPlanDraft,
    submitArrivalPlan,
    clearArrivalPlanResult,
    setScheduleContext,
    setScreen,
  } = useAppStore();
  const metroTime = useLiveMetroTime();
  const nowTimestamp = metroTimeToTimestamp(metroTime);
  const station = selectedStationId ? getStationById(selectedStationId) : null;
  const direction = selectedDirectionId ? getDirectionById(selectedDirectionId) : null;
  const destination = selectedDestinationId
    ? getStationById(selectedDestinationId)
    : null;
  const travelSummary =
    selectedStationId && selectedDirectionId && selectedDestinationId
      ? getTravelSummary(selectedStationId, selectedDestinationId, selectedDirectionId)
      : null;
  const todayDate = metroTime.dateString;
  const tomorrowDate = shiftMetroDateString(todayDate, 1);
  const selectedDate = arrivalPlanDraftDate ?? todayDate;
  const selectedTime = arrivalPlanDraftTime ?? "19:00";
  const inferredDatePreset =
    selectedDate === todayDate
      ? "today"
      : selectedDate === tomorrowDate
        ? "tomorrow"
        : "custom";
  const [datePresetOverride, setDatePresetOverride] = useState<
    "today" | "tomorrow" | "custom" | null
  >(null);
  const selectedDatePreset = datePresetOverride ?? inferredDatePreset;
  const customMaxDate = shiftMetroDateString(todayDate, 30);
  const isDraftTimeValid = /^\d{2}:\d{2}$/.test(selectedTime);
  const canCalculate = Boolean(selectedDate && isDraftTimeValid);

  useEffect(() => {
    if (arrivalPlanDraftDate && arrivalPlanDraftTime) {
      return;
    }

    const defaultTimestamp = roundTimestampToFiveMinutes(nowTimestamp + 60 * 60 * 1000);
    setArrivalPlanDraft({
      date: timestampToMetroDateString(defaultTimestamp),
      time: timestampToMetroTimeString(defaultTimestamp),
    });
  }, [arrivalPlanDraftDate, arrivalPlanDraftTime, nowTimestamp, setArrivalPlanDraft]);

  const planRequest =
    selectedStationId &&
    selectedDirectionId &&
    selectedDestinationId &&
    arrivalPlanSubmittedDate &&
    arrivalPlanSubmittedTime
      ? buildArrivalPlanRequest({
          originStationId: selectedStationId,
          destinationStationId: selectedDestinationId,
          directionId: selectedDirectionId,
          desiredDateString: arrivalPlanSubmittedDate,
          desiredTimeString: arrivalPlanSubmittedTime,
          nowTimestamp,
        })
      : null;

  const planResult = useMemo(
    () => (planRequest ? planArrivalByTime(planRequest) : null),
    [planRequest],
  );

  if (!selectedStationId || !selectedDirectionId || !station || !direction) {
    return (
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <Button variant="ghost" className="px-3" onClick={() => setScreen("trains")}>
            <ArrowLeft size={18} aria-hidden="true" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Прибыть ко времени
          </h1>
        </header>

        <Card className="text-center">
          <p className="text-lg font-semibold text-text-primary">
            Сначала выберите маршрут
          </p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            После выбора станции, направления и назначения здесь появится планирование
            поездки.
          </p>
          <Button fullWidth className="mt-6" onClick={() => setScreen("stations")}>
            Выбрать маршрут
          </Button>
        </Card>
      </div>
    );
  }

  if (!destination || !travelSummary) {
    return (
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <Button variant="ghost" className="px-3" onClick={() => setScreen("trains")}>
            <ArrowLeft size={18} aria-hidden="true" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Прибыть ко времени
          </h1>
        </header>

        <Card className="text-center">
          <p className="text-lg font-semibold text-text-primary">
            Сначала выберите станцию назначения
          </p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Планировщик определяет поезд только после выбора конечной станции.
          </p>
          <Button fullWidth className="mt-6" onClick={() => setScreen("trains")}>
            Вернуться к маршруту
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="sticky top-0 z-20 -mx-4 border-b border-border-light bg-app-bg/95 px-4 pb-4 pt-1 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="px-3" onClick={() => setScreen("trains")}>
            <ArrowLeft size={18} aria-hidden="true" />
            Назад
          </Button>
        </div>

        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Прибыть ко времени
          </h1>

          <div className="mt-4 rounded-card border border-border-light bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="station-name text-lg font-semibold text-text-primary">
                  {station.name} <span className="text-text-secondary">→</span>{" "}
                  {destination.name}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {formatStationCount(travelSummary.stationCount)} ·{" "}
                  {formatApproximateTravelTime(travelSummary.travelSeconds).toLowerCase()}
                </p>
              </div>

              <Button
                variant="ghost"
                className="shrink-0 px-3"
                onClick={() => setScreen("trains")}
              >
                Изменить маршрут
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <div className="flex items-start gap-3">
          <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <CalendarClock size={18} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Когда нужно прибыть?
            </h2>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              Выберите дату и время Екатеринбурга. Вход в метро и ожидание на платформе не
              учитываются.
            </p>
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label="Выбор даты прибытия"
          className="mt-5 grid min-h-11 grid-cols-3 gap-1 rounded-2xl bg-surface-raised p-1"
        >
          {[
            { value: "today", label: "Сегодня", date: todayDate },
            { value: "tomorrow", label: "Завтра", date: tomorrowDate },
            { value: "custom", label: "Другая дата", date: selectedDate },
          ].map((option) => {
            const isActive = selectedDatePreset === option.value;

            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => {
                  const nextDate = option.value === "custom" ? selectedDate : option.date;
                  setDatePresetOverride(option.value === "custom" ? "custom" : null);
                  setArrivalPlanDraft({
                    date: nextDate,
                    time: selectedTime,
                  });
                  clearArrivalPlanResult();
                }}
                className={cn(
                  "focus-ring min-h-11 rounded-xl px-2 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl bg-surface-raised px-4 py-3">
          <p className="text-sm font-medium text-text-primary">
            {formatSelectedDateLabel(selectedDate, todayDate)}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {formatDayTypeLabel(selectedDate)}
          </p>
        </div>

        {selectedDatePreset === "custom" && (
          <label className="mt-4 block">
            <span className="text-sm font-medium text-text-primary">Дата поездки</span>
            <input
              type="date"
              value={selectedDate}
              min={todayDate}
              max={customMaxDate}
              onChange={(event) => {
                setDatePresetOverride("custom");
                setArrivalPlanDraft({
                  date: event.target.value,
                  time: selectedTime,
                });
                clearArrivalPlanResult();
              }}
              className="focus-ring mt-2 min-h-11 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary"
            />
          </label>
        )}

        <label className="mt-4 block">
          <span className="text-sm font-medium text-text-primary">Время прибытия</span>
          <span className="mt-1 block text-xs text-text-secondary">
            Время Екатеринбурга
          </span>
          <input
            type="time"
            value={selectedTime}
            step={300}
            onChange={(event) => {
              setArrivalPlanDraft({
                date: selectedDate,
                time: event.target.value,
              });
              clearArrivalPlanResult();
            }}
            className="focus-ring mt-2 min-h-11 w-full rounded-xl border border-border bg-surface px-4 py-3 text-2xl font-semibold tabular-nums text-text-primary"
          />
        </label>

        <Button
          fullWidth
          className="mt-5"
          disabled={!canCalculate}
          onClick={() => {
            submitArrivalPlan({
              date: selectedDate,
              time: selectedTime,
            });
          }}
        >
          Рассчитать поездку
        </Button>
      </Card>

      {planResult && (
        <ArrivalPlanResultView
          result={planResult}
          stationName={station.name}
          destinationName={destination.name}
          onOpenSchedule={() => {
            setScheduleContext({
              date: planResult.request.desiredDateString,
              highlightedTrainTime: planResult.recommended?.sourceTime ?? null,
              highlightLabel: `Подходит для прибытия к ${planResult.request.desiredTimeString}`,
              returnScreen: "arrival-plan",
            });
            setScreen("schedule");
          }}
          onApplySuggestion={(timeString) => {
            setArrivalPlanDraft({
              date: selectedDate,
              time: timeString,
            });
            submitArrivalPlan({
              date: selectedDate,
              time: timeString,
            });
          }}
        />
      )}
    </div>
  );
}

interface ArrivalPlanResultViewProps {
  result: ReturnType<typeof planArrivalByTime>;
  stationName: string;
  destinationName: string;
  onOpenSchedule: () => void;
  onApplySuggestion: (timeString: string) => void;
}

function ArrivalPlanResultView({
  result,
  stationName,
  destinationName,
  onOpenSchedule,
  onApplySuggestion,
}: ArrivalPlanResultViewProps) {
  if (result.status === "success" && result.recommended) {
    const recommended = result.recommended;

    return (
      <Card aria-live="polite">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          Успеваете
        </p>
        <p className="mt-3 text-sm text-text-secondary">
          Нужно прибыть к {result.request.desiredTimeString}
        </p>
        <p className="mt-2 text-sm text-text-secondary">Садитесь на поезд в</p>
        <p className="mt-1 text-5xl font-bold tabular-nums tracking-tight text-text-primary">
          {recommended.departureDisplayTime}
        </p>

        <div className="mt-4 rounded-2xl bg-surface-raised px-4 py-4">
          <p className="station-name text-base font-semibold text-text-primary">
            {stationName}
          </p>
          <p className="my-2 text-sm text-text-secondary">↓</p>
          <p className="station-name text-base font-semibold text-text-primary">
            {destinationName}
          </p>
        </div>

        <p className="mt-4 text-base text-text-primary">
          Прибытие примерно в {recommended.arrivalDisplayTime}
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          {recommended.bufferMinutes === 0
            ? "Прибытие точно к выбранному времени"
            : `Запас: ${formatMinutes(recommended.bufferMinutes)}`}
        </p>

        {result.message && (
          <div className="mt-4 rounded-2xl border border-border bg-surface-raised px-4 py-3 text-sm text-text-secondary">
            {result.message}
          </div>
        )}

        {result.earlierAlternatives.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-semibold text-text-primary">
              Более ранние варианты
            </p>
            <div className="mt-3 space-y-2">
              {result.earlierAlternatives.map((candidate) => (
                <div
                  key={`${candidate.departureTimestamp}-${candidate.arrivalTimestamp}`}
                  className="flex items-center justify-between rounded-2xl bg-surface-raised px-4 py-3 text-sm"
                >
                  <span className="tabular-nums font-semibold text-text-primary">
                    {candidate.departureDisplayTime}
                  </span>
                  <span className="text-text-secondary">
                    прибытие в {candidate.arrivalDisplayTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={onOpenSchedule}>
            Открыть полное расписание
          </Button>
        </div>

        <div className="mt-5 space-y-1 text-xs leading-5 text-text-secondary">
          <p>
            Расчёт основан на расписании. Фактическое движение поездов может отличаться.
          </p>
          <p>Время на вход в метро и ожидание на платформе не учитывается.</p>
        </div>
      </Card>
    );
  }

  const fallbackTitle =
    result.failureReason === "too-early"
      ? "К этому времени доехать не получится"
      : result.failureReason === "all-trains-passed"
        ? "Подходящие поезда уже ушли"
        : result.failureReason === "no-schedule"
          ? "Для выбранной даты расписание не найдено"
          : "Не удалось рассчитать поездку";
  const fallbackDescription =
    result.failureReason === "too-early" && result.firstPossibleArrival
      ? `Первый поезд позволит прибыть примерно в ${result.firstPossibleArrival.arrivalDisplayTime}.`
      : result.failureReason === "all-trains-passed" && result.nearestFutureArrival
        ? `Ближайший поезд прибудет примерно в ${result.nearestFutureArrival.arrivalDisplayTime}.`
        : result.failureReason === "no-train-arrives-in-time" &&
            result.lastAvailableArrival
          ? `Последний доступный поезд прибывает примерно в ${result.lastAvailableArrival.arrivalDisplayTime}.`
          : (result.message ?? "Попробуйте изменить дату, время или маршрут.");

  return (
    <Card>
      <p className="text-lg font-semibold text-text-primary">{fallbackTitle}</p>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{fallbackDescription}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        {result.failureReason === "too-early" && result.firstPossibleArrival && (
          <Button
            variant="secondary"
            onClick={() =>
              onApplySuggestion(result.firstPossibleArrival!.arrivalDisplayTime)
            }
          >
            Выбрать {result.firstPossibleArrival.arrivalDisplayTime}
          </Button>
        )}
        {result.failureReason === "all-trains-passed" && result.nearestFutureArrival && (
          <Button
            variant="secondary"
            onClick={() =>
              onApplySuggestion(result.nearestFutureArrival!.arrivalDisplayTime)
            }
          >
            Рассчитать по ближайшему
          </Button>
        )}
        <Button variant="ghost" onClick={onOpenSchedule}>
          Посмотреть расписание
        </Button>
      </div>
    </Card>
  );
}

function roundTimestampToFiveMinutes(timestamp: number): number {
  const date = new Date(timestamp);
  date.setUTCSeconds(0, 0);
  const totalMinutes = date.getUTCMinutes();
  const roundedMinutes = Math.ceil(totalMinutes / 5) * 5;
  date.setUTCMinutes(roundedMinutes);
  return date.getTime();
}

function formatSelectedDateLabel(selectedDate: string, todayDate: string): string {
  if (selectedDate === todayDate) {
    return `Сегодня, ${formatRussianDayMonth(selectedDate)}`;
  }

  const tomorrowDate = shiftMetroDateString(todayDate, 1);
  if (selectedDate === tomorrowDate) {
    return `Завтра, ${formatRussianDayMonth(selectedDate)}`;
  }

  return formatRussianWeekdayDate(selectedDate);
}

function formatDayTypeLabel(selectedDate: string): string {
  const dayOfWeek = new Date(`${selectedDate}T00:00:00Z`).getUTCDay();
  const dayContext = getServiceDayContextForDate(
    selectedDate,
    dayOfWeek === 0 || dayOfWeek === 6,
  );

  if (dayContext.serviceDayType === "special") {
    return "Особый режим";
  }

  return dayContext.serviceDayType === "weekend" ? "Выходной день" : "Будний день";
}
