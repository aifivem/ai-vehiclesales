import {
  aiLog,
  fuel,
  nearestVehicleAt,
  onClientCallback,
  online,
  resourceExport,
  vehicleKeys,
} from "@aicore-fivem/lib/server";
import {
  fail,
  readId,
  readInt,
  readText,
  stripGameText,
} from "@aicore-fivem/lib/shared";
import { DESCRIPTION_MAX, EVENTS, payoutOf } from "common/sales";
import { inLot } from "./browse";
import { lots, settings } from "./content";
import { listings } from "./listings";
import { payouts } from "./payouts";
import { drivenAtSellSpot, sellLock } from "./sellSpot";
import { characterOwner, deliver, HOLD, isHeld, vehiclesApi } from "./vehicles";

const core = resourceExport("ai-core");

/** Takes the price from the panel's accounts in order; the account it came from, or null. */
function charge(source: number, price: number, reason: string): string | null {
  for (const account of settings.value.accounts)
    if (core.RemoveMoney(source, account, price, reason)) return account;
  return null;
}

/** The lot's cut goes to the panel's job / gang account; without one it leaves the economy. */
function payCommission(cut: number, plate: string): void {
  const to = settings.value.commissionTo;
  if (!to || cut <= 0) return;
  const reason = `vehiclesales:commission:${plate}`;
  if (!core.AddSharedMoney(to.owner, to.id, to.account, cut, reason))
    aiLog("sales", `commission of $${cut} not paid: no account`, {
      level: "warn",
      metadata: { cut, plate, ...to },
    });
}

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
    sellLock.run(source, fail("ERR_PENDING"), async () => {
      const driven = drivenAtSellSpot(source, lotId, netId);
      if (typeof driven === "string") return fail(driven);
      const { lot, character, vehicleId, vehicle } = driven;
      const { minPrice, maxPrice, maxListings } = settings.value;
      if (price < minPrice || price > maxPrice) return fail("ERR_PRICE");
      if (listings.countOf(character.id) >= maxListings)
        return fail("ERR_LIMIT");
      if (listings.ofVehicle(vehicleId)) return fail("ERR_LISTED");
      const listing = await listings.create({
        vehicleId,
        lot: lot.id,
        seller: character.id,
        sellerName: online.name(source),
        model: vehicle.model,
        plate: vehicle.plate,
        price,
        description,
      });
      if (!listing) return fail("ERR_FAILED");
      // The vehicle may have left the spot or changed hands during the insert.
      const still = drivenAtSellSpot(source, lotId, netId);
      if (typeof still === "string" || still.vehicleId !== vehicleId) {
        await listings.discard(listing);
        return fail(typeof still === "string" ? still : "ERR_FAILED");
      }
      const { entity } = still;
      // The condition is the server's (fuel through ai-core's fuel layer); the stored look stays.
      const level = fuel.get(entity);
      vehiclesApi.SaveVehicle(vehicleId, {
        engine: GetVehicleEngineHealth(entity),
        body: GetVehicleBodyHealth(entity),
        ...(level !== null ? { fuel: level } : {}),
      });
      vehiclesApi.StoreVehicle(vehicleId, null, "garage");
      vehiclesApi.SetOwner(vehicleId, HOLD);
      vehicleKeys.remove(source, vehicle.plate);
      listings.add(listing);
      aiLog("listings", `listed ${vehicle.plate} for $${price} at ${lot.id}`, {
        source,
        metadata: {
          plate: vehicle.plate,
          model: vehicle.model,
          price,
          lot: lot.id,
        },
      });
      return { ok: true };
    }),
);

/** Buys a listing: the buyer pays, the vehicle changes hands and comes out at the lot, the seller's payout waits. */
onClientCallback(
  EVENTS.buy,
  { args: listingArgs, lock: true },
  async (source, lotId, id) => {
    const lot = lots.get(lotId);
    const listing = listings.get(id);
    const character = online.character(source);
    if (!lot || !character || !inLot(source, lot)) return fail("ERR_FAR");
    if (!listing || listing.lot !== lot.id) return fail("ERR_GONE");
    if (listing.seller === character.id) return fail("ERR_OWN");
    if (!listings.claim(listing.id)) return fail("ERR_BUSY");
    try {
      if (!isHeld(vehiclesApi.GetVehicle(listing.vehicleId)))
        return fail("ERR_GONE");
      if (nearestVehicleAt(lot.delivery, 3)) return fail("ERR_BLOCKED");
      const reason = `vehiclesales:buy:${listing.plate}`;
      const account = charge(source, listing.price, reason);
      if (account === null) return fail("ERR_MONEY");
      const payout = payoutOf(listing.price, settings.value.commission);
      if (!(await listings.sell(listing, payout))) {
        core.AddMoney(source, account, listing.price, `${reason}:refund`);
        return fail("ERR_FAILED");
      }
      payCommission(listing.price - payout, listing.plate);
      vehiclesApi.SetOwner(listing.vehicleId, characterOwner(character.id));
      const netId = await deliver(listing.vehicleId, lot, source, "purchase");
      const seller = core.GetSourceByCharId(listing.seller);
      if (seller !== null) void payouts.claim(seller, listing.seller);
      aiLog(
        "sales",
        `bought ${listing.plate} for $${listing.price} (seller gets $${payout})`,
        {
          source,
          metadata: {
            plate: listing.plate,
            model: listing.model,
            price: listing.price,
            payout,
            seller: listing.seller,
            account,
            lot: lot.id,
          },
        },
      );
      return { ok: true, plate: listing.plate, delivered: netId !== null };
    } finally {
      listings.release(listing.id);
    }
  },
);

/** The seller takes a listing back; it comes out at the lot. */
onClientCallback(
  EVENTS.takeBack,
  { args: listingArgs, lock: true },
  async (source, lotId, id) => {
    const lot = lots.get(lotId);
    const listing = listings.get(id);
    const character = online.character(source);
    if (!lot || !character || !inLot(source, lot)) return fail("ERR_FAR");
    if (!listing || listing.lot !== lot.id) return fail("ERR_GONE");
    if (listing.seller !== character.id) return fail("ERR_NOT_YOURS");
    if (!listings.claim(listing.id)) return fail("ERR_BUSY");
    try {
      if (!isHeld(vehiclesApi.GetVehicle(listing.vehicleId)))
        return fail("ERR_GONE");
      if (nearestVehicleAt(lot.delivery, 3)) return fail("ERR_BLOCKED");
      if (!(await listings.withdraw(listing))) return fail("ERR_FAILED");
      vehiclesApi.SetOwner(listing.vehicleId, characterOwner(character.id));
      const netId = await deliver(listing.vehicleId, lot, source, "garage");
      aiLog("listings", `took ${listing.plate} back from ${lot.id}`, {
        source,
        metadata: { plate: listing.plate, lot: lot.id },
      });
      return { ok: true, delivered: netId !== null };
    } finally {
      listings.release(listing.id);
    }
  },
);
