import { isNear } from "@aicore-fivem/lib/server";
import type { Lot } from "common/lots";

/** The player stands inside the lot (plus `slack` metres). */
export const inLot = (source: number, lot: Lot, slack = 0): boolean =>
  isNear(source, lot, lot.area + slack);
