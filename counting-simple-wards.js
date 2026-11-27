// Ward-by-ward sheet: tap a Mayor or municipality name → who won or leads each ward, the head post, a party bar and
// a coloured ward grid, plus a share image (X · Facebook / WhatsApp / Story sizes) drawn with the same frame as the others.
(() => {
  const { BODIES, TE, rec, pName, bName, nf, ORDER, esc } = window.CD, { COL } = window.CD_simple;
  const $ = (s) => document.querySelector(s);
  const BY = Object.fromEntries(BODIES.map((b) => [b.id, b]));
  const TYPE = { C: "మున్సిపల్ కార్పొరేషన్", M: "మున్సిపాలిటీ", NP: "నగర పంచాయతీ" };
  const unit = (b) => (b.type === "C" ? "డివిజన్" : "వార్డు");
  const U = (b) => (b.type === "C" ? { pl: "డివిజన్లు", in: "డివిజన్లలో", of: "డివిజన్ల" } : { pl: "వార్డులు", in: "వార్డుల్లో", of: "వార్డుల" });

  // won / leading per party: from the ward list when it covers every declared ward, else the body's totals (+ derived leads)
  const SIDE_COL = { K: "#d4a000", Y: COL.YSRCP, O: COL.OTH }, SIDE_TE = { K: "కూటమి", Y: "వైఎస్సార్‌సీపీ", O: "ఇతరులు" };
  function counts(b, r) {
    const won = {}, lead = {}, wlWon = (r.wardList || []).filter((w) => w[2] === "won");
    if (r.wardList?.length && wlWon.length >= r.declared) for (const [, p, st] of r.wardList) (st === "won" ? won : lead)[p] = ((st === "won" ? won : lead)[p] || 0) + 1;
    else { Object.assign(won, r.wards); Object.assign(lead, r.leads); }
    const parties = ORDER.filter((p) => won[p] || lead[p]).sort((a, c) => (won[c] || 0) + (lead[c] || 0) - (won[a] || 0) - (lead[a] || 0));
    // declared wins whose ward number isn't listed yet, per side (Kutami / YSRCP / others)
    const known = { K: 0, Y: 0, O: 0 }, all = { K: 0, Y: 0, O: 0 };
    for (const w of wlWon) known[window.CD.side(w[1])]++;
    for (const [p, n] of Object.entries(won)) all[window.CD.side(p)] += n;
    const unknown = Object.fromEntries(Object.entries(all).map(([k, n]) => [k, Math.max(0, n - known[k])]).filter(([, n]) => n));
    return { won, lead, parties, unknown, done: Object.values(won).reduce((a, n) => a + n, 0), leading: Object.values(lead).reduce((a, n) => a + n, 0) };
  }
  const headText = (b, h) => {
    const post = b.type === "C" ? "మేయర్" : "చైర్‌పర్సన్";
    if (!h) return `${post}: ఫలితం ఎదురుచూపు`;
    const m = h.margin ? (h.status === "won" ? ` · మెజారిటీ ${(nf(h.margin) + (h.marginPlus ? "+" : ""))} ఓట్లు` : ` · ${(nf(h.margin) + (h.marginPlus ? "+" : ""))} ఓట్ల ఆధిక్యం`) : "";
    return `${post}: ${pName(h.party)} ${h.unopposed ? "ఏకగ్రీవం" : h.status === "won" ? "గెలుపు" : "ఆధిక్యం"}${h.name ? " · " + (TE.names[h.name] || h.name) : ""}${m}`;
  };

  const dlg = document.createElement("dialog");
  dlg.className = "wsheet"; dlg.setAttribute("aria-label", "Ward-by-ward results");
  document.body.appendChild(dlg);

  function render(id) {
    const b = BY[id], r = rec(b), c = counts(b, r), wl = new Map((r.wardList || []).map((w) => [w[0], w])), h = r.head;
    const bar = c.parties.flatMap((p) => [[p, c.won[p] || 0, ""], [p, c.lead[p] || 0, "l"]]).filter((x) => x[1])
      .map(([p, n, cls]) => `<i class="${cls}" style="width:${(n / b.wards) * 100}%;background:${COL[p]}" title="${esc(pName(p))} ${n}"></i>`).join("");
    const grid = Array.from({ length: b.wards }, (_, i) => { const w = wl.get(i + 1); return `<span class="${w ? (w[2] === "won" ? "w" : "l") : ""}" style="${w ? `--c:${COL[w[1]]}` : ""}" title="${unit(b)} ${i + 1}${w ? ` · ${esc(pName(w[1]))}` : ""}">${i + 1}</span>`; }).join("");
    const rows = [...wl.values()].map(([n, p, st, name]) => `<tr><td>${n}</td><td>${esc(name || "—")}</td><td><i class="dot" style="background:${COL[p]}"></i>${esc(pName(p))}</td><td class="${st === "won" ? "won" : "ld"}">${st === "won" ? "గెలుపు" : "ఆధిక్యం"}</td></tr>`).join("");
    dlg.innerHTML = `<div class="ws-head"><div><b>${esc(bName(b))}</b><small>${TYPE[b.type] || ""} · ${esc(TE.districts?.[b.district] || b.district || "")} · ${b.wards} ${U(b).pl}</small></div><button type="button" class="ps-x" data-wclose aria-label="Close">×</button></div>
      <p class="ws-hp" style="--c:${h ? COL[h.party] : "#8a93a6"}">${esc(headText(b, h))}</p>${h?.runnerUp && !h?.votes?.length ? `<p class="ws-sum">రెండో స్థానం: <b>${esc(h.runnerUp.name)}</b> (${esc(pName(h.runnerUp.party))})</p>` : ""}
      ${h?.votes?.length ? `<div class="ws-votes"><h3>${b.type === "C" ? "మేయర్" : "చైర్‌పర్సన్"} అభ్యర్థుల ఓట్లు${h.counted ? ` <small>${nf(h.counted)} ఓట్లు లెక్కించారు</small>` : ""}</h3>${h.votes.map(([p, n, v]) => `<div class="vb"><span><b>${esc(n ? TE.names[n] || n : pName(p))}</b>${n ? ` <small>${esc(pName(p))}</small>` : ""}</span><b class="n">${nf(v)}</b><i style="width:${(v / h.votes[0][2]) * 100}%;background:${COL[p] || COL.OTH}"></i></div>`).join("")}</div>` : ""}
      <p class="ws-sum">${b.wards} ${U(b).in} <b>${c.done}</b> తేలాయి · <b>${c.leading}</b> ఆధిక్యంలో · ${Math.max(0, b.wards - c.done - c.leading)} ఎదురుచూపు</p>
      <div class="stk ws-bar" role="img" aria-label="party share of wards">${bar}</div>
      <table class="tot ws-tot"><thead><tr><th>పార్టీ</th><th>గెలుపు</th><th>ఆధిక్యం</th></tr></thead><tbody>${c.parties.map((p) => `<tr><td><i class="dot" style="background:${COL[p]}"></i>${esc(pName(p))}</td><td>${c.won[p] || 0}</td><td>${c.lead[p] || 0}</td></tr>`).join("") || `<tr><td colspan="3">ఇంకా ఫలితాలు రాలేదు</td></tr>`}</tbody></table>
      <button class="big win ws-share" type="button" data-share="report-${b.id}">📋 ${esc(bName(b))} పూర్తి నివేదిక చిత్రం · ${b.type === "C" ? "మేయర్" : "చైర్‌పర్సన్"} మెజారిటీ, ${U(b).of} విజేతలు</button>
      <button class="big ws-share" type="button" data-share="wards-${b.id}">📷 ${esc(bName(b))} ${U(b).of} ఫలితాల చిత్రం</button>
      <h3>${U(b).of} వారీగా</h3>
      <div class="ws-grid" aria-label="${U(b).of} పటం">${grid}</div>
      ${Object.keys(c.unknown).length ? `<p class="ws-unk">${U(b).of} నంబరు తెలియని గెలుపులు: ${Object.entries(c.unknown).map(([k, n]) => `<span class="w" style="--c:${SIDE_COL[k]}">${n}</span> ${SIDE_TE[k]}`).join(" ")}</p>` : ""}
      <p class="ws-key"><span class="w" style="--c:#d4a000">1</span> గెలుపు <span class="l" style="--c:#d4a000">2</span> ఆధిక్యం <span>3</span> ఎదురుచూపు</p>
      ${rows ? `<table class="ws-list"><thead><tr><th>${unit(b)}</th><th>అభ్యర్థి</th><th>పార్టీ</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : `<p class="note">${U(b).of} వారీ వివరాలు ఇంకా రాలేదు.</p>`}`;
  }

  // share image: title, head post, party bar with numbers, then the ward grid
  async function draw(cv, o) {
    const id = cur, b = BY[id], r = rec(b), c = counts(b, r), wl = new Map((r.wardList || []).map((w) => [w[0], w])), h = r.head;
    const te = o.lang !== "en", { frame, stamp, F, fitText, partyName } = window.CD_img, L = (t, e) => (te ? t : e);
    const fr = await frame(cv, o, te ? bName(b) : b.name, L(`${U(b).of} వారీ ఫలితాలు · ఏపీ పుర ఎన్నికలు 2026`, `${b.type === "C" ? "Division" : "Ward"}-by-${b.type === "C" ? "division" : "ward"} results · AP civic polls 2026`)), { x, W, pad, top, bottom } = fr;
    const post = b.type === "C" ? L("మేయర్", "Mayor") : L("చైర్‌పర్సన్", "Chairperson");
    let y = top + 10;
    x.font = F(800, 30); x.fillStyle = h ? COL[h.party] : "#5b6475";
    const hs = h ? `${post}: ${partyName(h.party, te)} ${h.unopposed ? L("ఏకగ్రీవం", "unopposed") : h.status === "won" ? L("గెలుపు", "won") : L("ఆధిక్యం", "leads")}${h.name ? " · " + (TE.names[h.name] || h.name) : ""}${h.margin ? " · " + (h.status === "won" ? L(`మెజారిటీ ${(nf(h.margin) + (h.marginPlus ? "+" : ""))}`, `majority ${(nf(h.margin) + (h.marginPlus ? "+" : ""))}`) : L(`${(nf(h.margin) + (h.marginPlus ? "+" : ""))} ఓట్ల ఆధిక్యం`, `ahead by ${(nf(h.margin) + (h.marginPlus ? "+" : ""))}`)) : ""}` : `${post}: ${L("ఫలితం ఎదురుచూపు", "result awaited")}`;
    x.fillText(fitText(x, hs, W - pad * 2), pad, y + 22); y += 50;
    x.font = F(600, 22); x.fillStyle = "#5b6475";
    x.fillText(L(`${b.wards} ${U(b).in} ${c.done} తేలాయి · ${c.leading} ఆధిక్యంలో`, `${c.done} of ${b.wards} ${b.type === "C" ? "divisions" : "wards"} decided · ${c.leading} leading`), pad, y + 8); y += 26;
    // party bar
    const bw = W - pad * 2; let bx = pad;
    x.fillStyle = "#ececE6"; x.fillRect(pad, y, bw, 26);
    for (const p of c.parties) for (const [n, a] of [[c.won[p] || 0, 1], [c.lead[p] || 0, .45]]) { if (!n) continue; const w = (n / b.wards) * bw; x.globalAlpha = a; x.fillStyle = COL[p]; x.fillRect(bx, y, w, 26); x.globalAlpha = 1; bx += w; }
    y += 44;
    // party numbers
    const cols = Math.min(4, Math.max(1, c.parties.length)), cw = bw / cols;
    c.parties.slice(0, 8).forEach((p, i) => {
      const cx = pad + (i % cols) * cw, cy = y + Math.floor(i / cols) * 46;
      x.fillStyle = COL[p]; x.fillRect(cx, cy, 16, 16);
      x.fillStyle = "#111827"; x.font = F(700, 22); x.fillText(fitText(x, partyName(p, te), cw * .5), cx + 24, cy + 15);
      x.font = F(700, 22, true); x.fillText(`${c.won[p] || 0}${c.lead[p] ? " +" + c.lead[p] : ""}`, cx + cw * .62, cy + 15);
    });
    y += Math.ceil(Math.min(8, c.parties.length) / cols) * 46 + 6;
    if (Object.keys(c.unknown).length) {
      x.font = F(600, 19); x.fillStyle = "#5b6475";
      x.fillText(L(`నంబరు తెలియని గెలుపులు: `, `Wins with ward number not listed yet: `) + Object.entries(c.unknown).map(([k, n]) => `${te ? SIDE_TE[k] : { K: "Kutami", Y: "YSRCP", O: "Others" }[k]} ${n}`).join(" · "), pad, y + 14); y += 30;
    }
    // ward grid: as many columns as fit the space left
    const n = b.wards, avail = bottom - y, gap = 6;
    let colsG = Math.ceil(Math.sqrt((n * bw) / Math.max(avail, 1))), s = 0;
    for (; colsG <= n; colsG++) { s = (bw - gap * (colsG - 1)) / colsG; if (Math.ceil(n / colsG) * (s + gap) <= avail) break; }
    s = Math.min(s, 70);
    for (let i = 0; i < n; i++) {
      const w = wl.get(i + 1), gx = pad + (i % colsG) * (s + gap), gy = y + Math.floor(i / colsG) * (s + gap);
      x.fillStyle = w ? COL[w[1]] : "#ececE6"; x.globalAlpha = w && w[2] !== "won" ? .45 : 1;
      x.beginPath(); x.roundRect(gx, gy, s, s, Math.min(8, s * .2)); x.fill(); x.globalAlpha = 1;
      if (s >= 22) { x.fillStyle = w && w[2] === "won" ? "#fff" : "#374151"; x.font = F(700, Math.min(22, s * .42), true); x.textAlign = "center"; x.fillText(String(i + 1), gx + s / 2, gy + s / 2 + s * .15); x.textAlign = "left"; }
    }
    stamp(fr, te);
  }

  let cur = null;
  document.addEventListener("click", (e) => {
    const o = e.target.closest("[data-open]");
    if (o) {
      const id = (cur = o.dataset.open); window.apShareCustom[`wards-${id}`] = { title: BY[id].name, draw }; render(id); dlg.showModal();
      window.CD.wardList(id).then(() => { if (dlg.open && cur === id) render(id); }); // ward-by-ward list loads on open
      return;
    }
    if (e.target.closest("[data-wclose]") || e.target === dlg) dlg.close();
  });
  // keep an open sheet current as new results arrive
  const prev = window.CD_fx; window.CD_fx = () => { prev(); if (dlg.open && cur) render(cur); };
})();
