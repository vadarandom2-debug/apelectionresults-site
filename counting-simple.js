// Plain results page: tables first, a share image one tap away. Loads no effects.
(() => {
  const { DEMO, BODIES, TE, COUNT_AT, rec, status, totals, side, pName, bName, nf, ORDER, esc } = window.CD;
  const $ = (s) => document.querySelector(s);
  const COL = { TDP: "#d4a000", JSP: "#c4122f", BJP: "#f28c00", NDA: "#d4a000", YSRCP: "#1d5fc4", INC: "#16936a", LEFT: "#6a3d9a", OTH: "#8a93a6" };
  const STEP = 30; let limit = STEP;
  const seen = {}, hotUntil = {};
  const uo = window.CD.UO?.totals;
  const MAYORS = BODIES.filter((b) => b.type === "C").sort((a, b) => b.wards - a.wards), TOWNS = BODIES.filter((b) => b.type !== "C");
  // per-town facts: wards, unopposed wards, turnout, who is contesting the head post
  const UOI = Object.fromEntries((window.CD.UO?.items || []).map((x) => [x.body, x])), CANDS = window.CD.CAND?.bodies || {};
  const uoWards = (b) => { if (window.CD.NOPOLL.includes(b.id)) return b.wards; const u = UOI[b.id]; if (!u) return null; return u.wards?.length || Object.values(u.wardsSplit || {}).reduce((a, n) => a + n, 0) || u.wardsApprox || null; };
  const row = (b) => {
    const r = rec(b), h = r.head, verb = h ? (h.status === "won" ? (h.unopposed ? "ఏకగ్రీవం" : "గెలుపు") : "ఆధిక్యం") : "", post = b.type === "C" ? "మేయర్" : "చైర్‌పర్సన్";
    const sig = JSON.stringify([h?.party, h?.status, r.declared, r.wards]), hot = seen[b.id] !== undefined && seen[b.id] !== sig ? " hot" : ""; seen[b.id] = sig;
    const u = uoWards(b), full = u === b.wards;
    const was = window.AP_2021?.[b.id], resv = TE.res?.[b.res] || b.res;
    const history = [resv ? `${post} రిజర్వేషన్: ${esc(resv)}` : "", was ? `2021లో ${pName(was[1])} (${was[0]} వార్డులు)` : ""].filter(Boolean).join(" · ");
    const facts = [`${b.wards} ${b.type === "C" ? "డివిజన్లు" : "వార్డులు"}`, u ? `<b class="uo">ఏకగ్రీవం ${u}${full ? " (అన్నీ)" : ""}</b>` : "ఏకగ్రీవ వివరం అందలేదు", full ? "పోలింగ్ జరగలేదు" : ""].filter(Boolean).join(" · ");
    const counted = !r.uoOnly && r.declared && !full ? ` · లెక్కింపు ${r.declared}/${b.wards}` : "";
    const wardsLine = ORDER.filter((p) => r.wards[p]).map((p) => `${pName(p)} ${r.wards[p]}${r.leads[p] ? "+" + r.leads[p] : ""}`).join(" · ");
    const rivals = (CANDS[b.id] || []).filter(([, , note]) => !/Not on the ballot/.test(note || "")).map(([p, n, , st]) => `${esc(TE.names[n] || n)} (${pName(p)}${st === "reported" ? ", అంచనా" : ""})`);
    const headLine = h ? `<i class="dot" style="background:${COL[h.party]}"></i><b class="hd">${post}: ${pName(h.party)} ${verb}</b>${h.name ? ` · ${esc(TE.names[h.name] || h.name)}` : ""}${h.margin ? ` · ${h.status === "won" ? `మెజారిటీ ${(nf(h.margin) + (h.marginPlus ? "+" : ""))} ఓట్లు` : `${(nf(h.margin) + (h.marginPlus ? "+" : ""))} ఓట్ల ఆధిక్యం`}` : ""}` : `${post} పోటీ: ${rivals.length ? rivals.join(" vs ") : "అభ్యర్థుల వివరం లేదు"}`;
    return `<tr class="${hot || (hotUntil[b.id] > Date.now() ? " hot" : "")}" data-sig="${b.id}" style="--rowc:${h ? COL[h.party] || COL.OTH : "#d6d6cf"}"><td class="nm"><button class="open" type="button" data-open="${b.id}">${esc(bName(b))}<i aria-hidden="true">›</i></button><span>${headLine}</span><span class="facts">${facts}${counted}</span>${h?.runnerUp && !h?.votes?.length ? `<span class="facts vt">రెండో స్థానం: ${esc(h.runnerUp.name)} (${esc(pName(h.runnerUp.party))})</span>` : ""}${h?.votes?.length ? `<span class="facts vt">${h.votes.slice(0, 3).map(([p, n, v]) => `<i class="dot" style="background:${COL[p] || COL.OTH}"></i>${esc(pName(p))} ${nf(v)}`).join(" · ")}</span>` : ""}${history ? `<span class="facts old">${history}</span>` : ""}${wardsLine && !r.uoOnly ? `<span class="facts">వార్డుల్లో: ${wardsLine}</span>` : ""}</td><td class="act"><button class="cam" type="button" data-share="${b.id}" aria-label="${esc(b.name)} result image">📷</button></td></tr>`;
  };
  const tally = (list) => { const t = { won: {}, lead: {}, wards: {}, done: 0, wardsDone: 0, wardsAll: 0 }; for (const b of list) { const r = rec(b), h = r.head; t.wardsAll += b.wards; t.wardsDone += Math.min(r.declared, b.wards); for (const [p, n] of Object.entries(r.wards)) t.wards[p] = (t.wards[p] || 0) + n; if (h) { const k = h.status === "won" ? t.won : t.lead; k[h.party] = (k[h.party] || 0) + 1; if (h.status === "won") t.done++; } } const u = uo?.[list === MAYORS ? "divisions" : "wards"]; if (u) { t.uo = u; for (const [p, n] of Object.entries(u.split)) t.wards[p] = Math.max(t.wards[p] || 0, n); t.wardsDone = Math.max(t.wardsDone, u.total); } return t; };
  const uoLine = (u, more = "") => "ఏకగ్రీవం: " + ORDER.filter((p) => u.split[p]).map((p) => `${pName(p)} ${nf(u.split[p])}`).join(" · ") + more;
  // rural seats so far: declared results, never below what was already decided unopposed
  const ruralNow = (k) => { const r = window.CD.rural()[k] || {}, u = uo?.[k], seats = { ...(r.seats || {}) }; if (u) for (const [p, n] of Object.entries(u.split)) seats[p] = Math.max(seats[p] || 0, n); return { declared: Math.max(r.declared || 0, u?.total || 0), seats }; };
  const add = (o, side_) => ORDER.filter((p) => side(p) === side_).reduce((a, p) => a + (o[p] || 0), 0);
  function table(id, t) {
    const line = (p, cls = "") => `<tr class="${cls}"><td><i class="dot" style="background:${COL[p]}"></i>${pName(p)}</td><td>${t.won[p] || 0}</td><td>${t.lead[p] || 0}</td><td>${nf(t.wards[p] || 0)}</td></tr>`;
    $(id).innerHTML = `<tr class="sum"><td>కూటమి</td><td>${add(t.won, "K")}</td><td>${add(t.lead, "K")}</td><td>${nf(add(t.wards, "K"))}</td></tr>${ORDER.filter((p) => side(p) === "K").map((p) => line(p, "sub")).join("")}${line("YSRCP", "sum")}<tr><td>ఇతరులు</td><td>${add(t.won, "O")}</td><td>${add(t.lead, "O")}</td><td>${nf(add(t.wards, "O"))}</td></tr>`;
  }
  function all() {
    const q = $("#q").value.trim().toLowerCase(), list = TOWNS.filter((b) => !q || (b.name + bName(b)).toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));
    $("#all").innerHTML = list.slice(0, limit).map(row).join("") + (list.length > limit ? `<tr><td colspan="2"><button class="more" type="button" id="more">మరిన్ని చూపించు (${list.length - limit})</button></td></tr>` : "") || `<tr><td>పట్టణం దొరకలేదు</td></tr>`;
  }
  // ZPTC / MPTC results have their own page (parishad.html)
  function show(tab) {
    if (!["mayors", "towns", "insights"].includes(tab)) tab = "mayors";
    ["mayors", "towns", "insights"].forEach((k) => ($(`#tab-${k}`).hidden = k !== tab));
    document.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === tab));
    history.replaceState(null, "", "#" + tab);
    countdown();
  }
  window.CD_fx = () => {
    liveBar();
    const m = tally(MAYORS), t = tally(TOWNS), live = DEMO || Date.now() >= COUNT_AT, a = totals(), s = $("#state");
    window.CD_charts?.("#chM", m, MAYORS, "మేయర్", "డివిజన్లు"); window.CD_charts?.("#chT", t, TOWNS, "చైర్‌పర్సన్", "వార్డులు");
    $("#progM").textContent = `13 మేయర్ పదవుల్లో ${m.done} తేలాయి · ${nf(m.wardsAll)} డివిజన్లలో ${nf(m.wardsDone)} తేలాయి`;
    $("#progT").textContent = `87 చైర్‌పర్సన్ పదవుల్లో ${t.done} తేలాయి · ${nf(t.wardsAll)} వార్డుల్లో ${nf(t.wardsDone)} తేలాయి`;
    $("#uoM").textContent = uoLine(m.uo, ` (మొత్తం ${m.uo.total} డివిజన్లు; 2 స్థానాల పార్టీ వివరం అందలేదు)`);
    $("#uoT").textContent = `ఏకగ్రీవ చైర్‌పర్సన్లు ${t.done >= 17 ? 17 : t.done}: టీడీపీ 15 · జనసేన 1 · బీజేపీ 1. ` + uoLine(t.uo, ` (${nf(t.uo.total)} వార్డులు)`);
    $("#may").innerHTML = MAYORS.map(row).join(""); all(); window.CD_insights?.();
    const over = live && !DEMO && !a.st.counting && !a.st.awaiting; $("#stateT").textContent = DEMO ? "DEMO" : over ? "పూర్తి" : "LIVE"; s.className = "live-btn" + (live && !over ? " on" : "");
  };
  // countdown to counting, per tab; hides itself once counting starts
  function countdown() {
    const left = COUNT_AT - Date.now(), el = $("#cd");
    el.hidden = DEMO || left <= 0; if (el.hidden) return;
    const n = Math.floor(left / 1000), cell = (v, t) => `<div><b>${String(v).padStart(2, "0")}</b><span>${t}</span></div>`;
    el.innerHTML = `<p>పుర ఎన్నికల ఫలితాలకు ఇంకా</p><div class="cd-n">${cell(Math.floor(n / 86400), "రోజులు")}${cell(Math.floor(n / 3600) % 24, "గంటలు")}${cell(Math.floor(n / 60) % 60, "నిమిషాలు")}${cell(n % 60, "సెకన్లు")}</div><p class="cd-at">3 నవంబర్, ఉదయం 8 గంటలకు లెక్కింపు</p>`;
  }
  setInterval(countdown, 1000);
  // live status line
  function liveBar() {
    const el = $("#live"); el.hidden = false; const now = Date.now(), up = window.CD.updated(), ok = window.CD.lastOk(), mins = up ? Math.max(0, Math.round((now - Date.parse(up)) / 60000)) : null;
    if (DEMO) { el.textContent = "డెమో సంఖ్యలు"; el.className = "livebar"; return; }
    if (now < COUNT_AT) { el.textContent = "లెక్కింపు మొదలవగానే ఫలితాలు ఇక్కడ వాటంతట అవే వస్తాయి. పేజీ రిఫ్రెష్ చేయాల్సిన అవసరం లేదు."; el.className = "livebar"; return; }
    if (!ok || now - ok > 180000) { el.textContent = "కనెక్షన్ సమస్య: ఫలితాలు పాతవి కావచ్చు. పేజీని రిఫ్రెష్ చేయండి."; el.className = "livebar bad"; return; }
    el.textContent = ""; el.className = "livebar"; el.hidden = true;
  }
  window.CD_live = liveBar; setInterval(liveBar, 20000);
  window.CD_simple = { MAYORS, TOWNS, tally, add, COL, ruralNow };
  $("#q").addEventListener("input", () => { limit = STEP; all(); });
  document.addEventListener("click", (e) => { if (e.target.id === "more") { limit += STEP; all(); } const t = e.target.closest("[data-tab]"); if (t) show(t.dataset.tab);  if (e.target.closest("#state")) { window.CD.refresh(); const b = $("#stateT"), was = b.textContent; b.textContent = "✓"; setTimeout(() => (b.textContent = was), 900); } });
  show(location.hash.slice(1));
  // the image makers read results from here, with unopposed winners filled in
  window.apResults = () => (DEMO ? null : { bodies: Object.fromEntries(BODIES.map((b) => [b.id, rec(b)]).filter(([, r]) => r.head || r.declared)) });
  if (DEMO) { $("#demoBar").hidden = false; window.CD_demoGo(); }
  window.CD_fx();
  // inside the main site's results tab: no link back to the site it sits in
  if (new URLSearchParams(location.search).has("embed")) document.documentElement.classList.add("embed");
})();
