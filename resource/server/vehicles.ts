import { resourceExport } from "@aicore-fivem/lib/server";
import type {
  KeyPurpose,
  OwnedVehicle,
  VehicleOwner,
} from "@aicore-fivem/shared";
import type { Look, Lot } from "common/sales";

/** ai-vehicles: every listed vehicle stays there, owned by this hold owner while it is listed. */
export const vehiclesApi = resourceExport("ai-vehicles");

/**
 * The owner of listed vehicles. ai-vehicles keeps every non-character owner in memory from its start, so a listing
 * can change hands while its seller is offline. A job name never contains `-`, so no real job matches it.
 */
export const HOLD: VehicleOwner = { type: "resource", id: "ai-vehiclesales" };

export const isHeld = (v: OwnedVehicle | null): v is OwnedVehicle =>
  v !== null && v.owner.type === HOLD.type && v.owner.id === HOLD.id;

export const characterOwner = (charId: number): VehicleOwner => ({
  type: "character",
  id: String(charId),
});

export const lookOf = (v: OwnedVehicle): Look => ({
  props: v.props ?? null,
  setup: v.setup ?? null,
});

/**
 * Hands an owned vehicle to a player at the lot's delivery spot; when it cannot be spawned it waits at the impound
 * (a character vehicle without a garage is listed nowhere else). Resolves the net id or null.
 */
export function deliver(
  vehicleId: number,
  lot: Lot,
  source: number,
  purpose: KeyPurpose,
): Promise<number | null> {
  return new Promise<number | null>((resolve) =>
    vehiclesApi.SpawnVehicle(vehicleId, lot.delivery, source, resolve, purpose),
  ).then((netId) => {
    if (netId === null) vehiclesApi.StoreVehicle(vehicleId, null, "impound");
    return netId;
  });
}
