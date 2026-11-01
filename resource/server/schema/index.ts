import type { PanelSchema } from "@aicore-fivem/shared";
import { lotsFile, lotsTab } from "./lots";
import { settingsFile, settingsTab } from "./settings";

/** ai-vehiclesales' panel: used car lots (counter, sell spot, parking spots, preview) and the sale rules. */
export const salesSchema: PanelSchema = {
  title: "ADMIN_TITLE",
  icon: "car",
  files: {
    settings: settingsFile,
    lots: lotsFile,
  },
  tabs: [lotsTab, settingsTab],
};
