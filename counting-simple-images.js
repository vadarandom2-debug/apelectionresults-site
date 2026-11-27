// Share images for the three result tabs: 13 Mayors, municipalities, ZPTC, MPTC.
(() => {
  const { DEMO, TE, rec, side, pName, bName, nf, ORDER } = window.CD, { MAYORS, TOWNS, tally, add, COL, ruralNow } = window.CD_simple;
  const SIZES = { wide: [1200, 675], square: [1080, 1080], story: [1080, 1920] };
  const EN = { TDP: "TDP", JSP: "Jana Sena", BJP: "BJP", NDA: "Kutami (NDA)", YSRCP: "YSRCP", INC: "Congress", LEFT: "Left", OTH: "Others" };
  const F = (w, s, mono) => `${w} ${s}px ${mono ? '"JetBrains Mono"' : '"Anek Telugu","Inter Tight"'}`;
  const loaded = {}; const img = (src) => (loaded[src] ||= new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));

  async function frame(cv, o, title, sub) {
    const [W, H] = SIZES[o.fmt || "square"]; cv.width = W * 2; cv.height = H * 2;
    const x = cv.getContext("2d"); x.setTransform(2, 0, 0, 2, 0, 0);
    await Promise.all([document.fonts.load('800 40px "Anek Telugu"', "తెలుగు"), document.fonts.load('600 30px "Anek Telugu"', "తెలుగు"), document.fonts.load('700 30px "JetBrains Mono"')]);
    const [tdp, av] = await Promise.all([img("assets/parties/tdp.png"), img("assets/brand/shiva4tdp-avatar.jpg")]);
    const pad = W * .05, k = Math.min(W / 1080, H / 675 > 1.4 ? 1 : .86);
    x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); x.fillStyle = "#d4a000"; x.fillRect(0, 0, W, 12);
    x.fillStyle = "#b97800"; x.font = F(700, 26 * k); x.textBaseline = "alphabetic"; x.fillText(sub, pad, 60 * k + 12);
    x.fillStyle = "#111827"; x.font = F(800, 58 * k); x.fillText(title, pad, 126 * k + 12);
    const foot = H - 64;
    x.strokeStyle = "#e4e4de"; x.lineWidth = 2; x.beginPath(); x.moveTo(pad, foot); x.lineTo(W - pad, foot); x.stroke();
    let fx = pad; const mid = foot + 34;
    if (o.tdp && tdp) { x.drawImage(tdp, fx, mid - 21, 42, 42); fx += 52; }
    if (o.shiva) { if (av) { x.save(); x.beginPath(); x.arc(fx + 21, mid, 21, 0, 7); x.clip(); x.drawImage(av, fx, mid - 21, 42, 42); x.restore(); fx += 52; } x.fillStyle = "#111827"; x.font = F(700, 24); x.textBaseline = "middle"; x.fillText("@shiva4tdp", fx, mid); }
    x.textBaseline = "middle"; x.textAlign = "right"; x.fillStyle = "#5b6475"; x.font = F(700, 24); x.fillText("apelectionresults.com", W - pad, mid); x.textAlign = "left"; x.textBaseline = "alphabetic";
    return { x, W, H, pad, k, top: 156 * k + 12, bottom: foot - 16 };
  }
  function stamp({ x, W, H }, te) {
    if (!DEMO) return;
    x.save(); x.translate(W / 2, H / 2); x.rotate(-.42); x.globalAlpha = .2; x.fillStyle = "#c4122f"; x.textAlign = "center"; x.font = F(800, W * .075); x.fillText(te ? "డెమో · నిజమైన ఫలితాలు కావు" : "DEMO · NOT REAL RESULTS", 0, 0); x.restore();
  }
  const fitText = (x, t, max) => { if (x.measureText(t).width <= max) return t; while (t && x.measureText(t + "…").width > max) t = [...t].slice(0, -1).join(""); return t + "…"; };

  function partyRows(c, rows, head, te) {
    const { x, W, pad, top, bottom } = c, h = Math.min(92, (bottom - top - 44) / rows.length), cols = head.length - 1, colW = (W - pad * 2) * (cols > 1 ? .2 : .32);
    x.font = F(600, 22); x.fillStyle = "#5b6475"; x.textAlign = "right"; head.slice(1).forEach((t, i) => x.fillText(t, W - pad - colW * (cols - 1 - i), top + 24)); x.textAlign = "left";
    rows.forEach((r, i) => {
      const y = top + 40 + i * h; if (r.total) { x.fillStyle = "#f4f4f1"; x.fillRect(pad - 10, y, W - pad * 2 + 20, h); }
      x.fillStyle = "#e4e4de"; x.fillRect(pad - 10, y, W - pad * 2 + 20, 2);
      const my = y + h / 2 + Math.min(11, h * .22), sz = Math.min(38, h * .46);
      if (r.color) { x.fillStyle = r.color; x.fillRect(pad + (r.indent ? 22 : 0), my - sz * .72, sz * .62, sz * .62); }
      x.fillStyle = "#111827"; x.font = F(r.total ? 800 : 600, sz); x.fillText(r.name, pad + (r.indent ? 22 : 0) + (r.color ? sz * .86 : 0), my);
      x.textAlign = "right"; x.font = F(700, sz, true); r.vals.forEach((v, j) => x.fillText(v, W - pad - colW * (cols - 1 - j), my)); x.textAlign = "left";
    });
  }
  const partyName = (p, te) => (te ? pName(p) : EN[p]);
  const seatRows = (obj, te, cols) => {
    const K = ORDER.filter((p) => side(p) === "K"), val = (f) => cols.map((c) => nf(f(c)));
    return [{ name: te ? "కూటమి" : "Kutami (NDA)", total: 1, vals: val((c) => add(c, "K")) }, ...K.map((p) => ({ name: partyName(p, te), color: COL[p], indent: 1, vals: val((c) => c[p] || 0) })), { name: partyName("YSRCP", te), color: COL.YSRCP, total: 1, vals: val((c) => c.YSRCP || 0) }, { name: te ? "ఇతరులు" : "Others", vals: val((c) => add(c, "O")) }];
  };

  // every candidate's votes in one picture: one block per body, a bar per candidate (top 3), the leader's margin
  const candidates = (list, te0, en0) => async (cv, o) => {
    const te = o.lang !== "en", L = (t, e) => (te ? t : e);
    const rows = list().map((b) => ({ b, h: rec(b).head })).filter(({ h }) => h && !h.unopposed)
      .sort((a, c) => (c.h.votes ? 1 : 0) - (a.h.votes ? 1 : 0) || (c.h.counted || c.h.votes?.reduce((s, v) => s + v[2], 0) || 0) - (a.h.counted || a.h.votes?.reduce((s, v) => s + v[2], 0) || 0));
    const max = o.fmt === "story" ? 13 : o.fmt === "wide" ? 6 : 9, shown = rows.slice(0, max);
    const c = await frame(cv, o, L(te0, en0), L("అభ్యర్థులకు వచ్చిన ఓట్లు · ఇప్పటివరకు", "Votes for each candidate so far"));
    const { x, W, pad, top, bottom } = c, h0 = (bottom - top) / Math.max(shown.length, 1), nameW = (W - pad * 2) * .27, barX = pad + nameW, barW = W - pad - barX - 150;
    shown.forEach(({ b, h }, i) => {
      const y = top + i * h0, cands = h.votes?.length ? h.votes.slice(0, 3) : [[h.party, h.name, null]], lh = Math.min(30, (h0 - 10) / cands.length), sz = Math.min(20, lh * .62);
      x.fillStyle = "#e4e4de"; x.fillRect(pad, y, W - pad * 2, 2);
      x.fillStyle = "#111827"; x.font = F(800, Math.min(26, h0 * .3)); x.fillText(fitText(x, te ? bName(b) : b.name, nameW - 12), pad, y + Math.min(32, h0 * .42));
      const st = h.status === "won" ? L("గెలుపు", "won") : L("ఆధిక్యం", "leads");
      x.font = F(700, Math.min(17, h0 * .2)); x.fillStyle = COL[h.party] || COL.OTH;
      x.fillText(fitText(x, `${partyName(h.party, te)} ${st}${h.margin ? ` +${nf(h.margin)}` : ""}`, nameW - 12), pad, y + Math.min(56, h0 * .72));
      const top3 = cands[0][2] || 1;
      cands.forEach(([p, n, v], j) => {
        const by = y + 8 + j * lh, w = v == null ? 0 : Math.max(4, (v / top3) * barW);
        x.fillStyle = "#f0f0ea"; x.fillRect(barX, by, barW, lh - 6);
        if (w) { x.fillStyle = COL[p] || COL.OTH; x.fillRect(barX, by, w, lh - 6); }
        x.fillStyle = w > barW * .55 ? "#fff" : "#111827"; x.font = F(700, sz);
        x.fillText(fitText(x, n ? `${te ? TE.names[n] || n : n} · ${partyName(p, te)}` : partyName(p, te), (w > barW * .55 ? w : barW) - 16), barX + 8, by + (lh - 6) / 2 + sz * .36);
        x.fillStyle = "#111827"; x.textAlign = "right"; x.font = F(700, sz, true); x.fillText(v == null ? L("ఓట్ల వివరం రాలేదు", "no count yet") : nf(v), W - pad, by + (lh - 6) / 2 + sz * .36); x.textAlign = "left";
      });
    });
    if (!shown.length) { x.fillStyle = "#5b6475"; x.font = F(600, 28); x.fillText(L("ఇంకా ఓట్ల వివరాలు రాలేదు", "No vote counts yet"), pad, top + 60); }
    stamp(c, te);
  };
  async function mayors(cv, o) {
    const te = o.lang !== "en", c = await frame(cv, o, te ? "13 మేయర్ల ఫలితాలు" : "13 Mayor results", te ? "ఏపీ పుర ఎన్నికలు 2026" : "AP civic polls 2026"), { x, W, pad, top, bottom } = c;
    const h = Math.min(120, (bottom - top) / 13), sz = Math.min(32, h * .56);
    MAYORS.forEach((b, i) => {
      const y = top + i * h, h0 = rec(b).head, my = y + h / 2 + sz * .32;
      x.fillStyle = "#e4e4de"; x.fillRect(pad, y, W - pad * 2, 2);
      if (h0) { x.fillStyle = COL[h0.party]; x.fillRect(pad, y + h * .2, 8, h * .6); }
      x.fillStyle = "#111827"; x.font = F(800, sz); x.fillText(te ? bName(b) : b.name, pad + 22, my);
      const nameX = W * .4, name = h0 ? (te ? TE.names[h0.name] || h0.name : h0.name) : "";
      x.fillStyle = "#5b6475"; x.font = F(600, sz * .78); x.fillText(fitText(x, name || (te ? "ఎదురుచూపు" : "Awaited"), W * .34), nameX, my);
      if (h0) { x.textAlign = "right"; x.fillStyle = COL[h0.party]; x.font = F(800, sz * .84); x.fillText(`${partyName(h0.party, te)} ${h0.status === "won" ? (te ? "గెలుపు" : "won") : te ? "ఆధిక్యం" : "leads"}${h0.margin ? ` +${(nf(h0.margin) + (h0.marginPlus ? "+" : ""))}` : ""}`, W - pad, my); x.textAlign = "left"; }
    });
    stamp(c, te);
  }
  async function towns(cv, o) {
    const te = o.lang !== "en", t = tally(TOWNS), c = await frame(cv, o, te ? "మున్సిపాలిటీల ఫలితాలు" : "Municipality results", te ? `87 చైర్‌పర్సన్లు · ${t.done} తేలాయి` : `87 Chairpersons · ${t.done} decided`);
    partyRows(c, seatRows(t, te, [t.won, t.lead, t.wards]), ["", te ? "గెలుపు" : "Won", te ? "ఆధిక్యం" : "Lead", te ? "వార్డులు" : "Wards"], te); stamp(c, te);
  }
  const rural = (key, te0, en0) => async (cv, o) => {
    const te = o.lang !== "en", r = ruralNow(key), n = window.AP_RURAL[key], c = await frame(cv, o, te ? `${te0} ఫలితాలు` : `${en0} results`, te ? `${nf(n)} స్థానాల్లో ${nf(r.declared)} తేలాయి (ఏకగ్రీవాలతో)` : `${nf(r.declared)} of ${nf(n)} seats decided, with unopposed`);
    partyRows(c, seatRows(r, te, [r.seats || {}]), ["", te ? "స్థానాలు" : "Seats"], te); stamp(c, te);
  };
  // overall picture: won / leading / awaited for Mayors and Chairpersons, wards won + leading, by side
  async function overall(cv, o) {
    const te = o.lang !== "en", L = (t, e) => (te ? t : e);
    const sides = [["K", L("కూటమి", "Kutami (NDA)"), "#d4a000"], ["Y", L("వైఎస్సార్‌సీపీ", "YSRCP"), COL.YSRCP], ["O", L("ఇతరులు", "Others"), COL.OTH]];
    const heads = (list) => { const t = { won: { K: 0, Y: 0, O: 0 }, lead: { K: 0, Y: 0, O: 0 } }; for (const b of list) { const h = rec(b).head; if (h) t[h.status === "won" ? "won" : "lead"][side(h.party)]++; } return t; };
    const wards = (list) => { const w = { K: 0, Y: 0, O: 0 }, l = { K: 0, Y: 0, O: 0 }, t = tally(list); for (const [p, n] of Object.entries(t.wards)) w[side(p)] += n; for (const b of list) for (const [p, n] of Object.entries(rec(b).leads || {})) l[side(p)] += n; return { w, l, done: t.wardsDone, all: t.wardsAll }; };
    const M = heads(MAYORS), C = heads(TOWNS), WM = wards(MAYORS), WT = wards(TOWNS);
    const sum = (o) => o.K + o.Y + o.O;
    const c = await frame(cv, o, L("పుర ఎన్నికల ఫలితాలు", "AP civic poll results"), L("ఇప్పటివరకు · మేయర్లు, చైర్‌పర్సన్లు, వార్డులు", "So far · Mayors, Chairpersons, wards"));
    const { x, W, pad, top, bottom } = c;
    const blocks = [
      { t: L("13 మేయర్లు", "13 Mayors"), total: 13, a: M.won, b: M.lead, ha: L("గెలుపు", "Won"), hb: L("ఆధిక్యం", "Lead") },
      { t: L("87 చైర్‌పర్సన్లు", "87 Chairpersons"), total: 87, a: C.won, b: C.lead, ha: L("గెలుపు", "Won"), hb: L("ఆధిక్యం", "Lead") },
      { t: L(`వార్డులు · ${nf(WM.done + WT.done)} / ${nf(WM.all + WT.all)} తేలాయి`, `Wards · ${nf(WM.done + WT.done)} of ${nf(WM.all + WT.all)} decided`), a: { K: WM.w.K + WT.w.K, Y: WM.w.Y + WT.w.Y, O: WM.w.O + WT.w.O }, b: { K: WM.l.K + WT.l.K, Y: WM.l.Y + WT.l.Y, O: WM.l.O + WT.l.O }, ha: L("గెలుపు", "Won"), hb: L("ఆధిక్యం", "Lead") },
    ];
    const wideL = W / c.H > 1.4, gap = 14, n = 3;
    const bw = wideL ? (W - pad * 2 - gap * 2) / 3 : W - pad * 2, bh = wideL ? bottom - top : (bottom - top - gap * 2) / 3;
    blocks.forEach((B, i) => {
      const x0 = wideL ? pad + i * (bw + gap) : pad, y0 = wideL ? top : top + i * (bh + gap), right = x0 + bw, colW = bw * (wideL ? 0.24 : 0.17);
      const head = wideL ? 96 : 64, rowH = (bh - head) / 3, sz = Math.min(34, rowH * 0.5, bw * 0.075);
      x.fillStyle = "#f6f6f2"; x.beginPath(); x.roundRect(x0 - 10, y0, bw + 20, bh, 16); x.fill();
      x.fillStyle = "#111827"; let ts = Math.min(30, bw * 0.075); x.font = F(800, ts); while (ts > 16 && x.measureText(B.t).width > bw - 12) { ts--; x.font = F(800, ts); } x.fillText(B.t, x0 + 6, y0 + 36);
      if (B.total) { const done = sum(B.a), lead = sum(B.b), wait = B.total - done - lead, t = L(`తేలినవి ${done} · ఆధిక్యం ${lead} · ఎదురుచూపు ${wait}`, `Decided ${done} · leading ${lead} · awaited ${wait}`); x.font = F(600, 19); x.fillStyle = "#5b6475"; if (wideL) x.fillText(t, x0 + 6, y0 + 64); else { x.textAlign = "right"; x.fillText(t, right - 6, y0 + 36); x.textAlign = "left"; } }
      x.textAlign = "right"; x.font = F(600, 17); x.fillStyle = "#5b6475"; x.fillText(B.ha, right - colW - 6, y0 + head - 4); x.fillText(B.hb, right - 6, y0 + head - 4); x.textAlign = "left";
      sides.forEach(([k, name, color], j) => {
        const my = y0 + head + j * rowH + rowH * 0.62;
        x.fillStyle = color; x.fillRect(x0 + 6, my - sz * 0.7, sz * 0.55, sz * 0.55);
        x.fillStyle = "#111827"; x.font = F(700, sz); x.fillText(name, x0 + 6 + sz * 0.8, my);
        x.textAlign = "right"; x.font = F(700, sz, true); x.fillText(nf(B.a[k]), right - colW - 6, my); x.fillStyle = "#5b6475"; x.fillText(nf(B.b[k]), right - 6, my); x.textAlign = "left";
      });
    });
    stamp(c, te);
  }
  window.CD_img = { frame, stamp, F, fitText, partyName, EN }; // reused by the ward-by-ward sheet (counting-simple-wards.js)
  window.apShareCustom = { "img-mayor-votes": { title: "Mayor candidates' votes", draw: candidates(() => MAYORS, "మేయర్ అభ్యర్థుల ఓట్లు", "Mayor candidates' votes") }, "img-chair-votes": { title: "Chairperson candidates' votes", draw: candidates(() => TOWNS.filter((b) => rec(b).head?.votes?.length || rec(b).head?.margin), "చైర్‌పర్సన్ అభ్యర్థుల ఓట్లు", "Chairperson candidates' votes") }, "img-overall": { title: "Overall results", draw: overall }, "img-mayors": { title: "13 Mayors", draw: mayors }, "img-towns": { title: "Municipalities", draw: towns }, "img-zptc": { title: "ZPTC", draw: rural("zptc", "జడ్పీటీసీ", "ZPTC") }, "img-mptc": { title: "MPTC", draw: rural("mptc", "ఎంపీటీసీ", "MPTC") } };
})();
