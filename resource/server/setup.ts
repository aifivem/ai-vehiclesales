import { createDatabaseTables, onCharacter } from "@aicore-fivem/lib/server";
import { createLogger } from "@aicore-fivem/lib/shared";
import { ResourceName } from "common";
import { listings } from "./listings/listings";
import { payouts } from "./payouts";

const log = createLogger(ResourceName);

// Listings load once the tables exist; then waiting payouts go to every loaded character (and at each later load).
createDatabaseTables(ResourceName, "sql/main.sql")
  .then(() => listings.load())
  .then(() =>
    onCharacter({
      loaded: (source, character) => payouts.claim(source, character.id),
    }),
  )
  .catch((error: unknown) => log.error("database setup failed", error));
