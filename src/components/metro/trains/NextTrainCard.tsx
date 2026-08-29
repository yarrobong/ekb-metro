import { AlertTriangle } from "lucide-react";

import type { MetroServiceState } from "../../../domain/metro";
import { formatTimer } from "../../../domain/time";
import { cn } from "../../../lib/cn";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";

interface NextTrainCardProps {
  state: MetroServiceState;
  showSeconds: boolean;
  onReportIssue: () => void;
}

export function NextTrainCard({ state, showSeconds, onReportIssue }: NextTrainCardProps) {
  if (state.status === "error") {
    return (
      <Card className="py-10 text-center">
        <AlertTriangle
          size={36}
          className="mx-auto mb-4 text-warning"
          aria-hidden="true"
        />
        <h3 className="mb-2 text-lg font-semibold text-text-primary">Нет данных</h3>
        <p className="px-4 text-sm text-text-secondary">
          {state.message ||
            "Не удалось обработать расписание для выбранного направления."}
        </p>
        <Button variant="ghost" className="mt-5" onClick={onReportIssue}>
          Сообщить об ошибке
        </Button>
      </Card>
    );
  }

  if (state.status === "before_open" || state.status === "after_close") {
    return (
      <Card className="py-8 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-wider text-text-secondary">
          {state.status === "before_open" ? "Метро пока закрыто" : "Метро закрыто"}
        </p>
        <div className="mb-4 text-6xl font-bold tracking-tight text-text-primary tabular-nums sm:text-7xl">
          {formatTimer(state.secondsUntilFirstTrain ?? 0, showSeconds)}
        </div>
        <p className="text-lg font-medium text-text-primary">
          {state.status === "before_open"
            ? `Первый поезд в ${state.firstTrain?.displayTime}`
            : `Следующее открытие в ${state.firstTrain?.displayTime}`}
        </p>
        <p className="mt-3 text-sm text-text-secondary">
          {state.status === "before_open"
            ? "Движение начнётся с первым поездом текущего операционного дня."
            : "Движение завершено. Покажем первый поезд следующего операционного дня."}
        </p>
      </Card>
    );
  }

  if (!state.nearest) {
    return null;
  }

  const nearest = state.nearest;

  return (
    <Card
      className={cn(
        "relative overflow-hidden py-8 text-center transition-colors duration-500",
        nearest.status === "approaching" &&
          "border-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]",
        nearest.status === "arriving" && "border-accent bg-accent/10",
      )}
    >
      <p className="mb-4 text-sm font-medium uppercase tracking-wider text-text-secondary">
        {state.isPreviousOperationalDay
          ? "Ночной поезд предыдущего дня"
          : "Следующий поезд"}
      </p>
      <div className="mb-4 text-6xl font-bold tracking-tight text-text-primary tabular-nums sm:text-7xl">
        {nearest.status === "arriving" ? (
          <span className="animate-pulse text-5xl text-accent sm:text-6xl">
            Поезд прибывает
          </span>
        ) : nearest.status === "approaching" && !showSeconds ? (
          <span className="text-5xl text-accent sm:text-6xl">Меньше минуты</span>
        ) : (
          formatTimer(nearest.secondsLeft, showSeconds)
        )}
      </div>
      <p
        className={cn(
          "text-lg font-medium",
          nearest.status === "approaching" && "animate-pulse text-accent",
          nearest.status === "arriving" && "text-accent",
        )}
      >
        {nearest.status === "arriving"
          ? "По расписанию"
          : nearest.status === "approaching"
            ? "Поезд приближается"
            : `Прибытие в ${nearest.displayTime}`}
      </p>
      {nearest.isLastTrain && (
        <div className="mx-auto mt-4 max-w-md rounded-2xl border border-warning/35 bg-warning/10 px-4 py-3">
          <p className="text-sm font-semibold text-text-primary">Последний поезд</p>
          <p className="mt-1 text-sm leading-5 text-text-secondary">
            После него поездов по этому направлению сегодня больше не будет
          </p>
        </div>
      )}
    </Card>
  );
}
