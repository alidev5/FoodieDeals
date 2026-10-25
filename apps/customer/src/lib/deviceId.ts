import * as Crypto from "expo-crypto";

import { readStoredValue, writeStoredValue } from "./secureStorage";

const DEVICE_ID_KEY = "foodiedeals.device-id";

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await readStoredValue(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  const created = Crypto.randomUUID();
  await writeStoredValue(DEVICE_ID_KEY, created);
  return created;
}
