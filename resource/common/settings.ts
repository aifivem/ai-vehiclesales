import {
  type BlipStyle,
  int,
  num,
  readBlipStyle,
  record,
  str,
} from "@aicore-fivem/lib/shared";

/** A job's or gang's shared account that receives the lot's cut. */
export interface CommissionTarget {
  owner: "job" | "gang";
  id: string;
  account: string;
}

export interface Settings {
  /** Percent of the price the lot keeps. */
  commission: number;
  /** Where the lot's cut goes; null: nowhere (a money sink). */
  commissionTo: CommissionTarget | null;
  /** Percent of the vehicle shop's catalog price the dealer pays for an owned vehicle (0 = the dealer buys nothing). */
  dealerShare: number;
  minPrice: number;
  maxPrice: number;
  /** Listings one character may have at once (all lots). */
  maxListings: number;
  testDriveSeconds: number;
  /** Seconds between two test drives of one character. */
  testDriveCooldown: number;
  /** Accounts a buyer pays from, tried in order. */
  accounts: string[];
  /** Account the seller is paid into. */
  payoutAccount: string;
  blip: BlipStyle;
}

const names = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/** The cut's target from the panel; an owner without a picked job / gang is none. */
function readCommissionTo(v: Record<string, unknown>): CommissionTarget | null {
  const owner = v.commissionTo;
  if (owner !== "job" && owner !== "gang") return null;
  const id = str(owner === "job" ? v.commissionJob : v.commissionGang, "", 32);
  return id === ""
    ? null
    : { owner, id, account: str(v.commissionAccount, "bank", 32) || "bank" };
}

export function readSettings(raw: unknown): Settings {
  const v = record(raw);
  const accounts = names(v.accounts);
  const minPrice = int(v.minPrice, 1000, 1, 100_000_000);
  return {
    commission: num(v.commission, 10, 0, 90),
    commissionTo: readCommissionTo(v),
    dealerShare: num(v.dealerShare, 50, 0, 100),
    minPrice,
    maxPrice: Math.max(minPrice, int(v.maxPrice, 10_000_000, 1, 100_000_000)),
    maxListings: int(v.maxListings, 3, 1, 50),
    testDriveSeconds: int(v.testDriveSeconds, 60, 10, 600),
    testDriveCooldown: int(v.testDriveCooldown, 60, 0, 3600),
    accounts: accounts.length > 0 ? accounts : ["bank", "cash"],
    payoutAccount: str(v.payoutAccount, "bank", 32),
    blip: readBlipStyle(v.blip, { sprite: 326, color: 3, scale: 0.75 }),
  };
}
