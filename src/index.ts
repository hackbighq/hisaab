// Cloudflare Worker entry: Hono routes -> app logic (hisaab.ts) -> D1 store.
// Run it locally with `npm run dev` (local D1, nothing leaves your machine).
import { Hono, type Context } from "hono";
import { page } from "./page";
import { state, addMember, addExpense, type Reply } from "./hisaab";
import { D1Store } from "./d1store";
import { LIMITS } from "./validate";

type Env = { DB: D1Database };
type Vars = { nonce: string };
type C = Context<{ Bindings: Env; Variables: Vars }>;
const app = new Hono<{ Bindings: Env; Variables: Vars }>();

// Security headers on every response. The page's one <style> and <script> carry a per-request
// nonce, so the CSP blocks any other script (a second line of defence behind esc() in page.ts).
app.use("*", async (c, next) => {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  c.set("nonce", nonce);
  await next();
  const h = c.res.headers;
  h.set("Content-Security-Policy",
    `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; ` +
    `img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`);
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "no-referrer");
  h.set("Cache-Control", "no-store");
});

// Read a JSON body with a size cap.
async function body(c: C): Promise<Record<string, unknown> | null> {
  const raw = await c.req.text();
  if (raw.length > LIMITS.bodyBytes) return null;
  try { const v = JSON.parse(raw || "{}"); return v && typeof v === "object" ? v : null; } catch { return null; }
}

const send = (c: C, [status, json]: Reply) => c.json(json as object, status as 200);

app.get("/", c => c.html(page({ nonce: c.get("nonce") })));
app.get("/api/state", async c => send(c, await state(new D1Store(c.env.DB))));
app.post("/api/members", async c => {
  const b = await body(c);
  return b ? send(c, await addMember(new D1Store(c.env.DB), b)) : c.json({ error: "bad request" }, 400);
});
app.post("/api/expenses", async c => {
  const b = await body(c);
  return b ? send(c, await addExpense(new D1Store(c.env.DB), b)) : c.json({ error: "bad request" }, 400);
});

export default app;
