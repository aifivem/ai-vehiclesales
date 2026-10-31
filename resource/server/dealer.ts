import {
  aiLog,
  optionalExport,
  onClientCallback,
  resourceExport,
  vehicleKeys,
} from "@aicore-fivem/lib/server";
import { fail, readId, readText } from "@aicore-fivem/lib/shared";
import { dealerPriceOf, EVENTS } from "common/sales";
import { settings } from "./content";
import { listings } from "./listings";
import { drivenAtSellSpot, sellLock, type DrivenVehicle } from "./sellSpot";
import { vehiclesApi } from "./vehicles";

/** The dealer buy-back (qb-vehiclesales "sell back car"): a share of ai-vehicleshop's catalog price, paid at once. */

const core = resourceExport("ai-core");

/** ai-vehicleshop's catalog price of a model; null while the shop is stopped or the model is not in its catalog. */
function catalogPrice(model: string): number | null {
  const price = optionalExport("ai-vehicleshop")?.GetCatalogPrice(model);
  return typeof price === "number" && Number.isFinite(price) && price > 0
    ? price
    : null;
}

/** What the dealer pays for a checked vehicle, or the lang key of the refusal. */
function dealerPrice(driven: DrivenVehicle): number | string {
  const share = settings.value.dealerShare;
  const catalog = share > 0 ? catalogPrice(driven.vehicle.model) : null;
  const price = catalog === null ? 0 : dealerPriceOf(catalog, share);
  if (price <= 0) return "ERR_NO_DEALER";
  if (listings.ofVehicle(driven.vehicleId)) return "ERR_LISTED";
  return price;
}

const args = ([lotId, netId]: unknown[]): [string, number] | null => {
  const lot = readText(lotId, 48);
  const net = readId(netId);
  return lot === null || net === null ? null : [lot, net];
};

onClientCallback(EVENTS.quote, { args }, (source, lotId, netId) => {
  const driven = drivenAtSellSpot(source, lotId, netId);
  if (typeof driven === "string") return fail(driven);
  const price = dealerPrice(driven);
  return typeof price === "string" ? fail(price) : { ok: true, price };
});

onClientCallback(
  EVENTS.sellBack,
  { args, lock: true },
  (source, lotId, netId) =>
    sellLock.run(source, fail("ERR_PENDING"), async () => {
      const driven = drivenAtSellSpot(source, lotId, netId);
      if (typeof driven === "string") return fail(driven);
      const price = dealerPrice(driven);
      if (typeof price === "string") return fail(price);
      const { vehicle, vehicleId, entity, lot } = driven;
      const account = settings.value.payoutAccount;
      // Paid first: a failed payment keeps the vehicle; the delete itself cannot fail.
      if (
        !core.AddMoney(
          source,
          account,
          price,
          `vehiclesales:dealer:${vehicle.plate}`,
        )
      )
        return fail("ERR_FAILED");
      vehicleKeys.remove(source, vehicle.plate);
      vehiclesApi.DeleteVehicle(vehicleId);
      if (DoesEntityExist(entity)) DeleteEntity(entity);
      aiLog("sales", `sold ${vehicle.plate} to the dealer for $${price}`, {
        source,
        metadata: {
          plate: vehicle.plate,
          model: vehicle.model,
          price,
          account,
          lot: lot.id,
        },
      });
      return { ok: true, price };
    }),
);
