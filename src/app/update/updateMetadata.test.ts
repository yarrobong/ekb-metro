import { describe, expect, it } from "vitest";

import {
  currentUpdateMetadata,
  getUpdateMetadataUrl,
  resolveAvailableUpdate,
  type UpdateMetadata,
} from "./updateMetadata";

function createUpdateMetadata(overrides: Partial<UpdateMetadata>): UpdateMetadata {
  return {
    ...currentUpdateMetadata,
    ...overrides,
  };
}

describe("updateMetadata", () => {
  it("returns null when metadata versions are unchanged", () => {
    expect(
      resolveAvailableUpdate(currentUpdateMetadata, currentUpdateMetadata),
    ).toBeNull();
  });

  it("builds the public metadata URL from the base path", () => {
    expect(getUpdateMetadataUrl("/ekb-metro/", "https://example.com")).toBe(
      "https://example.com/ekb-metro/update-metadata.json",
    );
  });

  it("classifies a combined schedule and app update", () => {
    const nextMetadata = createUpdateMetadata({
      appVersion: "1.0.1",
      scheduleVersion: "2024-01-01:2024-03-15",
      updateType: "schedule-and-app",
      updateSummary: "Обновлено расписание поездов и приложение.",
    });

    expect(resolveAvailableUpdate(currentUpdateMetadata, nextMetadata)).toMatchObject({
      title: "Обновлено расписание и приложение",
      updateType: "schedule-and-app",
    });
  });
});
