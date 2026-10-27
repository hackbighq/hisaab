// Browser-only demo: the page (src/page.ts) still calls fetch("/api/..."). We answer those calls
// right here in the browser with the same app logic, backed by localStorage. No network, no server.
import { state, addMember, addExpense, type Reply } from "../src/hisaab";
import { LocalStore } from "./localstore";

const store = new LocalStore();
const routes: Record<string, (b: Record<string, unknown>) => Promise<Reply>> = {
  "GET /api/state": () => state(store),
  "POST /api/members": b => addMember(store, b),
  "POST /api/expenses": b => addExpense(store, b),
};

const realFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const route = routes[`${init?.method ?? "GET"} ${String(input)}`];
  if (!route) return realFetch(input, init);
  let body: Record<string, unknown> = {};
  try { body = JSON.parse(String(init?.body ?? "{}")); } catch { /* empty body */ }
  const [status, json] = await route(body);
  return new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("reset")?.addEventListener("click", e => {
    e.preventDefault();
    store.reset();
    location.reload();
  });
});
