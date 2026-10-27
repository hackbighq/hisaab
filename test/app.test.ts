import { describe, it, expect } from "vitest";
import { parsePaise, cleanText, isUpi } from "../src/validate";
import { state, addMember, addExpense } from "../src/hisaab";
import { LocalStore } from "../demo/localstore";   // in Node there's no localStorage, so it keeps data in memory

describe("parsePaise", () => {
  it("converts rupees to whole paise without float drift", () => {
    expect(parsePaise("19.99")).toBe(1999);     // 19.99 * 100 is 1998.9999999999998 in JS
    expect(parsePaise("450.5")).toBe(45050);
  });
  it("rejects zero, negatives, junk and amounts over the cap", () => {
    for (const bad of ["0", "-5", "abc", "1e5", "1.234", "", "100000.01"]) expect(parsePaise(bad)).toBeNull();
  });
});

describe("input caps", () => {
  it("trims, strips control characters and caps length", () => {
    expect(cleanText("  Riya\n ", 40)).toBe("Riya");
    expect(cleanText("x".repeat(500), 40)).toHaveLength(40);
  });
  it("accepts UPI ids and rejects everything else", () => {
    expect(isUpi("riya@okicici")).toBe(true);
    expect(isUpi("<script>@x")).toBe(false);
  });
});

describe("a Goa trip, end to end", () => {
  it("splits, balances to zero and settles in two payments", async () => {
    const s = new LocalStore();
    for (const [name, upi] of [["Asha", "asha@okaxis"], ["Ben", "ben@ybl"], ["Chitra", "chitra@okicici"]])
      expect((await addMember(s, { name, upi }))[0]).toBe(200);
    await addExpense(s, { payer_id: 1, amount: "3000", note: "Villa" });
    await addExpense(s, { payer_id: 2, amount: "1250.50", note: "Dinner" });
    const [, body] = await state(s) as [number, any];
    expect(body.balances.reduce((t: number, b: any) => t + b.net, 0)).toBe(0);    // no paisa lost
    expect(body.plan.map((p: any) => `${p.from}->${p.to} ${p.amount}`)).toEqual(["Chitra->Asha 1416.83", "Ben->Asha 166.33"]);
  });
  it("refuses a payer who isn't in the group", async () => {
    expect((await addExpense(new LocalStore(), { payer_id: 99, amount: "5" }))[0]).toBe(400);
  });
});
