import { onClientCallback, onClientEvent } from "@aicore-fivem/lib/server";
import { fail, readId, readText } from "@aicore-fivem/lib/shared";
import { EVENTS } from "common/sales";
import { lots } from "./content";
import { inLot } from "./lotArea";
import { listings } from "./listings/listings";
import { lookOf, vehiclesApi } from "./vehicles";

const lotArg = ([id]: unknown[]): [string] | null => {
  const lot = readText(id, 48);
  return lot === null ? null : [lot];
};

/** The parked cars of a lot, for players walking in (they arrive on `display` ahead of the reply). */
onClientCallback(
  EVENTS.watch,
  { args: lotArg, rate: { count: 3, windowMs: 3000 } },
  (source, lotId) => {
    const lot = lots.get(lotId);
    if (!lot || !inLot(source, lot, 20)) return fail("ERR_FAR");
    listings.sync.watchParked(source, lot.id, listings.parkedAt(lot.id));
    return { ok: true };
  },
);
onClientEvent(EVENTS.unwatch, (source) => listings.sync.parked.stop(source));

/** Every listing of a lot, for its screen (they arrive on `listings` ahead of the reply). */
onClientCallback(
  EVENTS.browse,
  { args: lotArg, rate: { count: 2, windowMs: 2000 } },
  (source, lotId) => {
    const lot = lots.get(lotId);
    if (!lot || !inLot(source, lot)) return fail("ERR_FAR");
    listings.sync.watchScreen(source, lot.id, listings.atLot(lot.id));
    return { ok: true, now: Date.now() };
  },
);
onClientEvent(EVENTS.unbrowse, (source) => listings.sync.screens.stop(source));

/** One listing's description and look, for the preview vehicle under the screen's camera. */
onClientCallback(
  EVENTS.details,
  {
    args: ([lotId, id]) => {
      const lot = readText(lotId, 48);
      const listing = readId(id);
      return lot === null || listing === null ? null : [lot, listing];
    },
    rate: { count: 6, windowMs: 2000 },
  },
  (source, lotId, id) => {
    const lot = lots.get(lotId);
    const listing = listings.get(id);
    if (!lot || !inLot(source, lot)) return fail("ERR_FAR");
    if (!listing || listing.lot !== lot.id) return fail("ERR_GONE");
    const vehicle = vehiclesApi.GetVehicle(listing.vehicleId);
    listing.look ??= vehicle ? lookOf(vehicle) : null;
    return {
      ok: true,
      description: listing.description,
      look: listing.look ?? { props: null, setup: null },
    };
  },
);
