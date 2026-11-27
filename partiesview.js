// "Parties, symbols & leaders" section on the Overview tab, plus the photo-credit list (credits.html).
(() => {
  const INFO = window.AP_PARTY_INFO || [], CREDITS = window.AP_PHOTO_CREDITS || {}, CAND = window.AP_CANDIDATES || { bodies: {}, ndaSeat: {} };
  const { esc, logo } = window.GECharts;
  const BLOCS = [
    ["nda", "Kutami (NDA)", "కూటమి", "Ruling alliance · 164 of 175 MLAs"],
    ["opp", "Main opposition", "ప్రతిపక్షం", "Contesting alone"],
    ["india", "INDIA bloc", "ఇండియా కూటమి", "Congress and the Left"],
  ];
  const BODY = Object.fromEntries((window.AP_BODIES || []).map((b) => [b.id, b]));

  // mayor posts each party is contesting among the 13 corporations polling now
  function mayorCount(id) {
    return Object.values(BODY).filter((b) => b.type === "C" && (CAND.ndaSeat[b.id] === id || (CAND.bodies[b.id] || []).some((c) => c[0] === id))).length;
  }
  const initials = (n) => { const w = n.replace(/[^A-Za-z ]/g, " ").split(/\s+/).filter(Boolean); return (w[0][0] + w[w.length - 1][0]).toUpperCase(); };

  function card(p) {
    const [simg, sname, ste] = p.symbol, m = mayorCount(p.id);
    const xl = (h) => (h ? `<a class="xh" href="https://x.com/${encodeURIComponent(h)}" target="_blank" rel="noopener" aria-label="${esc(h)} on X"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.2l-4.9-6.3L5.4 21H2.3l7.3-8.3L2 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z"/></svg>@${esc(h)}</a>` : "");
    const leaders = p.leaders.map(([n, role, photo, h]) => `<li>${photo ? `<img src="assets/leaders/${photo}.jpg?v=2" alt="${esc(n)}" loading="lazy" />` : `<span class="ph" aria-hidden="true">${initials(n)}</span>`}<div><b>${esc(n)}</b><small>${esc(role)}</small>${xl(h)}</div></li>`).join("");
    return `<article class="pcard" style="--pc:var(--${p.id})">
      <header>${logo(p.id, "lg")}<div><h3>${esc(p.name)}</h3><span lang="te">${esc(p.te)}</span></div></header>
      <div class="psym"><img src="${simg}" alt="${esc(sname)} symbol" loading="lazy" />${p.symbol2 ? `<img src="${p.symbol2[0]}" alt="${esc(p.symbol2[1])}" loading="lazy" />` : ""}<div><small>Election symbol</small><b>${esc(sname)}</b><span lang="te">${esc(ste)}</span></div></div>
      ${leaders ? `<ul class="pleaders">${leaders}</ul>` : `<p class="muted small">State units led by their respective secretaries; contesting with Congress in the INDIA bloc.</p>`}
      <footer><span><b>${p.seats[0]}</b> MLAs</span><span><b>${p.seats[1]}</b> MPs</span>${m ? `<span><b>${m}</b> of 13 mayor races</span>` : ""}${p.founded ? `<span class="muted">Since ${p.founded}</span>` : ""}</footer>
    </article>`;
  }

  const host = document.getElementById("partyBlocs");
  if (host) host.innerHTML = BLOCS.map(([k, t, te, sub]) => {
    const ps = INFO.filter((p) => p.bloc === k);
    return `<div class="bloc bloc-${k}"><div class="bloc-h"><h3>${t} <span lang="te">${te}</span></h3><p class="muted small">${sub}</p></div><div class="bloc-cards n${ps.length}">${ps.map(card).join("")}</div></div>`;
  }).join("");

  // latest news (static file, replaced by Supabase rows when configured)
  const TAGC = { TDP: "TDP", JSP: "JSP", BJP: "BJP", YSRCP: "YSRCP", INC: "INC", Kutami: "NDA" };
  window.renderNews = (list) => {
    const el = document.getElementById("newsList"); if (!el) return;
    const fmtD = (d) => new Date(d + "T12:00:00+05:30").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    el.innerHTML = [...(list || [])].sort((a, b) => (b.d || "").localeCompare(a.d || "")).map((n) => `<a class="news-item" href="${esc(n.url)}" target="_blank" rel="noopener">
      <div><span class="news-d">${esc(fmtD(n.d))}</span><br /><span class="news-tag" style="--pc:${TAGC[n.tag] ? `var(--${TAGC[n.tag]})` : "#5b6475"}">${esc(n.tag || "News")}</span></div>
      <div><b>${esc(n.t)}</b>${n.te ? `<span class="te" lang="te">${esc(n.te)}</span>` : ""}<span class="news-src">${esc(n.src || "")} ↗</span></div></a>`).join("") || `<p class="muted">No news yet.</p>`;
  };
  window.renderNews(window.AP_NEWS);

  const cr = document.getElementById("photoCredits");
  if (cr) cr.innerHTML = Object.values(CREDITS).map((c) => `<li><a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.file.replace(/_/g, " "))}</a> · ${esc(c.author || "unknown")} · ${esc(c.license)}</li>`).join("");
})();
