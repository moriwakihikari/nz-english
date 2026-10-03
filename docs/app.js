// 今日の旅行英語 — 依存ゼロの単一ページアプリ。
// データ: scenes.json / 進捗: localStorage / 録音: IndexedDB (端末内のみ)
const INTERVALS = [1, 3, 7, 14, 30]; // 復習間隔(日)。固定。SRS は入れない。
const LS_KEY = "nz-english:v1";
const $ = (sel, el = document) => el.querySelector(sel);
const todayStr = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

let DATA, STATE;
const main = $("#app");

// ---------- state ----------
function loadState() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || { scenes: {}, log: [] }; }
  catch { return { scenes: {}, log: [] }; }
}
function saveState() { localStorage.setItem(LS_KEY, JSON.stringify(STATE)); }
function sceneState(id) { return STATE.scenes[id] || (STATE.scenes[id] = { step: 0, due: null, done: 0 }); }

// 今日やる場面: 復習期限が来ているもの → 未着手の最初のもの → 期限が一番近いもの
function pickToday() {
  const t = todayStr();
  const due = DATA.scenes.filter((s) => sceneState(s.id).due && sceneState(s.id).due <= t);
  if (due.length) return due.sort((a, b) => sceneState(a.id).due.localeCompare(sceneState(b.id).due))[0];
  const fresh = DATA.scenes.find((s) => !sceneState(s.id).due);
  if (fresh) return fresh;
  return DATA.scenes.slice().sort((a, b) => sceneState(a.id).due.localeCompare(sceneState(b.id).due))[0];
}

// ---------- speech ----------
let VOICE = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  const pref = ["en-NZ", "en-AU", "en-GB", "en-US", "en"];
  for (const p of pref) { const v = vs.find((v) => v.lang.replace("_", "-").startsWith(p)); if (v) return v; }
  return null;
}
speechSynthesis.onvoiceschanged = () => { VOICE = pickVoice(); };
function speak(text, rate = 0.85) {
  return new Promise((res) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (!VOICE) VOICE = pickVoice();
    if (VOICE) u.voice = VOICE;
    u.lang = VOICE ? VOICE.lang : "en-NZ";
    u.rate = rate;
    u.onend = res; u.onerror = res;
    speechSynthesis.speak(u);
  });
}
async function speakSeq(texts, rate, onEach) {
  for (let i = 0; i < texts.length; i++) { onEach && onEach(i); await speak(texts[i], rate); await new Promise((r) => setTimeout(r, 500)); }
  onEach && onEach(-1);
}

