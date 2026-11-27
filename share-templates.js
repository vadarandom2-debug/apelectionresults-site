// Share-image templates beyond "Classic": Face-off, Breaking news and State map (more in share-templates2.js).
// Each gets a prepared data object D from share.js and draws onto a canvas context at W0×H0 (CSS px).
(() => {
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  const darkText = (p) => p === "TDP" || p === "BJP";

  // ---------- shared pieces ----------
  function logoDisc(ctx, D, c, cx, cy, R, dim) {
    ctx.save(); ctx.globalAlpha = dim ? 0.78 : 1;
    ctx.shadowColor = D.COL[c.p]; ctx.shadowBlur = c.isHead ? R * 0.9 : 0;
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = R * 0.09; ctx.strokeStyle = D.COL[c.p]; ctx.stroke();
    const im = D.logos[c.p];
    if (im) { const s = R * 1.25, k = Math.min(s / im.width, s / im.height); ctx.drawImage(im, cx - (im.width * k) / 2, cy - (im.height * k) / 2, im.width * k, im.height * k); }
    else { ctx.fillStyle = "#5b6475"; ctx.font = `800 ${R * 0.45}px "Inter Tight"`; ctx.textAlign = "center"; ctx.fillText("IND", cx, cy + R * 0.16); }
    ctx.restore();
  }
  function wardsBar(ctx, D, x, y, w, h, dark) {
    ctx.fillStyle = dark ? "rgba(255,255,255,.12)" : "#e4e6eb"; rr(ctx, x, y, w, h, h / 2); ctx.fill();
    ctx.save(); rr(ctx, x, y, w, h, h / 2); ctx.clip();
    let bx = x; D.ORDER.forEach((p) => { const n = D.wards[p] || 0; if (!n) return; const ww = (w * n) / D.total; ctx.fillStyle = D.COL[p]; ctx.fillRect(bx, y, ww - 2, h); bx += ww; });
    D.ORDER.forEach((p) => { const n = D.leads[p] || 0; if (!n) return; const ww = (w * n) / D.total; ctx.globalAlpha = 0.35; ctx.fillStyle = D.COL[p]; ctx.fillRect(bx, y, ww - 2, h); ctx.globalAlpha = 1; bx += ww; });
    ctx.restore();
    const mx = x + (w * D.need) / D.total;
    ctx.fillStyle = dark ? "#fff" : "#111827"; ctx.fillRect(mx - 1.5, y - h * 0.45, 3, h * 1.9);
  }
  function legend(ctx, D, x, y, k, dark, maxW) {
    let cx = x; ctx.textAlign = "left";
    D.rows.slice(0, 4).forEach((p) => {
      const label = `${D.pshort(p)} ${D.wards[p] || 0}${D.leads[p] ? `+${D.leads[p]}` : ""}`;
      ctx.font = D.F(700, 19 * k); const w = ctx.measureText(label).width + 30 * k; if (cx + w > x + maxW) return;
      ctx.fillStyle = D.COL[p]; rr(ctx, cx, y - 13 * k, 14 * k, 14 * k, 4 * k); ctx.fill();
      ctx.fillStyle = dark ? "#fff" : "#111827"; ctx.fillText(label, cx + 20 * k, y); cx += w;
    });
  }
  function avatarDisc(ctx, D, x, y, s, ring) {
    ctx.save(); ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s / 2, 0, Math.PI * 2); ctx.closePath();
    if (D.avatar) { ctx.save(); ctx.clip(); ctx.drawImage(D.avatar, x, y, s, s); ctx.restore(); } else { ctx.fillStyle = "#F5C400"; ctx.fill(); }
    ctx.lineWidth = Math.max(2, s * 0.06); ctx.strokeStyle = ring; ctx.stroke(); ctx.restore();
  }
  // Telugu Desam emblem (no text). Returns its width (0 when switched off).
  function tdpMark(ctx, D, x, y, h) {
    if (!D.tdp) return 0;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.25)"; ctx.shadowBlur = h * 0.15;
    ctx.fillStyle = "#fff"; rr(ctx, x, y, h, h, h * 0.22); ctx.fill(); ctx.shadowBlur = 0;
    if (D.tdpLogo) { ctx.save(); rr(ctx, x + h * 0.06, y + h * 0.06, h * 0.88, h * 0.88, h * 0.17); ctx.clip(); ctx.drawImage(D.tdpLogo, x + h * 0.06, y + h * 0.06, h * 0.88, h * 0.88); ctx.restore(); }
    else { ctx.fillStyle = "#F5C400"; rr(ctx, x + h * 0.06, y + h * 0.06, h * 0.88, h * 0.88, h * 0.17); ctx.fill(); }
    ctx.restore();
    return h;
  }
  // the site's hex "A" mark + address (public share images)
  const HEXES = [[30, 0.6], [41.6, 0.6], [24.2, 10.6], [35.8, 10.6], [47.4, 10.6], [18.4, 20.6], [30, 20.6, 1], [41.6, 20.6], [12.6, 30.6], [24.2, 30.6], [35.8, 30.6], [6.8, 40.6], [18.4, 40.6]];
  function siteMark(ctx, D, x, y, s, dark) {
    const f = s / 55;
    HEXES.forEach(([hx, hy, gold]) => {
      const cx = x + hx * f, cy = y + (hy + 6.4) * f, r = 6.4 * f;
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const t = (Math.PI / 180) * (60 * i - 90); ctx.lineTo(cx + r * Math.cos(t), cy + r * Math.sin(t)); } ctx.closePath();
      ctx.fillStyle = gold ? "#F5C400" : dark ? "#fff" : "#111827"; ctx.fill();
    });
    ctx.textAlign = "left"; ctx.font = `800 ${s * 0.44}px "Inter Tight", Arial`;
    let tx = x + s + s * 0.22; const parts = [["apelection", dark ? "#fff" : "#111827"], ["results", "#C99A00"], [".com", dark ? "#fff" : "#111827"]];
    parts.forEach(([t, c]) => { ctx.fillStyle = c; ctx.fillText(t, tx, y + s * 0.58); tx += ctx.measureText(t).width; });
    ctx.fillStyle = dark ? "rgba(255,255,255,.65)" : "#5b6475"; ctx.font = D.F(600, s * 0.24); ctx.fillText(D.te ? "ఏపీ ఎన్నికల ఫలితాలు · లైవ్" : "AP ELECTION RESULTS · LIVE", x + s + s * 0.24, y + s * 0.92);
    return tx;
  }
  // footer brand: @shiva4tdp (avatar + handle) and/or the TDP emblem, each switchable. Returns the right edge.
  function brand(ctx, D, x, y, k, dark) {
    const s = 58 * k; let end = x;
    if (D.shiva) {
      const x0 = end;
      avatarDisc(ctx, D, x0, y, s, "#F5C400");
      ctx.textAlign = "left"; ctx.font = `900 ${30 * k}px "Inter Tight", Arial`;
      let hx = x0 + s + 14 * k; const parts = [["@shiva", dark ? "#fff" : "#111827"], ["4", "#F5C400"], ["tdp", dark ? "#fff" : "#111827"]];
      parts.forEach(([t, c]) => { ctx.fillStyle = c; ctx.fillText(t, hx, y + s * 0.55); hx += ctx.measureText(t).width; });
      ctx.fillStyle = dark ? "rgba(255,255,255,.65)" : "#5b6475"; ctx.font = D.F(600, 14 * k);
      const tagW = ctx.measureText(D.T.tag).width; if (!D.site) ctx.fillText(D.T.tag, x0 + s + 15 * k, y + s * 0.92);
      end = Math.max(hx, D.site ? 0 : x0 + s + 15 * k + tagW) + 26 * k;
    }
    // the site mark follows @shiva4tdp (smaller when both are shown)
    if (D.site) end = siteMark(ctx, D, end, y + (D.shiva ? s * 0.12 : 0), D.shiva ? s * 0.76 : s, dark) + 18 * k;
    return end + tdpMark(ctx, D, end, y, s);
  }
  // footer right side: intentionally empty (no "updated" time or source line on share images)
  function stamp() {}
  function fitText(ctx, D, text, max, size, w = 900) { let s = size; do { ctx.font = D.F(w, s); s -= 1; } while (ctx.measureText(text).width > max && s > 12); }
  const headline = (D) => {
    const h = D.cands.find((c) => c.isHead);
    if (!D.r || !h) return D.te ? "ఫలితం కోసం ఎదురుచూపు" : "AWAITING RESULT";
    return D.te ? `${h.name} ${h.won ? "గెలుపు" : "ఆధిక్యం"}` : `${h.name} ${h.won ? "WINS" : "LEADS"}`;
  };

  // ---------- 1. Face-off poster ----------
  function versus(ctx, D) {
    const { W0, H0 } = D, k = D.k, pad = 54 * k, tall = H0 / W0 > 1.2, wideL = W0 / H0 > 1.4;
    const two = D.cands.slice(0, 2), A = two[0], B = two[1];
    ctx.fillStyle = "#0a0f1d"; ctx.fillRect(0, 0, W0, H0);
    const glow = (x, y, c, a) => { const g = ctx.createRadialGradient(x, y, 10, x, y, W0 * 0.62); g.addColorStop(0, c + a); g.addColorStop(1, c + "00"); ctx.fillStyle = g; ctx.fillRect(0, 0, W0, H0); };
    if (A) glow(B ? W0 * 0.2 : W0 / 2, H0 * 0.5, D.COL[A.p], "aa"); if (B) glow(W0 * 0.8, H0 * 0.5, D.COL[B.p], "88");
    ctx.fillStyle = "rgba(255,255,255,.05)"; for (let x = 12; x < W0; x += 26 * k) for (let y = 12; y < H0; y += 26 * k) ctx.fillRect(x, y, 1.6, 1.6);
    if (B) { ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W0 * 0.56, H0 * 0.27); ctx.lineTo(W0 * 0.44, H0 * 0.73); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = A ? D.COL[A.p] : "#F5C400"; ctx.fillRect(0, 0, W0, 8 * k);
    // header
    ctx.textAlign = "left"; ctx.fillStyle = "#F5C400"; fitText(ctx, D, D.T.top(D.post), W0 * 0.6, 19 * k, 700); ctx.fillText(D.T.top(D.post), pad, 62 * k);
    D.pill(ctx, W0 - pad, 34 * k, k, true);
    // title
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; fitText(ctx, D, D.title, W0 - pad * 2, (tall ? 96 : 72) * k);
    const ty = H0 * (tall ? 0.15 : 0.215); ctx.fillText(D.title, W0 / 2, ty);
    ctx.fillStyle = "rgba(255,255,255,.6)"; fitText(ctx, D, D.sub, W0 - pad * 2, 20 * k, 500); ctx.fillText(D.sub, W0 / 2, ty + 36 * k);
    // candidates
    const cy = H0 * (tall ? 0.42 : wideL ? 0.44 : 0.47), R = (tall ? 120 : wideL ? 60 : 74) * k;
    const mOff = tall ? [160, 192] : wideL ? [116, 138] : [140, 166];
    const col = (c, cx, colW) => {
      if (!c) return;
      logoDisc(ctx, D, c, cx, cy, R, D.r && !c.isHead);
      if (c.isHead) {
        const lab = c.won ? D.T.won : D.T.lead; ctx.font = D.F(900, 22 * k); const lw = ctx.measureText(lab).width + 34 * k;
        ctx.fillStyle = c.won ? "#18a058" : D.COL[c.p]; rr(ctx, cx - lw / 2, cy - R - 19 * k, lw, 38 * k, 19 * k); ctx.fill();
        ctx.lineWidth = 3 * k; ctx.strokeStyle = "#0a0f1d"; ctx.stroke();
        ctx.fillStyle = !c.won && darkText(c.p) ? "#111827" : "#fff"; ctx.textAlign = "center"; ctx.fillText(lab, cx, cy - R + 8 * k);
      }
      ctx.textAlign = "center"; ctx.fillStyle = "#fff"; fitText(ctx, D, c.name, colW, (tall ? 46 : wideL ? 30 : 34) * k);
      ctx.globalAlpha = D.r && !c.isHead ? 0.8 : 1; ctx.fillText(c.name, cx, cy + R + (wideL ? 42 : 50) * k); ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.font = D.F(600, (tall ? 24 : wideL ? 17 : 19) * k); ctx.fillText(c.partyName + (c.reported ? D.T.reported : ""), cx, cy + R + (wideL ? 68 : 82) * k);
      if (c.isHead && D.margin) {
        ctx.fillStyle = D.COL[c.p]; ctx.shadowColor = D.COL[c.p]; ctx.shadowBlur = 24 * k;
        ctx.font = `700 ${(tall ? 64 : wideL ? 38 : 46) * k}px "JetBrains Mono", monospace`; ctx.fillText("+" + D.fmt(D.margin), cx, cy + R + mOff[0] * k); ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.font = D.F(600, 16 * k); ctx.fillText(D.te ? "ఓట్ల మెజారిటీ" : "VOTE MARGIN", cx, cy + R + mOff[1] * k);
      }
    };
    if (A && B) {
      col(A, W0 * 0.26, W0 * 0.42); col(B, W0 * 0.74, W0 * 0.42);
      ctx.fillStyle = "#0a0f1d"; ctx.beginPath(); ctx.arc(W0 / 2, cy, 38 * k, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 3 * k; ctx.strokeStyle = "#F5C400"; ctx.stroke();
      ctx.fillStyle = "#F5C400"; ctx.font = `900 ${30 * k}px "Inter Tight"`; ctx.textAlign = "center"; ctx.fillText("VS", W0 / 2, cy + 11 * k);
    } else if (A) col(A, W0 / 2, W0 * 0.8);
    else { ctx.fillStyle = "#fff"; ctx.font = D.F(700, 30 * k); ctx.textAlign = "center"; ctx.fillText(D.T.none, W0 / 2, cy); }
    // wards
    const by = tall ? H0 * 0.78 : wideL ? H0 - 146 * k : H0 * 0.835 - 18 * k;
    ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.font = D.F(700, 16 * k); ctx.fillText(D.T.wardsT(D.b), pad, by - 20 * k);
    ctx.textAlign = "right"; ctx.fillStyle = "#fff"; ctx.font = `700 ${24 * k}px "JetBrains Mono", monospace`; ctx.fillText(D.r ? `${D.dec}/${D.total}` : D.T.countStart, W0 - pad, by - 18 * k);
    wardsBar(ctx, D, pad, by, W0 - pad * 2, 18 * k, true);
    if (D.r) legend(ctx, D, pad, by + (wideL ? 40 : 50) * k, wideL ? k * 0.85 : k, true, W0 - pad * 2);
    // footer
    const fy = H0 - (wideL ? 80 : 90) * k; brand(ctx, D, pad, fy, wideL ? k * 0.9 : k, true); stamp(ctx, D, W0 - pad, fy + 30 * k, k, true);
  }

  // ---------- 2. Breaking news ----------
  function breaking(ctx, D) {
    const { W0, H0 } = D, k = D.k, pad = 50 * k, tall = H0 / W0 > 1.2, wide = W0 / H0 > 1.4;
    ctx.fillStyle = "#0c0c10"; ctx.fillRect(0, 0, W0, H0);
    const g = ctx.createLinearGradient(0, 0, W0, H0); g.addColorStop(0, "rgba(196,18,47,.28)"); g.addColorStop(0.5, "rgba(196,18,47,0)"); g.addColorStop(1, "rgba(245,196,0,.10)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W0, H0);
    // red band
    const bh = 76 * k; ctx.fillStyle = "#c4122f"; ctx.fillRect(0, 0, W0, bh);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(pad + 9 * k, bh / 2, 9 * k, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = "left"; ctx.font = D.te ? D.F(900, 34 * k) : `900 ${34 * k}px "Inter Tight"`; ctx.fillText(D.te ? "బ్రేకింగ్" : "BREAKING", pad + 30 * k, bh / 2 + 12 * k);
    ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,255,255,.9)"; fitText(ctx, D, D.T.top(D.post), W0 * 0.5, 17 * k, 700); ctx.fillText(D.T.top(D.post), W0 - pad, bh / 2 + 6 * k);
    // headline
    let y = bh + (tall ? 110 : 70) * k;
    ctx.textAlign = "left"; ctx.fillStyle = "#F5C400"; fitText(ctx, D, `${D.title} · ${D.post}`, W0 - pad * 2, (tall ? 44 : 34) * k); ctx.fillText(`${D.title} · ${D.post}`, pad, y);
    y += (tall ? 96 : 70) * k; ctx.fillStyle = "#fff"; const hl = headline(D); fitText(ctx, D, hl, W0 - pad * 2, (tall ? 84 : 64) * k); ctx.fillText(hl, pad, y);
    const head = D.cands.find((c) => c.isHead);
    if (head && D.margin) {
      y += 30 * k; const t = D.te ? `${D.fmt(D.margin)} ఓట్ల మెజారిటీ · ${head.partyName}` : `BY ${D.fmt(D.margin)} VOTES · ${head.partyName.toUpperCase()}`;
      ctx.font = D.F(800, 22 * k); const w = ctx.measureText(t).width + 36 * k;
      ctx.fillStyle = D.COL[head.p]; rr(ctx, pad, y, w, 44 * k, 8 * k); ctx.fill(); ctx.fillStyle = darkText(head.p) ? "#111827" : "#fff"; ctx.fillText(t, pad + 18 * k, y + 30 * k);
      y += 44 * k;
    }
    // scoreboard + ring
    const top = y + (tall ? 70 : 36) * k, ringR = (tall ? 120 : 82) * k;
    const boardW = wide ? W0 - pad * 3 - ringR * 2 : W0 - pad * 2, rowH = (tall ? 84 : 60) * k;
    const rows = D.rows.length ? D.rows.slice(0, 4) : D.cands.slice(0, 3).map((c) => c.p);
    rows.forEach((p, i) => {
      const ry = top + i * (rowH + 10 * k);
      ctx.fillStyle = "rgba(255,255,255,.06)"; rr(ctx, pad, ry, boardW, rowH, 10 * k); ctx.fill();
      ctx.fillStyle = D.COL[p]; ctx.fillRect(pad, ry, 8 * k, rowH);
      const ls = rowH - 18 * k; ctx.fillStyle = "#fff"; rr(ctx, pad + 22 * k, ry + 9 * k, ls, ls, 8 * k); ctx.fill();
      const im = D.logos[p]; if (im) { const kk = Math.min((ls - 8) / im.width, (ls - 8) / im.height); ctx.drawImage(im, pad + 22 * k + (ls - im.width * kk) / 2, ry + 9 * k + (ls - im.height * kk) / 2, im.width * kk, im.height * kk); }
      ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.font = D.F(800, (tall ? 30 : 24) * k); ctx.fillText(D.pshort(p), pad + 36 * k + ls, ry + rowH / 2 + 9 * k);
      ctx.textAlign = "right"; ctx.font = `700 ${(tall ? 46 : 36) * k}px "JetBrains Mono", monospace`; ctx.fillText(String(D.wards[p] || 0), pad + boardW - 70 * k, ry + rowH / 2 + 13 * k);
      if (D.leads[p]) { ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = `700 ${18 * k}px "JetBrains Mono", monospace`; ctx.fillText(`+${D.leads[p]}`, pad + boardW - 18 * k, ry + rowH / 2 + 7 * k); }
    });
    const rcx = wide ? W0 - pad - ringR : W0 / 2, rcy = wide ? top + ringR : top + rows.length * (rowH + 10 * k) + ringR + 40 * k;
    ctx.lineWidth = 16 * k; ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.beginPath(); ctx.arc(rcx, rcy, ringR, 0, Math.PI * 2); ctx.stroke();
    let a0 = -Math.PI / 2; D.ORDER.forEach((p) => { const n = D.wards[p] || 0; if (!n) return; const a1 = a0 + (Math.PI * 2 * n) / D.total; ctx.strokeStyle = D.COL[p]; ctx.beginPath(); ctx.arc(rcx, rcy, ringR, a0, a1 - 0.02); ctx.stroke(); a0 = a1; });
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = `700 ${(tall ? 44 : 32) * k}px "JetBrains Mono", monospace`; ctx.fillText(D.r ? `${D.dec}/${D.total}` : "0/" + D.total, rcx, rcy + 10 * k);
    ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = D.F(600, 15 * k); ctx.fillText(D.T.declared, rcx, rcy + 36 * k);
    // ticker
    const th = 64 * k, ty = H0 - th - 26 * k; ctx.fillStyle = "#F5C400"; ctx.fillRect(0, ty, W0, th);
    ctx.font = `900 ${22 * k}px "Inter Tight"`; const hw = D.shiva ? ctx.measureText("@shiva4tdp").width : 0, ms = th - 16 * k;
    const blockW = (D.shiva ? 14 * k + th + hw + 16 * k : 0) + (D.tdp ? (D.shiva ? 0 : 14 * k) + ms + 14 * k : 0);
    if (blockW) { ctx.fillStyle = "#111827"; ctx.fillRect(0, ty, blockW, th); }
    if (D.shiva) {
      avatarDisc(ctx, D, 14 * k, ty + 6 * k, th - 12 * k, "#F5C400");
      ctx.textAlign = "left"; ctx.fillStyle = "#F5C400"; ctx.font = `900 ${22 * k}px "Inter Tight"`; ctx.fillText("@shiva4tdp", 14 * k + th, ty + th / 2 + 8 * k);
    }
    tdpMark(ctx, D, D.shiva ? 14 * k + th + hw + 14 * k : 14 * k, ty + 8 * k, ms);
    ctx.fillStyle = "#c4122f"; ctx.fillRect(0, H0 - 26 * k, W0, 26 * k);
  }

  // ---------- 3. State map ----------
  const CENTRE = { Srikakulam: [18.35, 84.0], Vizianagaram: [18.25, 83.35], Visakhapatnam: [17.75, 82.75], "East Godavari": [17.05, 82.05], "West Godavari": [16.75, 81.25], Krishna: [16.45, 80.75], Guntur: [16.15, 80.15], Prakasam: [15.45, 79.65], Nellore: [14.45, 79.65], Kadapa: [14.6, 78.65], Kurnool: [15.65, 78.1], Anantapur: [14.55, 77.45], Chittoor: [13.5, 78.95] };
  const CITY = { "greater-visakhapatnam": [17.69, 83.22], vizianagaram: [18.11, 83.4], eluru: [16.71, 81.1], vijayawada: [16.51, 80.65], machilipatnam: [16.19, 81.14], guntur: [16.3, 80.44], ongole: [15.5, 80.05], nellore: [14.44, 79.99], tirupati: [13.63, 79.42], chittoor: [13.22, 79.1], kadapa: [14.47, 78.82], kurnool: [15.83, 78.04], anantapur: [14.68, 77.6] };
  const DIST = { Anakapalli: [17.69, 83.0], Ananthapuramu: [14.68, 77.6], Annamayya: [14.06, 78.75], Bapatla: [15.9, 80.47], Chittoor: [13.22, 79.1], Konaseema: [16.58, 82.0], "East Godavari": [17.0, 81.8], Eluru: [16.71, 81.1], Guntur: [16.3, 80.44], Kakinada: [16.99, 82.25], Krishna: [16.19, 81.14], Kurnool: [15.83, 78.04], Markapuram: [15.73, 79.27], NTR: [16.51, 80.65], Nandyal: [15.48, 78.48], Palnadu: [16.23, 80.05], "Parvathipuram Manyam": [18.78, 83.43], Prakasam: [15.5, 80.05], "SPS Nellore": [14.44, 79.99], "Sri Sathya Sai": [14.17, 77.81], Srikakulam: [18.3, 83.9], Tirupati: [13.63, 79.42], Visakhapatnam: [17.69, 83.22], Vizianagaram: [18.11, 83.4], "West Godavari": [16.54, 81.52], "YSR Kadapa": [14.47, 78.82] };
  const proj = (la, lo) => [(lo - 77) * 40 * 0.96, (19 - la) * 40];
  let HEX = null;
  function hexLayout() {
    if (HEX) return HEX;
    const AC = window.GE_AC || [], S = 10, HW = Math.sqrt(3) * S, cells = [], used = new Set(), out = [], byD = {};
    for (let r = -5; r < 70; r++) for (let q = -40; q < 90; q++) cells.push({ x: HW * (q + r / 2), y: 1.5 * S * r, key: q + "," + r });
    AC.forEach((a) => (byD[a.d] = byD[a.d] || []).push(a));
    const ds = Object.keys(byD), nx = Object.fromEntries(ds.map((d) => [d, 0]));
    for (let left = AC.length; left;) for (const d of ds) {
      if (nx[d] >= byD[d].length) continue; nx[d]++; const [cx, cy] = proj(...CENTRE[d]); let best = null, bd = Infinity;
      for (const c of cells) { if (used.has(c.key)) continue; const dd = (c.x - cx) ** 2 + (c.y - cy) ** 2; if (dd < bd) { bd = dd; best = c; } }
      used.add(best.key); out.push(best); left--;
    }
    const xs = out.map((c) => c.x), ys = out.map((c) => c.y);
    return (HEX = { pts: out, minX: Math.min(...xs) - 20, maxX: Math.max(...xs) + 20, minY: Math.min(...ys) - 20, maxY: Math.max(...ys) + 20 });
  }
  function map(ctx, D) {
    const { W0, H0 } = D, k = D.k, pad = 50 * k, tall = H0 / W0 > 1.2, wide = W0 / H0 > 1.4;
    ctx.fillStyle = "#fbf8f1"; ctx.fillRect(0, 0, W0, H0);
    const g = ctx.createRadialGradient(W0 * 0.2, H0 * 0.4, 10, W0 * 0.2, H0 * 0.4, W0 * 0.8); g.addColorStop(0, "rgba(212,160,0,.16)"); g.addColorStop(1, "rgba(212,160,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W0, H0);
    const head = D.cands.find((c) => c.isHead), accent = head ? D.COL[head.p] : "#c4122f";
    ctx.fillStyle = accent; ctx.fillRect(0, 0, W0, 8 * k);
    // map area
    const area = wide ? { x: pad * 0.6, y: 70 * k, w: W0 * 0.46, h: H0 - 170 * k } : { x: pad, y: 90 * k, w: W0 - pad * 2, h: H0 * (tall ? 0.48 : 0.3) };
    const L = hexLayout(), sc = Math.min(area.w / (L.maxX - L.minX), area.h / (L.maxY - L.minY));
    const ox = area.x + (area.w - (L.maxX - L.minX) * sc) / 2 - L.minX * sc, oy = area.y + (area.h - (L.maxY - L.minY) * sc) / 2 - L.minY * sc;
    const loc = CITY[D.b.id] || DIST[D.b.district] || [16.5, 80.6], [px0, py0] = proj(...loc), PX = ox + px0 * sc, PY = oy + py0 * sc;
    L.pts.forEach((c) => {
      const x = ox + c.x * sc, y = oy + c.y * sc, d = Math.hypot(x - PX, y - PY), near = d < 60 * sc;
      ctx.fillStyle = near ? accent : "#d6ccb1"; ctx.globalAlpha = near ? Math.max(0.25, 1 - d / (60 * sc)) * 0.9 : 1;
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const t = Math.PI / 180 * (60 * i - 30); ctx.lineTo(x + 9.3 * sc * Math.cos(t), y + 9.3 * sc * Math.sin(t)); } ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    });
    [3.2, 2.2, 1.4].forEach((m, i) => { ctx.fillStyle = `rgba(196,18,47,${0.1 + i * 0.12})`; ctx.beginPath(); ctx.arc(PX, PY, 11 * k * m, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#c4122f"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(PX, PY, 10 * k, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.font = D.F(800, 22 * k); const lw = ctx.measureText(D.title).width + 24 * k, lx = Math.min(Math.max(PX - lw / 2, area.x), area.x + area.w - lw);
    ctx.fillStyle = "#111827"; rr(ctx, lx, PY - 62 * k, lw, 38 * k, 19 * k); ctx.fill(); ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText(D.title, lx + lw / 2, PY - 36 * k);
    // result card
    const cx0 = wide ? W0 * 0.5 : pad, cy0 = wide ? 70 * k : area.y + area.h + 30 * k, cw = wide ? W0 * 0.5 - pad : W0 - pad * 2, ch = (wide ? H0 - 112 * k : H0 - 120 * k) - cy0;
    ctx.save(); ctx.shadowColor = "rgba(17,24,39,.16)"; ctx.shadowBlur = 40 * k; ctx.shadowOffsetY = 14 * k; ctx.fillStyle = "#fff"; rr(ctx, cx0, cy0, cw, ch, 26 * k); ctx.fill(); ctx.restore();
    let y = cy0 + 50 * k; const ip = 30 * k;
    ctx.textAlign = "left"; ctx.fillStyle = "#b97800"; fitText(ctx, D, D.T.top(D.post), cw - ip * 2, 16 * k, 700); ctx.fillText(D.T.top(D.post), cx0 + ip, y);
    y += 56 * k; ctx.fillStyle = "#111827"; fitText(ctx, D, D.title, cw - ip * 2, (tall ? 64 : 48) * k); ctx.fillText(D.title, cx0 + ip, y);
    y += 20 * k; D.pill(ctx, cx0 + ip, y, k, false, "left"); y += 70 * k;
    D.cands.slice(0, tall ? 3 : 2).forEach((c) => {
      const rh = (tall ? 96 : 76) * k;
      ctx.fillStyle = c.isHead ? D.COL[c.p] + "1f" : "#f6f4ee"; rr(ctx, cx0 + ip, y, cw - ip * 2, rh, 14 * k); ctx.fill();
      if (c.isHead) { ctx.strokeStyle = D.COL[c.p]; ctx.lineWidth = 2.5 * k; rr(ctx, cx0 + ip, y, cw - ip * 2, rh, 14 * k); ctx.stroke(); }
      logoDisc(ctx, D, { ...c, isHead: false }, cx0 + ip + rh / 2, y + rh / 2, rh * 0.34, false);
      ctx.textAlign = "left"; ctx.fillStyle = "#111827"; fitText(ctx, D, c.name, cw - ip * 2 - rh - (c.isHead ? 150 * k : 20 * k), (tall ? 32 : 26) * k); ctx.fillText(c.name, cx0 + ip + rh, y + rh / 2 + 2 * k);
      ctx.fillStyle = "#5b6475"; ctx.font = D.F(600, 16 * k); ctx.fillText(c.partyName + (c.reported ? D.T.reported : ""), cx0 + ip + rh, y + rh / 2 + 26 * k);
      if (c.isHead) { const t = c.won ? D.T.won : D.T.lead; ctx.font = D.F(900, 20 * k); const bw = ctx.measureText(t).width + 28 * k; ctx.fillStyle = c.won ? "#18a058" : D.COL[c.p]; rr(ctx, cx0 + cw - ip - bw - 14 * k, y + rh / 2 - 20 * k, bw, 40 * k, 20 * k); ctx.fill(); ctx.fillStyle = !c.won && darkText(c.p) ? "#111827" : "#fff"; ctx.textAlign = "center"; ctx.fillText(t, cx0 + cw - ip - bw / 2 - 14 * k, y + rh / 2 + 7 * k); }
      y += rh + 12 * k;
    });
    y += 26 * k; ctx.textAlign = "left"; ctx.fillStyle = "#5b6475"; ctx.font = D.F(700, 15 * k); ctx.fillText(D.T.wardsT(D.b), cx0 + ip, y);
    ctx.textAlign = "right"; ctx.fillStyle = "#111827"; ctx.font = `700 ${24 * k}px "JetBrains Mono", monospace`; ctx.fillText(D.r ? `${D.dec}/${D.total}` : "—", cx0 + cw - ip, y + 2 * k);
    y += 18 * k; wardsBar(ctx, D, cx0 + ip, y, cw - ip * 2, 16 * k, false);
    if (D.r) legend(ctx, D, cx0 + ip, y + 48 * k, k * 0.9, false, cw - ip * 2);
    // footer
    const fy = H0 - 84 * k; brand(ctx, D, pad, fy, k, false); stamp(ctx, D, W0 - pad, fy + 30 * k, k, false);
  }

  window.SHARE_TPL = Object.assign(window.SHARE_TPL || {}, { versus, breaking, map });
  window.SHARE_UTIL = { rr, darkText, logoDisc, wardsBar, legend, avatarDisc, brand, tdpMark, stamp, fitText, headline };
})();
