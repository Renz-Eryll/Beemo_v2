// Synthetic sensor data for the demo apiary. Deterministic per hive and hour, so
// regenerating a range always produces the same values.

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

// Small seeded PRNG (mulberry32) so values are stable across runs.
const rand = (seed: number) => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export type HiveProfile = {
  seed: number;
  tempBase: number; // average temperature
  tempSwing: number; // day/night swing
  humidityBase: number;
  cycleStart: Date; // weight resets at harvest
  startWeightKg: number;
  gainPerDayKg: number;
};

export function simulateReading(p: HiveProfile, at: Date) {
  const t = at.getTime();
  const hourIndex = Math.floor(t / HOUR);
  const noise = (k: number) => rand(p.seed * 7919 + hourIndex * 31 + k) - 0.5;

  // Peak heat around 14:00 Philippine time (UTC+8 → 06:00 UTC).
  const hourOfDay = ((t / HOUR + 8) % 24 + 24) % 24;
  const daily = Math.sin(((hourOfDay - 8) / 24) * 2 * Math.PI);
  // A slow weather pattern over several days.
  const weather = Math.sin((t / DAY / 9 + p.seed) * 2 * Math.PI);

  const temperature = p.tempBase + p.tempSwing * daily + 0.5 * weather + noise(1) * 0.4;
  const humidity = p.humidityBase - 3 * daily + 2.5 * weather + noise(2) * 1.2;

  const days = Math.max(0, (t - p.cycleStart.getTime()) / DAY);
  // Hot spells slow nectar storage; daily foraging adds a small swing.
  const weightKg = p.startWeightKg + p.gainPerDayKg * days + 0.03 * daily + noise(3) * 0.02;

  return {
    temperature: round(temperature, 1),
    humidity: round(Math.min(95, Math.max(30, humidity)), 1),
    weightKg: round(Math.max(0.2, weightKg), 2),
  };
}

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

// Hourly timestamps in (from, to], aligned to the hour.
export function hourlySteps(from: Date, to: Date) {
  const steps: Date[] = [];
  let t = Math.floor(from.getTime() / HOUR) * HOUR + HOUR;
  for (; t <= to.getTime(); t += HOUR) steps.push(new Date(t));
  return steps;
}
