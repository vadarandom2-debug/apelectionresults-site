// Counting-day dashboard. Reads the same results as the public site (Supabase, or data/results.js).
// Demo numbers exist only on localhost with ?demo, always under the red banner, and never reach Supabase.
(() => {
  const BODIES = window.AP_BODIES, TE = window.AP_TE, CAND = window.AP_CANDIDATES, UO = window.AP_UNOPPOSED, TURN = window.AP_TURNOUT;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DEMO = new URLSearchParams(location.search).has("demo") && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const COUNT_AT = new Date("2026-11-03T08:00:00+05:30").getTime();
  const KUTAMI = ["TDP", "JSP", "BJP", "NDA"], ORDER = ["TDP", "JSP", "BJP", "NDA", "YSRCP", "INC", "LEFT", "OTH"]; // NDA = Kutami total when a source doesn't split it
  const NOPOLL = ["piduguralla", "gurazala", "dachepalli", "darsi", "allagadda", "proddatur", "rayachoti", "kamalapuram"];
  const side = (p) => (KUTAMI.includes(p) ? "K" : p === "YSRCP" ? "Y" : "O");
  const SIDE = { K: "కూటమి", Y: "వైఎస్సార్‌సీపీ", O: "ఇతరులు" };
  const pName = (p) => (TE.parties[p] || [p])[0];
  const bName = (b) => TE.bodies[b.id] || b.name;
  const sum = (o) => Object.values(o || {}).reduce((a, n) => a + n, 0);
  const nf = (n) => Number(n || 0).toLocaleString("en-IN");
  const uoOf = Object.fromEntries((UO?.items || []).map((x) => [x.body, x]));
  const turnOf = Object.fromEntries((TURN?.close || []).map(([id, p]) => [id, p]));
  let R = { bodies: {} }, stamps = {}, sb = null, ready = false, lastOk = 0;

  // A body's record: its result, topped up with what was already decided unopposed.
  function rec(b) {
    const r = R.bodies?.[b.id] || {}, u = uoOf[b.id], out = { declared: r.declared || 0, wards: r.wards || {}, leads: r.leads || {}, head: r.head || null, wardList: r.wardList || WL[b.id]?.list || null };
    // an unopposed head post stays "unopposed" even when a results feed also reports it as won
    if (u?.head && (!out.head || (out.head.status === "won" && out.head.party === u.head.party))) out.head = { party: u.head.party, name: u.head.name, status: "won", unopposed: true };
    if (!out.declared && u?.wardsSplit) { out.wards = u.wardsSplit; out.declared = sum(u.wardsSplit); out.uoOnly = true; }
    else if (u?.wardsSplit) { // a counted result may list only the contested wards: keep the unopposed ones in
      // when the count gives Kutami as one NDA number, fold the unopposed TDP/JSP/BJP wards into it instead of adding them again
      const split = out.wards.NDA ? Object.entries(u.wardsSplit).reduce((o, [p, n]) => (KUTAMI.includes(p) ? (o.NDA = (o.NDA || 0) + n) : (o[p] = n), o), {}) : u.wardsSplit;
      const w = { ...out.wards }; for (const [p, n] of Object.entries(split)) w[p] = Math.max(w[p] || 0, n);
      out.wards = w; out.declared = Math.min(b.wards, Math.max(out.declared, sum(w)));
    }
    // the winner pages keep "leading" tags after a ward is declared: once the declared count covers every listed ward, they are wins
    if (out.wardList?.length && out.declared >= out.wardList.length) out.wardList = out.wardList.map((w) => (w[2] === "won" ? w : [w[0], w[1], "won", w[3]]));
    // leading wards from the ward-by-ward list when the totals carry none, never more than the wards still being counted
    if (!sum(out.leads) && out.wardList && out.declared < b.wards) {
      const l = {}; for (const [, p, st] of out.wardList) if (st === "leading") l[p] = (l[p] || 0) + 1;
      const n = sum(l), room = b.wards - out.declared, k = n > room ? room / n : 1;
      out.leads = Object.fromEntries(Object.entries(l).map(([p, v]) => [p, Math.round(v * k)]).filter(([, v]) => v));
    }
    if (NOPOLL.includes(b.id)) out.declared = b.wards;
    return out;
  }
  const status = (b, r = rec(b)) => (r.head?.status === "won" ? "won" : (!r.uoOnly && r.declared) || sum(r.leads) || r.head ? "counting" : "awaiting");

  function totals() {
    const t = { won: { K: 0, Y: 0, O: 0 }, lead: { K: 0, Y: 0, O: 0 }, pWon: {}, pLead: {}, wards: {}, wardLeads: {}, declared: 0, st: { won: 0, counting: 0, awaiting: 0 } };
    for (const b of BODIES) {
      const r = rec(b); t.st[status(b, r)]++;
      t.declared += Math.min(r.declared, b.wards);
      for (const [p, n] of Object.entries(r.wards)) t.wards[p] = (t.wards[p] || 0) + n;
      for (const [p, n] of Object.entries(r.leads)) t.wardLeads[p] = (t.wardLeads[p] || 0) + n;
      if (r.head) { const s = side(r.head.party), won = r.head.status === "won"; (won ? t.won : t.lead)[s]++; const k = won ? t.pWon : t.pLead; k[r.head.party] = (k[r.head.party] || 0) + 1; }
    }
    t.declared = Math.max(t.declared, UO?.wardsTotal || 0); // the official unopposed wards are decided even where the party isn't listed
    t.real = Object.keys(R.bodies || {}).length > 0;
    return t;
  }

  const stack = (r, total) => ORDER.flatMap((p) => [[p, r.wards[p] || 0, ""], [p, r.leads[p] || 0, "l"]]).filter((x) => x[1]).map(([p, n, c]) => `<i class="${c}" style="width:${(n / total) * 100}%;background:var(--${p})" title="${pName(p)} ${n}"></i>`).join("");
  const stTag = (b, r) => { const s = status(b, r); return s === "won" ? `<span class="tag won">${r.head?.unopposed ? "ఏకగ్రీవం" : "గెలుపు"}</span>` : s === "counting" ? (r.head ? `<span class="tag lead">ఆధిక్యం</span>` : `<span class="tag">లెక్కింపు</span>`) : `<span class="tag">ఎదురుచూపు</span>`; };

  function mayors() {
    if (!$("#mayors")) return;
    $("#mayors").innerHTML = BODIES.filter((b) => b.type === "C").sort((a, b) => b.wards - a.wards).map((b) => {
      const r = rec(b), h = r.head, tn = TURN && turnOf[b.id];
      return `<article class="m" data-spot="${b.id}" style="${h ? `--c:var(--${h.party})` : ""}"><div class="m-top"><div><h3>${esc(bName(b))}</h3><span class="en">${esc(b.name)}</span></div>${stTag(b, r)}</div>
        <div class="who">${h ? `${esc(TE.names[h.name] || h.name || "")} <span>${pName(h.party)}${h.margin ? ` · ${nf(h.margin)} ఓట్ల ${h.status === "won" ? "మెజారిటీ" : "ఆధిక్యం"}` : ""}</span>` : "<span>ఇంకా ఫలితం లేదు</span>"}</div>
        <div class="stk">${stack(r, b.wards)}</div>
        <div class="m-foot"><span>${r.declared}/${b.wards} వార్డులు${tn ? ` · పోలింగ్ ${tn}%` : ""}</span><button class="link" type="button" data-town="${b.id}">పంచుకోండి</button></div></article>`;
    }).join("");
  }

  function districts() {
    if (!$("#dist")) return;
    const g = {}; BODIES.forEach((b) => (g[b.district] = g[b.district] || []).push(b));
    $("#dist").innerHTML = Object.entries(g).sort((a, b) => b[1].length - a[1].length).map(([d, list]) => {
      const c = {}; list.forEach((b) => { const h = rec(b).head; if (h) c[h.party] = (c[h.party] || 0) + 1; });
      const k = KUTAMI.reduce((a, p) => a + (c[p] || 0), 0), y = c.YSRCP || 0;
      return `<div class="d"><span>${esc(TE.districts[d] || d)}</span><div class="stk">${ORDER.filter((p) => c[p]).map((p) => `<i style="width:${(c[p] / list.length) * 100}%;background:var(--${p})" title="${pName(p)} ${c[p]}"></i>`).join("")}</div><span class="c" title="కూటమి · వైఎస్సార్‌సీపీ · మొత్తం">${k}·${y}/${list.length}</span></div>`;
    }).join("");
  }

  function towns() {
    if (!$("#towns")) return;
    const q = $("#twQ").value.trim().toLowerCase(), s = $("#twS").value;
    const list = BODIES.filter((b) => (!q || (b.name + bName(b)).toLowerCase().includes(q)) && (!s || status(b) === s)).sort((a, b) => a.name.localeCompare(b.name));
    $("#towns").innerHTML = list.map((b) => { const r = rec(b), h = r.head; return `<div class="t"><div><b>${esc(bName(b))}</b><small>${h ? `${pName(h.party)}${h.name ? " · " + esc(TE.names[h.name] || h.name) : ""}` : esc(b.name)}</small></div><div class="stk">${stack(r, b.wards)}</div><button class="link" type="button" data-town="${b.id}">పంచుకోండి</button></div>`; }).join("") || `<p class="sub">No town matches.</p>`;
  }

  function feed() {
    if (!$("#feed")) return;
    const list = BODIES.map((b) => ({ b, r: rec(b), at: stamps[b.id] || "" })).filter((x) => R.bodies?.[x.b.id] && (x.r.head || x.r.declared)).sort((a, b) => (b.at > a.at ? 1 : b.at < a.at ? -1 : b.r.declared - a.r.declared)).slice(0, 14);
    $("#feed").innerHTML = list.map(({ b, r }) => { const h = r.head; return `<li><i style="background:var(--${h?.party || "OTH"})"></i><div>${h ? `<b>${esc(bName(b))}</b>: ${pName(h.party)} ${h.status === "won" ? "గెలుపు" : "ఆధిక్యం"}` : `<b>${esc(bName(b))}</b>: లెక్కింపు జరుగుతోంది`}<small>${r.declared}/${b.wards} వార్డులు</small></div></li>`; }).join("") || `<li><i style="background:var(--await)"></i><div>లెక్కింపు మొదలయ్యాక ఇక్కడ తాజా ఫలితాలు కనిపిస్తాయి.<small>Updates appear here once counting starts.</small></div></li>`;
  }

  function render() { mayors(); feed(); districts(); towns(); window.CD_changed?.(); window.CD_fx?.(); }

  // ---------- demo: simulated, seeded, watermarked ----------
  function simulate(p) {
    const rnd = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };
    const out = {};
    for (const b of BODIES) {
      if (NOPOLL.includes(b.id) || uoOf[b.id]?.head) continue;
      const start = rnd(b.id + "s") * 60, f = Math.max(0, Math.min(1, (p - start) / 40)); if (!f) continue;
      const declared = Math.round(b.wards * f), lead = rnd(b.id + "w") < .55 ? "TDP" : rnd(b.id + "y") < .75 ? "YSRCP" : rnd(b.id + "z") < .6 ? "JSP" : "OTH";
      const second = lead === "YSRCP" ? "TDP" : "YSRCP", a = Math.round(declared * (.5 + rnd(b.id + "a") * .2)), c = Math.round((declared - a) * .75);
      const rest = b.wards - declared, wl = Math.min(rest, Math.round(rest * .4));
      const name = (CAND.bodies[b.id] || []).find((x) => x[0] === lead)?.[1] || "";
      out[b.id] = { declared, wards: { [lead]: a, [second]: c, OTH: declared - a - c }, leads: wl ? { [lead]: wl } : {}, head: { party: lead, name, status: f >= 1 ? "won" : "leading", margin: Math.round(200 + rnd(b.id + "m") * 4000) } };
    }
    const rural = (n, key) => { const declared = Math.round((n * p) / 100), a = Math.round(declared * (.42 + rnd(key) * .14)), b = Math.round(declared * .34), j = Math.round((declared - a - b) * .4); return { declared, seats: { TDP: a, YSRCP: b, JSP: j, OTH: declared - a - b - j } }; };
    return { bodies: out, rural: { zptc: rural(window.AP_RURAL.zptc, "zptc"), mptc: rural(window.AP_RURAL.mptc, "mptc") } };
  }

  // ---------- data ----------
  // Summary only (no ward-by-ward lists): ~15 KB instead of ~100 KB per read. Ward lists load per body when a sheet opens.
  const SUMMARY = "body_id,updated_at,declared:data->declared,wards:data->wards,leads:data->leads,head:data->head";
  async function load() {
    const [r, m] = await Promise.all([sb.from("results").select(SUMMARY), sb.from("meta").select("key,value").in("key", ["updated", "rural"])]);
    if (r.error || m.error) { window.CD_live?.(); return console.warn("results:", r.error || m.error); }
    const bodies = {}, meta = Object.fromEntries(m.data.map((x) => [x.key, x.value])); stamps = {};
    r.data.forEach((x) => { bodies[x.body_id] = { declared: x.declared || 0, wards: x.wards || {}, leads: x.leads || {}, head: x.head || null }; stamps[x.body_id] = x.updated_at; });
    R = { bodies, rural: meta.rural || {}, updated: meta.updated || Object.values(stamps).sort().pop() || null }; ready = true; lastOk = Date.now(); render();
  }
  const WL = {}; // body id -> { at, list }
  async function wardList(id) {
    if (WL[id] && Date.now() - WL[id].at < 120000) return WL[id].list;
    if (!sb) return R.bodies?.[id]?.wardList || null;
    const { data, error } = await sb.from("results").select("wl:data->wardList").eq("body_id", id).maybeSingle();
    if (!error) WL[id] = { at: Date.now(), list: data?.wl || null };
    return WL[id]?.list || null;
  }
  // no database: keep re-reading data/results.js
  let refresh = () => {};
  function poll() {
    const read = refresh = () => { const sc = document.createElement("script"); sc.src = "data/results.js?t=" + Date.now(); sc.onload = () => { R = window.AP_RESULTS || R; ready = true; lastOk = Date.now(); render(); sc.remove(); }; sc.onerror = () => { sc.remove(); window.CD_live?.(); }; document.body.appendChild(sc); };
    read(); setInterval(read, 30000);
  }
  function connect() {
    const url = window.SUPABASE_URL, key = window.SUPABASE_ANON_KEY;
    if (!url || !key) return poll();
    const lib = document.createElement("script"); lib.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    lib.onload = () => {
      sb = window.supabase.createClient(url, key, { auth: { persistSession: false } }); refresh = load; load();
      // every 2 minutes (the agent updates every 5), spread out per visitor, paused while the tab is hidden; no realtime
      // subscription: every database change made every open page re-read everything, which overloaded the free project
      setTimeout(() => setInterval(() => { if (!document.hidden) load(); }, 900000), Math.random() * 30000); // results are final: every 15 minutes
      document.addEventListener("visibilitychange", () => { if (!document.hidden && Date.now() - lastOk > 900000) load(); });
    };
    lib.onerror = poll;
    document.head.appendChild(lib);
  }

  window.CD = { DEMO, BODIES, TE, CAND, UO, TURN, turnOf, NOPOLL, COUNT_AT, rec, status, totals, refresh: () => refresh(), wardList, rural: () => R.rural || {}, postal: () => R.postal?.items || [], updated: () => R.updated || null, lastOk: () => lastOk, side, pName, bName, nf, ORDER, SIDE, stack, esc, get ready() { return ready; } };
  $("#twQ")?.addEventListener("input", towns); $("#twS")?.addEventListener("change", towns);
  if (DEMO) {
    $("#demoBar").hidden = false;
    const go = () => { const p = +$("#demoP").value; $("#demoV").textContent = p + "%"; R = simulate(p); ready = true; render(); };
    $("#demoP").addEventListener("input", go);
    window.CD_demoGo = go;
  } else connect();
})();
