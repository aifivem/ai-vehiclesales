import type { CardSpec } from "@aicore-fivem/shared";

export const salesCard: CardSpec = {
  icon: "tag",
  title: "ADMIN_C_SALES",
  desc: "ADMIN_C_SALES_DESC",
  fields: [
    {
      widget: "number",
      path: "commission",
      label: "ADMIN_F_COMMISSION",
      hint: "ADMIN_H_COMMISSION",
      min: 0,
      max: 90,
      unit: "%",
    },
    {
      widget: "select",
      path: "commissionTo",
      label: "ADMIN_F_COMMISSION_TO",
      hint: "ADMIN_H_COMMISSION_TO",
      options: [
        { value: "", label: "ADMIN_O_COMMISSION_NONE" },
        { value: "job", label: "ADMIN_O_COMMISSION_JOB" },
        { value: "gang", label: "ADMIN_O_COMMISSION_GANG" },
      ],
    },
    {
      widget: "text",
      lookup: "job",
      path: "commissionJob",
      label: "ADMIN_F_COMMISSION_JOB",
      placeholder: "ADMIN_P_COMMISSION_JOB",
      showIf: { path: "commissionTo", values: ["job"] },
    },
    {
      widget: "text",
      lookup: "gang",
      path: "commissionGang",
      label: "ADMIN_F_COMMISSION_GANG",
      placeholder: "ADMIN_P_COMMISSION_GANG",
      showIf: { path: "commissionTo", values: ["gang"] },
    },
    {
      widget: "text",
      lookup: "account",
      path: "commissionAccount",
      label: "ADMIN_F_COMMISSION_ACCOUNT",
      hint: "ADMIN_H_COMMISSION_ACCOUNT",
      placeholder: "ADMIN_P_ACCOUNT",
      showIf: { path: "commissionTo", values: ["job", "gang"] },
    },
    {
      widget: "number",
      path: "minPrice",
      label: "ADMIN_F_MIN_PRICE",
      min: 1,
      max: 100_000_000,
      step: 500,
      unit: "$",
    },
    {
      widget: "number",
      path: "maxPrice",
      label: "ADMIN_F_MAX_PRICE",
      min: 1,
      max: 100_000_000,
      step: 10_000,
      unit: "$",
    },
    {
      widget: "number",
      path: "maxListings",
      label: "ADMIN_F_MAX_LISTINGS",
      hint: "ADMIN_H_MAX_LISTINGS",
      min: 1,
      max: 50,
    },
  ],
};

export const paymentCard: CardSpec = {
  icon: "money-bill-wave",
  title: "ADMIN_C_PAYMENT",
  desc: "ADMIN_C_PAYMENT_DESC",
  fields: [
    {
      widget: "tags",
      lookup: "account",
      path: "accounts",
      label: "ADMIN_F_ACCOUNTS",
      hint: "ADMIN_H_ACCOUNTS",
      placeholder: "ADMIN_P_ACCOUNT",
    },
    {
      widget: "text",
      lookup: "account",
      path: "payoutAccount",
      label: "ADMIN_F_PAYOUT_ACCOUNT",
      hint: "ADMIN_H_PAYOUT_ACCOUNT",
      placeholder: "ADMIN_P_ACCOUNT",
    },
  ],
};

export const testDriveCard: CardSpec = {
  icon: "gauge",
  title: "ADMIN_C_TEST_DRIVE",
  desc: "ADMIN_C_TEST_DRIVE_DESC",
  fields: [
    {
      widget: "number",
      path: "testDriveSeconds",
      label: "ADMIN_F_TEST_DRIVE_TIME",
      min: 10,
      max: 600,
      step: 10,
      unit: "s",
    },
    {
      widget: "number",
      path: "testDriveCooldown",
      label: "ADMIN_F_TEST_DRIVE_COOLDOWN",
      hint: "ADMIN_H_TEST_DRIVE_COOLDOWN",
      min: 0,
      max: 3600,
      step: 10,
      unit: "s",
    },
  ],
};
