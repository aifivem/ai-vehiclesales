import {
  aiLogChannels,
  createDatabaseTables,
  onCharacter,
  onClientCallback,
  online,
} from "@aicore-fivem/lib/server";
import { createLogger, fail, readId, readText } from "@aicore-fivem/lib/shared";
import { ResourceName } from "common";
import { EVENTS } from "common/sales";
import { inLot } from "./browse";
import { lots, panel } from "./content";
import { listings } from "./listings";
import { payouts } from "./payouts";
import { testDrives } from "./testDrive";
import "./actions";
import "./dealer";

const log = createLogger(ResourceName);
aiLogChannels({ listings: {}, sales: {} });

// Listings load once the tables exist; then waiting payouts go to every loaded character (and at each later load).
createDatabaseTables(ResourceName, "sql/main.sql")
  .then(() => listings.load())
  .then(() =>
    onCharacter({
      loaded: (source, character) => payouts.claim(source, character.id),
    }),
  )
  .catch((error: unknown) => log.error("database setup failed", error));

// A lot's spots changed (or the lot was added): its listings are parked again.
panel.onChange("lots", (key) => {
  if (key !== undefined) listings.relayout(key);
});

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

on("onResourceStop", (resource: string) => {
  if (resource === ResourceName) testDrives.stopAll();
});
