// Sharing on the ZPTC / MPTC page: one "Share results" sheet with picture choices (state, ZPTC, MPTC, all districts,
// any one district), three sizes, and Share / Save / WhatsApp text. Images: dark title band, white body, no logos.
// Demo images carry the DEMO watermark and the demo text says so.
(() => {
  const { mName, DIST, DBY, COL, SIDES, pName, nf, sum, kut, bySide, state, district, mandal, DEMO } = window.PZ;
  const $ = (s) => document.querySelector(s);
  const SIZES = { square: [1080, 1080], wide: [1200, 675], story: [1080, 1920] };
  const EN = { K: "Kutami (NDA)", Y: "YSRCP", O: "Others" }, TEs = Object.fromEntries(SIDES);
  const F = (w, s, mono) => `${w} ${s}px ${mono ? '"Inter Tight"' : '"Anek Telugu","Inter Tight"'}`;
  const INK = "#111827", MUTE = "#5b6475", LINE = "#e6e6e0", CARD = "#f6f6f2";
  // sets x.font to the largest size (down to ~65% of `size`) at which the text fits; ellipsis only if even that is too wide
  const fitFont = (x, t, w, size, max, mono) => { let z = size; x.font = F(w, z, mono); while (z > size * .65 && x.measureText(t).width > max) { z -= .5; x.font = F(w, z, mono); } return fit(x, t, max); };
  const fit = (x, t, max) => { if (x.measureText(t).width <= max) return t; while (t && x.measureText(t + "…").width > max) t = [...t].slice(0, -1).join(""); return t + "…"; };
  // party symbols: Kutami's alliance emblem, YSRCP's fan, each party's logo
  const loaded = {}, img = (src) => (loaded[src] ||= new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));
  // election symbols where the site has them: cycle, glass, lotus, fan
  const SYM_SRC = { K: "parties/kutami", NDA: "parties/kutami", Y: "symbols/ysrcp-fan", YSRCP: "symbols/ysrcp-fan", TDP: "symbols/tdp-cycle", JSP: "symbols/jsp-glass", BJP: "parties/bjp", INC: "parties/inc", LEFT: "symbols/cpi" };
  let SYM = {};
  function badge(x, k, cx, cy, r) {
    const im = SYM[k]; if (!im) return false;
    x.save(); x.fillStyle = "#fff"; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.lineWidth = Math.max(2, r * .09); x.strokeStyle = COL[k] || COL.O; x.stroke();
    x.beginPath(); x.arc(cx, cy, r * .9, 0, 7); x.clip();
    const f = SYM_SRC[k] === "parties/kutami" ? 1.9 : 1.4, sc = Math.min((r * f) / im.width, (r * f) / im.height);
    x.drawImage(im, cx - (im.width * sc) / 2, cy - (im.height * sc) / 2, im.width * sc, im.height * sc); x.restore(); return true;
  }
  const sizeTo = (x, t, w, s, max, min = 14) => { let z = s; x.font = F(w, z); while (z > min && x.measureText(t).width > max) { z--; x.font = F(w, z); } return z; };

  // ---------- frame ----------
  async function frame(cv, o, title, sub) {
    const [W, H] = SIZES[o.fmt || "square"]; cv.width = W * 2; cv.height = H * 2;
    const x = cv.getContext("2d"); x.setTransform(2, 0, 0, 2, 0, 0);
    SYM = Object.fromEntries(await Promise.all(Object.entries(SYM_SRC).map(async ([k, f]) => [k, await img(`assets/${f}.png`)])));
    const mark = await img("assets/brand/apresults-icon.svg");
    await Promise.all([document.fonts.load('700 40px "Anek Telugu"', "తెలుగు"), document.fonts.load('600 30px "Anek Telugu"', "తెలుగు"), document.fonts.load('700 40px "Inter Tight"', "0")]);
    const pad = Math.round(W * .055), band = H > W ? 210 : W > H ? 128 : 160;
    x.fillStyle = "#fff"; x.fillRect(0, 0, W, H);
    x.fillStyle = "#0f172a"; x.fillRect(0, 0, W, band); x.fillStyle = "#d4a000"; x.fillRect(0, band, W, 6);
    // the site's logo on a white badge at the right of the title band
    const bs = band * .5, bx = W - pad - bs, by = (band - bs) / 2;
    rr(x, bx, by, bs, bs, bs * .26, "#fff"); if (mark) x.drawImage(mark, bx + bs * .14, by + bs * .14, bs * .72, bs * .72);
    x.fillStyle = "#f5c400"; x.font = F(600, band * .15); x.fillText(sub, pad, band * .36);
    x.fillStyle = "#fff"; sizeTo(x, title, 700, band * .3, W - pad * 2 - bs - 20); x.fillText(title, pad, band * .78);
    // footer: the site's logo (hex mark + AP·results) and its address
    const foot = H - 74, fy = foot + 39; x.fillStyle = LINE; x.fillRect(pad, foot, W - pad * 2, 2);
    let lx = pad; if (mark) { x.drawImage(mark, pad, fy - 22, 44, 44); lx += 54; }
    x.textBaseline = "alphabetic"; x.fillStyle = INK; x.font = F(800, 25, true); x.fillText("AP", lx, fy + 2); let wx = lx + x.measureText("AP").width;
    x.fillStyle = "#d4a000"; x.fillText("·", wx + 1, fy + 2); wx += x.measureText("·").width + 2; x.fillStyle = INK; x.fillText("results", wx, fy + 2);
    x.fillStyle = "#b97800"; x.font = F(600, 14); x.fillText("ఎన్నికల ఫలితాలు", lx + 1, fy + 21);
    x.textBaseline = "middle"; x.textAlign = "right"; x.fillStyle = INK; x.font = F(700, 22, true); x.fillText("apelectionresults.com", W - pad, fy); x.textAlign = "left"; x.textBaseline = "alphabetic";
    return { x, W, H, pad, top: band + 6 + pad * .6, bottom: foot - pad * .5, wide: W / H > 1.4, story: H / W > 1.4 };
  }
  function stamp({ x, W, H }, te) {
    if (!DEMO) return;
    x.save(); x.translate(W / 2, H / 2); x.rotate(-.42); x.globalAlpha = .18; x.fillStyle = "#c4122f"; x.textAlign = "center"; x.font = F(700, W * .07); x.fillText(te ? "డెమో · నిజమైన ఫలితాలు కావు" : "DEMO · NOT REAL RESULTS", 0, 0); x.restore();
  }
  const rr = (x, a, b, w, h, r, fill) => { x.fillStyle = fill; x.beginPath(); x.roundRect(a, b, w, h, r); x.fill(); };
  const sideName = (k, te) => (te ? TEs[k] : EN[k]);

  // one seat type: label + progress, three side tiles, a bar
  function section(c, x0, y0, w, h, t, label, te) {
    const { x } = c, s = bySide(t.seats), l = bySide(t.leads), lead = sum(l) > 0;
    rr(x, x0, y0, w, h, 18, CARD);
    const ip = Math.min(22, w * .04), lh = Math.min(34, h * .16);
    x.fillStyle = INK; x.font = F(700, lh); x.fillText(label, x0 + ip, y0 + ip + lh * .8);
    x.textAlign = "right"; x.fillStyle = MUTE; x.font = F(600, lh * .6); x.fillText(te ? `తేలినవి ${nf(t.declared)} / ${nf(t.total)}` : `${nf(t.declared)} of ${nf(t.total)} decided`, x0 + w - ip, y0 + ip + lh * .8); x.textAlign = "left";
    const ty = y0 + ip * 1.6 + lh, th = h - (ty - y0) - ip * 2 - 12, gap = Math.min(12, w * .02), tw = (w - ip * 2 - gap * 2) / 3;
    SIDES.forEach(([k], i) => {
      const tx = x0 + ip + i * (tw + gap), padL = tx + tw * .1, split = k === "K" && !t.seats.NDA, num = nf(s[k]);
      const leadTxt = lead && l[k] ? (te ? `+${nf(l[k])} ఆధిక్యం` : `+${nf(l[k])} leading`) : "";
      rr(x, tx, ty, tw, th, 12, "#fff"); x.fillStyle = COL[k]; x.beginPath(); x.roundRect(tx, ty, tw, 7, [12, 12, 0, 0]); x.fill();
      const br = Math.min(th * .2, tw * .17), has = badge(x, k, tx + tw - br - Math.min(12, tw * .06), ty + 7 + br + Math.min(12, th * .06), br);
      const parts = split ? ["TDP", "JSP", "BJP"].filter((p) => t.seats[p]) : [];
      // everything in a tile is laid out in order (number, name, parties, leads); if it is too tall for the tile it all shrinks together
      const plan = (f) => {
        let ns = Math.min(th * .44, tw * .36) * f; x.font = F(700, ns, true);
        while (ns > 12 && x.measureText(num).width > tw * .86 - (has ? br * 2 + 14 : 0)) { ns--; x.font = F(700, ns, true); }
        const nm = Math.min(th * .14, tw * .12) * f, bsz = Math.max(10, Math.min(th * .09, tw * .07) * f);
        x.font = F(600, bsz, true); let lines = parts.length ? 1 : 0, bx = padL;
        const items = parts.map((p) => { const lab = `${te ? pName(p) : p} ${nf(t.seats[p])}`; return { p, lab, w: x.measureText(lab).width + bsz * .85 }; });
        for (const it of items) { if (bx > padL && bx + it.w > tx + tw * .95) { bx = padL; lines++; } it.line = lines - 1; it.x = bx; bx += it.w + bsz * .9; }
        const need = 7 + th * .06 + ns * .95 + nm * 1.35 + (items.length ? bsz * .2 + lines * bsz * 1.45 : 0) + (leadTxt ? nm * 1.5 : 0) + 12;
        return { ns, nm, bsz, items, need };
      };
      let f = 1, P = plan(f); while (P.need > th && f > .45) { f -= .05; P = plan(f); }
      let y = ty + 7 + th * .06 + P.ns * .95;
      x.fillStyle = INK; x.font = F(700, P.ns, true); x.fillText(num, padL, y);
      y += P.nm * 1.35; x.fillStyle = MUTE; x.font = F(600, P.nm); x.fillText(fit(x, sideName(k, te), tw * .84), padL, y);
      if (P.items.length) {
        x.font = F(600, P.bsz, true);
        for (const it of P.items) { const ly = y + P.bsz * 1.5 + it.line * P.bsz * 1.45; x.fillStyle = COL[it.p]; x.beginPath(); x.arc(it.x + P.bsz * .35, ly - P.bsz * .35, P.bsz * .32, 0, 7); x.fill(); x.fillStyle = MUTE; x.fillText(it.lab, it.x + P.bsz * .85, ly); }
        y += P.bsz * 1.5 + (Math.max(...P.items.map((it) => it.line))) * P.bsz * 1.45;
      }
      if (leadTxt) { y += P.nm * 1.4; x.fillStyle = "#b45309"; x.font = F(600, P.nm * .9); x.fillText(leadTxt, padL, y); }
    });
    const by = y0 + h - ip - 10, bw = w - ip * 2; rr(x, x0 + ip, by, bw, 10, 5, "#e3e3dc"); let at = x0 + ip;
    x.save(); x.beginPath(); x.roundRect(x0 + ip, by, bw, 10, 5); x.clip();
    for (const [k] of SIDES) { const ww = (s[k] / t.total) * bw; x.fillStyle = COL[k]; x.fillRect(at, by, ww, 10); at += ww; } x.restore();
  }
  function pair(c, a, b, te) {
    const { W, pad, top, bottom, wide } = c, gap = 18, L = te ? ["జడ్పీటీసీ", "ఎంపీటీసీ"] : ["ZPTC", "MPTC"];
    if (wide) { const w = (W - pad * 2 - gap) / 2; section(c, pad, top, w, bottom - top, a, L[0], te); section(c, pad + w + gap, top, w, bottom - top, b, L[1], te); }
    else { const h = (bottom - top - gap) / 2; section(c, pad, top, W - pad * 2, h, a, L[0], te); section(c, pad, top + h + gap, W - pad * 2, h, b, L[1], te); }
  }

  // ---------- pictures ----------
  async function stateImg(cv, o) {
    const te = o.lang !== "en", S = state(), c = await frame(cv, o, te ? "పరిషత్ ఎన్నికల ఫలితాలు" : "AP ZPTC & MPTC results", te ? "ఆంధ్రప్రదేశ్ · ఏకగ్రీవాలతో కలిపి" : "Andhra Pradesh · with unopposed seats");
    pair(c, S.zptc, S.mptc, te); stamp(c, te);
  }
  const kindImg = (k) => async (cv, o) => {
    const te = o.lang !== "en", t = state()[k], L = k === "zptc" ? (te ? "జడ్పీటీసీ" : "ZPTC") : (te ? "ఎంపీటీసీ" : "MPTC");
    const c = await frame(cv, o, te ? `${L} ఫలితాలు` : `${L} results`, te ? `${nf(t.total)} స్థానాలు · ఏకగ్రీవాలతో కలిపి` : `${nf(t.total)} seats · with unopposed`), { x, W, pad, top, bottom } = c;
    const secH = Math.min((bottom - top) * .5, 400); section(c, pad, top, W - pad * 2, secH, t, te ? "కూటమి · వైసీపీ · ఇతరులు" : "By side", te);
    const P = ["TDP", "JSP", "BJP", ...(t.seats.NDA ? ["NDA"] : []), "YSRCP", "INC", "OTH"], y0 = top + secH + 22, h = Math.min(64, (bottom - y0) / P.length), sz = Math.min(28, h * .5), max = Math.max(1, ...P.map((p) => t.seats[p] || 0));
    P.forEach((p, i) => { const y = y0 + i * h, my = y + h * .62, v = t.seats[p] || 0, bx = pad + (W - pad * 2) * .3, bw = (W - pad * 2) * .5;
      if (!badge(x, p, pad + sz * .55, my - sz * .33, sz * .62)) { x.fillStyle = COL[p]; x.beginPath(); x.arc(pad + sz * .55, my - sz * .33, 8, 0, 7); x.fill(); }
      x.fillStyle = INK; x.font = F(600, sz); x.fillText(te ? pName(p) : p, pad + sz * 1.45, my);
      rr(x, bx, my - sz * .62, bw, sz * .62, 5, "#efefea"); if (v) rr(x, bx, my - sz * .62, Math.max(6, (v / max) * bw), sz * .62, 5, COL[p]);
      x.textAlign = "right"; x.font = F(700, sz, true); x.fillText(nf(v), W - pad, my); x.textAlign = "left"; });
    stamp(c, te);
  };
  async function districtsImg(cv, o) {
    const te = o.lang !== "en", c = await frame(cv, o, te ? "జిల్లాల వారీ జడ్పీటీసీ ఫలితాలు" : "ZPTC results by district", te ? "కూటమి · వైసీపీ · ఇతరులు · మొత్తం స్థానాలు" : "Kutami · YSRCP · Others · total seats");
    const { x, W, pad, top, bottom, story } = c, cols = story ? 1 : 2, per = Math.ceil(DIST.length / cols), gap = 26, cw = (W - pad * 2 - gap * (cols - 1)) / cols;
    const hh = 34, h = (bottom - top - hh) / per, sz = Math.min(24, h * .52), cx = (f) => f * cw;
    for (let col = 0; col < cols; col++) {
      const x0 = pad + col * (cw + gap);
      [["K", .62], ["Y", .79], ["O", .92]].forEach(([k, f]) => { if (!badge(x, k, x0 + cx(f) - 14, top + 10, 15)) rr(x, x0 + cx(f) - 30, top + 8, 30, 8, 4, COL[k]); });
      rr(x, x0 + cw - 30, top + 8, 30, 8, 4, "#c9c9c2");
    }
    DIST.forEach((d, i) => {
      const col = Math.floor(i / per), x0 = pad + col * (cw + gap), y = top + hh + (i % per) * h, my = y + h * .64, t = district(d).zptc, s = bySide(t.seats);
      const lead = SIDES.map(([k]) => k).sort((a, b) => s[b] - s[a])[0];
      if (i % 2 === 0) rr(x, x0 - 8, y, cw + 16, h, 8, CARD);
      x.fillStyle = s[lead] ? COL[lead] : "#d6d6cf"; x.beginPath(); x.arc(x0 + 6, my - sz * .32, 6, 0, 7); x.fill();
      x.fillStyle = INK; x.fillText(fitFont(x, te ? d.te : d.name, 600, sz, cw * .47 - 20), x0 + 20, my);
      x.textAlign = "right"; x.font = F(700, sz * .95, true); [["K", .62], ["Y", .79], ["O", .92]].forEach(([k, f]) => { x.fillStyle = s[k] ? INK : "#b9bcc4"; x.fillText(nf(s[k]), x0 + cx(f), my); });
      x.fillStyle = MUTE; x.font = F(600, sz * .8, true); x.fillText(nf(t.total), x0 + cw, my); x.textAlign = "left";
    });
    stamp(c, te);
  }
  const districtImg = (d) => async (cv, o) => {
    const te = o.lang !== "en", a = district(d), c = await frame(cv, o, te ? `${d.te} జిల్లా పరిషత్ ఫలితాలు` : `${d.name} Zilla Parishad results`, te ? `${d.mandals.length} మండలాలు · ఏకగ్రీవాలతో కలిపి` : `${d.mandals.length} mandals · with unopposed seats`);
    const { x, W, pad, top, bottom, wide, story } = c, gap = 18, ms = d.mandals.filter((m) => !m[2]);
    let y0;
    if (!story) { const w = (W - pad * 2 - gap) / 2, h = (bottom - top) * (wide ? .42 : .34); section(c, pad, top, w, h, a.zptc, te ? "జడ్పీటీసీ" : "ZPTC", te); section(c, pad + w + gap, top, w, h, a.mptc, te ? "ఎంపీటీసీ" : "MPTC", te); y0 = top + h + 20; }
    else { const h = (bottom - top) * .2; section(c, pad, top, W - pad * 2, h, a.zptc, te ? "జడ్పీటీసీ" : "ZPTC", te); section(c, pad, top + h + gap, W - pad * 2, h, a.mptc, te ? "ఎంపీటీసీ" : "MPTC", te); y0 = top + h * 2 + gap + 20; }
    x.fillStyle = INK; x.font = F(700, 20); x.fillText(te ? "మండలాల వారీ జడ్పీటీసీ" : "ZPTC by mandal", pad, y0 + 16);
    const legend = [["TDP"], ["JSP"], ["BJP"], ["YSRCP"], ["OTH"]]; let lx = W - pad; x.font = F(600, 15); x.textAlign = "right";
    for (const [p] of legend.reverse()) { const t = te ? pName(p) : p; x.fillStyle = MUTE; x.fillText(t, lx, y0 + 15); lx -= x.measureText(t).width + 6; x.fillStyle = COL[p]; x.fillRect(lx - 12, y0 + 3, 12, 12); lx -= 24; }
    x.textAlign = "left";
    const gy = y0 + 30, cols = wide ? 5 : story ? 3 : 4, rows = Math.ceil(ms.length / cols), ch = Math.min(story ? 120 : 70, (bottom - gy) / rows), cw = (W - pad * 2 + 6) / cols;
    const sz = Math.min(story ? 26 : 18, ch * .3), sz2 = Math.min(story ? 22 : 15, ch * .25), MN = window.AP_ZP.mptcN || {};
    ms.forEach((m, i) => {
      const r = mandal(d.id, m), z = r.z, xx = pad + (i % cols) * cw, yy = gy + Math.floor(i / cols) * ch, won = z?.status === "won", h = ch - 6;
      rr(x, xx, yy, cw - 6, h, 8, won ? COL[z.party] : z ? "#fff" : "#efefea");
      if (z && !won) { x.strokeStyle = COL[z.party]; x.lineWidth = 2.5; x.beginPath(); x.roundRect(xx + 1, yy + 1, cw - 8, h - 2, 8); x.stroke(); }
      const ink = won ? "#fff" : z ? INK : MUTE;
      x.fillStyle = ink; x.fillText(fitFont(x, te ? mName(d.id, m) : m[1], 600, sz, cw - 22), xx + 9, yy + h * .42);
      // the mandal's MPTC seats: Kutami–YSRCP(–Others) / all MPTC seats in the mandal
      const s2 = bySide(r.m.won || {}), tot = MN[d.id + "/" + m[0]] || 0, got = s2.K + s2.Y + s2.O;
      const line = `${te ? "ఎంపీటీసీ" : "MPTC"} ${s2.K}–${s2.Y}${s2.O ? "–" + s2.O : ""}${tot ? ` / ${tot}` : ""}`;
      x.fillStyle = won ? "rgba(255,255,255,.88)" : got ? INK : MUTE; x.fillText(fitFont(x, line, 600, sz2, cw - 22, true), xx + 9, yy + h * .8);
    });
    x.font = F(500, 14); x.fillStyle = MUTE; x.textAlign = "right";
    x.fillText(te ? "రంగు = జడ్పీటీసీ విజేత · ఎంపీటీసీ: కూటమి–వైసీపీ–ఇతరులు / మొత్తం" : "Colour = ZPTC winner · MPTC: Kutami–YSRCP–Others / all seats", W - pad, Math.min(bottom + 12, gy + rows * ch + 14)); x.textAlign = "left";
    stamp(c, te);
  };

  // ---------- Telugu / English text for WhatsApp ----------
  const line = (t, te) => { const s = bySide(t.seats); return te ? `కూటమి ${nf(s.K)} · వైసీపీ ${nf(s.Y)} · ఇతరులు ${nf(s.O)} (${nf(t.declared)}/${nf(t.total)} తేలాయి)` : `Kutami ${nf(s.K)} · YSRCP ${nf(s.Y)} · Others ${nf(s.O)} (${nf(t.declared)} of ${nf(t.total)} decided)`; };
  function textOf(id, te) {
    const head = DEMO ? (te ? "[డెమో · నిజమైన ఫలితాలు కావు]\n" : "[DEMO · not real results]\n") : "";
    const url = "https://apelectionresults.com";
    if (id.startsWith("d-")) { const d = DBY[id.slice(2)], a = district(d); return `${head}${te ? `${d.te} జిల్లా పరిషత్ ఫలితాలు` : `${d.name} Zilla Parishad results`}\n${te ? "జడ్పీటీసీ" : "ZPTC"}: ${line(a.zptc, te)}\n${te ? "ఎంపీటీసీ" : "MPTC"}: ${line(a.mptc, te)}\n${te ? "మండలాల వారీ ఫలితాలు" : "Mandal-wise results"}: ${url}`; }
    if (id === "districts") return `${head}${te ? "జిల్లాల వారీ జడ్పీటీసీ ఫలితాలు" : "ZPTC results by district"}\n${DIST.map((d) => { const s = bySide(district(d).zptc.seats); return `${te ? d.te : d.name}: ${s.K}-${s.Y}-${s.O}`; }).join("\n")}\n(${te ? "కూటమి-వైసీపీ-ఇతరులు" : "Kutami-YSRCP-Others"})\n${url}`;
    const S = state();
    return `${head}${te ? "పరిషత్ ఎన్నికల ఫలితాలు 2026" : "AP ZPTC & MPTC results 2026"}\n${te ? "జడ్పీటీసీ" : "ZPTC"}: ${line(S.zptc, te)}\n${te ? "ఎంపీటీసీ" : "MPTC"}: ${line(S.mptc, te)}\n${te ? "జిల్లా, మండలాల వారీ ఫలితాలు" : "District and mandal results"}: ${url}`;
  }

  // ---------- the sheet ----------
  const PICS = [["state", "రాష్ట్ర ఫలితాలు", stateImg], ["zptc", "జడ్పీటీసీ", kindImg("zptc")], ["mptc", "ఎంపీటీసీ", kindImg("mptc")], ["districts", "జిల్లాల వారీ", districtsImg], ["dist", "ఒక జిల్లా", null]];
  let pic = "state", dist = DIST[0].id, fmt = "square", lang = "te", busy = false, again = false;
  const drawOf = (p) => (p === "dist" ? districtImg(DBY[dist]) : PICS.find((x) => x[0] === p)[2]);
  const idOf = () => (pic === "dist" ? "d-" + dist : pic);
  const dlg = document.createElement("dialog"); dlg.className = "pz-sheet"; dlg.setAttribute("aria-label", "Share results");
  dlg.innerHTML = `<div class="sh-in"><div class="sh-top"><b>ఫలితాలు షేర్ చేయండి</b><button type="button" class="sh-x" id="shX" aria-label="Close">×</button></div>
    <div class="sh-pick" id="shPick">${PICS.map(([k, t]) => `<button type="button" data-pic="${k}" aria-pressed="${k === pic}"><canvas width="160" height="160"></canvas>${t}</button>`).join("")}</div>
    <div class="sh-row"><select id="shDist" aria-label="District">${DIST.map((d) => `<option value="${d.id}">${d.te} · ${d.name}</option>`).join("")}</select></div>
    <div class="sh-row"><div class="sh-seg" data-grp="fmt"><button type="button" data-v="square" aria-pressed="true">WhatsApp</button><button type="button" data-v="wide" aria-pressed="false">X · Facebook</button><button type="button" data-v="story" aria-pressed="false">Status</button></div>
      <div class="sh-seg" data-grp="lang"><button type="button" data-v="te" aria-pressed="true">తెలుగు</button><button type="button" data-v="en" aria-pressed="false">English</button></div></div>
    <div class="sh-prev"><canvas id="shCv" aria-label="Result picture"></canvas></div>
    <div class="sh-go"><button type="button" class="main" id="shShare">📤 షేర్</button><button type="button" id="shSave">⬇ సేవ్</button><a class="wa" id="shWa" target="_blank" rel="noopener">WhatsApp టెక్స్ట్</a></div>
    <p class="sh-msg" id="shMsg" role="status"></p></div>`;
  document.body.appendChild(dlg);
  const msg = (t) => { $("#shMsg").textContent = t; clearTimeout(msg.h); msg.h = setTimeout(() => ($("#shMsg").textContent = ""), 3500); };

  async function draw() {
    if (busy) { again = true; return; } busy = true;
    try { await drawOf(pic)($("#shCv"), { fmt, lang }); } catch (e) { console.warn(e); msg("చిత్రం తయారు కాలేదు, మళ్లీ ప్రయత్నించండి"); }
    $("#shWa").href = "https://wa.me/?text=" + encodeURIComponent(textOf(idOf(), lang === "te"));
    $("#shDist").parentElement.hidden = pic !== "dist";
    busy = false; if (again) { again = false; draw(); }
  }
  async function thumbs() { // small square previews of each choice
    for (const b of dlg.querySelectorAll("[data-pic]")) { const off = document.createElement("canvas"); await drawOf(b.dataset.pic)(off, { fmt: "square", lang }); const t = b.querySelector("canvas"), g = t.getContext("2d"); g.clearRect(0, 0, 160, 160); g.drawImage(off, 0, 0, 160, 160); }
  }
  function open(id) {
    if (id?.startsWith("d-")) { pic = "dist"; dist = id.slice(2); } else if (id && PICS.some((p) => p[0] === id)) pic = id;
    $("#shDist").value = dist; dlg.querySelectorAll("[data-pic]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.pic === pic));
    dlg.showModal(); draw(); thumbs();
  }
  const blob = () => new Promise((res) => $("#shCv").toBlob(res, "image/png"));
  const fileName = () => `${pic === "dist" ? dist : pic}-${fmt}-${lang === "te" ? "telugu" : "english"}-apelectionresults.png`;
  document.addEventListener("click", async (e) => {
    const s = e.target.closest("[data-share]"); if (s) { e.preventDefault(); return open(s.dataset.share); }
    if (!dlg.contains(e.target)) return;
    if (e.target === dlg || e.target.id === "shX") return dlg.close();
    const p = e.target.closest("[data-pic]"); if (p) { pic = p.dataset.pic; dlg.querySelectorAll("[data-pic]").forEach((b) => b.setAttribute("aria-pressed", b === p)); return draw(); }
    const v = e.target.closest(".sh-seg [data-v]"); if (v) { const g = v.parentElement.dataset.grp; if (g === "fmt") fmt = v.dataset.v; else { lang = v.dataset.v; thumbs(); } v.parentElement.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b === v)); return draw(); }
    if (e.target.closest("#shSave")) { const a = document.createElement("a"); a.href = URL.createObjectURL(await blob()); a.download = fileName(); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); return msg("చిత్రం సేవ్ అయింది"); }
    if (e.target.closest("#shShare")) {
      const f = new File([await blob()], fileName(), { type: "image/png" }), data = { files: [f], text: textOf(idOf(), lang === "te") };
      if (navigator.canShare?.(data)) { try { await navigator.share(data); } catch {} return; }
      try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob() })]); msg("చిత్రం కాపీ అయింది · WhatsApp / X లో పేస్ట్ చేయండి"); }
      catch { const a = document.createElement("a"); a.href = URL.createObjectURL(await blob()); a.download = fileName(); a.click(); msg("చిత్రం సేవ్ అయింది · ఇప్పుడు షేర్ చేయండి"); }
    }
  });
  $("#shDist").addEventListener("change", (e) => { dist = e.target.value; pic = "dist"; dlg.querySelectorAll("[data-pic]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.pic === "dist")); draw(); });

  const fab = document.createElement("button"); fab.type = "button"; fab.className = "pz-fab"; fab.dataset.share = "state"; fab.innerHTML = "📤 ఫలితాలు షేర్ చేయండి";
  document.body.appendChild(fab);
  window.PZ_share = { open, textOf };
})();
