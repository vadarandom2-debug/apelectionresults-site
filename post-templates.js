// Post maker templates (admin → Post maker): 20 designs for news / breaking-news cards.
// Each template draws onto ctx at P.W × P.H using P = { W, H, k, head, sub, kick, photo, F(weight,size), te, brand(ctx,x,y,dark,scale) }.
// Every design works without a photo (decorative fallback instead).
(() => {
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  function cover(c, img, x, y, w, h) {
    const s = Math.max(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); c.restore();
  }
  // wrap text into lines that fit maxW, shrinking until the block fits maxH
  function fit(c, P, text, maxW, maxH, size, w = 800, lh = 1.22, min = 14) {
    if (text === P.head) min = Math.max(min, size * (String(text).length > 150 ? 0.3 : 0.55)); // the headline never shrinks below ~half size; the news text takes what's left
    let s = size, lines = [];
    for (; s >= min; s -= Math.max(1, s * 0.05)) {
      c.font = P.F(w, s); lines = [];
      for (const para of String(text || "").split(/\n/)) {
        let line = "";
        for (const word of para.split(/\s+/).filter(Boolean)) {
          const t = line ? line + " " + word : word;
          if (c.measureText(t).width <= maxW || !line) line = t; else { lines.push(line); line = word; }
        }
        lines.push(line);
      }
      if (lines.length * s * lh <= maxH && lines.every((l) => c.measureText(l).width <= maxW)) break;
    }
    s = Math.max(s, min);
    const maxLines = Math.max(1, Math.floor(maxH / (s * lh)));
    if (lines.length > maxLines) { lines = lines.slice(0, maxLines); let last = lines[maxLines - 1]; c.font = P.F(w, s); while (last && c.measureText(last + " …").width > maxW) last = last.slice(0, -1); lines[maxLines - 1] = last + " …"; }
    return { lines, size: s, lh: s * lh, w };
  }
  function draw(c, P, B, x, y, align = "left") { c.textAlign = align; c.font = P.F(B.w, B.size); B.lines.forEach((l, i) => c.fillText(l, x, y + B.size + i * B.lh)); c.textAlign = "left"; return y + B.lines.length * B.lh; }
  function hexes(c, W, H, col, a, r = 26) {
    c.save(); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = 1.5;
    const hw = Math.sqrt(3) * r;
    for (let row = -1; row * r * 1.5 < H + r; row++) for (let q = -1; q * hw < W + hw; q++) {
      const x = q * hw + (row % 2 ? hw / 2 : 0), y = row * r * 1.5;
      c.beginPath(); for (let i = 0; i < 6; i++) { const t = (Math.PI / 180) * (60 * i - 30); c.lineTo(x + r * Math.cos(t), y + r * Math.sin(t)); } c.closePath(); c.stroke();
    }
    c.restore();
  }
  const trunc = (c, t, maxW) => { t = String(t || "").replace(/\s+/g, " "); if (c.measureText(t).width <= maxW) return t; while (t && c.measureText(t + " …").width > maxW) t = t.slice(0, -1); return t + " …"; };
  const grad = (c, x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
  const portrait = (P) => P.H / P.W > 1.15;
  const stacked = (P) => P.H / P.W > 0.9; // square and taller: stack photo above text
  const foot = (c, P, dark, pad) => P.brand(c, pad, P.H - pad - 58 * P.k, dark, P.k);
  const footH = (P) => 58 * P.k + 40 * P.k;
  // space left for the news text between y and the logo footer
  const room = (P, y) => Math.max(16 * P.k, P.H - footH(P) - 62 * P.k - y);
  function pill(c, P, text, x, y, bg, fg, size = 20) {
    c.font = P.F(900, size * P.k); const w = c.measureText(text).width + 30 * P.k, h = size * P.k * 1.9;
    c.fillStyle = bg; rr(c, x, y, w, h, h / 2); c.fill(); c.fillStyle = fg; c.fillText(text, x + 15 * P.k, y + h * 0.68); return w;
  }
  function photoOr(c, P, x, y, w, h, fallback) { if (P.photo) cover(c, P.photo, x, y, w, h); else fallback(x, y, w, h); }

  const T = [];
  // 1. Breaking red: full photo, dark gradient, red BREAKING band
  T.push({ id: "breaking", name: "Breaking", draw(c, P) {
    const { W, H, k } = P, pad = 50 * k;
    photoOr(c, P, 0, 0, W, H, () => { c.fillStyle = grad(c, 0, 0, W, H, [[0, "#3b0710"], [1, "#0b0b10"]]); c.fillRect(0, 0, W, H); hexes(c, W, H, "#ff4d5e", 0.12, 30 * k); });
    c.fillStyle = grad(c, 0, H * 0.25, 0, H, [[0, "rgba(0,0,0,0)"], [0.55, "rgba(0,0,0,.75)"], [1, "rgba(0,0,0,.92)"]]); c.fillRect(0, 0, W, H);
    c.fillStyle = "#d10f2f"; c.fillRect(0, pad, W * 0.62, 70 * k); c.fillStyle = "#fff"; c.font = P.F(900, 38 * k); c.fillText(P.kick || "BREAKING NEWS", pad, pad + 50 * k);
    const band = pad + 90 * k, B = fit(c, P, P.head, W - pad * 2, Math.max(60 * k, Math.min(H * (String(P.head).length > 150 ? 0.6 : 0.4), H - footH(P) - pad - band - (P.sub ? P.subR : 0))), (portrait(P) ? 92 : 70) * k);
    const top = Math.max(band, H - footH(P) - pad - B.lines.length * B.lh - (P.sub ? P.subR : 0));
    c.fillStyle = "#fff"; let y = draw(c, P, B, pad, top);
    if (P.sub) { c.fillStyle = "#ffd75a"; const S = fit(c, P, P.sub, W - pad * 2, H - footH(P) - pad - y - 6 * k, 26 * k, 600, 1.34, 10 * P.k); draw(c, P, S, pad, y + 6 * k); }
    foot(c, P, true, pad);
  } });
  // 2. TV ticker: lower-third bars
  T.push({ id: "ticker", name: "TV ticker", draw(c, P) {
    const { W, H, k } = P, pad = 40 * k;
    photoOr(c, P, 0, 0, W, H, () => { c.fillStyle = grad(c, 0, 0, W, H, [[0, "#0d2a5c"], [1, "#081226"]]); c.fillRect(0, 0, W, H); hexes(c, W, H, "#7fb0ff", 0.1, 34 * k); });
    const barY = H - footH(P) - 262 * k;
    c.fillStyle = "#d10f2f"; c.fillRect(pad, barY, 260 * k, 58 * k); c.fillStyle = "#fff"; c.font = P.F(900, 30 * k); c.fillText(P.kick || "BREAKING", pad + 18 * k, barY + 41 * k);
    c.fillStyle = "#fff"; c.fillRect(pad, barY + 58 * k, W - pad * 2, 130 * k);
    const B = fit(c, P, P.head, W - pad * 2 - 40 * k, 118 * k, 50 * k);
    c.fillStyle = "#0b0b10"; draw(c, P, B, pad + 20 * k, barY + 58 * k + (130 * k - B.lines.length * B.lh) / 2 - 4 * k);
    c.fillStyle = "#F5C400"; c.fillRect(pad, barY + 188 * k, W - pad * 2, 44 * k);
    c.fillStyle = "#111"; c.font = P.F(700, 22 * k); c.fillText(trunc(c, P.sub || "apelectionresults.com", W - pad * 2 - 36 * k), pad + 18 * k, barY + 218 * k);
    c.fillStyle = "rgba(0,0,0,.55)"; c.fillRect(0, H - footH(P) - 10 * k, W, footH(P) + 10 * k);
    foot(c, P, true, pad);
  } });
  // 3. Live update: navy, LIVE pill
  T.push({ id: "live", name: "Live update", draw(c, P) {
    const { W, H, k } = P, pad = 56 * k;
    c.fillStyle = "#0a1330"; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(W, 0, 10, W, 0, W); g.addColorStop(0, "rgba(29,95,196,.6)"); g.addColorStop(1, "rgba(29,95,196,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (P.photo) { const s = Math.min(W, H) * 0.32; c.save(); c.beginPath(); c.arc(W - pad - s / 2, pad + s / 2, s / 2, 0, Math.PI * 2); c.clip(); cover(c, P.photo, W - pad - s, pad, s, s); c.restore(); c.strokeStyle = "#ff3b4f"; c.lineWidth = 6 * k; c.beginPath(); c.arc(W - pad - s / 2, pad + s / 2, s / 2, 0, Math.PI * 2); c.stroke(); }
    c.fillStyle = "#ff3b4f"; c.beginPath(); c.arc(pad + 12 * k, pad + 22 * k, 10 * k, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ff6b7a"; c.font = P.F(900, 28 * k); c.fillText(P.kick || "LIVE UPDATE", pad + 34 * k, pad + 32 * k);
    const B = fit(c, P, P.head, W - pad * 2 - (P.photo && !portrait(P) ? Math.min(W, H) * 0.34 : 0), H * 0.5, (portrait(P) ? 84 : 64) * k);
    c.fillStyle = "#fff"; let y = draw(c, P, B, pad, pad + (portrait(P) && P.photo ? Math.min(W, H) * 0.4 : 70 * k));
    if (P.sub) { c.fillStyle = "#9fb4e0"; draw(c, P, fit(c, P, P.sub, W - pad * 2, room(P, y + 10 * k), 28 * k, 500, 1.34, 10 * P.k), pad, y + 10 * k); }
    foot(c, P, true, pad);
  } });
  // 4. Flash yellow
  T.push({ id: "flash", name: "Flash yellow", draw(c, P) {
    const { W, H, k } = P, pad = 56 * k;
    c.fillStyle = "#F5C400"; c.fillRect(0, 0, W, H);
    c.save(); c.globalAlpha = 0.12; c.fillStyle = "#000"; for (let x = -H; x < W; x += 60 * k) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 30 * k, 0); c.lineTo(x + 30 * k + H, H); c.lineTo(x + H, H); c.fill(); } c.restore();
    let y = pad;
    if (P.photo) { const h = H * (portrait(P) ? 0.38 : 0.42); rr(c, pad, y, W - pad * 2, h, 18 * k); c.save(); c.clip(); cover(c, P.photo, pad, y, W - pad * 2, h); c.restore(); y += h + 30 * k; }
    c.fillStyle = "#111"; c.fillRect(pad, y, 12 * k, 64 * k); c.font = P.F(900, 34 * k); c.fillText(P.kick || "FLASH", pad + 26 * k, y + 48 * k); y += 90 * k;
    const B = fit(c, P, P.head, W - pad * 2, H - y - footH(P) - pad - (P.sub ? P.subR : 0), (portrait(P) ? 90 : 66) * k, 900);
    c.fillStyle = "#111"; y = draw(c, P, B, pad, y);
    if (P.sub) { c.fillStyle = "#3a2a00"; draw(c, P, fit(c, P, P.sub, W - pad * 2, room(P, y + 8 * k), 26 * k, 600, 1.34, 10 * P.k), pad, y + 8 * k); }
    foot(c, P, false, pad);
  } });
  // 5. Newspaper
  T.push({ id: "paper", name: "Newspaper", draw(c, P) {
    const { W, H, k } = P, pad = 50 * k, INK = "#1b1a17";
    c.fillStyle = "#f3eee1"; c.fillRect(0, 0, W, H);
    c.fillStyle = INK; c.textAlign = "center"; c.font = P.F(900, 58 * k); c.fillText(P.te ? "ఎన్నికల వార్తలు" : "Election News", W / 2, pad + 50 * k); c.textAlign = "left";
    c.fillRect(pad, pad + 70 * k, W - pad * 2, 3 * k); c.fillRect(pad, pad + 78 * k, W - pad * 2, 1 * k);
    let y = pad + 110 * k;
    c.font = P.F(800, 22 * k); c.fillStyle = "#a1121f"; c.fillText((P.kick || "BREAKING").toUpperCase(), pad, y); y += 14 * k;
    const B = fit(c, P, P.head, W - pad * 2, H * (P.photo ? 0.28 : 0.45), (portrait(P) ? 80 : 58) * k, 900);
    c.fillStyle = INK; y = draw(c, P, B, pad, y) + 14 * k;
    if (P.photo) { const h = H - y - footH(P) - pad - (P.sub ? P.subR : 10 * k); if (h > 80 * k) { cover(c, P.photo, pad, y, W - pad * 2, h); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(pad, y, W - pad * 2, h); y += h + 14 * k; } }
    if (P.sub) { c.fillStyle = "#4a463c"; draw(c, P, fit(c, P, P.sub, W - pad * 2, room(P, y), 26 * k, 600, 1.34, 10 * P.k), pad, y); }
    c.fillStyle = INK; c.fillRect(pad, H - footH(P) - pad + 20 * k, W - pad * 2, 2 * k);
    foot(c, P, false, pad);
  } });
  // 6. Minimal white
  T.push({ id: "minimal", name: "Minimal white", draw(c, P) {
    const { W, H, k } = P, pad = 64 * k;
    c.fillStyle = "#fff"; c.fillRect(0, 0, W, H);
    let y = pad;
    if (P.photo) { const h = H * (portrait(P) ? 0.4 : 0.38); cover(c, P.photo, 0, 0, W, h); y = h + 40 * k; }
    c.fillStyle = "#b97800"; c.font = P.F(800, 24 * k); c.fillText(P.kick || "UPDATE", pad, y + 20 * k); y += 40 * k;
    const B = fit(c, P, P.head, W - pad * 2, H - y - footH(P) - pad - (P.sub ? P.subR : 0), (portrait(P) ? 84 : 62) * k, 800);
    c.fillStyle = "#111827"; y = draw(c, P, B, pad, y);
    c.fillStyle = "#F5C400"; c.fillRect(pad, y + 14 * k, 120 * k, 8 * k);
    if (P.sub) { c.fillStyle = "#5b6475"; draw(c, P, fit(c, P, P.sub, W - pad * 2, room(P, y + 30 * k), 26 * k, 500, 1.34, 10 * P.k), pad, y + 30 * k); }
    foot(c, P, false, pad);
  } });
  // 7. Quote
  T.push({ id: "quote", name: "Quote", draw(c, P) {
    const { W, H, k } = P, pad = 64 * k;
    c.fillStyle = grad(c, 0, 0, W, H, [[0, "#3b2a00"], [1, "#0d0d12"]]); c.fillRect(0, 0, W, H);
    c.fillStyle = "rgba(245,196,0,.9)"; c.font = `900 ${220 * k}px Georgia, serif`; c.fillText("“", pad - 10 * k, pad + 170 * k);
    let x = pad, w = W - pad * 2;
    if (P.photo && !portrait(P)) { const s = H * 0.5; c.save(); c.beginPath(); c.arc(W - pad - s / 2, H * 0.42, s / 2, 0, Math.PI * 2); c.clip(); cover(c, P.photo, W - pad - s, H * 0.42 - s / 2, s, s); c.restore(); w -= s + 30 * k; }
    if (P.photo && portrait(P)) { const s = W * 0.4; c.save(); c.beginPath(); c.arc(W / 2, H * 0.62 + s / 2, s / 2, 0, Math.PI * 2); c.clip(); cover(c, P.photo, W / 2 - s / 2, H * 0.62, s, s); c.restore(); }
    const B = fit(c, P, P.head, w, H * (portrait(P) ? 0.4 : 0.55), (portrait(P) ? 76 : 56) * k, 700, 1.3);
    c.fillStyle = "#fff"; let y = draw(c, P, B, x, pad + 170 * k);
    if (P.sub) { c.fillStyle = "#F5C400"; c.font = P.F(700, 26 * k); draw(c, P, fit(c, P, "— " + P.sub, w, P.subR, 26 * k, 700, 1.34, 10 * k), x, y + 10 * k); }
    foot(c, P, true, pad);
  } });
  // 8. Split left
  T.push({ id: "split", name: "Split photo", draw(c, P) {
    const { W, H, k } = P, port = stacked(P), pad = 50 * k;
    c.fillStyle = "#fff"; c.fillRect(0, 0, W, H);
    const pw = port ? W : W * 0.46, ph = port ? H * 0.45 : H;
    photoOr(c, P, 0, 0, pw, ph, (x, y, w, h) => { c.fillStyle = "#d4a000"; c.fillRect(x, y, w, h); hexes(c, W, H, "#fff", 0.25, 30 * k); });
    c.fillStyle = "#d10f2f"; port ? c.fillRect(0, ph, W, 10 * k) : c.fillRect(pw, 0, 10 * k, H);
    const tx = port ? pad : pw + pad, tw = port ? W - pad * 2 : W - pw - pad * 2, ty = port ? ph + 50 * k : pad + 20 * k;
    c.fillStyle = "#d10f2f"; c.font = P.F(900, 26 * k); c.fillText(P.kick || "NEWS", tx, ty + 10 * k);
    const B = fit(c, P, P.head, tw, H - ty - footH(P) - pad - (P.sub ? P.subR : 20 * k), (port ? 80 : 54) * k, 800);
    c.fillStyle = "#111827"; let y = draw(c, P, B, tx, ty + 30 * k);
    if (P.sub) { c.fillStyle = "#5b6475"; draw(c, P, fit(c, P, P.sub, tw, room(P, y + 10 * k), 24 * k, 500, 1.34, 10 * P.k), tx, y + 10 * k); }
    port ? foot(c, P, false, pad) : P.brand(c, tx, H - pad - 58 * k, false, k * 0.85);
  } });
  // 9. Photo top, text panel
  T.push({ id: "topphoto", name: "Photo + panel", draw(c, P) {
    const { W, H, k } = P, pad = 50 * k, ph = H * (portrait(P) ? 0.52 : 0.5);
    c.fillStyle = "#111827"; c.fillRect(0, 0, W, H);
    photoOr(c, P, 0, 0, W, ph, (x, y, w, h) => { c.fillStyle = grad(c, 0, 0, W, h, [[0, "#d4a000"], [1, "#c4122f"]]); c.fillRect(x, y, w, h); hexes(c, W, h, "#fff", 0.2, 34 * k); });
    pill(c, P, P.kick || "BREAKING", pad, ph - 30 * k, "#d10f2f", "#fff", 22);
    const B = fit(c, P, P.head, W - pad * 2, H - ph - footH(P) - 70 * k - (P.sub ? P.subR : 0), (portrait(P) ? 76 : 50) * k, 800);
    c.fillStyle = "#fff"; let y = draw(c, P, B, pad, ph + 40 * k);
    if (P.sub) { c.fillStyle = "#c7cede"; draw(c, P, fit(c, P, P.sub, W - pad * 2, room(P, y + 6 * k), 24 * k, 500, 1.34, 10 * P.k), pad, y + 6 * k); }
    foot(c, P, true, pad);
  } });
  // 10. Gold gradient
  T.push({ id: "gold", name: "Gold gradient", draw(c, P) {
    const { W, H, k } = P, pad = 60 * k;
    c.fillStyle = grad(c, 0, 0, W, H, [[0, "#f7c600"], [0.55, "#f28c00"], [1, "#c4122f"]]); c.fillRect(0, 0, W, H);
    hexes(c, W, H, "#fff", 0.18, 40 * k);
    if (P.photo) { c.globalAlpha = 0.28; cover(c, P.photo, 0, 0, W, H); c.globalAlpha = 1; }
    c.fillStyle = "#fff"; c.font = P.F(900, 28 * k); c.fillText(P.kick || "BIG NEWS", pad, pad + 24 * k);
    const B = fit(c, P, P.head, W - pad * 2, H * 0.55, (portrait(P) ? 96 : 72) * k, 900);
    c.shadowColor = "rgba(0,0,0,.35)"; c.shadowBlur = 18 * k; c.fillStyle = "#fff"; let y = draw(c, P, B, pad, pad + 60 * k); c.shadowBlur = 0;
    if (P.sub) { c.fillStyle = "#2b1a00"; draw(c, P, fit(c, P, P.sub, W - pad * 2, room(P, y + 10 * k), 28 * k, 700, 1.34, 10 * P.k), pad, y + 10 * k); }
    foot(c, P, true, pad);
  } });
  // 11. Midnight with framed photo
  T.push({ id: "midnight", name: "Midnight", draw(c, P) {
    const { W, H, k } = P, pad = 56 * k, port = portrait(P);
    c.fillStyle = "#070b16"; c.fillRect(0, 0, W, H);
    [["#d4a000", 0, 0.3], ["#1d5fc4", W, 0.7]].forEach(([col, x, yy]) => { const g = c.createRadialGradient(x, H * yy, 10, x, H * yy, W * 0.6); g.addColorStop(0, col + "77"); g.addColorStop(1, col + "00"); c.fillStyle = g; c.fillRect(0, 0, W, H); });
    let tx = pad, tw = W - pad * 2, ty = pad + 30 * k;
    if (P.photo) {
      const fw = port ? W - pad * 2 : W * 0.4, fh = port ? H * 0.36 : H - pad * 2 - footH(P), fx = port ? pad : W - pad - fw, fy = pad;
      rr(c, fx, fy, fw, fh, 22 * k); c.save(); c.clip(); cover(c, P.photo, fx, fy, fw, fh); c.restore(); c.strokeStyle = "#F5C400"; c.lineWidth = 4 * k; rr(c, fx, fy, fw, fh, 22 * k); c.stroke();
      if (port) ty = fy + fh + 50 * k; else tw = W - fw - pad * 3;
    }
    c.fillStyle = "#F5C400"; c.font = P.F(800, 24 * k); c.fillText(P.kick || "AP ELECTIONS", tx, ty);
    const B = fit(c, P, P.head, tw, H - ty - footH(P) - pad - (P.sub ? P.subR : 0), (port ? 78 : 56) * k, 800);
    c.fillStyle = "#fff"; let y = draw(c, P, B, tx, ty + 16 * k);
    if (P.sub) { c.fillStyle = "#9aa4bd"; draw(c, P, fit(c, P, P.sub, tw, room(P, y + 8 * k), 24 * k, 500, 1.34, 10 * P.k), tx, y + 8 * k); }
    foot(c, P, true, pad);
  } });
  // 12. Bold poster: highlighted lines
  T.push({ id: "poster", name: "Bold poster", draw(c, P) {
    const { W, H, k } = P, pad = 56 * k;
    c.fillStyle = "#0b0b0b"; c.fillRect(0, 0, W, H);
    if (P.photo) { c.globalAlpha = 0.35; cover(c, P.photo, 0, 0, W, H); c.globalAlpha = 1; }
    const B = fit(c, P, P.head, W - pad * 2 - 30 * k, H - footH(P) - pad * 3, (portrait(P) ? 110 : 84) * k, 900, 1.3);
    let y = (H - footH(P) - B.lines.length * B.lh) / 2;
    c.font = P.F(900, B.size);
    B.lines.forEach((l, i) => { const w = c.measureText(l).width; c.fillStyle = i % 2 ? "#ffffff" : "#F5C400"; rr(c, pad, y + i * B.lh + B.size * 0.12, w + 30 * k, B.size * 1.12, 8 * k); c.fill(); c.fillStyle = "#0b0b0b"; c.fillText(l, pad + 15 * k, y + i * B.lh + B.size * 0.98); });
    c.fillStyle = "#F5C400"; c.font = P.F(800, 24 * k); c.fillText(P.kick || "", pad, pad + 10 * k);
    foot(c, P, true, pad);
  } });
  // 13. Alert frame
  T.push({ id: "alert", name: "Alert", draw(c, P) {
    const { W, H, k } = P, pad = 64 * k;
    c.fillStyle = "#fff"; c.fillRect(0, 0, W, H);
    c.strokeStyle = "#d10f2f"; c.lineWidth = 16 * k; c.strokeRect(8 * k, 8 * k, W - 16 * k, H - 16 * k);
    const s = 70 * k; c.fillStyle = "#d10f2f"; c.beginPath(); c.moveTo(pad + s / 2, pad); c.lineTo(pad + s, pad + s * 0.88); c.lineTo(pad, pad + s * 0.88); c.closePath(); c.fill();
    c.fillStyle = "#fff"; c.font = `900 ${42 * k}px "Inter Tight"`; c.textAlign = "center"; c.fillText("!", pad + s / 2, pad + s * 0.78); c.textAlign = "left";
    c.fillStyle = "#d10f2f"; c.font = P.F(900, 34 * k); c.fillText(P.kick || "ALERT", pad + s + 20 * k, pad + s * 0.7);
    let y = pad + s + 30 * k;
    if (P.photo) { const h = H * 0.32; cover(c, P.photo, pad, y, W - pad * 2, h); y += h + 26 * k; }
    const B = fit(c, P, P.head, W - pad * 2, H - y - footH(P) - pad - (P.sub ? P.subR : 0), (portrait(P) ? 80 : 58) * k, 900);
    c.fillStyle = "#111827"; y = draw(c, P, B, pad, y);
    if (P.sub) { c.fillStyle = "#5b6475"; draw(c, P, fit(c, P, P.sub, W - pad * 2, room(P, y + 8 * k), 24 * k, 500, 1.34, 10 * P.k), pad, y + 8 * k); }
    foot(c, P, false, pad);
  } });
  // 14. Hex brand
  T.push({ id: "hex", name: "Hex brand", draw(c, P) {
    const { W, H, k } = P, pad = 60 * k;
    c.fillStyle = "#fffdf6"; c.fillRect(0, 0, W, H); hexes(c, W, H, "#d4a000", 0.22, 36 * k);
    c.fillStyle = "#111827"; c.fillRect(0, 0, 14 * k, H); c.fillStyle = "#F5C400"; c.fillRect(14 * k, 0, 6 * k, H);
    let y = pad;
    if (P.photo) { const s = Math.min(W, H) * 0.34, cx = W - pad - s / 2, cy = pad + s / 2; c.save(); c.beginPath(); for (let i = 0; i < 6; i++) { const t = (Math.PI / 180) * (60 * i - 30); c.lineTo(cx + (s / 2) * Math.cos(t), cy + (s / 2) * Math.sin(t)); } c.closePath(); c.clip(); cover(c, P.photo, cx - s / 2, cy - s / 2, s, s); c.restore(); if (portrait(P)) y = pad + s + 20 * k; }
    c.fillStyle = "#b97800"; c.font = P.F(800, 24 * k); c.fillText(P.kick || "AP ELECTION UPDATE", pad, y + 20 * k);
    const w = W - pad * 2 - (P.photo && !portrait(P) ? Math.min(W, H) * 0.36 : 0);
    const B = fit(c, P, P.head, w, H - y - footH(P) - pad - (P.sub ? P.subR : 0) - 40 * k, (portrait(P) ? 82 : 60) * k, 900);
    c.fillStyle = "#111827"; let yy = draw(c, P, B, pad, y + 40 * k);
    if (P.sub) { c.fillStyle = "#5b6475"; draw(c, P, fit(c, P, P.sub, w, room(P, yy + 8 * k), 24 * k, 500, 1.34, 10 * P.k), pad, yy + 8 * k); }
    foot(c, P, false, pad);
  } });
  // 15. Polaroid
  T.push({ id: "polaroid", name: "Polaroid", draw(c, P) {
    const { W, H, k } = P, pad = 50 * k, port = stacked(P);
    c.fillStyle = "#e9e4d8"; c.fillRect(0, 0, W, H);
    const cw = port ? Math.min(W * 0.82, (H - 420 * k) / 1.12) : W * 0.42, ch = cw * 1.12, cx = port ? (W - cw) / 2 : pad + 10 * k, cy = port ? pad + 20 * k : (H - ch) / 2 - 10 * k;
    c.save(); c.translate(cx + cw / 2, cy + ch / 2); c.rotate(-0.04); c.shadowColor = "rgba(0,0,0,.25)"; c.shadowBlur = 30 * k; c.fillStyle = "#fff"; c.fillRect(-cw / 2, -ch / 2, cw, ch); c.shadowBlur = 0;
    const iw = cw - 40 * k, ih = ch - 110 * k;
    if (P.photo) cover(c, P.photo, -cw / 2 + 20 * k, -ch / 2 + 20 * k, iw, ih); else { c.fillStyle = "#F5C400"; c.fillRect(-cw / 2 + 20 * k, -ch / 2 + 20 * k, iw, ih); hexes(c, iw, ih, "#fff", 0.3, 20 * k); }
    c.fillStyle = "#111"; c.font = P.F(800, 26 * k); c.fillText(P.kick || "AP 2026", -cw / 2 + 24 * k, ch / 2 - 34 * k); c.restore();
    const tx = port ? pad : cx + cw + 50 * k, tw = port ? W - pad * 2 : W - tx - pad, ty = port ? cy + ch + 40 * k : pad + 30 * k;
    const B = fit(c, P, P.head, tw, H - ty - footH(P) - pad - (P.sub ? P.subR : 0), (port ? 70 : 54) * k, 800);
    c.fillStyle = "#1b1a17"; let y = draw(c, P, B, tx, ty);
    if (P.sub) { c.fillStyle = "#4a463c"; draw(c, P, fit(c, P, P.sub, tw, room(P, y + 8 * k), 24 * k, 500, 1.34, 10 * P.k), tx, y + 8 * k); }
    port ? foot(c, P, false, pad) : P.brand(c, tx, H - pad - 58 * k, false, k * 0.85);
  } });
  // 16. Headline stack: each line on its own black bar (TV style)
  T.push({ id: "stack", name: "Headline bars", draw(c, P) {
    const { W, H, k } = P, pad = 50 * k;
    photoOr(c, P, 0, 0, W, H, () => { c.fillStyle = grad(c, 0, 0, W, H, [[0, "#1d5fc4"], [1, "#0a1330"]]); c.fillRect(0, 0, W, H); hexes(c, W, H, "#fff", 0.1, 30 * k); });
    const B = fit(c, P, P.head, W - pad * 2 - 40 * k, H * 0.45, (portrait(P) ? 72 : 54) * k, 900, 1.45);
    let y = H - footH(P) - pad - B.lines.length * B.lh - (P.sub ? P.subR : 0);
    pill(c, P, P.kick || "BREAKING", pad, y - 70 * k, "#d10f2f", "#fff", 24);
    c.font = P.F(900, B.size);
    B.lines.forEach((l, i) => { const w = c.measureText(l).width; c.fillStyle = "rgba(10,10,14,.92)"; c.fillRect(pad, y + i * B.lh, w + 40 * k, B.size * 1.35); c.fillStyle = "#fff"; c.fillText(l, pad + 20 * k, y + i * B.lh + B.size * 1.02); });
    if (P.sub) { y += B.lines.length * B.lh + 8 * k; c.font = P.F(700, 24 * k); const st1 = trunc(c, P.sub, W - pad * 2 - 40 * k), w = c.measureText(st1).width; c.fillStyle = "#F5C400"; c.fillRect(pad, y, Math.min(w + 40 * k, W - pad * 2), 40 * k); c.fillStyle = "#111"; c.fillText(st1, pad + 20 * k, y + 29 * k); }
    c.fillStyle = "rgba(0,0,0,.5)"; c.fillRect(0, H - footH(P) - 6 * k, W, footH(P) + 6 * k);
    foot(c, P, true, pad);
  } });
  // 17. Exclusive black & gold
  T.push({ id: "exclusive", name: "Exclusive", draw(c, P) {
    const { W, H, k } = P, pad = 60 * k;
    c.fillStyle = "#0b0b0b"; c.fillRect(0, 0, W, H);
    if (P.photo) { cover(c, P.photo, 0, 0, W, H); c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(0, 0, W, H); }
    c.strokeStyle = "#d4af37"; c.lineWidth = 3 * k; c.strokeRect(24 * k, 24 * k, W - 48 * k, H - 48 * k);
    c.fillStyle = "#d4af37"; c.textAlign = "center"; c.font = P.F(900, 30 * k); c.fillText("★ " + (P.kick || "EXCLUSIVE") + " ★", W / 2, pad + 40 * k);
    const B = fit(c, P, P.head, W - pad * 2.4, H * 0.5, (portrait(P) ? 84 : 62) * k, 800, 1.28);
    const y0 = (H - B.lines.length * B.lh) / 2 - 30 * k; c.fillStyle = "#fff"; let y = draw(c, P, B, W / 2, y0, "center");
    if (P.sub) { c.fillStyle = "#d4af37"; c.textAlign = "center"; draw(c, P, fit(c, P, P.sub, W - pad * 3, room(P, y + 10 * k), 26 * k, 600, 1.34, 10 * P.k), W / 2, y + 10 * k, "center"); }
    c.textAlign = "left"; foot(c, P, true, pad);
  } });
  // 18. Update card
  T.push({ id: "card", name: "Update card", draw(c, P) {
    const { W, H, k } = P, pad = 50 * k;
    c.fillStyle = "#eef1f6"; c.fillRect(0, 0, W, H); hexes(c, W, H, "#9aa4bd", 0.18, 30 * k);
    const cx = pad, cy = pad, cw = W - pad * 2, ch = H - pad * 2 - footH(P);
    c.save(); c.shadowColor = "rgba(17,24,39,.18)"; c.shadowBlur = 40 * k; c.shadowOffsetY = 14 * k; c.fillStyle = "#fff"; rr(c, cx, cy, cw, ch, 28 * k); c.fill(); c.restore();
    let y = cy + 34 * k;
    pill(c, P, P.kick || "UPDATE", cx + 34 * k, y, "#111827", "#F5C400", 20); y += 70 * k;
    if (P.photo) { const h = ch * (portrait(P) ? 0.42 : 0.4); rr(c, cx + 34 * k, y, cw - 68 * k, h, 18 * k); c.save(); c.clip(); cover(c, P.photo, cx + 34 * k, y, cw - 68 * k, h); c.restore(); y += h + 24 * k; }
    const B = fit(c, P, P.head, cw - 68 * k, cy + ch - y - 30 * k - (P.sub ? P.subR : 0), (portrait(P) ? 72 : 50) * k, 800);
    c.fillStyle = "#111827"; y = draw(c, P, B, cx + 34 * k, y);
    if (P.sub) { c.fillStyle = "#5b6475"; draw(c, P, fit(c, P, P.sub, cw - 68 * k, room(P, y + 6 * k), 22 * k, 500, 1.34, 10 * P.k), cx + 34 * k, y + 6 * k); }
    foot(c, P, false, pad);
  } });
  // 19. Telugu classic border
  T.push({ id: "classic", name: "Telugu classic", draw(c, P) {
    const { W, H, k } = P, pad = 70 * k;
    c.fillStyle = "#fff8e1"; c.fillRect(0, 0, W, H);
    const b = 22 * k; c.fillStyle = "#c4122f"; c.fillRect(0, 0, W, b); c.fillRect(0, H - b, W, b); c.fillRect(0, 0, b, H); c.fillRect(W - b, 0, b, H);
    c.fillStyle = "#F5C400"; for (let x = b; x < W - b; x += 26 * k) { c.beginPath(); c.arc(x + 13 * k, b + 9 * k, 7 * k, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(x + 13 * k, H - b - 9 * k, 7 * k, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = "#c4122f"; c.textAlign = "center"; c.font = P.F(900, 32 * k); c.fillText(P.kick || "శుభవార్త", W / 2, pad + 26 * k); c.textAlign = "left";
    let y = pad + 56 * k;
    if (P.photo) { const s = Math.min(W, H) * 0.3; c.save(); c.beginPath(); c.arc(W / 2, y + s / 2, s / 2, 0, Math.PI * 2); c.clip(); cover(c, P.photo, W / 2 - s / 2, y, s, s); c.restore(); c.strokeStyle = "#c4122f"; c.lineWidth = 5 * k; c.beginPath(); c.arc(W / 2, y + s / 2, s / 2, 0, Math.PI * 2); c.stroke(); y += s + 26 * k; }
    const B = fit(c, P, P.head, W - pad * 2, H - y - footH(P) - pad - (P.sub ? P.subR : 0), (portrait(P) ? 80 : 56) * k, 900, 1.3);
    c.fillStyle = "#3a1a00"; y = draw(c, P, B, W / 2, y, "center");
    if (P.sub) { c.fillStyle = "#8a4b00"; draw(c, P, fit(c, P, P.sub, W - pad * 2, room(P, y + 6 * k), 24 * k, 600, 1.34, 10 * P.k), W / 2, y + 6 * k, "center"); }
    foot(c, P, false, pad);
  } });
  // 20. Glass over blurred photo
  T.push({ id: "glass", name: "Glass", draw(c, P) {
    const { W, H, k } = P, pad = 56 * k;
    if (P.photo) { c.save(); c.filter = `blur(${18 * k}px) brightness(.75)`; cover(c, P.photo, -40 * k, -40 * k, W + 80 * k, H + 80 * k); c.restore(); }
    else { c.fillStyle = grad(c, 0, 0, W, H, [[0, "#c4122f"], [0.5, "#f28c00"], [1, "#1d5fc4"]]); c.fillRect(0, 0, W, H); }
    const gx = pad, gy = pad, gw = W - pad * 2, gh = H - pad * 2 - footH(P);
    c.save(); rr(c, gx, gy, gw, gh, 30 * k); c.clip(); c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(gx, gy, gw, gh); c.restore();
    c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = 2 * k; rr(c, gx, gy, gw, gh, 30 * k); c.stroke();
    let y = gy + 40 * k;
    pill(c, P, P.kick || "BREAKING", gx + 36 * k, y, "rgba(209,15,47,.95)", "#fff", 22); y += 76 * k;
    if (P.photo && portrait(P)) { const h = gh * 0.38; rr(c, gx + 36 * k, y, gw - 72 * k, h, 20 * k); c.save(); c.clip(); cover(c, P.photo, gx + 36 * k, y, gw - 72 * k, h); c.restore(); y += h + 24 * k; }
    const B = fit(c, P, P.head, gw - 72 * k, gy + gh - y - 30 * k - (P.sub ? P.subR : 0), (portrait(P) ? 80 : 58) * k, 800);
    c.fillStyle = "#fff"; c.shadowColor = "rgba(0,0,0,.35)"; c.shadowBlur = 12 * k; y = draw(c, P, B, gx + 36 * k, y); c.shadowBlur = 0;
    if (P.sub) { c.fillStyle = "#fff3c4"; draw(c, P, fit(c, P, P.sub, gw - 72 * k, room(P, y + 6 * k), 24 * k, 600, 1.34, 10 * P.k), gx + 36 * k, y + 6 * k); }
    foot(c, P, true, pad);
  } });

  window.POST_TPL = T;
})();
