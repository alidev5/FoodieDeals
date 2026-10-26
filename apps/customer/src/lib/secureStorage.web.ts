// expo-secure-store has no web implementation; browsers fall back to localStorage.
export async function readStoredValue(key: string): Promise<string | null> {
  return window.localStorage.getItem(key);
}

export async function writeStoredValue(key: string, value: string): Promise<void> {
  window.localStorage.setItem(key, value);
}
