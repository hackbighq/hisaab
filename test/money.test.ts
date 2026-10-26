import { describe, it, expect } from "vitest";
import { splitEqual, settle, upiLink } from "../src/money";

describe("splitEqual", () => {
  it("never loses a paisa", () => {
    const parts = splitEqual(10000, 3);
    expect(parts).toEqual([3334, 3333, 3333]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10000);
  });
});

describe("settle", () => {
  it("uses the fewest payments for a simple trip", () => {
    const b = (id: number, net: number) => ({ id, name: "P" + id, upi: `p${id}@upi`, net });
    const pay = settle([b(1, 6000), b(2, -3000), b(3, -3000)]);
    expect(pay.map(p => [p.from.id, p.to.id, p.paise])).toEqual([[2, 1, 3000], [3, 1, 3000]]);
  });
});

describe("upiLink", () => {
  it("builds a upi:// link in rupees", () => {
    const link = upiLink({ upi: "riya@okicici", name: "Riya" }, 45050, "Goa trip");
    expect(link).toContain("pa=riya%40okicici");
    expect(link).toContain("am=450.50");
  });
});
