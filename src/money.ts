// All money is integer paise. 1 rupee = 100 paise.
// Floats can't hold 0.1 exactly, so rupee floats drift (0.1 + 0.2 !== 0.3).
// Integers can't drift: every split below adds back to the exact total.

// 100.00 / 3 -> [33.34, 33.33, 33.33]: the leftover paise go to the first people,
// so no paisa is ever created or lost.
export function splitEqual(paise: number, n: number): number[] {
  const base = Math.floor(paise / n);
  const extra = paise - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

export type Balance = { id: number; name: string; upi: string; net: number };
export type Payment = { from: Balance; to: Balance; paise: number };

// Settle-up. net > 0 means "gets money back", net < 0 means "owes"; all nets sum to 0.
// Greedy: the biggest debtor pays the biggest creditor as much as both allow, repeat.
// Each payment clears at least one person, so n people need at most n - 1 payments.
// (The true minimum is NP-hard in general; greedy is optimal or close for small groups.)
export function settle(balances: Balance[]): Payment[] {
  const debtors = balances.filter(b => b.net < 0).map(b => ({ ...b, left: -b.net }));
  const creditors = balances.filter(b => b.net > 0).map(b => ({ ...b, left: b.net }));
  const out: Payment[] = [];
  while (debtors.length && creditors.length) {
    debtors.sort((a, b) => b.left - a.left);
    creditors.sort((a, b) => b.left - a.left);
    const d = debtors[0], c = creditors[0];
    const paise = Math.min(d.left, c.left);
    out.push({ from: d, to: c, paise });
    d.left -= paise; c.left -= paise;
    if (d.left === 0) debtors.shift();
    if (c.left === 0) creditors.shift();
  }
  return out;
}

export function rupees(paise: number): string {
  return (paise / 100).toFixed(2);
}

export function upiLink(to: { upi: string; name: string }, paise: number, note: string): string {
  const q = new URLSearchParams({ pa: to.upi, pn: to.name, am: rupees(paise), cu: "INR", tn: note });
  return "upi://pay?" + q.toString();
}
