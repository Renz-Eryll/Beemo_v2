<h1 align="center">🐝 BeeMo</h1>

<p align="center">
  IoT monitoring for stingless beehives (<i>Tetragonula biroi</i>): live temperature, humidity and hive weight,<br/>
  alerts when conditions drift, harvest cycles, and reports with plain-language insights.
</p>

<p align="center">
  <a href="https://beemo-hive-monitor.vercel.app/demo"><b>Try the live demo</b></a> · read-only, simulated sensor data
</p>

---

## Features

- **Live monitoring**: latest readings per hive with in-range / above / below indicators (glyph + label, never color alone)
- **History charts**: 24 hours to 90 days, one chart per measure with the recommended range shaded
- **Alerts**: raised when a reading leaves the range (at most once per condition every 6 hours) and when a hive reaches harvest weight
- **Harvest cycles**: six-month cycles per hive, with harvest date, honey yield and notes
- **Reports** (admin): averages, extremes and weight change for a date range or a cycle, insights, CSV export
- **Roles**: the admin owns the apiary; workers can monitor, but reports, workers and settings stay with the admin
- **Device API**: each hive's ESP8266 authenticates with its own key (stored hashed, shown once) and posts readings to `/api/ingest`
- **Demo mode**: a shared, read-only apiary whose simulated readings are topped up on visit and by a daily cron

## Recommended ranges

| Measure | Range | Why |
| --- | --- | --- |
| Temperature | 32–35 °C | Below, bees burn honey for warmth; above, they spend energy fanning |
| Humidity | 50–60 % | Low stresses the colony; high invites mold and spoils honey |
| Hive weight | 1–5 kg | The recommended window for harvesting |

## Stack

Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS v4 · Drizzle ORM · Neon Postgres · Recharts · Vercel (hosting + cron)

## Getting started

```bash
npm install
cp .env.example .env.local   # or: vercel env pull .env.local
npm run db:push              # create tables
npm run db:seed              # optional: the demo apiary
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (type-checks and lints) |
| `npm run db:push` | Sync the Drizzle schema to the database |
| `npm run db:seed` | Recreate the demo apiary with 75 days of simulated readings |

## Sensor kit

NodeMCU ESP8266 · DHT22 (temperature, humidity) · load cell + HX711 (weight) · PTC heater and TEC-12706 cooler with quiet fans.

The firmware in [`firmware/beemo_esp8266`](firmware/beemo_esp8266/beemo_esp8266.ino) regulates temperature locally (so the hive is protected when Wi-Fi drops) and reports once a minute:

```http
POST /api/ingest
Authorization: Bearer bm_<device key>
Content-Type: application/json

{ "temperature": 33.4, "humidity": 55.2, "weight": 2.31 }
```

The API validates sensor bounds, rate-limits each device to one reading per 10 seconds, raises alerts, and replies with the low/ok/high status of each measure.

## History

BeeMo started as our capstone project: a PHP/MySQL web app with Arduino sensors, built as a team.
The original version is preserved in this repository's history at the [`legacy-php`](../../tree/legacy-php) tag (PHP code by [@CJcode6754](https://github.com/CJcode6754); I built the web UI and programmed the sensors).
Version 2 is a rewrite for the web: multi-tenant data isolation, hashed device keys for sensor ingest, server-side validation everywhere, and a deployable demo.

## Contact

**Renz Eryll Ramelo** · [LinkedIn](https://www.linkedin.com/in/renz-eryll-ramelo) · [GitHub](https://github.com/Renz-Eryll)
