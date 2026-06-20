import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import type { Station } from "../../domain/metro";
import { RouteProgressCard } from "./RouteProgressCard";

const currentStation: Station = {
  id: "prospekt-kosmonavtov",
  name: "Проспект Космонавтов",
  index: 0,
  isTerminus: true,
  availableDirections: ["to-botanicheskaya"],
  nextStation: "uralmash",
};

const destinationStation: Station = {
  id: "ploshchad-1905-goda",
  name: "Площадь 1905 года",
  index: 5,
  isTerminus: false,
  availableDirections: ["to-botanicheskaya", "to-prospekt-kosmonavtov"],
  prevStation: "dinamo",
  nextStation: "geologicheskaya",
};

describe("RouteProgressCard", () => {
  it("renders without overflow at 320px with long station names", () => {
    render(
      <div style={{ width: "320px" }}>
        <RouteProgressCard
          currentStation={currentStation}
          destinationStation={destinationStation}
          routeStations={[
            currentStation,
            {
              id: "uralmash",
              name: "Очень длинное название промежуточной станции для переноса строки",
              index: 1,
              isTerminus: false,
              availableDirections: ["to-botanicheskaya", "to-prospekt-kosmonavtov"],
              prevStation: "prospekt-kosmonavtov",
              nextStation: "mashinostroiteley",
            },
            destinationStation,
          ]}
          stationCount={2}
          travelSeconds={360}
        />
      </div>,
    );

    expect(screen.getByText("Станция назначения")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Очень длинное название промежуточной станции для переноса строки",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("2 станции")).toBeInTheDocument();
  });
});
