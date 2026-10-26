import type { Metadata } from "next";
import { HexMark, RangeRuler } from "@/components/Comb";
import PageHeader, { SectionTitle } from "@/components/PageHeader";
import { MetricIcon } from "@/components/Status";
import { RANGES, METRICS } from "@/lib/ranges";

export const metadata: Metadata = { title: "Bee guide" };

const HARDWARE = [
  ["NodeMCU ESP8266", "Reads the sensors and sends readings over Wi-Fi"],
  ["DHT22", "Temperature and humidity inside the hive"],
  ["Load cell + HX711", "Hive weight, under the hive box"],
  ["PTC heater + fan", "Warms the hive below 32°C"],
  ["TEC-12706 + fan", "Cools the hive above 35°C"],
];

const INDICATORS = [
  { mark: "bg-good", label: "In range", action: "No action needed" },
  { mark: "bg-high", label: "Above range", action: "Shade, ventilate or cool" },
  { mark: "bg-low", label: "Below range", action: "Insulate or warm" },
];

export default function GuidePage() {
  return (
    <article className="max-w-4xl">
      <PageHeader
        eyebrow={<em className="normal-case">Tetragonula biroi</em>}
        title="Bee guide"
        description={
          <p className="leading-relaxed">
            BeeMo is built for <em>Tetragonula biroi</em>, the stingless bee native to the Philippines. Its honey is prized, but colonies are
            sensitive to heat and moisture, so small changes inside the box matter.
          </p>
        }
      />

      <section>
        <SectionTitle>Ideal conditions</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          {METRICS.map((m) => (
            <div key={m} className="card flex flex-col p-5">
              <div className="flex items-center gap-2 text-faint">
                <MetricIcon metric={m} className="size-4" />
                <p className="eyebrow">{RANGES[m].label}</p>
              </div>
              <p className="num mt-3 text-[26px] leading-none font-medium">
                {RANGES[m].min}–{RANGES[m].max}
                <span className="ml-1 text-[15px] text-muted">{RANGES[m].unit}</span>
              </p>
              <div className="mt-4">
                <RangeRuler metric={m} value={(RANGES[m].min + RANGES[m].max) / 2} labels />
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{RANGES[m].note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionTitle>Reading the indicators</SectionTitle>
        <ul className="grid gap-3 sm:grid-cols-3">
          {INDICATORS.map((i) => (
            <li key={i.label} className="card flex items-center gap-3 px-4 py-3.5">
              <HexMark className={i.mark} size="h-[18px] w-4" />
              <span className="min-w-0 text-sm">
                <strong className="block font-semibold">{i.label}</strong>
                <span className="text-muted">{i.action}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-center gap-3 rounded-[6px] bg-honey-soft px-4 py-3 text-sm text-honey-text">
          <HexMark className="bg-gold" size="h-[18px] w-4" />
          Harvest cycles run about six months. When a hive reaches 5 kg you’ll get a “ready to harvest” alert.
        </p>
      </section>

      <section id="device" className="mt-12 scroll-mt-20">
        <SectionTitle>Sensor kit</SectionTitle>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HARDWARE.map(([part, role], i) => (
            <li key={part} className="card flex items-start gap-3.5 p-4">
              <span className="hex grid h-[34px] w-[30px] shrink-0 place-items-center bg-rail font-display text-[13px] font-semibold text-honey">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 text-sm">
                <strong className="block font-semibold">{part}</strong>
                <span className="text-muted">{role}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-muted">Fans run at about 3500 RPM and 40 dB so they don’t disturb the colony.</p>

        <h3 className="display mt-10 text-[16px]">Connecting a hive</h3>
        <ol className="mt-4 grid overflow-hidden rounded-[6px] border border-line bg-surface sm:grid-cols-3">
          {[
            <>
              Open the hive’s <strong className="font-semibold">Device &amp; settings</strong> page and generate a device key.
            </>,
            <>
              Flash <code className="num rounded bg-sunken px-1">firmware/beemo_esp8266</code> from the repository with your Wi-Fi details, the key and your
              BeeMo address.
            </>,
            <>The kit posts a reading every minute. The hive shows as online within a few minutes.</>,
          ].map((step, i) => (
            <li key={i} className={`flex flex-col gap-2 p-5 text-sm leading-relaxed ${i > 0 ? "border-t border-line sm:border-t-0 sm:border-l" : ""}`}>
              <span className={`display text-[30px] leading-none ${i === 2 ? "text-gold" : "text-line-strong"}`}>{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <pre className="comb-dark num mt-4 overflow-x-auto rounded-[6px] bg-rail p-5 text-xs leading-relaxed text-rail-ink">
          <span className="text-honey">POST</span>
          {` /api/ingest
Authorization: Bearer bm_your_device_key
Content-Type: application/json

{ "temperature": 33.4, "humidity": 55.2, "weight": 2.31 }`}
        </pre>
        <p className="mt-3 text-sm text-muted">
          The response tells the kit whether each value is low, ok or high, so it can switch the heater or cooler. If Wi-Fi drops, the kit keeps
          regulating temperature on its own and resumes reporting when it reconnects.
        </p>
      </section>
    </article>
  );
}
