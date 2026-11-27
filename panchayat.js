// Panchayat Wall: every gram panchayat is one tile that lights up when its Sarpanch result is declared.
// Reads live/gp.json: { updated, gp: [ [district id, mandal id, village, phase 1-3, side "K" | "Y" | "O" | "" (not declared), winner, margin, status, minute] ] }
// Localhost only: add ?demo to preview with simulated data (never shown on the public site).
(() => {
  const ZP = window.AP_ZP, $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = (n) => Number(n || 0).toLocaleString("en-IN");
  const DEMO = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).has("demo");
  const DISTS = ZP.districts.map(([id, name, te]) => ({ id, name, te }));
  // the page opens on the phase that is polling today (India time): 26 Nov phase 1, 29 Nov phase 2, 2 Dec phase 3 (phase 1 before that)
  function livePhase() { const d = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); return d >= "2026-12-02" ? 3 : d >= "2026-11-29" ? 2 : 1; }
  const PH = [{ n: 1, date: "2026-11-26", te: "26 నవంబర్", gps: 3949 }, { n: 2, date: "2026-11-29", te: "29 నవంబర్", gps: 4960 }, { n: 3, date: "2026-12-02", te: "2 డిసెంబర్" }]; // gps: Sarpanch posts notified per phase
  const SIDE = { K: "కూటమి మద్దతు", Y: "వైసీపీ మద్దతు", O: "ఇతరులు · స్వతంత్రులు" }, COL = { K: "#d4a000", Y: "#1d5fc4", O: "#8a63d2" }, PEND = "#e3e6ee";
  const T = 7, G = 1; // tile and gap, px
  let D = { gp: [], updated: null }, groups = [], st = { phase: livePhase(), side: "", q: "", sel: null, view: "dist", lq: "", lim: 100, open: new Set() };
  const XM = { "polavaram/x-nellipaka": "నెల్లిపాక", "krishna/x-machilipatnamrural": "మచిలీపట్నం (గ్రామీణ)" }, nm = (g) => g[9] || g[2]; // mandals the site's mandal list does not have; the village name (Telugu when the list has it)
  const mName = (d, m) => XM[`${d}/${m}`] || ZP.te?.[`${d}/${m}`] || ((ZP.mandals[d] || []).find((x) => x[0] === m) || [])[1] || m;
  const dTe = Object.fromEntries(DISTS.map((d) => [d.id, d.te]));
  const day = (s) => new Date(s + "T07:00:00+05:30"), left = (s) => day(s) - Date.now();

  // ---------- simulated data (localhost ?demo only) ----------
  function demo(p) {
    const r = (i) => { let h = 2166136261 ^ i; h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const rows = []; let k = 0;
    ZP.districts.forEach(([d], di) => (ZP.mandals[d] || []).forEach(([m]) => {
      const n = 14 + Math.floor(r(k++) * 13), ph = (di % 3) + 1, prog = Math.max(0, Math.min(1, ((p - (ph - 1) * 33) / 33) * 1.15));
      for (let i = 1; i <= n; i++, k++) {
        const x = r(k), done = r(k + 7) < prog, lean = ["kurnool", "nandyal", "kadapa", "anantapur", "sri-sathya-sai", "chittoor", "tirupati", "annamayya"].includes(d) ? 0.45 : 0.62, y = r(k + 3);
        rows.push([d, m, `${mName(d, m)} గ్రామం ${i}`, ph, done ? (y < lean ? "K" : y < lean + 0.3 ? "Y" : "O") : "", done ? `అభ్యర్థి ${Math.floor(x * 900)}` : "", done ? Math.floor(r(k + 5) * 900) + 12 : 0, done ? "won" : "", done ? Math.floor(r(k + 9) * 600) : 0]);
      }
    }));
    return { gp: rows, updated: new Date().toISOString() };
  }

  // ---------- derived ----------
  const hay = (g) => `${g[2]} ${g[9] || ""} ${g[5] || ""} ${mName(g[0], g[1])} ${(ZP.mandals[g[0]] || []).find((x) => x[0] === g[1])?.[1] || ""} ${dTe[g[0]] || ""} ${g[0]}`.toLowerCase();
  const inPhase = (g) => !st.phase || g[3] === st.phase;
  const visible = (g) => inPhase(g) && (!st.side || (st.side === "P" ? !g[4] : g[4] === st.side));
  function group() {
    const by = {}; D.gp.forEach((g, i) => (by[g[0]] ||= []).push(i));
    groups = DISTS.filter((d) => by[d.id]).map((d) => { const idx = by[d.id].sort((a, b) => (D.gp[a][1] + D.gp[a][2]).localeCompare(D.gp[b][1] + D.gp[b][2], "te")), n = idx.length, cols = Math.max(6, Math.ceil(Math.sqrt(n * 1.5))); return { d, idx, cols, rows: Math.ceil(n / cols) }; });
  }
  const tally = (rows) => { const o = { total: rows.length, done: 0, K: 0, Y: 0, O: 0 }; for (const g of rows) if (g[4]) { o.done++; o[g[4]]++; } return o; };

  // ---------- render ----------
  function score() {
    const o = tally(D.gp.filter(inPhase)), nrep = D.gp.filter((g) => inPhase(g) && g[7] === "reported").length;
    $("#plScore").innerHTML = `<div class="big"><small>ప్రకటించిన సర్పంచ్ ఫలితాలు · Declared</small><b>${nf(o.done)}<small>/ ${o.total ? nf(o.total) : "13,000+"}</small></b><i>${o.total ? `${nf(o.total - o.done)} ఎదురుచూపు` : "ఫలితాలు పోలింగ్ రోజున ప్రారంభం"}${nrep ? ` · ${nf(nrep)} ఫాలోవర్ నివేదికలు (ఆమోదించినవి)` : ""}</i></div>
      ${["K", "Y", "O"].map((k) => `<div class="${k.toLowerCase()}"><small>${SIDE[k]}</small><b>${nf(o[k])}</b><i>${o.done ? ((o[k] / o.done) * 100).toFixed(1) + "% of declared" : "—"}</i></div>`).join("")}`;
  }
  const isLive = (date) => { const t = Date.now() - new Date(date + "T00:00:00+05:30"); return t >= 0 && t < 2 * 864e5; }; // from midnight (India time) on poll day, through counting and the day after
  function phases() {
    $("#plPhases").innerHTML = PH.map((p) => {
      const rows = D.gp.filter((g) => g[3] === p.n), o = tally(rows), ms = left(p.date), live = isLive(p.date), d = Math.ceil(ms / 864e5);
      const stt = ms > 0 ? `ఇంకా ${d} రోజులు` : live || o.done < o.total ? "కొనసాగుతోంది" : "ముగిసింది";
      return `<div class="pl-ph ${live ? "on" : ""}"><span class="n">${p.n}</span><b>${p.te} · పోలింగ్ + లెక్కింపు</b><span class="st">${stt}</span><small>${o.total ? `${nf(o.done)} / ${nf(o.total)} పంచాయతీలు` : p.gps ? `${nf(p.gps)} పంచాయతీలు · ఫలితాలు పోలింగ్ రోజున` : "గ్రామాల జాబితా నోటిఫికేషన్ తర్వాత"}</small>${o.total ? `<div class="bar"><i style="width:${(o.done / o.total) * 100}%"></i></div>` : ""}</div>`;
    }).join("");
    const any = PH.some((p) => isLive(p.date)) || DEMO && D.gp.some((g) => g[4]);
    $("#plLive").classList.toggle("on", any); $("#plLiveT").textContent = any ? "LIVE" : "SOON";
  }
  function controls() {
    $("#plPhaseSeg").innerHTML = [[0, "అన్ని దశలు"], [1, "దశ 1"], [2, "దశ 2"], [3, "దశ 3"]].map(([v, l]) => `<button type="button" data-p="${v}" aria-pressed="${st.phase === v}">${l}</button>`).join("");
    $("#plPartySeg").innerHTML = [["", "అన్నీ"], ["K", "కూటమి"], ["Y", "వైసీపీ"], ["O", "ఇతరులు"], ["P", "ఎదురుచూపు"]].map(([v, l]) => `<button type="button" data-s="${v}" aria-pressed="${st.side === v}">${l}</button>`).join("");
    $("#plLegend").innerHTML = ["K", "Y", "O"].map((k) => `<span style="--c:${COL[k]}"><i></i>${SIDE[k]}</span>`).join("") + `<span style="--c:${PEND}"><i></i>ఎదురుచూపు · awaiting</span>`;
  }
  function table() {
    const rows = DISTS.map((d) => { const o = tally(D.gp.filter((g) => g[0] === d.id && inPhase(g))); return `<tr data-d="${d.id}"><td>${esc(d.te)}</td><td>${o.total ? nf(o.total) : "—"}</td><td>${nf(o.done)}</td><td class="${o.K ? "" : "z"}" style="color:var(--K)">${nf(o.K)}</td><td class="${o.Y ? "" : "z"}" style="color:var(--Y)">${nf(o.Y)}</td><td class="${o.O ? "" : "z"}" style="color:var(--O)">${nf(o.O)}</td></tr>`; }).join("");
    $("#plTbl").innerHTML = `<thead><tr><th>జిల్లా</th><th>మొత్తం</th><th>తేలినవి</th><th style="color:var(--K)">కూటమి</th><th style="color:var(--Y)">వైసీపీ</th><th style="color:var(--O)">ఇతరులు</th></tr></thead><tbody>${rows}</tbody>`;
  }
  function latest() {
    const L = D.gp.map((g, i) => [g, i]).filter(([g]) => g[4]).sort((a, b) => (b[0][8] || 0) - (a[0][8] || 0)).slice(0, 12);
    $("#plLatest").innerHTML = L.length ? L.map(([g, i]) => `<li data-i="${i}" style="--c:${COL[g[4]]}"><i></i><span><b>${esc(g[2])}</b><small>${esc(mName(g[0], g[1]))} · ${esc(dTe[g[0]] || "")} · ${esc(g[5] || SIDE[g[4]])}</small></span></li>`).join("") : `<li class="e">ఫలితాలు రాగానే ఇక్కడ కనిపిస్తాయి · Newly declared panchayats appear here.</li>`;
  }
  function empty() {
    const el = $("#plEmpty"), n = D.gp.length; el.hidden = !!n; if (n) return;
    const ms = left(PH[0].date), d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5);
    el.innerHTML = `<b>${ms > 0 ? `మొదటి దశ పోలింగ్ ${d} రోజులు ${h} గంటల్లో` : "ఫలితాల కోసం ఎదురుచూస్తున్నాం"}</b> — గ్రామ పంచాయతీల జాబితా ప్రతి దశ నోటిఫికేషన్‌తో (13, 16, 19 నవంబర్) వస్తుంది. ఆ తర్వాత ఇక్కడ ప్రతి గ్రామానికి ఒక చతురస్రం కనిపిస్తుంది; ఫలితం రాగానే అది వెలుగుతుంది.<small>The village directory arrives with the SEC notifications (13, 16 and 19 Nov); each village then appears here as a tile and lights up when its result is declared.</small>`;
  }
  function build() {
    const w = $("#plWall"); w.innerHTML = "";
    groups.forEach((g, gi) => {
      const el = document.createElement("div"); el.className = "pl-d"; el.id = "pd-" + g.d.id;
      el.innerHTML = `<h3><span>${esc(g.d.te)}</span><small></small></h3><canvas></canvas>`;
      const c = el.querySelector("canvas"), dpr = Math.min(2, devicePixelRatio || 1), W = g.cols * (T + G), H = g.rows * (T + G);
      c.width = W * dpr; c.height = H * dpr; c.style.width = W + "px"; c.style.height = H + "px"; g.c = c; g.dpr = dpr; g.h3 = el.querySelector("small");
      const at = (e) => { const b = c.getBoundingClientRect(), col = Math.floor((e.clientX - b.left) / (T + G)), row = Math.floor((e.clientY - b.top) / (T + G)); return col < g.cols && row >= 0 ? g.idx[row * g.cols + col] : undefined; };
      c.addEventListener("pointermove", (e) => { if (e.pointerType === "touch") return; const i = at(e); tip(i, e); });
      c.addEventListener("pointerleave", () => ($("#plTip").hidden = true));
      c.addEventListener("click", (e) => { const i = at(e); if (i !== undefined) select(i); });
      el.querySelector("h3").addEventListener("click", () => focusD(g.d.id));
      w.appendChild(el);
    });
  }
  function paint() {
    const q = st.q.trim().toLowerCase();
    groups.forEach((g) => {
      const x = g.c.getContext("2d"), s = T + G; x.setTransform(g.dpr, 0, 0, g.dpr, 0, 0); x.clearRect(0, 0, g.c.width, g.c.height);
      let done = 0;
      g.idx.forEach((i, k) => { const r = D.gp[i], cx = (k % g.cols) * s, cy = Math.floor(k / g.cols) * s, on = visible(r); if (r[4] && inPhase(r)) done++;
        x.globalAlpha = on ? 1 : 0.16; x.fillStyle = r[4] ? COL[r[4]] : PEND; x.fillRect(cx, cy, T, T);
        if (q && q.length > 1 && hay(r).includes(q)) { x.globalAlpha = 1; x.strokeStyle = "#111827"; x.lineWidth = 1.5; x.strokeRect(cx - 0.5, cy - 0.5, T + 1, T + 1); }
        if (st.sel === i) { x.globalAlpha = 1; x.strokeStyle = "#111827"; x.lineWidth = 2; x.strokeRect(cx - 1, cy - 1, T + 2, T + 2); } });
      const tot = g.idx.filter((i) => inPhase(D.gp[i])).length; g.h3.textContent = `${done}/${tot}`; g.c.parentNode.style.opacity = tot ? 1 : 0.25;
    });
  }
  function tip(i, e) { const t = $("#plTip"); if (i === undefined) { t.hidden = true; return; } const r = D.gp[i]; t.hidden = false; t.style.left = Math.min(innerWidth - 250, e.clientX + 14) + "px"; t.style.top = e.clientY + 16 + "px"; t.innerHTML = `${esc(nm(r))}<small>${esc(mName(r[0], r[1]))} · ${r[4] ? esc(SIDE[r[4]]) : "ఎదురుచూపు"}</small>${r[5] ? `<small><b>${esc(r[5])}</b></small>` : ""}`; }
  function select(i) {
    st.sel = i; const r = D.gp[i], ph = PH[r[3] - 1], c = $("#plCard"); c.hidden = false;
    c.innerHTML = `<button type="button" aria-label="Close" id="plCardX">×</button><h4>${esc(nm(r))}</h4><p class="sub">${esc(mName(r[0], r[1]))} మండలం · ${esc(dTe[r[0]] || "")}${r[3] ? ` · దశ ${r[3]} (${ph?.te || ""})` : ""}</p>
      ${r[4] ? `<div class="res" style="--c:${COL[r[4]]}"><b>${esc(r[5] || "సర్పంచ్")}</b><small>${SIDE[r[4]]}${r[6] ? ` · మెజారిటీ ${nf(r[6])}` : ""}${r[7] === "lead" ? " · ముందంజ" : ""}${r[7] === "unopposed" ? " · ఏకగ్రీవం" : ""}${r[7] === "reported" ? " · ఫాలోవర్ నివేదిక (అడ్మిన్ ఆమోదం)" : ""}</small></div>` : `<div class="res" style="--c:${PEND}"><b>ఫలితం ఇంకా రాలేదు</b><small>${ph ? `${ph.te}న లెక్కింపు` : ""}</small></div>`}`;
    paint();
  }
  function focusD(id) { const el = $("#pd-" + id); if (!el) return; el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1400); }
  function hits() {
    const q = st.q.trim().toLowerCase(), el = $("#plHits"); if (q.length < 2) { el.hidden = true; return; }
    const L = D.gp.map((g, i) => [g, i]).filter(([g]) => hay(g).includes(q)).slice(0, 10); el.hidden = false;
    el.innerHTML = L.length ? L.map(([g, i]) => `<button type="button" data-i="${i}"><span>${esc(nm(g))}</span><small>${esc(mName(g[0], g[1]))} · ${esc(dTe[g[0]] || "")} · ${g[4] ? SIDE[g[4]] + (g[5] ? " · " + esc(g[5]) : "") : "ఎదురుచూపు"}</small></button>`).join("") : `<button type="button" disabled><span>ఏదీ దొరకలేదు · No match</span></button>`;
  }
  // ---------- district -> mandal -> panchayat drill-down ----------
  function distView() {
    const by = {}; D.gp.forEach((g) => { if (inPhase(g)) ((by[g[0]] ||= {})[g[1]] ||= []).push(g); });
    const chips = (o) => `<span class="pl-chips"><b>${nf(o.done)}/${nf(o.total)}</b><i style="color:${COL.K}">${nf(o.K)}</i><i style="color:${COL.Y}">${nf(o.Y)}</i><i style="color:${COL.O}">${nf(o.O)}</i></span>`;
    $("#plDist").innerHTML = DISTS.filter((d) => by[d.id]).sort((a, b) => tally(Object.values(by[b.id]).flat()).done - tally(Object.values(by[a.id]).flat()).done || a.te.localeCompare(b.te, "te")).map((d) => {
      const ms = Object.entries(by[d.id]).sort((a, b) => mName(d.id, a[0]).localeCompare(mName(d.id, b[0]), "te")), all = ms.flatMap(([, r]) => r), dk = d.id, dopen = st.open.has(dk);
      const inner = dopen ? ms.map(([m, rows]) => {
        const mk = d.id + "/" + m, mopen = st.open.has(mk), list = mopen ? [...rows].sort((a, b) => (!!b[4] - !!a[4]) || nm(a).localeCompare(nm(b), "te")) : [];
        return `<details data-k="${esc(mk)}" ${mopen ? "open" : ""}><summary><span>${esc(mName(d.id, m))}</span>${chips(tally(rows))}</summary>${mopen ? `<div class="pl-tablewrap"><table class="pl-tbl pl-ltbl pl-dt"><thead><tr><th class="l">పంచాయతీ</th><th class="l">సర్పంచ్</th><th class="l">పక్షం</th><th>మెజారిటీ</th></tr></thead><tbody>${list.map((g) => `<tr><td class="l">${esc(nm(g))}</td><td class="l n">${g[4] ? esc(g[5]) || "<em>పేరు త్వరలో</em>" : "—"}</td><td class="l" style="${g[4] ? `color:${COL[g[4]]};font-weight:700` : "color:var(--mut)"}">${g[4] ? esc(sl(g)) : "ఎదురుచూపు"}</td><td>${!g[4] ? "" : g[7] === "unopposed" ? "ఏకగ్రీవం" : g[7] === "reported" ? (g[6] ? nf(g[6]) : "—") + `<small class="fr">ఫాలోవర్ నివేదిక</small>` : g[6] ? nf(g[6]) : g[7] === "lead" ? "ముందంజ" : "—"}</td></tr>`).join("")}</tbody></table></div>` : ""}</details>`;
      }).join("") : "";
      return `<details class="pl-dd" data-k="${esc(dk)}" ${dopen ? "open" : ""}><summary><span>${esc(d.te)} <small>${esc(d.name)}</small></span>${chips(tally(all))}</summary>${inner}</details>`;
    }).join("");
  }
  // ---------- sarpanch names: every declared panchayat with its winner ----------
  const PT = { TDP: "టీడీపీ", JSP: "జనసేన", BJP: "బీజేపీ", YSRCP: "వైసీపీ", INC: "కాంగ్రెస్", INDEPENDENT: "స్వతంత్రులు" };
  // side plus the party of the winner, e.g. "కూటమి · టీడీపీ"; the alliance (కూటమి) is TDP + Janasena + BJP
  const sl = (g) => SIDE[g[4]].split(" ")[0] + (g[10] && g[4] !== "Y" ? " · " + (PT[g[10]] || g[10]) : "");
  function listView() {
    const q = st.lq.trim().toLowerCase(), done = D.gp.filter((g) => g[4] && inPhase(g) && (!st.side || g[4] === st.side)).sort((a, b) => (b[8] || 0) - (a[8] || 0));
    // a search looks through every panchayat (declared or not, any phase); without one the list is the declared results, newest first
    const all = q ? D.gp.filter((g) => `${g[2]} ${g[9] || ""} ${g[5] || ""} ${mName(g[0], g[1])} ${dTe[g[0]] || ""}`.toLowerCase().includes(q)).sort((a, b) => !!b[4] - !!a[4] || nm(a).localeCompare(nm(b), "te")) : done;
    const L = all, show = L.slice(0, st.lim);
    $("#plLSide").innerHTML = [["", "అన్నీ"], ["K", "కూటమి"], ["Y", "వైసీపీ"], ["O", "ఇతరులు"]].map(([v, l]) => `<button type="button" data-s="${v}" aria-pressed="${st.side === v}">${l}</button>`).join("");
    $("#plLCount").textContent = q ? `${nf(L.length)} పంచాయతీలు దొరికాయి · ${nf(L.filter((g) => g[4]).length)} ఫలితాలు వచ్చాయి` : `${nf(L.length)} ప్రకటించిన ఫలితాలు · declared`;
    $("#plLTbl").innerHTML = `<thead><tr><th class="l">సర్పంచ్ · Sarpanch</th><th class="l">పంచాయతీ</th><th class="l">మండలం · జిల్లా</th><th class="l">పక్షం</th><th>మెజారిటీ</th></tr></thead><tbody>${show.length ? show.map((g) => `<tr><td class="l n">${g[4] ? esc(g[5]) || "<em>పేరు త్వరలో</em>" : "—"}</td><td class="l">${esc(nm(g))}</td><td class="l">${esc(mName(g[0], g[1]))} · ${esc(dTe[g[0]] || "")}</td><td class="l" style="${g[4] ? `color:${COL[g[4]]};font-weight:700` : "color:var(--mut)"}">${g[4] ? esc(sl(g)) : `ఎదురుచూపు${g[3] ? ` · దశ ${g[3]} (${PH[g[3] - 1].te})` : ""}`}</td><td>${!g[4] ? "" : g[7] === "unopposed" ? "ఏకగ్రీవం" : g[7] === "reported" ? (g[6] ? nf(g[6]) : "—") + `<small class="fr">ఫాలోవర్ నివేదిక</small>` : g[6] ? nf(g[6]) : g[7] === "lead" ? "ముందంజ" : "—"}</td></tr>`).join("") : `<tr><td class="l" colspan="5">${q ? "ఏదీ దొరకలేదు — స్పెల్లింగ్ చెక్ చేయండి · No match" : "ఇంకా ఫలితాలు లేవు · No results yet."}</td></tr>`}</tbody>`;
    $("#plLMore").hidden = L.length <= st.lim;
  }
  function render() { window.PLM?.draw(); $("#plHPh").textContent = st.phase ? "- Phase " + st.phase : ""; controls(); score(); phases(); table(); latest(); $("#plWallView").hidden = st.view !== "wall"; $("#plDistView").hidden = st.view !== "dist"; if (st.view === "dist") distView(); $("#plListView").hidden = st.view !== "list"; $("#plGraphView").hidden = st.view !== "graphs"; if (st.view === "list") listView(); document.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.view === st.view)); if (st.view === "graphs") window.PLG?.render(); }
  function setData(d) { D = d; render(); }

  document.addEventListener("input", (e) => { if (e.target.id === "plLQ") { st.lq = e.target.value; st.lim = 100; if (st.view !== "list") { st.view = "list"; render(); } else listView(); } });
  document.addEventListener("toggle", (e) => { const k = e.target.dataset?.k; if (!k || !e.target.closest("#plDist")) return; if (e.target.open === st.open.has(k)) return; e.target.open ? st.open.add(k) : st.open.delete(k); distView(); }, true);
  document.addEventListener("click", (e) => {
    if (e.target.id === "plLMore") { st.lim += 200; listView(); }
    const vw = e.target.closest("[data-view]"); if (vw) { st.view = vw.dataset.view; render(); }
    const p = e.target.closest("[data-p]"); if (p) { st.phase = +p.dataset.p; render(); }
    const s = e.target.closest("[data-s]"); if (s) { st.side = s.dataset.s; render(); }
    const row = e.target.closest("#plTbl tr[data-d]"); if (row) focusD(row.dataset.d);
    const li = e.target.closest("[data-i]"); if (li) { select(+li.dataset.i); const g = D.gp[+li.dataset.i]; focusD(g[0]); }
    if (e.target.id === "plCardX") { $("#plCard").hidden = true; st.sel = null; paint(); }
  });
  $("#plQ").addEventListener("input", (e) => { st.q = e.target.value; hits(); paint(); });
  async function pull() { try { const r = await fetch(`live/gp.json?t=${Math.floor(Date.now() / 15000)}`, { cache: "no-store" }); if (!r.ok) throw 0; const j = await r.json(); if (Array.isArray(j.gp)) setData(j); } catch {} }
  function openDist(id) { st.open.add(id); st.view = "dist"; render(); setTimeout(() => $(`#plDist details[data-k="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }
  window.PL = { openDist, data: () => D, st, DISTS, PH, COL, PEND, SIDE, nf, esc, mName, inPhase, tally, select, focusD, setView: (v) => { st.view = v; render(); } };
  setData({ gp: [], updated: null });
  if (DEMO) {
    const bar = document.createElement("div"); bar.className = "pl-demo"; bar.innerHTML = `SIMULATED DATA · localhost only <input type="range" min="0" max="100" value="45" id="plDemoP" /> <span id="plDemoV">45%</span>`; document.body.appendChild(bar);
    const go = () => { const p = +$("#plDemoP").value; $("#plDemoV").textContent = p + "%"; setData(demo(p)); }; $("#plDemoP").addEventListener("input", go); go();
  } else { pull(); setInterval(pull, 15000); }
  setInterval(() => { phases(); empty(); }, 30000);
})();
