// Panchayat Wall, Graphs view: donut, phase bars, district map, district bars, timeline, margin histogram, mandal leaderboard.
// Reads the same data as the wall through window.PL and redraws whenever the wall does.
(() => {
  const $ = (s) => document.querySelector(s);
  const GRID = { "parvathipuram-manyam": [0, 4], srikakulam: [0, 5], "alluri-sitharama-raju": [1, 3], vizianagaram: [1, 4], visakhapatnam: [1, 5], polavaram: [2, 2], "east-godavari": [2, 3], kakinada: [2, 4], anakapalli: [2, 5], ntr: [3, 1], eluru: [3, 2], "west-godavari": [3, 3], "dr-b-r-ambedkar-konaseema": [3, 4],
    palnadu: [4, 1], guntur: [4, 2], krishna: [4, 3], kurnool: [5, 0], nandyal: [5, 1], markapuram: [5, 2], bapatla: [5, 3], anantapur: [6, 0], kadapa: [6, 1], prakasam: [6, 2], "sri-sathya-sai": [7, 0], annamayya: [7, 1], nellore: [7, 2], chittoor: [8, 1], tirupati: [8, 2] };
  const S3 = ["K", "Y", "O"];
  const tally = (rs) => { const o = { total: rs.length, done: 0, K: 0, Y: 0, O: 0 }; for (const g of rs) if (g[4]) { o.done++; o[g[4]]++; } return o; };
  const lead = (o) => (o.done ? S3.slice().sort((a, b) => o[b] - o[a])[0] : null);
  const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) + "%" : "—");
  const note = (t) => `<div class="pg-note">${t}</div>`;

  function donut(o, P) {
    const { COL, SIDE, nf } = P, C = 2 * Math.PI * 70; let off = 0;
    const arcs = o.done ? S3.map((k) => { const s = o[k] / o.done, a = `<circle cx="95" cy="95" r="70" fill="none" stroke="${COL[k]}" stroke-width="26" stroke-dasharray="${s * C} ${C}" stroke-dashoffset="${-off * C}" transform="rotate(-90 95 95)"/>`; off += s; return a; }).join("") : `<circle cx="95" cy="95" r="70" fill="none" stroke="${P.PEND}" stroke-width="26"/>`;
    return `<div class="pg-donut"><svg viewBox="0 0 190 190" role="img" aria-label="Declared Sarpanch results by side">${arcs}<text class="ctr" x="95" y="97" text-anchor="middle">${nf(o.done)}</text><text class="sub" x="95" y="116" text-anchor="middle">ప్రకటించినవి</text></svg>
      <div class="pg-key">${S3.map((k) => `<div style="--c:${COL[k]}"><i></i>${SIDE[k]}<b>${nf(o[k])}</b><small>${pct(o[k], o.done)}</small></div>`).join("")}<div style="--c:${P.PEND}"><i></i>ఎదురుచూపు<b>${nf(o.total - o.done)}</b></div></div></div>`;
  }
  function seg(o, P, base) { return `<div class="pg-bar">${S3.map((k) => (o[k] ? `<i style="width:${(o[k] / base) * 100}%;background:${P.COL[k]}"></i>` : "")).join("")}</div>`; }
  function phaseBars(P) {
    const all = P.data().gp;
    return `<div class="pg-bars">${P.PH.map((p) => { const o = tally(all.filter((g) => g[3] === p.n)); return `<div class="pg-row"><span>దశ ${p.n} · ${p.te}</span>${seg(o, P, o.total || 1)}<em>${P.nf(o.done)}/${o.total ? P.nf(o.total) : "—"}</em></div>`; }).join("")}</div>`;
  }
  function cartogram(R, P) {
    const tiles = P.DISTS.map((d) => { const [r, c] = GRID[d.id] || [0, 0], o = tally(R.filter((g) => g[0] === d.id)), l = lead(o);
      const share = l ? o[l] / o.done : 0, mix = l ? Math.round(40 + share * 60) : 0, bg = l ? `color-mix(in srgb, ${P.COL[l]} ${mix}%, #fff)` : P.PEND;
      return `<button type="button" class="pg-tile ${l && mix >= 68 ? "dk" : ""}" data-d="${d.id}" style="grid-row:${r + 1};grid-column:${c + 1};background:${bg}"><b>${P.esc(d.te)}</b><span>${o.done ? `${o.K}–${o.Y}${o.O ? `–${o.O}` : ""}` : "—"}</span><div class="m"><i style="width:${o.total ? (o.done / o.total) * 100 : 0}%"></i></div></button>`; }).join("");
    return `<div class="pg-map">${tiles}</div><p class="pg-note" style="padding-top:10px">రంగు = ఎక్కువ గెలిచిన వైపు · ముదురుదనం = ఆధిక్యం · కూటమి–వైసీపీ–ఇతరులు</p>`;
  }
  function districtBars(R, P) {
    const L = P.DISTS.map((d) => ({ d, o: tally(R.filter((g) => g[0] === d.id)) })).filter((x) => x.o.total).sort((a, b) => (b.o.done ? b.o.K / b.o.done : -1) - (a.o.done ? a.o.K / a.o.done : -1));
    return `<div class="pg-bars">${L.map(({ d, o }) => `<div class="pg-row"><span>${P.esc(d.te)}</span>${seg(o, P, o.total)}<em>${P.nf(o.done)}/${P.nf(o.total)}</em></div>`).join("")}</div>`;
  }
  const fmtT = (t, t0) => (t0 > 1e6 ? new Date(t * 60000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : `+${Math.round(t - t0)} ని`);
  function timeline(R, P) {
    const D = R.filter((g) => g[4] && g[8]).sort((a, b) => a[8] - b[8]); if (D.length < 3 || D[D.length - 1][8] === D[0][8]) return note("ఫలితాలు వస్తున్న కొద్దీ ఈ గ్రాఫ్ నిండుతుంది · The timeline fills in as results arrive.");
    const t0 = D[0][8], t1 = D[D.length - 1][8], N = 30, cum = { K: [], Y: [], O: [] }; let i = 0; const run = { K: 0, Y: 0, O: 0 };
    for (let b = 0; b <= N; b++) { const lim = t0 + ((t1 - t0) * b) / N; while (i < D.length && D[i][8] <= lim) run[D[i++][4]]++; for (const k of S3) cum[k].push(run[k]); }
    const max = Math.max(1, ...S3.map((k) => cum[k][N])), X = (b) => 44 + (b / N) * 586, Y = (v) => 190 - (v / max) * 176;
    const line = (k) => { const pts = cum[k].map((v, b) => `${X(b).toFixed(1)},${Y(v).toFixed(1)}`).join(" "); return `<polygon points="44,190 ${pts} 630,190" fill="${P.COL[k]}" opacity=".12"/><polyline points="${pts}" fill="none" stroke="${P.COL[k]}" stroke-width="2.5" stroke-linejoin="round"/>`; };
    const grid = [0, 0.5, 1].map((f) => `<line class="grid" x1="44" x2="630" y1="${Y(max * f)}" y2="${Y(max * f)}"/><text x="38" y="${Y(max * f) + 4}" text-anchor="end">${P.nf(Math.round(max * f))}</text>`).join("");
    return `<svg class="pg-svg" viewBox="0 0 640 215" role="img" aria-label="Declared results over time">${grid}${S3.map(line).join("")}<text x="44" y="208">${fmtT(t0, t0)}</text><text x="337" y="208" text-anchor="middle">${fmtT((t0 + t1) / 2, t0)}</text><text x="630" y="208" text-anchor="end">${fmtT(t1, t0)}</text></svg>`;
  }
  const BINS = [[1, 50, "<50"], [50, 100, "50–99"], [100, 200, "100–199"], [200, 400, "200–399"], [400, 800, "400–799"], [800, 1e9, "800+"]];
  function margins(R, P) {
    const M = R.filter((g) => g[4] && g[6] > 0); if (M.length < 3) return note("మెజారిటీలు వచ్చాక ఇక్కడ కనిపిస్తాయి · Margins appear as results arrive.");
    const rows = BINS.map(([a, b, l]) => { const o = { total: 0, done: 0, K: 0, Y: 0, O: 0 }; for (const g of M) if (g[6] >= a && g[6] < b) { o.total++; o.done++; o[g[4]]++; } return { l, o }; }), max = Math.max(1, ...rows.map((r) => r.o.total));
    return `<div class="pg-bars">${rows.map(({ l, o }) => `<div class="pg-row"><span>${l}</span>${seg(o, P, max)}<em>${P.nf(o.total)}</em></div>`).join("")}</div><p class="pg-note" style="padding-top:8px">ఓట్ల మెజారిటీ · Winning margin (votes)</p>`;
  }
  function leaderboard(R, P) {
    const by = {}; for (const g of R) { const k = g[0] + "/" + g[1], o = (by[k] ||= { k, g, total: 0, done: 0, K: 0, Y: 0, O: 0 }); o.total++; if (g[4]) { o.done++; o[g[4]]++; } }
    const L = Object.values(by).filter((o) => o.done >= 4); if (L.length < 4) return note("ఒక్కో మండలంలో కనీసం 4 ఫలితాలు వచ్చాక ఈ జాబితా కనిపిస్తుంది · Appears once mandals have 4+ results.");
    const col = (s) => { const top = L.slice().sort((a, b) => b[s] / b.done - a[s] / a.done || b.done - a.done).slice(0, 7);
      return top.map((o) => `<div class="pg-row"><span>${P.esc(P.mName(o.g[0], o.g[1]))} · ${P.esc(P.DISTS.find((d) => d.id === o.g[0])?.te || "")}</span><div class="pg-bar"><i style="width:${(o[s] / o.done) * 100}%;background:${P.COL[s]}"></i></div><em>${o[s]}/${o.done}</em></div>`).join(""); };
    const sweep = (s) => L.filter((o) => o[s] === o.done && o.done === o.total).length;
    return `<div class="pg-two"><div><h4 style="color:${P.COL.K}">కూటమి బలమైన మండలాలు · Strongest for Kutami</h4><div class="pg-bars">${col("K")}</div></div><div><h4 style="color:${P.COL.Y}">వైసీపీ బలమైన మండలాలు · Strongest for YSRCP</h4><div class="pg-bars">${col("Y")}</div></div></div>
      <p class="pg-note" style="padding-top:12px">పూర్తి క్లీన్ స్వీప్ మండలాలు (అన్ని పంచాయతీలు తేలి ఒకే వైపు): కూటమి <b>${sweep("K")}</b> · వైసీపీ <b>${sweep("Y")}</b></p>`;
  }
  function stats(R, P) {
    const M = R.filter((g) => g[4] && g[6] > 0); if (M.length < 2) return note("అతి తక్కువ, అతి ఎక్కువ మెజారిటీలు ఇక్కడ కనిపిస్తాయి · Closest and biggest wins appear here.");
    const lo = M.reduce((a, g) => (g[6] < a[6] ? g : a)), hi = M.reduce((a, g) => (g[6] > a[6] ? g : a)), card = (t, g) => `<div style="--c:${P.COL[g[4]]}"><small>${t}</small><b>${P.nf(g[6])} ఓట్లు</b><span>${P.esc(g[2])} · ${P.esc(P.SIDE[g[4]])}</span></div>`;
    return `<div class="pg-stat">${card("అతి తక్కువ మెజారిటీ · Closest contest", lo)}${card("అతి ఎక్కువ మెజారిటీ · Biggest win", hi)}</div>`;
  }
  function render() {
    const P = window.PL, el = $("#plGraphs"); if (!P || !el) return;
    if (!P.data().gp.length) { el.innerHTML = `<div class="pg-card w">${note("గ్రామాల జాబితా వచ్చాక, ఫలితాలు రాగానే ఈ గ్రాఫ్‌లు నిండుతాయి — పై చార్టులన్నీ ఇక్కడ కనిపిస్తాయి.<br><small>Once the village directory is loaded and results start, the donut, district map, bars, timeline and leaderboard fill in here.</small>")}</div>`; return; }
    const R = P.data().gp.filter(P.inPhase), o = tally(R);
    el.innerHTML = `<div class="pg-card"><h3>సర్పంచ్ ఫలితాలు <small>Share of declared</small></h3>${donut(o, P)}</div>
      <div class="pg-card"><h3>దశల వారీ పురోగతి <small>Progress by phase</small></h3>${phaseBars(P)}</div>
      <div class="pg-card"><h3>జిల్లాల పటం <small>District map</small></h3>${cartogram(R, P)}</div>
      <div class="pg-card"><h3>విశేషాలు <small>Highlights</small></h3>${stats(R, P)}</div>
      <div class="pg-card w"><h3>జిల్లాల వారీ <small>District bars · sorted by Kutami share</small></h3>${districtBars(R, P)}</div>
      <div class="pg-card"><h3>సమయం వారీగా ఫలితాలు <small>Declared over time</small></h3>${timeline(R, P)}</div>
      <div class="pg-card"><h3>మెజారిటీల పంపిణీ <small>Margin of victory</small></h3>${margins(R, P)}</div>
      <div class="pg-card w"><h3>మండలాల జాబితా <small>Mandal leaderboard</small></h3>${leaderboard(R, P)}</div>`;
  }
  document.addEventListener("click", (e) => { const t = e.target.closest(".pg-tile"); if (t) { window.PL.setView("wall"); setTimeout(() => window.PL.focusD(t.dataset.d), 60); } });
  window.PLG = { render };
})();
