// Admin ↔ Supabase: sign-in, publishing results, and managing candidates and news.
// Exposes window.SUPA for admin.js. Without supabase-config.js values everything falls back to server.py.
(() => {
  const URL = window.SUPABASE_URL, KEY = window.SUPABASE_ANON_KEY;
  const BODIES = window.AP_BODIES || [], BY = Object.fromEntries(BODIES.map((b) => [b.id, b]));
  const P = ["TDP", "JSP", "BJP", "YSRCP", "INC", "LEFT", "OTH"];
  const TAGS = ["TDP", "JSP", "BJP", "YSRCP", "INC", "Kutami", "SEC", "Court", "Other"];
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, bad) => { const t = $("#toast"); t.textContent = m; t.className = "toast" + (bad ? " bad" : ""); t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), 4200); };
  const S = { enabled: !!(URL && KEY), client: null, user: null, admin: false };
  window.SUPA = S;

  const needSetup = `<div class="card"><h3>Connect Supabase first</h3><p class="mut small">Run <code>supabase/schema.sql</code> in your Supabase project, then put the project URL and anon key in <code>supabase-config.js</code> and reload this page.</p></div>`;
  if (!S.enabled) {
    S.ready = Promise.resolve(null);
    document.addEventListener("DOMContentLoaded", () => { ["#candsPanel", "#newsPanel"].forEach((id) => { const el = $(id); if (el) el.innerHTML = needSetup; }); });
    return;
  }

  S.ready = new Promise((resolve) => {
    const lib = document.createElement("script");
    lib.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    lib.onload = async () => {
      S.client = window.supabase.createClient(URL, KEY);
      const { data } = await S.client.auth.getSession();
      await setUser(data.session?.user || null);
      S.client.auth.onAuthStateChange((_e, sess) => setUser(sess?.user || null));
      resolve(S);
    };
    lib.onerror = () => { S.enabled = false; toast("Couldn't load Supabase — check your connection", true); resolve(null); };
    document.head.appendChild(lib);
  });

  async function setUser(u) {
    S.user = u; S.admin = false;
    if (u) { const { data } = await S.client.rpc("is_admin"); S.admin = !!data; }
    S.badge(); if (u) { loadCands(); loadNews(); } else renderLocked();
    window.dispatchEvent(new Event("supa-user"));
  }
  S.badge = () => {
    const c = $("#conn"); if (!c) return;
    c.className = "conn " + (S.admin ? "ok" : "off"); c.style.cursor = "pointer";
    c.textContent = !S.user ? "Sign in to publish" : S.admin ? `Signed in · ${S.user.email}` : `${S.user.email} is not an admin`;
    c.onclick = () => (S.user ? confirm("Sign out?") && S.client.auth.signOut() : $("#loginDlg").showModal());
  };

  // ---------- results ----------
  S.loadResults = async () => {
    const [r, m] = await Promise.all([S.client.from("results").select("body_id,data,updated_at"), S.client.from("meta").select("key,value")]);
    if (r.error || m.error) { toast("Couldn't read results from Supabase", true); return null; }
    const bodies = {}; r.data.forEach((x) => (bodies[x.body_id] = x.data));
    const meta = Object.fromEntries(m.data.map((x) => [x.key, x.value]));
    return { updated: meta.updated || null, turnout: meta.turnout ?? null, bodies, rural: meta.rural || {} };
  };
  S.publish = async (W) => {
    if (!S.user) { $("#loginDlg").showModal(); return { error: "Sign in first" }; }
    if (!S.admin) return { error: `${S.user.email} isn't in the admins table` };
    const now = new Date().toISOString();
    const rows = Object.entries(W.bodies).filter(([id]) => BY[id]).map(([body_id, data]) => ({ body_id, data, updated_at: now }));
    const db = S.client;
    if (rows.length) { const { error } = await db.from("results").upsert(rows); if (error) return { error: error.message }; }
    const { data: existing } = await db.from("results").select("body_id");
    const gone = (existing || []).map((x) => x.body_id).filter((id) => !W.bodies[id]);
    if (gone.length) { const { error } = await db.from("results").delete().in("body_id", gone); if (error) return { error: error.message }; }
    const { error } = await db.from("meta").upsert([{ key: "turnout", value: W.turnout, updated_at: now }, { key: "rural", value: W.rural || {}, updated_at: now }, { key: "updated", value: now, updated_at: now }]);
    if (error) return { error: error.message };
    return { ok: true, updated: now, bodies: rows.length };
  };

  // ---------- login dialog ----------
  document.addEventListener("submit", async (e) => {
    if (e.target.id !== "loginForm") return;
    e.preventDefault();
    const f = new FormData(e.target), err = $("#loginErr"); err.textContent = "";
    const { error } = await S.client.auth.signInWithPassword({ email: String(f.get("email")).trim(), password: String(f.get("password")) });
    if (error) { err.textContent = error.message; return; }
    e.target.reset(); $("#loginDlg").close(); toast("Signed in");
  });

  // ---------- candidates ----------
  let cands = [], cFilter = "";
  const bodyOpts = (sel = "") => ["C", "M", "NP"].map((t) => `<optgroup label="${{ C: "Corporations", M: "Municipalities", NP: "Nagar panchayats" }[t]}">${BODIES.filter((b) => b.type === t).sort((a, c) => a.name.localeCompare(c.name)).map((b) => `<option value="${b.id}" ${b.id === sel ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</optgroup>`).join("");
  function renderLocked() {
    const msg = `<div class="card"><h3>Sign in to manage this</h3><p class="mut small">Click the status badge at the top right, or <button class="btn sm" type="button" onclick="document.getElementById('loginDlg').showModal()">Sign in</button></p></div>`;
    ["#candsPanel", "#newsPanel"].forEach((id) => { const el = $(id); if (el) el.innerHTML = msg; });
  }
  async function loadCands() {
    const { data, error } = await S.client.from("candidates").select("*").order("body_id").order("party");
    if (error) return toast("Couldn't load candidates: " + error.message, true);
    cands = data; renderCands();
  }
  function renderCands() {
    const el = $("#candsPanel"); if (!el) return;
    const list = cands.filter((c) => !cFilter || c.body_id === cFilter);
    el.innerHTML = `<div class="card">
      <h3>Mayor &amp; chairperson candidates</h3>
      <p class="mut small">${cands.length ? `${cands.length} candidates in Supabase. The public site shows these instead of <code>data/candidates.js</code>.` : "Supabase has no candidates yet, so the site still uses <code>data/candidates.js</code>."}
        <button class="btn ghost sm" type="button" id="seedCands">${cands.length ? "Re-import" : "Import"} the ${Object.values(window.AP_CANDIDATES?.bodies || {}).flat().length} names from data/candidates.js</button></p>
      <form id="candForm" class="adm-form">
        <label class="fld">Body <select name="body_id" required>${bodyOpts(cFilter)}</select></label>
        <label class="fld">Party <select name="party">${P.map((p) => `<option>${p}</option>`).join("")}</select></label>
        <label class="fld grow">Name <input name="name" required maxlength="120" /></label>
        <label class="fld grow">Telugu name <input name="name_te" maxlength="120" lang="te" /></label>
        <label class="fld grow">Note <input name="note" maxlength="160" placeholder="Former MLA" /></label>
        <label class="fld">Status <select name="status"><option value="announced">Announced</option><option value="reported">Reported</option></select></label>
        <button class="btn sm" type="submit">Add candidate</button>
      </form>
      <div class="adm-filter"><label class="fld">Show <select id="candFilter"><option value="">All bodies</option>${bodyOpts(cFilter)}</select></label><span class="mut small">${list.length} shown</span></div>
      <div class="tbl-wrap"><table class="full-tbl adm-tbl"><thead><tr><th class="tl">Body</th><th class="tl">Party</th><th class="tl">Name</th><th class="tl">Telugu</th><th class="tl">Note</th><th class="tl">Status</th><th></th></tr></thead><tbody>
      ${list.map((c) => `<tr><td class="tl">${esc(BY[c.body_id]?.name || c.body_id)}</td><td class="tl">${esc(c.party)}</td><td class="tl"><b>${esc(c.name)}</b></td><td class="tl" lang="te">${esc(c.name_te || "")}</td><td class="tl">${esc(c.note || "")}</td>
        <td class="tl"><button class="chip ${c.status === "reported" ? "" : "on"}" type="button" data-cstatus="${c.id}">${c.status}</button></td><td><button class="btn ghost sm" type="button" data-cdel="${c.id}">Delete</button></td></tr>`).join("") || `<tr><td colspan="7" class="empty">No candidates.</td></tr>`}
      </tbody></table></div></div>`;
  }
  async function seedCands() {
    const src = window.AP_CANDIDATES?.bodies || {}, te = window.AP_TE?.names || {};
    const rows = Object.entries(src).flatMap(([body_id, list]) => list.map(([party, name, note, st]) => ({ body_id, party, name, name_te: te[name] || null, note: note || null, status: st === "reported" ? "reported" : "announced" })));
    if (cands.length && !confirm(`Replace all ${cands.length} candidates in Supabase with the ${rows.length} from the file?`)) return;
    if (cands.length) { const { error } = await S.client.from("candidates").delete().gte("id", 0); if (error) return toast(error.message, true); }
    const { error } = await S.client.from("candidates").insert(rows); if (error) return toast(error.message, true);
    toast(`Imported ${rows.length} candidates`); loadCands();
  }

  // ---------- news ----------
  let news = [];
  async function loadNews() {
    const { data, error } = await S.client.from("news").select("*").order("published_on", { ascending: false }).order("id", { ascending: false });
    if (error) return toast("Couldn't load news: " + error.message, true);
    news = data; renderNewsAdmin();
  }
  function renderNewsAdmin() {
    const el = $("#newsPanel"); if (!el) return;
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    el.innerHTML = `<div class="card"><h3>Election news</h3>
      <p class="mut small">${news.length ? `${news.length} items in Supabase, shown on the Overview tab.` : "No news in Supabase yet, so the site still uses <code>data/news.js</code>."}
        <button class="btn ghost sm" type="button" id="seedNews">Import the ${(window.AP_NEWS || []).length} items from data/news.js</button></p>
      <form id="newsForm" class="adm-form">
        <label class="fld">Date <input type="date" name="published_on" value="${today}" required /></label>
        <label class="fld">Tag <select name="tag">${TAGS.map((t) => `<option>${t}</option>`).join("")}</select></label>
        <label class="fld grow">Headline <input name="title" required maxlength="300" /></label>
        <label class="fld grow">Telugu headline <input name="title_te" maxlength="300" lang="te" /></label>
        <label class="fld grow">Source <input name="source" maxlength="80" placeholder="Eenadu" /></label>
        <label class="fld grow">Link <input type="url" name="url" placeholder="https://" /></label>
        <button class="btn sm" type="submit">Add news</button>
      </form>
      <div class="adm-news">${news.map((n) => `<div class="adm-news-it"><span class="mut small">${esc(n.published_on)} · ${esc(n.tag || "")}</span><b>${esc(n.title)}</b>${n.title_te ? `<span lang="te">${esc(n.title_te)}</span>` : ""}<span class="mut small">${esc(n.source || "")} ${n.url ? `· <a href="${esc(n.url)}" target="_blank" rel="noopener">link</a>` : ""}</span><button class="btn ghost sm" type="button" data-ndel="${n.id}">Delete</button></div>`).join("")}</div></div>`;
  }
  async function seedNews() {
    const rows = (window.AP_NEWS || []).map((n) => ({ published_on: n.d, title: n.t, title_te: n.te || null, tag: n.tag || null, source: n.src || null, url: n.url || null }));
    const have = new Set(news.map((n) => n.url)); const fresh = rows.filter((r) => !have.has(r.url));
    if (!fresh.length) return toast("All items are already in Supabase");
    const { error } = await S.client.from("news").insert(fresh); if (error) return toast(error.message, true);
    toast(`Imported ${fresh.length} news items`); loadNews();
  }

  // ---------- events ----------
  document.addEventListener("submit", async (e) => {
    if (e.target.id !== "candForm" && e.target.id !== "newsForm") return;
    e.preventDefault();
    if (!S.admin) return toast("Sign in as an admin first", true);
    const row = Object.fromEntries([...new FormData(e.target)].map(([k, v]) => [k, String(v).trim() || null]));
    const table = e.target.id === "candForm" ? "candidates" : "news";
    const { error } = await S.client.from(table).insert(row);
    if (error) return toast(error.message, true);
    toast(table === "news" ? "News added — live on the site" : `${row.name} added — live on the site`);
    if (table === "news") loadNews(); else { cFilter = row.body_id; loadCands(); }
  });
  document.addEventListener("click", async (e) => {
    const t = e.target;
    if (t.id === "seedCands") return seedCands();
    if (t.id === "seedNews") return seedNews();
    if (t.dataset.cdel) { if (!confirm("Delete this candidate?")) return; const { error } = await S.client.from("candidates").delete().eq("id", t.dataset.cdel); return error ? toast(error.message, true) : loadCands(); }
    if (t.dataset.cstatus) { const c = cands.find((x) => x.id == t.dataset.cstatus); const { error } = await S.client.from("candidates").update({ status: c.status === "reported" ? "announced" : "reported" }).eq("id", c.id); return error ? toast(error.message, true) : loadCands(); }
    if (t.dataset.ndel) { if (!confirm("Delete this news item?")) return; const { error } = await S.client.from("news").delete().eq("id", t.dataset.ndel); return error ? toast(error.message, true) : loadNews(); }
  });
  document.addEventListener("change", (e) => { if (e.target.id === "candFilter") { cFilter = e.target.value; renderCands(); } });
})();
