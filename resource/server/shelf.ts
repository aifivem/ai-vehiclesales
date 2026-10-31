import type { Listing } from "./listing";

/** What a change did to the parked cars of a lot: listings that now stand on a (new) spot, ids that left one. */
export interface ParkChange {
  parked: Listing[];
  unparked: number[];
}

/**
 * One lot's listings in listing order and which of them stand on its parking spots: first listed, first parked; a
 * freed spot goes to the oldest waiting listing. Every operation is O(1) apart from a scan of the spots (at most 100).
 */
export class LotShelf {
  readonly all = new Map<number, Listing>();
  private spots: (Listing | null)[] = [];
  private readonly waiting = new Map<number, Listing>();

  constructor(spotCount: number) {
    this.spots = Array.from({ length: spotCount }, () => null);
  }

  add(listing: Listing): ParkChange {
    this.all.set(listing.id, listing);
    const free = this.spots.indexOf(null);
    if (free < 0) {
      this.waiting.set(listing.id, listing);
      return { parked: [], unparked: [] };
    }
    this.park(listing, free);
    return { parked: [listing], unparked: [] };
  }

  remove(listing: Listing): ParkChange {
    this.all.delete(listing.id);
    this.waiting.delete(listing.id);
    const spot = listing.spot;
    if (spot === null) return { parked: [], unparked: [] };
    listing.spot = null;
    this.spots[spot] = null;
    const next = this.waiting.values().next().value;
    if (!next) return { parked: [], unparked: [listing.id] };
    this.waiting.delete(next.id);
    this.park(next, spot);
    return { parked: [next], unparked: [listing.id] };
  }

  /** The lot's spot count changed (panel): every listing is parked again in listing order. */
  resize(spotCount: number): ParkChange {
    const before = new Map<number, number | null>();
    for (const listing of this.all.values())
      before.set(listing.id, listing.spot);
    this.spots = Array.from({ length: spotCount }, () => null);
    this.waiting.clear();
    let next = 0;
    for (const listing of this.all.values()) {
      if (next < spotCount) this.park(listing, next++);
      else {
        listing.spot = null;
        this.waiting.set(listing.id, listing);
      }
    }
    const change: ParkChange = { parked: [], unparked: [] };
    for (const listing of this.all.values()) {
      if (before.get(listing.id) === listing.spot) continue;
      if (listing.spot === null) change.unparked.push(listing.id);
      else change.parked.push(listing);
    }
    return change;
  }

  parked(): Listing[] {
    return this.spots.filter((l): l is Listing => l !== null);
  }

  private park(listing: Listing, spot: number): void {
    listing.spot = spot;
    this.spots[spot] = listing;
  }
}
