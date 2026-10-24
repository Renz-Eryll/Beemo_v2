import type { Metric } from "@/db/schema";

// Recommended ranges for Tetragonula biroi (stingless bees native to the Philippines).
export const RANGES: Record<Metric, { label: string; unit: string; min: number; max: number; note: string }> = {
  temperature: {
    label: "Temperature",
    unit: "°C",
    min: 32,
    max: 35,
    note: "Below 32°C bees burn stored honey for warmth; above 35°C they fan to cool the hive.",
  },
  humidity: {
    label: "Humidity",
    unit: "%",
    min: 50,
    max: 60,
    note: "Low humidity stresses the colony; high humidity invites mold and spoils honey.",
  },
  weight: {
    label: "Hive weight",
    unit: "kg",
    min: 1,
    max: 5,
    note: "1–5 kg of honey and brood is the recommended window for harvesting.",
  },
};

export const METRICS: Metric[] = ["temperature", "humidity", "weight"];

export type RangeStatus = "low" | "ok" | "high";

export const rangeStatus = (metric: Metric, value: number): RangeStatus => {
  const { min, max } = RANGES[metric];
  if (value < min) return "low";
  if (value > max) return "high";
  return "ok";
};

// The original BeeMo wording.
export const STATUS_LABEL: Record<RangeStatus, string> = {
  low: "Too Low!",
  ok: "Normal",
  high: "Too High!",
};

// Weight above the range means the hive is ready to harvest, not a problem.
const WEIGHT_LABEL: Record<RangeStatus, string> = { low: "Building up", ok: "Normal", high: "Ready to harvest" };

export const statusLabel = (metric: Metric, status: RangeStatus) => (metric === "weight" ? WEIGHT_LABEL : STATUS_LABEL)[status];

export const formatValue = (metric: Metric, value: number) =>
  `${value.toFixed(metric === "weight" ? 2 : 1)}${RANGES[metric].unit}`;

// Valid sensor bounds: anything outside is a faulty reading, not a hive condition.
export const SENSOR_BOUNDS: Record<Metric, [number, number]> = {
  temperature: [-10, 70],
  humidity: [0, 100],
  weight: [0, 50],
};
