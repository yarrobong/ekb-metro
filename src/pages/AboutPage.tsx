import {
  ArrowLeft,
  ExternalLink,
  MessageCircleWarning,
  Share2,
  TrainFront,
} from "lucide-react";

import { useAppStore } from "../app/store";
import { metadata } from "../data/metadata";
import { Card } from "../components/ui/Card";
import { IconButton } from "../components/ui/IconButton";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { openSourceSchedule, reportIssue, shareApp } from "../lib/userActions";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function AboutPage() {
  const {
    setScreen,
    selectedStationId,
    selectedDirectionId,
    selectedDestinationId,
    showToast,
  } = useAppStore();

  const handleShare = async () => {
    const result = await shareApp();

    if (result === "copied") {
      showToast("Ссылка скопирована", "success");
    } else if (result === "manual") {
      showToast("Ссылка готова для ручного копирования", "info");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="О приложении"
        description="Версия, источник расписания и важные пояснения."
        action={
          <IconButton
            label="Вернуться в настройки"
            onClick={() => {
              setScreen("settings");
            }}
          >
            <ArrowLeft size={20} />
          </IconButton>
        }
      />

      <Card className="text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-accent text-white shadow-card">
          <TrainFront size={40} aria-hidden="true" />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-text-primary">Метро Екатеринбурга</h2>
        <p className="mt-1 text-sm font-medium text-text-secondary">
          Метро ЕКБ · версия {metadata.version}
        </p>

        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-text-secondary">
          Приложение помогает быстро определить время до следующего поезда
          Екатеринбургского метрополитена и рассчитать ориентировочное время поездки.
        </p>
      </Card>

      <Card className="space-y-4">
        <InfoRow label="Расписание актуально на" value={formatDate(metadata.validFrom)} />
        <InfoRow
          label="Последняя проверка данных"
          value={formatDate(metadata.checkedAt)}
        />
        <InfoRow label="Источник расписания" value={metadata.sourceName} />
        <InfoRow label="Время" value="Екатеринбург" />

        <button
          type="button"
          onClick={() => {
            if (!navigator.onLine) {
              showToast(
                "Источник будет доступен после подключения к интернету",
                "warning",
              );
              return;
            }

            openSourceSchedule();
          }}
          className="focus-ring flex w-full items-center justify-between rounded-xl bg-surface-raised px-4 py-3 text-left transition hover:bg-surface-hover"
        >
          <div>
            <p className="text-sm font-medium text-text-primary">
              Открыть источник расписания
            </p>
            <p className="mt-1 text-xs text-text-secondary">{metadata.sourceUrl}</p>
          </div>
          <ExternalLink size={18} className="text-text-secondary" aria-hidden="true" />
        </button>
      </Card>

      <Card className="space-y-4">
        <p className="text-sm leading-7 text-text-secondary">
          Расчёты выполняются по опубликованному расписанию. Фактическое движение поездов
          может отличаться.
        </p>
        <p className="text-sm leading-7 text-text-secondary">
          Приложение не является официальным сервисом метрополитена и использует данные из
          открытых источников.
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          variant="secondary"
          onClick={() => {
            void handleShare();
          }}
        >
          <Share2 size={16} aria-hidden="true" />
          Поделиться
        </Button>

        <Button
          variant="ghost"
          onClick={() => {
            reportIssue({
              stationId: selectedStationId,
              directionId: selectedDirectionId,
              destinationId: selectedDestinationId,
              metroState: null,
            });
          }}
        >
          <MessageCircleWarning size={16} aria-hidden="true" />
          Сообщить об ошибке
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-surface-raised px-4 py-3">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="text-right text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}
