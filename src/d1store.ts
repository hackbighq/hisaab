// Store backed by Cloudflare D1 (SQLite). Schema: migrations/0001_init.sql.
import type { Balance } from "./money";
import type { Store, Member, Expense } from "./store";

export class D1Store implements Store {
  constructor(private db: D1Database) {}

  async members() {
    return (await this.db.prepare("SELECT id, name, upi FROM members ORDER BY id").all<Member>()).results;
  }

  async expenses() {
    return (await this.db.prepare(
      `SELECT e.id, e.amount_paise, e.note, e.created_at, m.name AS payer
       FROM expenses e JOIN members m ON m.id = e.payer_id ORDER BY e.id DESC`).all<Expense>()).results;
  }

  // net = what you paid - your share of everything. Positive: you get money back. Negative: you owe.
  async balances() {
    return (await this.db.prepare(
      `SELECT m.id, m.name, m.upi,
         COALESCE((SELECT SUM(amount_paise) FROM expenses WHERE payer_id = m.id), 0)
       - COALESCE((SELECT SUM(share_paise) FROM shares WHERE member_id = m.id), 0) AS net
       FROM members m ORDER BY m.id`).all<Balance>()).results;
  }

  async addMember(name: string, upi: string) {
    await this.db.prepare("INSERT INTO members (name, upi) VALUES (?, ?)").bind(name, upi).run();
  }

  async addExpense(payerId: number, amountPaise: number, note: string, shares: [number, number][]) {
    const row = await this.db.prepare("INSERT INTO expenses (payer_id, amount_paise, note) VALUES (?, ?, ?) RETURNING id")
      .bind(payerId, amountPaise, note).first<{ id: number }>();
    await this.db.batch(shares.map(([memberId, paise]) =>
      this.db.prepare("INSERT INTO shares (expense_id, member_id, share_paise) VALUES (?, ?, ?)").bind(row!.id, memberId, paise)));
    return row!.id;
  }
}
