import {
  aiLog,
  nearestVehicleAt,
  online,
  resourceExport,
} from "@aicore-fivem/lib/server";
import { fail } from "@aicore-fivem/lib/shared";
import { payoutOf } from "common/prices";
import { lots, settings } from "../content";
import { listings } from "../listings/listings";
import { inLot } from "../lotArea";
import { payouts } from "../payouts";
import { characterOwner, deliver, isHeld, vehiclesApi } from "../vehicles";

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

/** Buys a listing: the buyer pays, the vehicle changes hands and comes out at the lot, the seller's payout waits. */
export async function buy(source: number, lotId: string, id: number) {
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
}
