import { KeyWatchers, online } from "@aicore-fivem/lib/server";
import {
  EVENTS,
  type DisplayRow,
  type ListingRow,
  type Look,
} from "common/sales";
import type { Listing } from "./listing";
import { lookOf, vehiclesApi } from "./vehicles";

const NO_LOOK: Look = { props: null, setup: null };
/** Rows per snapshot event: parked rows carry the look (about 1 KB each), screen rows about 100 bytes. */
const DISPLAY_CHUNK = 10;
const SCREEN_CHUNK = 200;

/** The look of a listing, read from ai-vehicles once. */
function lookOfListing(listing: Listing): Look {
  if (listing.look) return listing.look;
  const vehicle = vehiclesApi.GetVehicle(listing.vehicleId);
  if (!vehicle) return NO_LOOK;
  listing.look = lookOf(vehicle);
  return listing.look;
}

export function displayRow(listing: Listing): DisplayRow {
  return {
    id: listing.id,
    spot: listing.spot ?? 0,
    model: listing.model,
    plate: listing.plate,
    price: listing.price,
    look: lookOfListing(listing),
  };
}

export function screenRow(listing: Listing, viewer: number | null): ListingRow {
  return {
    id: listing.id,
    model: listing.model,
    plate: listing.plate,
    price: listing.price,
    seller: listing.sellerName,
    listed: listing.listed,
    mine: listing.seller === viewer,
  };
}

/**
 * Who hears a lot's changes: players standing in the lot get its parked cars (with their look), players with the
 * lot's screen open get its listing rows (`mine` worked out per viewer). The snapshot goes in small ordinary events
 * on the same channel as the deltas (a latent event could overtake them), ahead of the watch / browse reply.
 */
export class LotSync {
  readonly parked = new KeyWatchers<string>();
  readonly screens = new KeyWatchers<string>();

  /** Starts a player's parked-car deltas with every parked car of the lot. */
  watchParked(source: number, lot: string, parked: Listing[]): void {
    this.parked.watch(source, lot);
    for (let i = 0; i < parked.length; i += DISPLAY_CHUNK)
      emitNet(
        EVENTS.display,
        source,
        lot,
        parked.slice(i, i + DISPLAY_CHUNK).map(displayRow),
        [],
      );
  }

  /** Starts a player's screen deltas with every listing of the lot. */
  watchScreen(source: number, lot: string, all: Iterable<Listing>): void {
    this.screens.watch(source, lot);
    const viewer = online.charId(source) ?? null;
    let chunk: ListingRow[] = [];
    for (const listing of all) {
      chunk.push(screenRow(listing, viewer));
      if (chunk.length < SCREEN_CHUNK) continue;
      emitNet(EVENTS.listings, source, lot, chunk, []);
      chunk = [];
    }
    if (chunk.length > 0) emitNet(EVENTS.listings, source, lot, chunk, []);
  }

  display(lot: string, puts: Listing[], removes: number[]): void {
    const watchers = this.parked.of(lot);
    if (!watchers || (puts.length === 0 && removes.length === 0)) return;
    const rows = puts.map(displayRow);
    for (const source of watchers)
      emitNet(EVENTS.display, source, lot, rows, removes);
  }

  screen(lot: string, puts: Listing[], removes: number[]): void {
    const watchers = this.screens.of(lot);
    if (!watchers || (puts.length === 0 && removes.length === 0)) return;
    for (const source of watchers) {
      const viewer = online.charId(source) ?? null;
      emitNet(
        EVENTS.listings,
        source,
        lot,
        puts.map((l) => screenRow(l, viewer)),
        removes,
      );
    }
  }
}
