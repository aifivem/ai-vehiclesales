import { num, record } from "@aicore-fivem/lib/shared";

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
