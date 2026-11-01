import {
  callAction,
  drivenVehicle,
  input,
  menu,
  notify,
  vehicleLabel,
} from "@aicore-fivem/lib/client";
import { groupDigits, num, readInt } from "@aicore-fivem/lib/shared";
import { Locale } from "common";
import type { Lot } from "common/lots";
import { payoutOf } from "common/prices";
import { DESCRIPTION_MAX, EVENTS } from "common/sales";
import { settings } from "../content";

/** The sell spot: list the vehicle, or (dealer on, model in the shop's catalog) sell it to the dealer at once. */
export async function atSellSpot(lot: Lot): Promise<void> {
  const vehicle = drivenVehicle();
  if (vehicle === false) return;
  const netId = NetworkGetNetworkIdFromEntity(vehicle);
  const quote =
    settings.value.dealerShare > 0
      ? await callAction(EVENTS.quote, [lot.id, netId], {
          fallback: "ERR_NO_DEALER",
          silent: true,
        })
      : null;
  const price = quote ? num(quote.price, 0) : 0;
  if (price <= 0) return sell(lot);
  const picked = await menu({
    title: vehicleLabel(vehicle),
    items: [
      {
        id: "list",
        label: Locale("SELL_MENU_LIST"),
        description: Locale("SELL_MENU_LIST_DESC"),
        icon: "tag",
      },
      {
        id: "dealer",
        label: Locale("SELL_MENU_DEALER", groupDigits(price)),
        description: Locale("SELL_MENU_DEALER_DESC"),
        icon: "money-bill-wave",
      },
    ],
  });
  if (picked === "list") return sell(lot);
  if (picked !== "dealer") return;
  const reply = await callAction(EVENTS.sellBack, [lot.id, netId], {
    fallback: "ERR_FAILED",
  });
  if (reply)
    notify(
      Locale("NOTIFY_SOLD_DEALER", groupDigits(num(reply.price, price))),
      "success",
      6000,
    );
}

/** The sell spot: price and description in ai-core's input dialog, then the server lists the driven vehicle. */
async function sell(lot: Lot): Promise<void> {
  const vehicle = drivenVehicle();
  if (vehicle === false) return;
  const s = settings.value;
  const values = await input({
    title: Locale("SELL_TITLE", vehicleLabel(vehicle)),
    fields: [
      {
        name: "price",
        label: Locale("SELL_PRICE"),
        type: "number",
        min: s.minPrice,
        max: s.maxPrice,
        placeholder: Locale(
          "SELL_PRICE_RANGE",
          groupDigits(s.minPrice),
          groupDigits(s.maxPrice),
        ),
      },
      {
        name: "description",
        label: Locale("SELL_DESCRIPTION"),
        type: "text",
        multiline: true,
        maxLength: DESCRIPTION_MAX,
        placeholder: Locale("SELL_DESCRIPTION_HINT"),
      },
      {
        name: "terms",
        label: Locale("SELL_TERMS"),
        type: "text",
        readOnly: true,
        value: Locale("SELL_TERMS_TEXT", s.commission, s.maxListings),
      },
    ],
    confirm: Locale("SELL_CONFIRM"),
  });
  if (!values) return;
  const price = readInt(Number(values.price), s.minPrice, s.maxPrice);
  if (price === null) return notify(Locale("ERR_PRICE"), "error");
  const description =
    typeof values.description === "string" ? values.description.trim() : "";
  const reply = await callAction(
    EVENTS.list,
    [lot.id, NetworkGetNetworkIdFromEntity(vehicle), price, description],
    { fallback: "ERR_FAILED" },
  );
  if (reply)
    notify(
      Locale(
        "NOTIFY_LISTED",
        groupDigits(price),
        groupDigits(payoutOf(price, s.commission)),
      ),
      "success",
      6000,
    );
}
