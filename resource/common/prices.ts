/** What the dealer pays for a vehicle of a catalog price. */
export const dealerPriceOf = (catalogPrice: number, share: number): number =>
  Math.floor((catalogPrice * share) / 100);

/** What the seller receives for a price. */
export const payoutOf = (price: number, commission: number): number =>
  price - Math.floor((price * commission) / 100);
