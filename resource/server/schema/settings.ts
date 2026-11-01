import { BLIP_STYLE_FIELDS } from "@aicore-fivem/lib/shared";
import type { FileSpec, TabSpec } from "@aicore-fivem/shared";
import { paymentCard, salesCard, testDriveCard } from "./settingsCards";

const account = {
  type: "text",
  lookup: "account",
  min: 2,
  max: 32,
  pattern: "^[a-z0-9_]{2,32}$",
} as const;

/** A job or gang name that may stay empty (none picked yet). */
const optionalGroup = (lookup: "job" | "gang") =>
  ({
    type: "text",
    lookup,
    min: 0,
    max: 32,
    pattern: "^([a-z0-9_]{2,32})?$",
  }) as const;

export const settingsFile: FileSpec = {
  kind: "settings",
  sync: "all",
  sections: {
    commission: { type: "number", min: 0, max: 90 },
    commissionTo: { type: "enum", values: ["", "job", "gang"] },
    commissionJob: optionalGroup("job"),
    commissionGang: optionalGroup("gang"),
    commissionAccount: account,
    dealerShare: { type: "number", min: 0, max: 100 },
    minPrice: { type: "number", min: 1, max: 100_000_000, integer: true },
    maxPrice: { type: "number", min: 1, max: 100_000_000, integer: true },
    maxListings: { type: "number", min: 1, max: 50, integer: true },
    testDriveSeconds: {
      type: "number",
      min: 10,
      max: 600,
      integer: true,
    },
    testDriveCooldown: {
      type: "number",
      min: 0,
      max: 3600,
      integer: true,
    },
    accounts: {
      type: "names",
      lookup: "account",
      max: 5,
      itemMax: 32,
      pattern: "^[a-z0-9_]{2,32}$",
    },
    payoutAccount: account,
    blip: { type: "object", optional: true, fields: BLIP_STYLE_FIELDS },
  },
  defaults: {
    commission: 10,
    commissionTo: "",
    commissionJob: "",
    commissionGang: "",
    commissionAccount: "bank",
    dealerShare: 50,
    minPrice: 1000,
    maxPrice: 10_000_000,
    maxListings: 3,
    testDriveSeconds: 60,
    testDriveCooldown: 60,
    accounts: ["bank", "cash"],
    payoutAccount: "bank",
  },
};

export const settingsTab: TabSpec = {
  id: "settings",
  file: "settings",
  icon: "sliders",
  label: "ADMIN_TAB_SETTINGS",
  desc: "ADMIN_TAB_SETTINGS_DESC",
  cards: [
    salesCard,
    {
      icon: "wallet",
      title: "ADMIN_C_DEALER",
      desc: "ADMIN_C_DEALER_DESC",
      fields: [
        {
          widget: "number",
          path: "dealerShare",
          label: "ADMIN_F_DEALER_SHARE",
          hint: "ADMIN_H_DEALER_SHARE",
          min: 0,
          max: 100,
          unit: "%",
        },
      ],
    },
    paymentCard,
    testDriveCard,
    {
      icon: "map",
      title: "ADMIN_C_BLIP",
      desc: "ADMIN_C_BLIP_DESC",
      fields: [{ widget: "blip", path: "blip", label: "ADMIN_F_LOT_BLIP" }],
    },
  ],
};
