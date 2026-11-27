// Panchayat Samaram maps: the 28 districts on a real map of Andhra Pradesh (data/ap-map.json), coloured by the live Sarpanch results.
// Modes: Lead (who is ahead, by district), Bubbles (a donut per district), Progress (share declared), Phases (polling days). Tap a district to open its mandals.
(() => {
  const P = window.PL; if (!P) return;
  const { DISTS, COL, SIDE, nf, esc, tally, inPhase } = P, $ = (s) => document.querySelector(s), NS = "http://www.w3.org/2000/svg";
  const PHC = { 1: "#0f9d8a", 2: "#f08c1a", 3: "#d6457a" }, PEND = "#e9ecf2";
  let M = null, mode = "lead";
  fetch("data/ap-map.json?v=20261126160000").then((r) => r.json()).then((j) => { M = j; draw(); }).catch(() => {});
  const polar = (cx, cy, r, a) => [cx + r * Math.cos(a - Math.PI / 2), cy + r * Math.sin(a - Math.PI / 2)];
  function arc(cx, cy, r0, r1, a0, a1) { if (a1 - a0 >= Math.PI * 2 - 1e-4) a1 = a0 + Math.PI * 2 - 1e-4; const [x0, y0] = polar(cx, cy, r1, a0), [x1, y1] = polar(cx, cy, r1, a1), [x2, y2] = polar(cx, cy, r0, a1), [x3, y3] = polar(cx, cy, r0, a0), big = a1 - a0 > Math.PI ? 1 : 0; return `M${x0} ${y0}A${r1} ${r1} 0 ${big} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${big} 0 ${x3} ${y3}Z`; }
  const donut = (cx, cy, r, parts, hole = 0.58) => { const tot = parts.reduce((n, [, v]) => n + v, 0); if (!tot) return ""; let a = 0; return `<circle cx="${cx}" cy="${cy}" r="${r + 2.5}" fill="#fff" opacity=".92"/>` + parts.filter(([, v]) => v).map(([c, v]) => { const d = (v / tot) * Math.PI * 2, p = `<path d="${arc(cx, cy, r * hole, r, a, a + d)}" fill="${c}"/>`; a += d; return p; }).join(""); };
  const lead = (o) => (o.done ? ["K", "Y", "O"].sort((a, b) => o[b] - o[a])[0] : "");

  function draw() {
    const box = $("#plMap"); if (!box || !M) return;
    const D = P.data().gp, by = {}; for (const g of D) if (inPhase(g)) (by[g[0]] ||= []).push(g);
    const info = DISTS.map((d) => { const rows = by[d.id] || [], o = tally(rows), ph = [1, 2, 3].map((n) => rows.filter((g) => g[3] === n).length); return { d, o, ph, g: M.d[d.id] }; }).filter((x) => x.g);
    const maxDone = Math.max(1, ...info.map((x) => x.o.done)), [W, H] = M.vb, narrow = (box.clientWidth || 700) < 520, f = Math.min(2.1, Math.max(1, W / ((box.clientWidth || 700) - 20)));
    let paths = "", over = "";
    for (const { d, o, ph, g } of info) {
      let fill = PEND, op = 1;
      if (mode === "lead" && o.done) { const k = lead(o); fill = COL[k]; op = 0.4 + 0.6 * (o[k] / o.done); }
      if (mode === "progress") { fill = "#d4a000"; op = o.total ? 0.1 + 0.9 * (o.done / o.total) : 0.1; }
      if (mode === "bubbles" || mode === "phases") { fill = "#eef0f5"; }
      paths += `<path class="mp" data-d="${d.id}" d="${g.p}" fill="${fill}" fill-opacity="${op}" fill-rule="evenodd"/>`;
      const [cx, cy] = g.c, name = esc(d.te);
      if (mode === "bubbles" && o.done) over += `<g class="mo">${donut(cx, cy, Math.min(40, 9 + Math.sqrt(o.done) * 3.4), [[COL.K, o.K], [COL.Y, o.Y], [COL.O, o.O]])}<text x="${cx}" y="${cy + 4}" class="mn">${nf(o.done)}</text></g>`;
      else if (mode === "phases" && o.total) { const r = Math.min(36, 8 + Math.sqrt(o.total) * 1.15); over += `<g class="mo">${donut(cx, cy, r, ph.map((v, i) => [PHC[i + 1], v]))}</g>`; }
      else if (mode === "lead" || mode === "progress") over += `<text x="${cx}" y="${cy + 4}" class="mn ${op > 0.62 && fill !== PEND ? "mw" : ""}">${mode === "progress" && o.total ? Math.round((o.done / o.total) * 100) + "%" : nf(o.done)}</text>`;
      if (!narrow) over += `<text x="${cx}" y="${cy + (mode === "bubbles" || mode === "phases" ? Math.min(52, 30 + Math.sqrt(o.done || o.total) * 1.2) : 18)}" class="ml ${(mode === "lead" || mode === "progress") && op > 0.62 && fill !== PEND ? "mw" : ""}">${name}</text>`;
    }
    const legend = mode === "lead" ? [["K", SIDE.K], ["Y", SIDE.Y], ["O", SIDE.O]].map(([k, l]) => `<span><i style="background:${COL[k]}"></i>${l}</span>`).join("") + `<span><i style="background:${PEND}"></i>ఇంకా ఫలితాలు లేవు</span>` + `<small>ముదురు రంగు = ఎక్కువ ఆధిక్యం · సంఖ్య = ప్రకటించిన పంచాయతీలు</small>`
      : mode === "bubbles" ? [["K", SIDE.K], ["Y", SIDE.Y], ["O", SIDE.O]].map(([k, l]) => `<span><i style="background:${COL[k]}"></i>${l}</span>`).join("") + `<small>వృత్తం పరిమాణం = ప్రకటించిన ఫలితాల సంఖ్య</small>`
      : mode === "progress" ? `<span><i style="background:#d4a000"></i>ముదురు = ఎక్కువ శాతం ప్రకటించారు</span><small>% = ప్రకటించిన పంచాయతీలు / మొత్తం</small>`
      : [1, 2, 3].map((n) => `<span><i style="background:${PHC[n]}"></i>దశ ${n} · ${P.PH[n - 1].te}</span>`).join("") + `<small>వృత్తం = ఆ జిల్లాలో ఏ దశలో ఎన్ని పంచాయతీలు</small>`;
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="--f:${narrow ? f.toFixed(2) : 1}" role="img" aria-label="Andhra Pradesh district map">${paths}${over}</svg><div class="pl-maplegend">${legend}</div>`;
  }
  $("#plMapModes")?.addEventListener("click", (e) => { const b = e.target.closest("[data-m]"); if (!b) return; mode = b.dataset.m; document.querySelectorAll("#plMapModes [data-m]").forEach((x) => x.setAttribute("aria-pressed", x === b)); draw(); });
  const tipFor = (id) => { const x = DISTS.find((d) => d.id === id), rows = P.data().gp.filter((g) => g[0] === id && inPhase(g)), o = tally(rows); return `${esc(x.te)}<small>${nf(o.done)} / ${nf(o.total)} · కూటమి ${nf(o.K)} · వైసీపీ ${nf(o.Y)} · ఇతరులు ${nf(o.O)}</small>`; };
  const tip = $("#plTip");
  document.addEventListener("mousemove", (e) => { const p = e.target.closest?.("#plMap .mp"); if (!p) { if (tip.dataset.m) { tip.hidden = true; tip.dataset.m = ""; } return; } tip.dataset.m = 1; tip.hidden = false; tip.innerHTML = tipFor(p.dataset.d); tip.style.left = Math.min(innerWidth - 270, e.clientX + 14) + "px"; tip.style.top = e.clientY + 16 + "px"; });
  document.addEventListener("click", (e) => { const p = e.target.closest?.("#plMap .mp"); if (p) { const x = DISTS.find((d) => d.id === p.dataset.d), sel = $("#plMapSel"); sel.hidden = false; sel.innerHTML = `<b>${tipFor(p.dataset.d)}</b><button type="button" data-open="${x.id}">ఈ జిల్లా మండలాలు చూడండి →</button>`; } const b = e.target.closest?.("#plMapSel [data-open]"); if (b) P.openDist(b.dataset.open); });
  window.PLM = { draw, mode: () => mode };
  $("#plMapShare")?.addEventListener("click", () => window.PSH?.open(mode));
})();
