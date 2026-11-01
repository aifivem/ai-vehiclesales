import { useMemo } from "react";
import type { ScreenRow } from "../../../../resource/common/rows";
import type { Filter, Sort } from "./Toolbar";

const SORTERS: Record<Sort, (a: ScreenRow, b: ScreenRow) => number> = {
  newest: (a, b) => b.listed - a.listed,
  cheap: (a, b) => a.price - b.price,
  pricey: (a, b) => b.price - a.price,
};

/** The player's own listings and the strip's list: filtered, searched (model name or plate) and sorted. */
export function useListings(
  rows: ScreenRow[],
  filter: Filter,
  search: string,
  sort: Sort,
): { mine: ScreenRow[]; list: ScreenRow[] } {
  const mine = useMemo(() => rows.filter((r) => r.mine), [rows]);
  const list = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const base = filter === "mine" ? mine : rows;
    const found = needle
      ? base.filter(
          (r) =>
            r.label.toLowerCase().includes(needle) ||
            r.plate.toLowerCase().includes(needle),
        )
      : base;
    return [...found].sort(SORTERS[sort]);
  }, [rows, mine, filter, search, sort]);
  return { mine, list };
}
