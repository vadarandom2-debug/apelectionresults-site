// Deeper insights for the Assembly and Lok Sabha tabs: headline findings, seat flows, votes vs seats,
// regions, reserved seats, bellwethers / fortresses and records. Recomputed for the selected year.
(() => {
  const C = window.GECharts, { esc, fmt, col, name, logo, tip, ORDER } = C;
  const AC = window.GE_AC, PC = window.GE_PC, VOTES = window.GE_VOTES;
  const YEARS = ["2014", "2019", "2024"];
  const RULING = { 2014: ["TDP", "BJP"], 2019: ["YSRCP"], 2024: ["TDP", "JSP", "BJP"] };
  const REGION_OF_DISTRICT = {
    Srikakulam: "North Andhra", Vizianagaram: "North Andhra", Visakhapatnam: "North Andhra",
    "East Godavari": "Godavari", "West Godavari": "Godavari", Krishna: "Krishna–Guntur", Guntur: "Krishna–Guntur",
    Prakasam: "South Coastal", Nellore: "South Coastal", Kurnool: "Rayalaseema", Kadapa: "Rayalaseema", Anantapur: "Rayalaseema", Chittoor: "Rayalaseema",
  };
  const PC_REGION = {
    "North Andhra": [1, 2, 3, 4, 5], Godavari: [6, 7, 8, 9, 10], "Krishna–Guntur": [11, 12, 13, 14, 15],
    "South Coastal": [16, 22], Rayalaseema: [17, 18, 19, 20, 21, 23, 24, 25],
  };
  const REGIONS = ["North Andhra", "Godavari", "Krishna–Guntur", "South Coastal", "Rayalaseema"];
  const TE_REGION = { "North Andhra": "ఉత్తరాంధ్ర", Godavari: "గోదావరి", "Krishna–Guntur": "కృష్ణా–గుంటూరు", "South Coastal": "దక్షిణ కోస్తా", Rayalaseema: "రాయలసీమ" };

  const tally = (rows, y) => { const t = {}; rows.forEach((r) => { const p = r.y[y][0]; t[p] = (t[p] || 0) + 1; }); return t; };
  const regionOf = (house, r) => (house === "A" ? REGION_OF_DISTRICT[r.d] : REGIONS.find((g) => PC_REGION[g].includes(r.no)));
  const reserved = (r) => (/\(SC\)/.test(r.n) ? "SC" : /\(ST\)/.test(r.n) ? "ST" : "General");
  const present = (t) => ORDER.filter((p) => t[p]);
  const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
  const bar = (counts, total) => `<div class="ins-bar">${ORDER.filter((p) => counts[p]).map((p) => `<i style="width:${(counts[p] / total) * 100}%;background:${col(p)}" ${tip(`${esc(name(p))}<span> ${counts[p]}</span>`)}></i>`).join("")}</div>`;
  const chipList = (rows, y, max = 18) => rows.slice(0, max).map((r) => `<span class="ins-chip" style="--pc:${col(r.y[y][0])}" data-${r.d !== undefined ? "ac" : "pc"}="${r.no}">${esc(r.n.replace(/ \((SC|ST)\)/, ""))}</span>`).join("") + (rows.length > max ? `<span class="ins-more">+${rows.length - max} more</span>` : "");

  function headline(house, rows, y) {
    const prefix = house === "A" ? "A" : "L", total = rows.length, t = tally(rows, y);
    const prev = YEARS[YEARS.indexOf(y) - 1], pt = prev ? tally(rows, prev) : null, v = VOTES[prefix + y];
    const win = Object.entries(t).sort((a, b) => b[1] - a[1])[0][0];
    const cards = [];
    cards.push({ big: `${pct(t[win], total)}%`, txt: `of seats for ${name(win)} on ${v[win].toFixed(1)}% of the vote`, p: win });
    if (pt) {
      const flips = rows.filter((r) => r.y[prev][0] !== r.y[y][0]).length;
      cards.push({ big: flips, txt: `of ${total} seats changed party since ${prev} (${pct(flips, total)}%)`, p: win });
      const swing = ORDER.map((p) => [p, (t[p] || 0) - (pt[p] || 0)]).sort((a, b) => a[1] - b[1]);
      const loser = swing[0]; cards.push({ big: loser[1], txt: `seats for ${name(loser[0])} compared with ${prev}`, p: loser[0], neg: true });
    }
    const maj = rows.filter((r) => r.y[y][2] > 50).length;
    cards.push({ big: maj, txt: `winners took more than half of all votes cast in their seat`, p: win });
    const close = rows.filter((r) => r.y[y][8] < (house === "A" ? 5000 : 50000)).length;
    cards.push({ big: close, txt: `seats won by fewer than ${house === "A" ? "5,000" : "50,000"} votes`, p: "OTH" });
    const avg = rows.reduce((s, r) => s + r.y[y][2], 0) / total;
    cards.push({ big: `${avg.toFixed(1)}%`, txt: `average vote share of a winning candidate`, p: win });
    return `<div class="ins-cards">${cards.slice(0, 4).map((c) => `<div class="ins-card" style="--pc:${col(c.p)}"><b class="num ${c.neg ? "dn" : ""}">${c.big}</b><span>${esc(c.txt)}</span></div>`).join("")}</div>`;
  }

  function flows(rows, y) {
    const prev = YEARS[YEARS.indexOf(y) - 1];
    if (!prev) return `<p class="mut small">2014 is the first election for the present-day state, so there's no earlier result to compare with.</p>`;
    const from = present(tally(rows, prev)), to = present(tally(rows, y)), m = {};
    rows.forEach((r) => { const k = r.y[prev][0] + ">" + r.y[y][0]; m[k] = (m[k] || 0) + 1; });
    const mx = Math.max(...Object.values(m));
    const kept = rows.filter((r) => r.y[prev][0] === r.y[y][0]).length;
    const head = `<tr><th class="tl">${prev} ↓ / ${y} →</th>${to.map((p) => `<th>${logo(p)}</th>`).join("")}</tr>`;
    const body = from.map((a) => `<tr><td class="tl"><span class="pty">${logo(a)}${esc(name(a))}</span></td>${to.map((b) => { const n = m[a + ">" + b] || 0; return `<td class="num ${a === b ? "same" : ""}" style="background:${n ? `color-mix(in srgb, ${col(b)} ${12 + (n / mx) * 60}%, #fff)` : "#fff"}" ${n ? tip(`<b>${n} seats</b><div class="mut">${esc(name(a))} in ${prev} → ${esc(name(b))} in ${y}</div>`) : ""}>${n || "·"}</td>`; }).join("")}</tr>`).join("");
    return `<div class="tbl-wrap"><table class="flowmx">${head}${body}</table></div><p class="mut small">Rows: who won in ${prev}. Columns: who won in ${y}. Diagonal cells (outlined) are seats the same party kept: <b>${kept}</b> of ${rows.length}.</p>`;
  }

  function votesSeats(house, rows, y) {
    const v = VOTES[(house === "A" ? "A" : "L") + y], t = tally(rows, y), total = rows.length;
    const ps = ORDER.filter((p) => (v[p] || 0) >= 0.5 || t[p]).sort((a, b) => (v[b] || 0) - (v[a] || 0));
    return `<div class="vs">${ps.map((p) => { const vs = v[p] || 0, ss = pct(t[p] || 0, total), d = ss - vs; return `<div class="vs-row"><span class="pty">${logo(p)}${esc(name(p))}</span>
      <div class="vs-bars"><div class="vs-b"><i style="width:${vs}%;background:${col(p)};opacity:.45"></i><em>${vs.toFixed(1)}% votes</em></div><div class="vs-b"><i style="width:${ss}%;background:${col(p)}"></i><em>${ss}% seats</em></div></div>
      <b class="num ${d >= 0 ? "up" : "dn"}">${d >= 0 ? "+" : ""}${d.toFixed(1)}</b></div>`; }).join("")}</div>
      <p class="mut small">The number on the right is seat share minus vote share, in percentage points. First-past-the-post rewards the leader and punishes the runner-up.</p>`;
  }

  function regions(house, rows, y) {
    return `<div class="reg-grid">${REGIONS.map((g) => {
      const rs = rows.filter((r) => regionOf(house, r) === g); if (!rs.length) return "";
      const t = tally(rs, y), top = Object.entries(t).sort((a, b) => b[1] - a[1])[0];
      const prev = YEARS[YEARS.indexOf(y) - 1], pt = prev ? tally(rs, prev) : null;
      return `<div class="reg"><div class="reg-h"><b>${g}</b><span lang="te">${TE_REGION[g]}</span></div><span class="mut small">${rs.length} seats</span>${bar(t, rs.length)}
        <p class="reg-top">${logo(top[0])}<span><b>${esc(name(top[0]))}</b> ${top[1]}/${rs.length}${pt ? ` <em class="${(t[top[0]] || 0) - (pt[top[0]] || 0) >= 0 ? "up" : "dn"}">(${(t[top[0]] || 0) - (pt[top[0]] || 0) >= 0 ? "+" : ""}${(t[top[0]] || 0) - (pt[top[0]] || 0)} vs ${prev})</em>` : ""}</span></p></div>`;
    }).join("")}</div>`;
  }

  function reservedTbl(rows, y) {
    const cats = ["SC", "ST", "General"], all = present(tally(rows, y));
    return `<div class="tbl-wrap"><table class="bands"><tr><th>Seats</th>${all.map((p) => `<th>${logo(p)}</th>`).join("")}<th>Total</th></tr>${cats.map((c) => { const rs = rows.filter((r) => reserved(r) === c); if (!rs.length) return ""; const t = tally(rs, y); return `<tr><td>${c === "General" ? "General" : c + "-reserved"}</td>${all.map((p) => `<td class="num" style="background:color-mix(in srgb, ${col(p)} ${t[p] ? 10 + (t[p] / rs.length) * 50 : 0}%, #fff)">${t[p] || "·"}</td>`).join("")}<td class="num"><b>${rs.length}</b></td></tr>`; }).join("")}</table></div>`;
  }

  function loyalty(rows, y) {
    const upto = YEARS.slice(0, YEARS.indexOf(y) + 1);
    if (upto.length < 2) return `<p class="mut small">Pick 2019 or 2024 to see which seats always back the winning side.</p>`;
    const bell = rows.filter((r) => upto.every((yy) => RULING[yy].includes(r.y[yy][0])));
    const fort = rows.filter((r) => new Set(upto.map((yy) => r.y[yy][0])).size === 1);
    const fb = {}; fort.forEach((r) => (fb[r.y[y][0]] = (fb[r.y[y][0]] || 0) + 1));
    return `<div class="loyal"><div><h4>Bellwethers · ${bell.length}</h4><p class="mut small">Voted for the side that formed the government in every election ${upto.join(", ")}.</p><div class="chips-wrap">${chipList(bell, y)}</div></div>
      <div><h4>Fortresses · ${fort.length}</h4><p class="mut small">Same party every time (${Object.entries(fb).map(([p, n]) => `${p} ${n}`).join(", ") || "none"}). Everything else has switched at least once.</p><div class="chips-wrap">${chipList(fort, y)}</div></div></div>`;
  }

  function records(house, rows, y) {
    const li = (r, val) => `<li data-${house === "A" ? "ac" : "pc"}="${r.no}">${logo(r.y[y][0])}<span><b>${esc(r.n)}</b><small>${esc(r.y[y][1])} (${r.y[y][0]})</small></span><em class="num">${val}</em></li>`;
    const by = (f) => [...rows].sort((a, b) => f(b) - f(a));
    const cols = [
      ["Most votes for a winner", by((r) => r.y[y][3]).slice(0, 5).map((r) => li(r, fmt(r.y[y][3])))],
      ["Highest vote share", by((r) => r.y[y][2]).slice(0, 5).map((r) => li(r, r.y[y][2] + "%"))],
      ["Lowest winning share", by((r) => -r.y[y][2]).slice(0, 5).map((r) => li(r, r.y[y][2] + "%"))],
    ];
    if (house === "L") {
      const tt = {}; rows.forEach((r) => { const p = r.y[y][0]; (tt[p] = tt[p] || []).push(r.t[y]); });
      cols.push(["Average turnout where each party won", Object.entries(tt).sort((a, b) => b[1].length - a[1].length).map(([p, a]) => `<li>${logo(p)}<span><b>${esc(name(p))}</b><small>${a.length} seat${a.length > 1 ? "s" : ""}</small></span><em class="num">${(a.reduce((s, x) => s + x, 0) / a.length).toFixed(1)}%</em></li>`)]);
    }
    return `<div class="rec-grid">${cols.map(([t, l]) => `<div><h4>${t}</h4><ol class="rank">${l.join("")}</ol></div>`).join("")}</div>`;
  }

  function render(house, y) {
    const rows = house === "A" ? AC : PC, el = document.getElementById(house === "A" ? "asInsights" : "lsInsights"); if (!el) return;
    el.innerHTML = `${headline(house, rows, y)}
      <div class="g2"><div class="card"><h3>Where the seats moved</h3>${flows(rows, y)}</div><div class="card"><h3>Votes vs seats</h3>${votesSeats(house, rows, y)}</div></div>
      <div class="card wide"><h3>Region by region · ${y}</h3>${regions(house, rows, y)}</div>
      <div class="g2"><div class="card"><h3>Reserved seats</h3><p class="mut small">SC- and ST-reserved constituencies compared with general seats.</p>${reservedTbl(rows, y)}</div><div class="card"><h3>Bellwethers and fortresses</h3>${loyalty(rows, y)}</div></div>
      <div class="card wide"><h3>Records · ${y}</h3>${records(house, rows, y)}</div>`;
  }
  window.renderInsights = render;
})();
