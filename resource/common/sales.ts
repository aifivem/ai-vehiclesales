import type { ScreenRow } from "./rows";

/** ai-vehiclesales' contracts (panel content: `lots.ts`, `settings.ts`; rows: `rows.ts`). No natives. */

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
