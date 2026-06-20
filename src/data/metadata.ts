import packageJson from "../../package.json";
import type { MetroMetadata } from "../domain/metro/metro.types";

export const metadata: MetroMetadata = {
  appVersion: packageJson.version,
  scheduleVersion: "2024-01-01-stable",
  validFrom: "2024-01-01",
  lastVerifiedAt: "2026-06-21",
  sourceUrl: "https://metro-ektb.ru/rezhim-raboty-metropolitena-grafik_1211/",
  sourceName: "Официальный сайт Екатеринбургского метрополитена",
  timezone: "Asia/Yekaterinburg",
  notes: "Расчётные времена основаны на локально сохранённом расписании метрополитена.",
};
