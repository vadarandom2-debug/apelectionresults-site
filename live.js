// Public site: read results, candidates and news from Supabase (when configured) and update live.
(() => {
  const URL = window.SUPABASE_URL, KEY = window.SUPABASE_ANON_KEY;
  if (!URL || !KEY) return;
  const lib = document.createElement("script");
  lib.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  lib.onload = init; document.head.appendChild(lib);

  let sb;

  async function loadResults() {
    // summary only: the ward-by-ward lists (most of the bytes) are only used on the live results page
    const [r, m] = await Promise.all([sb.from("results").select("body_id,updated_at,declared:data->declared,wards:data->wards,leads:data->leads,head:data->head,turnout:data->turnout"), sb.from("meta").select("key,value").in("key", ["updated", "rural", "turnout", "agent"])]);
    if (r.error || m.error) return console.warn("Supabase results:", r.error || m.error);
    const bodies = {}; let upd = null;
    r.data.forEach((x) => { bodies[x.body_id] = { declared: x.declared || 0, wards: x.wards || {}, leads: x.leads || {}, head: x.head || null, turnout: x.turnout ?? null }; if (!upd || x.updated_at > upd) upd = x.updated_at; });
    const meta = Object.fromEntries(m.data.map((x) => [x.key, x.value]));
    window.apSetResults?.({ updated: meta.updated || upd, turnout: meta.turnout ?? null, bodies, rural: meta.rural || {} });
    agentPill(meta.agent);
  }
  // "AI agent" status pill in the countdown card (meta.agent is written by the capture-results function)
  let agentInfo = null;
  function agentPill(a) {
    if (a) agentInfo = a;
    a = agentInfo; const card = document.getElementById("countCard");
    if (!a?.at || !card) return;
    let el = document.getElementById("agentPill");
    if (!el) { el = document.createElement("div"); el.id = "agentPill"; el.className = "agent-pill"; card.appendChild(el); }
    const mins = Math.max(0, Math.round((Date.now() - Date.parse(a.at)) / 60000));
    const working = a.state === "working" && mins < 10;
    el.classList.toggle("on", working);
    el.innerHTML = `<span class="ap-radar"><i></i></span><span><b>${working ? "AI agent is scanning sources now" : "AI agent standing watch"}</b><small>${working ? "SEC + trusted newspapers" : `Last check ${mins < 1 ? "just now" : mins < 60 ? mins + " min ago" : new Date(a.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`} · every update approved by a person</small></span>`;
  }
  setInterval(() => agentPill(), 60000);
  async function loadCandidates() {
    const { data, error } = await sb.from("candidates").select("body_id,party,name,name_te,note,status").order("id");
    if (error) return console.warn("Supabase candidates:", error);
    if (!data.length) return; // keep data/candidates.js until the table is seeded
    const g = {};
    data.forEach((c) => {
      (g[c.body_id] = g[c.body_id] || []).push([c.party, c.name, c.note || "", c.status === "reported" ? "reported" : ""]);
      if (c.name_te && window.AP_TE) window.AP_TE.names[c.name] = c.name_te;
    });
    window.AP_CANDIDATES.bodies = g;
    window.apRerender?.();
  }
  async function loadNews() {
    const { data, error } = await sb.from("news").select("published_on,title,title_te,tag,source,url").order("published_on", { ascending: false }).order("id", { ascending: false }).limit(40);
    if (error) return console.warn("Supabase news:", error);
    if (data.length) window.renderNews?.(data.map((n) => ({ d: n.published_on, t: n.title, te: n.title_te, tag: n.tag, src: n.source, url: n.url })));
  }

  // footer visit counter: +1 once per browser session, then show the total
  async function countVisit() {
    let seen = false; try { seen = sessionStorage.getItem("ap-visit") === "1"; } catch {}
    const { data, error } = seen ? await sb.from("site_stats").select("visits").eq("id", 1).maybeSingle() : await sb.rpc("count_visit");
    if (error) return; // table not created yet: keep the counter hidden
    const n = seen ? data?.visits : data; if (n == null) return;
    try { sessionStorage.setItem("ap-visit", "1"); } catch {}
    const el = document.getElementById("visitN"), box = document.getElementById("visits"); if (!el || !box) return;
    box.hidden = false;
    const to = Number(n), t0 = performance.now(), from = Math.max(0, to - 40);
    const step = (t) => { const p = Math.min(1, (t - t0) / 900); el.textContent = Math.round(from + (to - from) * p).toLocaleString("en-IN"); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function init() {
    sb = window.supabase.createClient(URL, KEY, { auth: { persistSession: false } });
    countVisit();
    // The civic results are final and Supabase's free data limit is nearly used up: results, candidates and news load only
    // when a visitor opens a tab other than the live results (the ZPTC / MPTC frame reads its own file), then every 15 minutes.
    let started = false;
    const go = () => { if (started) return; started = true; loadResults(); loadCandidates(); loadNews(); setInterval(() => { if (!document.hidden) loadResults(); }, 900000); };
    const tab = (location.hash.match(/^#\/([\w-]+)/) || [])[1];
    if (location.hash && tab !== "live") go();
    document.addEventListener("tabshow", (e) => { if (e.detail !== "live") go(); });
  }
})();
