<p align="center">
  <img src="./docs/beemo-banner.svg" alt="BeeMo Thumbnail" width="800"/>
</p>

##

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white"/>
  <img src="https://img.shields.io/badge/Drizzle-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black"/>
  <img src="https://img.shields.io/badge/Neon_PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/ESP8266-E7352C?style=for-the-badge&logo=espressif&logoColor=white"/>
</p>

<h1 align="center">🐝 BeeMo</h1>

<p align="center">
  <b>BeeMo</b> is an IoT monitoring system for stingless beehives (<i>Tetragonula biroi</i>), built with <b>Next.js</b>, <b>Drizzle ORM</b> and <b>Neon Postgres</b>.<br/>
  ESP8266 sensors report live temperature, humidity and hive weight, with alerts, harvest cycles and reports.
</p>

---

## ✨ Features

- 📡 **Live monitoring**: latest readings per hive with in-range, above and below indicators
- 📈 **History charts**: 24 hours to 90 days, with the recommended range shaded
- 🚨 **Alerts** when a reading leaves its range (at most once per condition every 6 hours) and when a hive reaches harvest weight
- 🍯 **Harvest cycles**: six-month cycles per hive, with harvest date, honey yield and notes
- 📊 **Reports** (admin): averages, extremes and weight change for a date range or a cycle, with CSV export
- 👥 **Roles**: the admin owns the apiary; workers can monitor, while reports, workers and settings stay with the admin
- 🔑 **Device API**: each ESP8266 authenticates with its own key (stored hashed, shown once) and posts to `/api/ingest`
- 🧪 **Demo mode**: a shared, read-only apiary with simulated readings, topped up by a daily cron

---

## 🌡️ Recommended Ranges

| Measure | Range | Why |
| --- | --- | --- |
| Temperature | 32–35 °C | Below, bees burn honey for warmth; above, they spend energy fanning |
| Humidity | 50–60 % | Low stresses the colony; high invites mold and spoils honey |
| Hive weight | 1–5 kg | The recommended window for harvesting |

---

## 🔌 Sensor Kit

NodeMCU ESP8266 · DHT22 (temperature, humidity) · load cell + HX711 (weight) · PTC heater and TEC-12706 cooler with quiet fans.

The firmware in [`firmware/beemo_esp8266`](firmware/beemo_esp8266/beemo_esp8266.ino) regulates temperature locally, so the hive stays protected when Wi-Fi drops, and reports once a minute:

```http
POST /api/ingest
Authorization: Bearer bm_<device key>
Content-Type: application/json

{ "temperature": 33.4, "humidity": 55.2, "weight": 2.31 }
```

The API validates sensor bounds, limits each device to one reading per 10 seconds, raises alerts, and replies with the low/ok/high status of each measure.

---

## 🌐 Demo

🔗 **Live Demo**: [BeeMo](https://beemo-hive-monitor.vercel.app/demo) (read-only, simulated sensor data)

---

## ⚡ Quick Start

Follow these steps to get a local copy of the project up and running.

### 1️⃣ Clone the repository

```bash
git clone https://github.com/Renz-Eryll/beemo_v2.git
cd beemo_v2
```

### 2️⃣ Environment setup

```bash
cp .env.example .env.local   # or: vercel env pull .env.local
```

### 3️⃣ Install dependencies and set up the database

```bash
npm install
npm run db:push    # create tables
npm run db:seed    # optional: demo apiary with 75 days of simulated readings
```

### 4️⃣ Start the development server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser to view BeeMo.

---

## 📜 History

BeeMo started as our team's capstone project: a PHP/MySQL web app with Arduino sensors.
The original version is preserved at the [`legacy-php`](../../tree/legacy-php) tag (PHP code by [@CJcode6754](https://github.com/CJcode6754); I built the web UI and programmed the sensors).
Version 2 is a rewrite with multi-tenant data isolation, hashed device keys, server-side validation and a public demo.

---

## 📧 Contact

- **Name**: Renz Eryll Ramelo
- **LinkedIn**: [www.linkedin.com/in/renz-eryll-ramelo](https://www.linkedin.com/in/renz-eryll-ramelo)
- **GitHub**: [https://github.com/Renz-Eryll](https://github.com/Renz-Eryll)
