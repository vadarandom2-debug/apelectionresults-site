// General elections (Assembly + Lok Sabha 2014/2019/2024) panels and tab routing.
(() => {
  const C = window.GECharts, { esc, fmt, col, name, logo, tip, ORDER } = C;
  const AC = window.GE_AC, PC = window.GE_PC, VOTES = window.GE_VOTES;
  const YEARS = ["2014", "2019", "2024"];
  const $ = (s) => document.querySelector(s);
  const CM = { 2014: ["N. Chandrababu Naidu", "TDP"], 2019: ["Y. S. Jagan Mohan Reddy", "YSRCP"], 2024: ["N. Chandrababu Naidu", "TDP"] };
  const HEAD = { 2014: "TDP-BJP form the first government of the new state", 2019: "YSRCP landslide: 151 of 175", 2024: "Kutami sweep: TDP, Jana Sena and BJP take 164" };
  const state = { aYear: "2024", lYear: "2024", q: "", dist: "", pat: "" };

  const tally = (rows, yr) => { const t = {}; rows.forEach((r) => { const p = r.y[yr][0]; t[p] = (t[p] || 0) + 1; }); return t; };
  const mpts = (r) => +(r[2] - r[6]).toFixed(2);
  const acTip = (a, yr) => { const r = a.y[yr]; return `<b>${esc(a.n)}</b> <span class="mut">${yr} · ${esc(a.d)}</span><div class="tr"><i style="background:${col(r[0])}"></i>${esc(r[1])} (${r[0]})<span>${r[2]}%</span></div><div class="tr"><i style="background:${col(r[4])}"></i>${esc(r[5])} (${r[4]})<span>${r[6]}%</span></div><div class="mut">Margin ${fmt(r[8])} votes</div>`; };
  const seg = (id, val) => `<div class="seg-ctl" role="tablist" data-seg="${id}">${YEARS.map((y) => `<button role="tab" aria-selected="${y === val}" data-y="${y}">${y}</button>`).join("")}</div>`;
  const legend = (ps) => `<div class="legend">${ps.map((p) => `<span><i style="background:${col(p)}"></i>${esc(name(p))}</span>`).join("")}</div>`;
  const present = (t) => ORDER.filter((p) => t[p]);

  // ---------- overview ----------
  function renderOverview() {
    $("#ovCards").innerHTML = YEARS.map((y) => {
      const t = tally(AC, y), lt = tally(PC, y), win = Object.entries(t).sort((a, b) => b[1] - a[1])[0];
      const seats = C.seatsFrom(AC.map((a) => ({ p: a.y[y][0], a })), (r) => `${esc(r.a.n)} · ${r.p}`);
      const lsRow = ORDER.flatMap((p) => Array(lt[p] || 0).fill(p)).map((p) => `<i style="background:${col(p)}" ${tip(name(p))}></i>`).join("");
      return `<article class="card verdict"><div class="v-top"><span class="v-year">${y}</span>${logo(win[0], "lg")}</div>
        <h3>${HEAD[y]}</h3>
        <div class="v-hemi">${C.hemicycle(seats, { rows: 8, label: y + " assembly" })}<div class="v-mid"><b>${win[1]}</b><span>${win[0]} · of 175</span></div></div>
        <div class="v-tally">${present(t).map((p) => `<span>${logo(p)}<b>${t[p]}</b></span>`).join("")}</div>
        <div class="v-ls"><span class="mut small">Lok Sabha 25</span><div class="ls-row">${lsRow}</div></div>
        <p class="v-cm">Chief Minister: <b>${CM[y][0]}</b> (${CM[y][1]})</p></article>`;
    }).join("");
    const ps = ["TDP", "YSRCP", "JSP", "BJP", "INC"];
    $("#ovVotes").innerHTML = C.lineChart(ps.map((p) => ({ p, v: YEARS.map((y) => (y === "2014" && p === "JSP" ? null : VOTES["A" + y][p])) })), YEARS) + legend(ps);
    $("#ovSeats").innerHTML = C.stackedBars(YEARS.map((y) => ({ label: y, counts: tally(AC, y), total: 175 })), { scaleMax: 175, marker: 88, markerLabel: "Majority 88", rowH: 46, labelW: 56, showTotal: false }) + legend(present(Object.assign({}, ...YEARS.map((y) => tally(AC, y)))));
    $("#ovFlow").innerHTML = C.alluvial(AC.map((a) => YEARS.map((y) => a.y[y][0])), YEARS);
    const same = AC.filter((a) => new Set(YEARS.map((y) => a.y[y][0])).size === 1);
    const swingers = AC.filter((a) => a.y["2014"][0] !== a.y["2019"][0] && a.y["2019"][0] !== a.y["2024"][0]);
    const c24 = [...AC].sort((a, b) => a.y["2024"][8] - b.y["2024"][8])[0], b24 = [...AC].sort((a, b) => b.y["2024"][8] - a.y["2024"][8])[0];
    const sameBy = {}; same.forEach((a) => (sameBy[a.y["2024"][0]] = (sameBy[a.y["2024"][0]] || 0) + 1));
    $("#ovFacts").innerHTML = [
      [swingers.length, "seats changed party in both 2019 and 2024", "Andhra votes for change, not loyalty"],
      [same.length, "seats the same party won all three times", Object.entries(sameBy).map(([p, n]) => `${p} ${n}`).join(" · ")],
      [fmt(c24.y["2024"][8]), `closest 2024 margin · ${c24.n}`, `${c24.y["2024"][1]} (${c24.y["2024"][0]})`],
      [fmt(b24.y["2024"][8]), `biggest 2024 margin · ${b24.n}`, `${b24.y["2024"][1]} (${b24.y["2024"][0]})`],
    ].map(([b, l, s]) => `<div class="fact"><b>${b}</b><span>${esc(l)}</span><small>${esc(s)}</small></div>`).join("");
  }

  // ---------- assembly ----------
  function partyTable(rows, yr, prefix, total) {
    const t = tally(rows, yr), prev = YEARS[YEARS.indexOf(yr) - 1], pt = prev ? tally(rows, prev) : null, v = VOTES[prefix + yr], pv = prev ? VOTES[prefix + prev] : null;
    const ps = ORDER.filter((p) => t[p] || (v[p] || 0) >= 0.5).sort((a, b) => (t[b] || 0) - (t[a] || 0) || v[b] - v[a]);
    const d = (x, u = "") => (x == null ? "—" : `<span class="${x > 0 ? "up" : x < 0 ? "dn" : ""}">${x > 0 ? "+" : ""}${u ? x.toFixed(1) : x}${u}</span>`);
    return `<table class="tally"><tr><th>Party</th><th>Seats</th><th>±</th><th>Vote %</th><th>± pts</th></tr>${ps.map((p) => `<tr><td><span class="pty">${logo(p)}${esc(name(p))}</span></td><td class="num"><b>${t[p] || 0}</b></td><td class="num">${pt ? d((t[p] || 0) - (pt[p] || 0)) : "—"}</td><td class="num">${(v[p] ?? 0).toFixed(1)}%</td><td class="num">${pv && pv[p] != null && v[p] != null ? d(v[p] - pv[p], " ") : "—"}</td></tr>`).join("")}</table><p class="mut small">Majority: ${Math.floor(total / 2) + 1} of ${total}. Vote shares are statewide; "Others" includes NOTA.</p>`;
  }
  function renderAssembly() {
    const y = state.aYear, t = tally(AC, y);
    $("#asSeg").innerHTML = seg("a", y);
    $("#asHemi").innerHTML = C.hemicycle(C.seatsFrom(AC.map((a) => ({ p: a.y[y][0], a })), (r) => acTip(r.a, y)), { rows: 8, label: y + " assembly" }) + legend(present(t));
    $("#asTable").innerHTML = partyTable(AC, y, "A", 175);
    const dists = [...new Set(AC.map((a) => a.d))];
    $("#asDist").innerHTML = C.stackedBars(dists.map((d) => { const rows = AC.filter((a) => a.d === d); return { label: d, counts: tally(rows, y), total: rows.length }; }), { scaleMax: Math.max(...dists.map((d) => AC.filter((a) => a.d === d).length)), rowH: 32, labelW: 120 });
    $("#asStrip").innerHTML = C.strip(AC.map((a) => ({ p: a.y[y][0], v: mpts(a.y[y]), t: acTip(a, y) })), { max: 70 });
    const sorted = [...AC].sort((a, b) => a.y[y][8] - b.y[y][8]);
    const li = (a) => `<li data-ac="${a.no}">${logo(a.y[y][0])}<span><b>${esc(a.n)}</b><small>${esc(a.y[y][1])} beat ${esc(a.y[y][5])} (${a.y[y][4]})</small></span><em class="num">${fmt(a.y[y][8])}</em></li>`;
    $("#asClose").innerHTML = sorted.slice(0, 8).map(li).join("");
    $("#asBig").innerHTML = sorted.slice(-8).reverse().map(li).join("");
    window.renderInsights?.("A", y);
  }

  // ---------- lok sabha ----------
  function renderLS() {
    const y = state.lYear, t = tally(PC, y);
    $("#lsSeg").innerHTML = seg("l", y);
    $("#lsTiles").innerHTML = PC.map((p) => { const r = p.y[y]; return `<div class="ls-tile" style="--pc:${col(r[0])}" data-pc="${p.no}">${logo(r[0])}<div><b>${esc(p.n)}</b><small>${esc(r[1])}</small><small class="num">${r[0]} · +${fmt(r[8])}</small></div></div>`; }).join("");
    $("#lsTable").innerHTML = partyTable(PC, y, "L", 25);
    const ps = ["TDP", "YSRCP", "BJP", "JSP", "INC"];
    $("#lsVotes").innerHTML = C.lineChart(ps.map((p) => ({ p, v: YEARS.map((yy) => (VOTES["L" + yy][p] ? VOTES["L" + yy][p] : null)) })), YEARS) + legend(ps);
    $("#lsSeats").innerHTML = C.stackedBars(YEARS.map((yy) => ({ label: yy, counts: tally(PC, yy), total: 25 })), { scaleMax: 25, marker: 13, markerLabel: "Majority of AP seats 13", rowH: 46, labelW: 56, showTotal: false });
    const tt = [...PC].sort((a, b) => b.t[y] - a.t[y]), mx = 90, mn = 60;
    $("#lsTurn").innerHTML = `<div class="hbars">${tt.map((p) => `<div class="hb" ${tip(`<b>${esc(p.n)}</b><div class="mut">${y} turnout</div><b>${p.t[y]}%</b>`)}><span>${esc(p.n.replace(/ \(S[CT]\)/, ""))}</span><div><i style="width:${((p.t[y] - mn) / (mx - mn)) * 100}%"></i></div><em class="num">${p.t[y].toFixed(1)}%</em></div>`).join("")}</div><p class="mut small">Axis starts at ${mn}% to show differences between constituencies.</p>`;
    window.renderInsights?.("L", y);
  }

  // ---------- constituencies ----------
  const PATTERNS = {
    "": ["All patterns", () => true],
    flip24: ["Changed hands in 2024", (a) => a.y["2019"][0] !== a.y["2024"][0]],
    flip19: ["Changed hands in 2019", (a) => a.y["2014"][0] !== a.y["2019"][0]],
    loyal: ["Same party all 3 times", (a) => new Set(YEARS.map((y) => a.y[y][0])).size === 1],
    close: ["Won by < 5,000 votes (any year)", (a) => YEARS.some((y) => a.y[y][8] < 5000)],
    sc: ["SC / ST reserved", (a) => /\((SC|ST)\)/.test(a.n)],
  };
  function renderSeatsFilters() {
    $("#cDist").innerHTML = `<option value="">All 13 districts</option>` + [...new Set(AC.map((a) => a.d))].map((d) => `<option>${esc(d)}</option>`).join("");
    $("#cPat").innerHTML = Object.entries(PATTERNS).map(([k, [l]]) => `<option value="${k}">${l}</option>`).join("");
  }
  function renderSeats() {
    const q = state.q.trim().toLowerCase();
    const list = AC.filter((a) => (!state.dist || a.d === state.dist) && PATTERNS[state.pat][1](a) && (!q || [a.n, a.d, a.nd, ...YEARS.map((y) => a.y[y][1])].join(" ").toLowerCase().includes(q)));
    $("#cList").innerHTML = list.map((a) => `<div class="crow" data-ac="${a.no}" tabindex="0"><div><span class="cno num">${a.no}</span><b>${esc(a.n)}</b><small>${esc(a.d)}${a.nd && a.nd !== a.d ? " · now " + esc(a.nd) : ""}</small></div>
      <div class="hist">${YEARS.map((y) => `<span class="hchip" style="--pc:${col(a.y[y][0])}" ${tip(acTip(a, y))}><em>${y}</em>${logo(a.y[y][0])}<b>${a.y[y][0]}</b></span>`).join("")}</div></div>`).join("") || `<div class="empty">No constituency matches.</div>`;
    $("#cCount").textContent = `${list.length} of 175 assembly constituencies`;
  }

  function openDetail(kind, no) {
    const set = kind === "ac" ? AC : PC, a = set.find((x) => x.no === +no); if (!a) return;
    const block = (y) => { const r = a.y[y]; if (!r) return ""; return `<div class="dy"><div class="dy-h"><b>${y}</b>${kind === "pc" ? `<span class="mut small">Turnout ${a.t[y]}%</span>` : ""}</div>
      ${[[r[0], r[1], r[2], r[3], true], [r[4], r[5], r[6], r[7], false]].map(([p, n, pc, v, w]) => `<div class="cand">${logo(p)}<div class="cb"><div class="cn"><b>${esc(n)}</b> <span class="mut">${p}${w ? " · won" : ""}</span></div><div class="bar"><i style="width:${pc}%;background:${col(p)}"></i></div></div><em class="num">${pc}%<small>${fmt(v)}</small></em></div>`).join("")}
      <p class="mut small">Margin ${fmt(r[8])} votes (${mpts(r)} pts)</p></div>`; };
    $("#drawer").innerHTML = `<button class="x" id="closeD" aria-label="Close">×</button><p class="eyebrow">${kind === "ac" ? "Assembly constituency " + a.no + " · " + esc(a.d) : "Lok Sabha constituency"}</p><h2>${esc(a.n)}</h2>
      <div class="hist big">${YEARS.map((y) => `<span class="hchip" style="--pc:${col(a.y[y][0])}"><em>${y}</em>${logo(a.y[y][0])}<b>${a.y[y][0]}</b></span>`).join("")}</div>${[...YEARS].reverse().map(block).join("")}`;
    $("#drawer").classList.add("open"); $("#drawer").setAttribute("aria-hidden", "false"); $("#drawerBg").hidden = false;
    $("#closeD").onclick = () => { $("#drawer").classList.remove("open"); $("#drawerBg").hidden = true; };
  }

  // ---------- tabs ----------
  const TABS = ["live", "local", "overview", "predict", "past", "assembly", "loksabha", "seats", "full"];
  const rendered = {};
  const RENDER = { predict: () => window.renderPredictions?.(), past: renderOverview, assembly: renderAssembly, loksabha: renderLS, seats: () => { renderSeatsFilters(); renderSeats(); }, full: () => window.renderFullResults() };
  function show(tab, anchor) {
    if (!TABS.includes(tab)) tab = "live";
    document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== tab));
    document.documentElement.classList.remove("on-live"); // the Live tab is an ordinary page now (it used to hold a self-scrolling frame)
    document.querySelectorAll("[data-tab]").forEach((a) => a.setAttribute("aria-current", a.dataset.tab === tab ? "page" : "false"));
    if (!rendered[tab] && RENDER[tab]) { RENDER[tab](); rendered[tab] = true; }
    if (anchor) document.getElementById(anchor)?.scrollIntoView(); else window.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent("tabshow", { detail: tab }));
  }
  function route() {
    const h = location.hash.slice(1);
    if (h.startsWith("/")) return show(h.slice(1));
    const el = h ? document.getElementById(h) : null, panel = el ? el.closest("[data-panel]") : null;
    show(panel ? panel.dataset.panel : "live", panel ? h : null);
  }
  window.addEventListener("hashchange", route);
  // the results frame starts just under the dock
  const fitLive = () => { const f = document.getElementById("liveFrame"); if (f) f.style.setProperty("--live-top", Math.max(0, f.getBoundingClientRect().top + scrollY) + "px"); };
  addEventListener("resize", fitLive); document.addEventListener("tabshow", (e) => e.detail === "live" && setTimeout(fitLive, 50));

  // context band on the live overview: the last assembly verdict
  (() => {
    const t = tally(AC, "2024"), lt = tally(PC, "2024");
    const chips = (tt, n) => present(tt).map((p) => `<span class="mchip">${logo(p)}<b>${tt[p]}</b><small>${esc(name(p))}</small></span>`).join("");
    $("#prevMandate").innerHTML = `<div class="m-head"><p class="eyebrow">Context · the last verdict, June 2024</p><h3>Kutami won 164 of 175 assembly seats and 21 of 25 Lok Sabha seats</h3></div>
      <div class="m-rows"><div><span class="mut small">Assembly · 175</span><div class="m-chips">${chips(t)}</div></div><div><span class="mut small">Lok Sabha · 25</span><div class="m-chips">${chips(lt)}</div></div></div>
      <a class="btn ghost" href="#/past">See 2014, 2019 &amp; 2024 results →</a>`;
  })();

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-seg] button");
    if (b) { const k = b.parentElement.dataset.seg; if (k === "a") { state.aYear = b.dataset.y; renderAssembly(); } else { state.lYear = b.dataset.y; renderLS(); } return; }
    const ac = e.target.closest("[data-ac]"); if (ac) return openDetail("ac", ac.dataset.ac);
    const pc = e.target.closest("[data-pc]"); if (pc) return openDetail("pc", pc.dataset.pc);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.dataset?.ac) openDetail("ac", e.target.dataset.ac); });
  $("#cq").oninput = (e) => { state.q = e.target.value; renderSeats(); };
  $("#cDist").onchange = (e) => { state.dist = e.target.value; renderSeats(); };
  $("#cPat").onchange = (e) => { state.pat = e.target.value; renderSeats(); };
  route();
})();
