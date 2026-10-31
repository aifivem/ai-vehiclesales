import { requestModel } from "@aicore-fivem/lib/client";
import type { Look, Lot } from "common/sales";
import { applyLook, standStill } from "./content";

interface Shown {
  model: string;
  plate: string;
  look: Look;
}

/**
 * The lot screen's stage: a scripted camera at the lot's camera point and a local preview vehicle at its preview
 * point. Nothing networked; the preview is cleared before anything spawns at the delivery spot (often the same place).
 */
export class Showroom {
  private camera = 0;
  private vehicle = 0;
  private token = 0;
  private lot: Lot | null = null;
  private shown: Shown | null = null;

  start(lot: Lot): void {
    this.lot = lot;
    const c = lot.camera;
    this.camera = CreateCamWithParams(
      "DEFAULT_SCRIPTED_CAMERA",
      c.x,
      c.y,
      c.z,
      -8,
      0,
      c.heading,
      50,
      false,
      0,
    );
    SetCamActive(this.camera, true);
    RenderScriptCams(true, true, 500, true, true);
  }

  async show(shown: Shown): Promise<void> {
    this.shown = shown;
    const token = ++this.token;
    const hash = await requestModel(shown.model).catch(() => 0);
    const lot = this.lot;
    if (!hash || !lot || token !== this.token) return;
    this.clear(false);
    const p = lot.preview;
    this.vehicle = CreateVehicle(hash, p.x, p.y, p.z, p.heading, false, false);
    SetModelAsNoLongerNeeded(hash);
    applyLook(this.vehicle, shown.look, shown.plate);
    standStill(this.vehicle);
  }

  /** Shows the last shown vehicle again (an action that cleared it was refused). */
  restore(): void {
    if (this.shown) void this.show(this.shown);
  }

  /** Removes the preview vehicle; `forget` also drops what it showed. */
  clear(forget = true): void {
    this.token++;
    if (this.vehicle) DeleteEntity(this.vehicle);
    this.vehicle = 0;
    if (forget) this.shown = null;
  }

  end(): void {
    this.clear();
    if (this.camera) {
      RenderScriptCams(false, true, 400, true, true);
      DestroyCam(this.camera, false);
      this.camera = 0;
    }
    this.lot = null;
  }
}
