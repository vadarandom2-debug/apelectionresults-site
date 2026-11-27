// Winners list images: each Mayor / Chairperson winner or leader with the party symbol, the candidate's name, the body
// and won / leading (+ margin). Separate from the other share images, which stay as they are.
(() => {
  const { TE, rec, bName, nf } = window.CD, { MAYORS, TOWNS, COL } = window.CD_simple;
  const LOGO = { TDP: "tdp", JSP: "jsp", BJP: "bjp", YSRCP: "ysrcp", INC: "inc", LEFT: "left" };
  const loaded = {}, img = (src) => (loaded[src] ||= new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));
  const RANK = { won: 0, unopposed: 1, leading: 2 };
  const kind = (h) => (h.unopposed ? "unopposed" : h.status === "won" ? "won" : "leading");

  const winners = (list, te0, en0) => async (cv, o) => {
    const { frame, stamp, F, fitText, partyName } = window.CD_img, te = o.lang !== "en", L = (t, e) => (te ? t : e);
    const rows = list().map((b) => ({ b, h: rec(b).head })).filter(({ h }) => h).sort((a, c) => RANK[kind(a.h)] - RANK[kind(c.h)] || (c.h.margin || 0) - (a.h.margin || 0));
    const won = rows.filter(({ h }) => kind(h) !== "leading").length, lead = rows.length - won;
    const c = await frame(cv, o, L(te0, en0), L(`గెలిచినవారు ${won} · ఆధిక్యంలో ${lead}`, `Won ${won} · leading ${lead}`)), { x, W, pad, top, bottom } = c;
    const logos = Object.fromEntries(await Promise.all(Object.entries(LOGO).map(async ([p, f]) => [p, await img(`assets/parties/${f}.png`)])));
    const cols = W / c.H > 1.4 || rows.length > 13 ? 2 : 1, gap = 18, colW = (W - pad * 2 - gap * (cols - 1)) / cols;
    const rowH = Math.max(52, Math.min(84, (bottom - top) / Math.ceil(Math.min(rows.length, 30) / cols)));
    const perCol = Math.floor((bottom - top) / rowH), shown = rows.slice(0, perCol * cols);
    shown.forEach(({ b, h }, i) => {
      const cx = pad + Math.floor(i / perCol) * (colW + gap), y = top + (i % perCol) * rowH, k = kind(h), s = rowH * .62, cy = y + rowH / 2;
      x.fillStyle = i % 2 ? "#fafaf6" : "#f3f3ee"; x.beginPath(); x.roundRect(cx, y + 3, colW, rowH - 6, 10); x.fill();
      // party symbol in a white disc (initials when there's no logo file)
      x.save(); x.beginPath(); x.arc(cx + 10 + s / 2, cy, s / 2, 0, 7); x.fillStyle = "#fff"; x.fill(); x.lineWidth = 3; x.strokeStyle = COL[h.party] || COL.OTH; x.stroke(); x.clip();
      if (logos[h.party]) x.drawImage(logos[h.party], cx + 10 + s * .12, cy - s * .38, s * .76, s * .76);
      else { x.fillStyle = COL.OTH; x.font = F(800, s * .34); x.textAlign = "center"; x.fillText("IND", cx + 10 + s / 2, cy + s * .12); x.textAlign = "left"; }
      x.restore();
      const tx = cx + 22 + s, pillW = Math.min(colW * .3, 150), nameW = colW - (tx - cx) - pillW - 14;
      const name = h.name ? (te ? TE.names[h.name] || h.name : h.name) : partyName(h.party, te);
      x.fillStyle = "#111827"; x.font = F(800, Math.min(26, rowH * .32)); x.fillText(fitText(x, name, nameW), tx, cy - rowH * .04);
      x.fillStyle = "#5b6475"; x.font = F(600, Math.min(18, rowH * .23)); x.fillText(fitText(x, `${te ? bName(b) : b.name} · ${partyName(h.party, te)}`, nameW), tx, cy + rowH * .27);
      // status pill: won (green), unopposed (teal), leading (amber) + margin
      const px = cx + colW - pillW - 8, ph = Math.min(40, rowH * .56), py = cy - ph / 2;
      x.fillStyle = k === "won" ? "#128c4b" : k === "unopposed" ? "#0f766e" : "#b45309"; x.beginPath(); x.roundRect(px, py, pillW, ph, ph / 2); x.fill();
      x.fillStyle = "#fff"; x.textAlign = "center"; x.font = F(800, Math.min(18, ph * .42));
      const label = k === "won" ? L("గెలుపు", "Won") : k === "unopposed" ? L("ఏకగ్రీవం", "Unopposed") : L("ఆధిక్యం", "Leading");
      x.fillText(h.margin ? `${label} +${(nf(h.margin) + (h.marginPlus ? "+" : ""))}` : label, px + pillW / 2, py + ph / 2 + ph * .16); x.textAlign = "left";
    });
    if (rows.length > shown.length) { x.fillStyle = "#5b6475"; x.font = F(600, 18); x.textAlign = "right"; x.fillText(L(`+ మరో ${rows.length - shown.length}`, `+ ${rows.length - shown.length} more`), W - pad, bottom + 4); x.textAlign = "left"; }
    if (!rows.length) { x.fillStyle = "#5b6475"; x.font = F(600, 28); x.fillText(L("ఇంకా ఫలితాలు రాలేదు", "No results yet"), pad, top + 60); }
    stamp(c, te);
  };

  Object.assign(window.apShareCustom, {
    "img-mayor-winners": { title: "Mayor winners", draw: winners(() => MAYORS, "మేయర్ విజేతలు · ఆధిక్యంలో ఉన్నవారు", "Mayors: won and leading") },
    "img-chair-winners": { title: "Chairperson winners", draw: winners(() => TOWNS, "చైర్‌పర్సన్ విజేతలు", "Chairpersons: won and leading") },
  });
})();
