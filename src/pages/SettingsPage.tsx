import {
  CircleHelp,
  Download,
  Info,
  MessageCircleWarning,
  RefreshCcw,
  Share2,
} from "lucide-react";

import { useAppStore } from "../app/store";
import { usePwa } from "../app/usePwa";
import { metadata } from "../data/metadata";
import { ActionRow } from "../components/ui/ActionRow";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { Switch } from "../components/ui/Switch";
import { reportIssue, shareApp } from "../lib/userActions";

export function SettingsPage() {
  const {
    showSeconds,
    setShowSeconds,
    setScreen,
    selectedStationId,
    selectedDirectionId,
    selectedDestinationId,
    showToast,
  } = useAppStore();
  const { checkForUpdates, isCheckingForUpdates } = usePwa();

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
        title="Настройки"
        description="Настройте отображение и получите информацию о приложении."
      />

      <div className="space-y-3">
        <p className="px-1 text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">
          Отображение
        </p>
        <Card className="p-0">
          <div className="flex min-h-16 items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-medium text-text-primary">Показывать секунды</p>
              <p className="mt-1 text-sm text-text-secondary">
                Точный обратный отсчёт до прибытия поезда.
              </p>
            </div>

            <Switch
              checked={showSeconds}
              label="Показывать секунды"
              onCheckedChange={(checked) => {
                setShowSeconds(checked);
                showToast("Настройка сохранена", "success");
              }}
            />
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <p className="px-1 text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">
          Приложение
        </p>
        <Card className="divide-y divide-border p-0">
          <ActionRow
            title="Как установить"
            description="Инструкция для iPhone, Android и компьютера."
            icon={<CircleHelp size={20} aria-hidden="true" />}
            onClick={() => setScreen("install")}
          />
          <ActionRow
            title="О приложении"
            description="Версия, источник расписания и важные пояснения."
            icon={<Info size={20} aria-hidden="true" />}
            onClick={() => setScreen("about")}
          />
          <ActionRow
            title="Поделиться приложением"
            description="Откройте системное меню или скопируйте ссылку."
            icon={<Share2 size={20} aria-hidden="true" />}
            onClick={() => {
              void handleShare();
            }}
          />
          <ActionRow
            title="Проверить обновления"
            description="Проверить, появилась ли новая версия приложения."
            icon={
              isCheckingForUpdates ? (
                <RefreshCcw size={20} aria-hidden="true" className="animate-spin" />
              ) : (
                <Download size={20} aria-hidden="true" />
              )
            }
            onClick={() => {
              void checkForUpdates();
            }}
          />
        </Card>
      </div>

      <div className="space-y-3">
        <p className="px-1 text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">
          Помощь
        </p>
        <Card className="divide-y divide-border p-0">
          <ActionRow
            title="Сообщить об ошибке"
            description="Если расписание или расчёт отображаются неправильно."
            icon={<MessageCircleWarning size={20} aria-hidden="true" />}
            onClick={() => {
              reportIssue({
                stationId: selectedStationId,
                directionId: selectedDirectionId,
                destinationId: selectedDestinationId,
                metroState: null,
              });
            }}
          />
        </Card>
      </div>

      <p className="pb-4 text-center text-xs text-text-secondary">
        Метро ЕКБ · версия {metadata.appVersion}
      </p>
    </div>
  );
}
