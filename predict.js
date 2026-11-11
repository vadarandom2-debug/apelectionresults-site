// Predictions tab: a transparent statistical projection of the 100 directly elected Mayor / Chairperson posts.
// Not a survey or exit poll. Basis: each body's 2024 assembly result (Kutami share − YSRCP share), adjusted by the
// visitor's scenario (statewide swing + ruling-party local-body edge), with Monte Carlo uncertainty.
(() => {
  const BODIES = window.AP_BODIES || [], AC = window.GE_AC || [], CAND = window.AP_CANDIDATES || { bodies: {}, ndaSeat: {} };
  const { esc, logo, col } = window.GECharts;
  const $ = (s) => document.querySelector(s);
  const K = new Set(["TDP", "JSP", "BJP"]);
  const TYPE = { C: "Corporation", M: "Municipality", NP: "Nagar Panchayat" };
  const DIST = { Ananthapuramu: "Anantapur", "SPS Nellore": "Nellore", "YSR Kadapa": "Kadapa", Markapuram: "Prakasam" };
  const PREFIX = { "greater-visakhapatnam": ["visakhapatnam", "gajuwaka", "bheemili", "pendurthi"] };
  // Projections pause while polls are open and in the 48 hours before (urban polling ends 1 Nov, 5 pm IST).
  const QUIET = [["2026-10-30T17:00:00+05:30", "2026-11-01T17:00:00+05:30"]];
  const COUNTING = Date.parse("2026-11-03T08:00:00+05:30");
  const SIMS = 5000, SD_STATE = 5, SD_LOCAL = 10;
  const PRESETS = [
    { id: "repeat", name: "2024 repeat", swing: 0, edge: 0, note: "Every town votes exactly as its area did in the 2024 assembly election." },
    { id: "edge", name: "Ruling-party edge", swing: 0, edge: 6, note: "Andhra local polls usually favour the party in power; YSRCP swept the 2021 civic polls while in office." },
    { id: "tight", name: "Tighter race", swing: -6, edge: 0, note: "A 6-point swing back to YSRCP since 2024." },
    { id: "anti", name: "Anti-incumbency", swing: -12, edge: 0, note: "A 12-point swing to YSRCP: roughly the 2024 margin reversed in close areas." },
  ];
  const st = { swing: 0, edge: 0, preset: "repeat", q: "", type: "" };

  // ---------- basis: 2024 assembly margin (Kutami − YSRCP, percentage points) ----------
  const norm = (s) => String(s).toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z]/g, "");
  function acMargin(a) {
    const r = a.y["2024"]; if (!r) return null;
    const [wp, , wpct, , rp, , rpct] = r;
    let k = (K.has(wp) ? wpct : 0) + (K.has(rp) ? rpct : 0), y = wp === "YSRCP" ? wpct : rp === "YSRCP" ? rpct : null;
    if (y == null) y = Math.max(0, 100 - k - 8); if (!k) k = Math.max(0, 100 - y - 8);
    return k - y;
  }
  const byName = new Map(AC.map((a) => [norm(a.n), a]));
  function basis(b) {
    const exact = byName.get(norm(b.name));
    if (exact) return { acs: [exact], how: exact.n };
    const pre = PREFIX[b.id] || [norm(b.name)];
    const acs = AC.filter((a) => pre.some((p) => norm(a.n).startsWith(p)) && norm(a.n) !== norm(b.name));
    if (acs.length && norm(b.name).length >= 5) return { acs, how: acs.map((a) => a.n).join(", ") };
    const d = DIST[b.district] || b.district, inD = AC.filter((a) => a.nd === d);
    return { acs: inD, how: `${d} district average (${inD.length} seats)` };
  }
  let EXACT = 0;
  const ROWS = BODIES.map((b) => {
    const { acs, how } = basis(b); if (acs.length === 1 && how === acs[0].n) EXACT++;
    const ms = acs.map(acMargin).filter((m) => m != null);
    return { b, how, m24: ms.length ? ms.reduce((x, y) => x + y, 0) / ms.length : 0, kp: CAND.ndaSeat?.[b.id] || "TDP" };
  });

  // ---------- simulation ----------
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function simulate() {
    const r = rng(2026), n = ROWS.length, wins = new Array(n).fill(0), dist = new Array(n + 1).fill(0);
    const adj = ROWS.map((x) => x.m24 + st.swing + st.edge);
    for (let s = 0; s < SIMS; s++) {
      const shared = gauss(r) * SD_STATE; let k = 0;
      for (let i = 0; i < n; i++) if (adj[i] + shared + gauss(r) * SD_LOCAL > 0) { wins[i]++; k++; }
      dist[k]++;
    }
    const cum = []; let c = 0; dist.forEach((v, i) => { c += v; cum[i] = c / SIMS; });
    const q = (p) => cum.findIndex((x) => x >= p);
    return { p: wins.map((w) => w / SIMS), adj, dist, median: q(0.5), lo: q(0.1), hi: q(0.9), pMaj: dist.reduce((a, v, i) => a + (i > n / 2 ? v : 0), 0) / SIMS };
  }
  const rating = (p) => { const x = Math.max(p, 1 - p), side = p >= 0.5 ? "Kutami" : "YSRCP"; return x >= 0.9 ? ["Safe " + side, 3] : x >= 0.75 ? ["Likely " + side, 2] : x >= 0.6 ? ["Lean " + side, 1] : ["Toss-up", 0]; };
  const pct = (x) => (x >= 0.995 ? "99%+" : x <= 0.005 ? "<1%" : Math.round(x * 100) + "%");
  const sgn = (m) => (m >= 0 ? "Kutami +" : "YSRCP +") + Math.abs(m).toFixed(1);

  // ---------- view ----------
  function render() {
    const now = Date.now(), quiet = QUIET.find(([a, b]) => now >= Date.parse(a) && now < Date.parse(b));
    const root = $("#predictRoot"); if (!root) return;
    if (quiet) {
      root.innerHTML = `<div class="wrap"><div class="card pr-quiet"><h3>Projections are paused</h3><p class="muted">We don't publish election projections while voting is open or in the 48 hours before. They return after polling closes at 5 pm on 1 November.</p></div></div>`;
      return;
    }
    const S = simulate(), n = ROWS.length;
    const rows = ROWS.map((x, i) => ({ ...x, p: S.p[i], adj: S.adj[i], rt: rating(S.p[i]) }));
    const exp = rows.reduce((a, x) => a + x.p, 0);
    const lead = rows.map((x) => ({ p: x.p >= 0.6 ? x.kp : x.p <= 0.4 ? "YSRCP" : "OTH", t: `${x.b.name}: Kutami ${pct(x.p)} · YSRCP ${pct(1 - x.p)}` }))
      .sort((a, c) => (a.p === "YSRCP" ? 2 : a.p === "OTH" ? 1 : 0) - (c.p === "YSRCP" ? 2 : c.p === "OTH" ? 1 : 0));
    const maxD = Math.max(...S.dist);
    const bars = S.dist.map((v, i) => v ? `<rect x="${(i / (n + 1)) * 600}" y="${120 - (v / maxD) * 112}" width="${600 / (n + 1) - 1}" height="${(v / maxD) * 112}" fill="${i > n / 2 ? "var(--TDP)" : "var(--YSRCP)"}" opacity="${i >= S.lo && i <= S.hi ? 1 : 0.35}"><title>${i} posts: ${(v / SIMS * 100).toFixed(1)}% of simulations</title></rect>` : "").join("");
    const corps = rows.filter((x) => x.b.type === "C").sort((a, c) => c.p - a.p);
    const q = st.q.toLowerCase();
    const list = rows.filter((x) => (!st.type || x.b.type === st.type) && (!q || (x.b.name + " " + x.b.district).toLowerCase().includes(q))).sort((a, c) => Math.abs(a.p - 0.5) - Math.abs(c.p - 0.5));
    const counting = now >= COUNTING;
    const cands = (id, party) => (CAND.bodies[id] || []).filter(([p, , , s]) => (party === "K" ? K.has(p) : p === party) && s !== "reported").map(([, nm]) => nm)[0];

    root.innerHTML = `
    <section class="pr-hero"><div class="wrap">
      <p class="eyebrow">Predictions · ఎన్నికల అంచనా</p>
      <h2 class="hero-h">Who wins the <span class="hl">100 head posts?</span></h2>
      <p class="lede">A statistical projection of the directly elected Mayor and Chairperson posts in the 1 November urban polls. Choose a scenario and every number updates.</p>
      <div class="pr-warn"><b>This is a model, not a survey or exit poll.</b> It starts from each town's 2024 assembly result and adds your scenario. Local candidates, rebels and turnout can change everything. ${counting ? `<a href="#results">Counting is under way — see the real results →</a>` : ""}</div>
    </div></section>
    <div class="wrap pr-body">
      <div class="card pr-ctl">
        <div class="pr-presets" role="group" aria-label="Scenario">${PRESETS.map((p) => `<button type="button" data-preset="${p.id}" aria-pressed="${st.preset === p.id}">${esc(p.name)}</button>`).join("")}</div>
        <p class="muted small" id="prNote">${esc((PRESETS.find((p) => p.id === st.preset) || { note: "Custom scenario." }).note)}</p>
        <label class="pr-sl"><span>Swing since 2024 <b id="prSwV">${st.swing > 0 ? "+" : ""}${st.swing} pts ${st.swing ? (st.swing > 0 ? "to Kutami" : "to YSRCP") : ""}</b></span><input type="range" id="prSwing" min="-20" max="20" step="1" value="${st.swing}" /></label>
        <label class="pr-sl"><span>Ruling-party local-body edge <b>${st.edge} pts</b></span><input type="range" id="prEdge" min="0" max="15" step="1" value="${st.edge}" /></label>
      </div>
      <div class="pr-top">
        <div class="card pr-big"><p class="eyebrow">Projected head posts · of 100</p>
          <div class="pr-nums"><div style="--c:var(--TDP)">${logo("TDP")}<b>${S.median}</b><span>Kutami<small>likely ${S.lo}–${S.hi}</small></span></div>
          <div style="--c:var(--YSRCP)">${logo("YSRCP")}<b>${n - S.median}</b><span>YSRCP<small>likely ${n - S.hi}–${n - S.lo}</small></span></div></div>
          <p class="pr-maj">Kutami wins a majority of the posts in <b>${pct(S.pMaj)}</b> of ${SIMS.toLocaleString("en-IN")} simulated elections.</p>
          <div class="pr-hemi">${window.GECharts.hemicycle(lead, { rows: 6, label: "Projected leaders of 100 posts" })}</div>
          <p class="muted small">Gold/red/orange: Kutami ahead (60%+). Blue: YSRCP ahead. Grey: toss-up.</p></div>
        <div class="card pr-dist"><p class="eyebrow">How often each outcome happened</p>
          <svg viewBox="0 0 600 132" role="img" aria-label="Distribution of Kutami head posts across simulations">${bars}<line x1="300" x2="300" y1="0" y2="122" stroke="var(--ink)" stroke-dasharray="3 3"/><text x="304" y="12" font-size="11" fill="var(--ink2)">majority</text></svg>
          <div class="pr-axis"><span>0</span><span>Kutami posts</span><span>100</span></div>
          <p class="muted small">Expected ${exp.toFixed(0)} Kutami posts. Solid bars: the middle 80% of outcomes.</p></div>
      </div>
      <h3 class="pr-h">13 Mayor races</h3>
      <div class="pr-mayors">${corps.map((x) => `<article class="card pr-m"><p class="eyebrow">${esc(x.b.district)}</p><h4>${esc(x.b.name)}</h4>
        <div class="pr-bar"><i style="width:${x.p * 100}%;background:${col(x.kp)}"></i><i style="width:${(1 - x.p) * 100}%;background:var(--YSRCP)"></i></div>
        <div class="pr-ps"><span>${logo(x.kp)}<b>${pct(x.p)}</b> ${esc(cands(x.b.id, "K") || x.kp)}</span><span>${esc(cands(x.b.id, "YSRCP") || "YSRCP")} <b>${pct(1 - x.p)}</b>${logo("YSRCP")}</span></div>
        <p class="muted small"><span class="pr-rt r${x.rt[1]} ${x.p >= 0.5 ? "k" : "y"}">${x.rt[0]}</span> 2024: ${sgn(x.m24)} · ${esc(x.how)}</p></article>`).join("")}</div>
      <h3 class="pr-h">All 100 bodies <span class="muted small">closest races first</span></h3>
      <div class="pr-filter"><input type="search" id="prQ" placeholder="Find a town or district…" value="${esc(st.q)}" aria-label="Find a town" />
        ${[["", "All"], ["C", "Corporations"], ["M", "Municipalities"], ["NP", "Nagar Panchayats"]].map(([v, l]) => `<button type="button" class="chip ${st.type === v ? "on" : ""}" data-prtype="${v}">${l}</button>`).join("")}</div>
      <div class="tbl-wrap"><table class="full-tbl pr-tbl"><thead><tr><th class="tl">Body</th><th class="tl">Based on (2024)</th><th>2024 margin</th><th>Projected</th><th class="tl">Kutami chance</th><th class="tl">Rating</th></tr></thead><tbody>
        ${list.map((x) => `<tr><td class="tl"><b>${esc(x.b.name)}</b><br><span class="muted small">${TYPE[x.b.type]} · ${esc(x.b.district)}</span></td><td class="tl small">${esc(x.how)}</td><td class="num">${sgn(x.m24)}</td><td class="num">${sgn(x.adj)}</td>
          <td class="tl"><div class="pr-mini"><i style="width:${x.p * 100}%;background:${col(x.kp)}"></i></div><span class="small">${pct(x.p)}</span></td><td class="tl"><span class="pr-rt r${x.rt[1]} ${x.p >= 0.5 ? "k" : "y"}">${x.rt[0]}</span></td></tr>`).join("") || `<tr><td colspan="6" class="empty">No bodies match.</td></tr>`}
      </tbody></table></div>
      <div class="card pr-method"><h3>How this projection works</h3><ol>
        <li><b>Starting point.</b> For each town we take the 2024 assembly result in the same area: the constituency with the same name (${EXACT} towns), the average of a city's constituencies (e.g. Vijayawada West, Central and East), or otherwise the district average. Margin = Kutami vote share − YSRCP vote share.</li>
        <li><b>Your scenario.</b> We add the swing and the ruling-party edge you choose to every town.</li>
        <li><b>Uncertainty.</b> We simulate the election ${SIMS.toLocaleString("en-IN")} times. Each run adds a statewide error (±${SD_STATE} points, the same everywhere) and a local error (±${SD_LOCAL} points per town) for candidates, rebels and turnout. A town's chance is the share of runs Kutami wins it.</li>
        <li><b>Ratings.</b> Safe = 90%+ either way, Likely = 75%+, Lean = 60%+, otherwise Toss-up.</li>
        <li><b>Limits.</b> Civic polls turn on local candidates and alliance friction (some Kutami rebels are contesting), which a 2024-based model can't see. Treat this as a guide to which races are close, not a forecast of the winner.</li></ol>
        <p class="muted small">Projections pause in the 48 hours before polling ends. Data: Election Commission of India 2024 results.</p></div>
    </div>`;
  }

  document.addEventListener("click", (e) => {
    const p = e.target.closest("[data-preset]");
    if (p) { const x = PRESETS.find((y) => y.id === p.dataset.preset); Object.assign(st, { swing: x.swing, edge: x.edge, preset: x.id }); return render(); }
    const t = e.target.closest("[data-prtype]");
    if (t) { st.type = t.dataset.prtype; render(); }
  });
  let tm;
  document.addEventListener("input", (e) => {
    if (e.target.id === "prSwing" || e.target.id === "prEdge") {
      st[e.target.id === "prSwing" ? "swing" : "edge"] = +e.target.value; st.preset = PRESETS.find((x) => x.swing === st.swing && x.edge === st.edge)?.id || "custom";
      clearTimeout(tm); tm = setTimeout(() => { const id = e.target.id; render(); document.getElementById(id)?.focus(); }, 60);
    }
    if (e.target.id === "prQ") { st.q = e.target.value; clearTimeout(tm); tm = setTimeout(() => { render(); const i = $("#prQ"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200); }
  });
  window.renderPredictions = render;
  // the router may run before this file loads: render when the tab is (or already was) shown
  document.addEventListener("tabshow", (e) => { if (e.detail === "predict" && !$("#predictRoot")?.innerHTML) render(); });
  if (location.hash === "#/predict") render();
})();
