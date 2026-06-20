import packageJson from "../../package.json";
import type { MetroMetadata } from "../domain/metro/metro.types";

export const metadata: MetroMetadata = {
  version: packageJson.version,
  validFrom: "2024-01-01",
  checkedAt: "2024-03-01",
  sourceUrl: "https://metro-ektb.ru/for-passengers/schedule/",
  sourceName: "Официальный сайт Екатеринбургского метрополитена",
  timezone: "Asia/Yekaterinburg",
  notes: "Автоматически сгенерированное мок-расписание для разработки",
};
