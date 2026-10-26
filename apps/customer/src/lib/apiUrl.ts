/**
 * Hosted: the Supabase project URL, with the API at its `api` edge function.
 * Local (docker-compose or `pnpm --filter api dev`): the API on localhost and no realtime.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Supabase runs edge functions near the caller unless told otherwise. Pinning the API to the
 * database's region turns a ~2s cross-region connection per request into ~0.15s.
 */
const FUNCTION_REGION = process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_REGION ?? "";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (SUPABASE_URL
    ? `${SUPABASE_URL}/functions/v1/api${FUNCTION_REGION ? `?forceFunctionRegion=${FUNCTION_REGION}` : ""}`
    : "http://localhost:3000/api");
