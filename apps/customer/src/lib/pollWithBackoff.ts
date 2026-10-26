export async function pollWithBackoff<T>(
  attempt: () => Promise<T>,
  {
    retries = 8,
    initialDelayMs = 400,
    maxDelayMs = 3000,
  }: { retries?: number; initialDelayMs?: number; maxDelayMs?: number } = {},
): Promise<T> {
  let delay = initialDelayMs;
  let lastError: unknown;

  for (let attemptIndex = 0; attemptIndex <= retries; attemptIndex++) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (attemptIndex === retries) break;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, maxDelayMs);
    }
  }

  throw lastError;
}
