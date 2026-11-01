import { onClientCallback, online, onStop } from "@aicore-fivem/lib/server";
import { fail, readId, readText } from "@aicore-fivem/lib/shared";
import { EVENTS } from "common/sales";
import { lots } from "../content";
import { listings } from "../listings/listings";
import { inLot } from "../lotArea";
import { testDrives } from "./testDrives";

onClientCallback(
  EVENTS.testDrive,
  {
    args: ([lotId, id]) => {
      const lot = readText(lotId, 48);
      const listing = readId(id);
      return lot === null || listing === null ? null : [lot, listing];
    },
    lock: true,
  },
  (source, lotId, id) => {
    const lot = lots.get(lotId);
    const listing = listings.get(id);
    const character = online.character(source);
    if (!lot || !character || !inLot(source, lot)) return fail("ERR_FAR");
    if (!listing || listing.lot !== lot.id) return fail("ERR_GONE");
    return testDrives.start(source, character.id, lot, listing);
  },
);
onClientCallback(EVENTS.endTestDrive, (source) => {
  testDrives.end(source);
  return { ok: true };
});

onStop(() => testDrives.stopAll());
