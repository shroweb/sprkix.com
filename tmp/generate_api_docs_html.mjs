import fs from "node:fs/promises";
import path from "node:path";

function findBalancedBlock(src, startIdx) {
  let i = startIdx;
  while (i < src.length && src[i] !== "[") i++;
  if (i >= src.length) throw new Error("Could not find '[' for sections array");
  const openIdx = i;
  let depth = 0;
  let inStr = null; // "'" | '"' | '`'
  let esc = false;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (inStr) {
      if (ch === "\\") {
        esc = true;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      inStr = ch;
      continue;
    }
    // Very small comment skipper so bracket counting doesn't get confused.
    if (ch === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i++;
      continue;
    }
    if (ch === "[") depth++;
    if (ch === "]") {
      depth--;
      if (depth === 0) return { openIdx, closeIdx: i };
    }
  }
  throw new Error("Unbalanced sections array");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function render(sections) {
  const nav = sections
    .map(
      (s) =>
        `<a class="navlink" href="#${escapeHtml(s.id)}">${escapeHtml(
          s.title,
        )}</a>`,
    )
    .join("");

  const body = sections
    .map((s) => {
      const endpoints = (s.endpoints || [])
        .map((ep) => {
          const auth = ep.auth ? `<span class="pill auth">Auth</span>` : "";
          const method = `<span class="pill ${ep.method.toLowerCase()}">${escapeHtml(
            ep.method,
          )}</span>`;
          const path = `<code class="path">${escapeHtml(ep.path)}</code>`;

          const query =
            ep.query?.length > 0
              ? `<div class="params"><h4>Query</h4>${ep.query
                  .map(
                    (p) =>
                      `<div class="param"><code>${escapeHtml(p.name)}</code><span class="muted">${escapeHtml(
                        p.type,
                      )}${p.required ? " (required)" : ""}</span><div class="pdesc">${escapeHtml(
                        p.description,
                      )}</div></div>`,
                  )
                  .join("")}</div>`
              : "";

          const reqBody =
            ep.body?.length > 0
              ? `<div class="params"><h4>Body</h4>${ep.body
                  .map(
                    (p) =>
                      `<div class="param"><code>${escapeHtml(p.name)}</code><span class="muted">${escapeHtml(
                        p.type,
                      )}${p.required ? " (required)" : ""}</span><div class="pdesc">${escapeHtml(
                        p.description,
                      )}</div></div>`,
                  )
                  .join("")}</div>`
              : "";

          const exampleReq =
            ep.example?.request
              ? `<div class="codewrap"><div class="codetitle">Example Request</div><pre><code>${escapeHtml(
                  ep.example.request,
                )}</code></pre></div>`
              : "";
          const exampleRes = ep.example?.response
            ? `<div class="codewrap"><div class="codetitle">Example Response</div><pre><code>${escapeHtml(
                ep.example.response,
              )}</code></pre></div>`
            : "";

          const returns = ep.returns
            ? `<div class="returns"><span class="muted">Returns:</span> <code>${escapeHtml(
                ep.returns,
              )}</code></div>`
            : "";

          return `<article class="ep">
  <div class="ephead">
    ${method}${auth}
    <span class="epdesc">${escapeHtml(ep.description || "")}</span>
  </div>
  <div class="eppath">${path}</div>
  ${returns}
  <div class="grid">
    ${query}
    ${reqBody}
  </div>
  <div class="grid codegrid">
    ${exampleReq}
    ${exampleRes}
  </div>
</article>`;
        })
        .join("");

      return `<section class="section" id="${escapeHtml(s.id)}">
  <div class="secthead">
    <h2>${escapeHtml(s.title)}</h2>
    ${s.description ? `<p class="muted">${escapeHtml(s.description)}</p>` : ""}
  </div>
  ${endpoints}
</section>`;
    })
    .join("");

  return { nav, body };
}

async function main() {
  const repoRoot = process.cwd();
  const srcPath = path.join(repoRoot, "app/(public)/api-docs/page.tsx");
  const outPath = path.join(repoRoot, "public/api-docs.html");

  const src = await fs.readFile(srcPath, "utf8");
  const marker = "const sections";
  const markerIdx = src.indexOf(marker);
  if (markerIdx < 0) throw new Error("Could not locate const sections in api-docs page");

  // Skip the TS type annotation `Section[]` and find the actual array after `=`.
  const eqIdx = src.indexOf("=", markerIdx);
  if (eqIdx < 0) throw new Error("Could not locate '=' for sections initializer");

  const { openIdx, closeIdx } = findBalancedBlock(src, eqIdx);
  const arrayLiteral = src.slice(openIdx, closeIdx + 1);

  // Evaluate the sections array safely-ish: it contains JSON.stringify calls for examples.
  const getSections = new Function(
    `"use strict";\n` +
      `const sections = ${arrayLiteral};\n` +
      `return sections;`,
  );
  const sections = getSections();

  const { nav, body } = render(sections);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Poison Rana API Docs (Local HTML)</title>
  <style>
    :root{
      --bg:#070812;
      --card:#0d1020;
      --border:rgba(255,255,255,.08);
      --text:rgba(255,255,255,.92);
      --muted:rgba(255,255,255,.55);
      --primary:#fbbf24;
      --shadow: 0 30px 80px rgba(0,0,0,.55);
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      --sans: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      background: radial-gradient(1200px 600px at 30% 0%, rgba(251,191,36,.18), transparent 55%),
                  radial-gradient(900px 600px at 90% 15%, rgba(56,189,248,.12), transparent 55%),
                  linear-gradient(180deg, #050611, var(--bg));
      color:var(--text);
      font-family:var(--sans);
    }
    a{color:inherit}
    .wrap{max-width:1100px;margin:0 auto;padding:48px 18px 80px}
    .top{
      display:flex;gap:18px;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;
      margin-bottom:20px;
    }
    h1{margin:0;font-size:40px;letter-spacing:-.03em;text-transform:uppercase;font-weight:900;font-style:italic}
    .sub{margin:8px 0 0;color:var(--muted);max-width:70ch}
    .bar{
      margin:24px 0 34px;
      padding:14px 16px;
      background:rgba(255,255,255,.03);
      border:1px solid var(--border);
      border-radius:18px;
      box-shadow: var(--shadow);
      display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;
    }
    .bar strong{color:var(--primary)}
    .bar code{font-family:var(--mono);font-size:12px;color:rgba(251,191,36,.9)}
    .nav{
      display:flex;gap:8px;flex-wrap:wrap;
    }
    .navlink{
      text-decoration:none;
      padding:9px 12px;
      border-radius:999px;
      border:1px solid var(--border);
      background:rgba(255,255,255,.02);
      font-weight:800;
      text-transform:uppercase;
      letter-spacing:.16em;
      font-size:10px;
      opacity:.9;
    }
    .navlink:hover{opacity:1;border-color:rgba(251,191,36,.35)}
    .section{margin-top:42px}
    .secthead{
      padding:18px 18px 14px;
      border:1px solid var(--border);
      border-radius:22px;
      background:rgba(13,16,32,.65);
      box-shadow: var(--shadow);
    }
    .secthead h2{margin:0;font-size:18px;text-transform:uppercase;font-weight:900;font-style:italic;letter-spacing:-.02em}
    .muted{color:var(--muted)}
    .ep{
      margin-top:14px;
      border:1px solid var(--border);
      border-radius:22px;
      background:rgba(13,16,32,.72);
      overflow:hidden;
      box-shadow: var(--shadow);
    }
    .ephead{
      padding:14px 16px;
      border-bottom:1px solid rgba(255,255,255,.06);
      display:flex;align-items:center;gap:10px;flex-wrap:wrap;
    }
    .epdesc{color:var(--muted);font-weight:650}
    .eppath{padding:12px 16px 2px}
    .path{font-family:var(--mono);font-size:13px;color:rgba(255,255,255,.9)}
    .returns{padding:0 16px 14px;color:var(--muted)}
    .returns code{font-family:var(--mono);font-size:12px;color:rgba(255,255,255,.86)}
    .pill{
      display:inline-flex;align-items:center;justify-content:center;
      padding:6px 10px;border-radius:999px;
      font-family:var(--mono);
      font-size:12px;
      border:1px solid var(--border);
      background:rgba(255,255,255,.02);
    }
    .pill.auth{font-family:var(--sans);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.8)}
    .pill.get{color:#60a5fa;border-color:rgba(96,165,250,.25)}
    .pill.post{color:#34d399;border-color:rgba(52,211,153,.25)}
    .pill.patch{color:#fbbf24;border-color:rgba(251,191,36,.25)}
    .pill.delete{color:#fb7185;border-color:rgba(251,113,133,.25)}
    .grid{display:grid;grid-template-columns:1fr;gap:12px;padding:0 16px 16px}
    .codegrid{padding-top:0}
    @media (min-width: 860px){
      .grid{grid-template-columns:1fr 1fr}
    }
    .params{
      border:1px solid rgba(255,255,255,.06);
      border-radius:18px;
      background:rgba(255,255,255,.02);
      padding:12px 12px;
    }
    .params h4{margin:0 0 10px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.7)}
    .param{padding:10px 10px;border-radius:14px;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.05)}
    .param + .param{margin-top:8px}
    .param code{font-family:var(--mono);font-weight:900}
    .pdesc{margin-top:6px;color:var(--muted);font-size:12px;line-height:1.35}
    pre{margin:0;overflow:auto;padding:12px;background:rgba(0,0,0,.28);border-radius:14px;border:1px solid rgba(255,255,255,.06)}
    pre code{font-family:var(--mono);font-size:12px;line-height:1.4;color:rgba(255,255,255,.88)}
    .codewrap{border:1px solid rgba(255,255,255,.06);border-radius:18px;background:rgba(255,255,255,.02);padding:12px}
    .codetitle{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:10px}
    .footer{margin-top:48px;color:var(--muted);font-size:12px}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div>
        <h1>API Docs</h1>
        <p class="sub">Standalone HTML export of the Poison Rana REST API docs. Default base URL uses the current site origin.</p>
      </div>
      <div class="nav">${nav}</div>
    </div>
    <div class="bar">
      <div><strong>Base URL:</strong> <code id="base"></code></div>
      <div class="muted">Tip: add <code>?baseUrl=https://poisonrana.com/api/v1</code> to override.</div>
    </div>
    <div id="content">${body}</div>
    <div class="footer">Generated from <code>app/(public)/api-docs/page.tsx</code></div>
  </div>
  <script>
    const sp = new URLSearchParams(location.search);
    const baseUrl = (sp.get("baseUrl") || sp.get("base") || (location.origin + "/api/v1")).replace(/\\/+$/, "");
    document.getElementById("base").textContent = baseUrl;
  </script>
</body>
</html>`;

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, html, "utf8");
  console.log("Wrote", outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
