// The app's logic, independent of where data lives. Each handler returns [status, json].
import { splitEqual, settle, upiLink, rupees } from "./money";
import { LIMITS, parsePaise, cleanText, isUpi } from "./validate";
import type { Store } from "./store";

export type Reply = [status: number, body: unknown];

export async function state(store: Store): Promise<Reply> {
  const [members, expenses, balances] = await Promise.all([store.members(), store.expenses(), store.balances()]);
  const plan = settle(balances).map(p => ({
    from: p.from.name, to: p.to.name, amount: rupees(p.paise),
    link: upiLink(p.to, p.paise, "Hisaab settle-up"),
  }));
  return [200, { members, expenses, balances, plan }];
}

export async function addMember(store: Store, b: Record<string, unknown>): Promise<Reply> {
  const name = cleanText(b.name, LIMITS.nameLen), upi = cleanText(b.upi, LIMITS.upiLen);
  if (!name || !isUpi(upi)) return [400, { error: "name and a valid UPI id needed" }];
  if ((await store.members()).length >= LIMITS.members) return [409, { error: `max ${LIMITS.members} members` }];
  await store.addMember(name, upi);
  return [200, { ok: true }];
}

export async function addExpense(store: Store, b: Record<string, unknown>): Promise<Reply> {
  const paise = parsePaise(b.amount);
  if (paise === null) return [400, { error: "amount must be between ₹0.01 and ₹1,00,000" }];
  const ids = (await store.members()).map(m => m.id);
  const payer = Number(b.payer_id);
  if (!ids.includes(payer)) return [400, { error: "pick who paid" }];
  if ((await store.expenses()).length >= LIMITS.expenses) return [409, { error: `max ${LIMITS.expenses} expenses` }];
  const shares = splitEqual(paise, ids.length);
  const id = await store.addExpense(payer, paise, cleanText(b.note, LIMITS.noteLen), ids.map((m, i) => [m, shares[i]]));
  return [200, { ok: true, id }];
}
