// Results admin: enter results body by body, or upload CSV / JSON, then publish to data/results.js via server.py.
(() => {
  const BODIES = window.AP_BODIES, CAND = window.AP_CANDIDATES || { bodies: {}, ndaSeat: {} }, RURAL_N = window.AP_RURAL || {};
  const { esc, logo, name } = window.GECharts;
  const P = ["TDP", "JSP", "BJP", "NDA", "YSRCP", "INC", "LEFT", "OTH"];
  const TYPE = { C: "Corporation", M: "Municipality", NP: "Nagar Panchayat" };
  const DRAFT = "ap-admin-draft";
  const $ = (s) => document.querySelector(s);
  const byId = Object.fromEntries(BODIES.map((b) => [b.id, b]));
  let W = { updated: null, turnout: null, bodies: {}, rural: {} }, dirty = false, sel = BODIES[0].id, filt = "all", token = "";
  let serverOK = false, pending = null;
  window.getAdminResults = () => W; // read by share.js
  // admin-agent.js: a result approved from the AI agent tab is already live; mirror it here
  window.adminApplyApproved = (id, data) => {
    if (id.startsWith("rural-")) (W.rural ||= {})[id.slice(6)] = data; else W.bodies[id] = data;
    markDirty(dirty); renderList(); renderEditor(); renderRural();
  };

  // ---------- storage / state ----------
  const sum = (o) => Object.values(o || {}).reduce((a, b) => a + (+b || 0), 0);
  const saveDraft = () => { try { localStorage.setItem(DRAFT, JSON.stringify({ W, dirty })); } catch {} };
  function markDirty(v = true) {
    dirty = v; saveDraft();
    const n = Object.keys(W.bodies).length;
    $("#dirty").className = "dirty" + (dirty ? " on" : "");
    $("#dirty").textContent = dirty ? `Unpublished changes · ${n} ${n === 1 ? "body" : "bodies"} with results` : `Published · ${n} ${n === 1 ? "body" : "bodies"} with results`;
  }
  function toast(msg, bad = false) {
    const t = $("#toast"); t.textContent = msg; t.className = "toast" + (bad ? " bad" : ""); t.hidden = false;
    clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), 4200);
  }
  function loadPublished() {
    return new Promise((res) => {
      const s = document.createElement("script"); s.src = "data/results.js?t=" + Date.now();
      s.onload = () => res(JSON.parse(JSON.stringify(window.AP_RESULTS || {}))); s.onerror = () => res({});
      document.head.appendChild(s);
    });
  }

  // ---------- validation (shared by form, CSV and JSON) ----------
  function cleanRecord(b, r) {
    const errs = [], out = { wards: {}, leads: {} };
    const int = (v, f) => { if (v === "" || v == null) return 0; const n = Number(v); if (!Number.isInteger(n) || n < 0) { errs.push(`${f} must be a whole number`); return 0; } return n; };
    P.forEach((p) => { const w = int(r.wards?.[p], p + " won"), l = int(r.leads?.[p], p + " leading"); if (w) out.wards[p] = w; if (l) out.leads[p] = l; });
    const won = sum(out.wards), led = sum(out.leads);
    if (won + led > b.wards) errs.push(`won + leading is ${won + led}, but ${b.name} has only ${b.wards} wards`);
    out.declared = won;
    if (r.turnout !== "" && r.turnout != null) { const t = Number(r.turnout); if (!(t >= 0 && t <= 100)) errs.push("turnout must be 0–100"); else out.turnout = t; }
    const h = r.head;
    if (h && (h.party || h.name)) {
      if (!P.includes(h.party)) errs.push(`head party must be one of ${P.join(", ")}`);
      const st = h.status || "leading";
      if (!["leading", "won"].includes(st)) errs.push("head status must be leading or won");
      out.head = { party: h.party, name: String(h.name || "").trim(), status: st };
      if (h.margin !== "" && h.margin != null) { const m = Number(h.margin); if (!Number.isInteger(m) || m < 0) errs.push("margin must be a whole number"); else out.head.margin = m; }
    }
    if (!out.declared && !led && !out.head && out.turnout == null) return { empty: true, errs };
    if (!led) delete out.leads;
    return { rec: out, errs };
  }

  // ---------- body list ----------
  const hasData = (id) => !!W.bodies[id];
  function renderFilter() {
    const n = Object.keys(W.bodies).length;
    $("#bfilter").innerHTML = [["all", `All ${BODIES.length}`], ["done", `Entered ${n}`], ["todo", `Missing ${BODIES.length - n}`]].map(([k, l]) => `<button class="chip ${filt === k ? "on" : ""}" data-f="${k}">${l}</button>`).join("");
  }
  function renderList() {
    renderFilter();
    const q = $("#bq").value.trim().toLowerCase();
    const list = BODIES.filter((b) => (filt === "all" || (filt === "done") === hasData(b.id)) && (!q || (b.name + " " + b.district).toLowerCase().includes(q)))
      .sort((a, b) => ({ C: 0, M: 1, NP: 2 }[a.type] - { C: 0, M: 1, NP: 2 }[b.type]) || a.name.localeCompare(b.name));
    $("#bodies").innerHTML = list.map((b) => { const r = W.bodies[b.id]; return `<li data-b="${b.id}" class="${b.id === sel ? "sel" : ""}"><i class="st ${r ? (r.declared >= b.wards && r.head?.status === "won" ? "done" : "part") : ""}"></i><span><b>${esc(b.name)}</b><small>${TYPE[b.type]} · ${r ? `${r.declared}/${b.wards} wards` : `${b.wards} wards`}</small></span></li>`; }).join("") || `<li class="none">No match</li>`;
  }

  // ---------- editor ----------
  function contenders(b) {
    const list = (CAND.bodies[b.id] || []).map(([p, n]) => ({ p, n }));
    const nda = CAND.ndaSeat[b.id]; if (nda && !list.some((c) => c.p === nda)) list.push({ p: nda, n: "" });
    return list;
  }
  function renderEditor() {
    const b = byId[sel], r = W.bodies[sel] || {}, h = r.head || {}, post = b.type === "C" ? "Mayor" : "Chairperson";
    $("#editor").innerHTML = `<div class="ed-head"><div><p class="eyebrow">${TYPE[b.type]} · ${esc(b.district)}</p><h2>${esc(b.name)}</h2><p class="mut small">${b.wards} wards · ${post} reservation: ${esc(b.res)}</p></div>${r.declared != null && W.bodies[sel] ? '<span class="tag st-counting">Has results</span>' : '<span class="tag">No results yet</span>'}</div>
      <form id="bf" autocomplete="off">
        <h3>Wards</h3>
        <table class="ptab"><tr><th>Party</th><th>Won</th><th>Leading</th></tr>${P.map((p) => `<tr><td><span class="pty">${logo(p)}${esc(name(p))}</span></td><td><input type="number" min="0" max="${b.wards}" name="w_${p}" value="${r.wards?.[p] ?? ""}" inputmode="numeric" /></td><td><input type="number" min="0" max="${b.wards}" name="l_${p}" value="${r.leads?.[p] ?? ""}" inputmode="numeric" /></td></tr>`).join("")}</table>
        <div class="sumline" id="sumline"></div>
        <label class="fld">Turnout % <input type="number" name="turnout" min="0" max="100" step="0.01" value="${r.turnout ?? ""}" /></label>
        <h3>${post} (direct election)</h3>
        <div class="cpick">${contenders(b).map((c) => `<button type="button" class="cbtn" data-cp="${c.p}" data-cn="${esc(c.n)}">${logo(c.p)}<span>${c.n ? esc(c.n) : c.p + " candidate"}<small>${c.p}</small></span></button>`).join("") || '<span class="mut small">No announced candidates — type the name below.</span>'}</div>
        <div class="hrow">
          <label class="fld">Party <select name="hp"><option value="">— none —</option>${P.map((p) => `<option ${h.party === p ? "selected" : ""}>${p}</option>`).join("")}</select></label>
          <label class="fld grow">Name <input name="hn" value="${esc(h.name || "")}" /></label>
          <label class="fld">Margin (votes) <input type="number" min="0" name="hm" value="${h.margin ?? ""}" /></label>
        </div>
        <div class="seg-ctl hs" role="radiogroup">${["leading", "won"].map((s) => `<label><input type="radio" name="hs" value="${s}" ${(h.status || "leading") === s ? "checked" : ""}/><span>${s === "won" ? "Won (declared)" : "Leading"}</span></label>`).join("")}</div>
        <div class="errs" id="errs"></div>
        <div class="ed-btns"><button class="btn" type="submit">Save ${esc(b.name)}</button><button class="btn ghost sm" type="button" id="clearB">Clear this body</button><button class="btn ghost sm" type="button" id="nextB">Next body →</button></div>
      </form>`;
    check();
  }
  function readForm() {
    const f = new FormData($("#bf")), g = (k) => f.get(k);
    return { wards: Object.fromEntries(P.map((p) => [p, g("w_" + p)])), leads: Object.fromEntries(P.map((p) => [p, g("l_" + p)])), turnout: g("turnout"),
      head: g("hp") || g("hn") ? { party: g("hp"), name: g("hn"), status: g("hs"), margin: g("hm") } : null };
  }
  function check() {
    const b = byId[sel], res = cleanRecord(b, readForm()), r = res.rec || { declared: 0 };
    const led = sum(r.leads), left = b.wards - r.declared - led;
    $("#sumline").innerHTML = `<b>${r.declared}</b> declared · <b>${led}</b> leading · <b>${Math.max(0, left)}</b> not yet counted <span class="mut">of ${b.wards}</span>${(window.AP_UNOPPOSED?.items || []).some((x) => x.body === b.id) ? `<br><b class="warn">Enter total wards won including the unopposed ones · ఏకగ్రీవ వార్డులతో కలిపి మొత్తం నమోదు చేయండి</b>` : ""}`;
    $("#sumline").classList.toggle("bad", left < 0);
    $("#errs").innerHTML = res.errs.map((e) => `<p>⚠ ${esc(e)}</p>`).join("");
    return res;
  }
  function saveBody(e) {
    e.preventDefault();
    const res = check();
    if (res.errs.length) return toast("Fix the highlighted problems first", true);
    if (res.empty) delete W.bodies[sel]; else W.bodies[sel] = res.rec;
    markDirty(); renderList(); renderEditor(); toast(`Saved ${byId[sel].name} — press Publish to update the site`);
  }

  // ---------- CSV / JSON upload ----------
  function parseCSV(text) {
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
      else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim() !== ""));
  }
  const findBody = (id, nm) => byId[(id || "").trim()] || BODIES.find((b) => b.name.toLowerCase() === (nm || "").trim().toLowerCase());
  function fromCSV(text) {
    const [h, ...rows] = parseCSV(text.replace(/^﻿/, "")); if (!h) throw new Error("The file is empty");
    const ix = Object.fromEntries(h.map((c, i) => [c.trim().toLowerCase(), i]));
    if (ix.body_id == null && ix.body_name == null) throw new Error("CSV needs a body_id or body_name column — download the template");
    const get = (r, k) => (ix[k.toLowerCase()] == null ? "" : (r[ix[k.toLowerCase()]] || "").trim());
    return rows.map((r, n) => {
      const b = findBody(get(r, "body_id"), get(r, "body_name")), label = get(r, "body_name") || get(r, "body_id") || `row ${n + 2}`;
      if (!b) return { label, errs: [`unknown body “${label}”`] };
      const rec = { wards: Object.fromEntries(P.map((p) => [p, get(r, p)])), leads: Object.fromEntries(P.map((p) => [p, get(r, "lead_" + p)])), turnout: get(r, "turnout"),
        head: get(r, "head_party") || get(r, "head_name") ? { party: get(r, "head_party").toUpperCase(), name: get(r, "head_name"), status: (get(r, "head_status") || "leading").toLowerCase(), margin: get(r, "head_margin") } : null };
      return { b, label: b.name, ...cleanRecord(b, rec) };
    }).filter((x) => !x.empty);
  }
  function fromJSON(text) {
    const t = text.trim().replace(/^[\s\S]*?window\.AP_RESULTS\s*=\s*/, "").replace(/;\s*$/, "");
    let o; try { o = JSON.parse(t); } catch { throw new Error("Not valid JSON. Upload a .json file or a results.js saved by this admin page."); }
    const rows = Object.entries(o.bodies || {}).map(([id, r]) => { const b = byId[id]; return b ? { b, label: b.name, ...cleanRecord(b, r) } : { label: id, errs: [`unknown body id “${id}”`] }; }).filter((x) => !x.empty);
    return { rows, extra: { turnout: o.turnout, rural: o.rural } };
  }
  async function onFile(file) {
    if (!file) return;
    if (file.size > 2e6) return toast("File is larger than 2 MB", true);
    const text = await file.text();
    try {
      pending = /\.csv$/i.test(file.name) || /^﻿?[^{\n]*,/.test(text) ? { rows: fromCSV(text) } : fromJSON(text);
    } catch (err) { pending = null; $("#preview").innerHTML = `<div class="errs"><p>⚠ ${esc(err.message)}</p></div>`; return; }
    const ok = pending.rows.filter((r) => !r.errs.length), bad = pending.rows.filter((r) => r.errs.length);
    $("#preview").innerHTML = `<h3>${esc(file.name)} · ${ok.length} ready${bad.length ? `, <span class="dn">${bad.length} with problems (skipped)</span>` : ""}</h3>
      <div class="tbl-wrap"><table class="full-tbl prev"><thead><tr><th class="tl">Body</th><th>Declared</th><th>Leading</th>${P.map((p) => `<th>${p}</th>`).join("")}<th class="tl">Head</th><th class="tl">Check</th></tr></thead><tbody>${pending.rows.map((r) => {
        const x = r.rec || {};
        return `<tr class="${r.errs.length ? "bad" : ""}"><td class="tl"><b>${esc(r.label)}</b></td><td class="num">${x.declared ?? "–"}${r.b ? "/" + r.b.wards : ""}</td><td class="num">${sum(x.leads) || ""}</td>${P.map((p) => `<td class="num">${x.wards?.[p] || ""}</td>`).join("")}<td class="tl">${x.head ? `${esc(x.head.party)} · ${esc(x.head.name)} (${x.head.status})` : ""}</td><td class="tl">${r.errs.length ? esc(r.errs.join("; ")) : "✓"}</td></tr>`;
      }).join("")}</tbody></table></div>
      ${ok.length ? `<div class="ed-btns"><button class="btn" id="applyUp" type="button">Apply ${ok.length} bodies to the draft</button><span class="mut small">Existing results for these bodies are replaced. Then press Publish.</span></div>` : ""}`;
  }
  function applyUpload() {
    if (!pending) return;
    const ok = pending.rows.filter((r) => !r.errs.length);
    ok.forEach((r) => (W.bodies[r.b.id] = r.rec));
    if (pending.extra) { if (pending.extra.turnout != null) W.turnout = pending.extra.turnout; if (pending.extra.rural) W.rural = pending.extra.rural; renderRural(); }
    pending = null; $("#preview").innerHTML = ""; $("#file").value = "";
    markDirty(); renderList(); renderEditor(); toast(`Applied ${ok.length} bodies — press Publish to update the site`);
  }
  function download(name, text, type) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function template() {
    const h = ["body_id", "body_name", "type", "district", "wards", ...P, ...P.map((p) => "lead_" + p), "turnout", "head_party", "head_name", "head_status", "head_margin"];
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = BODIES.map((b) => { const r = W.bodies[b.id] || {}, hd = r.head || {}; return [b.id, b.name, TYPE[b.type], b.district, b.wards, ...P.map((p) => r.wards?.[p] ?? ""), ...P.map((p) => r.leads?.[p] ?? ""), r.turnout ?? "", hd.party ?? "", hd.name ?? "", hd.party ? hd.status : "", hd.margin ?? ""].map(q).join(","); });
    download("ap-local-results-template.csv", "﻿" + [h.join(","), ...rows].join("\n"), "text/csv");
  }

  // ---------- rural & turnout ----------
  function renderRural() {
    $("#stTurnout").value = W.turnout ?? "";
    $("#ruralEd").innerHTML = [["zptc", "ZPTC seats", RURAL_N.zptc], ["mptc", "MPTC seats", RURAL_N.mptc], ["gp", "Gram Panchayat sarpanches", RURAL_N.gp]].map(([k, l, n]) => {
      const s = W.rural?.[k]?.seats || {};
      return `<div class="card"><h3>${l}</h3><p class="mut small">${(n || 0).toLocaleString("en-IN")} in total · declared <b id="rd_${k}">${sum(s)}</b></p><table class="ptab">${P.map((p) => `<tr><td><span class="pty">${logo(p)}${esc(name(p))}</span></td><td><input type="number" min="0" max="${n}" data-rk="${k}" data-rp="${p}" value="${s[p] ?? ""}" /></td></tr>`).join("")}</table></div>`;
    }).join("");
  }
  function onRural(e) {
    const i = e.target; if (!i.dataset.rk) return;
    const k = i.dataset.rk, v = Math.max(0, parseInt(i.value, 10) || 0);
    W.rural = W.rural || {}; W.rural[k] = W.rural[k] || { declared: 0, seats: {} };
    if (v) W.rural[k].seats[i.dataset.rp] = v; else delete W.rural[k].seats[i.dataset.rp];
    W.rural[k].declared = sum(W.rural[k].seats);
    if (!W.rural[k].declared) delete W.rural[k];
    $("#rd_" + k).textContent = W.rural[k]?.declared || 0; markDirty();
  }

  // ---------- publish ----------
  async function publish() {
    if (window.SUPA?.enabled) {
      const out = await window.SUPA.publish(W);
      if (out.error) return toast(out.error, true);
      W.updated = out.updated; markDirty(false);
      $("#lastPub").textContent = "Last published " + new Date(out.updated).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
      return toast(`Published ${out.bodies} ${out.bodies === 1 ? "body" : "bodies"} — live on the site now`);
    }
    if (!serverOK) { toast("The server isn't running here. Use “Download results.js” and replace data/results.js by hand.", true); return; }
    const res = await fetch("api/results", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { "X-Admin-Token": token } : {}) }, body: JSON.stringify(W) }).catch(() => null);
    if (!res) return toast("Could not reach the server", true);
    const out = await res.json().catch(() => ({}));
    if (res.status === 403) { token = prompt("Admin token") || ""; if (token) return publish(); return toast(out.error || "Not allowed", true); }
    if (!res.ok) return toast(out.error || "Publish failed", true);
    W.updated = out.updated; markDirty(false);
    $("#lastPub").textContent = "Last published " + new Date(out.updated).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    toast(`Published ${out.bodies} ${out.bodies === 1 ? "body" : "bodies"} — open pages update within a minute`);
  }

  // ---------- tabs & events ----------
  function showTab() {
    const t = (location.hash || "#urban").slice(1);
    document.querySelectorAll("[data-apanel]").forEach((p) => (p.hidden = p.dataset.apanel !== t));
    document.querySelectorAll("[data-atab]").forEach((a) => a.setAttribute("aria-current", a.dataset.atab === t ? "page" : "false"));
  }
  window.addEventListener("hashchange", showTab);
  window.addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
  document.addEventListener("click", (e) => {
    const li = e.target.closest("[data-b]"); if (li) { sel = li.dataset.b; renderList(); renderEditor(); return; }
    const f = e.target.closest("[data-f]"); if (f) { filt = f.dataset.f; renderList(); return; }
    const cp = e.target.closest("[data-cp]"); if (cp) { $("#bf").hp.value = cp.dataset.cp; if (cp.dataset.cn) $("#bf").hn.value = cp.dataset.cn; check(); return; }
    if (e.target.id === "clearB") { if (confirm(`Clear all results for ${byId[sel].name}?`)) { delete W.bodies[sel]; markDirty(); renderList(); renderEditor(); } return; }
    if (e.target.id === "nextB") { const ids = [...document.querySelectorAll("#bodies [data-b]")].map((x) => x.dataset.b); sel = ids[(ids.indexOf(sel) + 1) % ids.length] || sel; renderList(); renderEditor(); return; }
    if (e.target.id === "applyUp") return applyUpload();
  });
  document.addEventListener("input", (e) => { if (e.target.closest("#bf")) check(); onRural(e); });
  document.addEventListener("submit", (e) => { if (e.target.id === "bf") saveBody(e); });
  $("#bq").oninput = renderList;
  $("#file").onchange = (e) => onFile(e.target.files[0]);
  const drop = $("#drop");
  ["dragover", "dragenter"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("over")));
  drop.addEventListener("drop", (e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); });
  $("#tpl").onclick = template;
  $("#stTurnout").oninput = (e) => { const v = e.target.value; W.turnout = v === "" ? null : Math.min(100, Math.max(0, +v)); markDirty(); };
  $("#publish").onclick = publish;
  $("#dlJs").onclick = () => download("results.js", "// LIVE RESULTS — exported from admin.html\nwindow.AP_RESULTS = " + JSON.stringify({ ...W, updated: new Date().toISOString() }, null, 1) + ";\n", "text/javascript");

  // ---------- boot ----------
  (async () => {
    showTab();
    const supa = await window.SUPA?.ready;
    const pub = (supa && (await supa.loadResults())) || (await loadPublished());
    W = { updated: pub.updated || null, turnout: pub.turnout ?? null, bodies: pub.bodies || {}, rural: pub.rural || {} };
    try { const d = JSON.parse(localStorage.getItem(DRAFT) || "null"); if (d?.dirty && d.W) { W = d.W; dirty = true; toast("Restored your unpublished draft"); } } catch {}
    markDirty(dirty); renderList(); renderEditor(); renderRural();
    if (W.updated) $("#lastPub").textContent = "Site last updated " + new Date(W.updated).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
    if (supa) return supa.badge();
    const ping = await fetch("api/ping").then((r) => r.json()).catch(() => null);
    serverOK = !!ping?.ok;
    $("#conn").className = "conn " + (serverOK ? "ok" : "off");
    $("#conn").textContent = serverOK ? "Connected · Publish saves to the site" : "Server not running · use Download results.js";
  })();
})();
