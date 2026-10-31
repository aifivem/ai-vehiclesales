# ai-vehiclesales

Player used car lots (port of qb-vehiclesales / qbx_vehiclesales): drive an owned vehicle onto a lot's sell spot and list it with a price and description, browse a lot's listings on a showroom screen, test drive a temporary copy, buy (the seller is paid at once or at the next login), take a listing back. Depends on ai-core (money, characters, panel, prompts) and ai-vehicles (the vehicles themselves).

## Decisions

- The listed vehicle never leaves ai-vehicles: same id, plate, props and trunk. While listed it is stored (state `garage`, no garage) and owned by the hold owner `{ type: "resource", id: "ai-vehiclesales" }` (ai-vehicles' owner type for a holding script); buying or taking back `SetOwner`s it to the character and spawns it at the lot's delivery spot. ai-vehicles keeps only online characters' vehicles in memory but every non-character owner from its start, so the hold owner is what lets a vehicle change hands while its seller is offline.
- Rejected: deleting the owned row at listing and re-creating it at sale (the QB way): ai-vehicles derives the plate from the id, so the buyer would get a new plate and plate-keyed trunks and gloveboxes would be lost.
- Seller money: the sale's transaction deletes the listing and inserts a payout row; the seller receives every waiting row when online (right after the sale, else at the next character load through `onCharacter`). If `AddMoney` fails after the rows were deleted (the player left in between) the rows are inserted again. The lot's cut is a money sink; no society account receives it.
- The buyer pays from `settings.accounts` in order; a failed sale transaction refunds the same account. A vehicle that cannot be spawned at delivery goes to the impound state (a character vehicle without a garage shows in no garage).
- Listing saves only the server-read condition (engine, body, fuel bag); the stored look stays (only ai-mechanic changes tuning). The seller's keys for the plate are removed at listing.
- Parked listings are local, frozen, locked, invincible vehicles created per client inside the lot area: nobody can drive, push or steal them and they cost no network entities. First listed, first parked; a freed spot goes to the oldest waiting listing. Listings beyond the spot count are still on the screen.
- Sync: lot watchers (inside the lot area, client `Zones`) get parked rows with their look; screen watchers (screen open) get listing rows with `mine` built per viewer. The snapshot travels as chunked ordinary events on the same channel as the deltas, ahead of the watch / browse reply (a reply cannot carry thousands of rows, a latent event could overtake deltas). The client marks the lot it asks for before calling, so the snapshot rows land in its store; the page opens with them on the reply.
- Every listing is in server memory (one query at start, indexed by id, vehicle, seller, lot); thousands are a few MB. The screen list is virtualized, filtered and sorted in the page.
- Test drive: a temporary copy (lib `spawnVehicle`, test plate, temporary keys, the player seated) at the delivery spot. The client counts down on its own clock and asks to end at zero or when the player gets out; the server ends it anyway 3 s later, deletes the copy, removes the keys and sends the player back to the counter. Cooldown per character.
- The preview vehicle stands at the lot's preview spot under the lot's camera. The default lot uses one point for preview and delivery, so the client clears the preview before buy / take back / test drive and puts it back on a refusal.
- Not ported: QB's "sell back to the dealer for half the catalog price" (needs the vehicle shop's catalog prices) and the paper contract look.

## Contracts

- Callbacks and events with payloads: `resource/common/sales.ts`.
- Tables `ai_vehiclesales_listings` (one row per listed vehicle, unique `vehicle_id`) and `ai_vehiclesales_payouts` (`sql/main.sql`).
- Panel files `data/settings.json`, `data/lots.json` (both `sync: "all"`).
- ai-vehicles exports used: `GetVehicle`, `GetVehicleIdByEntity`, `SaveVehicle`, `StoreVehicle`, `SetOwner`, `SpawnVehicle`.

## Pitfalls

- A new resource's `add_convar_permission` line in `env.cfg` is read at server start only; on a running server send the same line over RCON before the first `ensure`, or the pool falls back to `mysql://root@localhost` and fails with "No database selected".
- Server timers are Node timers: the test drive end hops to the game thread with `setImmediate` before natives.

## Entry points

- Server: list, buy, take back `resource/server/actions.ts`; lot and screen snapshots `server/browse.ts`; memory and transactions `server/listings.ts` (spot assignment `server/shelf.ts`); deltas `server/sync.ts`; payouts `server/payouts.ts`; test drives `server/testDrive.ts`; panel `server/schema.ts`.
- Client: lot points and zones `resource/client/index.ts`; parked cars `client/showcase.ts`; screen, camera and preview `client/browser.ts`, `client/showroom.ts`; selling `client/sell.ts`.
- NUI (tgiann-vehicleshop look over the preview camera, Redux store of the open lot): `web/src/App.tsx`; browser preview `bun run webdev` (`#detail` opens with a listing picked).
