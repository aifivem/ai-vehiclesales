import { PreviewVehicle, ScriptCamera } from "@aicore-fivem/lib/client";
import type { Look, Lot } from "common/sales";
import { applyLook } from "./content";

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
  private readonly camera = new ScriptCamera();
  private readonly preview = new PreviewVehicle();
  private lot: Lot | null = null;
  private shown: Shown | null = null;

  start(lot: Lot): void {
    this.lot = lot;
    const c = lot.camera;
    this.camera.start(
      c,
      { rotation: { x: -8, y: 0, z: c.heading }, fov: 50 },
      500,
    );
  }

  async show(shown: Shown): Promise<void> {
    this.shown = shown;
    if (!this.lot) return;
    await this.preview.show(shown.model, this.lot.preview, (vehicle) =>
      applyLook(vehicle, shown.look, shown.plate),
    );
  }

  /** Shows the last shown vehicle again (an action that cleared it was refused). */
  restore(): void {
    if (this.shown) void this.show(this.shown);
  }

  /** Removes the preview vehicle; `forget` also drops what it showed. */
  clear(forget = true): void {
    this.preview.clear();
    if (forget) this.shown = null;
  }

  end(): void {
    this.clear();
    this.camera.stop(400);
    this.lot = null;
  }
}
