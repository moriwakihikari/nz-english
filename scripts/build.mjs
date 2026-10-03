// scenes/scenes.json を唯一のソースにして、以下を生成する。
//   scenes/NN-slug.md   … 読む用の台本(日英対訳)
//   pdf/scenes.html     … 印刷用 HTML (→ Chrome headless で PDF 化)
//   docs/scenes.json    … アプリ用データ(コピー)
// 使い方: node scripts/build.mjs
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "scenes/scenes.json"), "utf8"));
const pad = (n) => String(n).padStart(2, "0");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---------- Markdown ----------
for (const s of data.scenes) {
  const md = [];
  md.push(`# Scene ${s.id} — ${s.title_ja}`);
  md.push(``, `**${s.title_en}**  `, `${s.day}`, ``);
  md.push(`## 場面`, ``, s.situation, ``);
  md.push(`## 聞こえてくる言葉(先に耳を慣らす)`, ``);
  for (const l of s.listen) md.push(`- **${l.en}**  `, `  ${l.ja}`);
  md.push(``, `## 自分が言うフレーズ`, ``);
  for (const p of s.phrases) md.push(`- **${p.en}**  `, `  ${p.ja}`);
  md.push(``, `## 会話`, ``, `| | English | 日本語 |`, `|---|---|---|`);
  for (const d of s.dialogue) md.push(`| ${d.who} | ${d.en} | ${d.ja} |`);
  md.push(``, `## 数字・固有名詞ドリル`, ``);
  for (const n of s.numbers) md.push(`- ${n}`);
  md.push(``, `## メモ`, ``, s.tips, ``);
  md.push(`## 聞き返しフレーズ(全場面共通)`, ``);
  for (const r of data.repair) md.push(`- **${r.en}** — ${r.ja}`);
  md.push(``);
  writeFileSync(join(root, `scenes/${pad(s.id)}-${s.slug}.md`), md.join("\n"));
}

// ---------- HTML for PDF ----------
const sceneHtml = data.scenes.map((s) => `
<section class="scene">
  <header class="scene-head">
    <div class="num">SCENE ${s.id}</div>
    <h1>${esc(s.title_ja)}</h1>
    <div class="sub">${esc(s.title_en)} <span class="day">${esc(s.day)}</span></div>
  </header>
  <p class="situation">${esc(s.situation)}</p>

  <h2><span class="tag listen">聞く</span>聞こえてくる言葉</h2>
  <ul class="pairs">
    ${s.listen.map((l) => `<li><div class="en">${esc(l.en)}</div><div class="ja">${esc(l.ja)}</div></li>`).join("")}
  </ul>

  <h2><span class="tag speak">話す</span>自分が言うフレーズ</h2>
  <ul class="pairs">
    ${s.phrases.map((p) => `<li><div class="en">${esc(p.en)}</div><div class="ja">${esc(p.ja)}</div></li>`).join("")}
  </ul>

  <h2><span class="tag talk">会話</span>ロールプレイ台本</h2>
  <table class="dialogue">
    ${s.dialogue.map((d) => `<tr class="${d.who === "You" ? "you" : "them"}"><td class="who">${esc(d.who)}</td><td class="en">${esc(d.en)}</td><td class="ja">${esc(d.ja)}</td></tr>`).join("")}
  </table>

  <div class="two-col">
    <div>
      <h2><span class="tag num">数字</span>数字・固有名詞ドリル</h2>
      <ul class="numbers">${s.numbers.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
    </div>
    <div>
      <h2><span class="tag memo">メモ</span>知っておくこと</h2>
      <p class="tips">${esc(s.tips)}</p>
    </div>
  </div>
</section>`).join("\n");

