// Live tab: results that have not happened yet. Gram Panchayat (Sarpanch and ward member) polls in three phases,
// seats and urban bodies still awaiting a result, and the urban bodies where polling was deferred.
(() => {
  const { esc, nf, load, urban, ZP } = window.LB;
  const root = document.getElementById("upRoot"); if (!root) return;
  // SEC schedule: polling and counting on the same day; notification 13 / 16 / 19 Nov
  const GP = [
    { n: 1, notif: "2026-11-13", nom: "2026-11-17", wd: "2026-11-21", poll: "2026-11-26" },
    { n: 2, notif: "2026-11-16", nom: "2026-11-20", wd: "2026-11-24", poll: "2026-11-29" },
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
    <dl class="up-dl"><div><dt>నోటిఫికేషన్</dt><dd>${fd(p.notif)}</dd></div><div><dt>నామినేషన్ల చివరి తేదీ</dt><dd>${fd(p.nom)}</dd></div><div><dt>ఉపసంహరణ</dt><dd>${fd(p.wd)}</dd></div></dl>
    <p class="up-stage">${lab}</p><p class="up-res">ఫలితాలు పోలింగ్ రోజునే ఇక్కడ కనిపిస్తాయి · Results appear here on polling day.</p></article>`; };

  function pendingMptc(D) {
    const S = D?.pend?.seats || {}, byD = {}; let n = 0;
    for (const [k, v] of Object.entries(S)) { if (!v.m?.length) continue; const [d, m] = k.split("/"); (byD[d] ||= []).push([m, v.m]); n += v.m.length; }
    if (!n) return `<p class="muted">ఎంపీటీసీ స్థానాలన్నీ తేలాయి · Every MPTC seat has a result.</p>`;
    const dl = ZP.districts.filter(([id]) => byD[id]).map(([id, name, te]) => `<details class="lb-d"><summary class="lb-row" style="--cols:minmax(0,1.6fr) minmax(0,.6fr)"><span class="lb-name"><b>${esc(te)}</b><small>${esc(name)}</small></span><span class="lb-tot">${byD[id].reduce((a, x) => a + x[1].length, 0)} స్థానాలు</span></summary>
      <div class="lb-scroll"><table class="lb-tbl"><thead><tr><th>మండలం · Mandal</th><th>ఎదురుచూస్తున్న ఎంపీటీసీ స్థానాలు</th><th>సంఖ్య</th></tr></thead><tbody>${byD[id].map(([m, seats]) => { const en = (ZP.mandals[id] || []).find((x) => x[0] === m)?.[1] || m; return `<tr><td><b>${esc(ZP.te?.[`${id}/${m}`] || en)}</b></td><td>${seats.map(esc).join(" · ")}</td><td class="num">${seats.length}</td></tr>`; }).join("")}</tbody></table></div></details>`).join("");
    return `<p class="muted">ఈ ${n} ఎంపీటీసీ స్థానాల ఫలితం ఇంకా ప్రకటించలేదు. ఫలితం వచ్చిన వెంటనే Local Bodies ట్యాబ్‌లో కనిపిస్తుంది.</p><div class="lb-list">${dl}</div>`;
  }
  function pendingUrban() {
    const U = urban().rows.filter((b) => !b.headWon || b.declared < b.wards);
    if (!U.length) return "";
    return `<table class="lb-tbl"><thead><tr><th>పట్టణం · Body</th><th>స్థితి</th></tr></thead><tbody>${U.map((b) => `<tr><td><b>${esc(window.AP_TE?.bodies?.[b.id] || b.name)}</b><small>${esc(b.district)}</small></td><td>${!b.head ? "ఫలితం ఇంకా రాలేదు · No result yet" : !b.headWon ? `${b.head.name ? esc(b.head.name) + " ముందంజ · " : ""}చైర్‌పర్సన్ ఫలితం ప్రకటించలేదు · head not declared` : ""}${b.declared < b.wards ? ` ${b.wards - b.declared} వార్డు${b.wards - b.declared > 1 ? "లు" : ""} మిగిలాయి · wards pending` : ""}</td></tr>`).join("")}</tbody></table>`;
  }
  function deferred() {
    const L = window.AP_DEFERRED || [];
    return `<p class="muted">${L.length} పట్టణ సంస్థల్లో కోర్టు కేసుల వల్ల పోలింగ్ జరగలేదు. కొత్త తేదీలు ఇంకా ప్రకటించలేదు.</p><div class="lb-scroll"><table class="lb-tbl"><thead><tr><th>పట్టణం · Body</th><th>రకం</th><th>జిల్లా</th><th>కారణం</th></tr></thead><tbody>${L.map(([n, t, d, why]) => `<tr><td><b>${esc(n)}</b></td><td>${t === "C" ? "Corporation" : "Municipality"}</td><td>${esc(d)}</td><td>${esc(why)}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function draw(D) {
    root.innerHTML = `<div class="wrap lb"><div class="lb-top"><p class="eyebrow"><span class="live-dot"></span> Live · Upcoming results</p><h2>రాబోయే ఫలితాలు <span class="lb-en">Results still to come</span></h2>
      <p class="muted">ఇంకా జరగని ఎన్నికలు, ఫలితాలు రాని స్థానాలు — నోటిఫికేషన్ వివరాలతో. పూర్తయిన ఫలితాలు <a href="#/local">Local Bodies</a> ట్యాబ్‌లో.</p></div>
      <h3 class="lb-h">గ్రామ పంచాయతీ ఎన్నికలు · Gram Panchayat elections <small>${nf(window.AP_RURAL?.gp || 13313)} పంచాయతీలు · సర్పంచ్, వార్డు సభ్యులు · 3 దశలు</small></h3>
      <div class="up-grid">${GP.map(phase).join("")}</div>
      <h3 class="lb-h">ఫలితం రాని ఎంపీటీసీ స్థానాలు · MPTC seats still awaited</h3>${pendingMptc(D)}
      <h3 class="lb-h">ఫలితం రాని పట్టణ సంస్థలు · Urban bodies awaiting a result</h3>${pendingUrban() || `<p class="muted">అన్నీ తేలాయి · All declared.</p>`}
      <h3 class="lb-h">పోలింగ్ వాయిదా పడిన పట్టణ సంస్థలు · Urban bodies not yet polled</h3>${deferred()}</div>`;
  }
  draw(null); load().then(draw);
})();
