import { translate } from "./lang";

/** "3 h ago" from a server epoch ms and the server-minus-page clock offset. */
export function ago(listed: number, offset: number): string {
  const minutes = Math.floor((Date.now() + offset - listed) / 60_000);
  if (minutes < 1) return translate("UI_TIME_NOW");
  if (minutes < 60) return translate("UI_TIME_MINUTES", minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return translate("UI_TIME_HOURS", hours);
  return translate("UI_TIME_DAYS", Math.floor(hours / 24));
}

export const money = (value: number): string => value.toLocaleString("en-US");
