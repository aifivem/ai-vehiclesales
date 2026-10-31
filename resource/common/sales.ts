import {
  bool,
  type BlipStyle,
  int,
  num,
  type PlacePed,
  readBlipStyle,
  readPlacePed,
  record,
  str,
  vec4,
  type Vec4,
} from "@aicore-fivem/lib/shared";

/** ai-vehiclesales' contracts and panel content. No natives. */

export const EVENTS = {
  /** Callback: (lotId) -> { ok } starts display deltas; the parked listings arrive on `display` before the reply. */
  watch: "ai-vehiclesales:watch",
  /** Client event: () stop the display deltas (left the lot). */
  unwatch: "ai-vehiclesales:unwatch",
  /** Server event: (lotId, puts: DisplayRow[], removes: number[]) parked listings changed. */
  display: "ai-vehiclesales:display",
  /** Callback: (lotId) -> { ok, now } starts screen deltas; every listing arrives on `listings` before the reply. */
  browse: "ai-vehiclesales:browse",
  /** Client event: () stop the screen deltas (screen closed). */
  unbrowse: "ai-vehiclesales:unbrowse",
  /** Server event: (lotId, puts: ListingRow[], removes: number[]) listings of the open screen changed. */
  listings: "ai-vehiclesales:listings",
  /** Callback: (lotId, listingId) -> { ok, description, look } the preview of one listing. */
  details: "ai-vehiclesales:details",
  /** Callback: (lotId, netId, price, description) -> { ok } list the vehicle the player drives. */
  list: "ai-vehiclesales:list",
  /** Callback: (lotId, netId) -> { ok, price } what the dealer pays for the vehicle the player drives. */
  quote: "ai-vehiclesales:quote",
  /** Callback: (lotId, netId) -> { ok, price } sell the driven vehicle to the dealer; it is gone, the price paid. */
  sellBack: "ai-vehiclesales:sellBack",
  /** Callback: (lotId, listingId) -> { ok, plate } buy it; it is delivered at the lot. */
  buy: "ai-vehiclesales:buy",
  /** Callback: (lotId, listingId) -> { ok } the seller takes the listing back; delivered at the lot. */
  takeBack: "ai-vehiclesales:takeBack",
  /** Callback: (lotId, listingId) -> { ok, seconds } a test drive in a temporary copy. */
  testDrive: "ai-vehiclesales:testDrive",
  /** Callback: () -> { ok } end the running test drive. */
  endTestDrive: "ai-vehiclesales:endTestDrive",
  /** Server event: (lotId) the test drive ended; the player goes back to the lot. */
  testDriveEnded: "ai-vehiclesales:testDriveEnded",
} as const;

/** Longest listing description. */
export const DESCRIPTION_MAX = 200;

export interface Lot {
  /** NPC standing at the counter (panel), null for none. */
  ped: PlacePed | null;
  id: string;
  label: string;
  /** The counter: browse the lot from here. */
  x: number;
  y: number;
  z: number;
  radius: number;
  /** Metres around the counter in which parked listings show (and buyers may act). */
  area: number;
  /** Where players drive in to list their vehicle. */
  sell: { x: number; y: number; z: number };
  /** Where listings are parked, first come first parked. */
  spots: Vec4[];
  /** Where the previewed listing stands and the camera looking at it. */
  preview: Vec4;
  camera: Vec4;
  /** Where bought, returned and test drive vehicles appear. */
  delivery: Vec4;
  blip: boolean;
}

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

/** One lot record (`panel.records` / `world.records`). */
export function readLot(id: string, v: Record<string, unknown>): Lot {
  const c = record(v.coords);
  const at = { x: num(c.x, 0), y: num(c.y, 0), z: num(c.z, 0), heading: 0 };
  const s = record(v.sell);
  const spots = Array.isArray(v.spots)
    ? v.spots.map((row) => vec4(record(row).coords, at))
    : [];
  return {
    ped: readPlacePed(v.ped),
    id,
    label: str(v.label, id, 48),
    x: at.x,
    y: at.y,
    z: at.z,
    radius: num(v.radius, 2, 1, 10),
    area: num(v.area, 80, 20, 300),
    sell: { x: num(s.x, at.x), y: num(s.y, at.y), z: num(s.z, at.z) },
    spots,
    preview: vec4(v.preview, at),
    camera: vec4(v.camera, at),
    delivery: vec4(v.delivery, at),
    blip: bool(v.blip, true),
  };
}

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

/** What the dealer pays for a vehicle of a catalog price. */
export const dealerPriceOf = (catalogPrice: number, share: number): number =>
  Math.floor((catalogPrice * share) / 100);

/** What the seller receives for a price. */
export const payoutOf = (price: number, commission: number): number =>
  price - Math.floor((price * commission) / 100);

/** One listing of the browse screen; `mine` is worked out per viewer. */
export interface ListingRow {
  id: number;
  model: string;
  plate: string;
  price: number;
  seller: string;
  /** Server epoch ms. */
  listed: number;
  mine: boolean;
}

/** The look a parked or previewed listing is drawn with: stored props, else the spawn setup (never parked). */
export interface Look {
  props: unknown;
  setup: unknown;
}

/** One parked listing (lot watchers). */
export interface DisplayRow {
  id: number;
  spot: number;
  model: string;
  plate: string;
  price: number;
  look: Look;
}

/** A listing row from the server, checked (msgpack may turn values into null). */
export function toListingRow(v: unknown): ListingRow | null {
  const r = record(v);
  if (
    typeof r.id !== "number" ||
    typeof r.model !== "string" ||
    typeof r.plate !== "string" ||
    typeof r.price !== "number"
  )
    return null;
  return {
    id: r.id,
    model: r.model,
    plate: r.plate,
    price: r.price,
    seller: typeof r.seller === "string" ? r.seller : "",
    listed: num(r.listed, 0),
    mine: r.mine === true,
  };
}

/** A parked listing row from the server, checked. */
export function toDisplayRow(v: unknown): DisplayRow | null {
  const r = record(v);
  if (
    typeof r.id !== "number" ||
    typeof r.spot !== "number" ||
    typeof r.model !== "string" ||
    typeof r.plate !== "string" ||
    typeof r.price !== "number"
  )
    return null;
  const look = record(r.look);
  return {
    id: r.id,
    spot: r.spot,
    model: r.model,
    plate: r.plate,
    price: r.price,
    look: { props: look.props ?? null, setup: look.setup ?? null },
  };
}

/** A list of rows, each checked; bad rows drop. */
export const rowsOf = <T>(v: unknown, read: (row: unknown) => T | null): T[] =>
  Array.isArray(v) ? v.flatMap((row) => read(row) ?? []) : [];

/** A list of listing ids. */
export const idsOf = (v: unknown): number[] =>
  Array.isArray(v) ? v.filter((x): x is number => typeof x === "number") : [];

/** A listing as the NUI shows it: the row plus the game's name of the model. */
export interface ScreenRow extends ListingRow {
  label: string;
}

/** Client -> NUI messages. */
export type NuiMessage =
  | {
      action: "open";
      data: {
        texts: Record<string, string>;
        lot: { id: string; label: string };
        /** Server epoch ms at the snapshot (the page works out its clock offset). */
        now: number;
        rows: ScreenRow[];
        selected: number | null;
        commission: number;
        testDriveSeconds: number;
      };
    }
  | { action: "put"; data: ScreenRow[] }
  | { action: "remove"; data: number[] }
  | { action: "timer"; data: { seconds: number } }
  | { action: "close"; data: null };
