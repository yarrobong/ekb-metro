import type { ReactNode } from "react";
import { ArrowLeft, Copy, MonitorSmartphone, Share, Smartphone } from "lucide-react";

import { useAppStore } from "../app/store";
import { usePwa } from "../app/usePwa";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { IconButton } from "../components/ui/IconButton";
import { PageHeader } from "../components/ui/PageHeader";
import { copyAppLink } from "../lib/userActions";
import { getDeviceInfo } from "../lib/device";

const iphoneSteps = [
  "Откройте приложение в Safari.",
  "Нажмите кнопку «Поделиться».",
  "Выберите «На экран Домой».",
  "Нажмите «Добавить».",
];

const androidSteps = [
  "Откройте приложение в Chrome.",
  "Откройте меню браузера.",
  "Выберите «Установить приложение» или «Добавить на главный экран».",
  "Подтвердите установку.",
];

const desktopSteps = [
  "Найдите значок установки в адресной строке браузера.",
  "Нажмите «Установить».",
  "Подтвердите действие.",
];

export function InstallPage() {
  const setScreen = useAppStore((state) => state.setScreen);
  const showToast = useAppStore((state) => state.showToast);
  const { installMethod, isStandalone, openInstallPrompt } = usePwa();
  const device = getDeviceInfo();

  const handleCopyLink = async () => {
    const copied = await copyAppLink();

    if (copied) {
      showToast("Ссылка скопирована", "success");
    } else {
      showToast("Не удалось скопировать ссылку", "error");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Как установить приложение"
        description="Добавьте приложение на главный экран, чтобы открывать расписание одним нажатием."
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

      {isStandalone ? (
        <Card className="border-success/30 bg-success/10">
          <p className="text-lg font-semibold text-text-primary">
            Приложение уже установлено
          </p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Вы уже открыли расписание в отдельном режиме. Ниже оставили инструкцию на
            случай, если захотите установить приложение на другое устройство.
          </p>
        </Card>
      ) : (
        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <MonitorSmartphone size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Рекомендуемая инструкция</p>
              <p className="text-sm text-text-secondary">
                Устройство: {formatDevice(device.kind)} · Браузер: {device.browserName}
              </p>
            </div>
          </div>

          {device.isInAppBrowser && (
            <p className="rounded-xl bg-warning/10 px-4 py-3 text-sm leading-6 text-text-primary">
              Для установки откройте страницу в Safari или Chrome. Во встроенных браузерах
              установка часто недоступна.
            </p>
          )}

          <InstructionList
            title={getSuggestedTitle(device.kind)}
            steps={getSuggestedSteps(device.kind)}
            icon={
              device.kind === "desktop" ? (
                <MonitorSmartphone size={20} />
              ) : (
                <Smartphone size={20} />
              )
            }
          />

          <div className="flex flex-wrap gap-3">
            {installMethod === "prompt" && (
              <Button onClick={() => void openInstallPrompt()}>
                Установить приложение
              </Button>
            )}
            <Button variant="secondary" onClick={() => void handleCopyLink()}>
              <Copy size={16} aria-hidden="true" />
              Скопировать ссылку
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        <InstructionList
          title="iPhone и iPad"
          steps={iphoneSteps}
          icon={<Share size={20} />}
        />
        <InstructionList
          title="Android"
          steps={androidSteps}
          icon={<Smartphone size={20} />}
        />
        <InstructionList
          title="Компьютер"
          steps={desktopSteps}
          icon={<MonitorSmartphone size={20} />}
          fallback="Если браузер не поддерживает установку, приложением можно пользоваться прямо в браузере."
        />
      </div>
    </div>
  );
}

function InstructionList({
  title,
  steps,
  icon,
  fallback,
}: {
  title: string;
  steps: string[];
  icon: ReactNode;
  fallback?: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-accent-muted text-accent">
          {icon}
        </div>

        <p className="font-semibold text-text-primary">{title}</p>
      </div>

      <ol className="mt-5 space-y-4">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-raised text-sm font-bold text-accent">
              {index + 1}
            </span>
            <p className="pt-1 text-sm leading-6 text-text-secondary">{step}</p>
          </li>
        ))}
      </ol>

      {fallback && (
        <p className="mt-5 text-sm leading-6 text-text-secondary">{fallback}</p>
      )}
    </Card>
  );
}

function formatDevice(kind: ReturnType<typeof getDeviceInfo>["kind"]) {
  switch (kind) {
    case "iphone":
      return "iPhone";
    case "ipad":
      return "iPad";
    case "android":
      return "Android";
    case "desktop":
      return "Компьютер";
  }
}

function getSuggestedTitle(kind: ReturnType<typeof getDeviceInfo>["kind"]) {
  switch (kind) {
    case "iphone":
    case "ipad":
      return "Установка через Safari";
    case "android":
      return "Установка через Chrome";
    case "desktop":
      return "Установка в браузере";
  }
}

function getSuggestedSteps(kind: ReturnType<typeof getDeviceInfo>["kind"]) {
  switch (kind) {
    case "iphone":
    case "ipad":
      return iphoneSteps;
    case "android":
      return androidSteps;
    case "desktop":
      return desktopSteps;
  }
}
