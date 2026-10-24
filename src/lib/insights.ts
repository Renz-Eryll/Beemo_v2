// Plain-language insights for a period of readings, ported from the original BeeMo reports.
export type PeriodStats = {
  temperature: { avg: number; min: number; max: number };
  humidity: { avg: number; min: number; max: number };
  weight: { start: number; end: number; min: number; max: number };
  count: number;
};

export type Insight = { tone: "good" | "watch" | "warn"; text: string };

const f = (n: number, digits = 1) => n.toFixed(digits);
// 350 g, or 2.40 kg once it's a kilogram or more.
const mass = (kg: number) => (Math.abs(kg) >= 1 ? `${f(Math.abs(kg), 2)} kg` : `${f(Math.abs(kg) * 1000, 0)} g`);

export function generateInsights(s: PeriodStats): Insight[] {
  if (s.count === 0) return [];
  const insights: Insight[] = [];
  const t = s.temperature.avg;
  const h = s.humidity.avg;
  const gainKg = s.weight.end - s.weight.start;

  if (t < 32) {
    insights.push({
      tone: "warn",
      text: `Average temperature (${f(t)}°C) is below the 32–35°C range. Below 32°C stingless bees consume stored honey to generate heat, which slows honey production and colony growth.`,
    });
  } else if (t > 35) {
    insights.push({
      tone: "warn",
      text: `Average temperature (${f(t)}°C) is above the 32–35°C range. Above 35°C bees beat their wings to cool the hive, spending energy they would otherwise use to make and store honey.`,
    });
  } else {
    insights.push({
      tone: "good",
      text: `Average temperature (${f(t)}°C) is within the 32–35°C range, which supports efficient honey production and healthy colony growth.`,
    });
  }

  if (s.temperature.max > 35 && t <= 35) {
    insights.push({
      tone: "watch",
      text: `Peaks reached ${f(s.temperature.max)}°C. Shade or ventilation around midday may reduce heat stress.`,
    });
  }

  if (h < 50) {
    insights.push({
      tone: "warn",
      text: `Low humidity (${f(h)}%) may stress the colony and affect its metabolism and honey production.`,
    });
  } else if (h > 60) {
    insights.push({
      tone: "warn",
      text: `High humidity (${f(h)}%) favors mold growth and can affect honey quality. Excess moisture also puts stored honey at risk.`,
    });
  } else {
    insights.push({ tone: "good", text: `Humidity (${f(h)}%) is within the 50–60% range, supporting colony health.` });
  }

  if (gainKg > 0.01) {
    const pct = (gainKg / Math.max(s.weight.start, 0.01)) * 100;
    insights.push({
      tone: t >= 32 && t <= 35 ? "good" : "watch",
      text: `Positive growth: the hive gained ${mass(gainKg)} (+${f(pct, 0)}%) over this period.${
        t >= 32 && t <= 35 ? " Favorable temperatures are helping honey production." : ""
      }`,
    });
  } else if (gainKg < -0.01) {
    const pct = (Math.abs(gainKg) / Math.max(s.weight.start, 0.01)) * 100;
    insights.push({
      tone: "warn",
      text: `Negative growth: the hive lost ${mass(gainKg)} (−${f(pct, 0)}%). Bees may be consuming stored honey because of low nectar flow, bad weather or stress. Check food sources and hive health.`,
    });
  }

  if (s.weight.end >= 5) {
    insights.push({ tone: "good", text: `At ${f(s.weight.end, 2)} kg the hive has reached the harvest window.` });
  }

  return insights;
}
