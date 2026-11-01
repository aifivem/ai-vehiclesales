import { onClientCallback } from "@aicore-fivem/lib/server";
import {
  readId,
  readInt,
  readText,
  stripGameText,
} from "@aicore-fivem/lib/shared";
import { DESCRIPTION_MAX, EVENTS } from "common/sales";
import { buy } from "./buy";
import { listVehicle } from "./list";
import { takeBack } from "./takeBack";

const listingArgs = ([lotId, id]: unknown[]): [string, number] | null => {
  const lot = readText(lotId, 48);
  const listing = readId(id);
  return lot === null || listing === null ? null : [lot, listing];
};

/** Lists the vehicle the player drives at the lot's sell spot. */
onClientCallback(
  EVENTS.list,
  {
    args: ([lotId, netId, price, description]) => {
      const lot = readText(lotId, 48);
      const net = readId(netId);
      const amount = readInt(price, 1, 100_000_000);
      const text =
        description === "" || description == null
          ? ""
          : readText(description, DESCRIPTION_MAX);
      return lot === null || net === null || amount === null || text === null
        ? null
        : [lot, net, amount, stripGameText(text)];
    },
    lock: true,
  },
  (source, lotId, netId, price, description) =>
    listVehicle(source, lotId, netId, price, description),
);

/** Buys a listing: the buyer pays, the vehicle changes hands and comes out at the lot, the seller's payout waits. */
onClientCallback(
  EVENTS.buy,
  { args: listingArgs, lock: true },
  (source, lotId, id) => buy(source, lotId, id),
);

/** The seller takes a listing back; it comes out at the lot. */
onClientCallback(
  EVENTS.takeBack,
  { args: listingArgs, lock: true },
  (source, lotId, id) => takeBack(source, lotId, id),
);
