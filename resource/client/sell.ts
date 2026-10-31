import {
  cache,
  callAction,
  input,
  notify,
  vehicleLabel,
} from "@aicore-fivem/lib/client";
import { groupDigits, readInt } from "@aicore-fivem/lib/shared";
import { Locale } from "common";
import { DESCRIPTION_MAX, EVENTS, payoutOf, type Lot } from "common/sales";
import { settings } from "./content";

/** The sell spot: price and description in ai-core's input dialog, then the server lists the driven vehicle. */
export async function sell(lot: Lot): Promise<void> {
  const vehicle = cache.vehicle;
  if (vehicle === false || cache.seat !== -1) return;
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
