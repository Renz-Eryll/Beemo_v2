const TZ = "Asia/Manila";

export const timeAgo = (date: Date | string | null) => {
  if (!date) return "never";
  const s = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
};

export const dateLabel = (value: Date | string) =>
  new Date(typeof value === "string" && value.length === 10 ? `${value}T00:00:00+08:00` : value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: TZ,
  });

export const dateTimeLabel = (value: Date | string) =>
  new Date(value).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: TZ });

// A device counts as offline if it hasn't reported for 2 hours.
export const isOnline = (lastSeen: Date | null) => !!lastSeen && Date.now() - new Date(lastSeen).getTime() < 2 * 3_600_000;

export const todayIso = () => new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
