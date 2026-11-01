import {
  cache,
  drivenVehicle,
  notify,
  Points,
  Zones,
} from "@aicore-fivem/lib/client";
import { num, RecordObjects } from "@aicore-fivem/lib/shared";
import { Locale } from "common";
import { readLot } from "common/lots";
import { settings, world } from "../content";
import { Browser, type ListingAction } from "./browser";
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

export const browser = new Browser((_lot, action, reply) =>
  started(action, reply),
);
export const showcase = new Showcase((lot, id) => browser.open(lot, id));
export const drive = new TestDrive(
  (message) => browser.page.send(message),
  (id) => lots.records.get(id),
);

const onFoot = (): boolean => cache.vehicle === false;
const driving = (): boolean => drivenVehicle() !== false;

/**
 * Each lot: the counter (browse, NPC, blip), the sell spot (while driving) and the area its parked cars show in. An
 * edited lot rebuilds only its own objects; the blip setting rebuilds every lot.
 */
export const points = new Points();
const zones = new Zones();
export const lots = new RecordObjects(world, "lots", readLot, (id, lot) => {
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
