import {
  cache,
  notify,
  onCache,
  onServerEvent,
  Points,
  Zones,
} from "@aicore-fivem/lib/client";
import { isRecord, num, readId } from "@aicore-fivem/lib/shared";
import { Locale, ResourceName } from "common";
import {
  EVENTS,
  idsOf,
  rowsOf,
  toDisplayRow,
  toListingRow,
} from "common/sales";
import { Browser, type ListingAction } from "./browser";
import { lots, settings, world } from "./content";
import { sell } from "./sell";
import { Showcase } from "./showcase";
import { TestDrive } from "./testDrive";

/** What happens after a screen action went through: the test drive starts, or the result is shown. */
function started(action: ListingAction, reply: Record<string, unknown>): void {
  if (action === "testDrive") return drive.begin(num(reply.seconds, 60));
  const delivered = reply.delivered !== false;
  const done = action === "buy" ? "NOTIFY_BOUGHT" : "NOTIFY_TAKEN_BACK";
  notify(
    Locale(delivered ? done : "NOTIFY_IMPOUND"),
    delivered ? "success" : "info",
  );
}

const browser = new Browser((_lot, action, reply) => started(action, reply));
const showcase = new Showcase((lot, id) => browser.open(lot, id));
const drive = new TestDrive(
  (message) => browser.page.send(message),
  (id) => lots.get(id),
);

const onFoot = (): boolean => cache.vehicle === false;
const driving = (): boolean => cache.vehicle !== false && cache.seat === -1;

/** Each lot: the counter (browse, NPC, blip), the sell spot (while driving) and the area its parked cars show in. */
const points = new Points();
const zones = new Zones();
function rebuild(): void {
  points.clear();
  zones.clear();
  for (const lot of lots.values()) {
    const coords = { x: lot.x, y: lot.y, z: lot.z };
    points.add(`lot:${lot.id}`, {
      ped: lot.ped ?? undefined,
      coords,
      label: Locale("PROMPT_BROWSE", lot.label),
      icon: "car",
      radius: lot.radius,
      blip: lot.blip ? { ...settings.value.blip, label: lot.label } : undefined,
      canShow: () => onFoot() && !browser.lot,
      onPressed: () => browser.open(lot, null),
    });
    points.add(`sell:${lot.id}`, {
      coords: lot.sell,
      label: Locale("PROMPT_SELL"),
      icon: "tag",
      radius: 4,
      height: 4,
      promptOnly: true,
      canShow: driving,
      onPressed: () => sell(lot),
    });
    zones.add(`area:${lot.id}`, {
      shape: { type: "sphere", center: coords, radius: lot.area },
      interval: 1000,
      onEnter: () => showcase.enter(lot),
      onExit: () => showcase.leave(),
    });
  }
}

rebuild();
world.onChange("lots", rebuild);
world.onChange("settings", rebuild);
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

on("onResourceStop", (resource: string) => {
  if (resource !== ResourceName) return;
  if (browser.page.isOpen) browser.page.close();
  showcase.leave(false);
});
