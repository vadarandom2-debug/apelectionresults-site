// Live tab: results that have not happened yet. Gram Panchayat (Sarpanch and ward member) polls in three phases,
// seats and urban bodies still awaiting a result, and the urban bodies where polling was deferred.
(() => {
  const { esc, nf, load, urban, ZP } = window.LB;
  const root = document.getElementById("upRoot"); if (!root) return;
  // SEC schedule: polling and counting on the same day; notification 13 / 16 / 19 Nov
  const GP = [
    { n: 1, notif: "2026-11-13", nom: "2026-11-17", wd: "2026-11-21", poll: "2026-11-26", gps: 3949, mandals: 201, nomin: 25985 },
    { n: 2, notif: "2026-11-16", nom: "2026-11-20", wd: "2026-11-24", poll: "2026-11-29", gps: 4960 },
    { n: 3, notif: "2026-11-19", nom: "2026-11-23", wd: "2026-11-27", poll: "2026-12-02" },
  ];
  const day = (s) => new Date(s + "T00:00:00+05:30");
  const fd = (s) => day(s).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const today = () => { const n = new Date(); return new Date(n.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) + "T00:00:00+05:30"); };
  const diff = (s) => Math.round((day(s) - today()) / 864e5);
  const when = (s) => { const d = diff(s); return d > 1 ? `${d} రోజుల్లో · in ${d} days` : d === 1 ? "రేపు · tomorrow" : d === 0 ? "ఈ రోజు · today" : "ముగిసింది · done"; };
  function stage(p) {
    const dn = diff(p.notif), dm = diff(p.nom), dw = diff(p.wd), dp = diff(p.poll);
    if (dp < 0) return ["ముగిసింది · Done", "done"]; if (dp === 0) return ["ఈ రోజు పోలింగ్ · Polling & counting today", "now"];
    if (dw < 0) return ["పోలింగ్ కోసం ఎదురుచూపు · Awaiting poll", "soon"]; if (dm < 0) return ["ఉపసంహరణ దశ · Withdrawals open", "soon"];
    if (dn <= 0) return ["నామినేషన్లు కొనసాగుతున్నాయి · Nominations open", "now"]; return [`నోటిఫికేషన్ ${when(p.notif)}`, "soon"];
  }
  const phase = (p) => { const [lab, cl] = stage(p); return `<article class="up-card ${cl}"><div class="up-n">దశ <b>${p.n}</b><small>Phase ${p.n}</small></div>
    <div class="up-poll"><small>పోలింగ్ · లెక్కింపు (అదే రోజు)</small><b>${fd(p.poll)}</b><span>${when(p.poll)}</span></div>
    <dl class="up-dl">${p.gps ? `<div><dt>సర్పంచ్ పదవులు</dt><dd>${nf(p.gps)}${p.mandals ? ` · ${p.mandals} మండలాలు` : ""}</dd></div>` : ""}${p.nomin ? `<div><dt>సర్పంచ్ నామినేషన్లు</dt><dd>${nf(p.nomin)}</dd></div>` : ""}<div><dt>నోటిఫికేషన్</dt><dd>${fd(p.notif)}</dd></div><div><dt>నామినేషన్ల చివరి తేదీ</dt><dd>${fd(p.nom)}</dd></div><div><dt>ఉపసంహరణ</dt><dd>${fd(p.wd)}</dd></div></dl>
    <p class="up-stage">${lab}</p><p class="up-res">పోలింగ్ ఉ. 7 – మ. 1 · లెక్కింపు మ. 2 నుంచి, ఫలితాలు అదే రోజు ఇక్కడ · Polling 7 AM – 1 PM, counting from 2 PM; results appear here the same day.</p></article>`; };

  function pendingMptc(D) {
    const S = D?.pend?.seats || {}, byD = {}; let n = 0;
    for (const [k, v] of Object.entries(S)) { if (!v.m?.length) continue; const [d, m] = k.split("/"); (byD[d] ||= []).push([m, v.m]); n += v.m.length; }
    if (!n) return `<p class="muted">ఎంపీటీసీ స్థానాలన్నీ తేలాయి · Every MPTC seat has a result.</p>`;
    const dl = ZP.districts.filter(([id]) => byD[id]).map(([id, name, te]) => `<details class="lb-d"><summary class="lb-row" style="--cols:minmax(0,1.6fr) minmax(0,.6fr)"><span class="lb-name"><b>${esc(te)}</b><small>${esc(name)}</small></span><span class="lb-tot">${byD[id].reduce((a, x) => a + x[1].length, 0)} స్థానాలు</span></summary>
      <div class="lb-scroll"><table class="lb-tbl"><thead><tr><th>మండలం · Mandal</th><th>ఎదురుచూస్తున్న ఎంపీటీసీ స్థానాలు</th><th>సంఖ్య</th></tr></thead><tbody>${byD[id].map(([m, seats]) => { const en = (ZP.mandals[id] || []).find((x) => x[0] === m)?.[1] || m; return `<tr><td><b>${esc(ZP.te?.[`${id}/${m}`] || en)}</b></td><td>${seats.map(esc).join(" · ")}</td><td class="num">${seats.length}</td></tr>`; }).join("")}</tbody></table></div></details>`).join("");
    return `<p class="muted">ఈ ${n} ఎంపీటీసీ స్థానాల ఫలితం ఇంకా ప్రకటించలేదు. ఫలితం వచ్చిన వెంటనే Local Bodies ట్యాబ్‌లో కనిపిస్తుంది.</p><div class="lb-list">${dl}</div>`;
  }
  function pendingUrban() {
    const U = urban().rows.filter((b) => !b.r2 && (!b.headWon || b.declared < b.wards));
    if (!U.length) return "";
    return `<table class="lb-tbl"><thead><tr><th>పట్టణం · Body</th><th>స్థితి</th></tr></thead><tbody>${U.map((b) => `<tr><td><b>${esc(window.AP_TE?.bodies?.[b.id] || b.name)}</b><small>${esc(b.district)}</small></td><td>${!b.head ? "ఫలితం ఇంకా రాలేదు · No result yet" : !b.headWon ? `${b.head.name ? esc(b.head.name) + " ముందంజ · " : ""}చైర్‌పర్సన్ ఫలితం ప్రకటించలేదు · head not declared` : ""}${b.declared < b.wards ? ` ${b.wards - b.declared} వార్డు${b.wards - b.declared > 1 ? "లు" : ""} మిగిలాయి · wards pending` : ""}</td></tr>`).join("")}</tbody></table>`;
  }
  // Urban round 2 (APSEC notification 1490/SEC-F1/2026, 12 Nov): the 23 bodies held back from the 1 Nov round. Wards and head-of-body reservation from APSEC's Phase II vital statistics.
  const R2 = [["Srikakulam", "C", 60, "Mayor: Women (General)"], ["Kakinada", "C", 66, "Mayor: BC (Women)"], ["Rajamahendravaram", "C", 72, "Mayor: SC (General)"], ["Mangalagiri-Tadepalli", "C", 62, "Mayor: ST (General)"],
    ["Amadalavalasa", "M", 28, "Chairperson: Women (General)"], ["Rajam", "M", 32, "Chairperson: BC (Women)"], ["Palakollu", "M", 44, "Chairperson: BC (Women)"], ["Tanuku", "M", 44, "Chairperson: Unreserved"], ["Bhimavaram", "M", 52, "Chairperson: Women (General)"], ["Tadepalligudem", "M", 48, "Chairperson: Unreserved"],
    ["Chintalapudi", "M", 23, "Chairperson: SC (Women)"], ["Tadigadapa", "M", 48, "Chairperson: BC (General)"], ["Gudivada", "M", 48, "Chairperson: BC (Women)"], ["Ponnur", "M", 40, "Chairperson: Women (General)"], ["Bapatla", "M", 44, "Chairperson: SC (General)"], ["Narasaraopet", "M", 48, "Chairperson: Unreserved"],
    ["Kandukur", "M", 40, "Chairperson: Unreserved"], ["Podili", "M", 28, "Chairperson: SC (General)"], ["Gudur (Nellore)", "M", 48, "Chairperson: ST (Women)"], ["Kavali", "M", 44, "Chairperson: Unreserved"], ["Alluru", "M", 23, "Chairperson: ST (General)"], ["Srikalahasti", "M", 44, "Chairperson: BC (General)"], ["B. Kothakota", "M", 23, "Chairperson: BC (General)"]];
  function deferred() {
    const dist = Object.fromEntries((window.AP_DEFERRED || []).map((x) => [x[0], x[2]])), wards = R2.reduce((n, r) => n + r[2], 0), U = Object.fromEntries(urban().rows.filter((b) => b.r2).map((b) => [b.name, b])), hp = (b) => (b.head ? `${esc((window.LB.PN[window.LB.p5(b.head.party)] || [""])[0])} · ${esc(b.head.name)}${b.headWon ? "" : " (ముందంజ)"}` : "—");
    return `<div class="lb-sumstrip" style="margin:0 0 12px"><div><small>పోలింగ్ · Poll</small><b>26 Nov</b><i>7 AM – 5 PM</i></div><div><small>రీపోల్ · Re-poll</small><b>27 Nov</b><i>if ordered</i></div><div><small>లెక్కింపు · Counting</small><b>30 Nov</b><i>from 8 AM</i></div><div><small>సంస్థలు · Bodies</small><b>${R2.length}</b><i>${nf(wards)} wards</i></div></div>
      <p class="muted">కోర్టు కేసులు, వార్డుల పునర్విభజన కారణంగా మొదటి విడతలో ఆగిన ${R2.length} పట్టణ సంస్థలకు (4 కార్పొరేషన్లు, 19 మున్సిపాలిటీలు / నగర పంచాయతీలు) ఈ రోజు పోలింగ్ — ఫలితాలు 30 నవంబర్‌న. మేయర్ / చైర్‌పర్సన్‌ను ప్రజలే నేరుగా ఎన్నుకుంటారు. · Polling today in the 23 urban bodies held back from the 1 Nov round; results on 30 Nov. Mayors and chairpersons are elected directly.</p>
      <div class="lb-scroll"><table class="lb-tbl"><thead><tr><th>పట్టణం · Body</th><th>జిల్లా</th><th>వార్డులు</th><th>మేయర్ / చైర్‌పర్సన్ రిజర్వేషన్</th><th>ఫలితం · Result</th></tr></thead><tbody>${R2.map(([n, t, w, o]) => `<tr><td><b>${esc(n)}</b><small>${t === "C" ? "Municipal corporation" : "Municipality / Nagar panchayat"}</small></td><td>${esc(dist[n] || "")}</td><td>${w}</td><td>${esc(o)}</td><td>${U[n] && (U[n].declared || U[n].head) ? `<b>${U[n].declared}/${w}</b> వార్డులు · కూటమి ${U[n].w.K} · వైసీపీ ${U[n].w.Y} · ఇతరులు ${U[n].w.O}<small>${hp(U[n])}</small>` : "<small>30 నవంబర్‌న</small>"}</td></tr>`).join("")}</tbody></table></div>`;
  }
  // once the panchayat feed (live/gp.json) has declared results, show the Sarpanch tally here
  function gpTally(G) {
    const rows = G?.gp || [], done = rows.filter((g) => g[4]); if (!done.length) return "";
    const o = { K: 0, Y: 0, O: 0 }; for (const g of done) o[g[4]]++;
    return `<div class="lb-sumstrip" style="margin:0 0 12px"><div><small>ప్రకటించిన సర్పంచ్ ఫలితాలు</small><b>${nf(done.length)}</b><i>of ${nf(rows.length)}</i></div><div><small>కూటమి మద్దతు</small><b style="color:var(--TDP)">${nf(o.K)}</b></div><div><small>వైసీపీ మద్దతు</small><b style="color:var(--YSRCP)">${nf(o.Y)}</b></div><div><small>ఇతరులు · స్వతంత్రులు</small><b style="color:var(--OTH)">${nf(o.O)}</b></div></div>`;
  }
  let GPD = null, LASTD = null;
  fetch(`live/gp.json?t=${Math.floor(Date.now() / 60000)}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((j) => { GPD = j; draw(LASTD); }).catch(() => {});
  function draw(D) {
    LASTD = D;
    root.innerHTML = `<div class="wrap lb"><div class="lb-top"><p class="eyebrow"><span class="live-dot"></span> Live · Upcoming results</p><h2>రాబోయే ఫలితాలు <span class="lb-en">Results still to come</span></h2>
      <p class="muted">ఇంకా జరగని ఎన్నికలు, ఫలితాలు రాని స్థానాలు — నోటిఫికేషన్ వివరాలతో. పూర్తయిన ఫలితాలు <a href="#/local">Local Bodies</a> ట్యాబ్‌లో.</p></div>
      <h3 class="lb-h">గ్రామ పంచాయతీ ఎన్నికలు · Gram Panchayat elections <small>సర్పంచ్, వార్డు సభ్యులు · 3 దశలు · 13,000కు పైగా పంచాయతీలు</small></h3>
      ${gpTally(GPD)}
      <div class="up-grid">${GP.map(phase).join("")}</div>
      <h3 class="lb-h">ఫలితం రాని ఎంపీటీసీ స్థానాలు · MPTC seats still awaited</h3>${pendingMptc(D)}
      <h3 class="lb-h">ఫలితం రాని పట్టణ సంస్థలు · Urban bodies awaiting a result</h3>${pendingUrban() || `<p class="muted">అన్నీ తేలాయి · All declared.</p>`}
      <h3 class="lb-h">పట్టణ సంస్థలు రెండో విడత · Urban bodies, round 2 — polling 26 Nov, counting 30 Nov</h3>${deferred()}</div>`;
  }
  draw(null); load().then(draw);
})();
