import { AdminPanel } from "@aicore-fivem/lib/server";
import { record } from "@aicore-fivem/lib/shared";
import { readLot } from "common/lots";
import { readSettings } from "common/settings";
import { salesSchema } from "./schema";

/** The panel and its parsed content. */
export const panel = new AdminPanel(salesSchema);
export const settings = panel.view("settings", readSettings);
export const lots = panel.records("lots", readLot);

panel.rule("settings", (_key, next) => {
  const v = record(next);
  return typeof v.minPrice === "number" &&
    typeof v.maxPrice === "number" &&
    v.minPrice > v.maxPrice
    ? "ADMIN_ERR_PRICE_RANGE"
    : null;
});
