// Results charts for a tab: a seat hemicycle for the wards / divisions, a ring for the head posts, and a race bar for
// every party (all parties listed, zeros included). Drawn as inline SVG from the same tally as the share images.
(() => {
  const { ORDER, pName, nf, rec } = window.CD, { COL } = window.CD_simple, $ = (s) => document.querySelector(s);
  const PARTIES = ORDER.filter((p) => p !== "NDA"); // NDA (unsplit Kutami) is shown only when a source gave it
  const list = (o) => [...PARTIES.slice(0, 3), ...(o.NDA ? ["NDA"] : []), ...PARTIES.slice(3)];
  const light = (c) => `color-mix(in srgb, ${c} 38%, #fff)`;

  // semicircle of dots, filled party by party from the left; each dot is `per` seats
  function hemicycle(seats, total, done) {
    const per = Math.max(1, Math.ceil(total / 260)), dots = Math.ceil(total / per), rows = Math.max(5, Math.round(Math.sqrt(dots / 2.2)));
    const R = 150, r0 = 54, pos = [];
    for (let i = 0; i < rows; i++) { const rad = r0 + (i + .5) * ((R - r0) / rows), n = Math.round((Math.PI * rad / (R - r0)) * rows * dots / (rows * rows * 1.6)); pos.push({ rad, n }); }
    const ps = pos.reduce((a, p) => a + p.n, 0); pos.forEach((p) => (p.n = Math.max(1, Math.round(p.n * dots / ps))));
    const pts = []; for (const { rad, n } of pos) for (let j = 0; j < n; j++) { const a = Math.PI - (Math.PI * (j + .5)) / n; pts.push({ x: 160 + rad * Math.cos(a), y: 162 - rad * Math.sin(a), a }); }
    pts.sort((p, q) => q.a - p.a);
    const sum = Object.values(seats).reduce((a, n) => a + n, 0) || 1, got = Math.min(total, done || sum), f = Math.min(1, got / sum);
    const fill = []; for (const p of list(seats)) for (let k = 0; k < Math.round(((seats[p] || 0) * f) / per); k++) fill.push(COL[p] || COL.OTH);
    const dr = Math.min(5.2, ((R - r0) / rows) * .4);
    return `<svg viewBox="0 0 320 172" class="hemi" role="img" aria-label="seats">${pts.map((p, i) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${dr.toFixed(1)}" fill="${fill[i] || "#e3e3dc"}"/>`).join("")}
      <text x="160" y="140" text-anchor="middle" class="big">${nf(got)}</text><text x="160" y="160" text-anchor="middle" class="sm">/ ${nf(total)} తేలాయి</text></svg>${per > 1 ? `<p class="ch-note">ఒక్కో చుక్క = ${per} స్థానాలు</p>` : ""}`;
  }

  // ring of head posts: won solid, leading light, awaited grey
  function ring(won, lead, total) {
    const C = 2 * Math.PI * 70; let at = 0, segs = "";
    for (const p of list({ ...won, ...lead })) for (const [n, c] of [[won[p] || 0, COL[p] || COL.OTH], [lead[p] || 0, light(COL[p] || COL.OTH)]]) { if (!n) continue; const L = (n / total) * C; segs += `<circle r="70" cx="90" cy="90" fill="none" stroke="${c}" stroke-width="26" stroke-dasharray="${L - 2} ${C}" stroke-dashoffset="${-at}" transform="rotate(-90 90 90)"/>`; at += L; }
    const w = Object.values(won).reduce((a, n) => a + n, 0), l = Object.values(lead).reduce((a, n) => a + n, 0);
    return `<svg viewBox="0 0 180 180" class="ring" role="img" aria-label="head posts"><circle r="70" cx="90" cy="90" fill="none" stroke="#e3e3dc" stroke-width="26"/>${segs}
      <text x="90" y="88" text-anchor="middle" class="big">${w}<tspan class="sm">/${total}</tspan></text><text x="90" y="110" text-anchor="middle" class="sm">గెలుపు · ${l} ఆధిక్యం</text></svg>`;
  }

  window.CD_charts = (el, t, bodies, post, unit) => {
    const box = $(el); if (!box) return;
    const total = bodies.length;
    // wards: the unsplit Kutami total (NDA) already holds the unopposed TDP / JSP / BJP wards, so it isn't added to them
    const K = ["TDP", "JSP", "BJP", "NDA"], sumK = (o) => K.reduce((a, p) => a + (o[p] || 0), 0), split = !t.wards.NDA;
    const kutW = split ? sumK(t.wards) : Math.max(t.wards.NDA, sumK(t.wards) - t.wards.NDA);
    const seats = split ? t.wards : { NDA: kutW, ...Object.fromEntries(PARTIES.filter((p) => !K.includes(p)).map((p) => [p, t.wards[p] || 0])) };
    const rows = [["NDA", sumK(t.won), sumK(t.lead), kutW, " kut"], ...PARTIES.map((p) => [p, t.won[p] || 0, t.lead[p] || 0, K.includes(p) && !split ? null : t.wards[p] || 0, K.includes(p) ? " sub" : ""])];
    const maxW = Math.max(1, ...rows.map((r) => r[3] || 0));
    const race = rows.map(([p, w, l, s, cls]) => {
      const c = COL[p] || COL.OTH;
      return `<div class="race${cls}${w + l + (s || 0) ? "" : " zero"}"><span class="pn"><i style="background:${c}"></i>${pName(p)}</span>
        <span class="tr">${s == null ? "" : `<b style="width:${(s / maxW) * 100}%;background:${c}"></b>`}</span><span class="sv">${s == null ? "" : nf(s)}</span>
        <span class="hp">${w ? `<em style="background:${c}">${w} గెలుపు</em>` : ""}${l ? `<em class="l" style="--c:${c}">${l} ఆధిక్యం</em>` : ""}${w + l ? "" : "—"}</span></div>`;
    }).join("");
    box.innerHTML = `<div class="ch-grid"><figure><figcaption>${post} పదవులు</figcaption>${ring(t.won, t.lead, total)}</figure>
      <figure><figcaption>${unit}</figcaption>${hemicycle(seats, t.wardsAll, t.wardsDone)}</figure></div>
      <div class="ch-race"><p class="ch-h"><span>పార్టీ</span><span>${unit}</span><span>${post}</span></p>${race}</div>`;
  };
  window.CD_fx?.();
})();
