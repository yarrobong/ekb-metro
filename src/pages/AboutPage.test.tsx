import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useAppStore } from "../app/store";
import { AboutPage } from "./AboutPage";

describe("AboutPage", () => {
  beforeEach(() => {
    useAppStore.setState({
      screen: "about",
      selectedStationId: null,
      selectedDirectionId: null,
      selectedDestinationId: null,
      isDirectionModalOpen: false,
      isDestinationSheetOpen: false,
      activeToast: null,
    });
  });

  it("shows schedule metadata with separated meanings", () => {
    render(<AboutPage />);

    expect(screen.getByText("Расписание действует с")).toBeInTheDocument();
    expect(screen.getByText("1 января 2024 г.")).toBeInTheDocument();
    expect(screen.getByText("Последняя проверка")).toBeInTheDocument();
    expect(screen.getByText("21 июня 2026 г.")).toBeInTheDocument();
    expect(screen.getByText("Версия расписания")).toBeInTheDocument();
    expect(screen.getByText("2024-01-01-stable")).toBeInTheDocument();
    expect(screen.queryByText("Расписание актуально на")).not.toBeInTheDocument();
  });
});
