// Panchayat Samaram: share card (image) + caption for WhatsApp / X. Scope: whole state, one phase, or one district.
// window.PSH.draw(canvas, gp, scope) is pure (used by the page and for making the ready-made image files).
(() => {
  const ZP = window.AP_ZP, SIDE = { K: "కూటమి మద్దతు", Y: "వైసీపీ మద్దతు", O: "ఇతరులు" }, COL = { K: "#d4a000", Y: "#1d5fc4", O: "#8a63d2" };
  const PH = [null, ["26 నవంబర్", "26 Nov"], ["29 నవంబర్", "29 Nov"], ["2 డిసెంబర్", "2 Dec"]];
  const nf = (n) => Number(n || 0).toLocaleString("en-IN");
  const dName = Object.fromEntries(ZP.districts.map(([id, en, te]) => [id, { en, te }]));
  const mName = (d, m) => ({ "polavaram/x-nellipaka": "నెల్లిపాక", "krishna/x-machilipatnamrural": "మచిలీపట్నం (గ్రామీణ)" })[`${d}/${m}`] || ZP.te?.[`${d}/${m}`] || ((ZP.mandals[d] || []).find((x) => x[0] === m) || [])[1] || m;
  const tally = (rows) => { const o = { total: rows.length, done: 0, K: 0, Y: 0, O: 0 }; for (const g of rows) if (g[4]) { o.done++; o[g[4]]++; } return o; };
  const pick = (gp, sc) => gp.filter((g) => (!sc.phase || g[3] === sc.phase) && (!sc.district || g[0] === sc.district));
  const scopeName = (sc) => (sc.district ? dName[sc.district].te : "ఆంధ్రప్రదేశ్") + (sc.phase ? ` · దశ ${sc.phase} (${PH[sc.phase][0]})` : sc.district ? "" : " · అన్ని దశలు");

  function breakdown(gp, sc) {
    const rows = pick(gp, sc), by = {};
    for (const g of rows) { const k = sc.district ? g[1] : g[0]; (by[k] ||= []).push(g); }
    return Object.entries(by).map(([k, r]) => ({ name: sc.district ? mName(sc.district, k) : dName[k]?.te || k, ...tally(r) })).sort((a, b) => b.done - a.done || b.total - a.total || a.name.localeCompare(b.name, "te"));
  }

  async function draw(cv, gp, sc = {}) {
    const W = 1080, H = 1350, c = cv.getContext("2d"); cv.width = W; cv.height = H;
    try { await Promise.all(['800 90px "Anek Telugu"', '700 30px "Anek Telugu"', '800 90px "Inter Tight"', '600 30px "Inter Tight"'].map((f) => document.fonts.load(f, "అ A1"))); } catch {}
    const T = (s, x, y, f, col, al = "left") => { c.font = f; c.fillStyle = col; c.textAlign = al; c.fillText(String(s), x, y); };
    const rr = (x, y, w, h, r, fill) => { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill(); };
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, "#fff4cc"); g.addColorStop(1, "#ffffff"); c.fillStyle = g; c.fillRect(0, 0, W, 360);
    // brand
    try { const img = new Image(); img.src = "assets/brand/apresults-icon.svg"; await img.decode(); rr(60, 52, 76, 76, 18, "#ffffff"); c.save(); c.shadowColor = "rgba(0,0,0,.12)"; c.shadowBlur = 12; rr(60, 52, 76, 76, 18, "#fff"); c.restore(); c.drawImage(img, 70, 62, 56, 56); } catch {}
    T("AP·results", 152, 92, '800 38px "Inter Tight"', "#111827"); T("ఎన్నికల ఫలితాలు", 152, 124, '700 24px "Anek Telugu"', "#b97800");
    T("గ్రామ పంచాయతీ ఎన్నికలు 2026", W - 60, 100, '700 28px "Anek Telugu"', "#667085", "right");
    T("పంచాయతీ సమరం", 60, 250, '800 106px "Anek Telugu"', "#111827");
    T(scopeName(sc), 60, 318, '700 40px "Anek Telugu"', "#b97800");
    // big number
    const rows = pick(gp, sc), t = tally(rows);
    T(nf(t.done), 60, 520, '800 190px "Inter Tight"', "#111827");
    const nw = (c.measureText(nf(t.done)).width || 300);
    T(`/ ${nf(t.total)}`, 60 + nw + 22, 520, '700 56px "Inter Tight"', "#98a2b3"); T("పంచాయతీల సర్పంచ్ ఫలితాలు ప్రకటించారు", 64, 574, '700 34px "Anek Telugu"', "#344054");
    rr(60, 600, W - 120, 16, 8, "#eceef3"); if (t.total) rr(60, 600, Math.max(16, (W - 120) * (t.done / t.total)), 16, 8, "#111827");
    // sides
    const bw = (W - 120 - 40) / 3;
    ["K", "Y", "O"].forEach((k, i) => { const x = 60 + i * (bw + 20); rr(x, 650, bw, 190, 24, "#f7f8fa"); rr(x, 650, 10, 190, 5, COL[k]); T(nf(t[k]), x + 34, 748, '800 84px "Inter Tight"', COL[k]); T(SIDE[k], x + 34, 796, '700 29px "Anek Telugu"', "#344054"); T(t.done ? Math.round((t[k] / t.done) * 100) + "% ప్రకటించిన వాటిలో" : "—", x + 34, 826, '600 22px "Inter Tight"', "#98a2b3"); });
    // table
    const B = breakdown(gp, sc).slice(0, 7), y0 = 872;
    T(sc.district ? "మండలం" : "జిల్లా", 70, y0 + 32, '700 24px "Anek Telugu"', "#667085"); T("ప్రకటించినవి", 560, y0 + 32, '700 24px "Anek Telugu"', "#667085", "right");
    ["K", "Y", "O"].forEach((k, i) => T(SIDE[k].split(" ")[0], 700 + i * 150 + 40, y0 + 32, '700 24px "Anek Telugu"', COL[k], "right"));
    B.forEach((r, i) => { const y = y0 + 50 + i * 48; if (i % 2 === 0) rr(60, y, W - 120, 46, 10, "#f7f8fa"); T(r.name, 76, y + 32, '700 29px "Anek Telugu"', "#111827"); T(`${nf(r.done)} / ${nf(r.total)}`, 560, y + 32, '700 27px "Inter Tight"', "#344054", "right"); ["K", "Y", "O"].forEach((k, j) => T(nf(r[k]), 700 + j * 150 + 40, y + 32, '800 28px "Inter Tight"', r[k] ? COL[k] : "#c4c8d2", "right")); });
    // footer
    rr(0, 1262, W, 88, 0, "#111827");
    T("apelectionresults.com/panchayat.html", 60, 1318, '600 30px "Inter Tight"', "#ffffff"); T("పేర్లు త్వరలో · సంఖ్యలు నిజమైనవి", W - 60, 1318, '700 26px "Anek Telugu"', "#f5c400", "right");
  }

  function caption(gp, sc) {
    const rows = pick(gp, sc), t = tally(rows), P = [1, 2, 3].map((p) => [p, tally(gp.filter((g) => g[3] === p))]), top = breakdown(gp, sc).filter((r) => r.done).slice(0, 5);
    const place = scopeName(sc), url = "https://apelectionresults.com/panchayat.html";
    const lines = [`🗳️ పంచాయతీ సమరం 2026 · ${place}`, `ఇప్పటివరకు ${nf(t.done)} / ${nf(t.total)} పంచాయతీల సర్పంచ్ ఫలితాలు`, "", `🟡 కూటమి మద్దతు: ${nf(t.K)}`, `🔵 వైసీపీ మద్దతు: ${nf(t.Y)}`, `🟣 ఇతరులు: ${nf(t.O)}`];
    if (!sc.phase && !sc.district) lines.push("", ...P.map(([p, o]) => `దశ ${p} (${PH[p][0]}): ${nf(o.done)} / ${nf(o.total)}`));
    if (top.length) lines.push("", (sc.district ? "మండలాల వారీ: " : "జిల్లాల వారీ: ") + top.map((r) => `${r.name} ${nf(r.done)}`).join(" · "));
    lines.push("", "సర్పంచ్ పేర్లు అందగానే అప్‌డేట్ చేస్తాం — సంఖ్యలు నిజమైనవి.", `జిల్లా · మండలం · పంచాయతీ వారీగా అన్ని ఫలితాలు 👇`, url, "", "#PanchayatSamaram #APPanchayatElections #Andhrapradesh");
    const x = `🗳️ పంచాయతీ సమరం 2026 · ${place}\n${nf(t.done)}/${nf(t.total)} ఫలితాలు: కూటమి మద్దతు ${nf(t.K)} · వైసీపీ ${nf(t.Y)} · ఇతరులు ${nf(t.O)}\n${url}\n#PanchayatSamaram #APPanchayatElections`;
    return { wa: lines.join("\n"), x };
  }

  // ---------- district map card ----------
  const PHC = { 1: "#0f9d8a", 2: "#f08c1a", 3: "#d6457a" }, PEND = "#e9ecf2";
  let MAPD = null; const mapData = () => (MAPD ||= fetch("data/ap-map.json?v=20261126160000").then((r) => r.json()));
  const MODES = { lead: "ఆధిక్యం", bubbles: "వృత్తాలు", progress: "పురోగతి", phases: "దశలు" };
  async function drawMap(cv, gp, sc, mode) {
    const M = await mapData(), W = 1080, H = 1350, c = cv.getContext("2d"); cv.width = W; cv.height = H;
    try { await Promise.all(['800 90px "Anek Telugu"', '700 30px "Anek Telugu"', '800 90px "Inter Tight"'].map((f) => document.fonts.load(f, "అ A1"))); } catch {}
    const T = (s, x, y, f, col, al = "left", halo) => { c.font = f; c.textAlign = al; if (halo) { c.lineWidth = 5; c.strokeStyle = halo; c.lineJoin = "round"; c.strokeText(String(s), x, y); } c.fillStyle = col; c.fillText(String(s), x, y); };
    const rr = (x, y, w, h, r, fill) => { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill(); };
    c.fillStyle = "#fff"; c.fillRect(0, 0, W, H); const gr = c.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, "#fff4cc"); gr.addColorStop(1, "#fff"); c.fillStyle = gr; c.fillRect(0, 0, W, 300);
    try { const img = new Image(); img.src = "assets/brand/apresults-icon.svg"; await img.decode(); c.save(); c.shadowColor = "rgba(0,0,0,.12)"; c.shadowBlur = 12; rr(60, 44, 70, 70, 16, "#fff"); c.restore(); c.drawImage(img, 69, 53, 52, 52); } catch {}
    T("AP·results", 146, 82, '800 34px "Inter Tight"', "#111827"); T("ఎన్నికల ఫలితాలు", 146, 110, '700 22px "Anek Telugu"', "#b97800"); T("జిల్లాల మ్యాప్ · " + MODES[mode], W - 60, 92, '700 26px "Anek Telugu"', "#667085", "right");
    T("పంచాయతీ సమరం", 60, 206, '800 92px "Anek Telugu"', "#111827"); T(scopeName({ phase: sc.phase }), 60, 262, '700 36px "Anek Telugu"', "#b97800");
    const rows = pick(gp, { phase: sc.phase }), t = tally(rows), bw = (W - 120 - 40) / 3;
    ["K", "Y", "O"].forEach((k, i) => { const x = 60 + i * (bw + 20); rr(x, 306, bw, 92, 20, "#f7f8fa"); rr(x, 306, 8, 92, 4, COL[k]); T(nf(t[k]), x + 26, 372, '800 58px "Inter Tight"', COL[k]); T(SIDE[k].split(" ")[0], x + 26 + c.measureText(nf(t[k])).width + 14, 372, '700 26px "Anek Telugu"', "#344054"); });
    T(`${nf(t.done)} / ${nf(t.total)} ప్రకటించారు` + ({ lead: " · ముదురు రంగు = ఎక్కువ ఆధిక్యం · సంఖ్య = ప్రకటించినవి", bubbles: " · వృత్తం పరిమాణం = ప్రకటించిన ఫలితాలు", progress: " · % = ప్రకటించిన పంచాయతీలు", phases: " · వృత్తం = దశల వారీ పంచాయతీలు" })[mode], W / 2, 428, '700 23px "Anek Telugu"', "#344054", "center");
    const [vw, vh] = M.vb, s = Math.min(1000 / vw, 780 / vh), ox = (W - vw * s) / 2, oy = 446;
    const by = {}; for (const g of rows) (by[g[0]] ||= []).push(g);
    const info = ZP.districts.map(([id, , te]) => { const r = by[id] || [], o = tally(r); return { id, te, o, ph: [1, 2, 3].map((n) => r.filter((g) => g[3] === n).length), g: M.d[id] }; }).filter((x) => x.g);
    const lead = (o) => (o.done ? ["K", "Y", "O"].sort((a, b) => o[b] - o[a])[0] : "");
    c.save(); c.translate(ox, oy); c.scale(s, s);
    for (const x of info) { let fill = PEND, a = 1; if (mode === "lead" && x.o.done) { const k = lead(x.o); fill = COL[k]; a = 0.4 + 0.6 * (x.o[k] / x.o.done); } else if (mode === "progress") { fill = "#d4a000"; a = x.o.total ? 0.1 + 0.9 * (x.o.done / x.o.total) : 0.1; } else if (mode !== "lead") fill = "#eef0f5"; const pth = new Path2D(x.g.p); c.globalAlpha = a; c.fillStyle = fill; c.fill(pth, "evenodd"); c.globalAlpha = 1; c.lineWidth = 1.6; c.strokeStyle = "#fff"; c.stroke(pth); }
    const donut = (cx, cy, r, parts) => { const tot = parts.reduce((n, [, v]) => n + v, 0); if (!tot) return; c.beginPath(); c.arc(cx, cy, r + 2.5, 0, Math.PI * 2); c.fillStyle = "rgba(255,255,255,.92)"; c.fill(); let a0 = -Math.PI / 2; for (const [col, v] of parts) { if (!v) continue; const a1 = a0 + (v / tot) * Math.PI * 2; c.beginPath(); c.arc(cx, cy, r, a0, a1); c.arc(cx, cy, r * 0.58, a1, a0, true); c.closePath(); c.fillStyle = col; c.fill(); a0 = a1; } };
    const maxo = 1;
    for (const x of info) { const [cx, cy] = x.g.c, dark = (mode === "lead" || mode === "progress") && x.o.done && (mode === "progress" ? x.o.done / x.o.total > 0.45 : true);
      if (mode === "bubbles" && x.o.done) { const r = Math.min(40, 9 + Math.sqrt(x.o.done) * 3.4); donut(cx, cy, r, [[COL.K, x.o.K], [COL.Y, x.o.Y], [COL.O, x.o.O]]); c.font = '800 15px "Inter Tight"'; c.textAlign = "center"; c.fillStyle = "#111827"; c.fillText(nf(x.o.done), cx, cy + 5); }
      else if (mode === "phases" && x.o.total) { const r = Math.min(36, 8 + Math.sqrt(x.o.total) * 1.15); donut(cx, cy, r, x.ph.map((v, i) => [PHC[i + 1], v])); }
      else if (mode === "lead" || mode === "progress") { const txt = mode === "progress" && x.o.total ? Math.round((x.o.done / x.o.total) * 100) + "%" : nf(x.o.done); T(txt, cx, cy + 5, '800 17px "Inter Tight"', dark ? "#fff" : "#111827", "center", dark ? "rgba(0,0,0,.35)" : "rgba(255,255,255,.85)"); }
      const ly = cy + (mode === "bubbles" || mode === "phases" ? Math.min(52, 30 + Math.sqrt(x.o.done || x.o.total) * 1.2) : 19);
      T(x.te, cx, ly, '700 11.5px "Anek Telugu"', dark ? "#fff" : "#344054", "center", dark ? "rgba(0,0,0,.4)" : "rgba(255,255,255,.9)"); }
    c.restore();
    const leg = mode === "phases" ? [1, 2, 3].map((n) => [PHC[n], `దశ ${n} · ${PH[n][0]}`]) : mode === "progress" ? [["#d4a000", "ముదురు = ఎక్కువ శాతం ప్రకటించారు"]] : [["K", SIDE.K], ["Y", SIDE.Y], ["O", SIDE.O]].map(([k, l]) => [COL[k], l]);
    let lx = 60; for (const [col, l] of leg) { rr(lx, 1224, 20, 20, 6, col); c.font = '700 23px "Anek Telugu"'; T(l, lx + 30, 1243, '700 23px "Anek Telugu"', "#344054"); lx += 30 + c.measureText(l).width + 26; }
    rr(0, 1262, W, 88, 0, "#111827"); T("apelectionresults.com/panchayat.html", 60, 1318, '600 30px "Inter Tight"', "#fff"); T("పేర్లు త్వరలో · సంఖ్యలు నిజమైనవి", W - 60, 1318, '700 26px "Anek Telugu"', "#f5c400", "right");
  }
  window.PSH = { draw, drawMap, caption, pick, tally };


  // ---------- page UI ----------
  if (!document.getElementById("plLive")) return;
  const $ = (s, r = document) => r.querySelector(s), sc = { phase: 0, district: "", kind: "table" };
  const btn = document.createElement("button"); btn.type = "button"; btn.className = "pl-sharebtn"; btn.innerHTML = "షేర్ <small>Share</small>"; $(".pl-top").appendChild(btn);
  const dlg = document.createElement("dialog"); dlg.className = "pl-dlg";
  dlg.innerHTML = `<form method="dialog"><button class="x" aria-label="Close">×</button></form><h3>ఫలితాలను షేర్ చేయండి <small>Share the results</small></h3>
    <div class="pl-tools"><div class="pl-seg" id="shKind"></div></div><div class="pl-tools"><div class="pl-seg" id="shPh"></div><select id="shDist" aria-label="District"></select></div>
    <canvas id="shCv"></canvas><textarea id="shTx" rows="9" aria-label="Caption"></textarea>
    <div class="pl-shbtns"><button type="button" id="shNative">📤 షేర్ <small>Share</small></button><button type="button" id="shDl">⬇ ఇమేజ్ <small>Download</small></button><button type="button" id="shWa">WhatsApp</button><button type="button" id="shX">X</button><button type="button" id="shCp">📋 టెక్స్ట్ కాపీ</button></div><p class="pl-shnote" id="shNote"></p>`;
  document.body.appendChild(dlg);
  let cap = { wa: "", x: "" };
  async function refresh() {
    const gp = window.PL.data().gp;
    $("#shPh", dlg).innerHTML = [[0, "అన్ని దశలు"], [1, "దశ 1"], [2, "దశ 2"], [3, "దశ 3"]].map(([v, l]) => `<button type="button" data-p="${v}" aria-pressed="${sc.phase === v}">${l}</button>`).join("");
    $("#shKind", dlg).innerHTML = [["table", "పట్టిక"], ["lead", "మ్యాప్ · ఆధిక్యం"], ["bubbles", "మ్యాప్ · వృత్తాలు"], ["progress", "మ్యాప్ · పురోగతి"], ["phases", "మ్యాప్ · దశలు"]].map(([v, l]) => `<button type="button" data-k="${v}" aria-pressed="${sc.kind === v}">${l}</button>`).join("");
    $("#shDist", dlg).hidden = sc.kind !== "table";
    const sel = $("#shDist", dlg); if (!sel.options.length) sel.innerHTML = `<option value="">ఆంధ్రప్రదేశ్ (అన్ని జిల్లాలు)</option>` + ZP.districts.map(([id, , te]) => `<option value="${id}">${te}</option>`).join("");
    sel.value = sc.district; if (sc.kind === "table") await draw($("#shCv", dlg), gp, sc); else await drawMap($("#shCv", dlg), gp, sc, sc.kind); cap = caption(gp, sc.kind === "table" ? sc : { phase: sc.phase }); if (sc.kind !== "table") { cap.wa = cap.wa.replace("🗳️ పంచాయతీ సమరం 2026", "🗳️🗺️ పంచాయతీ సమరం 2026 · జిల్లాల మ్యాప్"); cap.x = cap.x.replace("🗳️ పంచాయతీ సమరం 2026", "🗳️🗺️ పంచాయతీ సమరం 2026 · జిల్లాల మ్యాప్"); } $("#shTx", dlg).value = cap.wa;
  }
  const blob = () => new Promise((r) => $("#shCv", dlg).toBlob(r, "image/png"));
  const note = (m) => { $("#shNote", dlg).textContent = m; };
  const open = (kind) => { sc.phase = window.PL.st.phase || 0; sc.kind = kind || "table"; dlg.showModal(); refresh(); };
  btn.onclick = () => open("table"); window.PSH.open = open;
  dlg.addEventListener("click", async (e) => {
    const p = e.target.closest("[data-p]"); if (p) { sc.phase = +p.dataset.p; return refresh(); }
    const kd = e.target.closest("[data-k]"); if (kd) { sc.kind = kd.dataset.k; return refresh(); }
    const id = e.target.closest("button")?.id, text = $("#shTx", dlg).value;
    if (id === "shDl") { const b = await blob(), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `panchayat-samaram${sc.kind !== "table" ? "-map-" + sc.kind : ""}${sc.district ? "-" + sc.district : ""}${sc.phase ? "-phase" + sc.phase : ""}.png`; a.click(); note("ఇమేజ్ డౌన్‌లోడ్ అయింది — దీన్ని పోస్ట్‌కు జోడించండి."); }
    if (id === "shNative") { const b = await blob(), f = new File([b], "panchayat-samaram.png", { type: "image/png" }), data = { files: [f], text }; if (navigator.canShare?.(data)) { try { await navigator.share(data); } catch {} } else note("ఈ బ్రౌజర్‌లో నేరుగా షేర్ కాదు — ఇమేజ్ డౌన్‌లోడ్ చేసి WhatsApp / X లో జోడించండి."); }
    if (id === "shWa") { window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener"); note("WhatsApp తెరుచుకుంది — ఇమేజ్‌ను విడిగా జోడించండి (లేదా పైన 'షేర్' వాడండి)."); }
    if (id === "shX") { window.open("https://x.com/intent/post?text=" + encodeURIComponent(cap.x), "_blank", "noopener"); note("X తెరుచుకుంది — డౌన్‌లోడ్ చేసిన ఇమేజ్‌ను జోడించండి."); }
    if (id === "shCp") { try { await navigator.clipboard.writeText(text); note("టెక్స్ట్ కాపీ అయింది."); } catch { $("#shTx", dlg).select(); } }
    if (e.target === dlg) dlg.close();
  });
  $("#shDist", dlg).addEventListener("change", (e) => { sc.district = e.target.value; refresh(); });
})();
