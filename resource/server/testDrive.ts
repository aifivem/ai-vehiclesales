import {
  KeyedCooldowns,
  nearestVehicleAt,
  PlayerMap,
  randomPlate,
  spawnVehicle,
  vehicleKeys,
} from "@aicore-fivem/lib/server";
import {
  fail,
  toVehicleProps,
  toVehicleSetup,
  type ActionResult,
} from "@aicore-fivem/lib/shared";
import { EVENTS, type Lot } from "common/sales";
import { settings } from "./content";
import type { Listing } from "./listing";
import { isHeld, vehiclesApi } from "./vehicles";

interface Drive {
  entity: number;
  plate: string;
  lot: string;
  timer: ReturnType<typeof setTimeout>;
}

/** Seconds the server waits past the client's own end before it ends a test drive itself. */
const GRACE_MS = 3000;

/**
 * Test drives: a temporary copy of the listed vehicle (its look, a test plate, temporary keys) with the player at the
 * wheel. The server ends it at the time limit, on request, or when the player leaves; the copy is always deleted.
 */
class TestDrives {
  private readonly drives = new PlayerMap<Drive>({
    onDrop: (_source, drive) => this.clear(drive),
  });
  private readonly cooldowns = new KeyedCooldowns<number>();

  async start(
    source: number,
    charId: number,
    lot: Lot,
    listing: Listing,
  ): Promise<ActionResult<{ seconds: number }>> {
    if (this.drives.has(source)) return fail("ERR_DRIVING");
    if (!this.cooldowns.ready(charId)) return fail("ERR_COOLDOWN");
    const vehicle = vehiclesApi.GetVehicle(listing.vehicleId);
    if (!isHeld(vehicle)) return fail("ERR_GONE");
    if (nearestVehicleAt(lot.delivery, 3)) return fail("ERR_BLOCKED");
    const plate = randomPlate("TEST");
    const props = toVehicleProps(vehicle.props);
    const setup = props ? null : toVehicleSetup(vehicle.setup);
    const entity = await spawnVehicle({
      model: vehicle.model,
      coords: lot.delivery,
      asker: source,
      plate,
      fuel: 100,
      ...(props ? { props: { ...props, plate } } : {}),
      ...(setup ? { setup } : {}),
      keysTo: source,
      purpose: "temporary",
      driver: source,
    });
    if (entity === null) return fail("ERR_SPAWN");
    const seconds = settings.value.testDriveSeconds;
    this.cooldowns.start(charId, settings.value.testDriveCooldown * 1000);
    this.drives.set(source, {
      entity,
      plate,
      lot: lot.id,
      // Natives need the game thread: a Node timer hops back with setImmediate.
      timer: setTimeout(
        () => setImmediate(() => this.end(source)),
        seconds * 1000 + GRACE_MS,
      ),
    });
    return { ok: true, seconds };
  }

  /** Ends the player's test drive: the copy goes and the player is sent back to the lot. */
  end(source: number): void {
    const drive = this.drives.get(source);
    if (!drive) return;
    this.drives.delete(source);
    this.clear(drive);
    vehicleKeys.remove(source, drive.plate);
    emitNet(EVENTS.testDriveEnded, source, drive.lot);
  }

  private clear(drive: Drive): void {
    clearTimeout(drive.timer);
    if (DoesEntityExist(drive.entity)) DeleteEntity(drive.entity);
  }

  /** Every running copy goes with the resource. */
  stopAll(): void {
    for (const drive of this.drives.values()) this.clear(drive);
  }
}

export const testDrives = new TestDrives();
