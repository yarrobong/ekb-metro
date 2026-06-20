import { z } from "zod";

import packageJson from "../../../package.json";
import { metadata as metroMetadata } from "../../data/metadata";

export const updateTypeSchema = z.enum([
  "schedule",
  "fix",
  "improvements",
  "schedule-and-app",
]);

export const updateMetadataSchema = z.object({
  appVersion: z.string().min(1),
  scheduleVersion: z.string().min(1),
  updateType: updateTypeSchema,
  updateSummary: z.string().trim().min(1).max(140),
});

export type UpdateType = z.infer<typeof updateTypeSchema>;
export type UpdateMetadata = z.infer<typeof updateMetadataSchema>;

export interface AvailableUpdateDetails {
  title: string;
  description: string;
  signature: string;
  updateType: UpdateType;
}

export const currentUpdateMetadata: UpdateMetadata = updateMetadataSchema.parse({
  appVersion: packageJson.version,
  scheduleVersion: `${metroMetadata.validFrom}:${metroMetadata.checkedAt}`,
  updateType: "improvements",
  updateSummary: "Доступна новая версия приложения.",
});

export function getUpdateMetadataUrl(
  baseUrl = import.meta.env.BASE_URL,
  origin = window.location.origin,
) {
  return new URL(`${baseUrl}update-metadata.json`, origin).toString();
}

export function resolveAvailableUpdate(
  currentMetadata: UpdateMetadata,
  nextMetadata: UpdateMetadata,
): AvailableUpdateDetails | null {
  const appChanged = nextMetadata.appVersion !== currentMetadata.appVersion;
  const scheduleChanged =
    nextMetadata.scheduleVersion !== currentMetadata.scheduleVersion;

  if (!appChanged && !scheduleChanged) {
    return null;
  }

  if (appChanged && scheduleChanged) {
    return {
      title: "Обновлено расписание и приложение",
      description:
        nextMetadata.updateSummary ||
        "Обновлено расписание поездов и улучшена работа приложения.",
      signature: getUpdateSignature(nextMetadata),
      updateType: "schedule-and-app",
    };
  }

  if (scheduleChanged) {
    return {
      title: "Обновлено расписание",
      description:
        nextMetadata.updateSummary || "Обновлено расписание поездов для приложения.",
      signature: getUpdateSignature(nextMetadata),
      updateType: "schedule",
    };
  }

  const updateType = nextMetadata.updateType === "fix" ? "fix" : "improvements";

  return {
    title:
      updateType === "fix"
        ? "Исправлена работа приложения"
        : "Доступна новая версия приложения",
    description:
      nextMetadata.updateSummary ||
      (updateType === "fix"
        ? "Исправлена работа приложения."
        : "Добавлены улучшения в приложение."),
    signature: getUpdateSignature(nextMetadata),
    updateType,
  };
}

export function getUpdateSignature(updateMetadata: UpdateMetadata) {
  return `${updateMetadata.appVersion}:${updateMetadata.scheduleVersion}`;
}
