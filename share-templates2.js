// More share-image templates: Celebration, LED scoreboard, Front page and Ward mosaic.
// Same contract as share-templates.js: each gets the prepared data object D and draws at W0×H0 (CSS px).
(() => {
  const U = () => window.SHARE_UTIL;
  const hexPath = (ctx, x, y, r) => { ctx.beginPath(); for (let i = 0; i < 6; i++) { const t = (Math.PI / 180) * (60 * i - 30); ctx.lineTo(x + r * Math.cos(t), y + r * Math.sin(t)); } ctx.closePath(); };
  const seeded = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  // one entry per ward: won (by party), leading, or still pending
  function wardSeq(D) {
    const out = [];
    D.ORDER.forEach((p) => { for (let i = 0; i < (D.wards[p] || 0); i++) out.push({ p, kind: "won" }); });
    D.ORDER.forEach((p) => { for (let i = 0; i < (D.leads[p] || 0); i++) out.push({ p, kind: "lead" }); });
    while (out.length < D.total) out.push({ p: null, kind: "pending" });
    return out.slice(0, D.total);
  }
  const headOf = (D) => D.cands.find((c) => c.isHead);
  const word = (D, h) => (!D.r || !h ? (D.te ? "లెక్కింపు 3 నవంబర్" : "COUNTING DAY · 3 NOV") : h.won ? (D.te ? "ఘన విజయం" : "VICTORY") : (D.te ? "ఆధిక్యంలో" : "LEADING"));
  const isTall = (D) => D.H0 / D.W0 > 1.2, isWide = (D) => D.W0 / D.H0 > 1.4;

  // ---------- 1. Celebration ----------
  function victory(ctx, D) {
    const u = U(), { W0, H0 } = D, k = D.k, pad = 52 * k, tall = isTall(D), wide = isWide(D);
    const h = headOf(D), acc = h ? D.COL[h.p] : "#d4a000";
    const cx = W0 / 2, cy = H0 * (tall ? 0.33 : wide ? 0.4 : 0.36);
    ctx.fillStyle = "#08080d"; ctx.fillRect(0, 0, W0, H0);
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(W0, H0) * 0.75); g.addColorStop(0, acc + "ee"); g.addColorStop(0.45, acc + "55"); g.addColorStop(1, acc + "00"); ctx.fillStyle = g; ctx.fillRect(0, 0, W0, H0);
    // sun rays
    ctx.save(); ctx.translate(cx, cy); const R = Math.hypot(W0, H0);
    for (let i = 0; i < 36; i++) { if (i % 2) continue; const a = (i / 36) * Math.PI * 2; ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, a, a + Math.PI / 36); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // confetti (only once a result is in)
    if (D.r && h) {
      const rnd = seeded([...D.b.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 11) >>> 0), cols = [acc, "#fff", "#F5C400", "#c4122f", acc];
      for (let i = 0; i < 90; i++) { const x = rnd() * W0, y = rnd() * H0 * 0.9; if (Math.hypot(x - cx, y - cy) < 150 * k) continue; ctx.save(); ctx.translate(x, y); ctx.rotate(rnd() * Math.PI); ctx.globalAlpha = 0.5 + rnd() * 0.5; ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-5 * k, -2.5 * k, (6 + rnd() * 10) * k, 5 * k); ctx.restore(); }
    }
    // header
    ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,.8)"; u.fitText(ctx, D, D.T.top(D.post), W0 * 0.6, 18 * k, 700); ctx.fillText(D.T.top(D.post), pad, 60 * k);
    D.pill(ctx, W0 - pad, 32 * k, k, true);
    // emblem
    const LR = (tall ? 130 : wide ? 82 : 100) * k;
    if (h) u.logoDisc(ctx, D, { ...h, isHead: true }, cx, cy, LR, false);
    else { const cs = D.cands.slice(0, 3), gap = LR * 1.25; cs.forEach((c, i) => u.logoDisc(ctx, D, c, cx + (i - (cs.length - 1) / 2) * gap * 1.5, cy, LR * 0.62, false)); }
    // the big word
    let y = cy + LR + (tall ? 120 : wide ? 74 : 92) * k;
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 24 * k;
    const wd = word(D, h); u.fitText(ctx, D, wd, W0 - pad * 2, (tall ? 120 : wide ? 76 : 92) * k); ctx.fillText(wd, cx, y); ctx.shadowBlur = 0;
    // who and where
    y += (tall ? 84 : 56) * k;
    const who = h ? h.name : D.title; ctx.fillStyle = "#F5C400"; u.fitText(ctx, D, who, W0 - pad * 2, (tall ? 56 : 40) * k); ctx.fillText(who, cx, y);
    y += (tall ? 50 : 36) * k; ctx.fillStyle = "rgba(255,255,255,.85)";
    const where = h ? `${D.title} ${D.post} · ${h.partyName}` : D.sub; u.fitText(ctx, D, where, W0 - pad * 2, (tall ? 28 : 21) * k, 600); ctx.fillText(where, cx, y);
    if (h && D.margin) {
      y += (tall ? 34 : 22) * k; const t = D.te ? `${D.fmt(D.margin)} ఓట్ల మెజారిటీ` : `MARGIN ${D.fmt(D.margin)} VOTES`;
      ctx.font = D.F(800, (tall ? 26 : 20) * k); const w = ctx.measureText(t).width + 40 * k, hh = (tall ? 52 : 42) * k;
      ctx.fillStyle = "#fff"; u.rr(ctx, cx - w / 2, y, w, hh, hh / 2); ctx.fill(); ctx.fillStyle = "#111827"; ctx.fillText(t, cx, y + hh * 0.68);
    }
    // wards + footer
    const by = H0 - (wide ? 150 : 190) * k;
    if (D.r && !wide) { u.wardsBar(ctx, D, pad, by, W0 - pad * 2, 14 * k, true); u.legend(ctx, D, pad, by + 44 * k, k, true, W0 - pad * 2); }
    const fy = H0 - (wide ? 84 : 96) * k; u.brand(ctx, D, pad, fy, wide ? k * 0.9 : k, true); u.stamp(ctx, D, W0 - pad, fy + 30 * k, k, true);
  }

  // ---------- 2. LED scoreboard ----------
  function scoreboard(ctx, D) {
    const u = U(), { W0, H0 } = D, k = D.k, pad = 50 * k, tall = isTall(D), wide = isWide(D), AMB = "#ffb000";
    ctx.fillStyle = "#040405"; ctx.fillRect(0, 0, W0, H0);
    ctx.fillStyle = "rgba(255,255,255,.035)"; for (let x = 6; x < W0; x += 9 * k) for (let y = 6; y < H0; y += 9 * k) ctx.fillRect(x, y, 2.2 * k, 2.2 * k);
    // frame
    ctx.strokeStyle = "#1d1d22"; ctx.lineWidth = 10 * k; u.rr(ctx, 14 * k, 14 * k, W0 - 28 * k, H0 - 28 * k, 22 * k); ctx.stroke();
    // header
    ctx.fillStyle = "#ff2d3d"; ctx.shadowColor = "#ff2d3d"; ctx.shadowBlur = 16 * k; ctx.beginPath(); ctx.arc(pad + 8 * k, 62 * k, 8 * k, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.textAlign = "left"; ctx.fillStyle = "#ff5a66"; ctx.font = D.te ? D.F(800, 20 * k) : `800 ${20 * k}px "JetBrains Mono", monospace`; ctx.fillText(D.te ? "లైవ్ స్కోర్" : "LIVE COUNT", pad + 26 * k, 69 * k);
    D.pill(ctx, W0 - pad, 40 * k, k, true);
    let y = (tall ? 170 : 132) * k;
    ctx.fillStyle = AMB; ctx.shadowColor = AMB; ctx.shadowBlur = 18 * k; u.fitText(ctx, D, D.title, W0 - pad * 2, (tall ? 84 : 58) * k); ctx.fillText(D.title, pad, y); ctx.shadowBlur = 0;
    const boardW = wide ? W0 * 0.56 : W0 - pad * 2, rowH = (tall ? 104 : wide ? 74 : 84) * k;
    y += 36 * k; ctx.fillStyle = "rgba(255,255,255,.55)"; u.fitText(ctx, D, D.sub, boardW, 18 * k, 600); ctx.fillText(D.sub, pad, y);
    // rows
    const rows = (D.rows.length ? D.rows : D.cands.map((c) => c.p)).slice(0, tall ? 5 : wide ? 3 : 4);
    y += 30 * k;
    rows.forEach((p, i) => {
      const ry = y + i * (rowH + 10 * k), h = headOf(D), isHead = h && h.p === p;
      ctx.fillStyle = isHead ? "rgba(255,176,0,.1)" : "rgba(255,255,255,.04)"; u.rr(ctx, pad, ry, boardW, rowH, 10 * k); ctx.fill();
      ctx.fillStyle = D.COL[p]; ctx.shadowColor = D.COL[p]; ctx.shadowBlur = 12 * k; ctx.fillRect(pad, ry + 8 * k, 6 * k, rowH - 16 * k); ctx.shadowBlur = 0;
      const ls = rowH - 22 * k; ctx.fillStyle = "#fff"; u.rr(ctx, pad + 20 * k, ry + 11 * k, ls, ls, 8 * k); ctx.fill();
      const im = D.logos[p]; if (im) { const kk = Math.min((ls - 8) / im.width, (ls - 8) / im.height); ctx.drawImage(im, pad + 20 * k + (ls - im.width * kk) / 2, ry + 11 * k + (ls - im.height * kk) / 2, im.width * kk, im.height * kk); }
      ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.font = D.F(800, (tall ? 34 : 26) * k); ctx.fillText(D.pshort(p), pad + 36 * k + ls, ry + rowH / 2 + (isHead ? -2 : 9) * k);
      if (isHead) { ctx.fillStyle = AMB; ctx.font = D.F(700, 15 * k); ctx.fillText(`${D.post} · ${h.won ? D.T.won : D.T.lead}`, pad + 36 * k + ls, ry + rowH / 2 + 22 * k); }
      ctx.textAlign = "right"; ctx.fillStyle = AMB; ctx.shadowColor = AMB; ctx.shadowBlur = 20 * k;
      ctx.font = `700 ${(tall ? 64 : wide ? 46 : 52) * k}px "JetBrains Mono", monospace`; ctx.fillText(String(D.wards[p] || 0).padStart(2, "0"), pad + boardW - 84 * k, ry + rowH / 2 + 18 * k); ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.font = `700 ${18 * k}px "JetBrains Mono", monospace`; ctx.fillText(D.leads[p] ? `+${D.leads[p]}` : "", pad + boardW - 18 * k, ry + rowH / 2 + 8 * k);
    });
    // ward segments
    const seq = wardSeq(D), sx = wide ? pad + boardW + 34 * k : pad, sw = wide ? W0 - sx - pad : W0 - pad * 2;
    const sy = wide ? y : y + rows.length * (rowH + 10 * k) + 30 * k, cols = wide ? 8 : tall ? 10 : 16, gap = 5 * k;
    const cw = (sw - gap * (cols - 1)) / cols, ch = Math.min(cw * 0.55, (tall ? 34 : 22) * k);
    ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = D.F(700, 15 * k); ctx.fillText(`${D.T.wardsT(D.b)} · ${D.r ? `${D.dec}/${D.total} ${D.T.declared}` : D.T.countStart}`, sx, sy - 12 * k);
    seq.forEach((w, i) => {
      const x = sx + (i % cols) * (cw + gap), yy = sy + Math.floor(i / cols) * (ch + gap);
      if (w.kind === "pending") ctx.fillStyle = "#17171b"; else { ctx.fillStyle = D.COL[w.p]; ctx.globalAlpha = w.kind === "lead" ? 0.4 : 1; ctx.shadowColor = D.COL[w.p]; ctx.shadowBlur = w.kind === "won" ? 8 * k : 0; }
      u.rr(ctx, x, yy, cw, ch, 3 * k); ctx.fill(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    });
    const fy = H0 - 92 * k; u.brand(ctx, D, pad, fy, wide ? k * 0.9 : k, true); u.stamp(ctx, D, W0 - pad, fy + 30 * k, k, true);
  }

  // ---------- 3. Front page ----------
  function frontpage(ctx, D) {
    const u = U(), { W0, H0 } = D, k = D.k, pad = 48 * k, tall = isTall(D), wide = isWide(D), INK = "#1b1a17";
    const serif = (w, s) => (D.te ? D.F(w, s) : `${w} ${s}px Georgia, "Times New Roman", serif`);
    const fitSerif = (t, max, size, w = 900) => { let fs = size; do { ctx.font = serif(w, fs); fs -= 1; } while (ctx.measureText(t).width > max && fs > 12); };
    ctx.fillStyle = "#f3eee1"; ctx.fillRect(0, 0, W0, H0);
    const rnd = seeded(7); ctx.fillStyle = "rgba(60,40,0,.05)"; for (let i = 0; i < 1400; i++) ctx.fillRect(rnd() * W0, rnd() * H0, 1.4, 1.4);
    // masthead
    let y = (tall ? 130 : 86) * k; ctx.textAlign = "center"; ctx.fillStyle = INK;
    const mast = D.te ? "ఎన్నికల ఫలితాలు" : "The AP Results"; fitSerif(mast, W0 - pad * 2, (tall ? 96 : 64) * k); ctx.fillText(mast, W0 / 2, y);
    y += 18 * k; ctx.fillRect(pad, y, W0 - pad * 2, 3 * k); ctx.fillRect(pad, y + 6 * k, W0 - pad * 2, 1 * k);
    y += 30 * k; ctx.font = D.F(600, 15 * k); ctx.textAlign = "left"; ctx.fillText(D.te ? "స్థానిక సంస్థల ఎన్నికలు 2026" : "LOCAL BODY ELECTIONS 2026", pad, y);
    
    y += 12 * k; ctx.fillRect(pad, y, W0 - pad * 2, 1 * k);
    // headline
    const h = headOf(D), hl = u.headline(D);
    y += (tall ? 120 : 84) * k; ctx.textAlign = "left"; ctx.fillStyle = INK;
    fitSerif(hl, W0 - pad * 2, (tall ? 104 : 74) * k); ctx.fillText(hl, pad, y);
    y += (tall ? 56 : 42) * k; ctx.fillStyle = "#4a463c"; const deck = `${D.title} ${D.post}${h && D.margin ? " · " + (D.te ? `${D.fmt(D.margin)} ఓట్ల మెజారిటీ` : `margin of ${D.fmt(D.margin)} votes`) : ""}`;
    fitSerif(deck, W0 - pad * 2, (tall ? 34 : 26) * k, 600); ctx.fillText(deck, pad, y);
    y += 26 * k; ctx.fillStyle = INK; ctx.fillRect(pad, y, W0 - pad * 2, 1 * k);
    // two columns
    const top = y + 24 * k, colGap = 30 * k, leftW = wide ? (W0 - pad * 2 - colGap) * 0.55 : W0 - pad * 2, rightX = wide ? pad + leftW + colGap : pad;
    let cy = top; ctx.font = D.F(700, 14 * k); ctx.fillStyle = "#7a7465"; ctx.fillText(D.T.cands(D.post), pad, cy + 4 * k); cy += 20 * k;
    D.cands.slice(0, tall ? 4 : 3).forEach((c) => {
      const rh = (tall ? 86 : 62) * k;
      u.logoDisc(ctx, D, { ...c, isHead: false }, pad + rh * 0.42, cy + rh / 2, rh * 0.36, D.r && !c.isHead);
      ctx.textAlign = "left"; ctx.fillStyle = INK; fitSerif(c.name, leftW - rh - 110 * k, (tall ? 32 : 24) * k, 800); ctx.fillText(c.name, pad + rh, cy + rh / 2 + 2 * k);
      ctx.fillStyle = "#6b6556"; ctx.font = D.F(600, 15 * k); ctx.fillText(c.partyName + (c.reported ? D.T.reported : ""), pad + rh, cy + rh / 2 + 24 * k);
      if (c.isHead) { const t = c.won ? D.T.won : D.T.lead; ctx.font = D.F(900, 17 * k); const bw = ctx.measureText(t).width + 22 * k; ctx.fillStyle = c.won ? "#0d6b3d" : "#a1121f"; ctx.fillRect(pad + leftW - bw, cy + rh / 2 - 16 * k, bw, 32 * k); ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText(t, pad + leftW - bw / 2, cy + rh / 2 + 6 * k); }
      ctx.fillStyle = "rgba(27,26,23,.25)"; ctx.fillRect(pad, cy + rh + 4 * k, leftW, 1);
      cy += rh + 10 * k;
    });
    // tally box
    const ty = wide ? top : cy + 20 * k, tw = wide ? W0 - pad - rightX : W0 - pad * 2, th = Math.max(150 * k, (H0 - 120 * k) - ty);
    ctx.strokeStyle = INK; ctx.lineWidth = 2 * k; ctx.strokeRect(rightX, ty, tw, th);
    ctx.fillStyle = INK; ctx.fillRect(rightX, ty, tw, 40 * k); ctx.fillStyle = "#f3eee1"; ctx.textAlign = "left"; ctx.font = D.F(800, 17 * k); ctx.fillText(D.T.wardsT(D.b), rightX + 16 * k, ty + 27 * k);
    ctx.textAlign = "right"; ctx.font = `700 ${18 * k}px "JetBrains Mono", monospace`; ctx.fillText(D.r ? `${D.dec}/${D.total}` : `—/${D.total}`, rightX + tw - 16 * k, ty + 27 * k);
    let ry = ty + 74 * k;
    if (!D.r) { ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = D.F(700, 20 * k); ctx.fillText(D.T.countStart, rightX + 16 * k, ry); }
    D.rows.slice(0, 5).forEach((p) => {
      if (ry > ty + th - 20 * k) return;
      ctx.textAlign = "left"; ctx.fillStyle = D.COL[p]; ctx.fillRect(rightX + 16 * k, ry - 14 * k, 14 * k, 14 * k);
      ctx.fillStyle = INK; ctx.font = D.F(700, 19 * k); ctx.fillText(D.pshort(p), rightX + 40 * k, ry);
      ctx.textAlign = "right"; ctx.font = `700 ${22 * k}px "JetBrains Mono", monospace`; ctx.fillText(`${D.wards[p] || 0}${D.leads[p] ? ` +${D.leads[p]}` : ""}`, rightX + tw - 16 * k, ry + 1 * k);
      ry += 36 * k;
    });
    if (D.r && ry + 30 * k < ty + th) { u.wardsBar(ctx, D, rightX + 16 * k, ry, tw - 32 * k, 12 * k, false); ctx.fillStyle = "#6b6556"; ctx.textAlign = "left"; ctx.font = D.F(600, 13 * k); ctx.fillText(D.T.majority(D.need), rightX + 16 * k, ry + 36 * k); }
    const fy = H0 - 92 * k; ctx.fillStyle = INK; ctx.fillRect(pad, fy - 12 * k, W0 - pad * 2, 2 * k);
    u.brand(ctx, D, pad, fy, wide ? k * 0.9 : k, false); u.stamp(ctx, D, W0 - pad, fy + 30 * k, k, false);
  }

  // ---------- 4. Ward mosaic ----------
  function mosaic(ctx, D) {
    const u = U(), { W0, H0 } = D, k = D.k, pad = 50 * k, tall = isTall(D), wide = isWide(D);
    const h = headOf(D), acc = h ? D.COL[h.p] : "#d4a000";
    ctx.fillStyle = "#fffdf6"; ctx.fillRect(0, 0, W0, H0);
    const g = ctx.createRadialGradient(W0, 0, 10, W0, 0, W0 * 0.8); g.addColorStop(0, acc + "33"); g.addColorStop(1, acc + "00"); ctx.fillStyle = g; ctx.fillRect(0, 0, W0, H0);
    ctx.fillStyle = acc; ctx.fillRect(0, 0, W0, 8 * k);
    ctx.textAlign = "left"; ctx.fillStyle = "#b97800"; u.fitText(ctx, D, D.T.top(D.post), W0 * 0.6, 17 * k, 700); ctx.fillText(D.T.top(D.post), pad, 60 * k);
    D.pill(ctx, W0 - pad, 32 * k, k, false);
    ctx.fillStyle = "#111827"; u.fitText(ctx, D, D.title, W0 - pad * 2, (tall ? 84 : 58) * k); ctx.fillText(D.title, pad, (tall ? 160 : 128) * k);
    ctx.fillStyle = "#5b6475"; u.fitText(ctx, D, D.sub, W0 - pad * 2, 18 * k, 500); ctx.fillText(D.sub, pad, (tall ? 200 : 158) * k);
    // honeycomb: one hexagon per ward
    const area = wide ? { x: pad, y: 190 * k, w: W0 * 0.56, h: H0 - 300 * k } : { x: pad, y: (tall ? 240 : 190) * k, w: W0 - pad * 2, h: H0 * (tall ? 0.4 : 0.36) };
    const n = D.total; let best = { r: 0 };
    for (let c = 1; c <= n; c++) { const rows = Math.ceil(n / c), r = Math.min(area.w / ((c + 0.5) * Math.sqrt(3)), area.h / ((rows - 1) * 1.5 + 2)); if (r > best.r) best = { r, c, rows }; }
    const r = best.r, hw = Math.sqrt(3) * r, ox = area.x + (area.w - (best.c + 0.5) * hw) / 2 + hw / 2, oy = area.y + (area.h - ((best.rows - 1) * 1.5 + 2) * r) / 2 + r;
    wardSeq(D).forEach((w, i) => {
      const row = Math.floor(i / best.c), col = i % best.c, x = ox + col * hw + (row % 2 ? hw / 2 : 0), y = oy + row * 1.5 * r;
      hexPath(ctx, x, y, r * 0.9);
      if (w.kind === "pending") { ctx.fillStyle = "#ebe7da"; ctx.fill(); }
      else if (w.kind === "lead") { ctx.fillStyle = D.COL[w.p] + "55"; ctx.fill(); ctx.strokeStyle = D.COL[w.p]; ctx.lineWidth = Math.max(1, r * 0.12); ctx.stroke(); }
      else { ctx.fillStyle = D.COL[w.p]; ctx.fill(); }
    });
    if (!D.r) { ctx.textAlign = "center"; ctx.fillStyle = "#111827"; ctx.font = D.F(800, 26 * k); const t = D.T.countStart, tw = ctx.measureText(t).width + 40 * k; ctx.fillStyle = "rgba(255,253,246,.92)"; u.rr(ctx, area.x + area.w / 2 - tw / 2, area.y + area.h / 2 - 30 * k, tw, 52 * k, 26 * k); ctx.fill(); ctx.fillStyle = "#111827"; ctx.fillText(t, area.x + area.w / 2, area.y + area.h / 2 + 5 * k); }
    // side / bottom panel
    const px = wide ? area.x + area.w + 36 * k : pad, pw = wide ? W0 - px - pad : W0 - pad * 2; let y = wide ? area.y + 20 * k : area.y + area.h + 54 * k;
    ctx.textAlign = "left"; ctx.fillStyle = "#111827"; ctx.font = `700 ${(tall ? 60 : 46) * k}px "JetBrains Mono", monospace`; ctx.fillText(`${D.dec}/${D.total}`, px, y + 20 * k);
    y += 50 * k; ctx.fillStyle = "#5b6475"; ctx.font = D.F(600, 17 * k); ctx.fillText(`${D.T.declared} · ${D.T.majority(D.need)}`, px, y);
    y += 30 * k;
    D.rows.slice(0, 4).forEach((p) => { ctx.fillStyle = D.COL[p]; hexPath(ctx, px + 10 * k, y - 7 * k, 10 * k); ctx.fill(); ctx.fillStyle = "#111827"; ctx.textAlign = "left"; ctx.font = D.F(700, 20 * k); ctx.fillText(D.pshort(p), px + 30 * k, y); ctx.textAlign = "right"; ctx.font = `700 ${22 * k}px "JetBrains Mono", monospace`; ctx.fillText(`${D.wards[p] || 0}${D.leads[p] ? ` +${D.leads[p]}` : ""}`, px + pw, y); y += 34 * k; });
    if (h) {
      y += 14 * k; const bh = (tall ? 92 : 74) * k;
      if (y + bh < H0 - 110 * k) {
        ctx.fillStyle = acc + "1f"; u.rr(ctx, px, y, pw, bh, 16 * k); ctx.fill(); ctx.strokeStyle = acc; ctx.lineWidth = 2 * k; ctx.stroke();
        u.logoDisc(ctx, D, { ...h, isHead: false }, px + bh / 2, y + bh / 2, bh * 0.32, false);
        ctx.textAlign = "left"; ctx.fillStyle = "#111827"; u.fitText(ctx, D, h.name, pw - bh - 20 * k, (tall ? 28 : 22) * k); ctx.fillText(h.name, px + bh, y + bh / 2);
        ctx.fillStyle = "#5b6475"; ctx.font = D.F(700, 15 * k); ctx.fillText(`${D.post} · ${h.won ? D.T.won : D.T.lead}${D.margin ? " · " + D.T.by(D.fmt(D.margin)) : ""}`, px + bh, y + bh / 2 + 22 * k);
      }
    }
    const fy = H0 - 92 * k; u.brand(ctx, D, pad, fy, wide ? k * 0.9 : k, false); u.stamp(ctx, D, W0 - pad, fy + 30 * k, k, false);
  }

  // ---------- 5. Statewide (all 100 bodies): white card with the full standings table ----------
  // D.agg: { wards, leads, headW, headL (by party), declared, total, heads, reporting }
  function statewide(ctx, D) {
    const u = U(), { W0, H0 } = D, k = D.k, pad = 50 * k, tall = isTall(D), wide = isWide(D), A = D.agg;
    const KUT = ["TDP", "JSP", "BJP"], sum = (o, ps) => ps.reduce((a, p) => a + (o[p] || 0), 0);
    const INK = "#111827", MUT = "#5b6475", LINE = "#e7e7e1";
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W0, H0);
    const g = ctx.createRadialGradient(W0, 0, 10, W0, 0, W0 * 0.7); g.addColorStop(0, "rgba(212,160,0,.16)"); g.addColorStop(1, "rgba(212,160,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W0, H0);
    ctx.fillStyle = "#d4a000"; ctx.fillRect(0, 0, W0 * 0.62, 8 * k); ctx.fillStyle = "#1d5fc4"; ctx.fillRect(W0 * 0.62, 0, W0 * 0.38, 8 * k);
    // header
    ctx.textAlign = "left"; ctx.fillStyle = "#b97800";
    const top = D.te ? "ఏపీ పురపాలక ఎన్నికలు 2026" : "AP URBAN LOCAL BODY ELECTIONS 2026";
    u.fitText(ctx, D, top, W0 * 0.6, 18 * k, 700); ctx.fillText(top, pad, (tall ? 72 : 56) * k);
    D.pill(ctx, W0 - pad, (tall ? 44 : 28) * k, k, false);
    let y = (tall ? 160 : wide ? 108 : 124) * k;
    ctx.fillStyle = INK; const title = D.te ? "పార్టీల వారీ ఫలితాలు" : "Party standings";
    u.fitText(ctx, D, title, W0 - pad * 2, (tall ? 84 : wide ? 46 : 58) * k); ctx.fillText(title, pad, y);
    y += (D.te ? (tall ? 64 : wide ? 42 : 54) : (tall ? 40 : 30)) * k; ctx.fillStyle = MUT;
    const sub = D.te ? `100 మేయర్ / చైర్‌పర్సన్ పదవులు · ${D.fmt(A.total)} వార్డులు · ${D.fmt(A.declared)} ప్రకటించారు` : `100 Mayor / Chairperson posts · ${D.fmt(A.total)} wards · ${D.fmt(A.declared)} declared`;
    u.fitText(ctx, D, sub, W0 - pad * 2, (tall ? 22 : 17) * k, 600); ctx.fillText(sub, pad, y);
    // table
    const rows = [["TDP"], ["JSP"], ["BJP"], ["KUT"], ["YSRCP"], ["INC"], ["LEFT"], ["OTH"]];
    const val = (p, o) => (p === "KUT" ? sum(o, KUT) : o[p] || 0);
    const cols = D.te ? ["పార్టీ", "పదవులు గెలుపు", "ఆధిక్యం", "వార్డులు", "ఆధిక్యం", "వాటా"] : ["Party", "Posts won", "Leading", "Wards won", "Leading", "Ward share"];
    const tx = pad, tw = W0 - pad * 2, colX = [0, 0.4, 0.53, 0.66, 0.8, 1].map((f) => tx + tw * f);
    const hH = (tall ? 58 : wide ? 34 : 44) * k, rH = (tall ? 96 : wide ? 42 : 64) * k;
    y += (tall ? 44 : wide ? 18 : 30) * k;
    ctx.fillStyle = "#f3f2ec"; u.rr(ctx, tx, y, tw, hH, 10 * k); ctx.fill();
    ctx.fillStyle = MUT; ctx.font = D.F(700, (tall ? 17 : 13) * k);
    cols.forEach((c, i) => { ctx.textAlign = i ? "right" : "left"; ctx.fillText(c, i ? colX[i] - 14 * k : tx + 16 * k, y + hH * 0.64); });
    y += hH;
    const decl = A.declared || 0;
    rows.forEach(([p]) => {
      const kut = p === "KUT", w = val(p, A.headW), l = val(p, A.headL), ww = val(p, A.wards), wl = val(p, A.leads);
      if (kut) { ctx.fillStyle = "#fdf6dc"; ctx.fillRect(tx, y, tw, rH); }
      ctx.fillStyle = LINE; ctx.fillRect(tx, y + rH - 1, tw, 1);
      const cy = y + rH / 2, ls = rH * 0.62;
      if (kut) { ctx.fillStyle = "#d4a000"; u.rr(ctx, tx + 12 * k, cy - ls / 2, ls, ls, 8 * k); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = `900 ${ls * 0.42}px "Inter Tight"`; ctx.textAlign = "center"; ctx.fillText("NDA", tx + 12 * k + ls / 2, cy + ls * 0.15); }
      else {
        ctx.fillStyle = "#fff"; u.rr(ctx, tx + 12 * k, cy - ls / 2, ls, ls, 8 * k); ctx.fill(); ctx.strokeStyle = D.COL[p]; ctx.lineWidth = 2 * k; ctx.stroke();
        const im = D.logos[p]; if (im) { const kk = Math.min((ls - 6) / im.width, (ls - 6) / im.height); ctx.drawImage(im, tx + 12 * k + (ls - im.width * kk) / 2, cy - (im.height * kk) / 2, im.width * kk, im.height * kk); }
        else { ctx.fillStyle = MUT; ctx.font = `800 ${ls * 0.3}px "Inter Tight"`; ctx.textAlign = "center"; ctx.fillText("IND", tx + 12 * k + ls / 2, cy + ls * 0.1); }
      }
      const name = kut ? (D.te ? "కూటమి మొత్తం" : "Kutami total") : D.te ? D.pshort(p) : { TDP: "Telugu Desam", JSP: "Jana Sena", BJP: "BJP", YSRCP: "YSR Congress", INC: "Congress", LEFT: "CPI / CPI(M)", OTH: "Independents & others" }[p];
      ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = D.F(kut ? 900 : 700, (tall ? 26 : wide ? 17 : 20) * k);
      u.fitText(ctx, D, name, colX[1] - colX[0] - ls - 60 * k, (tall ? 26 : wide ? 17 : 20) * k, kut ? 900 : 700); ctx.fillText(name, tx + 24 * k + ls, cy + 7 * k);
      const nums = [w, l, ww, wl, decl ? ((ww / decl) * 100).toFixed(1) + "%" : "—"];
      nums.forEach((n, i) => {
        ctx.textAlign = "right"; ctx.fillStyle = i === 0 || i === 2 ? INK : MUT;
        ctx.font = `${i === 0 || i === 2 || kut ? 700 : 500} ${(tall ? 28 : wide ? 18 : 22) * k}px "JetBrains Mono", monospace`;
        ctx.fillText(String(n), colX[i + 1] - 14 * k, cy + 8 * k);
      });
      y += rH;
    });
    // ward progress
    y += (tall ? 50 : wide ? 22 : 34) * k;
    const bH = (tall ? 18 : 12) * k;
    ctx.fillStyle = "#eceae3"; u.rr(ctx, tx, y, tw, bH, bH / 2); ctx.fill();
    ctx.save(); u.rr(ctx, tx, y, tw, bH, bH / 2); ctx.clip(); let bx = tx;
    D.ORDER.forEach((p) => { const n = A.wards[p] || 0; if (!n) return; const w = (tw * n) / A.total; ctx.fillStyle = D.COL[p]; ctx.fillRect(bx, y, w, bH); bx += w; });
    D.ORDER.forEach((p) => { const n = A.leads[p] || 0; if (!n) return; const w = (tw * n) / A.total; ctx.globalAlpha = 0.35; ctx.fillStyle = D.COL[p]; ctx.fillRect(bx, y, w, bH); ctx.globalAlpha = 1; bx += w; });
    ctx.restore();
    ctx.textAlign = "left"; ctx.fillStyle = MUT; ctx.font = D.F(600, (tall ? 17 : 13) * k);
    if (!wide) ctx.fillText(A.reporting ? (D.te ? `వార్డులు: ${D.fmt(A.declared)} / ${D.fmt(A.total)} ప్రకటించారు · లేత రంగు = ఆధిక్యం` : `Wards declared: ${D.fmt(A.declared)} / ${D.fmt(A.total)} · light = leading`) : D.T.countStart, tx, y + bH + (tall ? 30 : 22) * k);
    // footer
    const fy = H0 - (wide ? 80 : tall ? 110 : 92) * k; ctx.fillStyle = LINE; ctx.fillRect(pad, fy - 16 * k, W0 - pad * 2, 1.5);
    u.brand(ctx, D, pad, fy, wide ? k * 0.9 : k, false);
  }

  window.SHARE_TPL = Object.assign(window.SHARE_TPL || {}, { victory, scoreboard, frontpage, mosaic, statewide });
})();
