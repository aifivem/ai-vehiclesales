import {
  callAction,
  loadLocaleTexts,
  NuiScreen,
  vehicleLabel,
} from "@aicore-fivem/lib/client";
import { num, record } from "@aicore-fivem/lib/shared";
import type { Lot } from "common/lots";
import type { ListingRow, ScreenRow } from "common/rows";
import { EVENTS, type NuiMessage } from "common/sales";
import { settings } from "../content";
import { Showroom } from "./showroom";

export type ListingAction = "buy" | "testDrive" | "takeBack";

/**
 * The lot screen: every listing of one lot in a NUI over the showroom camera, kept current by the server's deltas
 * while open. The snapshot rows arrive as puts before the browse reply; the page opens with them.
 */
export class Browser {
  lot: Lot | null = null;
  private readonly rows = new Map<number, ScreenRow>();
  private readonly labels = new Map<string, string>();
  private readonly showroom = new Showroom();
  private readonly texts = loadLocaleTexts();
  readonly page = new NuiScreen<NuiMessage>("vehiclesales", {
    onClose: () => this.end(),
  });

  constructor(
    private readonly onStarted: (
      lot: Lot,
      action: ListingAction,
      reply: Record<string, unknown>,
    ) => void,
  ) {}

  async open(lot: Lot, selected: number | null): Promise<void> {
    if (this.lot) return;
    this.lot = lot;
    this.rows.clear();
    const reply = await callAction(EVENTS.browse, [lot.id], {
      fallback: "ERR_FAR",
    });
    if (!reply || this.lot !== lot) {
      if (this.lot === lot) this.lot = null;
      return;
    }
    this.showroom.start(lot);
    const s = settings.value;
    this.page.open({
      action: "open",
      data: {
        texts: this.texts,
        lot: { id: lot.id, label: lot.label },
        now: num(reply.now, Date.now()),
        rows: [...this.rows.values()],
        selected:
          selected !== null && this.rows.has(selected) ? selected : null,
        commission: s.commission,
        testDriveSeconds: s.testDriveSeconds,
      },
    });
  }

  apply(lot: string, puts: ListingRow[], removes: number[]): void {
    if (lot !== this.lot?.id) return;
    const rows = puts.map((row) => this.withLabel(row));
    for (const id of removes) this.rows.delete(id);
    for (const row of rows) this.rows.set(row.id, row);
    if (!this.page.isOpen) return;
    if (removes.length > 0) this.page.send({ action: "remove", data: removes });
    if (rows.length > 0) this.page.send({ action: "put", data: rows });
  }

  /** The page picked a listing: its description for the page, its look on the preview spot. */
  async select(id: number): Promise<{ ok: boolean; description?: string }> {
    const lot = this.lot;
    const row = this.rows.get(id);
    if (!lot || !row) return { ok: false };
    const reply = await callAction(EVENTS.details, [lot.id, id], {
      fallback: "ERR_GONE",
    });
    if (!reply || this.lot !== lot) return { ok: false };
    const look = record(reply.look);
    void this.showroom.show({
      model: row.model,
      plate: row.plate,
      look: { props: look.props ?? null, setup: look.setup ?? null },
    });
    return {
      ok: true,
      description:
        typeof reply.description === "string" ? reply.description : "",
    };
  }

  async act(action: ListingAction, id: number): Promise<{ ok: boolean }> {
    const lot = this.lot;
    if (!lot) return { ok: false };
    // The delivery spot is often the preview spot: the local preview must not stand in the new vehicle's way.
    this.showroom.clear(false);
    const reply = await callAction(EVENTS[action], [lot.id, id], {
      fallback: "ERR_FAILED",
      timeout: 15_000,
    });
    if (!reply) {
      this.showroom.restore();
      return { ok: false };
    }
    this.page.close();
    this.onStarted(lot, action, reply);
    return { ok: true };
  }

  private withLabel(row: ListingRow): ScreenRow {
    let label = this.labels.get(row.model);
    if (label === undefined) {
      label = vehicleLabel(row.model);
      this.labels.set(row.model, label);
    }
    return { ...row, label };
  }

  /** The page closed: the server stops the deltas, the camera and preview go. */
  private end(): void {
    if (!this.lot) return;
    emitNet(EVENTS.unbrowse);
    this.showroom.end();
    this.lot = null;
    this.rows.clear();
  }
}
