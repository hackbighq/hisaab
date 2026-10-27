// Storage adapter: the app logic (hisaab.ts) talks to this interface only.
// d1store.ts implements it with Cloudflare D1 (SQLite) for the real app; demo/localstore.ts
// implements it with the browser's localStorage for the GitHub Pages demo.
import type { Balance } from "./money";

export type Member = { id: number; name: string; upi: string };
export type Expense = { id: number; amount_paise: number; note: string; created_at: string; payer: string };

export interface Store {
  members(): Promise<Member[]>;
  expenses(): Promise<Expense[]>;                  // newest first
  balances(): Promise<Balance[]>;                  // net = paid - share of everything, per member
  addMember(name: string, upi: string): Promise<void>;
  // shares[i] belongs to members()[i]; they always add up to amountPaise.
  addExpense(payerId: number, amountPaise: number, note: string, shares: [memberId: number, paise: number][]): Promise<number>;
}
