import { mysql } from "@aicore-fivem/mysql";
import { aiLog, notify, phone, resourceExport } from "@aicore-fivem/lib/server";
import { createLogger, groupDigits } from "@aicore-fivem/lib/shared";
import { Locale, ResourceName } from "common";
import { settings } from "./content";
import { db } from "./db";

const core = resourceExport("ai-core");
const log = createLogger(ResourceName);

/**
 * Sellers' money from sales: a sale stores a payout row (in the same transaction that ends the listing); the seller
 * receives every waiting row when online (right after the sale, else at the next character load).
 */
class Payouts {
  /** Characters whose payouts are being paid (one claim at a time each). */
  private readonly claiming = new Set<number>();

  async claim(source: number, charId: number): Promise<void> {
    if (this.claiming.has(charId)) return;
    this.claiming.add(charId);
    try {
      await this.pay(source, charId);
    } catch (error) {
      log.error(`paying the sales of character ${charId} failed`, error);
    } finally {
      this.claiming.delete(charId);
    }
  }

  private async pay(source: number, charId: number): Promise<void> {
    const rows = await db.select(
      "ai_vehiclesales_payouts",
      ["id", "amount", "model", "plate"],
      { seller: charId },
    );
    if (rows.length === 0) return;
    const removed = await mysql.update(
      "DELETE FROM ai_vehiclesales_payouts WHERE id IN (?)",
      [rows.map((r) => r.id)],
    );
    if (removed !== rows.length) return;
    const total = rows.reduce((sum, r) => sum + r.amount, 0);
    const account = settings.value.payoutAccount;
    if (!core.AddMoney(source, account, total, "vehiclesales:payout")) {
      // The player left between the read and the payment: the rows wait for the next load again.
      await mysql.query(
        `INSERT INTO ai_vehiclesales_payouts (seller, amount, model, plate) VALUES ${rows.map(() => "(?, ?, ?, ?)").join(", ")}`,
        rows.flatMap((r) => [charId, r.amount, r.model, r.plate]),
      );
      return;
    }
    notify(source, Locale("NOTIFY_PAID", groupDigits(total)), "success", 8000);
    phone.mail(source, {
      sender: Locale("MAIL_SENDER"),
      subject: Locale("MAIL_SUBJECT"),
      message: rows
        .map((r) => Locale("MAIL_LINE", r.plate, groupDigits(r.amount)))
        .join("\n"),
    });
    aiLog("sales", `received $${total} for ${rows.length} sold vehicle(s)`, {
      source,
      metadata: {
        total,
        account,
        plates: rows.map((r) => r.plate),
      },
    });
  }
}

export const payouts = new Payouts();
