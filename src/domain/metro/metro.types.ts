export type StationId =
  | "prospekt-kosmonavtov"
  | "uralmash"
  | "mashinostroiteley"
  | "uralskaya"
  | "dinamo"
  | "ploshchad-1905-goda"
  | "geologicheskaya"
  | "chkalovskaya"
  | "botanicheskaya";

export type DirectionId = "to-botanicheskaya" | "to-prospekt-kosmonavtov";
export type DayType = "weekday" | "weekend";

export interface Station {
  id: StationId;
  name: string;
  index: number;
  isTerminus: boolean;
  availableDirections: DirectionId[];
  prevStation?: StationId;
  nextStation?: StationId;
}

export interface Direction {
  id: DirectionId;
  name: string;
  shortName: string;
  terminus: StationId;
  indexDelta: 1 | -1;
}

export type TrainTime = string; // format: HH:mm

export interface Schedule {
  weekdays: TrainTime[];
  weekends: TrainTime[];
}

export type StationSchedule = Record<DirectionId, Schedule>;
export type FullSchedule = Record<StationId, Partial<StationSchedule>>;

export interface DriveTime {
  from: StationId;
  to: StationId;
  directionId: DirectionId;
  timeSeconds: number;
  includesStopTime: boolean;
  isApproximate: boolean;
  source: string;
}

export interface SpecialDate {
  date: string; // YYYY-MM-DD
  type: DayType;
  reason?: string;
}

export interface MetroMetadata {
  version: string;
  validFrom: string; // YYYY-MM-DD
  checkedAt: string; // YYYY-MM-DD
  sourceUrl: string;
  sourceName: string;
  timezone: "Asia/Yekaterinburg";
  notes?: string;
}

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};
