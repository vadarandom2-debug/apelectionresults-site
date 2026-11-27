// Floating dock nav: sliding tab ink, condense-on-scroll, poll countdown chip and a ⌘K command palette
// that searches towns, constituencies, MP seats and candidates in English or Telugu.
(() => {
  const $ = (s) => document.querySelector(s);
  const dock = $("#dock"), ink = $("#dockInk"), tabs = $(".dock-tabs");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- sliding ink under the current tab ----------
  function moveInk() {
    const a = tabs.querySelector('[aria-current="page"]');
    if (!a) { ink.style.opacity = 0; return; }
    ink.style.opacity = 1; ink.style.width = a.offsetWidth + "px"; ink.style.transform = `translateX(${a.offsetLeft}px)`;
  }
  new MutationObserver(moveInk).observe(tabs, { subtree: true, attributes: true, attributeFilter: ["aria-current"] });
  addEventListener("resize", moveInk); document.fonts?.ready.then(moveInk); setTimeout(moveInk, 60);

  // ---------- condense on scroll ----------
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { dock.classList.toggle("condensed", scrollY > 60); ticking = false; setTimeout(moveInk, 260); });
  }, { passive: true });

  // ---------- countdown in the live chip ----------
  function cd() {
    const poll = (window.AP_SCHEDULE || []).find((s) => s.id === "ulb-poll"); if (!poll) return;
    const ms = new Date(poll.at) - Date.now();
    $("#dockCd").textContent = window.AP_STATUS?.paused ? "polls on hold" : ms > 0 ? `${Math.ceil(ms / 864e5)}d to polls` : "";
  }
  cd(); setInterval(cd, 60000);

  // ---------- command palette ----------
  const TE = window.AP_TE || { bodies: {}, names: {}, districts: {} };
  const TYPE = { C: "Corporation", M: "Municipality", NP: "Nagar Panchayat" };
  const items = [];
  [["local", "Local body elections 2026"], ["overview", "Overview: parties, leaders, news"], ["past", "2014 – 2024 results"], ["assembly", "Assembly results"], ["loksabha", "Lok Sabha results"], ["seats", "Find a constituency"], ["full", "Full results table"]]
    .forEach(([k, l]) => items.push({ g: "Go to", t: l, s: "", k: l, go: () => (location.hash = "#/" + k) }));
  (window.AP_BODIES || []).forEach((b) => items.push({ g: "2026 · Municipal bodies", t: b.name, te: TE.bodies[b.id], s: `${TYPE[b.type]} · ${b.district}`, k: [b.name, TE.bodies[b.id], b.district, TE.districts[b.district]].join(" "), open: { id: b.id } }));
  (window.GE_AC || []).forEach((a) => items.push({ g: "Assembly constituencies", t: a.n, s: `AC ${a.no} · ${a.d} · 2024: ${a.y["2024"][1]} (${a.y["2024"][0]})`, k: [a.n, a.d, a.nd, ...["2014", "2019", "2024"].map((y) => a.y[y][1])].join(" "), open: { ac: a.no } }));
  (window.GE_PC || []).forEach((p) => items.push({ g: "Lok Sabha seats", t: p.n, s: `2024: ${p.y["2024"][1]} (${p.y["2024"][0]})`, k: [p.n, ...["2014", "2019", "2024"].map((y) => p.y[y][1])].join(" "), open: { pc: p.no } }));
  const BID = Object.fromEntries((window.AP_BODIES || []).map((b) => [b.id, b]));
  Object.entries((window.AP_CANDIDATES || {}).bodies || {}).forEach(([id, list]) => list.forEach(([p, n, , st]) => {
    const b = BID[id]; if (!b) return;
    items.push({ g: "2026 · Candidates", t: n, te: TE.names[n], s: `${p}${st === "reported" ? " (reported)" : ""} · ${b.type === "C" ? "Mayor" : "Chair"}, ${b.name}`, k: [n, TE.names[n], b.name, p].join(" "), open: { id } });
  }));
  items.forEach((it) => (it.n = norm(it.k + " " + it.t)));
  function norm(s) { return String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ.]/g, "").replace(/\s+/g, " "); }

  let results = [], sel = 0;
  function search(q) {
    const n = norm(q).trim();
    if (!n) return items.filter((i) => i.g === "Go to" || (i.open?.id && BID[i.open.id]?.type === "C" && i.g.includes("bodies")));
    const words = n.split(" ");
    return items.map((i) => {
      if (!words.every((w) => i.n.includes(w))) return null;
      const t = norm(i.t), te = norm(i.te);
      return { i, sc: (t.startsWith(n) || te.startsWith(n) ? 0 : t.includes(n) ? 1 : 2) + (i.g === "Go to" ? -1 : 0) };
    }).filter(Boolean).sort((a, b) => a.sc - b.sc || a.i.t.length - b.i.t.length).slice(0, 40).map((x) => x.i);
  }
  function render() {
    results = search($("#cmdQ").value); sel = Math.min(sel, Math.max(0, results.length - 1));
    let g = "";
    $("#cmdList").innerHTML = results.map((r, i) => {
      const head = r.g !== g ? `<div class="cmd-g">${esc((g = r.g))}</div>` : "";
      return `${head}<div class="cmd-it ${i === sel ? "on" : ""}" role="option" aria-selected="${i === sel}" data-i="${i}"><b>${esc(r.t)}${r.te ? ` <span lang="te">${esc(r.te)}</span>` : ""}</b><small>${esc(r.s)}</small></div>`;
    }).join("") || `<div class="cmd-empty">No match. Try a town, constituency or candidate name.</div>`;
    $("#cmdList .on")?.scrollIntoView({ block: "nearest" });
  }
  function choose(r) {
    if (!r) return; close();
    if (r.go) return r.go();
    // reuse the page's own click handlers (app.js opens bodies, general.js opens constituencies)
    const el = document.createElement("span");
    if (r.open.id) el.dataset.id = r.open.id;
    if (r.open.ac) el.dataset.ac = r.open.ac;
    if (r.open.pc) el.dataset.pc = r.open.pc;
    document.body.appendChild(el); el.click(); el.remove();
  }
  let lastFocus = null;
  function open() { lastFocus = document.activeElement; $("#cmd").hidden = false; document.body.classList.add("cmd-open"); $("#cmdQ").value = ""; sel = 0; render(); $("#cmdQ").focus(); }
  function close() { $("#cmd").hidden = true; document.body.classList.remove("cmd-open"); lastFocus?.focus?.(); }
  $("#cmdOpen").onclick = open;
  $("#cmdQ").oninput = () => { sel = 0; render(); };
  $("#cmd").addEventListener("click", (e) => { if (e.target.closest("[data-cmd-close]")) return close(); const it = e.target.closest(".cmd-it"); if (it) choose(results[+it.dataset.i]); });
  $("#cmdList").addEventListener("mousemove", (e) => { const it = e.target.closest(".cmd-it"); if (it && +it.dataset.i !== sel) { sel = +it.dataset.i; document.querySelectorAll(".cmd-it").forEach((x) => x.classList.toggle("on", +x.dataset.i === sel)); } });
  addEventListener("keydown", (e) => {
    const inField = /input|textarea|select/i.test(e.target.tagName) && e.target.id !== "cmdQ";
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !inField && $("#cmd").hidden)) { e.preventDefault(); return $("#cmd").hidden ? open() : close(); }
    if ($("#cmd").hidden) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(results.length - 1, sel + 1); render(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); render(); }
    else if (e.key === "Enter") { e.preventDefault(); choose(results[sel]); }
  }, true);
  if (!/Mac|iPhone|iPad/.test(navigator.platform)) $("#cmdOpen kbd").textContent = "Ctrl K";

  // ---------- phone bottom bar: "More" sheet ----------
  const more = document.getElementById("tbMore"), sheet = document.getElementById("tbSheet");
  if (more && sheet) {
    const setOpen = (v) => { sheet.hidden = !v; more.setAttribute("aria-expanded", String(v)); };
    more.addEventListener("click", (e) => { e.stopPropagation(); setOpen(sheet.hidden); });
    sheet.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("click", (e) => { if (!sheet.hidden && !e.target.closest("#tbSheet")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    window.addEventListener("hashchange", () => setOpen(false));
  }
})();