const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<title>NZ South Island — 旅行英語 8場面 台本</title>
<style>
  @page { size: A4; margin: 14mm 14mm 16mm; }
  :root { --ink:#1f2a33; --muted:#5b6b78; --line:#d9e1e7; --accent:#1f5f7a; --accent-bg:#e8f1f5; --you:#fff7e6; --listen:#2b7a4b; --speak:#1f5f7a; --talk:#7a4b2b; --num:#5a3d7a; --memo:#555; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif; color: var(--ink); font-size: 10.5pt; line-height: 1.55; margin: 0; }
  .cover { height: 250mm; display:flex; flex-direction:column; justify-content:center; break-after: page; }
  .cover h1 { font-size: 30pt; margin: 0 0 6mm; line-height: 1.25; }
  .cover .lead { font-size: 12pt; color: var(--accent); margin-bottom: 10mm; }
  .cover .box { background: var(--accent-bg); padding: 6mm 7mm; border-radius: 3mm; margin-bottom: 6mm; }
  .cover ol { margin: 0; padding-left: 1.4em; columns: 2; column-gap: 10mm; }
  .cover li { margin-bottom: 1.5mm; break-inside: avoid; }
  .cover .how { font-size: 9.5pt; color: var(--muted); }
  .cover .how b { color: var(--ink); }
  .repair { border: 1px solid var(--line); border-radius: 3mm; padding: 4mm 6mm; }
  .repair h2 { margin: 0 0 2mm; font-size: 11pt; }
  .repair li { margin: 0.5mm 0; }
  .scene { break-before: page; }
  .scene-head { border-bottom: 2px solid var(--accent); padding-bottom: 2mm; margin-bottom: 3mm; }
  .scene-head .num { font-size: 9pt; letter-spacing: .15em; color: var(--accent); font-weight: 700; }
  .scene-head h1 { font-size: 19pt; margin: 0.5mm 0 0; }
  .scene-head .sub { color: var(--muted); font-size: 10pt; }
  .scene-head .day { margin-left: 3mm; background: var(--accent-bg); color: var(--accent); padding: 0.3mm 2mm; border-radius: 1mm; font-size: 9pt; }
  .situation { background: var(--accent-bg); padding: 2.5mm 4mm; border-radius: 2mm; margin: 0 0 3mm; font-size: 10pt; }
  h2 { font-size: 11.5pt; margin: 4mm 0 1.5mm; display:flex; align-items:center; gap: 2mm; }
  .tag { font-size: 8pt; color:#fff; padding: 0.3mm 2mm; border-radius: 1mm; letter-spacing:.05em; }
  .tag.listen{background:var(--listen)} .tag.speak{background:var(--speak)} .tag.talk{background:var(--talk)} .tag.num{background:var(--num)} .tag.memo{background:var(--memo)}
  ul.pairs { list-style: none; margin: 0; padding: 0; columns: 2; column-gap: 6mm; }
  ul.pairs li { break-inside: avoid; margin-bottom: 1.6mm; padding-left: 2.5mm; border-left: 2px solid var(--line); }
  ul.pairs .en { font-weight: 600; font-size: 10.5pt; }
  ul.pairs .ja { color: var(--muted); font-size: 9pt; }
  table.dialogue { width: 100%; border-collapse: collapse; font-size: 9.6pt; }
  table.dialogue td { padding: 1.3mm 2mm; border-bottom: 1px solid var(--line); vertical-align: top; }
  table.dialogue tr { break-inside: avoid; }
  table.dialogue .who { width: 18mm; color: var(--muted); font-size: 8.5pt; white-space: nowrap; }
  table.dialogue .en { width: 52%; }
  table.dialogue .ja { color: var(--muted); font-size: 9pt; }
  table.dialogue tr.you { background: var(--you); }
  table.dialogue tr.you .who { color: #9a6b00; font-weight: 700; }
  .two-col { display: grid; grid-template-columns: 1fr 1.4fr; gap: 6mm; break-inside: avoid; }
  ul.numbers { margin: 0; padding-left: 1.3em; font-size: 10pt; }
  ul.numbers li { margin-bottom: 0.6mm; font-weight: 600; }
  .tips { margin: 0; font-size: 9.5pt; color: var(--ink); }
  .foot { position: fixed; bottom: 0; font-size: 8pt; color: var(--muted); }
</style></head><body>

<section class="cover">
  <div class="lead">NEW ZEALAND SOUTH ISLAND · 8 NIGHTS · ROAD TRIP</div>
  <h1>旅行英語 8場面<br>ロールプレイ台本</h1>
  <div class="box">
    <ol>
      ${data.scenes.map((s) => `<li><b>${esc(s.title_ja)}</b><br><span style="color:var(--muted);font-size:9pt">${esc(s.day)}</span></li>`).join("")}
    </ol>
  </div>
  <p class="how"><b>使い方:</b> 1場面を3〜5日かけて回す。①「聞こえてくる言葉」を音声で聞く(アプリの再生ボタン) → ②「自分が言うフレーズ」を音読 → ③ 会話の日本語だけを見て英語を口に出す → ④ オンライン英会話で同じ場面をロールプレイ → ⑤ 言えた1つ / 詰まった1つを記録。<br>
  <b>優先順位:</b> 流暢さより「数字・時刻・金額・名前のスペル」と「聞き返し」。聞き取れなかったら下の6文のどれかを言えば会話は止まらない。</p>
  <div class="repair">
    <h2>聞き返しフレーズ(全場面共通・最初に覚える)</h2>
    <ul class="pairs">
      ${data.repair.map((r) => `<li><div class="en">${esc(r.en)}</div><div class="ja">${esc(r.ja)}</div></li>`).join("")}
    </ul>
  </div>
</section>
${sceneHtml}
</body></html>`;
mkdirSync(join(root, "pdf"), { recursive: true });
writeFileSync(join(root, "pdf/scenes.html"), html);

// ---------- App data ----------
mkdirSync(join(root, "docs"), { recursive: true });
copyFileSync(join(root, "scenes/scenes.json"), join(root, "docs/scenes.json"));
console.log(`built ${data.scenes.length} scenes → scenes/*.md, pdf/scenes.html, docs/scenes.json`);
