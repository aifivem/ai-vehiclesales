import { aiLog, nearestVehicleAt, online } from "@aicore-fivem/lib/server";
import { fail } from "@aicore-fivem/lib/shared";
import { lots } from "../content";
import { listings } from "../listings/listings";
import { inLot } from "../lotArea";
import { characterOwner, deliver, isHeld, vehiclesApi } from "../vehicles";

/** The seller takes a listing back; it comes out at the lot. */
export async function takeBack(source: number, lotId: string, id: number) {
  const lot = lots.get(lotId);
  const listing = listings.get(id);
  const character = online.character(source);
  if (!lot || !character || !inLot(source, lot)) return fail("ERR_FAR");
  if (!listing || listing.lot !== lot.id) return fail("ERR_GONE");
  if (listing.seller !== character.id) return fail("ERR_NOT_YOURS");
  if (!listings.claim(listing.id)) return fail("ERR_BUSY");
  try {
    if (!isHeld(vehiclesApi.GetVehicle(listing.vehicleId)))
      return fail("ERR_GONE");
    if (nearestVehicleAt(lot.delivery, 3)) return fail("ERR_BLOCKED");
    if (!(await listings.withdraw(listing))) return fail("ERR_FAILED");
    vehiclesApi.SetOwner(listing.vehicleId, characterOwner(character.id));
    const netId = await deliver(listing.vehicleId, lot, source, "garage");
    aiLog("listings", `took ${listing.plate} back from ${lot.id}`, {
      source,
      metadata: { plate: listing.plate, lot: lot.id },
    });
    return { ok: true, delivered: netId !== null };
  } finally {
    listings.release(listing.id);
  }
}
