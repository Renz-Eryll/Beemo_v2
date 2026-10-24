import {
  bigserial,
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "worker"]);
export const cycleStatusEnum = pgEnum("cycle_status", ["active", "completed"]);
export const metricEnum = pgEnum("metric", ["temperature", "humidity", "weight"]);
export const alertStateEnum = pgEnum("alert_state", ["high", "low", "harvest"]);

// An apiary is the tenant: an admin owns it, workers belong to it, hives live in it.
export const apiaries = pgTable("apiaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  location: text("location"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    apiaryId: uuid("apiary_id")
      .notNull()
      .references(() => apiaries.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const hives = pgTable(
  "hives",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    apiaryId: uuid("apiary_id")
      .notNull()
      .references(() => apiaries.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    location: text("location"),
    // Only a SHA-256 hash of the device key is stored; the key is shown once.
    deviceKeyHash: text("device_key_hash"),
    deviceKeyHint: text("device_key_hint"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("hives_apiary_idx").on(t.apiaryId), uniqueIndex("hives_device_key_idx").on(t.deviceKeyHash)],
);

export const readings = pgTable(
  "readings",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    hiveId: uuid("hive_id")
      .notNull()
      .references(() => hives.id, { onDelete: "cascade" }),
    temperature: real("temperature").notNull(),
    humidity: real("humidity").notNull(),
    weightKg: real("weight_kg").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("readings_hive_time_idx").on(t.hiveId, t.recordedAt)],
);

export const harvestCycles = pgTable(
  "harvest_cycles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hiveId: uuid("hive_id")
      .notNull()
      .references(() => hives.id, { onDelete: "cascade" }),
    cycleNumber: integer("cycle_number").notNull(),
    startDate: date("start_date").notNull(),
    plannedEndDate: date("planned_end_date").notNull(),
    status: cycleStatusEnum("status").notNull().default("active"),
    completedAt: date("completed_at"),
    yieldKg: real("yield_kg"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("cycles_hive_number_idx").on(t.hiveId, t.cycleNumber)],
);

export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hiveId: uuid("hive_id")
      .notNull()
      .references(() => hives.id, { onDelete: "cascade" }),
    metric: metricEnum("metric").notNull(),
    state: alertStateEnum("state").notNull(),
    value: real("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [index("alerts_hive_time_idx").on(t.hiveId, t.createdAt)],
);

export type Hive = typeof hives.$inferSelect;
export type Reading = typeof readings.$inferSelect;
export type HarvestCycle = typeof harvestCycles.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type Metric = (typeof metricEnum.enumValues)[number];
