import { z } from "zod";

export const StationIdSchema = z.enum([
  "prospekt-kosmonavtov",
  "uralmash",
  "mashinostroiteley",
  "uralskaya",
  "dinamo",
  "ploshchad-1905-goda",
  "geologicheskaya",
  "chkalovskaya",
  "botanicheskaya",
]);

export const DirectionIdSchema = z.enum(["to-botanicheskaya", "to-prospekt-kosmonavtov"]);

export const DayTypeSchema = z.enum(["weekday", "weekend"]);

export const StationSchema = z.object({
  id: StationIdSchema,
  name: z.string().min(1),
  index: z.number().int().min(0).max(8),
  isTerminus: z.boolean(),
  availableDirections: z.array(DirectionIdSchema).min(1),
  prevStation: StationIdSchema.optional(),
  nextStation: StationIdSchema.optional(),
});

export const DirectionSchema = z.object({
  id: DirectionIdSchema,
  name: z.string().min(1),
  shortName: z.string().min(1),
  terminus: StationIdSchema,
  indexDelta: z.union([z.literal(1), z.literal(-1)]),
});

// Time format HH:mm, allowing hours >= 24 for after-midnight trains
export const TrainTimeSchema = z
  .string()
  .regex(/^\d{2}:[0-5]\d$/, "Время должно быть в формате HH:mm");

export const ScheduleSchema = z.object({
  weekdays: z.array(TrainTimeSchema).min(1),
  weekends: z.array(TrainTimeSchema).min(1),
});

export const DriveTimeSchema = z.object({
  from: StationIdSchema,
  to: StationIdSchema,
  directionId: DirectionIdSchema,
  timeSeconds: z.number().int().positive(),
  includesStopTime: z.boolean(),
  isApproximate: z.boolean(),
  source: z.string().min(1),
});

export const SpecialDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата должна быть в формате YYYY-MM-DD"),
  type: DayTypeSchema,
  reason: z.string().optional(),
});

export const MetroMetadataSchema = z.object({
  version: z.string().min(1),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceUrl: z.string().url(),
  sourceName: z.string().min(1),
  timezone: z.literal("Asia/Yekaterinburg"),
  notes: z.string().optional(),
});
