const FONT_FAMILY_MAP: Record<string, string> = {
  "heading-700": "BricolageGrotesque_700Bold",
  "heading-600": "BricolageGrotesque_600SemiBold",
  "body-400": "PlusJakartaSans_400Regular",
  "body-500": "PlusJakartaSans_500Medium",
  "body-600": "PlusJakartaSans_600SemiBold",
};

export function resolveFontFamily(family: string, weight: string): string {
  const key = `${family}-${weight}`;
  const resolved = FONT_FAMILY_MAP[key];
  if (!resolved) {
    throw new Error(`No font registered for ${key}`);
  }
  return resolved;
}

export const REQUIRED_GOOGLE_FONTS = [
  "BricolageGrotesque_700Bold",
  "BricolageGrotesque_600SemiBold",
  "PlusJakartaSans_400Regular",
  "PlusJakartaSans_500Medium",
  "PlusJakartaSans_600SemiBold",
] as const;
