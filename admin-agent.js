// Admin → AI agent: review what the results agent found, approve or reject it, switch it on/off, manage sources.
// Approving calls the approve_update() database function, which publishes that one body to the live site.
(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, bad) => { const t = $("#toast"); t.textContent = m; t.className = "toast" + (bad ? " bad" : ""); t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), 4200); };
  const BY = Object.fromEntries((window.AP_BODIES || []).map((b) => [b.id, b]));
  const RURAL = { "rural-zptc": ["ZPTC (statewide)", window.AP_RURAL?.zptc], "rural-mptc": ["MPTC (statewide)", window.AP_RURAL?.mptc] };
  const label = (id) => BY[id]?.name || RURAL[id]?.[0] || id;
  const total = (id) => BY[id]?.wards || RURAL[id]?.[1];
  const P = ["TDP", "JSP", "BJP", "NDA", "YSRCP", "INC", "LEFT", "OTH"];
  const time = (t) => (t ? new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—");
  const CONF = { high: ["High", "Confirmed by 2+ sites or the SEC"], medium: ["Medium", "One site, seen in 2+ runs"], low: ["Low", "One site, once"], check: ["Check", "Failed a check — read the issues"] };
  let st = { cfg: null, ups: [], runs: [], srcs: [] }, timer = null;
  const db = () => window.SUPA?.client;

  async function load() {
    const S = window.SUPA, el = $("#agentPanel");
    if (!el) return;
    if (!S?.enabled) { el.innerHTML = `<div class="card"><h3>Connect Supabase first</h3></div>`; return; }
    if (!S.admin) { el.innerHTML = `<div class="card"><h3>Sign in to use the agent</h3><p class="mut small"><button class="btn sm" type="button" onclick="document.getElementById('loginDlg').showModal()">Sign in</button></p></div>`; return; }
    const [c, u, r, s] = await Promise.all([
      db().from("agent_config").select("*").eq("id", 1).maybeSingle(),
      db().from("ai_updates").select("*").eq("status", "pending").order("updated_at", { ascending: false }),
      db().from("agent_runs").select("*").order("started_at", { ascending: false }).limit(8),
      db().from("agent_sources").select("*").order("kind").order("name"),
    ]);
    const err = c.error || u.error || r.error || s.error;
    if (err) { el.innerHTML = `<div class="card"><h3>Agent tables not found</h3><p class="mut small">Run <code>supabase/agent.sql</code> in the Supabase SQL editor, then reload. (${esc(err.message)})</p></div>`; return; }
    st = { cfg: c.data, ups: u.data, runs: r.data, srcs: s.data };
    render();
  }

  const cur = (id) => { const W = window.getAdminResults?.() || {}; return id.startsWith("rural-") ? W.rural?.[id.slice(6)] : W.bodies?.[id]; };
  const seats = (o) => P.filter((p) => o?.[p]).map((p) => `<span class="ag-p">${p} <b>${o[p]}</b></span>`).join("") || `<span class="mut">—</span>`;
  const head = (h) => (h ? `${esc(h.party)} ${h.status === "won" ? "won" : "leading"}${h.name ? " · " + esc(h.name) : ""}${h.margin ? " · by " + Number(h.margin).toLocaleString("en-IN") : ""}` : "—");

  const srcList = (u) => `<details><summary>Sources and quotes (${u.sources.length})</summary>${u.sources.map((s) => `<blockquote><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a> <span class="mut small">${esc(s.kind)}</span><br><span>“${esc(s.quote)}”</span></blockquote>`).join("")}</details>`;
  const btns = (u, editable) => `<div class="ed-btns"><button class="btn sm" type="button" data-ok="${u.id}">Approve &amp; publish</button><button class="btn ghost sm" type="button" data-no="${u.id}">Reject</button>${editable ? `<button class="btn ghost sm" type="button" data-edit="${u.id}">Edit before publishing</button>` : ""}</div>`;
  const iss = (u) => (u.issues?.length ? `<ul class="ag-iss">${u.issues.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "");
  const meta = (u) => `<span class="mut small">${u.confirmations} site${u.confirmations === 1 ? "" : "s"} · seen in ${u.seen_runs} run${u.seen_runs === 1 ? "" : "s"} · ${time(u.updated_at)}</span>`;
  function updateCard(u) {
    const [cl, ct] = CONF[u.confidence], badge = `<span class="ag-conf c-${u.confidence}" title="${ct}">${cl}</span>`;
    const c = cur(u.body_id) || {}, o = u.observed;
    return `<article class="ag-up" data-conf="${u.confidence}">
      <header><b>${esc(label(u.body_id))}</b>${badge}${meta(u)}</header>
      <table class="ag-cmp"><tr><th></th><th>Now on site</th><th>Agent found</th></tr>
        <tr><td>Declared</td><td>${c.declared ?? 0} / ${total(u.body_id) ?? "?"}</td><td><b>${o.declared}</b> / ${total(u.body_id) ?? "?"}</td></tr>
        <tr><td>Won</td><td>${seats(c.wards || c.seats)}</td><td>${seats(o.won)}</td></tr>
        <tr><td>Leading</td><td>${seats(c.leads)}</td><td>${seats(o.leads)}</td></tr>
        ${u.body_id.startsWith("rural-") ? "" : `<tr><td>Head post</td><td>${head(c.head)}</td><td>${head(o.head)}</td></tr>`}</table>
      ${iss(u)}${srcList(u)}${btns(u, !!BY[u.body_id])}
    </article>`;
  }

  function render() {
    const { cfg, ups, runs, srcs } = st, last = runs[0], el = $("#agentPanel");
    const highs = ups.filter((u) => u.confidence === "high").length;
    const tok = runs.slice(0, 1).map((r) => `${(r.input_tokens || 0).toLocaleString("en-IN")} in / ${(r.output_tokens || 0).toLocaleString("en-IN")} out tokens`)[0] || "";
    el.innerHTML = `<div class="ag-grid">
      <div class="card ag-ctl">
        <h3>Results agent</h3>
        <p class="mut small">Every 15 minutes it reads the sources below, asks Claude for ward and Mayor / Chairperson numbers with an exact quote, throws away anything not really on the page, and cross-checks the sites against each other. <b>Nothing goes live until you approve it.</b> Sakshi is never used.</p>
        <label class="demo-sw"><input type="checkbox" id="agOn" ${cfg.enabled ? "checked" : ""}/> <span>Run every 15 minutes</span></label>
        <label class="fld">Stop automatically at <input type="datetime-local" id="agUntil" value="${cfg.active_until ? new Date(new Date(cfg.active_until).getTime() + 330 * 60e3).toISOString().slice(0, 16) : ""}" /></label>
        <label class="fld">Sites that must agree for “High” <select id="agMin">${[1, 2, 3].map((n) => `<option ${n === cfg.min_confirmations ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <label class="fld">Model <select id="agModel">${[["claude-opus-5-5", "Claude Opus 5.5 (most accurate)"], ["claude-sonnet-5-5", "Claude Sonnet 5.5 (cheaper)"]].map(([v, t]) => `<option value="${v}" ${v === cfg.model ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <div class="ag-launch">
          <p class="ag-launch-h">Fetch results now</p>
          <p class="ag-launch-p">Reads every source below right away, instead of waiting for the next 15-minute run.</p>
          <button class="btn ag-go" type="button" id="agRun"><span class="ag-go-orb"></span>Fetch results now</button>
          <button class="btn ghost sm" type="button" id="agReload">Refresh list</button>
        </div>
        <p class="mut small">${last ? `Last run ${time(last.started_at)} · ${last.finished_at ? `${last.proposals} proposal${last.proposals === 1 ? "" : "s"} · ${tok}` : "running…"}${last.error ? ` · <b class="bad">${esc(last.error)}</b>` : ""}` : "Not run yet."}</p>
        ${last?.log ? `<ul class="ag-log">${last.log.map((l) => `<li><b>${esc(l.source)}</b> ${esc(l.status || "")}${l.found ? ` · ${l.found} found` : ""}</li>`).join("")}</ul>` : ""}
        ${last?.dropped?.length ? `<details><summary class="mut small">${last.dropped.length} finding${last.dropped.length === 1 ? "" : "s"} thrown away last run</summary><ul class="ag-log">${last.dropped.map((d) => `<li>${esc(d.source)} · ${esc(label(d.body_id || "?"))}: ${esc(d.why)}</li>`).join("")}</ul></details>` : ""}
      </div>
      <div class="ag-ups">
        <div class="ag-head"><h3>Waiting for approval <span class="mut">(${ups.length})</span></h3>${highs ? `<button class="btn sm" type="button" id="agAllHigh">Approve all ${highs} high-confidence</button>` : ""}</div>
        ${ups.map(updateCard).join("") || `<div class="card"><p class="mut">Nothing waiting. New findings appear here after each run.</p></div>`}
      </div>
    </div>
    <div class="card"><h3>Sources</h3>
      <p class="mut small">On counting day, paste each paper's <b>live results page</b> here — section pages mostly carry headlines. Official = the SEC site; a match from it alone counts as high confidence.</p>
      <form id="agSrcForm" class="adm-form">
        <label class="fld grow">Name <input name="name" required maxlength="60" placeholder="Eenadu live" /></label>
        <label class="fld grow">Page URL <input type="url" name="url" required placeholder="https://" /></label>
        <label class="fld">Kind <select name="kind"><option value="telugu">Telugu news</option><option value="english">English news</option><option value="official">Official (SEC)</option></select></label>
        <button class="btn sm" type="submit">Add source</button>
      </form>
      <div class="tbl-wrap"><table class="full-tbl adm-tbl"><thead><tr><th class="tl">Source</th><th class="tl">Kind</th><th class="tl">Last read</th><th class="tl">Status</th><th></th></tr></thead><tbody>
      ${srcs.map((s) => `<tr><td class="tl"><b>${esc(s.name)}</b><br><a class="small" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a></td><td class="tl">${esc(s.kind)}</td><td class="tl">${time(s.last_fetched_at)}</td><td class="tl small">${esc(s.last_status || "")}</td>
        <td><button class="chip ${s.enabled ? "on" : ""}" type="button" data-sen="${s.id}">${s.enabled ? "On" : "Off"}</button> <button class="btn ghost sm" type="button" data-sdel="${s.id}">Delete</button></td></tr>`).join("")}
      </tbody></table></div></div>`;
  }

  async function approve(id, data) {
    const u = st.ups.find((x) => x.id == id);
    if (u.confidence === "check" && !data && !confirm(`${label(u.body_id)} failed a check:\n\n${u.issues.join("\n")}\n\nPublish anyway?`)) return false;
    const { data: d, error } = await db().rpc("approve_update", { p_id: +id, p_data: data || null });
    if (error) { toast(error.message, true); return false; }
    window.adminApplyApproved?.(u.body_id, d); // keep the "Enter results" copy in step so a later Publish doesn't undo this
    return true;
  }
  function edit(id) {
    const u = st.ups.find((x) => x.id == id);
    const txt = prompt(`Edit the result for ${label(u.body_id)} (JSON). Publishes when you press OK.`, JSON.stringify(u.proposed));
    if (!txt) return;
    let d; try { d = JSON.parse(txt); } catch { return toast("That isn't valid JSON", true); }
    approve(id, d).then((ok) => ok && (toast(`${label(u.body_id)} published`), load()));
  }

  document.addEventListener("click", async (e) => {
    if (!e.target.closest("#agentPanel")) return;
    const t = e.target, ds = t.dataset;
    if (ds.ok) { t.disabled = true; if (await approve(ds.ok)) { toast("Published — live on the site"); load(); } else t.disabled = false; }
    else if (ds.no) { const { error } = await db().rpc("reject_update", { p_id: +ds.no }); error ? toast(error.message, true) : load(); }
    else if (ds.edit) edit(ds.edit);
    else if (t.id === "agAllHigh") {
      const hi = st.ups.filter((u) => u.confidence === "high");
      if (!confirm(`Publish ${hi.length} high-confidence results?\n\n${hi.map((u) => label(u.body_id)).join(", ")}`)) return;
      let n = 0; for (const u of hi) if (await approve(u.id)) n++;
      toast(`Published ${n} results`); load();
    } else if (t.closest("#agRun")) {
      document.getElementById("agentMission").scrollIntoView({ behavior: "smooth", block: "start" });
      window.agentMission?.start();
    } else if (t.id === "agReload") load();
    else if (ds.sen) { const s = st.srcs.find((x) => x.id == ds.sen); const { error } = await db().from("agent_sources").update({ enabled: !s.enabled }).eq("id", s.id); error ? toast(error.message, true) : load(); }
    else if (ds.sdel) { if (!confirm("Delete this source?")) return; const { error } = await db().from("agent_sources").delete().eq("id", ds.sdel); error ? toast(error.message, true) : load(); }
  });
  document.addEventListener("change", async (e) => {
    const t = e.target, patch = t.id === "agOn" ? { enabled: t.checked } : t.id === "agMin" ? { min_confirmations: +t.value } : t.id === "agModel" ? { model: t.value }
      : t.id === "agUntil" ? { active_until: t.value ? new Date(t.value + ":00+05:30").toISOString() : null } : null;
    if (!patch) return;
    const { error } = await db().from("agent_config").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return toast(error.message, true);
    toast(t.id === "agOn" ? (t.checked ? "Agent on — runs every 15 minutes" : "Agent off") : "Saved"); load();
  });
  document.addEventListener("submit", async (e) => {
    if (e.target.id !== "agSrcForm") return;
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target)); f.url = String(f.url).trim();
    if (/sakshi/i.test(f.url)) return toast("Sakshi is not used as a source", true);
    const { error } = await db().from("agent_sources").insert(f);
    if (error) return toast(error.message, true);
    toast(`${f.name} added`); load();
  });

  let paused = false;
  window.agentReload = load;
  window.agentPause = (v) => { paused = v; };
  const onTab = () => {
    clearInterval(timer);
    if (location.hash === "#agent") { load(); timer = setInterval(() => { if (!paused && !document.activeElement?.closest?.("#agentPanel form, #agentPanel select, #agentPanel input")) load(); }, 60000); }
  };
  window.addEventListener("hashchange", onTab);
  window.addEventListener("supa-user", onTab);
  window.SUPA?.ready?.then(onTab);
})();
