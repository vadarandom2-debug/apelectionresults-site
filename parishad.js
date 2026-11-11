// ZPTC / MPTC results page: statewide, district by district, mandal by mandal. Reads only the rural results
// (meta "rural" and "mandals"), never the civic ones. Demo numbers exist only on localhost with ?demo, under the red banner.
(() => {
  const TE = window.AP_TE, ZP = window.AP_ZP, N = window.AP_RURAL, UO = window.AP_UNOPPOSED?.totals || {};
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DEMO = new URLSearchParams(location.search).has("demo") && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const COUNT_AT = Date.parse("2026-11-07T08:00:00+05:30");
  const KUT = ["TDP", "JSP", "BJP"], ORDER = ["TDP", "JSP", "BJP", "NDA", "YSRCP", "INC", "LEFT", "OTH"];
  const COL = { TDP: "#d4a000", JSP: "#c4122f", BJP: "#f28c00", NDA: "#d4a000", YSRCP: "#1d5fc4", INC: "#16936a", LEFT: "#6a3d9a", OTH: "#8a93a6", K: "#d4a000", Y: "#1d5fc4", O: "#8a93a6" };
  const SIDES = [["K", "కూటమి"], ["Y", "వైఎస్సార్‌సీపీ"], ["O", "ఇతరులు"]];
  const side = (p) => (KUT.includes(p) || p === "NDA" ? "K" : p === "YSRCP" ? "Y" : "O");
  const pName = (p) => (p === "NDA" ? "కూటమి" : (TE.parties[p] || [p])[0]);
  const nf = (n) => Number(n || 0).toLocaleString("en-IN");
  const sum = (o) => Object.values(o || {}).reduce((a, n) => a + n, 0);
  const maxMerge = (...os) => { const r = {}; for (const o of os) for (const [p, n] of Object.entries(o || {})) r[p] = Math.max(r[p] || 0, n); return r; };
  // Kutami seats: an unsplit NDA number already holds its parties' seats, so take the larger, never the sum
  const kut = (o) => Math.max(o.NDA || 0, KUT.reduce((a, p) => a + (o[p] || 0), 0));
  const bySide = (o) => ({ K: kut(o), Y: o.YSRCP || 0, O: ["INC", "LEFT", "OTH"].reduce((a, p) => a + (o[p] || 0), 0) });

  const DIST = ZP.districts.map(([id, name, te, zptc, mptc]) => ({ id, name, te, zptc, mptc, mandals: ZP.mandals[id] || [] }));
  const DBY = Object.fromEntries(DIST.map((d) => [d.id, d]));
  const mName = (d, m) => ZP.te?.[d + "/" + m[0]] || m[1]; // Telugu name, English as fallback
  const mHit = (d, m, ql) => m[1].toLowerCase().includes(ql) || mName(d, m).includes(q);
  // MPTC winners by name: live/d/<district>.json, read when that district opens (and again each minute while open)
  const SEATS = {}, seatAt = {};
  async function seats(id) {
    if (DEMO || (SEATS[id] && Date.now() - seatAt[id] < 60000)) return;
    seatAt[id] = Date.now();
    try { const r = await fetch(`live/d/${id}.json?t=${Math.floor(Date.now() / 60000)}`, { cache: "no-store" }); if (r.ok) { SEATS[id] = await r.json(); const el = document.querySelector(`#d-${id}[open] .pz-m`); if (el) el.innerHTML = mandalRows(DBY[id]); } } catch {}
  }
  // unopposed ZPTCs: named mandals, plus Kadapa's three whose names were not reported (all TDP)
  const UO_EXTRA = { kadapa: { TDP: 3 } };
  const uoD = {}; for (const [k, [p]] of Object.entries(ZP.unopposed)) { const d = k.split("/")[0]; (uoD[d] ||= {})[p] = (uoD[d][p] || 0) + 1; }
  for (const [d, o] of Object.entries(UO_EXTRA)) for (const [p, n] of Object.entries(o)) (uoD[d] ||= {})[p] = (uoD[d][p] || 0) + n;

  let R = { rural: {}, mandals: {}, updated: null }, lastOk = 0, sb = null, kind = "zptc", open = null, q = "";

  // ---------- one mandal, one district, the state ----------
  const mandal = (d, m) => {
    const r = R.mandals[d + "/" + m[0]] || {}, u = ZP.unopposed[d + "/" + m[0]];
    const z = u ? { party: u[0], status: "won", unopposed: true, ...(r.z?.party === u[0] && r.z.name ? { name: r.z.name } : {}) } : r.z || null;
    return { z, m: r.m || { won: {}, declared: 0 }, nopoll: !!m[2], ac: u?.[1] };
  };
  function district(d) {
    const zs = {}, zl = {}, ms = {}, ml = {}; let md = 0;
    for (const m of d.mandals) { const x = mandal(d.id, m); if (x.z) (x.z.status === "won" ? zs : zl)[x.z.party] = ((x.z.status === "won" ? zs : zl)[x.z.party] || 0) + 1; for (const [p, n] of Object.entries(x.m.won || {})) ms[p] = (ms[p] || 0) + n; for (const [p, n] of Object.entries(x.m.leads || {})) ml[p] = (ml[p] || 0) + n; md += x.m.declared || sum(x.m.won); }
    const rz = R.rural["zptc:" + d.id] || {}, rm = R.rural["mptc:" + d.id] || {};
    const zSeats = maxMerge(rz.seats, zs, uoD[d.id]), mSeats = maxMerge(rm.seats, ms);
    return { zptc: { seats: zSeats, leads: zl, declared: Math.min(d.zptc, Math.max(rz.declared || 0, sum(zs), sum(uoD[d.id]))), total: d.zptc },
      mptc: { seats: mSeats, leads: ml, declared: Math.min(d.mptc, Math.max(rm.declared || 0, md)), total: d.mptc } };
  }
  function state() {
    const all = DIST.map(district), out = {};
    for (const k of ["zptc", "mptc"]) {
      const r = R.rural[k] || {}, ds = {}, dl = {}; let dd = 0;
      for (const x of all) { for (const [p, n] of Object.entries(x[k].seats)) ds[p] = (ds[p] || 0) + n; for (const [p, n] of Object.entries(x[k].leads)) dl[p] = (dl[p] || 0) + n; dd += x[k].declared; }
      // once the mandal data covers the unopposed seats it is exact; the press-reported party split (it adds up to more than
      // the SEC's total) is only a floor before that
      const seats = maxMerge(r.seats, ds, dd >= (UO[k]?.total || 0) ? null : UO[k]?.split);
      out[k] = { seats, leads: dl, declared: Math.min(N[k], Math.max(r.declared || 0, dd, UO[k]?.total || 0)), total: N[k] };
    }
    return out;
  }

  // ---------- drawing ----------
  const bar = (t, h = 14) => { const s = bySide(t.seats), l = bySide(t.leads), seg = (n, c, o = "") => (n ? `<i style="width:${(n / t.total) * 100}%;background:${c}${o}" title="${nf(n)}"></i>` : "");
    return `<span class="pz-bar" style="height:${h}px">${SIDES.map(([k]) => seg(s[k], COL[k])).join("")}${SIDES.map(([k]) => seg(l[k], COL[k], ";opacity:.4")).join("")}</span>`; };
  function scoreCard(k, t, title) {
    const s = bySide(t.seats), l = bySide(t.leads), u = UO[k]?.total || 0, lead = sum(l);
    return `<article class="pz-card"><h3>${title} <small>${nf(t.total)} స్థానాలు</small></h3>
      <div class="pz-big">${SIDES.map(([sd, name]) => `<div style="--c:${COL[sd]}"><b>${nf(s[sd])}</b><span>${name}${l[sd] ? ` <em>+${nf(l[sd])} ఆధిక్యం</em>` : ""}</span></div>`).join("")}</div>
      ${bar(t, 18)}<p class="pz-prog"><span>తేలినవి <b>${nf(t.declared)}</b></span><span>ఏకగ్రీవం <b>${nf(u)}</b></span>${lead ? `<span>ఆధిక్యం <b>${nf(lead)}</b></span>` : ""}<span>ఎదురుచూపు <b>${nf(Math.max(0, t.total - t.declared - lead))}</b></span></p>
      <button class="big" type="button" data-share="${k}">📷 ${title} ఫలితాల చిత్రం</button></article>`;
  }
  function partyTable(S) {
    const row = (p, cls = "") => `<tr class="${cls}"><td><i class="dot" style="background:${COL[p]}"></i>${pName(p)}</td><td>${nf(S.zptc.seats[p] || 0)}</td><td>${nf(S.mptc.seats[p] || 0)}</td></tr>`;
    const split = !S.zptc.seats.NDA && !S.mptc.seats.NDA;
    $("#party").innerHTML = `<tr class="sum"><td>కూటమి</td><td>${nf(kut(S.zptc.seats))}</td><td>${nf(kut(S.mptc.seats))}</td></tr>${split ? KUT.map((p) => row(p, "sub")).join("") : ""}${row("YSRCP", "sum")}${["INC", "LEFT", "OTH"].map((p) => row(p)).join("")}`;
    const uo = (k) => ORDER.filter((p) => UO[k]?.split?.[p]).map((p) => `${pName(p)} ${nf(UO[k].split[p])}`).join(" · ");
    $("#uoNote").innerHTML = `ఏకగ్రీవం · జడ్పీటీసీ ${nf(UO.zptc?.total)}: ${uo("zptc")}<br>ఎంపీటీసీ ${nf(UO.mptc?.total)}: ${uo("mptc")}`;
  }
  const leader = (t) => { const s = bySide(maxMerge(t.seats, Object.fromEntries(Object.entries(t.leads).map(([p, n]) => [p, (t.seats[p] || 0) + n])))); const top = SIDES.map(([k]) => k).sort((a, b) => s[b] - s[a]); return s[top[0]] ? (s[top[0]] === s[top[1]] ? "tie" : top[0]) : null; };
  function tiles(all) {
    $("#tiles").innerHTML = DIST.map((d, i) => { const t = all[i][kind], s = bySide(t.seats), L = leader(t), maj = s[L] * 2 > t.total;
      return `<button type="button" class="pz-tile${L && L !== "tie" ? (maj ? " maj" : " ahead") : ""}" data-d="${d.id}" style="--c:${COL[L] || "#e3e3dc"}" aria-label="${esc(d.name)}"><b>${esc(d.te)}</b><span>${SIDES.map(([k]) => `<u${maj ? "" : ` style="color:${COL[k]}"`}>${nf(s[k])}</u>`).join("·")}<small>/${nf(t.total)}</small></span>${sum(t.leads) ? `<i class="pz-tl">+${nf(sum(t.leads))} ఆధిక్యం</i>` : ""}</button>`; }).join("");
  }
  // assembly constituencies: seat counts per constituency from live/ac.json (the job groups ETV Bharat's seats by constituency)
  let AC = null;
  function acTiles() {
    const box = $("#acs"); if (!box) return;
    if (!AC) { box.innerHTML = `<p class="note">నియోజకవర్గాల వివరాలు లోడ్ అవుతున్నాయి…</p>`; return; }
    const ql = q.toLowerCase(), by = {}, teBy = {}; for (const a of AC) if (a.te) teBy[a.en] = a.te;
    for (const a of AC) { const d = DBY[a.d]; if (!d) continue; if (ql && !(a.en.toLowerCase().includes(ql) || (a.te || "").includes(q) || d.name.toLowerCase().includes(ql) || d.te.includes(q))) continue; (by[a.d] ||= []).push(a); }
    box.innerHTML = DIST.filter((d) => by[d.id]).map((d) => `<h3 class="pz-ah">${esc(d.te)} <small>${nf(by[d.id].length)} నియోజకవర్గాలు</small></h3><div class="pz-tiles">${by[d.id].map((a) => {
      const c = a[kind === "zptc" ? "z" : "m"], t = { total: c.t, seats: c.s, leads: c.l }, s = bySide(t.seats), L = leader(t), maj = s[L] * 2 > t.total;
      return `<button type="button" class="pz-tile${L && L !== "tie" ? (maj ? " maj" : " ahead") : ""}" data-d="${d.id}" style="--c:${COL[L] || "#e3e3dc"}" aria-label="${esc(a.en)}"><b>${esc(a.te || teBy[a.en] || a.en)}</b><span>${SIDES.map(([k]) => `<u${maj ? "" : ` style="color:${COL[k]}"`}>${nf(s[k])}</u>`).join("·")}<small>/${nf(t.total)}</small></span>${sum(t.leads) ? `<i class="pz-tl">+${nf(sum(t.leads))} ఆధిక్యం</i>` : ""}</button>`; }).join("")}</div>`).join("") || `<p class="note">ఏదీ దొరకలేదు</p>`;
  }
  async function readAc() {
    try { const r = await fetch(`live/ac.json?t=${Math.floor(Date.now() / 60000)}`, { cache: "no-store" }); if (!r.ok) throw 0; const j = await r.json(); if (j?.acs?.length) { AC = j.acs; try { localStorage.setItem("pz-ac", JSON.stringify(j.acs)); } catch {} acTiles(); } } catch {}
  }
  function mandalRows(d) {
    const ql = q.toLowerCase();
    return d.mandals.filter((m) => !ql || d.name.toLowerCase().includes(ql) || d.te.includes(q) || mHit(d.id, m, ql)).map((m) => {
      const x = mandal(d.id, m), z = x.z, mw = x.m.won || {};
      const zt = x.nopoll ? `<span class="pz-np">పోలింగ్ లేదు (అమరావతి)</span>` : z ? `<span class="pz-w" style="--c:${COL[z.party]}"><i></i>${pName(z.party)} ${z.unopposed ? "ఏకగ్రీవం" : z.status === "won" ? "గెలుపు" : "ఆధిక్యం"}</span>${z.name ? ` <small>${esc(z.name)}</small>` : ""}` : `<span class="pz-wait">ఎదురుచూపు</span>`;
      const ml = x.m.leads || {}, mt = sum(mw) + sum(ml) ? ORDER.filter((p) => mw[p] || ml[p]).map((p) => `<span style="--c:${COL[p]}"><i></i>${pName(p)} ${mw[p] || 0}${ml[p] ? ` <small class="ld">+${ml[p]} ఆధిక్యం</small>` : ""}</span>`).join("") : "";
      // the ZPTC / MPTC switch decides what each mandal shows
      if (kind === "mptc") { const tot = (p) => (mw[p] || 0) + ((x.m.leads || {})[p] || 0), top = ORDER.filter(tot).sort((a, b) => tot(b) - tot(a))[0];
        return `<div class="pz-mr${top ? "" : " wait"}" style="--c:${top ? COL[top] : "#e3e3dc"}"><p class="mh"><b>${esc(mName(d.id, m))}</b><span>${x.nopoll ? `<span class="pz-np">పోలింగ్ లేదు (అమరావతి)</span>` : sum(mw) + sum(x.m.leads || {}) ? `${nf(x.m.declared || sum(mw))} తేలాయి` : `<span class="pz-wait">ఎదురుచూపు</span>`}</span></p>${mt ? `<p class="pz-mp">${mt}</p>` : ""}${(SEATS[d.id]?.[m[0]] || []).length ? `<ul class="pz-seats">${SEATS[d.id][m[0]].map(([seat, p, st, who]) => `<li style="--c:${COL[p] || COL.OTH}"><i></i><b>${esc(seat)}</b> ${esc(who)} <small>${pName(p)}${st === "won" ? "" : " · ఆధిక్యం"}</small></li>`).join("")}</ul>` : ""}</div>`; }
      return `<div class="pz-mr${z ? "" : " wait"}" style="--c:${z ? COL[z.party] : "#e3e3dc"}"><p class="mh"><b>${esc(mName(d.id, m))}</b><span>${zt}</span></p>${x.ac ? `<small>${esc(x.ac)} నియోజకవర్గం</small>` : ""}</div>`;
    }).join("");
  }
  function dists(all) {
    const ql = q.toLowerCase();
    $("#dists").innerHTML = DIST.map((d, i) => {
      const hit = !ql || d.name.toLowerCase().includes(ql) || d.te.includes(q) || d.mandals.some((m) => mHit(d.id, m, ql)); if (!hit) return "";
      const a = all[i], zs = bySide(a.zptc.seats), ms = bySide(a.mptc.seats), isOpen = open === d.id || (ql && ql.length > 2);
      return `<details class="pz-d" id="d-${d.id}" ${isOpen ? "open" : ""}><summary><span class="nm">${esc(d.te)} <small>${esc(d.name)}</small></span>
          ${kind === "zptc" ? `<span class="pz-row"><em>జడ్పీటీసీ</em>${bar(a.zptc)}<b>${SIDES.map(([k]) => `<u style="color:${COL[k]}">${zs[k]}</u>`).join("·")}<small>/${a.zptc.total}</small></b>${sum(a.zptc.leads) ? `<small class="pz-rl">+${sum(a.zptc.leads)} ఆధిక్యం</small>` : ""}</span>`
            : `<span class="pz-row"><em>ఎంపీటీసీ</em>${bar(a.mptc)}<b>${SIDES.map(([k]) => `<u style="color:${COL[k]}">${nf(ms[k])}</u>`).join("·")}<small>/${nf(a.mptc.total)}</small></b></span>`}</summary>
        <div class="pz-in"><p class="note">${d.mandals.length} మండలాలు · ${kind === "zptc" ? `జడ్పీటీసీ ${a.zptc.declared}/${a.zptc.total} తేలాయి` : `ఎంపీటీసీ ${nf(a.mptc.declared)}/${nf(a.mptc.total)} తేలాయి`}</p>
          <button class="big" type="button" data-share="d-${d.id}">📷 ${esc(d.te)} జిల్లా ఫలితాల చిత్రం</button>
          <div class="pz-m">${isOpen ? mandalRows(d) : ""}</div></div></details>`;
    }).join("") || `<p class="note">దొరకలేదు</p>`;
  }
  function polling() {
    const T = window.AP_TURNOUT_RURAL; if (!T) return;
    const last = T.state[T.state.length - 1], max = Math.max(...T.districts.map((d) => d[2])), box = (n, t, c = "") => `<div class="${c}"><b>${n}</b><span>${t}</span></div>`;
    $("#rpoll").innerHTML = `<h2>పోలింగ్ 5 నవంబర్ <small>${T.final ? "తుది పోలింగ్ శాతం" : "ఎస్‌ఈసీ తుది లెక్క రావాలి"}</small></h2>${T.note ? `<p class="note">${esc(T.note)}</p>` : ""}
      <div class="kpi r">${box(nf(N.zptc - (UO.zptc?.total || 0)), "జడ్పీటీసీ స్థానాల్లో పోలింగ్")}${box(nf(N.mptc - (UO.mptc?.total || 0)), "ఎంపీటీసీ స్థానాల్లో పోలింగ్")}${box(last[1] + "%", "పోలింగ్ ముగిసే సరికి", "w")}${box(nf((UO.zptc?.total || 0) + (UO.mptc?.total || 0)), "ఏకగ్రీవం (రెండూ కలిపి)", "u")}</div>
      <p class="ch-h"><span>జిల్లాల వారీ పోలింగ్</span></p>${T.districts.map(([, te, v, at]) => `<div class="race"><span class="pn">${te} <small>${at}</small></span><span class="tr"><b style="width:${(v / max) * 100}%;background:#128c4b"></b></span><span class="sv">${v}%</span></div>`).join("")}
      <p class="note">సమయం వారీ: ${T.state.map(([h, v]) => `${h} ${v}%`).join(" · ")}</p>`;
  }
  function countdown() {
    const left = COUNT_AT - Date.now(), el = $("#cd"); el.hidden = DEMO || left <= 0; if (el.hidden) return;
    const n = Math.floor(left / 1000), cell = (v, t) => `<div><b>${String(v).padStart(2, "0")}</b><span>${t}</span></div>`;
    el.innerHTML = `<p>జడ్పీటీసీ, ఎంపీటీసీ ఫలితాలకు ఇంకా</p><div class="cd-n">${cell(Math.floor(n / 86400), "రోజులు")}${cell(Math.floor(n / 3600) % 24, "గంటలు")}${cell(Math.floor(n / 60) % 60, "నిమిషాలు")}${cell(n % 60, "సెకన్లు")}</div><p class="cd-at">7 నవంబర్, ఉదయం 8 గంటలకు లెక్కింపు</p>`;
  }
  function liveBar() {
    const el = $("#live"), now = Date.now(); el.hidden = false; el.className = "livebar";
    if (DEMO) return (el.textContent = "డెమో సంఖ్యలు");
    if (now < COUNT_AT) return (el.textContent = "లెక్కింపు మొదలవగానే ఫలితాలు ఇక్కడ వాటంతట అవే వస్తాయి. పేజీ రిఫ్రెష్ చేయాల్సిన అవసరం లేదు.");
    if (!lastOk || now - lastOk > 300000) { el.textContent = "కనెక్షన్ సమస్య: ఫలితాలు పాతవి కావచ్చు. పేజీని రిఫ్రెష్ చేయండి."; el.className = "livebar bad"; return; }
    const mins = R.updated ? Math.max(0, Math.round((now - Date.parse(R.updated)) / 60000)) : null;
    el.textContent = mins == null ? "● ప్రత్యక్ష ఫలితాలు" : `● ప్రత్యక్ష ఫలితాలు · ${mins} నిమిషాల క్రితం నవీకరణ`;
  }
  function render() {
    const S = state(), all = DIST.map(district);
    $("#score").innerHTML = scoreCard("zptc", S.zptc, "జడ్పీటీసీ") + scoreCard("mptc", S.mptc, "ఎంపీటీసీ");
    partyTable(S); tiles(all); dists(all); acTiles(); liveBar();
    if (kind === "mptc" && open) seats(open);
    window.PZ_fx?.(S, all); // optional extra view (parishad-x.html)
    const done = S.zptc.declared >= N.zptc && S.mptc.declared >= N.mptc, live = DEMO || Date.now() >= COUNT_AT;
    $("#stateT").textContent = DEMO ? "DEMO" : done && !DEMO ? "పూర్తి" : "LIVE"; $("#state").className = "live-btn" + (live && !done ? " on" : "");
  }

  // ---------- events ----------
  document.addEventListener("click", (e) => {
    const k = e.target.closest("[data-k]"); if (k) { kind = k.dataset.k; document.querySelectorAll("[data-k]").forEach((b) => b.setAttribute("aria-pressed", b === k)); render(); }
    const o = e.target.closest("[data-open]"); if (o) window.open(o.dataset.open, "_blank", "noopener");
    const j = e.target.closest("[data-jump]"); if (j) $("#" + j.dataset.jump)?.scrollIntoView({ behavior: "smooth", block: "start" });
    const t = e.target.closest(".pz-tile"); if (t) { open = t.dataset.d; render(); $("#d-" + open)?.scrollIntoView({ behavior: "smooth", block: "start" }); }
    if (e.target.closest("#state")) { refresh(); const b = $("#stateT"), was = b.textContent; b.textContent = "✓"; setTimeout(() => (b.textContent = was), 900); }
  });
  // a district's mandal table is built when it opens (663 rows would slow phones)
  document.addEventListener("toggle", (e) => { const d = e.target.closest?.(".pz-d"); if (!d) return; const id = d.id.slice(2); if (d.open) { open = id; d.querySelector(".pz-m").innerHTML = mandalRows(DBY[id]); if (kind === "mptc") seats(id); } else if (open === id) open = null; }, true);
  $("#q").addEventListener("input", (e) => { q = e.target.value.trim(); render(); });

  // ---------- data ----------
  // Main source: live/rural.json, a plain file on this site (Cloudflare-cached, refreshed from ETV Bharat by a GitHub job),
  // read every minute. Supabase is only a backup, read rarely, to stay inside its free data limit.
  const LIVE = "live/rural.json";
  let fileOk = 0, dbAt = 0, DB = { rural: {}, mandals: {}, updated: null }, FILE = { mandals: {}, updated: null };
  const merge = () => {
    const mandals = { ...DB.mandals }; // the file wins mandal by mandal, except a declared ZPTC it doesn't have
    for (const [k, v] of Object.entries(FILE.mandals || {})) { const o = mandals[k]; mandals[k] = o?.z?.status === "won" && v.z?.status !== "won" ? { ...v, z: o.z } : v; }
    const ups = [FILE.updated, DB.updated].filter(Boolean).sort();
    R = { rural: DB.rural || {}, mandals, updated: ups.pop() || null }; lastOk = Date.now(); render();
  };
  // TV9 Telugu's statewide MPTC "ahead" figure (the job writes live/tv9.json): the only source that has MPTC leads
  let TV9 = null;
  async function readTv9() {
    try { const r = await fetch(`live/tv9.json?t=${Math.floor(Date.now() / 60000)}`, { cache: "no-store" }); if (!r.ok) return; const j = await r.json(); if (j?.mptc) { TV9 = j; render(); } } catch {}
  }
  async function readFile() {
    try { const r = await fetch(`${LIVE}?t=${Math.floor(Date.now() / 60000)}`, { cache: "no-store" }); if (!r.ok) throw 0; const j = await r.json(); FILE = { mandals: j.mandals || {}, updated: j.updated || null }; fileOk = Date.now(); try { localStorage.setItem("pz-file", JSON.stringify({ ...FILE, t: fileOk })); } catch {} merge(); return true; }
    catch { return false; }
  }
  async function readDb() {
    if (!sb) return;
    const { data, error } = await sb.from("meta").select("key,value").in("key", ["updated", "rural", "mandals"]);
    if (error) return console.warn("results:", error);
    const m = Object.fromEntries(data.map((x) => [x.key, x.value])); DB = { rural: m.rural || {}, mandals: m.mandals || {}, updated: m.updated || null }; merge();
  }
  // the database only when the file is missing or stale, at most every 10 minutes per visitor; its library loads only then
  let lib = null;
  const db = () => (lib ||= new Promise((res) => {
    const url = window.SUPABASE_URL, key = window.SUPABASE_ANON_KEY; if (!url || !key) return res(null);
    const sc = document.createElement("script"); sc.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";
    sc.onload = () => res((sb = window.supabase.createClient(url, key, { auth: { persistSession: false } }))); sc.onerror = () => res(null); document.head.appendChild(sc);
  }));
  // the last file this device received: shown straight away, so a slow or failed load never leaves the district tiles at 0
  function restore() {
    try { const a = JSON.parse(localStorage.getItem("pz-ac") || "null"); if (Array.isArray(a) && a.length) AC = a; } catch {}
    try { const c = JSON.parse(localStorage.getItem("pz-file") || "null"); if (c?.mandals && Date.now() - c.t < 36e5 * 24) { FILE = { mandals: c.mandals, updated: c.updated || null }; fileOk = c.t; merge(); } } catch {}
  }
  let retry = 0;
  async function load() {
    const ok = await readFile(); readTv9(); readAc();
    if (!ok && retry++ < 6) setTimeout(load, 8000); else if (ok) retry = 0; // a missed read is tried again in 8 seconds
    if ((!ok || Date.now() - fileOk > 300000) && Date.now() - dbAt > 600000) { dbAt = Date.now(); if (await db()) await readDb(); }
    if (!lastOk) liveBar();
  }
  let refresh = () => load();
  function connect() {
    load(); setTimeout(() => setInterval(() => { if (!document.hidden) load(); }, 60000), Math.random() * 20000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && Date.now() - lastOk > 60000) load(); });
  }

  // ---------- demo (localhost only) ----------
  function simulate(p) {
    const rnd = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };
    const mandals = {};
    for (const d of DIST) for (const m of d.mandals) {
      const k = d.id + "/" + m[0]; if (m[2]) continue;
      const f = Math.max(0, Math.min(1, (p - rnd(k + "s") * 60) / 40)); if (!f) continue;
      const lead = rnd(k) < .6 ? "TDP" : rnd(k + "y") < .8 ? "YSRCP" : rnd(k + "j") < .6 ? "JSP" : "BJP", n = Math.max(4, Math.round(d.mptc / d.mandals.length)), dec = Math.round(n * f), a = Math.round(dec * .58), b = Math.round((dec - a) * .8);
      mandals[k] = { z: { party: lead, status: f >= 1 ? "won" : "leading" }, m: { declared: dec, won: { [lead]: a, [lead === "YSRCP" ? "TDP" : "YSRCP"]: b, OTH: dec - a - b } } };
    }
    return { rural: {}, mandals, updated: new Date().toISOString() };
  }
  window.PZ = { get TV9() { return TV9; }, get R() { return R; }, get kind() { return kind; }, setKind: (k) => document.querySelector(`[data-k="${k}"]`)?.click(), openDistrict: (id) => document.querySelector(`.pz-tile[data-d="${id}"]`)?.click(), mName, DIST, DBY, COL, SIDES, side, pName, nf, sum, kut, bySide, state, district, mandal, DEMO, UO, N };
  setInterval(countdown, 1000); setInterval(liveBar, 20000); countdown(); polling();
  if (new URLSearchParams(location.search).has("embed")) document.documentElement.classList.add("embed");
  if (DEMO) { $("#demoBar").hidden = false; const go = () => { const p = +$("#demoP").value; $("#demoV").textContent = p + "%"; R = simulate(p); lastOk = Date.now(); render(); }; $("#demoP").addEventListener("input", go); go(); }
  else { restore(); render(); connect(); }
})();
