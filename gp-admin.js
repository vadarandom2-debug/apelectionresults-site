// Admin screen for follower-reported panchayat results: review, edit, approve or reject (sign in with an email listed in public.admins).
// Localhost only: ?mock works on the reports saved by gp-report.html?mock, with no database and no sign-in.
(() => {
  const ZP = window.AP_ZP, $ = (s) => document.querySelector(s), esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const URL_ = window.SUPABASE_URL, KEY = window.SUPABASE_ANON_KEY, MOCK = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).has("mock");
  const SIDE = { K: ["కూటమి మద్దతు", "var(--K)"], Y: ["వైసీపీ మద్దతు", "var(--Y)"], O: ["ఇతరులు · స్వతంత్రులు", "var(--O)"] };
  const dTe = Object.fromEntries(ZP.districts.map(([id, , te]) => [id, te])), mName = (d, m) => ZP.te?.[`${d}/${m}`] || (ZP.mandals[d] || []).find((x) => x[0] === m)?.[1] || m;
  const norm = (s) => String(s || "").toLowerCase().normalize("NFC").replace(/[\s‌‍.\-_,()'"]/g, "");
  const key = (r) => `${r.district}|${r.mandal}|${norm(r.panchayat)}`;
  const st = { status: "pending", phase: 0, q: "", sel: new Set(), edit: null }; let rows = [], who = "", api = null;

  // ---------- data access ----------
  function mockApi() {
    const get = () => JSON.parse(localStorage.getItem("gr-mock") || "[]"), put = (a) => localStorage.setItem("gr-mock", JSON.stringify(a));
    return { who: "test-admin (mock)", list: async () => get().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))), update: async (id, patch) => { put(get().map((r) => (String(r.id) === String(id) ? { ...r, ...patch } : r))); } };
  }
  async function realApi() {
    await new Promise((ok, no) => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
    const c = window.supabase.createClient(URL_, KEY), me = async () => { const { data } = await c.auth.getSession(), u = data.session?.user; if (!u) return null; const ok = await c.rpc("is_admin"); return ok.data ? u.email : false; };
    return { client: c, me, list: async () => { const { data, error } = await c.from("gp_reports").select("*").order("created_at", { ascending: false }).limit(1000); if (error) throw error; return data; }, update: async (id, patch) => { const { error } = await c.from("gp_reports").update(patch).eq("id", id); if (error) throw error; } };
  }

  // ---------- view ----------
  const when = (t) => new Date(t).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  function groups() { const g = {}; for (const r of rows) if (r.status !== "rejected") (g[key(r)] ||= []).push(r); return g; }
  function card(r, G) {
    const peers = G[key(r)] || [], sides = [...new Set(peers.map((p) => p.side))], conflict = sides.length > 1, same = peers.filter((p) => p.side === r.side).length;
    const [sl, sc] = SIDE[r.side] || ["?", "#888"], ed = String(st.edit) === String(r.id);
    const peerTxt = peers.length > 1 ? `<span class="${conflict ? "ga-warn" : "ga-meta"}">${conflict ? "⚠ విరుద్ధ నివేదికలు: " : "ఇదే పంచాయతీకి "}${peers.length} నివేదికలు (${["K", "Y", "O"].filter((k) => peers.some((p) => p.side === k)).map((k) => `${SIDE[k][0]} ×${peers.filter((p) => p.side === k).length}`).join(", ")})</span>` : "";
    return `<article class="ga-item ${conflict && r.status === "pending" ? "conflict" : ""} ${r.status}" data-id="${esc(r.id)}">
      <div class="ga-head"><span>${r.status === "pending" ? `<input type="checkbox" data-sel="${esc(r.id)}" ${st.sel.has(r.id) ? "checked" : ""} aria-label="select" /> ` : ""}<b>${esc(r.panchayat)}</b> <small>${esc(mName(r.district, r.mandal))} · ${esc(dTe[r.district] || r.district)} · దశ ${r.phase}</small></span><small>${when(r.created_at)}</small></div>
      <div class="ga-res"><span class="ga-chip" style="--c:${sc}">${sl}</span><span><b>${r.margin ? `మెజారిటీ ${Number(r.margin).toLocaleString("en-IN")}` : "ఏకగ్రీవం / మెజారిటీ లేదు"}</b>${r.winner ? ` · ${esc(r.winner)}` : ""}</span>${r.status !== "pending" ? `<span class="ga-meta">${r.status === "approved" ? "✓ ఆమోదించారు" : "✗ తిరస్కరించారు"}${r.reviewed_by ? ` · ${esc(r.reviewed_by)}` : ""}</span>` : ""}</div>
      <div class="ga-meta">${esc(r.reporter || "—")} · ${r.phone ? `<a href="tel:${esc(r.phone)}">${esc(r.phone)}</a>` : "—"}${r.notes ? ` · “${esc(r.notes)}”` : ""}</div>${peerTxt}
      ${ed ? `<div class="ga-edit"><input data-f="panchayat" value="${esc(r.panchayat)}" /><select data-f="side">${["K", "Y", "O"].map((k) => `<option value="${k}" ${r.side === k ? "selected" : ""}>${SIDE[k][0]}</option>`).join("")}</select><input data-f="winner" value="${esc(r.winner || "")}" placeholder="పేరు" /><input data-f="margin" type="number" value="${esc(r.margin ?? 0)}" /></div>` : ""}
      <div class="ga-act">${r.status !== "approved" ? `<button class="ga-btn ok" data-do="approve">${ed ? "మార్పులతో ఆమోదించు" : "ఆమోదించు"}</button>` : `<button class="ga-btn" data-do="undo">ఆమోదం రద్దు</button>`}${r.status === "pending" ? `<button class="ga-btn no" data-do="reject">తిరస్కరించు</button>` : ""}${r.status === "pending" ? `<button class="ga-btn" data-do="edit">${ed ? "రద్దు" : "సవరించు"}</button>` : ""}</div></article>`;
  }
  function draw() {
    const G = groups(), q = st.q.trim().toLowerCase();
    const list = rows.filter((r) => (st.status === "all" || r.status === st.status) && (!st.phase || r.phase === st.phase) && (!q || `${r.panchayat} ${mName(r.district, r.mandal)} ${dTe[r.district] || ""} ${r.reporter || ""} ${r.winner || ""}`.toLowerCase().includes(q)));
    const pend = rows.filter((r) => r.status === "pending").length;
    $("#gaCount").textContent = `${pend} ఎదురుచూస్తున్నవి · ${rows.filter((r) => r.status === "approved").length} ఆమోదించినవి · ${rows.length} మొత్తం`; document.title = (pend ? `(${pend}) ` : "") + "పంచాయతీ నివేదికలు · Admin";
    $("#gaList").innerHTML = list.length ? list.map((r) => card(r, G)).join("") : `<p class="ga-empty">ఏ నివేదికలూ లేవు · No reports here.</p>`;
    document.querySelectorAll("#gaStatus [data-s]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.s === st.status)); document.querySelectorAll("#gaPhase [data-p]").forEach((b) => b.setAttribute("aria-pressed", +b.dataset.p === st.phase));
  }
  async function load() { try { rows = await api.list(); draw(); } catch (e) { $("#gaCount").textContent = "లోడ్ కాలేదు: " + (e.message || e); } }
  const stamp = (status, extra = {}) => ({ status, reviewed_at: new Date().toISOString(), reviewed_by: who, ...extra });
  async function act(id, what) {
    const r = rows.find((x) => String(x.id) === String(id)); if (!r) return; id = r.id;
    try {
      if (what === "edit") { st.edit = String(st.edit) === String(id) ? null : id; return draw(); }
      if (what === "approve") { const patch = {}; if (String(st.edit) === String(id)) { for (const el of document.querySelectorAll(`[data-id="${id}"] [data-f]`)) patch[el.dataset.f] = el.dataset.f === "margin" ? Number(el.value || 0) : el.value.trim() || null; } st.edit = null; await api.update(id, stamp("approved", patch)); }
      if (what === "reject") await api.update(id, stamp("rejected"));
      if (what === "undo") await api.update(id, { status: "pending", reviewed_at: null, reviewed_by: null });
    } catch (e) { alert("సేవ్ కాలేదు: " + (e.message || e)); }
    await load();
  }
  async function bulk(ids) { if (!ids.length) return alert("ఏవీ ఎంచుకోలేదు."); if (!confirm(`${ids.length} నివేదికలను ఆమోదించాలా?`)) return; try { for (const id of ids) await api.update(id, stamp("approved")); } catch (e) { alert("సేవ్ కాలేదు: " + (e.message || e)); } st.sel.clear(); await load(); }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-do]"); if (b) return act(b.closest("[data-id]").dataset.id, b.dataset.do);
    const s = e.target.closest("[data-s]"); if (s) { st.status = s.dataset.s; draw(); }
    const p = e.target.closest("[data-p]"); if (p) { st.phase = +p.dataset.p; draw(); }
    if (e.target.id === "gaRefresh") load(); if (e.target.id === "gaBulk") bulk([...st.sel]);
    if (e.target.id === "gaAgree") { const G = groups(); bulk(rows.filter((r) => r.status === "pending" && (G[key(r)] || []).length >= 2 && new Set(G[key(r)].map((x) => x.side)).size === 1).map((r) => r.id)); }
    if (e.target.id === "gaOut") api.client?.auth.signOut().then(() => location.reload());
  });
  document.addEventListener("change", (e) => { const c = e.target.closest("[data-sel]"); if (c) { c.checked ? st.sel.add(c.dataset.sel) : st.sel.delete(c.dataset.sel); } });
  $("#gaQ").addEventListener("input", (e) => { st.q = e.target.value; draw(); });

  async function start() {
    if (MOCK) { $("#gaMock").hidden = false; api = mockApi(); who = api.who; $("#gaApp").hidden = false; $("#gaOut").hidden = true; $("#gaWho").textContent = who; return load(); }
    if (!URL_ || !KEY) { $("#gaLogin").hidden = false; $("#gaLoginErr").textContent = "డేటాబేస్ కనెక్ట్ కాలేదు."; $("#gaLoginErr").hidden = false; return; }
    api = await realApi(); const e = await api.me();
    if (e) return enter(e);
    $("#gaLogin").hidden = false; if (e === false) { $("#gaLoginErr").textContent = "ఈ ఇమెయిల్‌కు అడ్మిన్ అనుమతి లేదు."; $("#gaLoginErr").hidden = false; }
    $("#gaSignIn").onclick = async () => { const { error } = await api.client.auth.signInWithPassword({ email: $("#gaEmail").value.trim(), password: $("#gaPass").value }); if (error) { $("#gaLoginErr").textContent = "ఇమెయిల్ / పాస్‌వర్డ్ తప్పు."; $("#gaLoginErr").hidden = false; return; } const m = await api.me(); m ? enter(m) : ($("#gaLoginErr").textContent = "ఈ ఇమెయిల్‌కు అడ్మిన్ అనుమతి లేదు.", $("#gaLoginErr").hidden = false); };
  }
  function enter(email) { who = email; $("#gaLogin").hidden = true; $("#gaApp").hidden = false; $("#gaWho").textContent = email; load(); setInterval(() => { if (!document.hidden && !st.edit) load(); }, 20000); }
  start();
})();
