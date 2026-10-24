import type { Metadata } from "next";
import { RANGES, METRICS } from "@/lib/ranges";

export const metadata: Metadata = { title: "Bee guide" };

const HARDWARE = [
  ["NodeMCU ESP8266", "Reads the sensors and sends readings over Wi-Fi"],
  ["DHT22", "Temperature and humidity inside the hive"],
  ["Load cell + HX711", "Hive weight, under the hive box"],
  ["PTC heater + fan", "Warms the hive below 32°C"],
  ["TEC-12706 + fan", "Cools the hive above 35°C"],
];

export default function GuidePage() {
  return (
    <article className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Bee guide</h1>
      <p className="mt-2 leading-relaxed text-muted">
        BeeMo is built for <em>Tetragonula biroi</em>, the stingless bee native to the Philippines. Its honey is prized, but colonies are sensitive to
        heat and moisture, so small changes inside the box matter.
      </p>

      <h2 className="mt-10 text-lg font-semibold">Ideal conditions</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {METRICS.map((m) => (
          <div key={m} className="card p-4">
            <p className="text-xs text-muted">{RANGES[m].label}</p>
            <p className="num mt-1 text-xl">
              {RANGES[m].min}–{RANGES[m].max}
              {RANGES[m].unit}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{RANGES[m].note}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold">Reading the indicators</h2>
      <ul className="mt-3 space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-good" aria-hidden /> <strong className="font-medium">In range</strong>: no action needed
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-high" aria-hidden /> <strong className="font-medium">Above range</strong>: shade, ventilate or cool
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-low" aria-hidden /> <strong className="font-medium">Below range</strong>: insulate or warm
        </li>
      </ul>
      <p className="mt-3 text-sm text-muted">
        Harvest cycles run about six months. When a hive reaches 5 kg you’ll get a “ready to harvest” alert.
      </p>

      <h2 id="device" className="mt-10 scroll-mt-8 text-lg font-semibold">
        Sensor kit
      </h2>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-line">
            {HARDWARE.map(([part, role]) => (
              <tr key={part}>
                <td className="whitespace-nowrap px-4 py-3 font-medium">{part}</td>
                <td className="px-4 py-3 text-muted">{role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted">Fans run at about 3500 RPM and 40 dB so they don’t disturb the colony.</p>

      <h3 className="mt-8 font-semibold">Connecting a hive</h3>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
        <li>
          Open the hive’s <strong className="font-medium">Device &amp; settings</strong> page and generate a device key.
        </li>
        <li>
          Flash <code className="num rounded bg-sunken px-1">firmware/beemo_esp8266</code> from the repository with your Wi-Fi details, the key
          and your BeeMo address.
        </li>
        <li>The kit posts a reading every minute. The hive shows as online within a few minutes.</li>
      </ol>
      <pre className="num mt-4 overflow-x-auto rounded-lg bg-ink p-4 text-xs leading-relaxed text-paper">{`POST /api/ingest
Authorization: Bearer bm_your_device_key
Content-Type: application/json

{ "temperature": 33.4, "humidity": 55.2, "weight": 2.31 }`}</pre>
      <p className="mt-3 text-sm text-muted">
        The response tells the kit whether each value is low, ok or high, so it can switch the heater or cooler. If Wi-Fi drops, the kit keeps
        regulating temperature on its own and resumes reporting when it reconnects.
      </p>
    </article>
  );
}
