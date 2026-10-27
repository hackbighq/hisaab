// Store backed by the browser's localStorage: the GitHub Pages demo keeps everything on your device.
// Same interface as D1Store (src/d1store.ts), so the app logic in src/hisaab.ts runs unchanged.
import type { Balance } from "../src/money";
import type { Store, Member, Expense } from "../src/store";

type Row = { id: number; payer_id: number; amount_paise: number; note: string; created_at: string };
type Data = { next: number; members: Member[]; expenses: Row[]; shares: { expense_id: number; member_id: number; share_paise: number }[] };

const KEY = "hisaab-demo-v1";
type KV = { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void };
// Looked up at call time, so tests in Node (no localStorage) fall back to memory.
const ls = () => (globalThis as { localStorage?: KV }).localStorage!;
const empty = (): Data => ({ next: 1, members: [], expenses: [], shares: [] });

export class LocalStore implements Store {
  private mem: Data | null = null;            // fallback when localStorage is blocked (private mode etc.)

  private load(): Data {
    try { return JSON.parse(ls().getItem(KEY) ?? "") as Data; } catch { return this.mem ?? empty(); }
  }
  private save(d: Data) {
    try { ls().setItem(KEY, JSON.stringify(d)); } catch { this.mem = d; }
  }
  reset() { this.mem = null; try { ls().removeItem(KEY); } catch { /* nothing stored */ } }

  async members() { return this.load().members; }

  async expenses(): Promise<Expense[]> {
    const d = this.load();
    const name = new Map(d.members.map(m => [m.id, m.name]));
    return d.expenses.map(e => ({ id: e.id, amount_paise: e.amount_paise, note: e.note, created_at: e.created_at,
      payer: name.get(e.payer_id) ?? "?" })).reverse();
  }

  // Same rule as the SQL in d1store.ts: net = paid - share of everything.
  async balances(): Promise<Balance[]> {
    const d = this.load();
    return d.members.map(m => ({ ...m,
      net: d.expenses.filter(e => e.payer_id === m.id).reduce((s, e) => s + e.amount_paise, 0)
         - d.shares.filter(s => s.member_id === m.id).reduce((s, x) => s + x.share_paise, 0) }));
  }

  async addMember(name: string, upi: string) {
    const d = this.load();
    d.members.push({ id: d.next++, name, upi });
    this.save(d);
  }

  async addExpense(payerId: number, amountPaise: number, note: string, shares: [number, number][]) {
    const d = this.load();
    const id = d.next++;
    d.expenses.push({ id, payer_id: payerId, amount_paise: amountPaise, note, created_at: new Date().toISOString() });
    for (const [member_id, share_paise] of shares) d.shares.push({ expense_id: id, member_id, share_paise });
    this.save(d);
    return id;
  }
}
