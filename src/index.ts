import { Hono } from "hono";
import { splitEqual, settle, upiLink, rupees, Balance } from "./money";
import { page } from "./page";

type Env = { DB: D1Database };
const app = new Hono<{ Bindings: Env }>();

app.get("/", c => c.html(page));

app.get("/api/state", async c => {
  const db = c.env.DB;
  const members = (await db.prepare("SELECT id, name, upi FROM members ORDER BY id").all()).results;
  const expenses = (await db.prepare(
    `SELECT e.id, e.amount_paise, e.note, e.created_at, m.name AS payer
     FROM expenses e JOIN members m ON m.id = e.payer_id ORDER BY e.id DESC`).all()).results;
  const balances = (await db.prepare(
    `SELECT m.id, m.name, m.upi,
       COALESCE((SELECT SUM(amount_paise) FROM expenses WHERE payer_id = m.id), 0)
     - COALESCE((SELECT SUM(share_paise) FROM shares WHERE member_id = m.id), 0) AS net
     FROM members m ORDER BY m.id`).all<Balance>()).results;
  const plan = settle(balances).map(p => ({
    from: p.from.name, to: p.to.name, amount: rupees(p.paise),
    link: upiLink(p.to, p.paise, "Hisaab settle-up"),
  }));
  return c.json({ members, expenses, balances, plan });
});

app.post("/api/members", async c => {
  const { name, upi } = await c.req.json();
  if (!name || !/^[\w.-]+@[\w]+$/.test(upi)) return c.json({ error: "name and a valid UPI id needed" }, 400);
  await c.env.DB.prepare("INSERT INTO members (name, upi) VALUES (?, ?)").bind(name, upi).run();
  return c.json({ ok: true });
});

app.post("/api/expenses", async c => {
  const { payer_id, amount, note } = await c.req.json();
  const paise = Math.round(Number(amount) * 100);
  if (!(paise > 0)) return c.json({ error: "amount must be more than 0" }, 400);
  const db = c.env.DB;
  const ids = (await db.prepare("SELECT id FROM members ORDER BY id").all<{ id: number }>()).results.map(r => r.id);
  const row = await db.prepare("INSERT INTO expenses (payer_id, amount_paise, note) VALUES (?, ?, ?) RETURNING id")
    .bind(payer_id, paise, note ?? "").first<{ id: number }>();
  const shares = splitEqual(paise, ids.length);
  await db.batch(ids.map((id, i) =>
    db.prepare("INSERT INTO shares (expense_id, member_id, share_paise) VALUES (?, ?, ?)").bind(row!.id, id, shares[i])));
  return c.json({ ok: true, id: row!.id });
});

export default app;
