import { onCache, onServerEvent, onStop } from "@aicore-fivem/lib/client";
import { isRecord, readId } from "@aicore-fivem/lib/shared";
import { idsOf, rowsOf, toDisplayRow, toListingRow } from "common/rows";
import { EVENTS } from "common/sales";
import { world } from "../content";
import { browser, drive, lots, points, showcase } from "./lots";

world.onChange("settings", () => lots.rebuildAll());
onCache("vehicle", (vehicle) => {
  points.refresh();
  showcase.refresh();
  drive.vehicleChanged(vehicle);
});
onCache("seat", () => points.refresh());

onServerEvent(
  EVENTS.display,
  {
    args: ([lot, puts, removes]) =>
      typeof lot === "string"
        ? [lot, rowsOf(puts, toDisplayRow), idsOf(removes)]
        : null,
  },
  (lot, puts, removes) => showcase.apply(lot, puts, removes),
);
onServerEvent(
  EVENTS.listings,
  {
    args: ([lot, puts, removes]) =>
      typeof lot === "string"
        ? [lot, rowsOf(puts, toListingRow), idsOf(removes)]
        : null,
  },
  (lot, puts, removes) => browser.apply(lot, puts, removes),
);
onServerEvent(
  EVENTS.testDriveEnded,
  { args: ([lot]) => (typeof lot === "string" ? [lot] : null) },
  (lot) => drive.ended(lot),
);

const idOf = (d: unknown): number | null => (isRecord(d) ? readId(d.id) : null);
browser.page.on("select", idOf, (id) => browser.select(id));
browser.page.on("buy", idOf, (id) => browser.act("buy", id));
browser.page.on("testDrive", idOf, (id) => browser.act("testDrive", id));
browser.page.on("takeBack", idOf, (id) => browser.act("takeBack", id));

onStop(() => {
  if (browser.page.isOpen) browser.page.close();
  showcase.leave(false);
});
