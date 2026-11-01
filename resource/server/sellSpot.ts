import {
  isNear,
  online,
  SourceLock,
  vehicleNearPlayer,
} from "@aicore-fivem/lib/server";
import type { CharacterInfo, OwnedVehicle } from "@aicore-fivem/shared";
import type { Lot } from "common/lots";
import { lots } from "./content";
import { vehiclesApi } from "./vehicles";

/** One sell-spot action (list or dealer sale) at a time per player. */
export const sellLock = new SourceLock();

/** Seats checked for other occupants (front passenger to the last seat of the biggest vehicles). */
const SEATS = 15;

const onlyDriver = (vehicle: number, ped: number): boolean => {
  for (let seat = 0; seat < SEATS; seat++) {
    const rider = GetPedInVehicleSeat(vehicle, seat);
    if (rider && rider !== ped) return false;
  }
  return true;
};

/** The player's own vehicle, driven alone onto a lot's sell spot. */
export interface DrivenVehicle {
  lot: Lot;
  character: CharacterInfo;
  entity: number;
  vehicleId: number;
  vehicle: OwnedVehicle;
}

/** Checks the vehicle a player sells (listing or dealer); the lang key of the refusal otherwise. */
export function drivenAtSellSpot(
  source: number,
  lotId: string,
  netId: number,
): DrivenVehicle | string {
  const lot = lots.get(lotId);
  const character = online.character(source);
  if (!lot || !character || !isNear(source, lot.sell, 8)) return "ERR_FAR";
  const entity = vehicleNearPlayer(source, netId, { driver: true });
  if (!entity) return "ERR_NOT_DRIVING";
  if (!onlyDriver(entity, GetPlayerPed(String(source)))) return "ERR_OCCUPIED";
  const vehicleId = vehiclesApi.GetVehicleIdByEntity(entity);
  const vehicle = vehicleId === null ? null : vehiclesApi.GetVehicle(vehicleId);
  if (!vehicle || vehicleId === null) return "ERR_NOT_OWNED";
  if (
    vehicle.owner.type !== "character" ||
    vehicle.owner.id !== String(character.id)
  )
    return "ERR_NOT_YOURS";
  return { lot, character, entity, vehicleId, vehicle };
}
