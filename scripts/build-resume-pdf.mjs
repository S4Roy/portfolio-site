// Builds a polished, ATS-friendly (single column, selectable text) resume PDF
// from docs/Subhankar_Roy_ATS_Resume.md using locally installed Google Chrome.
// Usage: node scripts/build-resume-pdf.mjs   (set CHROME_PATH to override)
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "docs/Subhankar_Roy_ATS_Resume.md");
const output = join(root, "assets/Subhankar_Roy_Full_Stack_Developer_Resume.pdf");
const chrome = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) =>
  esc(s)
    .replace(/\*\*\[([^\]]+)\]\((https?:[^)]+)\)\*\*/g, '<a href="$2"><b>$1</b></a>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/(^|[\s(])(https?:\/\/[^\s|)]+)/g, (_, p, u) => `${p}<a href="${u}">${u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a>`);
const isDate = (l) => /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}\s-\s/.test(l);

const lines = readFileSync(source, "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
let html = "";
let i = 0;
let list = false;
const closeList = () => { if (list) { html += "</ul>"; list = false; } };

// Header: name, headline, contact lines
const name = lines[i++].replace(/^# /, "");
const headline = lines[i++];
const contacts = [];
while (!lines[i].startsWith("## ")) contacts.push(...lines[i++].split(" | "));
const contactHtml = contacts
  .map((c) => c.replace(/^(LinkedIn|Portfolio):\s*/, ""))
  .map((c) => `<span class="ci">${c.includes("@") ? `<a href="mailto:${c}">${c}</a>` : inline(c)}</span>`)
  .join('<span class="sep">•</span>');
html += `<header><h1>${esc(name)}</h1><p class="headline">${esc(headline)}</p><p class="contact">${contactHtml}</p></header>`;

let section = "";
for (; i < lines.length; i++) {
  const l = lines[i];
  if (l.startsWith("## ")) {
    closeList();
    if (section) html += "</section>";
    section = l.slice(3);
    html += `<section><h2>${esc(section)}</h2>`;
  } else if (l.startsWith("### ")) {
    closeList();
    const [title, org, place] = l.slice(4).split(" | ");
    const date = isDate(lines[i + 1] || "") ? lines[++i] : "";
    // Plain, linear order for ATS parsers: Title, then "Company | Location | Dates".
    const sub = [org, place, date.replace(" - ", " – ")].filter(Boolean).map(esc).join(' <span class="sep">|</span> ');
    html += `<div class="entry"><h3>${esc(title)}</h3>${sub ? `<p class="sub">${sub}</p>` : ""}`;
    // optional meta line (stack / url / note) directly under the heading
    while (lines[i + 1] && !/^(- |#)/.test(lines[i + 1])) html += `<p class="meta">${inline(lines[++i])}</p>`;
    html += "</div>";
  } else if (l.startsWith("- ")) {
    if (!list) { html += section === "SKILLS" ? '<ul class="skills">' : "<ul>"; list = true; }
    if (section === "SKILLS") {
      const m = l.slice(2).match(/^\*\*(.+?):\*\*\s*(.*)$/);
      html += `<li><b>${esc(m[1])}:</b> ${esc(m[2])}</li>`;
    } else html += `<li><span class="dot">•</span> ${inline(l.slice(2))}</li>`;
  } else {
    closeList();
    const parts = l.split(" | ");
    html += section === "EDUCATION" && parts.length > 2
      ? `<p class="edu"><b>${esc(parts[0])}</b> <span class="sep">|</span> ${esc(parts[1])} <span class="sep">|</span> ${esc(parts.slice(2).join(" | ").replace(" - ", " – "))}</p>`
      : `<p>${inline(l)}</p>`;
  }
}
closeList();
html += "</section>";

const css = `
@page { size: A4; margin: 13mm 14mm 12mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-variant-ligatures: none; font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.5; color: #1f2937; -webkit-print-color-adjust: exact; }
a { color: inherit; text-decoration: none; }
b { color: #0f172a; font-weight: 700; }
header { padding-bottom: 9pt; border-bottom: 2pt solid #1d4ed8; margin-bottom: 4pt; }
h1 { font-size: 23pt; font-weight: 700; color: #0f172a; line-height: 1.1; }
.headline { margin-top: 3pt; font-size: 10.8pt; font-weight: 700; color: #1d4ed8; }
.contact { margin-top: 5pt; font-size: 8.9pt; color: #374151; }
.contact a { color: #1d4ed8; }
.sep { color: #9ca3af; margin: 0 5pt; }
.ci { white-space: nowrap; }
.place { display: block; text-align: right; font-weight: 500; color: #6b7280; }
li a b { color: #1d4ed8; }
section { margin-top: 12pt; }
h2 { font-size: 9.4pt; font-weight: 700; color: #1e3a8a; padding-bottom: 2.5pt; border-bottom: 0.6pt solid #cbd5e1; margin-bottom: 5pt; break-after: avoid; }
section > p { margin-bottom: 3pt; }
.entry { margin-top: 7pt; break-after: avoid; }
.sub { font-size: 9.4pt; color: #374151; margin-top: 1pt; }
.sub .sep, .edu .sep { margin: 0 4pt; }
.row { display: flex; justify-content: space-between; align-items: baseline; gap: 10pt; }
h3 { font-size: 10pt; font-weight: 700; color: #0f172a; }
.org { font-weight: 500; color: #374151; }
.date { white-space: nowrap; font-size: 8.9pt; font-weight: 700; color: #4b5563; }
.meta { font-size: 8.9pt; color: #4b5563; margin-top: 1pt; }
.meta a, li a { color: #1d4ed8; }
ul { margin: 3pt 0 0 0; list-style: none; }
ul li { padding-left: 10pt; text-indent: -8pt; margin-bottom: 3pt; break-inside: avoid; }
ul.skills li { padding-left: 0; text-indent: 0; margin-bottom: 2.5pt; }
.dot { color: #1d4ed8; }
.k { font-weight: 700; color: #0f172a; }
.edu { margin-bottom: 3pt; }
`;

const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Subhankar Roy – Senior Full Stack Developer Resume</title>
<meta name="author" content="Subhankar Roy"><meta name="keywords" content="Senior Full Stack Developer, Node.js, TypeScript, React, Next.js, Angular, MongoDB, MERN, MEAN">
<style>${css}</style></head><body>${html}</body></html>`;

const tmp = join(tmpdir(), `resume-${process.pid}.html`);
writeFileSync(tmp, doc);
mkdirSync(dirname(output), { recursive: true });
execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${output}`, `file://${tmp}`], { stdio: "ignore" });
copyFileSync(output, join(root, "public/Subhankar_Roy_Full_Stack_Developer_Resume.pdf"));
console.log(`Updated ${output} and public download.`);
