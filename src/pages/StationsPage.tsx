import { stations } from "../data/stations";
import { useAppStore } from "../app/store";
import { getStationById } from "../domain/metro";
import type { StationId } from "../domain/metro/metro.types";

import { PageHeader } from "../components/ui/PageHeader";
import { LineMap } from "../components/metro/LineMap";
import { BottomSheet } from "../components/ui/BottomSheet";
import { DirectionSelectorModal } from "../components/metro/DirectionSelectorModal";

export function StationsPage() {
  const {
    selectedStationId,
    isDirectionModalOpen,
    selectStation,
    selectDirection,
    setScreen,
    openDirectionModal,
    closeDirectionModal,
  } = useAppStore();

  const handleStationSelect = (stationId: StationId) => {
    selectStation(stationId);

    const station = getStationById(stationId);
    if (!station) return;

    if (station.availableDirections.length === 1) {
      // Automatic selection for terminus
      const dir = station.availableDirections[0];
      if (dir) {
        selectDirection(dir);
        setScreen("trains");
      }
    } else {
      openDirectionModal();
    }
  };

  const handleDirectionSelect = (directionId: Parameters<typeof selectDirection>[0]) => {
    selectDirection(directionId);
    setScreen("trains");
  };

  const selectedStation = selectedStationId ? getStationById(selectedStationId) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Выберите станцию"
        description="Укажите станцию, на которой вы сейчас находитесь."
      />

      <LineMap
        stations={stations}
        selectedStationId={selectedStationId}
        onStationSelect={handleStationSelect}
      />

      <BottomSheet
        isOpen={isDirectionModalOpen && selectedStation !== null}
        onClose={closeDirectionModal}
        title="Выберите направление"
        description={selectedStation?.name || ""}
      >
        {selectedStation && (
          <DirectionSelectorModal
            station={selectedStation}
            onSelect={handleDirectionSelect}
          />
        )}
      </BottomSheet>
    </div>
  );
}
