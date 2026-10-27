// Input rules, shared by the real app (D1) and the browser demo (localStorage).

export const LIMITS = {
  members: 12,
  expenses: 100,
  nameLen: 40,
  upiLen: 60,
  noteLen: 80,
  maxPaise: 1_00_000_00,  // ₹1,00,000 per expense
  bodyBytes: 2_048,
};

// "450.5" -> 45050. Money crosses into integers exactly once, here at the edge.
// Why not just Number(x) * 100 and keep going? 19.99 * 100 === 1998.9999999999998 in JavaScript.
// We round once; after this point everything is whole paise and adds up exactly.
export function parsePaise(input: unknown): number | null {
  const s = String(input ?? "").trim();
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(s)) return null;
  const paise = Math.round(Number(s) * 100);
  return paise > 0 && paise <= LIMITS.maxPaise ? paise : null;
}

export function cleanText(input: unknown, max: number): string {
  return String(input ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
}

export function isUpi(s: string): boolean {
  return s.length <= LIMITS.upiLen && /^[\w.-]+@[\w]+$/.test(s);
}
