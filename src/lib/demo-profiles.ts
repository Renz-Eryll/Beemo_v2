import type { HiveProfile } from "./simulate";

export const DEMO_EMAIL = "demo@beemo.app";

// Per-hive behaviour for the demo apiary, keyed by hive name.
export const DEMO_PROFILES: Record<string, Omit<HiveProfile, "cycleStart">> = {
  "Hive A · Kalamansi row": { seed: 11, tempBase: 33.5, tempSwing: 0.8, humidityBase: 55.5, startWeightKg: 0.9, gainPerDayKg: 0.032 },
  "Hive B · Coconut grove": { seed: 23, tempBase: 33.8, tempSwing: 1.2, humidityBase: 53, startWeightKg: 1.6, gainPerDayKg: 0.041 },
  "Hive C · Near the creek": { seed: 37, tempBase: 32.9, tempSwing: 1.0, humidityBase: 58, startWeightKg: 0.7, gainPerDayKg: 0.018 },
};
