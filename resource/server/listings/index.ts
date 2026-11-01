import { panel } from "../content";
import { listings } from "./listings";

// A lot's spots changed (or the lot was added): its listings are parked again.
panel.onChange("lots", (key) => {
  if (key !== undefined) listings.relayout(key);
});
