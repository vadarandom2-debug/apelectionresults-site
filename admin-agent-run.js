// Admin → AI agent → "Fetch results now": a live mission-control view while the agent reads every results source
// (SEC + newspapers), checks each quote against the page and cross-checks the sites.
// Every finding still waits in the approval list below; nothing is published from here.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const BYN = Object.fromEntries((window.AP_BODIES || []).map((b) => [b.id, b.name]));
  const COL = { TDP: "#d4a000", JSP: "#c4122f", BJP: "#f28c00", NDA: "#d4a000", YSRCP: "#1d5fc4", INC: "#16936a", LEFT: "#6a3d9a", OTH: "#8a93a6" };
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let M = null; // the current mission

  const invoke = async (body) => {
    const { data, error } = await window.SUPA.client.functions.invoke("capture-results", { body });
    if (error) {
      let msg = error.message;
      try { const j = await error.context?.json?.(); if (j?.error) msg = j.error; } catch {}
      throw new Error(msg);
    }
    return data;
  };

  // ---------- view ----------
  const hexPts = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(" ");
  function core(sources) {
    const n = sources.length, R = 112, C = 150;
    const nodes = sources.map((s, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return { ...s, x: C + R * Math.cos(a), y: C + R * Math.sin(a) }; });
    return `<svg viewBox="0 0 300 300" class="mc-core" aria-hidden="true">
      <defs><radialGradient id="mcGlow"><stop offset="0" stop-color="#F5C400" stop-opacity=".55"/><stop offset="1" stop-color="#F5C400" stop-opacity="0"/></radialGradient></defs>
      <circle cx="150" cy="150" r="70" fill="url(#mcGlow)" class="mc-breathe"/>
      <circle cx="150" cy="150" r="${R}" class="mc-orbit"/>
      <g class="mc-ring r1"><circle cx="150" cy="150" r="54" /></g><g class="mc-ring r2"><circle cx="150" cy="150" r="40" /></g>
      <g class="mc-sweep"><path d="M150 150 L150 38 A112 112 0 0 1 229 71 Z" /></g>
      ${nodes.map((s, i) => `<line x1="${s.x.toFixed(1)}" y1="${s.y.toFixed(1)}" x2="150" y2="150" class="mc-beam" data-beam="${i}"/>`).join("")}
      <polygon points="${hexPts(150, 150, 26)}" class="mc-hex"/><polygon points="${hexPts(150, 150, 13)}" class="mc-hex-in"/>
      <g class="mc-packets"></g>
      ${nodes.map((s, i) => `<g class="mc-node k-${s.kind}" data-node="${i}" data-match="${esc(s.match)}"><circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="9"/><text x="${s.x.toFixed(1)}" y="${(s.y + (s.y > 150 ? 22 : -14)).toFixed(1)}">${esc(s.label)}</text></g>`).join("")}
    </svg>`;
  }
  function comb(bodies) {
    const cols = Math.min(14, Math.max(5, Math.ceil(Math.sqrt(bodies.length * 1.6)))), r = 13, w = r * Math.sqrt(3), h = r * 1.5;
    const rows = Math.ceil(bodies.length / cols);
    const W = cols * w + w / 2 + 4, H = rows * h + r + 6;
    return `<svg viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" class="mc-comb" style="width:min(100%, ${(W * 1.7).toFixed(0)}px)">${bodies.map((b, i) => {
      const row = Math.floor(i / cols), col = i % cols, cx = 2 + w / 2 + col * w + (row % 2 ? w / 2 : 0), cy = 3 + r + row * h;
      return `<g data-hb="${b.id}" class="hb queued"><polygon points="${hexPts(cx, cy, r - 1)}"/><title>${esc(b.name)}</title></g>`;
    }).join("")}</svg>`;
  }
  function shell(sources, bodies) {
    const nodes = sources.slice(0, 10).map((s) => ({ label: s.name.replace(/^SEC Andhra Pradesh$/, "SEC AP").replace(/^The /, ""), match: s.name, kind: s.kind }));
    $("#agentMission").innerHTML = `<div class="mc" id="mc">
      <div class="mc-top"><div><p class="mc-eye"><span class="mc-live"></span> Agent at work</p><h3 id="mcTitle">Fetching results for apelectionresults.com</h3></div>
        <div class="mc-clock"><b id="mcTime">00:00</b></div></div>
      <div class="mc-grid">
        <div class="mc-stage">${core(nodes.length ? nodes : [{ label: "No sources", match: "*", kind: "web" }])}<p class="mc-phase" id="mcPhase">Reading sources…</p></div>
        <div class="mc-right">
          <div class="mc-stats">
            <div><b data-ct="read">0</b><span>of ${sources.length} sources read</span></div>
            <div><b data-ct="bodies">0</b><span>bodies with new numbers</span></div>
            <div><b data-ct="high">0</b><span>confirmed by 2+ sites</span></div>
            <div><b data-ct="failed">0</b><span>sources unreachable</span></div>
            <div><b data-ct="dropped">0</b><span>claims thrown away</span></div>
          </div>
          <div class="mc-bar"><i id="mcBar"></i></div>
          <div class="mc-combwrap"><p class="mc-lbl">${bodies.length} urban bodies · <span class="lg s"></span>checking <span class="lg f"></span>new numbers (leading party) <span class="lg n"></span>nothing new</p>${comb(bodies)}</div>
        </div>
      </div>
      <div class="mc-term" id="mcTerm" role="log" aria-live="polite"></div>
      <div class="mc-foot" id="mcFoot"></div>
    </div>`;
  }

  // ---------- live effects ----------
  const t0 = () => M && M.t0;
  const stamp = () => { const s = Math.floor((Date.now() - t0()) / 1000); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
  function log(txt, cls = "") {
    const el = $("#mcTerm"); if (!el) return;
    const line = document.createElement("div"); line.className = "ln " + cls;
    line.innerHTML = `<span class="ts">${stamp()}</span><span class="tx"></span>`;
    el.appendChild(line); el.scrollTop = el.scrollHeight;
    const tx = line.lastChild;
    if (calm) { tx.textContent = txt; return; }
    let i = 0; const step = () => { i = Math.min(txt.length, i + 3); tx.textContent = txt.slice(0, i); el.scrollTop = el.scrollHeight; if (i < txt.length) requestAnimationFrame(step); }; step();
  }
  function bump(k, by = 1) {
    const el = $(`[data-ct="${k}"]`); if (!el) return;
    M.counts[k] = (M.counts[k] || 0) + by;
    const from = +el.textContent, to = M.counts[k]; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
    if (calm) { el.textContent = to; return; }
    const s = performance.now(); const f = (t) => { if (M.counts[k] !== to) return; const p = Math.min(1, (t - s) / 500); el.textContent = Math.round(from + (to - from) * p); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f);
  }
  // a packet flies from a source node into the core
  function packet(match, color = "#F5C400") {
    if (calm) return;
    const svg = $(".mc-core"); if (!svg) return;
    const nodes = [...svg.querySelectorAll(".mc-node")];
    const node = nodes.find((n) => match && n.dataset.match !== "*" && match.toLowerCase().includes(n.dataset.match.toLowerCase().split(" ")[0])) || nodes[0];
    const c = node.querySelector("circle"), x = +c.getAttribute("cx"), y = +c.getAttribute("cy");
    node.classList.remove("hit"); void node.getBoundingClientRect(); node.classList.add("hit");
    const beam = svg.querySelector(`[data-beam="${node.dataset.node}"]`); beam?.classList.add("on"); setTimeout(() => beam?.classList.remove("on"), 900);
    const p = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    p.setAttribute("r", "3.5"); p.setAttribute("fill", color); p.setAttribute("cx", x); p.setAttribute("cy", y);
    $(".mc-packets", svg).appendChild(p);
    p.animate([{ cx: x, cy: y, opacity: 1 }, { cx: 150, cy: 150, opacity: 0.2 }].map((k) => ({ transform: `translate(${k.cx - x}px, ${k.cy - y}px)`, opacity: k.opacity })), { duration: 900, easing: "cubic-bezier(.5,0,.3,1)" }).onfinish = () => { p.remove(); svg.querySelector(".mc-hex")?.animate([{ transform: "scale(1.18)" }, { transform: "scale(1)" }], { duration: 380 }); };
  }
  const setHex = (id, cls, color) => { const g = $(`[data-hb="${id}"]`); if (!g) return; g.setAttribute("class", "hb " + cls); if (color) g.querySelector("polygon").style.fill = color; };
  function idleChatter() { // keeps the web-search node pulsing while batches are out
    if (!M || M.done) return;
    if (M.inflight) packet("*", "#9ec5ff");
    M.chat = setTimeout(idleChatter, 700 + Math.random() * 900);
  }

  // ---------- the run ----------
  async function start() {
    if (M && !M.done) return;
    const S = window.SUPA;
    if (!S?.admin) return $("#loginDlg")?.showModal();
    const { data: sources } = await S.client.from("agent_sources").select("name,kind").eq("enabled", true).order("kind").order("name");
    const bodies = (window.AP_BODIES || []).slice().sort((a, b) => a.name.localeCompare(b.name));
    M = { t0: Date.now(), inflight: 1, done: false, counts: {} };
    shell(sources || [], bodies);
    bodies.forEach((b) => setHex(b.id, "scan"));
    M.tick = setInterval(() => { const el = $("#mcTime"); if (el) el.textContent = stamp(); }, 1000);
    $("#mcBar").style.width = "8%";
    M.creep = setInterval(() => { const b = $("#mcBar"); if (b) b.style.width = Math.min(90, parseFloat(b.style.width) + 2) + "%"; }, 1500);
    idleChatter();
    window.agentPause?.(true);
    log(`Agent online · ${sources?.length || 0} sources · Sakshi blocked`);
    log("📊 Reading every source page and asking Claude for ward and Mayor / Chairperson numbers, each with an exact quote");
    try {
      const r = await invoke({ task: "results" });
      for (const l of r.log || []) {
        const bad = String(l.status).startsWith("error");
        packet(l.source, bad ? "#ff8a8a" : "#7be0a5"); bump(bad ? "failed" : "read");
        log(`  ${l.source}: ${l.status}${l.found ? ` · ${l.found} found` : ""}`, bad ? "warn" : "dim");
      }
      if (r.dropped?.length) { bump("dropped", r.dropped.length); r.dropped.slice(0, 5).forEach((d) => log(`✖ Thrown away · ${d.source}: ${d.why}`, "drop")); }
      const found = Object.fromEntries((r.found || []).map((f) => [f.body_id, f]));
      bodies.forEach((b) => { const f = found[b.id]; if (f) setHex(b.id, "found", COL[f.party]); else setHex(b.id, "none"); });
      for (const f of r.found || []) { bump("bodies"); if (f.confidence === "high") bump("high"); log(`✔ ${BYN[f.body_id] || f.body_id}: ${f.party ? f.party + " ahead · " : ""}${f.summary || ""} [${f.confidence}]`, "ok"); }
      if (r.error) log(`⚠ ${r.error}`, "warn");
      else if (!r.proposals) log("· No new numbers yet" + (Date.now() < Date.parse("2026-11-03T08:00:00+05:30") ? " — counting starts 3 Nov at 8 am" : ""), "dim");
    } catch (e) {
      bodies.forEach((b) => setHex(b.id, "none"));
      log(`⚠ ${e.message}. Is the capture-results function deployed (Verify JWT off) with the latest code?`, "warn");
    }
    M.inflight = 0;
    finish();
  }
  function finish() {
    M.done = true; clearInterval(M.tick); clearInterval(M.creep); clearTimeout(M.chat);
    $("#mc")?.classList.add("done");
    $("#mcBar").style.width = "100%";
    $("#mcPhase").textContent = "Done";
    $("#mcTitle").textContent = "Done — new numbers are waiting below for your approval";
    log("■ Done. Nothing is live yet — review and approve below.", "end");
    $("#mcFoot").innerHTML = `<button class="btn sm" type="button" id="mcReview">Review findings ↓</button><button class="btn ghost sm" type="button" id="mcClose">Close</button>`;
    window.agentPause?.(false); window.agentReload?.();
  }

  document.addEventListener("click", (e) => {
    if (e.target.id === "mcReview") document.querySelector(".ag-ups")?.scrollIntoView({ behavior: "smooth" });
    if (e.target.id === "mcClose") { $("#agentMission").innerHTML = ""; M = null; }
  });
  window.agentMission = { start, running: () => !!(M && !M.done) };
})();
