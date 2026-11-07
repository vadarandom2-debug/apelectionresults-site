// "Full Results" tab: every constituency's winner, runner-up and margin, plus house majority and margin bands.
(() => {
  const C = window.GECharts, { esc, fmt, col, name, logo, ORDER } = C;
  const AC = window.GE_AC, PC = window.GE_PC;
  const YEARS = ["2014", "2019", "2024"];
  const ALLY = { 2014: { name: "NDA", parties: ["TDP", "BJP"] }, 2024: { name: "Kutami (NDA)", parties: ["TDP", "JSP", "BJP"] } };
  const GOVT = { 2014: "TDP-led NDA formed the government", 2019: "YSRCP formed the government on its own", 2024: "TDP-led Kutami formed the government" };
  const BANDS = [[0, 1000, "< 1,000"], [1000, 5000, "1k – 5k"], [5000, 10000, "5k – 10k"], [10000, 25000, "10k – 25k"], [25000, 50000, "25k – 50k"], [50000, 1e12, "50k +"]];
  const st = { house: "A", year: "2024", party: "", dist: "", q: "", sort: "no", dir: 1 };
  const $ = (s) => document.querySelector(s);

  const rowsFor = () => (st.house === "A" ? AC : PC).map((c) => {
    const r = c.y[st.year];
    return { no: c.no, n: c.n, d: c.d || "", t: c.t ? c.t[st.year] : null, wp: r[0], w: r[1], wpc: r[2], wv: r[3], rp: r[4], r: r[5], rpc: r[6], rv: r[7], m: r[8], mp: +(r[2] - r[6]).toFixed(2) };
  });

  function majority(rows) {
    const total = rows.length, need = Math.floor(total / 2) + 1, t = {};
    rows.forEach((r) => (t[r.wp] = (t[r.wp] || 0) + 1));
    const ps = ORDER.filter((p) => t[p]).sort((a, b) => t[b] - t[a]);
    const a = ALLY[st.year], allySeats = a ? a.parties.reduce((s, p) => s + (t[p] || 0), 0) : 0;
    const bar = (n, p) => `<div class="mj-bar"><i style="width:${(n / total) * 100}%;background:${p === "NDA" ? "var(--NDA)" : col(p)}"></i><b style="left:${(need / total) * 100}%"></b></div>`;
    const word = st.house === "A" ? "majority" : "half";
    const diff = (n) => (n >= need ? `<span class="up">+${n - need} over ${word}</span>` : `<span class="dn">${need - n} short of ${word}</span>`);
    const allyCard = a ? `<div class="mj ally"><div class="mj-h"><span class="plogo-trio">${a.parties.map((p) => logo(p)).join("")}</span><div><b>${a.name}</b><small>${a.parties.map((p) => `${p} ${t[p] || 0}`).join(" + ")}</small></div><em class="num">${allySeats}</em></div>${bar(allySeats, "NDA")}<p>${diff(allySeats)}</p></div>` : "";
    const head = st.house === "A"
      ? `<h3>${st.year} Assembly: ${GOVT[st.year]}</h3><p class="mut small">${total} seats · majority mark <b>${need}</b> · the line on each bar marks it.</p>`
      : `<h3>${st.year} Lok Sabha: ${esc(name(ps[0]))} won ${t[ps[0]]} of Andhra Pradesh's ${total} seats</h3><p class="mut small">The line marks <b>${need}</b>, half of AP's seats. The Lok Sabha majority itself is decided nationally.</p>`;
    return `<div class="mj-top">${head}</div>
      <div class="mj-grid">${allyCard}${ps.map((p) => `<div class="mj"><div class="mj-h">${logo(p)}<div><b>${esc(name(p))}</b><small>${((t[p] / total) * 100).toFixed(1)}% of seats</small></div><em class="num">${t[p]}</em></div>${bar(t[p], p)}<p>${a && a.parties.includes(p) && t[p] < need ? `<span class="mut">${a.name} partner</span>` : diff(t[p])}</p></div>`).join("")}</div>`;
  }

  function bands(rows) {
    const ps = ORDER.filter((p) => rows.some((r) => r.wp === p));
    const cnt = (p, [lo, hi]) => rows.filter((r) => r.wp === p && r.m >= lo && r.m < hi).length;
    const mx = Math.max(...ps.flatMap((p) => BANDS.map((b) => cnt(p, b))));
    return `<div class="tbl-wrap"><table class="bands"><tr><th>Winner</th>${BANDS.map((b) => `<th>${b[2]}</th>`).join("")}<th>Total</th><th>Median margin</th></tr>${ps.map((p) => {
      const ms = rows.filter((r) => r.wp === p).map((r) => r.m).sort((a, b) => a - b), med = ms[Math.floor((ms.length - 1) / 2)];
      return `<tr><td><span class="pty">${logo(p)}${p}</span></td>${BANDS.map((b) => { const n = cnt(p, b); return `<td class="num" style="background:color-mix(in srgb, ${col(p)} ${n ? 8 + (n / mx) * 50 : 0}%, #fff)">${n || "·"}</td>`; }).join("")}<td class="num"><b>${ms.length}</b></td><td class="num">${fmt(med)}</td></tr>`;
    }).join("")}</table></div><p class="mut small">Number of seats each party won, grouped by winning margin in votes.</p>`;
  }

  const COLS = [
    ["no", "#"], ["n", "Constituency"], ["d", "District", "A"], ["t", "Turnout", "L"], ["w", "Winner"], ["wv", "Votes"], ["wpc", "%"],
    ["r", "Runner-up"], ["rv", "Votes"], ["rpc", "%"], ["m", "Margin"], ["mp", "Margin pts"],
  ];
  function table(rows) {
    const q = st.q.trim().toLowerCase();
    let list = rows.filter((r) => (!st.party || r.wp === st.party || r.rp === st.party) && (!st.dist || r.d === st.dist) && (!q || [r.n, r.d, r.w, r.r].join(" ").toLowerCase().includes(q)));
    list.sort((a, b) => { const x = a[st.sort], y = b[st.sort]; return (typeof x === "string" ? x.localeCompare(y) : x - y) * st.dir; });
    const cols = COLS.filter((c) => !c[2] || c[2] === st.house);
    const head = cols.map(([k, l]) => `<th data-sort="${k}" class="${st.sort === k ? "on" : ""} ${["n", "d", "w", "r"].includes(k) ? "tl" : ""}">${l}${st.sort === k ? (st.dir > 0 ? " ↑" : " ↓") : ""}</th>`).join("");
    const body = list.map((r) => `<tr data-${st.house === "A" ? "ac" : "pc"}="${r.no}">${cols.map(([k]) => {
      if (k === "w" || k === "r") { const p = k === "w" ? r.wp : r.rp; return `<td class="tl cand-cell"><span class="pdot" style="background:${col(p)}"></span>${esc(r[k])} <small>${p}</small></td>`; }
      if (k === "n") return `<td class="tl"><b>${esc(r.n)}</b></td>`;
      if (k === "d") return `<td class="tl mut">${esc(r.d)}</td>`;
      if (k === "m") return `<td class="num"><b>${fmt(r.m)}</b></td>`;
      if (k === "wv" || k === "rv") return `<td class="num">${fmt(r[k])}</td>`;
      if (k === "t") return `<td class="num">${r.t}%</td>`;
      return `<td class="num">${r[k]}</td>`;
    }).join("")}</tr>`).join("");
    $("#frCount").textContent = `${list.length} of ${rows.length} constituencies · click a row for details · click a column to sort`;
    return `<div class="tbl-wrap full"><table class="full-tbl"><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${cols.length}" class="empty">No match</td></tr>`}</tbody></table></div>`;
  }

  function csv(rows) {
    const h = ["No", "Constituency", "District", "Turnout %", "Winner", "Winner party", "Winner votes", "Winner %", "Runner-up", "Runner-up party", "Runner-up votes", "Runner-up %", "Margin votes", "Margin pts"];
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [h.map(q).join(",")].concat(rows.map((r) => [r.no, r.n, r.d, r.t ?? "", r.w, r.wp, r.wv, r.wpc, r.r, r.rp, r.rv, r.rpc, r.m, r.mp].map(q).join(",")));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    a.download = `ap-${st.house === "A" ? "assembly" : "loksabha"}-${st.year}-results.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  function render() {
    const rows = rowsFor();
    $("#frHouse").innerHTML = [["A", "Assembly · 175"], ["L", "Lok Sabha · 25"]].map(([k, l]) => `<button role="tab" aria-selected="${st.house === k}" data-house="${k}">${l}</button>`).join("");
    $("#frYear").innerHTML = YEARS.map((y) => `<button role="tab" aria-selected="${st.year === y}" data-fy="${y}">${y}</button>`).join("");
    $("#frParty").innerHTML = `<option value="">All parties</option>` + ORDER.filter((p) => rows.some((r) => r.wp === p || r.rp === p)).map((p) => `<option value="${p}" ${st.party === p ? "selected" : ""}>${esc(name(p))} (won or runner-up)</option>`).join("");
    $("#frDist").hidden = st.house !== "A";
    $("#frDist").innerHTML = `<option value="">All districts</option>` + [...new Set(AC.map((a) => a.d))].map((d) => `<option ${st.dist === d ? "selected" : ""}>${esc(d)}</option>`).join("");
    $("#frMajority").innerHTML = majority(rows);
    $("#frBands").innerHTML = bands(rows);
    $("#frTable").innerHTML = table(rows);
  }
  const renderTable = () => ($("#frTable").innerHTML = table(rowsFor()));

  document.addEventListener("click", (e) => {
    const h = e.target.closest("[data-house]"); if (h) { st.house = h.dataset.house; st.dist = ""; if (st.sort === "d" || st.sort === "t") st.sort = "no"; return render(); }
    const y = e.target.closest("[data-fy]"); if (y) { st.year = y.dataset.fy; return render(); }
    const s = e.target.closest("[data-sort]"); if (s) { const k = s.dataset.sort; st.dir = st.sort === k ? -st.dir : k === "m" || k === "mp" || k.endsWith("v") || k.endsWith("pc") ? -1 : 1; st.sort = k; return renderTable(); }
    if (e.target.closest("#frCsv")) csv(rowsFor());
  });
  $("#frQ").oninput = (e) => { st.q = e.target.value; renderTable(); };
  $("#frParty").onchange = (e) => { st.party = e.target.value; renderTable(); };
  $("#frDist").onchange = (e) => { st.dist = e.target.value; renderTable(); };
  window.renderFullResults = render;
})();
