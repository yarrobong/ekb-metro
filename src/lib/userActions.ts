import { metadata } from "../data/metadata";
import { getDirectionById, getStationById } from "../domain/metro";
import type { MetroServiceState } from "../domain/metro/schedule.service";
import type { StationId, DirectionId } from "../domain/metro/metro.types";
import { getCurrentAppUrl, getDeviceInfo } from "./device";

const SUPPORT_ISSUES_URL = "https://github.com/yarrobong/ekb-metro/issues/new";

export async function shareApp(): Promise<"shared" | "copied" | "manual" | "cancelled"> {
  const url = getCurrentAppUrl();
  const payload = {
    title: "Метро Екатеринбурга",
    text: "Метро Екатеринбурга — время до следующего поезда и расчёт поездки.",
    url,
  };

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (error) {
      if (isAbortError(error)) {
        return "cancelled";
      }
    }
  }

  const copied = await copyText(url);
  if (copied) {
    return "copied";
  }

  if (typeof window !== "undefined") {
    window.prompt("Скопируйте ссылку вручную", url);
  }

  return "manual";
}

export async function copyAppLink(): Promise<boolean> {
  return copyText(getCurrentAppUrl());
}

export function openSourceSchedule() {
  if (typeof window !== "undefined") {
    window.open(metadata.sourceUrl, "_blank", "noopener,noreferrer");
  }
}

export function reportIssue(input: ReportIssueInput) {
  if (typeof window === "undefined") {
    return;
  }

  const params = new URLSearchParams({
    title: "Метро Екатеринбурга — сообщение об ошибке",
    body: buildIssueTemplate(input),
  });

  window.open(
    `${SUPPORT_ISSUES_URL}?${params.toString()}`,
    "_blank",
    "noopener,noreferrer",
  );
}

interface ReportIssueInput {
  stationId: StationId | null;
  directionId: DirectionId | null;
  destinationId: StationId | null;
  metroState?: MetroServiceState | null;
}

function buildIssueTemplate(input: ReportIssueInput): string {
  const device = getDeviceInfo();
  const station = input.stationId ? getStationById(input.stationId)?.name : "не выбрана";
  const direction = input.directionId
    ? (getDirectionById(input.directionId)?.name ?? "не выбрано")
    : "не выбрано";
  const destination = input.destinationId
    ? (getStationById(input.destinationId)?.name ?? "не выбрана")
    : "не выбрана";

  const now = new Date().toLocaleString("ru-RU", { timeZone: "Asia/Yekaterinburg" });

  return [
    "Здравствуйте!",
    "",
    "Опишите, пожалуйста, что отображается неправильно:",
    "",
    "Что произошло:",
    "",
    "Ожидаемый результат:",
    "",
    "---",
    `Текущая станция: ${station}`,
    `Направление: ${direction}`,
    `Станция назначения: ${destination}`,
    `Статус метро: ${input.metroState?.status ?? "не определён"}`,
    `Ближайший поезд: ${input.metroState?.nearest?.displayTime ?? "не определён"}`,
    `Время Екатеринбурга: ${now}`,
    `Версия приложения: ${metadata.appVersion}`,
    `Версия расписания: ${metadata.scheduleVersion}`,
    `Последняя проверка расписания: ${metadata.lastVerifiedAt}`,
    `Устройство: ${device.kind}`,
    `Браузер: ${device.browserName}`,
    `Код ошибки: ${getErrorCode(input.metroState)}`,
    `Ссылка: ${getCurrentAppUrl()}`,
  ].join("\n");
}

function getErrorCode(metroState?: MetroServiceState | null): string {
  if (!metroState) {
    return "ui-unknown";
  }

  if (metroState.status === "error") {
    return "schedule-not-found";
  }

  return "route-context";
}

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
