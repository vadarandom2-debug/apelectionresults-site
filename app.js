(() => {
  const BODIES = window.AP_BODIES, DEFERRED = window.AP_DEFERRED, RURAL = window.AP_RURAL, SCHEDULE = window.AP_SCHEDULE;
  const PARTIES = [
    { id: "TDP", name: "Telugu Desam", te: "తెలుగుదేశం" },
    { id: "JSP", name: "Jana Sena", te: "జనసేన" },
    { id: "BJP", name: "BJP", te: "బీజేపీ" },
    { id: "NDA", name: "Kutami (not split by party)", te: "కూటమి" }, // sources that give the alliance as one number
    { id: "YSRCP", name: "YSR Congress", te: "వైఎస్సార్‌సీపీ" },
    { id: "INC", name: "Congress", te: "కాంగ్రెస్" },
    { id: "LEFT", name: "CPI / CPI(M)", te: "వామపక్షాలు" },
    { id: "OTH", name: "Independents & others", te: "ఇతరులు" },
  ];
  const NDA = ["TDP", "JSP", "BJP"];
  const LOGO = { TDP: "tdp", JSP: "jsp", BJP: "bjp", YSRCP: "ysrcp", INC: "inc", LEFT: "left" };
  const logo = (p, cls = "") => {
    if (p === "NDA") return `<span class="plogo-trio ${cls}">${NDA.map((x) => logo(x)).join("")}</span>`;
    if (!LOGO[p]) return `<span class="plogo plogo-ind ${cls}" style="--pc:var(--OTH)">IND</span>`;
    return `<img class="plogo ${cls}" style="--pc:var(--${p})" src="assets/parties/${LOGO[p]}.png" alt="${p}" loading="lazy" />`;
  };
  const TYPE = { C: "Corporation", M: "Municipality", NP: "Nagar Panchayat" };
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
  // demo (simulated) data is only available on the local server, never on the public site
  const DEMO = new URLSearchParams(location.search).has("demo") && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const state = { alliance: false, type: "", district: "", status: "", q: "" };
  let R;

  // ---------- party helpers ----------
  const groupOf = (p) => (state.alliance && NDA.includes(p) ? "NDA" : PARTIES.some((x) => x.id === p) ? p : "OTH");
  const colour = (p) => `var(--${p})`;
  const groups = () => (state.alliance ? [{ id: "NDA", name: "Kutami (NDA)", te: "కూటమి" }, ...PARTIES.filter((p) => p.id !== "NDA" && !NDA.includes(p.id))] : PARTIES);
  const label = (p) => (groups().find((g) => g.id === p) || { name: p }).name;
  const merge = (obj) => { const o = {}; for (const [k, v] of Object.entries(obj || {})) o[groupOf(k)] = (o[groupOf(k)] || 0) + v; return o; };
  const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);

  function statusOf(b) {
    const r = R.bodies?.[b.id];
    if (!r || (!r.declared && !sum(r.leads) && !r.head)) return "awaiting";
    if (r.declared >= b.wards && r.head?.status === "won") return "declared";
    return "counting";
  }
  const headParty = (b) => { const h = R.bodies?.[b.id]?.head; return h ? groupOf(h.party) : null; };

  function totals() {
    const won = {}, leads = {}, headsWon = {}, headsLead = {};
    let declared = 0;
    for (const b of BODIES) {
      const r = R.bodies?.[b.id]; if (!r) continue;
      declared += r.declared || 0;
      for (const [p, n] of Object.entries(merge(r.wards))) won[p] = (won[p] || 0) + n;
      for (const [p, n] of Object.entries(merge(r.leads))) leads[p] = (leads[p] || 0) + n;
      if (r.head) { const p = groupOf(r.head.party); const t = r.head.status === "won" ? headsWon : headsLead; t[p] = (t[p] || 0) + 1; }
    }
    return { won, leads, headsWon, headsLead, declared };
  }

  // ---------- phase / countdown ----------
  const T = (id) => new Date(SCHEDULE.find((s) => s.id === id).at).getTime();
  const HOLD = window.AP_STATUS?.paused ? window.AP_STATUS : null;
  function phase(now) {
    if (HOLD) return { pill: HOLD.pill || "On hold", text: HOLD.title };
    if (now < T("ulb-poll")) return { pill: "Pre-poll", text: "Nominations & scrutiny under way · Model Code of Conduct in force" };
    if (now < T("ulb-poll") + 10 * 3600e3) return { pill: "Polling now", text: "Urban polling 7 AM – 5 PM · 100 bodies, 3,942 wards", live: true };
    if (now < T("ulb-count")) return { pill: "Poll closed", text: "Ballot boxes in strong rooms · counting begins 3 Nov, 8 AM" };
    if (now < T("ulb-count") + 36 * 3600e3) return { pill: "Live counting", text: "Urban local body counting under way · updates every minute", live: true };
    if (now < T("rural-count") + 36 * 3600e3) return { pill: "Rural phase", text: "MPTC / ZPTC polling 5 Nov · counting 7 Nov" };
    if (now < T("gp-3") + 24 * 3600e3) return { pill: "Panchayat polls", text: "Gram Panchayat elections in three phases · results same day" };
    return { pill: "Concluded", text: "All local body elections concluded" };
  }

  function tick() {
    const now = Date.now(), ph = phase(now);
    $("#phasePill").textContent = ph.pill; $("#phasePill").classList.toggle("live", !!ph.live);
    $("#tickerText").textContent = ph.text;
    if (HOLD) {
      $("#ccLabel").textContent = "Election status"; $("#ccTitle").textContent = HOLD.title;
      $("#ccClock").innerHTML = `<p class="cc-hold" lang="te">${HOLD.te}</p>`; $("#ccDate").textContent = HOLD.next || "";
      $("#ccBar").style.width = "0%"; $("#ccFoot").textContent = "Polling date to be confirmed by the SEC"; return;
    }
    const nextI = SCHEDULE.findIndex((s) => new Date(s.at).getTime() > now);
    if (nextI < 0) { $("#ccTitle").textContent = "All phases complete"; $("#ccClock").innerHTML = ""; return; }
    const nx = SCHEDULE[nextI], t = new Date(nx.at).getTime();
    const prev = nextI > 0 ? new Date(SCHEDULE[nextI - 1].at).getTime() : t - 7 * 864e5;
    let d = Math.max(0, t - now);
    const parts = [[864e5, "days"], [36e5, "hrs"], [6e4, "min"], [1e3, "sec"]].map(([u, l]) => { const v = Math.floor(d / u); d -= v * u; return `<div><b>${String(v).padStart(2, "0")}</b><span>${l}</span></div>`; });
    $("#ccTitle").textContent = nx.label;
    $("#ccClock").innerHTML = parts.join("");
    $("#ccDate").textContent = new Date(nx.at).toLocaleString("en-IN", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST";
    $("#ccBar").style.width = Math.min(100, ((now - prev) / (t - prev)) * 100) + "%";
    const poll = T("ulb-count");
    $("#ccFoot").textContent = now < poll ? `Urban results in ${Math.ceil((poll - now) / 864e5)} days` : "Results update live below";
  }

  // ---------- renderers ----------
  function renderStats() {
    const tot = totals();
    const s = [
      [100, "urban bodies polling"], ["3,942", "wards"], [13, "mayors elected directly"],
      [fmt(RURAL.zptc), "ZPTC seats"], [fmt(RURAL.mptc), "MPTC seats"], [fmt(RURAL.gp), "gram panchayats"],
    ];
    if (R.turnout) s[2] = [R.turnout + "%", "urban turnout"];
    if (tot.declared) s[1] = [fmt(tot.declared), "of 3,942 wards declared"];
    $("#stats").innerHTML = s.map(([b, l]) => `<div class="stat"><b>${b}</b><span>${l}</span></div>`).join("");
    $("#updated").textContent = R.updated ? "Updated " + new Date(R.updated).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST" : "";
  }

  function hemicycle(seats) {
    const N = seats.length, rows = 6, W = 400, H = 214, cx = W / 2, cy = 204, R0 = 92, R1 = 190;
    const radii = Array.from({ length: rows }, (_, i) => R0 + ((R1 - R0) * i) / (rows - 1));
    const tot = radii.reduce((a, b) => a + b, 0);
    let counts = radii.map((r) => Math.round((N * r) / tot));
    counts[rows - 1] += N - counts.reduce((a, b) => a + b, 0);
    const pts = [];
    radii.forEach((r, i) => { for (let k = 0; k < counts[i]; k++) { const a = Math.PI * (1 - (counts[i] === 1 ? 0.5 : k / (counts[i] - 1))); pts.push({ a, x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }); } });
    pts.sort((p, q) => q.a - p.a);
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Hemicycle of 100 head posts">${pts.map((p, i) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="7.2" fill="${seats[i].c}" opacity="${seats[i].o}"><title>${esc(seats[i].t)}</title></circle>`).join("")}</svg>`;
  }

  function renderResults() {
    const tot = totals(), G = groups();
    // hemicycle: won (solid) then leading (faded), ordered by party size
    const score = (p) => ((tot.headsWon[p] || 0) + (tot.headsLead[p] || 0)) * 1e5 + (tot.won[p] || 0) + (tot.leads[p] || 0);
    const order = G.map((g) => g.id).sort((a, b) => score(b) - score(a));
    const seats = [];
    for (const p of order) {
      for (let i = 0; i < (tot.headsWon[p] || 0); i++) seats.push({ c: colour(p), o: 1, t: label(p) + " · won" });
      for (let i = 0; i < (tot.headsLead[p] || 0); i++) seats.push({ c: colour(p), o: 0.42, t: label(p) + " · leading" });
    }
    while (seats.length < 100) seats.push({ c: "var(--awaiting)", o: 1, t: "Awaiting result" });
    $("#hemi").innerHTML = hemicycle(seats.slice(0, 100));
    const top = order[0], topN = (tot.headsWon[top] || 0) + (tot.headsLead[top] || 0);
    $("#hemiMid").innerHTML = topN ? `<b style="color:${colour(top)}">${topN}</b><span>${esc(label(top))} won + leading · 51 for a majority of heads</span>` : `<b>0<small style="font-size:18px;color:var(--ink2)">/100</small></b><span>Counting begins 3 November, 8 AM</span>`;

    $("#wardsDeclared").textContent = fmt(tot.declared);
    $("#wardBar").innerHTML = order.map((p) => { const n = tot.won[p] || 0; return n ? `<div style="width:${(n / 3942) * 100}%;background:${colour(p)}" title="${esc(label(p))}: ${n}"></div>` : ""; }).join("");
    $("#tally").innerHTML = `<tr><th>Party</th><th>Heads won</th><th>Leading</th><th>Wards won</th><th>Ward share</th></tr>` +
      order.map((p) => {
        const g = G.find((x) => x.id === p), w = tot.won[p] || 0;
        return `<tr><td><span class="pty">${logo(p)}${esc(g.name)} <small lang="te">${esc(g.te)}</small></span></td><td class="num">${tot.headsWon[p] || 0}</td><td class="num">${tot.headsLead[p] || 0}</td><td class="num">${fmt(w)}</td><td class="num">${tot.declared ? ((w / tot.declared) * 100).toFixed(1) + "%" : "—"}</td></tr>`;
      }).join("");
    $("#tallyNote").textContent = tot.declared ? "Ward share is of declared wards. Leading = counting not finished." : "Numbers appear here as the SEC declares results on 3 November.";
  }

  function miniBar(b) {
    const r = R.bodies?.[b.id]; if (!r) return `<div class="mini"></div>`;
    const w = merge(r.wards), l = merge(r.leads);
    return `<div class="mini">${groups().map((g) => (w[g.id] ? `<div style="width:${(w[g.id] / b.wards) * 100}%;background:${colour(g.id)}"></div>` : "")).join("")}${groups().map((g) => (l[g.id] ? `<div style="width:${(l[g.id] / b.wards) * 100}%;background:${colour(g.id)};opacity:.4"></div>` : "")).join("")}</div>`;
  }
  const stTag = (s) => `<span class="tag st-${s}">${{ awaiting: "Awaiting", counting: "Counting", declared: "Declared" }[s]}</span>`;
  function headLine(b) {
    const h = R.bodies?.[b.id]?.head;
    if (!h) return `<span class="muted small">${b.type === "C" ? "Mayor" : "Chairperson"} result awaited</span>`;
    return `${logo(LOGO[h.party] ? h.party : "OTH", "lg")}<span><span class="who">${esc(h.name || label(groupOf(h.party)))}</span> <span class="what">${esc(h.party)} · ${h.status === "won" ? "won" : "leading"}${h.margin ? " by " + fmt(h.margin) : ""}</span></span>`;
  }

  // announced head-post candidates (party lists, before the SEC's final list)
  const CAND = window.AP_CANDIDATES || { bodies: {}, ndaSeat: {} };
  const PORDER = ["TDP", "JSP", "BJP", "NDA", "YSRCP", "INC", "LEFT", "OTH"];
  function contenders(b) {
    const list = (CAND.bodies[b.id] || []).map(([p, n, note, st]) => ({ p, n, note, reported: st === "reported" }));
    const nda = CAND.ndaSeat[b.id];
    if (nda && !list.some((c) => c.p === nda)) list.push({ p: nda, pending: true });
    return list.sort((a, c) => PORDER.indexOf(a.p) - PORDER.indexOf(c.p));
  }
  function candList(b, compact = false) {
    const list = contenders(b), post = b.type === "C" ? "Mayor" : "Chairperson";
    if (!list.length) return compact ? "" : `<div class="cands-empty">${post} candidates not yet announced</div>`;
    const h = R.bodies?.[b.id]?.head;
    if (compact) return `<div class="cn-mini">${list.map((c) => `<span>${logo(c.p)}${c.pending ? `<em>${c.p} · awaited</em>` : esc(c.n) + (c.reported ? " <em>(reported)</em>" : "")}</span>`).join("")}</div>`;
    // several reported aspirants from one party collapse into a single line
    const grouped = [];
    list.forEach((c) => {
      const g = c.reported && grouped.find((x) => x.reported && x.p === c.p);
      if (g) { g.names.push(c.n); g.note = "Reported aspirants · not yet announced"; } else grouped.push({ ...c, names: [c.n] });
    });
    return `<ul class="cands">${grouped.map((c) => {
      const won = h && h.party === c.p && h.status === "won";
      return `<li class="${c.pending ? "pending" : ""} ${c.reported ? "reported" : ""} ${won ? "won" : ""}">${logo(c.p)}<div><b>${c.pending ? `${c.p === "JSP" ? "Jana Sena" : c.p} candidate awaited` : c.names.map(esc).join(" · ")}</b><small>${esc(label(c.p) || c.p)}${nda(b, c.p) ? " · Kutami" : ""}${c.note ? " · " + esc(c.note) : ""}</small></div>${won ? '<span class="tag st-declared">Won</span>' : c.reported ? '<span class="tag rep">Reported</span>' : ""}</li>`;
    }).join("")}</ul>`;
  }
  const nda = (b, p) => CAND.ndaSeat[b.id] === p;

  // bodies the SEC is not polling in this round (court cases) — shown as red "no election" boxes
  const NOPOLL = DEFERRED.map(([name, type, district, why]) => ({ name, type, district, why: why || "Court case pending", sc: /Supreme Court/.test(why || "") }));
  const noPollBox = (d) => `<div class="nopoll-why"><b>⛔ No election this round</b><span>${esc(d.why)}</span>${d.sc ? "<span>Supreme Court final hearing: 17 Nov</span>" : ""}<span>The SEC will announce a separate date.</span></div>`;

  function renderMayors() {
    $("#mayorGrid").innerHTML = BODIES.filter((b) => b.type === "C").sort((a, b) => b.wards - a.wards).map((b) => {
      const hp = headParty(b), s = statusOf(b);
      return `<article class="card mayor" data-id="${b.id}"><div class="bandtop" style="${hp ? `background:${colour(hp)}` : ""}"></div>
        <p class="eyebrow" style="margin:4px 0 0">${esc(b.district)}</p><h3>${esc(b.name)}</h3>
        <div class="meta"><span class="tag">${b.wards} wards</span><span class="tag">Mayor: ${esc(b.res)}</span>${stTag(s)}</div>
        ${candList(b)}
        ${R.bodies?.[b.id]?.head ? `<div class="head-res">${headLine(b)}</div>` : ""}${miniBar(b)}
        <button class="share-btn" type="button" data-share="${b.id}" aria-label="Share ${esc(b.name)} as an image">${SHARE_ICON} Share</button></article>`;
    }).join("") + NOPOLL.filter((d) => d.type === "C").map((d) => `<article class="card mayor nopoll"><div class="bandtop"></div>
        <p class="eyebrow" style="margin:4px 0 0">${esc(d.district)}</p><h3>${esc(d.name)}</h3>
        <div class="meta"><span class="tag">Municipal corporation</span><span class="tag st-nopoll">No election</span></div>${noPollBox(d)}</article>`).join("");
  }

  function renderFilters() {
    const types = [["", "All"], ["C", "Corporations"], ["M", "Municipalities"], ["NP", "Nagar Panchayats"]];
    $("#typeChips").innerHTML = types.map(([v, l]) => `<button class="chip ${state.type === v ? "on" : ""}" data-type="${v}">${l}</button>`).join("");
    const ds = [...new Set(BODIES.map((b) => b.district))].sort();
    $("#distSel").innerHTML = `<option value="">All 26 districts</option>` + ds.map((d) => `<option ${state.district === d ? "selected" : ""}>${esc(d)}</option>`).join("");
  }

  function renderList() {
    const q = state.q.trim().toLowerCase();
    const list = BODIES.filter((b) => state.status !== "nopoll" && (!state.type || b.type === state.type) && (!state.district || b.district === state.district) && (!state.status || statusOf(b) === state.status) && (!q || [b.name, b.district, ...(CAND.bodies[b.id] || []).map((c) => c[1])].join(" ").toLowerCase().includes(q)))
      .sort((a, b) => a.district.localeCompare(b.district) || ({ C: 0, M: 1, NP: 2 }[a.type] - { C: 0, M: 1, NP: 2 }[b.type]) || a.name.localeCompare(b.name));
    $("#bodyList").innerHTML = list.map((b) => `<div class="row" data-id="${b.id}" tabindex="0">
        <div><div class="nm">${esc(b.name)}</div><div class="sub">${TYPE[b.type]} · ${esc(b.district)} · ${b.wards} wards</div>${candList(b, true)}</div>
        <div class="bar">${miniBar(b)}</div><div class="hd">${headLine(b)}</div><div>${stTag(statusOf(b))}</div></div>`).join("") || `<div class="empty">No bodies match. Try another search.</div>`;
    const np = NOPOLL.filter((d) => (!state.status || state.status === "nopoll") && (!state.type || d.type === state.type) && (!state.district || d.district === state.district) && (!q || (d.name + " " + d.district).toLowerCase().includes(q)));
    if (np.length) $("#bodyList").innerHTML += np.map((d) => `<div class="row nopoll"><div><div class="nm">${esc(d.name)}</div><div class="sub">${TYPE[d.type]} · ${esc(d.district)}</div></div>${noPollBox(d)}<div><span class="tag st-nopoll">No election</span></div></div>`).join("");
    if (!list.length && np.length) $("#bodyList").querySelector(".empty")?.remove();
    $("#listCount").textContent = `Showing ${list.length} of ${BODIES.length} polling bodies${np.length ? ` · ${np.length} not polling` : ""}`;
  }

  function renderDistricts() {
    const ds = [...new Set(BODIES.map((b) => b.district))].sort();
    $("#distGrid").innerHTML = ds.map((d) => {
      const bs = BODIES.filter((b) => b.district === d), wards = bs.reduce((a, b) => a + b.wards, 0);
      return `<div class="card dist" data-dist="${esc(d)}"><h3>${esc(d)}</h3><p class="muted small" style="margin:2px 0 0">${bs.length} bod${bs.length > 1 ? "ies" : "y"} · ${wards} wards</p>
        <div class="dots">${bs.map((b) => { const hp = headParty(b); return `<i class="${b.type}" title="${esc(b.name)}" style="${hp ? `background:${colour(hp)}` : ""}"></i>`; }).join("")}</div>${(() => { const np = NOPOLL.filter((x) => x.district === d); return np.length ? `<p class="dist-np">⛔ ${np.length} not polling: ${np.map((x) => esc(x.name)).join(", ")}</p>` : ""; })()}</div>`;
    }).join("");
  }

  // ZPTC / MPTC seats from the live file (ETV Bharat data, refreshed by a job); the Supabase copy is stale
  let RURAL_LIVE = null;
  async function loadRuralLive() {
    try {
      const r = await fetch(`live/rural.json?t=${Math.floor(Date.now() / 60000)}`, { cache: "no-store" }); if (!r.ok) return;
      const j = await r.json(), z = { declared: 0, seats: {}, leads: 0 }, m = { declared: 0, seats: {}, leads: 0 };
      for (const x of Object.values(j.mandals || {})) {
        if (x.z) { if (x.z.status === "won") { z.seats[x.z.party] = (z.seats[x.z.party] || 0) + 1; z.declared++; } else z.leads++; }
        if (x.m) { m.declared += x.m.declared || 0; for (const [p, n] of Object.entries(x.m.won || {})) m.seats[p] = (m.seats[p] || 0) + n; }
      }
      RURAL_LIVE = { zptc: z, mptc: m }; renderRural();
    } catch {}
  }
  function renderRural() {
    const items = [["zptc", "ZPTC", "Zilla Parishad Territorial Constituencies", RURAL.zptc, "Poll 5 Nov · Count 7 Nov"], ["mptc", "MPTC", "Mandal Parishad Territorial Constituencies", RURAL.mptc, "Poll 5 Nov · Count 7 Nov"], ["gp", "Sarpanch", "Gram Panchayats", RURAL.gp, "26 Nov · 29 Nov · 2 Dec"]];
    $("#ruralGrid").innerHTML = items.map(([k, t, full, n, when]) => {
      const r = (RURAL_LIVE || R.rural || {})[k], seats = merge(r?.seats), d = r?.declared || 0, ld = r?.leads || 0;
      const rows = d ? groups().filter((g) => seats[g.id]).sort((a, b) => seats[b.id] - seats[a.id]).map((g) => `<tr><td><span class="pty">${logo(g.id)}${esc(g.name)}</span></td><td class="num">${fmt(seats[g.id])}</td></tr>`).join("") : "";
      return `<div class="card rural"><p class="eyebrow">${t}</p><h3>${full}</h3><b class="big">${fmt(n)}</b><p class="muted small" style="margin:0">${when}</p>
        <div class="wardbar">${groups().map((g) => (seats[g.id] ? `<div style="width:${(seats[g.id] / n) * 100}%;background:${colour(g.id)}"></div>` : "")).join("")}</div>
        ${d ? `<p class="small muted">${fmt(d)} of ${fmt(n)} declared${ld ? ` · ${fmt(ld)} leading` : ""}</p><table class="tally">${rows}</table>` : `<div class="empty">Results will appear on counting day</div>`}</div>`;
    }).join("");
  }

  function renderTimeline() {
    const now = Date.now(); let nextMarked = false;
    $("#timeline").innerHTML = SCHEDULE.map((s) => {
      const t = new Date(s.at).getTime(), done = t <= now, isNext = !done && !nextMarked; if (isNext) nextMarked = true;
      const today = new Date(t).toDateString() === new Date(now).toDateString();
      const date = new Date(s.at).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
      return `<li class="${done ? "done" : ""} ${isNext ? "next" : ""} ${s.big ? "big" : ""}"><div class="tl-d">${date}<span class="tl-p">${{ urban: "Urban", rural: "MPTC/ZPTC", gp: "Panchayat" }[s.phase]}</span>${today ? '<span class="today-tag">Today</span>' : ""}</div><div class="tl-l">${esc(s.label)}</div></li>`;
    }).join("");
  }

  function renderDeferred() {
    $("#deferred").innerHTML = DEFERRED.map(([n, t, d, why]) => `<span>${esc(n)}<small>${t === "C" ? "Corp · " : ""}${esc(d)}</small>${why ? `<em>${esc(why)}</em>` : ""}</span>`).join("");
  }

  const SHARE_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  function openBody(id) {
    const b = BODIES.find((x) => x.id === id); if (!b) return;
    const r = R.bodies?.[b.id] || {}, w = merge(r.wards), l = merge(r.leads), G = groups();
    const cells = [];
    for (const g of G) for (let i = 0; i < (w[g.id] || 0); i++) cells.push(`<i style="background:${colour(g.id)}" title="${esc(g.name)} won"></i>`);
    for (const g of G) for (let i = 0; i < (l[g.id] || 0); i++) cells.push(`<i class="lead" style="background:${colour(g.id)}" title="${esc(g.name)} leading"></i>`);
    while (cells.length < b.wards) cells.push(`<i title="Awaiting"></i>`);
    const rows = G.filter((g) => w[g.id] || l[g.id]).map((g) => `<tr><td><span class="pty">${logo(g.id)}${esc(g.name)}</span></td><td class="num">${w[g.id] || 0}</td><td class="num">${l[g.id] || 0}</td></tr>`).join("");
    $("#drawer").innerHTML = `<button class="x" id="closeD" aria-label="Close">×</button>
      <p class="eyebrow">${TYPE[b.type]} · ${esc(b.district)}</p><h2>${esc(b.name)}</h2>${stTag(statusOf(b))}
      <div class="kv"><div><b>${b.wards}</b><span>wards</span></div><div><b>${Math.floor(b.wards / 2) + 1}</b><span>for council majority</span></div>
      <div><b style="font-size:16px">${esc(b.res)}</b><span>${b.type === "C" ? "Mayor" : "Chairperson"} reservation</span></div><div><b>${r.turnout ? r.turnout + "%" : "—"}</b><span>turnout</span></div></div>
      <button class="share-btn big" type="button" data-share="${b.id}">${SHARE_ICON} Share this result as an image</button>
      <h3>${b.type === "C" ? "Mayor" : "Chairperson"} candidates</h3>${candList(b)}<p class="muted small">Announced by the parties; the SEC's final list follows withdrawals on 21 Oct.</p>
      <h3>${b.type === "C" ? "Mayor" : "Chairperson"} result</h3><div class="head-res" style="margin:8px 0 18px">${headLine(b)}</div>
      <h3>Ward map · ${r.declared || 0} of ${b.wards} declared</h3><div class="waffle">${cells.join("")}</div>
      ${rows ? `<table class="tally"><tr><th>Party</th><th>Won</th><th>Leading</th></tr>${rows}</table>` : `<div class="empty">Counting begins 3 November at 8 AM.</div>`}`;
    $("#drawer").classList.add("open"); $("#drawer").setAttribute("aria-hidden", "false"); $("#drawerBg").hidden = false;
    $("#closeD").onclick = closeBody; $("#closeD").focus();
  }
  function closeBody() { $("#drawer").classList.remove("open"); $("#drawer").setAttribute("aria-hidden", "true"); $("#drawerBg").hidden = true; }

  function renderAll() { renderStats(); renderResults(); renderMayors(); renderFilters(); renderList(); renderDistricts(); renderRural(); renderTimeline(); }

  // ---------- demo data (clearly flagged; never used unless ?demo) ----------
  function simulate() {
    let s = 20261030; const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
    const base = { TDP: 0.4, YSRCP: 0.28, JSP: 0.13, BJP: 0.06, INC: 0.04, LEFT: 0.02, OTH: 0.07 };
    const pick = (wt) => { let x = rnd() * sum(wt); for (const [k, v] of Object.entries(wt)) if ((x -= v) <= 0) return k; return "OTH"; };
    const bodies = {};
    for (const b of BODIES) {
      const wt = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, v * (0.4 + rnd() * 1.4)]));
      const declared = rnd() < 0.55 ? b.wards : Math.floor(b.wards * rnd() * 0.8);
      const wards = {}, leads = {};
      for (let i = 0; i < b.wards; i++) { const p = pick(wt); if (i < declared) wards[p] = (wards[p] || 0) + 1; else if (rnd() < 0.7) leads[p] = (leads[p] || 0) + 1; }
      const all = { ...wards }; for (const [k, v] of Object.entries(leads)) all[k] = (all[k] || 0) + v;
      const top = Object.entries(all).sort((a, b) => b[1] - a[1])[0];
      bodies[b.id] = { declared, wards, leads, turnout: +(52 + rnd() * 25).toFixed(1), head: top && rnd() < 0.92 ? { party: top[0], name: "Candidate " + b.name.slice(0, 1), status: declared === b.wards ? "won" : "leading", margin: Math.floor(300 + rnd() * 9000) } : undefined };
    }
    const rural = (n, k) => { const seats = {}; const d = Math.floor(n * k); for (let i = 0; i < d; i++) { const p = pick(base); seats[p] = (seats[p] || 0) + 1; } return { declared: d, seats }; };
    return { updated: new Date().toISOString(), turnout: 61.8, bodies, rural: { zptc: rural(RURAL.zptc, 0.8), mptc: rural(RURAL.mptc, 0.65) } };
  }

  // ---------- events ----------
  document.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-type]"); if (chip) { state.type = chip.dataset.type; renderFilters(); renderList(); return; }
    if (e.target.closest("[data-share]")) return; // public-share.js
    const card = e.target.closest("[data-id]"); if (card) return openBody(card.dataset.id);
    const dist = e.target.closest("[data-dist]"); if (dist) { state.district = dist.dataset.dist; renderFilters(); renderList(); $("#bodies").scrollIntoView(); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeBody(); if (e.key === "Enter" && e.target.dataset?.id) openBody(e.target.dataset.id); });
  $("#drawerBg").onclick = closeBody;
  $("#q").oninput = (e) => { state.q = e.target.value; renderList(); };
  $("#distSel").onchange = (e) => { state.district = e.target.value; renderList(); };
  $("#statusSel").onchange = (e) => { state.status = e.target.value; renderList(); };
  $("#allianceToggle").onchange = (e) => { state.alliance = e.target.checked; renderAll(); };

  R = DEMO ? simulate() : window.AP_RESULTS || { bodies: {}, rural: {} };
  if (DEMO) $("#demoBanner").hidden = false;
  renderDeferred(); renderAll(); tick(); setInterval(tick, 1000);

  // live refresh: re-read data/results.js now (bypassing any cached copy) and every 60 s
  function refresh() {
    const sc = document.createElement("script"); sc.src = "data/results.js?t=" + Date.now();
    sc.onload = () => { R = window.AP_RESULTS || R; renderAll(); sc.remove(); }; sc.onerror = () => sc.remove();
    document.body.appendChild(sc);
  }
  // with Supabase configured, live.js pushes data in through these hooks instead of polling results.js
  window.apSetResults = (obj) => { if (DEMO) return; R = obj; renderAll(); };
  window.apRerender = () => renderAll();
  if (!DEMO) { loadRuralLive(); setInterval(() => { if (!document.hidden) loadRuralLive(); }, 60000); }
  window.apResults = () => (DEMO ? null : R); // public-share.js (never shares simulated numbers)
  if (!DEMO && !(window.SUPABASE_URL && window.SUPABASE_ANON_KEY)) { refresh(); setInterval(refresh, 60000); }
})();
