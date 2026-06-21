import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";

import { useLiveMetroTime } from "../app/hooks/useLiveMetroTime";
import { useAppStore } from "../app/store";
import {
  getDirectionById,
  getStationById,
  resolveDaySchedule,
  resolveDayScheduleForDate,
  type DayScheduleMode,
  type DayScheduleTrain,
} from "../domain/metro";
import { formatRussianDayMonth, formatRussianWeekdayDate } from "../domain/time";
import { DirectionSelectorModal } from "../components/metro/DirectionSelectorModal";
import { ScheduleSummaryCard } from "../components/metro/ScheduleSummaryCard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FullScreenDialog } from "../components/ui/FullScreenDialog";
import { cn } from "../lib/cn";

export function SchedulePage() {
  const {
    selectedStationId,
    selectedDirectionId,
    setScreen,
    selectDirection,
    scheduleContextDate,
    scheduleHighlightedTrainTime,
    scheduleHighlightLabel,
    scheduleReturnScreen,
    isDirectionModalOpen,
    openDirectionModal,
    closeDirectionModal,
  } = useAppStore();
  const [mode, setMode] = useState<DayScheduleMode>(
    scheduleContextDate ? "date" : "today",
  );
  const metroTime = useLiveMetroTime();
  const station = selectedStationId ? getStationById(selectedStationId) : null;
  const direction = selectedDirectionId ? getDirectionById(selectedDirectionId) : null;
  const groupRefs = useRef<Record<string, HTMLElement | null>>({});
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null);
  const lastAutoScrollKeyRef = useRef<string | null>(null);

  const schedule = useMemo(() => {
    if (!selectedStationId || !selectedDirectionId) {
      return null;
    }

    if (mode === "date" && scheduleContextDate) {
      return resolveDayScheduleForDate(
        selectedStationId,
        selectedDirectionId,
        scheduleContextDate,
      );
    }

    return resolveDaySchedule(selectedStationId, selectedDirectionId, metroTime, mode);
  }, [selectedDirectionId, selectedStationId, mode, metroTime, scheduleContextDate]);

  const modeOptions: Array<{ value: DayScheduleMode; label: string }> = useMemo(
    () => [
      {
        value: scheduleContextDate ? "date" : "today",
        label:
          scheduleContextDate && scheduleContextDate !== metroTime.dateString
            ? "Дата"
            : "Сегодня",
      },
      { value: "weekday", label: "Будни" },
      { value: "weekend", label: "Выходные" },
    ],
    [scheduleContextDate, metroTime.dateString],
  );

  const nextGroupKey = schedule?.nextTrain ? getGroupKey(schedule.nextTrain) : null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [mode, selectedDirectionId, selectedStationId]);

  useEffect(() => {
    if (mode !== "today" || !nextGroupKey || !schedule?.nextTrain) {
      return;
    }

    const autoScrollKey = [
      selectedStationId,
      selectedDirectionId,
      mode,
      schedule.serviceDate ?? "none",
    ].join(":");

    if (lastAutoScrollKeyRef.current === autoScrollKey) {
      return;
    }

    const target = groupRefs.current[nextGroupKey];
    if (!target) {
      return;
    }

    lastAutoScrollKeyRef.current = autoScrollKey;
    scrollToGroup(target, stickyHeaderRef.current);
  }, [
    mode,
    nextGroupKey,
    schedule?.nextTrain,
    schedule?.serviceDate,
    selectedDirectionId,
    selectedStationId,
  ]);

  if (!selectedStationId || !selectedDirectionId || !station || !direction) {
    return (
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="px-3"
            onClick={() => setScreen(scheduleReturnScreen ?? "trains")}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Расписание
          </h1>
        </header>

        <Card className="text-center">
          <p className="text-lg font-semibold text-text-primary">
            Сначала выберите станцию
          </p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            После выбора станции и направления здесь появится полное расписание.
          </p>
          <Button fullWidth className="mt-6" onClick={() => setScreen("stations")}>
            Выбрать станцию
          </Button>
        </Card>
      </div>
    );
  }

  const contextLabel = buildContextLabel(schedule);
  const accessibleSummary = buildAccessibleSummary(
    schedule?.firstTrain ?? null,
    schedule?.lastTrain ?? null,
  );
  const resolvedSchedule = schedule;

  return (
    <div className="space-y-6 pb-8">
      <div
        ref={stickyHeaderRef}
        className="sticky top-0 z-20 -mx-4 border-b border-border-light bg-app-bg/95 px-4 pb-4 pt-1 backdrop-blur-md"
      >
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            className="px-3"
            onClick={() => setScreen(scheduleReturnScreen ?? "trains")}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Назад
          </Button>

          {mode === "today" && schedule?.nextTrain && (
            <Button
              variant="secondary"
              className="px-3"
              onClick={() => {
                const target = nextGroupKey ? groupRefs.current[nextGroupKey] : null;
                if (target) {
                  scrollToGroup(target, stickyHeaderRef.current);
                }
              }}
            >
              К ближайшему
            </Button>
          )}
        </div>

        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Расписание
          </h1>

          <div className="mt-4 rounded-card border border-border-light bg-surface p-4 shadow-card">
            <button
              type="button"
              onClick={() => setScreen("stations")}
              className="focus-ring flex w-full items-start justify-between gap-3 rounded-xl text-left"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <MapPin size={16} aria-hidden="true" />
                  <span>Станция</span>
                </div>
                <p className="station-name mt-1 text-xl font-semibold text-text-primary">
                  {station.name}
                </p>
              </div>
              <ArrowRight
                size={18}
                className="mt-1 shrink-0 text-text-secondary"
                aria-hidden="true"
              />
            </button>

            <div className="mt-3 flex flex-wrap gap-3">
              {station.availableDirections.length > 1 ? (
                <Button
                  variant="secondary"
                  className="justify-start"
                  onClick={openDirectionModal}
                >
                  {direction.name}
                </Button>
              ) : (
                <div className="rounded-button bg-surface-raised px-4 py-3 text-sm font-medium text-text-secondary">
                  {direction.name}
                </div>
              )}
            </div>
          </div>

          <div
            role="radiogroup"
            aria-label="Режим просмотра расписания"
            className="mt-4 grid min-h-11 grid-cols-3 gap-1 rounded-2xl bg-surface-raised p-1"
          >
            {modeOptions.map((option) => {
              const isActive = option.value === mode;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setMode(option.value)}
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

          <div className="mt-3">
            <p className="text-sm font-medium text-text-primary">
              {getModeTitle(mode, schedule)}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {getModeSubtitle(mode, schedule)}
            </p>
          </div>
        </div>
      </div>

      {resolvedSchedule?.status === "error" ? (
        <Card className="text-center">
          <p className="text-lg font-semibold text-text-primary">
            {resolvedSchedule.message ??
              "Для этой станции и направления расписание не найдено"}
          </p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Вернитесь назад и попробуйте выбрать другую станцию или направление.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={() => setScreen("trains")}>
              Вернуться
            </Button>
            <Button variant="ghost" onClick={() => setScreen("stations")}>
              Изменить станцию
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <ScheduleSummaryCard
            contextLabel={contextLabel}
            firstTrain={resolvedSchedule!.firstTrain}
            lastTrain={resolvedSchedule!.lastTrain}
            totalCount={resolvedSchedule!.totalCount}
            accessibleSummary={accessibleSummary}
          />

          <div className="space-y-4">
            {resolvedSchedule!.groups.map((group, index) => {
              const showAfterMidnightDivider =
                group.isAfterMidnight &&
                (index === 0 || !resolvedSchedule!.groups[index - 1]?.isAfterMidnight);

              return (
                <div key={group.key}>
                  {showAfterMidnightDivider && (
                    <div className="rounded-2xl border border-border-light bg-surface-raised px-4 py-3 text-sm font-medium text-text-secondary">
                      После полуночи
                    </div>
                  )}

                  <section
                    ref={(element) => {
                      groupRefs.current[group.key] = element;
                    }}
                    className="scroll-mt-60 rounded-card border border-border-light bg-surface p-4 shadow-card"
                    aria-label={`Отправления в ${group.displayHour} часов`}
                  >
                    <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-4">
                      <div className="pt-1 text-2xl font-semibold tabular-nums text-text-primary">
                        {group.displayHour}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {group.trains.map((train) => (
                          <span
                            key={train.sourceTime}
                            className={cn(
                              "inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tabular-nums",
                              train.sourceTime === scheduleHighlightedTrainTime
                                ? "bg-accent-muted text-text-primary ring-1 ring-accent/35"
                                : train.isNext
                                  ? "bg-accent-muted text-text-primary ring-1 ring-accent/35"
                                  : train.isPast
                                    ? "bg-surface-raised text-text-secondary"
                                    : "bg-surface-raised text-text-primary",
                            )}
                            aria-label={buildTrainAriaLabel(train)}
                          >
                            <span>{String(train.displayMinute).padStart(2, "0")}</span>
                            {train.isNext && (
                              <span className="text-[11px] uppercase tracking-wide text-accent">
                                {train.isCurrent ? "Сейчас" : "Ближайший"}
                              </span>
                            )}
                            {train.sourceTime === scheduleHighlightedTrainTime &&
                              scheduleHighlightLabel && (
                                <span className="text-[11px] text-accent">
                                  {scheduleHighlightLabel}
                                </span>
                              )}
                            {train.isLast && (
                              <span className="text-[11px] uppercase tracking-wide text-text-secondary">
                                Последний
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              );
            })}
          </div>
        </>
      )}

      <FullScreenDialog
        isOpen={isDirectionModalOpen && station.availableDirections.length > 1}
        onClose={closeDirectionModal}
        title={station.name}
        description="Станция"
      >
        <DirectionSelectorModal
          station={station}
          onSelect={(directionId) => {
            selectDirection(directionId);
            setMode("today");
          }}
        />
      </FullScreenDialog>
    </div>
  );
}

function getGroupKey(train: DayScheduleTrain): string {
  return `${train.isAfterMidnight ? "after-midnight" : "day"}-${train.displayHour}`;
}

function getModeTitle(
  mode: DayScheduleMode,
  schedule: ReturnType<typeof resolveDaySchedule> | null,
): string {
  if (!schedule) {
    return "";
  }

  if (mode === "today" || mode === "date") {
    if (schedule.isPreviousOperationalDay && schedule.serviceDate) {
      return `Ночная часть расписания за ${formatRussianDayMonth(schedule.serviceDate)}`;
    }

    return schedule.serviceDate
      ? formatRussianWeekdayDate(schedule.serviceDate)
      : "Сегодня";
  }

  return mode === "weekday"
    ? "Типовое расписание рабочего дня"
    : "Типовое расписание выходного дня";
}

function getModeSubtitle(
  mode: DayScheduleMode,
  schedule: ReturnType<typeof resolveDaySchedule> | null,
): string {
  if (!schedule) {
    return "";
  }

  if (mode === "weekday" || mode === "weekend") {
    return mode === "weekday" ? "Будний день" : "Выходной день";
  }

  return getServiceDayTypeLabel(schedule.dayType);
}

function getServiceDayTypeLabel(dayType: "weekday" | "weekend" | "special"): string {
  if (dayType === "special") {
    return "Особый режим работы";
  }

  return dayType === "weekday" ? "Будний день" : "Выходной день";
}

function buildContextLabel(
  schedule: ReturnType<typeof resolveDaySchedule> | null,
): string {
  if (!schedule) {
    return "";
  }

  if (
    (schedule.mode === "today" || schedule.mode === "date") &&
    schedule.isPreviousOperationalDay &&
    schedule.serviceDate
  ) {
    return `Ночная часть расписания за ${formatRussianDayMonth(schedule.serviceDate)}`;
  }

  if ((schedule.mode === "today" || schedule.mode === "date") && schedule.serviceDate) {
    return `${formatRussianDayMonth(schedule.serviceDate)} · ${getCompactDayTypeLabel(schedule.dayType)}`;
  }

  return schedule.mode === "weekday"
    ? "Типовое буднее расписание"
    : "Типовое выходное расписание";
}

function getCompactDayTypeLabel(dayType: "weekday" | "weekend" | "special"): string {
  if (dayType === "special") {
    return "особый режим";
  }

  return dayType === "weekday" ? "будний день" : "выходной день";
}

function buildAccessibleSummary(
  firstTrain: DayScheduleTrain | null,
  lastTrain: DayScheduleTrain | null,
): string {
  const firstPart = firstTrain
    ? `Первый поезд в ${firstTrain.displayHour} часов ${firstTrain.displayMinute} минут.`
    : "Первый поезд недоступен.";
  const lastPart = lastTrain
    ? `Последний поезд в ${lastTrain.displayHour} часов ${lastTrain.displayMinute} минут${lastTrain.isAfterMidnight ? " после полуночи" : ""}.`
    : "Последний поезд недоступен.";

  return `${firstPart} ${lastPart}`;
}

function buildTrainAriaLabel(train: DayScheduleTrain): string {
  const parts = [`${train.displayTime}`];

  if (train.isNext) {
    parts.push(train.isPast ? "сейчас" : "ближайший поезд");
  }

  if (train.isLast) {
    parts.push("последний поезд");
  }

  if (train.isAfterMidnight) {
    parts.push("после полуночи");
  }

  return parts.join(", ");
}

function scrollToGroup(element: HTMLElement, stickyHeader: HTMLElement | null) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const headerOffset = stickyHeader ? stickyHeader.getBoundingClientRect().height : 0;
  const topPadding = 16;
  const top =
    window.scrollY + element.getBoundingClientRect().top - headerOffset - topPadding;

  window.scrollTo({
    top: Math.max(top, 0),
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}
