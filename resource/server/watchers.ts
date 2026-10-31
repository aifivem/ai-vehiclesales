import { PlayerMap } from "@aicore-fivem/lib/server";

/** Players who receive one lot's deltas (its parked cars, or its open screen): one lot each, freed on drop. */
export class Watchers {
  private readonly byLot = new Map<string, Set<number>>();
  private readonly lotOf = new PlayerMap<string>({
    onDrop: (source, lot) => this.leave(source, lot),
  });

  watch(source: number, lot: string): void {
    this.stop(source);
    this.lotOf.set(source, lot);
    let set = this.byLot.get(lot);
    if (!set) this.byLot.set(lot, (set = new Set()));
    set.add(source);
  }

  stop(source: number): void {
    const lot = this.lotOf.get(source);
    if (lot === undefined) return;
    this.lotOf.delete(source);
    this.leave(source, lot);
  }

  of(lot: string): ReadonlySet<number> | undefined {
    return this.byLot.get(lot);
  }

  private leave(source: number, lot: string): void {
    const set = this.byLot.get(lot);
    if (!set) return;
    set.delete(source);
    if (set.size === 0) this.byLot.delete(lot);
  }
}
