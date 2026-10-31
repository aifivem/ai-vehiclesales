import type { Look } from "common/sales";

/** One listed vehicle in memory. Everything but the parking spot and the cached look is fixed while it is listed. */
export class Listing {
  /** Index of the lot spot it is parked on, null while it waits for one. */
  spot: number | null = null;
  /** The look from ai-vehicles, read on first use (the vehicle does not change while it is held). */
  look: Look | null = null;

  constructor(
    readonly id: number,
    readonly vehicleId: number,
    readonly lot: string,
    /** Character id. */
    readonly seller: number,
    readonly sellerName: string,
    readonly model: string,
    readonly plate: string,
    readonly price: number,
    readonly description: string,
    /** Epoch ms. */
    readonly listed: number,
  ) {}
}
