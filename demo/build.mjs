// Builds the browser-only demo into dist-demo/ (published to GitHub Pages by .github/workflows/pages.yml).
// Run: npm run build:demo, then open dist-demo/index.html or `npx serve dist-demo`.
import { build } from "esbuild";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

const out = "dist-demo";
mkdirSync(out, { recursive: true });

// 1. demo.js = fetch shim + app logic + localStorage store, one file.
await build({ entryPoints: ["demo/main.ts"], bundle: true, minify: true, format: "iife",
  target: "es2020", outfile: `${out}/demo.js` });

// 2. index.html = the real page from src/page.ts, with the demo banner and demo.js loaded first.
const mod = await build({ entryPoints: ["src/page.ts"], bundle: true, format: "esm", write: false });
const { page } = await import("data:text/javascript;base64," + Buffer.from(mod.outputFiles[0].text).toString("base64"));
let html = page({ banner: `Demo — runs in your browser, nothing is sent anywhere. <a href="#" id="reset">Reset demo</a>` });

// 3. A strict CSP for a static host: only demo.js and the page's own inline script/style (by hash).
//    connect-src 'none' means the page cannot send anything to any server, even if it tried.
const sha = s => "'sha256-" + createHash("sha256").update(s).digest("base64") + "'";
const inner = tag => html.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))[1];
const csp = `default-src 'none'; script-src 'self' ${sha(inner("script"))}; style-src ${sha(inner("style"))}; ` +
  `img-src 'self' data:; connect-src 'none'; base-uri 'none'; form-action 'none'`;
html = html.replace("<title>", `<meta http-equiv="Content-Security-Policy" content="${csp}">\n<script src="demo.js"></script>\n<title>`);
writeFileSync(`${out}/index.html`, html);
console.log(`built ${out}/index.html + demo.js`);
