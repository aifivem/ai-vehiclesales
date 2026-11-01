import {
  AdminWorld,
  setVehicleProps,
  setVehicleSetup,
} from "@aicore-fivem/lib/client";
import { toVehicleProps, toVehicleSetup } from "@aicore-fivem/lib/shared";
import type { Look } from "common/rows";
import { readSettings } from "common/settings";

/** The panel's world files on this client. */
export const world = new AdminWorld(["settings", "lots"]);
export const settings = world.view("settings", readSettings);

/** Dresses a local vehicle in a listing's look: stored props, else the spawn setup; the listing's plate either way. */
export function applyLook(vehicle: number, look: Look, plate: string): void {
  const props = toVehicleProps(look.props);
  if (props) setVehicleProps(vehicle, { ...props, plate });
  else {
    const setup = toVehicleSetup(look.setup);
    if (setup) setVehicleSetup(vehicle, setup);
    SetVehicleNumberPlateText(vehicle, plate);
  }
}

/** A frozen, locked, unbreakable local vehicle (parked listings, the preview). */
export function standStill(vehicle: number): void {
  SetVehicleOnGroundProperly(vehicle);
  FreezeEntityPosition(vehicle, true);
  SetEntityInvincible(vehicle, true);
  SetVehicleDoorsLocked(vehicle, 2);
  SetVehicleDirtLevel(vehicle, 0);
}
