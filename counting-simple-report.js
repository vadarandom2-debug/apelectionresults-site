// One-body report image: Mayor / Chairperson majority with every candidate's votes as bars, the seats graph, and every
// ward / division with its winner's name (majority when known), with the site logo at the foot. Opened from a body's
// sheet; the other share images stay as they are.
(() => {
  const { BODIES, TE, rec, bName, nf, ORDER } = window.CD, { COL } = window.CD_simple;
  const BY = Object.fromEntries(BODIES.map((b) => [b.id, b]));
  const loaded = {}, img = (src) => (loaded[src] ||= new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));

  const report = (id) => async (cv, o) => {
    await window.CD.wardList(id);
    const { frame, stamp, F, fitText, partyName } = window.CD_img, te = o.lang !== "en", L = (t, e) => (te ? t : e);
    const b = BY[id], r = rec(b), h = r.head, wl = new Map((r.wardList || []).map((w) => [w[0], w])), C = b.type === "C";
    const unitTe = C ? "డివిజన్" : "వార్డు", unitEn = C ? "Division" : "Ward", post = C ? L("మేయర్", "Mayor") : L("చైర్‌పర్సన్", "Chairperson");
    const c = await frame(cv, o, te ? bName(b) : b.name, L(`${post} మెజారిటీ · ${unitTe}ల వారీ ఫలితాలు`, `${post} majority · ${unitEn}-wise results`));
    const { x, W, H, pad, top, bottom } = c, bw = W - pad * 2;
    let y = top + 4;

    // head post: status line, then a bar per candidate
    x.font = F(800, 28); x.fillStyle = h ? COL[h.party] || COL.OTH : "#5b6475";
    const st = h ? (h.unopposed ? L("ఏకగ్రీవం", "unopposed") : h.status === "won" ? L("గెలుపు", "won") : L("ఆధిక్యం", "leading")) : L("ఫలితం ఎదురుచూపు", "result awaited");
    const mg = h?.margin ? (h.status === "won" ? L(` · మెజారిటీ ${(nf(h.margin) + (h.marginPlus ? "+" : ""))} ఓట్లు`, ` · majority ${(nf(h.margin) + (h.marginPlus ? "+" : ""))}`) : L(` · ${(nf(h.margin) + (h.marginPlus ? "+" : ""))} ఓట్ల ఆధిక్యం`, ` · ahead by ${(nf(h.margin) + (h.marginPlus ? "+" : ""))}`)) : "";
    // with a margin the line already says leading / majority, so the status word isn't repeated
    x.fillText(fitText(x, `${post}: ${h ? partyName(h.party, te) + " " : ""}${h?.margin && h.status !== "won" ? mg.slice(3) : st + mg}`, bw), pad, y + 26); y += 40;
    const cands = h?.votes?.length ? h.votes : h ? [[h.party, h.name, null]] : [];
    const top1 = cands[0]?.[2] || 1, ch = 34;
    cands.slice(0, 5).forEach(([p, n, v]) => {
      const w = v == null ? 0 : Math.max(6, (v / top1) * (bw - 150));
      x.fillStyle = "#f0f0ea"; x.fillRect(pad, y, bw - 150, ch - 8);
      if (w) { x.fillStyle = COL[p] || COL.OTH; x.fillRect(pad, y, w, ch - 8); }
      const label = n ? `${te ? TE.names[n] || n : n} · ${partyName(p, te)}` : partyName(p, te);
      x.font = F(700, 18); x.fillStyle = w > (bw - 150) * .5 ? "#fff" : "#111827"; x.fillText(fitText(x, label, (w > (bw - 150) * .5 ? w : bw - 150) - 14), pad + 8, y + 19);
      x.textAlign = "right"; x.fillStyle = "#111827"; x.font = F(700, 20, true); x.fillText(v == null ? "—" : nf(v), W - pad, y + 20); x.textAlign = "left";
      y += ch;
    });
    if (h?.counted) { x.font = F(600, 16); x.fillStyle = "#5b6475"; x.fillText(L(`${nf(h.counted)} ఓట్లు లెక్కించారు`, `${nf(h.counted)} votes counted`), pad, y + 12); y += 22; }
    y += 8;

    // seats graph: won (solid) + leading (light) per party, then the numbers
    const won = {}, lead = {}, wlWon = [...wl.values()].filter((w) => w[2] === "won");
    if (wlWon.length >= r.declared && wl.size) for (const [, p, s] of wl.values()) (s === "won" ? won : lead)[p] = ((s === "won" ? won : lead)[p] || 0) + 1;
    else { Object.assign(won, r.wards); Object.assign(lead, r.leads); }
    const parties = ORDER.filter((p) => won[p] || lead[p]).sort((a, b2) => (won[b2] || 0) + (lead[b2] || 0) - (won[a] || 0) - (lead[a] || 0));
    x.font = F(800, 22); x.fillStyle = "#111827";
    const done = Object.values(won).reduce((a, n) => a + n, 0), ld = Object.values(lead).reduce((a, n) => a + n, 0);
    x.fillText(L(`${b.wards} ${unitTe}లు · ${done} తేలాయి · ${ld} ఆధిక్యం`, `${b.wards} ${unitEn.toLowerCase()}s · ${done} decided · ${ld} leading`), pad, y + 20); y += 30;
    x.fillStyle = "#ececE6"; x.fillRect(pad, y, bw, 22); let bx = pad;
    for (const p of parties) for (const [n, a] of [[won[p] || 0, 1], [lead[p] || 0, .45]]) { if (!n) continue; const w = (n / b.wards) * bw; x.globalAlpha = a; x.fillStyle = COL[p] || COL.OTH; x.fillRect(bx, y, w, 22); x.globalAlpha = 1; bx += w; }
    y += 32;
    const pc = Math.min(4, Math.max(1, parties.length)), pw = bw / pc;
    parties.slice(0, 8).forEach((p, i) => {
      const px = pad + (i % pc) * pw, py = y + Math.floor(i / pc) * 30;
      x.fillStyle = COL[p] || COL.OTH; x.fillRect(px, py, 14, 14);
      x.fillStyle = "#111827"; x.font = F(700, 18); x.fillText(fitText(x, `${partyName(p, te)} ${won[p] || 0}${lead[p] ? " +" + lead[p] : ""}`, pw - 26), px + 20, py + 13);
    });
    y += Math.ceil(Math.min(8, parties.length) / pc) * 30 + 6;

    // every ward / division: number, winner, party colour, majority when known
    x.fillStyle = "#e4e4de"; x.fillRect(pad, y, bw, 2); y += 10;
    const n = b.wards, avail = bottom - y - 4;
    let cols = 1; while (cols < 6 && Math.ceil(n / cols) * 24 > avail) cols++;
    const rowsN = Math.ceil(n / cols), rh = Math.min(34, avail / rowsN), cw = (bw - (cols - 1) * 10) / cols, fs = Math.max(11, Math.min(18, rh * .6));
    for (let i = 0; i < n; i++) {
      const w = wl.get(i + 1), cx = pad + Math.floor(i / rowsN) * (cw + 10), cy = y + (i % rowsN) * rh;
      if (i % 2 === 0) { x.fillStyle = "#f7f7f3"; x.fillRect(cx, cy, cw, rh); }
      x.fillStyle = w ? COL[w[1]] || COL.OTH : "#d6d6cf"; x.globalAlpha = w && w[2] !== "won" ? .45 : 1; x.fillRect(cx, cy + 2, 5, rh - 4); x.globalAlpha = 1;
      x.fillStyle = "#374151"; x.font = F(700, fs, true); x.fillText(String(i + 1), cx + 10, cy + rh / 2 + fs * .36);
      const nx = cx + 10 + fs * (String(n).length * .62 + .7), right = w?.[4] ? `+${nf(w[4])}` : w ? (w[2] === "won" ? "" : L("ఆధి.", "lead")) : "";
      if (right) { x.textAlign = "right"; x.fillStyle = w[2] === "won" ? "#0f6b39" : "#b45309"; x.font = F(700, fs * .9, true); x.fillText(right, cx + cw - 4, cy + rh / 2 + fs * .34); x.textAlign = "left"; }
      x.fillStyle = w ? "#111827" : "#9aa1ad"; x.font = F(w ? 600 : 500, fs);
      const who = w ? `${w[3] || ""}${w[3] ? " · " : ""}${partyName(w[1], te)}` : L("ఎదురుచూపు", "awaited");
      x.fillText(fitText(x, who, cx + cw - nx - (right ? fs * 3 : 4)), nx, cy + rh / 2 + fs * .36);
    }

    // site logo in the footer, left of the address
    const logo = await img("assets/brand/apresults-logo.svg");
    if (logo) { const lh = 40, lw = lh * (250 / 64); x.drawImage(logo, pad, H - 64 + 12, lw, lh); }
    stamp(c, te);
  };

  // register the report for a body just before the share dialog opens it
  document.addEventListener("click", (e) => {
    const s = e.target.closest('[data-share^="report-"]'); if (!s) return;
    const id = s.dataset.share.slice(7); if (BY[id]) window.apShareCustom[s.dataset.share] = { title: `${BY[id].name} report`, draw: report(id) };
  }, true);
})();
