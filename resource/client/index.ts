import {
  cache,
  drivenVehicle,
  notify,
  onCache,
  onServerEvent,
  onStop,
  Points,
  Zones,
} from "@aicore-fivem/lib/client";
import { isRecord, num, readId, RecordObjects } from "@aicore-fivem/lib/shared";
import { Locale } from "common";
import {
  EVENTS,
  idsOf,
  readLot,
  rowsOf,
  toDisplayRow,
  toListingRow,
} from "common/sales";
import { Browser, type ListingAction } from "./browser";
import { settings, world } from "./content";
import { atSellSpot } from "./sell";
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
  (id) => lots.records.get(id),
);

const onFoot = (): boolean => cache.vehicle === false;
const driving = (): boolean => drivenVehicle() !== false;

/**
 * Each lot: the counter (browse, NPC, blip), the sell spot (while driving) and the area its parked cars show in. An
 * edited lot rebuilds only its own objects; the blip setting rebuilds every lot.
 */
const points = new Points();
const zones = new Zones();
const lots = new RecordObjects(world, "lots", readLot, (id, lot) => {
  const coords = { x: lot.x, y: lot.y, z: lot.z };
  points.add(`lot:${id}`, {
    ped: lot.ped ?? undefined,
    coords,
    label: Locale("PROMPT_BROWSE", lot.label),
    icon: "car",
    radius: lot.radius,
    blip: lot.blip ? { ...settings.value.blip, label: lot.label } : undefined,
    canShow: () => onFoot() && !browser.lot,
    onPressed: () => browser.open(lot, null),
  });
  points.add(`sell:${id}`, {
    coords: lot.sell,
    label: Locale("PROMPT_SELL"),
    icon: "tag",
    radius: 4,
    height: 4,
    promptOnly: true,
    canShow: driving,
    onPressed: () => atSellSpot(lot),
  });
  zones.add(`area:${id}`, {
    shape: { type: "sphere", center: coords, radius: lot.area },
    interval: 1000,
    onEnter: () => showcase.enter(lot),
    onExit: () => showcase.leave(),
  });
  return () => {
    points.remove(`lot:${id}`);
    points.remove(`sell:${id}`);
    zones.remove(`area:${id}`);
  };
});
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
