// Polling turnout section: statewide curve plus a ranked list per reading time.
(() => {
  const T = window.AP_TURNOUT, root = document.getElementById("turnout");
  if (!T || !root) return;
  const TE = window.AP_TE || {}, B = Object.fromEntries((window.AP_BODIES || []).map((b) => [b.id, b]));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const NOPOLL = ["piduguralla", "gurazala", "dachepalli", "darsi", "allagadda", "proddatur", "rayachoti", "kamalapuram"];
  const TABS = [["close", "After polls closed", "పోలింగ్ ముగిశాక"], ["pm3", "3 PM reading", "మధ్యాహ్నం 3"], ["am11", "11 AM reading", "ఉదయం 11"]];
  const st = { tab: "close", corp: false };
  const fmt = (n) => n.toFixed(2);

  function curve() {
    const W = 520, H = 230, L = 34, R = 18, TOP = 26, BOT = 196, MAX = 60, pts = T.state;
    const x = (i) => L + (i * (W - L - R)) / (pts.length - 1), y = (v) => BOT - (v / MAX) * (BOT - TOP);
    const line = pts.map(([, v], i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
    const grid = [0, 20, 40, 60].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}%</text>`).join("");
    return `<svg class="to-curve" viewBox="0 0 ${W} ${H}" role="img" aria-label="Statewide turnout: ${pts.map(([t, v]) => `${v}% at ${t}`).join(", ")}">
      <defs><linearGradient id="toFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".28"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
      <g class="to-grid">${grid}</g>
      <path d="${line} L${x(pts.length - 1)} ${BOT} L${x(0)} ${BOT} Z" fill="url(#toFill)"/>
      <path class="to-line" pathLength="1" d="${line}"/>
      ${pts.map(([t, v], i) => `<circle cx="${x(i)}" cy="${y(v)}" r="5"/><text class="to-v" x="${x(i)}" y="${y(v) - 12}" text-anchor="${i === pts.length - 1 ? "end" : "middle"}">${v}%</text><text class="to-t" x="${x(i)}" y="${H - 8}" text-anchor="${i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"}">${t}</text>`).join("")}
    </svg>`;
  }

  function rows() {
    const list = T[st.tab].filter(([id]) => B[id] && (!st.corp || B[id].type === "C")).sort((a, b) => b[1] - a[1]);
    if (!list.length) return `<p class="muted small">No corporation readings at this time.</p>`;
    return `<ol class="to-list">${list.map(([id, p, s], i) => {
      const b = B[id], src = T.sources[s] || [], te = (TE.bodies || {})[id] || "";
      return `<li class="${b.type === "C" ? "corp" : ""}"><a href="#body/${id}"><span class="to-rank num">${i + 1}</span><span class="to-name"><b>${esc(b.name)}</b>${te ? ` <span lang="te">${esc(te)}</span>` : ""}${b.type === "C" ? `<em>Corporation</em>` : ""}</span><span class="to-bar"><i style="--w:${p}%"></i></span><span class="to-pct num">${fmt(p)}%</span></a>${src[1] ? `<a class="to-src" href="${src[1]}" target="_blank" rel="noopener">${esc(src[0])}</a>` : ""}</li>`;
    }).join("")}</ol>`;
  }

  function render() {
    const c = [...T.close].sort((a, b) => b[1] - a[1]), hi = c[0], lo = c[c.length - 1];
    const seen = new Set([...T.close, ...T.pm3, ...T.am11].map((r) => r[0]));
    const waiting = Object.values(B).filter((b) => !seen.has(b.id) && !NOPOLL.includes(b.id));
    root.innerHTML = `<div class="wrap">
      <div class="sec-head"><div><p class="eyebrow">Polling closed · 1 Nov · counting 3 Nov</p><h2>Polling percentage <span class="te-sub" lang="te">పోలింగ్ శాతం</span></h2></div>
        <p class="muted small max40">Statewide final turnout was 60.96% (SEC). Town figures are the SEC's final numbers where published, otherwise collectors' closing reports.</p></div>
      <div class="to-top">
        <div class="card"><h3>Statewide through the day</h3><p class="muted small">${esc(T.stateVoters)}. </p>${curve()}</div>
        <div class="to-stats">
          <div class="card"><span class="to-k">Highest after close</span><b class="num">${fmt(hi[1])}%</b><span>${esc(B[hi[0]].name)}</span></div>
          <div class="card"><span class="to-k">Lowest after close</span><b class="num">${fmt(lo[1])}%</b><span>${esc(B[lo[0]].name)}</span></div>
          <div class="card"><span class="to-k">Towns with a closing figure</span><b class="num">${c.length}</b><span>of 92 that voted</span></div>
          <div class="card to-rp"><span class="to-k">Re-polling</span><span>${esc(T.repoll)}</span><span lang="te">${esc(T.repollTe)}</span></div>
        </div>
      </div>
      <div class="card to-card">
        <div class="to-ctl"><div class="chips" role="group" aria-label="Reading time">${TABS.map(([k, en, te]) => `<button class="chip ${st.tab === k ? "on" : ""}" type="button" data-to="${k}">${en} · ${T[k].length} <span lang="te">${te}</span></button>`).join("")}</div>
          <label class="to-corp"><input type="checkbox" id="toCorp" ${st.corp ? "checked" : ""}/> Corporations only</label></div>
        <p class="muted small">${st.tab === "close" ? "Final figures from the SEC where published (The South First / Eenadu, 2 Nov); the rest from collectors' closing reports." : `Voting went on after this reading, so these will be lower than the closing figures. Each town appears here only until a closing figure is reported.`}</p>
        <div id="toRows">${rows()}</div>
      </div>
      <p class="muted small to-foot"><b>No figure yet (${waiting.length}):</b> ${waiting.map((b) => esc(b.name)).join(", ")}.<br/><b>No polling, all posts unopposed (8):</b> ${NOPOLL.map((id) => esc(B[id]?.name || id)).join(", ")}.</p>
    </div>`;
  }
  root.addEventListener("click", (e) => { const b = e.target.closest("[data-to]"); if (b) { st.tab = b.dataset.to; render(); } });
  root.addEventListener("change", (e) => { if (e.target.id === "toCorp") { st.corp = e.target.checked; render(); } });
  render();
})();
