export function relativeTime(iso: string, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} h` : `${Math.floor(hours / 24)} d`;
}

export function clockTime(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** "20% off orders over $25" -> "20% OFF", "BOGO gyoza, first visit" -> "1+1". */
export function dealShortLabel(dealName: string | null): string | null {
  if (!dealName) return null;
  const percent = dealName.match(/(\d+)%/);
  if (percent) return `${percent[1]}% OFF`;
  if (/bogo|buy 1/i.test(dealName)) return "1+1";
  if (/free/i.test(dealName)) return "FREE ITEM";
  if (/\d+ for \$\d+/i.test(dealName)) return "BUNDLE";
  return "DEAL";
}
