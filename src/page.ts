export const page = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hisaab</title>
<style>
  body { font: 16px system-ui, sans-serif; background: #0d1117; color: #e6edf3; margin: 0; }
  main { max-width: 720px; margin: 0 auto; padding: 24px; }
  h1 { color: #ffb000; margin: 0 0 4px; } .sub { color: #8b949e; margin: 0 0 20px; }
  section { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: .08em; color: #8b949e; margin: 0 0 12px; }
  input, select, button { font: inherit; padding: 8px 10px; border-radius: 8px; border: 1px solid #30363d; background: #0d1117; color: #e6edf3; }
  button { background: #ffb000; color: #111; border: 0; font-weight: 700; cursor: pointer; }
  form { display: flex; gap: 8px; flex-wrap: wrap; } li { margin: 6px 0; }
  .pos { color: #3fb950; } .neg { color: #f85149; }
  a.pay { display: inline-block; background: #238636; color: #fff; padding: 6px 12px; border-radius: 8px; text-decoration: none; margin-left: 8px; }
</style></head>
<body><main>
<h1>Hisaab</h1><p class="sub">Trip and flat expenses. Settle up with UPI.</p>
<section><h2>Members</h2>
  <form id="mf"><input name="name" placeholder="Name" required><input name="upi" placeholder="name@upi" required><button>Add</button></form>
  <ul id="members"></ul></section>
<section><h2>Add expense</h2>
  <form id="ef"><select name="payer_id" id="payer"></select><input name="amount" placeholder="Amount (₹)" required>
  <input name="note" placeholder="What for?"><button>Add</button></form>
  <ul id="expenses"></ul></section>
<section><h2>Settle up</h2><ul id="plan"></ul></section>
</main>
<script>
const $ = id => document.getElementById(id);
const post = (url, body) => fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
async function load() {
  const s = await (await fetch("/api/state")).json();
  $("members").innerHTML = s.balances.map(b =>
    "<li>" + b.name + " <small>" + b.upi + "</small> <b class=" + (b.net < 0 ? "neg" : "pos") + ">₹" + (b.net / 100).toFixed(2) + "</b></li>").join("");
  $("payer").innerHTML = s.members.map(m => "<option value=" + m.id + ">" + m.name + " paid</option>").join("");
  $("expenses").innerHTML = s.expenses.map(e => "<li>" + e.payer + " paid ₹" + (e.amount_paise / 100).toFixed(2) + " for " + e.note + "</li>").join("");
  $("plan").innerHTML = s.plan.length ? s.plan.map(p =>
    "<li>" + p.from + " pays " + p.to + " <b>₹" + p.amount + "</b><a class=pay href='" + p.link + "'>Pay via UPI</a></li>").join("") : "<li>All settled.</li>";
}
$("mf").onsubmit = async e => { e.preventDefault(); await post("/api/members", Object.fromEntries(new FormData(e.target))); e.target.reset(); load(); };
$("ef").onsubmit = async e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); f.payer_id = +f.payer_id; await post("/api/expenses", f); e.target.reset(); load(); };
load();
</script></body></html>`;
