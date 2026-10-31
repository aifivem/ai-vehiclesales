import { cache, player, triggerServerCallback } from "@aicore-fivem/lib/client";
import { EVENTS, type Lot, type NuiMessage } from "common/sales";

/**
 * The running test drive on this client: the countdown chip on the page (client clock), and the end request when
 * the time is up or the player gets out. The server deletes the copy and answers with `testDriveEnded`.
 */
export class TestDrive {
  private running = false;
  private seated = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly send: (message: NuiMessage) => void,
    private readonly lotOf: (id: string) => Lot | undefined,
  ) {}

  begin(seconds: number): void {
    this.running = true;
    // The server seats the player before it answers: the vehicle change may already be in the cache.
    this.seated = cache.vehicle !== false;
    this.send({ action: "timer", data: { seconds } });
    this.timer = setTimeout(() => this.finish(), seconds * 1000);
  }

  /** The player's vehicle changed: getting out after sitting in the copy ends the drive. */
  vehicleChanged(vehicle: number | false): void {
    if (!this.running) return;
    if (vehicle !== false) this.seated = true;
    else if (this.seated) this.finish();
  }

  finish(): void {
    if (!this.running) return;
    this.stopTimer();
    triggerServerCallback(EVENTS.endTestDrive).catch(() => undefined);
  }

  /** The server ended it: back to the lot's counter. */
  async ended(lotId: string): Promise<void> {
    this.running = false;
    this.stopTimer();
    this.send({ action: "timer", data: { seconds: 0 } });
    const lot = this.lotOf(lotId);
    if (lot) await player.teleport({ x: lot.x, y: lot.y, z: lot.z });
  }

  private stopTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}
