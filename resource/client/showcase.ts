import {
  cache,
  callAction,
  Points,
  requestModel,
  vehicleLabel,
} from "@aicore-fivem/lib/client";
import { groupDigits } from "@aicore-fivem/lib/shared";
import { Locale } from "common";
import { EVENTS, type DisplayRow, type Lot } from "common/sales";
import { applyLook, standStill } from "./content";

interface Parked {
  row: DisplayRow;
  /** 0 while the model loads. */
  entity: number;
}

/**
 * The parked listings of the lot the player is in: local, frozen vehicles on the lot's spots (nobody can drive,
 * push or steal them, and they cost the network nothing), each with a point that opens the lot's screen on it.
 * Fed by the server's snapshot and deltas while the player is inside the lot.
 */
export class Showcase {
  private lot: Lot | null = null;
  private readonly cars = new Map<number, Parked>();
  private readonly points = new Points();
  private version = 0;

  constructor(private readonly onView: (lot: Lot, id: number) => unknown) {}

  enter(lot: Lot): void {
    this.leave();
    this.lot = lot;
    const version = ++this.version;
    void callAction(EVENTS.watch, [lot.id], {
      fallback: "ERR_FAR",
      silent: true,
    }).then((reply) => {
      if (!reply && version === this.version) this.leave(false);
    });
  }

  leave(tell = true): void {
    if (!this.lot) return;
    if (tell) emitNet(EVENTS.unwatch);
    this.lot = null;
    this.version++;
    for (const id of this.cars.keys()) this.drop(id);
  }

  apply(lot: string, puts: DisplayRow[], removes: number[]): void {
    if (lot !== this.lot?.id) return;
    for (const id of removes) this.drop(id);
    for (const row of puts) void this.place(row);
  }

  refresh(): void {
    this.points.refresh();
  }

  private async place(row: DisplayRow): Promise<void> {
    this.drop(row.id);
    const parked: Parked = { row, entity: 0 };
    this.cars.set(row.id, parked);
    const hash = await requestModel(row.model).catch(() => 0);
    const lot = this.lot;
    const spot = lot?.spots[row.spot];
    if (!hash || !lot || !spot || this.cars.get(row.id) !== parked) return;
    const vehicle = CreateVehicle(
      hash,
      spot.x,
      spot.y,
      spot.z,
      spot.heading,
      false,
      false,
    );
    SetModelAsNoLongerNeeded(hash);
    applyLook(vehicle, row.look, row.plate);
    standStill(vehicle);
    parked.entity = vehicle;
    this.points.add(`car:${row.id}`, {
      coords: { x: spot.x, y: spot.y, z: spot.z },
      label: Locale(
        "PROMPT_VIEW",
        vehicleLabel(row.model),
        groupDigits(row.price),
      ),
      icon: "car",
      radius: 3,
      canShow: () => cache.vehicle === false,
      onPressed: () => this.onView(lot, row.id),
    });
  }

  private drop(id: number): void {
    const parked = this.cars.get(id);
    if (!parked) return;
    this.cars.delete(id);
    if (parked.entity) DeleteEntity(parked.entity);
    this.points.remove(`car:${id}`);
  }
}
