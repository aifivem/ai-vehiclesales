import { mysql } from "@aicore-fivem/mysql";
import { isRecord } from "@aicore-fivem/lib/shared";
import type { Tables } from "./tables";
import { lots } from "./content";
import { db } from "./db";
import { Listing } from "./listing";
import { LotShelf } from "./shelf";
import { LotSync } from "./sync";

type Row = Tables["ai_vehiclesales_listings"];

/** What a new listing needs; the id and time come from the database. */
export type NewListing = Omit<
  Row,
  "id" | "vehicle_id" | "created_at" | "seller_name"
> & { vehicleId: number; sellerName: string };

/**
 * Every listing in memory (loaded once at start; thousands are a few MB), indexed by id, vehicle, seller and lot.
 * Ownership changes write the database first; memory and the deltas to the lot's watchers follow the commit.
 */
class Listings {
  private readonly byId = new Map<number, Listing>();
  private readonly byVehicle = new Map<number, Listing>();
  private readonly bySeller = new Map<number, Set<number>>();
  private readonly shelves = new Map<string, LotShelf>();
  /** Listings an action is working on (buy, take back): a second action on one waits for nothing and is refused. */
  private readonly busy = new Set<number>();
  readonly sync = new LotSync();

  async load(): Promise<void> {
    const rows = await mysql.query<Row[]>(
      "SELECT id, vehicle_id, lot, seller, seller_name, model, plate, price, description, created_at FROM ai_vehiclesales_listings ORDER BY id",
    );
    for (const row of rows)
      this.index(
        new Listing(
          row.id,
          Number(row.vehicle_id),
          row.lot,
          row.seller,
          row.seller_name,
          row.model,
          row.plate,
          row.price,
          row.description,
          Number(row.created_at),
        ),
      );
  }

  get(id: number): Listing | undefined {
    return this.byId.get(id);
  }

  ofVehicle(vehicleId: number): Listing | undefined {
    return this.byVehicle.get(vehicleId);
  }

  countOf(charId: number): number {
    return this.bySeller.get(charId)?.size ?? 0;
  }

  /** The lot's listings in listing order. */
  atLot(lot: string): Iterable<Listing> {
    return this.shelves.get(lot)?.all.values() ?? [];
  }

  /** The listings parked on the lot's spots. */
  parkedAt(lot: string): Listing[] {
    return this.shelves.get(lot)?.parked() ?? [];
  }

  /** Marks a listing as worked on; false when another action holds it. */
  claim(id: number): boolean {
    if (this.busy.has(id)) return false;
    this.busy.add(id);
    return true;
  }

  release(id: number): void {
    this.busy.delete(id);
  }

  /** Stores a new listing; null when the database refused it. Call `add` once the vehicle is held. */
  async create(data: NewListing): Promise<Listing | null> {
    const id = await db.insert("ai_vehiclesales_listings", {
      vehicle_id: data.vehicleId,
      lot: data.lot,
      seller: data.seller,
      seller_name: data.sellerName,
      model: data.model,
      plate: data.plate,
      price: data.price,
      description: data.description,
    });
    if (id === null) return null;
    return new Listing(
      id,
      data.vehicleId,
      data.lot,
      data.seller,
      data.sellerName,
      data.model,
      data.plate,
      data.price,
      data.description,
      Date.now(),
    );
  }

  add(listing: Listing): void {
    const change = this.index(listing);
    this.sync.display(listing.lot, change.parked, change.unparked);
    this.sync.screen(listing.lot, [listing], []);
  }

  /** Sold: the listing row goes and the seller's payout row comes in one transaction. */
  async sell(listing: Listing, payout: number): Promise<boolean> {
    const done = await mysql.startTransaction(async (query) => {
      const deleted = await query(
        "DELETE FROM ai_vehiclesales_listings WHERE id = ?",
        [listing.id],
      );
      if (!isRecord(deleted) || deleted.affectedRows !== 1) return false;
      await query(
        "INSERT INTO ai_vehiclesales_payouts (seller, amount, model, plate) VALUES (?, ?, ?, ?)",
        [listing.seller, payout, listing.model, listing.plate],
      );
    });
    if (done) this.remove(listing);
    return done;
  }

  /** The seller took it back. */
  async withdraw(listing: Listing): Promise<boolean> {
    const deleted = await db.remove("ai_vehiclesales_listings", {
      id: listing.id,
      seller: listing.seller,
    });
    if (deleted !== 1) return false;
    this.remove(listing);
    return true;
  }

  /** The lot's spots changed in the panel (or a lot appeared): park its listings again. */
  relayout(lot: string): void {
    const shelf = this.shelves.get(lot);
    if (!shelf) return;
    const change = shelf.resize(lots.get(lot)?.spots.length ?? 0);
    this.sync.display(lot, change.parked, change.unparked);
  }

  private index(listing: Listing) {
    this.byId.set(listing.id, listing);
    this.byVehicle.set(listing.vehicleId, listing);
    let mine = this.bySeller.get(listing.seller);
    if (!mine) this.bySeller.set(listing.seller, (mine = new Set()));
    mine.add(listing.id);
    let shelf = this.shelves.get(listing.lot);
    if (!shelf)
      this.shelves.set(
        listing.lot,
        (shelf = new LotShelf(lots.get(listing.lot)?.spots.length ?? 0)),
      );
    return shelf.add(listing);
  }

  private remove(listing: Listing): void {
    this.byId.delete(listing.id);
    this.byVehicle.delete(listing.vehicleId);
    const mine = this.bySeller.get(listing.seller);
    mine?.delete(listing.id);
    if (mine?.size === 0) this.bySeller.delete(listing.seller);
    const shelf = this.shelves.get(listing.lot);
    if (!shelf) return;
    const change = shelf.remove(listing);
    if (shelf.all.size === 0) this.shelves.delete(listing.lot);
    this.sync.display(listing.lot, change.parked, change.unparked);
    this.sync.screen(listing.lot, [], [listing.id]);
  }
}

export const listings = new Listings();
