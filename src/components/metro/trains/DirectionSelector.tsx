import { cn } from "../../../lib/cn";
import type { DirectionOption } from "../../../pages/trains/useTrainsPageModel";

interface DirectionSelectorProps {
  directions: DirectionOption[];
  selectedDirectionId: DirectionOption["id"] | null;
  onSelect: (directionId: DirectionOption["id"]) => void;
}

export function DirectionSelector({
  directions,
  selectedDirectionId,
  onSelect,
}: DirectionSelectorProps) {
  if (directions.length === 0) {
    return null;
  }

  if (directions.length === 1) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-surface-raised p-4">
        <p className="text-center text-sm font-medium text-text-secondary">
          Направление: <span className="text-text-primary">{directions[0]?.name}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex gap-1 overflow-hidden rounded-xl bg-surface-raised p-1.5">
      {directions.map((direction) => {
        const isActive = direction.id === selectedDirectionId;

        return (
          <button
            key={direction.id}
            type="button"
            onClick={() => onSelect(direction.id)}
            aria-pressed={isActive}
            className={cn(
              "focus-ring relative flex-1 rounded-lg py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {direction.shortName || direction.name}
          </button>
        );
      })}
    </div>
  );
}
