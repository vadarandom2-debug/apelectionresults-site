// Shared party metadata + small SVG chart helpers (no dependencies).
(() => {
  const PARTIES = [
    { id: "TDP", name: "Telugu Desam", te: "తెలుగుదేశం" },
    { id: "JSP", name: "Jana Sena", te: "జనసేన" },
    { id: "BJP", name: "BJP", te: "బీజేపీ" },
    { id: "YSRCP", name: "YSR Congress", te: "వైఎస్సార్‌సీపీ" },
    { id: "INC", name: "Congress", te: "కాంగ్రెస్" },
    { id: "LEFT", name: "CPI / CPI(M)", te: "వామపక్షాలు" },
    { id: "OTH", name: "Others & independents", te: "ఇతరులు" },
  ];
  const ORDER = PARTIES.map((p) => p.id);
  const LOGO = { TDP: "tdp", JSP: "jsp", BJP: "bjp", YSRCP: "ysrcp", INC: "inc", LEFT: "left" };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
  const col = (p) => `var(--${ORDER.includes(p) ? p : "OTH"})`;
  const name = (p) => (PARTIES.find((x) => x.id === p) || PARTIES[6]).name;
  const logo = (p, cls = "") => (LOGO[p]
    ? `<img class="plogo ${cls}" style="--pc:var(--${p})" src="assets/parties/${LOGO[p]}.png" alt="${p}" loading="lazy" />`
    : `<span class="plogo plogo-ind ${cls}" style="--pc:var(--OTH)">IND</span>`);
  const tip = (html) => `data-tip="${esc(html)}"`;

  // ---------- tooltip (delegated) ----------
  const tipEl = document.createElement("div");
  tipEl.className = "tip"; tipEl.hidden = true; document.body.appendChild(tipEl);
  document.addEventListener("pointermove", (e) => {
    const t = e.target.closest?.("[data-tip]");
    if (!t) { tipEl.hidden = true; return; }
    tipEl.innerHTML = t.dataset.tip; tipEl.hidden = false;
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    let x = e.clientX + 14, y = e.clientY + 14;
    if (x + w > innerWidth - 8) x = e.clientX - w - 14;
    if (y + h > innerHeight - 8) y = e.clientY - h - 14;
    tipEl.style.transform = `translate(${x}px,${y}px)`;
  });
  document.addEventListener("pointerleave", () => (tipEl.hidden = true));

  // ---------- hemicycle ----------
  // seats: [{p, t}] already ordered left→right
  function hemicycle(seats, { rows = 8, label = "" } = {}) {
    const N = seats.length, W = 400, R1 = 190, R0 = rows > 6 ? 78 : 92, cx = W / 2, cy = 200;
    const radii = Array.from({ length: rows }, (_, i) => R0 + ((R1 - R0) * i) / (rows - 1));
    const tot = radii.reduce((a, b) => a + b, 0);
    const counts = radii.map((r) => Math.round((N * r) / tot));
    counts[rows - 1] += N - counts.reduce((a, b) => a + b, 0);
    const rad = Math.min(8, (Math.PI * R1) / counts[rows - 1] / 2 - 0.6, (R1 - R0) / (rows - 1) / 2 - 0.6);
    const pts = [];
    radii.forEach((r, i) => { for (let k = 0; k < counts[i]; k++) { const a = Math.PI * (1 - (counts[i] === 1 ? 0.5 : k / (counts[i] - 1))); pts.push({ a, x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }); } });
    pts.sort((p, q) => q.a - p.a || q.y - p.y);
    return `<svg viewBox="0 0 ${W} ${cy + rad + 2}" role="img" aria-label="${esc(label)}">${pts.map((pt, i) => `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${rad.toFixed(1)}" fill="${col(seats[i].p)}" ${tip(seats[i].t)}/>`).join("")}</svg>`;
  }
  const seatsFrom = (rows, toTip) => {
    const by = {}; rows.forEach((r) => (by[r.p] = by[r.p] || []).push(r));
    return ORDER.flatMap((p) => by[p] || []).map((r) => ({ p: r.p, t: toTip(r) }));
  };

  // ---------- line chart (vote share over years) ----------
  function lineChart(series, years, { max = 55, unit = "%" } = {}) {
    const W = 640, H = 300, L = 40, R = 150, T = 16, B = 34;
    const x = (i) => L + ((W - L - R) * i) / (years.length - 1), y = (v) => T + (H - T - B) * (1 - v / max);
    let g = "";
    for (let v = 0; v <= max; v += 10) g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}${unit}</text>`;
    years.forEach((yr, i) => (g += `<text class="ax" x="${x(i)}" y="${H - 10}" text-anchor="middle">${yr}</text>`));
    const lines = series.map((s) => {
      const pts = s.v.map((v, i) => (v == null ? null : [x(i), y(v)])).filter(Boolean);
      return `<path class="ln" d="M${pts.map((p) => p.join(",")).join("L")}" stroke="${col(s.p)}"/>` + pts.map((p) => `<circle class="mk" cx="${p[0]}" cy="${p[1]}" r="4.5" fill="${col(s.p)}"/>`).join("");
    }).join("");
    // direct labels at the right end, nudged apart
    const ends = series.map((s) => ({ s, v: s.v[s.v.length - 1], y: y(s.v[s.v.length - 1]) })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 16) ends[i].y = ends[i - 1].y + 16;
    const labels = ends.map((e) => `<text class="dl" x="${W - R + 12}" y="${e.y + 4}"><tspan class="dlv">${e.v.toFixed(1)}${unit}</tspan> ${esc(name(e.s.p))}</text>`).join("");
    const hovers = years.map((yr, i) => {
      const rows = series.map((s) => ({ p: s.p, v: s.v[i] })).filter((r) => r.v != null).sort((a, b) => b.v - a.v);
      const html = `<b>${yr}</b>` + rows.map((r) => `<div class="tr"><i style="background:${col(r.p)}"></i>${esc(name(r.p))}<span>${r.v.toFixed(2)}${unit}</span></div>`).join("");
      const w = (W - L - R) / (years.length - 1);
      return `<rect class="hov" x="${x(i) - w / 2}" y="${T}" width="${w}" height="${H - T - B}" ${tip(html)}/>`;
    }).join("");
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}${lines}${labels}${hovers}</svg>`;
  }

  // ---------- stacked horizontal bars (rows of party counts) ----------
  // rows: [{label, counts:{p:n}, total}] ; scaleMax shared across rows
  function stackedBars(rows, { scaleMax, marker, markerLabel, rowH = 34, labelW = 120, showTotal = true } = {}) {
    const W = 640, R = showTotal ? 44 : 8, H = rows.length * rowH + (marker ? 22 : 6);
    const sx = (v) => ((W - labelW - R) * v) / scaleMax;
    let out = "";
    rows.forEach((r, i) => {
      const y0 = (marker ? 18 : 2) + i * rowH, bh = rowH - 12;
      out += `<text class="rl" x="${labelW - 10}" y="${y0 + bh / 2 + 5}" text-anchor="end">${esc(r.label)}</text>`;
      let x = labelW;
      ORDER.forEach((p) => {
        const n = r.counts[p] || 0; if (!n) return;
        const w = Math.max(0, sx(n) - 2);
        out += `<rect class="seg" x="${x}" y="${y0}" width="${w}" height="${bh}" rx="3" fill="${col(p)}" ${tip(`<b>${esc(r.label)}</b><div class="tr"><i style="background:${col(p)}"></i>${esc(name(p))}<span>${n}</span></div>`)}/>`;
        if (w > 26) out += `<text class="segl ${p === "TDP" || p === "BJP" ? "dk" : ""}" x="${x + w / 2}" y="${y0 + bh / 2 + 4.5}" text-anchor="middle">${n}</text>`;
        x += sx(n);
      });
      if (showTotal) out += `<text class="ax" x="${x + 6}" y="${y0 + bh / 2 + 4.5}">${r.total}</text>`;
    });
    if (marker) {
      const mx = labelW + sx(marker);
      out = `<line class="maj" x1="${mx}" x2="${mx}" y1="14" y2="${H}"/><text class="ax" x="${mx}" y="10" text-anchor="middle">${esc(markerLabel)}</text>` + out;
    }
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${out}</svg>`;
  }

  // ---------- alluvial seat flow across years ----------
  // seq: array of per-constituency party sequences, e.g. [["TDP","YSRCP","TDP"], ...]
  function alluvial(seq, years, { unit = "seats" } = {}) {
    const W = 640, H = 380, nodeW = 14, gap = 8, T = 30, B = 8, n = seq.length;
    const xs = years.map((_, i) => 60 + ((W - 120 - nodeW) * i) / (years.length - 1));
    const cols = years.map((_, i) => { const c = {}; seq.forEach((s) => (c[s[i]] = (c[s[i]] || 0) + 1)); return c; });
    const maxNodes = Math.max(...cols.map((c) => Object.keys(c).length));
    const k = (H - T - B - gap * (maxNodes - 1)) / n;
    const nodes = cols.map((c, i) => { let y = T; const o = {}; ORDER.forEach((p) => { if (!c[p]) return; o[p] = { y, h: c[p] * k, outY: y, inY: y }; y += c[p] * k + gap; }); return o; });
    let links = "";
    for (let i = 0; i < years.length - 1; i++) {
      const f = {}; seq.forEach((s) => { const key = s[i] + ">" + s[i + 1]; f[key] = (f[key] || 0) + 1; });
      ORDER.forEach((a) => ORDER.forEach((b) => {
        const v = f[a + ">" + b]; if (!v) return;
        const A = nodes[i][a], Bn = nodes[i + 1][b], h = v * k, x0 = xs[i] + nodeW, x1 = xs[i + 1], mx = (x0 + x1) / 2;
        const y0 = A.outY, y1 = Bn.inY; A.outY += h; Bn.inY += h;
        const html = `<b>${years[i]} → ${years[i + 1]}</b><div class="tr"><i style="background:${col(a)}"></i>${esc(name(a))} → <i style="background:${col(b)};margin-left:4px"></i>${esc(name(b))}<span>${v} ${unit}</span></div>`;
        links += `<path class="lk${a === b ? " same" : ""}" d="M${x0},${y0}C${mx},${y0} ${mx},${y1} ${x1},${y1}L${x1},${y1 + h}C${mx},${y1 + h} ${mx},${y0 + h} ${x0},${y0 + h}Z" fill="${col(a)}" ${tip(html)}/>`;
      }));
    }
    let nd = "";
    nodes.forEach((o, i) => {
      nd += `<text class="ax yr" x="${xs[i] + nodeW / 2}" y="14" text-anchor="middle">${years[i]}</text>`;
      Object.entries(o).forEach(([p, v]) => {
        nd += `<rect x="${xs[i]}" y="${v.y}" width="${nodeW}" height="${Math.max(1, v.h)}" rx="3" fill="${col(p)}" ${tip(`<b>${years[i]}</b><div class="tr"><i style="background:${col(p)}"></i>${esc(name(p))}<span>${cols[i][p]}</span></div>`)}/>`;
        if (v.h > 9) {
          const left = i === 0, x = left ? xs[i] - 6 : xs[i] + nodeW + 6;
          if (i === 0 || i === years.length - 1) nd += `<text class="nl" x="${x}" y="${v.y + v.h / 2 + 4}" text-anchor="${left ? "end" : "start"}">${p === "OTH" ? "OTH" : p} ${cols[i][p]}</text>`;
          else nd += `<text class="nl mid" x="${xs[i] + nodeW + 5}" y="${v.y + Math.min(v.h / 2, 12) + 4}">${p} ${cols[i][p]}</text>`;
        }
      });
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${links}${nd}</svg>`;
  }

  // ---------- margin strip plot (one row per winning party) ----------
  function strip(points, { max, unit = " pts" } = {}) {
    const parties = ORDER.filter((p) => points.some((d) => d.p === p));
    const hOf = (p) => Math.max(30, Math.min(96, points.filter((d) => d.p === p).length * 0.62));
    const W = 640, L = 70, R = 14, T = 6, H = T + parties.reduce((a, p) => a + hOf(p), 0) + 30;
    max = max || Math.ceil(Math.max(...points.map((d) => d.v)) / 10) * 10;
    const sx = (v) => L + ((W - L - R) * Math.min(v, max)) / max;
    let out = "";
    for (let v = 0; v <= max; v += 10) out += `<line class="grid" x1="${sx(v)}" x2="${sx(v)}" y1="${T}" y2="${H - 24}"/><text class="ax" x="${sx(v)}" y="${H - 8}" text-anchor="middle">${v}${unit}</text>`;
    let seed = 7, y0 = T; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    parties.forEach((p) => {
      const h = hOf(p), cy = y0 + h / 2; y0 += h;
      out += `<text class="rl" x="${L - 10}" y="${cy + 4}" text-anchor="end">${p}</text>`;
      points.filter((d) => d.p === p).forEach((d) => (out += `<circle class="dot" cx="${sx(d.v)}" cy="${cy + (rnd() - 0.5) * (h - 12)}" r="4.5" fill="${col(p)}" ${tip(d.t)}/>`));
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${out}</svg>`;
  }

  window.GECharts = { PARTIES, ORDER, esc, fmt, col, name, logo, tip, hemicycle, seatsFrom, lineChart, stackedBars, alluvial, strip };
})();
