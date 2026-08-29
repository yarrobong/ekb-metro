import { Clock3 } from "lucide-react";

import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

interface EmptyTrainStateProps {
  onSelectStation: () => void;
}

export function EmptyTrainState({ onSelectStation }: EmptyTrainStateProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Следующий поезд"
        description="Сначала необходимо выбрать текущую станцию."
      />

      <Card className="text-center">
        <Clock3 size={44} className="mx-auto text-accent" aria-hidden="true" />
        <p className="mt-4 text-lg font-semibold">Станция не выбрана</p>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          После выбора станции здесь появятся таймер и следующие поезда.
        </p>
        <Button fullWidth className="mt-6" onClick={onSelectStation}>
          Выбрать станцию
        </Button>
      </Card>
    </div>
  );
}