// ---------- recordings (IndexedDB) ----------
const idb = {
  open() { return new Promise((res, rej) => { const r = indexedDB.open("nz-english", 1); r.onupgradeneeded = () => r.result.createObjectStore("rec"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  async put(k, v) { const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction("rec", "readwrite"); tx.objectStore("rec").put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); },
  async get(k) { const db = await this.open(); return new Promise((res, rej) => { const r = db.transaction("rec").objectStore("rec").get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
};

// ---------- render: scene ----------
function playBtn(text, rateSel) {
  const b = document.createElement("button"); b.className = "play"; b.textContent = "▶"; b.title = "再生";
  b.onclick = () => speak(text, parseFloat(rateSel.value));
  return b;
}
function renderScene(s) {
  const node = $("#tpl-scene").content.cloneNode(true);
  const st = sceneState(s.id);
  const rateSel = $(".rate", node);
  $(".num", node).textContent = `SCENE ${s.id} / ${DATA.scenes.length}`;
  $(".title-ja", node).textContent = s.title_ja;
  $(".title-en", node).textContent = s.title_en;
  $(".day", node).textContent = s.day;
  $(".due", node).textContent = st.due ? `次の復習: ${st.due} · 実施 ${st.done} 回` : "未着手";
  $(".situation", node).textContent = s.situation;
  $(".tips", node).textContent = s.tips;

  const fill = (ul, items) => { for (const it of items) { const li = document.createElement("li"); li.append(playBtn(it.en, rateSel)); const d = document.createElement("div"); d.innerHTML = `<div class="en">${it.en}</div><div class="ja">${it.ja}</div>`; li.append(d); ul.append(li); } };
  fill($(".pairs.listen", node), s.listen);
  fill($(".pairs.phrases", node), s.phrases);

  const ol = $(".dialogue", node);
  s.dialogue.forEach((d) => {
    const li = document.createElement("li"); li.className = d.who === "You" ? "you" : "them";
    li.append(playBtn(d.en, rateSel));
    const who = document.createElement("span"); who.className = "who"; who.textContent = d.who;
    const body = document.createElement("div"); body.innerHTML = `<div class="en">${d.en}</div><div class="ja">${d.ja}</div>`;
    li.append(who, body); ol.append(li);
  });

  const nums = $(".numbers", node);
  s.numbers.forEach((n) => { const li = document.createElement("li"); li.append(playBtn(n, rateSel)); const a = document.createElement("span"); a.className = "ans"; a.textContent = n; a.onclick = () => a.classList.toggle("reveal"); li.append(a); nums.append(li); });

  // hide english toggle
  const art = $(".scene", node);
  $(".hide-en", node).onchange = (e) => art.classList.toggle("hidden-en", e.target.checked);
  art.addEventListener("click", (e) => { if (e.target.classList.contains("en") && art.classList.contains("hidden-en")) e.target.classList.toggle("reveal"); });

  // play-all buttons
  node.querySelectorAll(".play-all").forEach((b) => {
    b.onclick = async () => {
      const rate = parseFloat(rateSel.value);
      const g = b.dataset.group;
      if (g === "listen" || g === "phrases") return speakSeq(s[g].map((x) => x.en), rate);
      if (g === "numbers") { const arr = s.numbers.slice().sort(() => Math.random() - 0.5); return speakSeq(arr, rate); }
      if (g === "dialogue") {
        // 相手役だけ読み上げ、自分の番は「次へ」を待つ
        const lis = [...ol.children];
        for (let i = 0; i < s.dialogue.length; i++) {
          lis.forEach((l) => l.classList.remove("current")); lis[i].classList.add("current"); lis[i].scrollIntoView({ block: "center", behavior: "smooth" });
          if (s.dialogue[i].who === "You") {
            await new Promise((res) => { const nb = document.createElement("button"); nb.textContent = "言った → 次へ"; nb.className = "small primary"; nb.onclick = () => { nb.remove(); res(); }; lis[i].append(nb); });
          } else { await speak(s.dialogue[i].en, rate); }
        }
        lis.forEach((l) => l.classList.remove("current"));
      }
    };
  });

  // recording
  const recStart = $(".rec-start", node), recStop = $(".rec-stop", node), audio = $(".rec-audio", node);
  idb.get(`scene-${s.id}`).then((blob) => { if (blob) audio.src = URL.createObjectURL(blob); }).catch(() => {});
  let mr, chunks = [];
  recStart.onclick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mr = new MediaRecorder(stream); chunks = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = async () => { const blob = new Blob(chunks, { type: mr.mimeType }); audio.src = URL.createObjectURL(blob); stream.getTracks().forEach((t) => t.stop()); try { await idb.put(`scene-${s.id}`, blob); } catch {} };
      mr.start(); recStart.disabled = true; recStop.disabled = false;
    } catch (err) { $(".rec-hint", node).textContent = "マイクが使えません: " + err.message; }
  };
  recStop.onclick = () => { mr && mr.stop(); recStart.disabled = false; recStop.disabled = true; };

  // result
  const msg = $(".saved-msg", node);
  const record = (redo) => {
    const entry = {
      date: todayStr(), scene: s.id, title: s.title_ja,
      listened: $(".r-listened", art).checked, spoke: $(".r-spoke", art).checked, noscript: $(".r-noscript", art).checked,
      said: $(".n-said", art).value.trim(), stuck: $(".n-stuck", art).value.trim(), redo: !!redo,
    };
    const st = sceneState(s.id);
    st.done += 1;
    if (redo) { st.step = 0; st.due = addDays(new Date(), 1); }
    else { st.due = addDays(new Date(), INTERVALS[Math.min(st.step, INTERVALS.length - 1)]); st.step += 1; }
    STATE.log = STATE.log.filter((l) => !(l.date === entry.date && l.scene === entry.scene)).concat(entry);
    saveState();
    msg.textContent = `保存しました。次の復習日: ${st.due}。「記録」タブから今日のログ(Markdown)をコピーできます。`;
    $(".due", art).textContent = `次の復習: ${st.due} · 実施 ${st.done} 回`;
  };
  $(".save", node).onclick = () => record(false);
  $(".redo", node).onclick = () => record(true);

  return node;
}

function renderRepair() {
  const node = $("#tpl-repair").content.cloneNode(true);
  const ul = $(".pairs", node);
  const rateSel = { value: "0.85" };
  for (const r of DATA.repair) { const li = document.createElement("li"); li.append(playBtn(r.en, rateSel)); const d = document.createElement("div"); d.innerHTML = `<div class="en">${r.en}</div><div class="ja">${r.ja}</div>`; li.append(d); ul.append(li); }
  return node;
}

// ---------- views ----------
function viewToday() {
  main.replaceChildren(renderScene(pickToday()), renderRepair());
}
function viewAll() {
  const card = document.createElement("div"); card.className = "card";
  const t = todayStr();
  for (const s of DATA.scenes) {
    const st = sceneState(s.id);
    const row = document.createElement("div"); row.className = "list-row";
    const status = !st.due ? "未着手" : st.due <= t ? `復習日 (${st.due})` : `次回 ${st.due}`;
    row.innerHTML = `<div class="num">${s.id}</div><div><b>${s.title_ja}</b><br><span style="color:var(--muted);font-size:.85em">${s.day}</span></div><div class="st ${st.due && st.due <= t ? "due" : ""}">${status}<br>${st.done} 回</div>`;
    row.onclick = () => { main.replaceChildren(renderScene(s), renderRepair()); window.scrollTo(0, 0); };
    card.append(row);
  }
  main.replaceChildren(card);
}
function weekKey(d) { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x.toISOString().slice(0, 10); }
function viewLog() {
  const t = todayStr();
  const thisWeek = weekKey(t);
  const wk = STATE.log.filter((l) => weekKey(l.date) === thisWeek);
  const noscript = new Set(wk.filter((l) => l.noscript).map((l) => l.scene)).size;
  const days = new Set(STATE.log.map((l) => l.date));
  let streak = 0; for (let d = t; days.has(d); d = addDays(d, -1)) streak++;

  const kpi = document.createElement("div"); kpi.className = "kpi";
  kpi.innerHTML = `
    <div class="card"><div class="v">${noscript}</div><div class="l">今週 台本なしで処理できた場面数(主指標)</div></div>
    <div class="card"><div class="v">${wk.length}</div><div class="l">今週の実施回数</div></div>
    <div class="card"><div class="v">${streak}</div><div class="l">連続日数</div></div>`;

  const todayEntries = STATE.log.filter((l) => l.date === t);
  const md = todayEntries.length
    ? [`# ${t}`, ``, ...todayEntries.map((l) => `- Scene ${l.scene} ${l.title} — 聞けた:${l.listened ? "○" : "×"} 言えた:${l.spoke ? "○" : "×"} 台本なし:${l.noscript ? "○" : "×"}${l.redo ? " (要復習)" : ""}\n  - 言えた: ${l.said || "-"}\n  - 詰まった: ${l.stuck || "-"}`), ``].join("\n")
    : `# ${t}\n\n(今日の記録はまだありません)\n`;
  const card = document.createElement("div"); card.className = "card";
  card.innerHTML = `<h2>今日のログ(log/${t}.md 用)</h2><pre class="md"></pre>`;
  $("pre", card).textContent = md;
  const copy = document.createElement("button"); copy.className = "primary"; copy.textContent = "Markdown をコピー";
  copy.onclick = async () => { await navigator.clipboard.writeText(md); copy.textContent = "コピーしました"; setTimeout(() => (copy.textContent = "Markdown をコピー"), 1500); };
  const exp = document.createElement("button"); exp.textContent = "全ログを JSON で保存";
  exp.onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(STATE, null, 2)], { type: "application/json" })); a.download = `nz-english-progress-${t}.json`; a.click(); };
  const actions = document.createElement("div"); actions.className = "result-actions"; actions.append(copy, exp); card.append(actions);

  const hist = document.createElement("div"); hist.className = "card";
  hist.innerHTML = `<h2>履歴</h2>` + (STATE.log.length ? STATE.log.slice().reverse().slice(0, 30).map((l) => `<div class="list-row" style="cursor:default"><div>${l.date}</div><div>Scene ${l.scene} ${l.title}<br><span style="color:var(--muted);font-size:.85em">${l.said || ""}${l.stuck ? " / 詰まった: " + l.stuck : ""}</span></div><div class="st">${l.noscript ? "台本なし○" : ""}</div></div>`).join("") : `<p class="hint">まだ記録がありません。</p>`);
  main.replaceChildren(kpi, card, hist);
}

// ---------- boot ----------
function setNav(id) { document.querySelectorAll("button.nav").forEach((b) => b.classList.toggle("active", b.id === id)); }
$("#btn-today").onclick = () => { setNav("btn-today"); viewToday(); };
$("#btn-all").onclick = () => { setNav("btn-all"); viewAll(); };
$("#btn-log").onclick = () => { setNav("btn-log"); viewLog(); };

fetch("scenes.json").then((r) => r.json()).then((d) => { DATA = d; STATE = loadState(); viewToday(); })
  .catch((e) => { main.innerHTML = `<p class="hint">scenes.json を読めませんでした: ${e.message}。ローカルでは <code>python3 -m http.server</code> などで配信してください。</p>`; });
