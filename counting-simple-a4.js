// One A4 page with every result: the overall tally, all 13 Mayors and all 87 Municipality / Nagar Panchayat
// Chairpersons (winner, party, won / leading, majority), ward totals per body. Shared from the chips on both tabs.
(() => {
  const { BODIES, TE, rec, bName, nf, side } = window.CD, { MAYORS, TOWNS, COL } = window.CD_simple;
  const SH = { TDP: ["టీడీపీ", "TDP"], JSP: ["జనసేన", "JSP"], BJP: ["బీజేపీ", "BJP"], NDA: ["కూటమి", "NDA"], YSRCP: ["వైసీపీ", "YSRCP"], INC: ["కాంగ్రెస్", "INC"], LEFT: ["వామ", "Left"], OTH: ["ఇతరులు", "Oth"] };
  const loaded = {}, img = (src) => (loaded[src] ||= new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));

  async function draw(cv, o) {
    const te = o.lang !== "en", L = (t, e) => (te ? t : e), W = 1240, H = 1754, S = 2, pad = 44;
    cv.width = W * S; cv.height = H * S; const x = cv.getContext("2d"); x.setTransform(S, 0, 0, S, 0, 0);
    await Promise.all([document.fonts.load('800 40px "Anek Telugu"', "తెలుగు"), document.fonts.load('600 20px "Anek Telugu"', "తెలుగు"), document.fonts.load('700 20px "JetBrains Mono"')]);
    const { F, fitText } = window.CD_img, sn = (p) => (SH[p] || SH.OTH)[te ? 0 : 1];
    x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); x.fillStyle = "#d4a000"; x.fillRect(0, 0, W, 14);

    // header + overall tally
    const heads = { K: 0, Y: 0, O: 0 }, wards = { K: 0, Y: 0, O: 0 }; let declared = 0;
    for (const b of BODIES) { const r = rec(b); if (r.head?.status === "won") heads[side(r.head.party)]++; for (const [p, n] of Object.entries(r.wards || {})) { wards[side(p)] += n; declared += n; } }
    x.fillStyle = "#b97800"; x.font = F(700, 20); x.fillText(L("ఆంధ్రప్రదేశ్ పుర ఎన్నికలు 2026 · పూర్తి ఫలితాలు", "Andhra Pradesh urban local body elections 2026 · all results"), pad, 52);
    const logo = await img("assets/brand/apresults-logo.svg"); if (logo) { const lh = 64, lw = lh * (250 / 64); x.drawImage(logo, W - pad - lw, 34, lw, lh); }
    x.fillStyle = "#111827"; x.font = F(800, 44); x.fillText(L("13 మేయర్లు · 87 చైర్‌పర్సన్లు", "13 Mayors · 87 Chairpersons"), pad, 104);
    const tally = (y, label, t, unit) => {
      x.font = F(800, 18); x.fillStyle = "#111827"; x.fillText(label, pad, y);
      const bw = W - pad * 2 - 560, bx = pad + 120, tot = t.K + t.Y + t.O || 1; let at = bx;
      for (const [k, c] of [["K", COL.TDP], ["O", COL.OTH], ["Y", COL.YSRCP]]) { const w = (t[k] / tot) * bw; x.fillStyle = c; x.fillRect(at, y - 16, w, 20); at += w; }
      x.font = F(700, 17, true); x.fillStyle = "#111827"; x.fillText(`${L("కూటమి", "NDA")} ${nf(t.K)} · ${L("వైసీపీ", "YSRCP")} ${nf(t.Y)} · ${L("ఇతరులు", "Oth")} ${nf(t.O)}`, bx + bw + 12, y); x.fillStyle = "#5b6475"; x.font = F(600, 13); x.fillText(unit, bx + bw + 12, y + 16);
    };
    tally(150, L("పదవులు", "Head posts"), heads, L("గెలిచిన మేయర్ / చైర్‌పర్సన్", "Mayors / Chairs won"));
    tally(190, L("వార్డులు", "Wards"), wards, L(`${nf(declared)} స్థానాలు తేలాయి`, `${nf(declared)} seats declared`));

    // one row per body
    const row = (b, cx, y, w, h) => {
      const r = rec(b), hd = r.head, c = hd ? COL[hd.party] || COL.OTH : "#d6d6cf";
      x.fillStyle = "#f6f6f2"; x.fillRect(cx, y + 1, w, h - 2); x.fillStyle = c; x.globalAlpha = hd && hd.status !== "won" ? .45 : 1; x.fillRect(cx, y + 1, 6, h - 2); x.globalAlpha = 1;
      const big = h > 40, nameW = w * .44;
      x.fillStyle = "#111827"; x.font = F(800, big ? 19 : 15); x.fillText(fitText(x, te ? bName(b) : b.name, nameW - 14), cx + 14, y + h * (big ? .42 : .64));
      if (big && hd?.name) { x.fillStyle = "#5b6475"; x.font = F(600, 14); x.fillText(fitText(x, te ? TE.names[hd.name] || hd.name : hd.name, nameW - 14), cx + 14, y + h * .8); }
      const st = !hd ? L("ఎదురుచూపు", "awaited") : hd.unopposed ? L("ఏకగ్రీవం", "unopp.") : hd.status === "won" ? L("గెలుపు", "won") : L("ఆధిక్యం", "lead");
      x.fillStyle = hd ? c : "#9aa1ad"; x.font = F(800, big ? 17 : 14); x.fillText(hd ? sn(hd.party) : "—", cx + nameW, y + h * (big ? .42 : .64));
      x.fillStyle = "#5b6475"; x.font = F(600, big ? 14 : 12); x.fillText(st + (hd?.margin ? ` +${nf(hd.margin)}${hd.marginPlus ? "+" : ""}` : ""), cx + nameW + (big ? 0 : w * .16), y + h * (big ? .8 : .64));
      // ward split as a thin bar on the right
      const tot = Object.values(r.wards || {}).reduce((a, n) => a + n, 0), bw = w * (big ? .2 : .16), bx = cx + w - bw - 8; let at = bx;
      x.fillStyle = "#e3e3dc"; x.fillRect(bx, y + h / 2 - 4, bw, 8);
      for (const p of ["TDP", "JSP", "BJP", "NDA", "OTH", "LEFT", "INC", "YSRCP"]) { const n = r.wards?.[p]; if (!n) continue; const ww = (n / b.wards) * bw; x.fillStyle = COL[p] || COL.OTH; x.fillRect(at, y + h / 2 - 4, ww, 8); at += ww; }
      if (big) { x.fillStyle = "#5b6475"; x.font = F(600, 12, true); x.textAlign = "right"; x.fillText(`${tot}/${b.wards}`, bx + bw, y + h / 2 + 20); x.textAlign = "left"; }
    };
    const section = (y, t) => { x.fillStyle = "#111827"; x.font = F(800, 22); x.fillText(t, pad, y); x.fillStyle = "#e4e4de"; x.fillRect(pad, y + 8, W - pad * 2, 2); return y + 18; };

    let y = section(244, L("మేయర్లు · 13 కార్పొరేషన్లు", "Mayors · 13 corporations"));
    const cw2 = (W - pad * 2 - 12) / 2, mh = 50;
    MAYORS.forEach((b, i) => row(b, pad + (i % 2) * (cw2 + 12), y + Math.floor(i / 2) * mh, cw2, mh));
    y += Math.ceil(MAYORS.length / 2) * mh + 34;
    y = section(y, L("చైర్‌పర్సన్లు · 87 మున్సిపాలిటీలు, నగర పంచాయతీలు", "Chairpersons · 87 municipalities and nagar panchayats"));
    const towns = [...TOWNS].sort((a, b) => (te ? bName(a).localeCompare(bName(b), "te") : a.name.localeCompare(b.name))), cols = 3, per = Math.ceil(towns.length / cols);
    const cw3 = (W - pad * 2 - 12 * (cols - 1)) / cols, th = Math.min(34, (H - 80 - y) / per);
    towns.forEach((b, i) => row(b, pad + Math.floor(i / per) * (cw3 + 12), y + (i % per) * th, cw3, th));

    // footer: colour key, handle, address
    const fy = H - 34; x.fillStyle = "#e4e4de"; x.fillRect(pad, fy - 26, W - pad * 2, 2);
    let kx = pad; x.font = F(700, 14);
    for (const p of ["TDP", "JSP", "BJP", "YSRCP", "OTH"]) { x.fillStyle = COL[p]; x.fillRect(kx, fy - 10, 12, 12); x.fillStyle = "#374151"; x.fillText(sn(p), kx + 17, fy + 1); kx += x.measureText(sn(p)).width + 38; }
    x.fillStyle = "#5b6475"; x.font = F(600, 13); x.fillText(L("పలచని రంగు = ఆధిక్యం · కుడి బార్ = వార్డుల విభజన", "light = leading · right bar = ward split"), kx + 6, fy + 1);
    x.textAlign = "right"; x.fillStyle = "#111827"; x.font = F(800, 17); x.fillText("apelectionresults.com", W - pad, fy + 1);
    if (o.shiva) { const av = await img("assets/brand/shiva4tdp-avatar.jpg"); x.font = F(700, 15); x.fillText("@shiva4tdp", W - pad - 220, fy + 1); if (av) { x.save(); x.beginPath(); x.arc(W - pad - 320, fy - 4, 13, 0, 7); x.clip(); x.drawImage(av, W - pad - 333, fy - 17, 26, 26); x.restore(); } }
    x.textAlign = "left";
  }
  window.apShareCustom["img-a4-all"] = { title: "All results · A4", draw };
})();
