import "server-only";
import { createHash, randomBytes } from "crypto";

const PREFIX = "bm_";

// A device key authenticates one hive's ESP8266 to the ingest API.
export function generateDeviceKey() {
  const key = PREFIX + randomBytes(24).toString("base64url");
  return { key, hash: hashDeviceKey(key), hint: key.slice(-4) };
}

export const hashDeviceKey = (key: string) => createHash("sha256").update(key).digest("hex");

export const looksLikeDeviceKey = (key: string) => key.startsWith(PREFIX) && key.length > 20;
