// "Unopposed watch" section on the Local Bodies tab (data/unopposed.js).
(() => {
  // election-status alert (data/status.js)
  const H = window.AP_STATUS, ha = document.getElementById("holdAlert");
  if ((H?.paused || H?.notice) && ha) {
    ha.hidden = false; ha.classList.toggle("info", !H.paused);
    ha.innerHTML = `<div class="wrap"><div class="ha-in"><span class="ha-ic" aria-hidden="true">!</span><div><b>${H.title}</b> <span class="ha-te" lang="te">${H.te}</span>
      <p>${H.text}</p><p class="ha-te" lang="te">${H.textTe}</p><p class="ha-src">${H.src.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`).join(" · ")}</p></div></div></div>`;
  }
  const D = window.AP_UNOPPOSED, grid = document.getElementById("uoGrid"); if (!D || !grid) return;
  const REV = new Set(D.review || []);
  const BY = Object.fromEntries((window.AP_BODIES || []).map((b) => [b.id, b]));
  const TE = window.AP_TE || { bodies: {}, names: {} };
  const { esc, logo } = window.GECharts;
  const TYPE = { C: "Corporation", M: "Municipality", NP: "Nagar Panchayat" };
  const ST = { declared: ["Declared", "ప్రకటించారు"], likely: ["Likely", "దాదాపు ఖరారు"], possible: ["Possible", "అవకాశం"] };
  const order = { declared: 0, likely: 1, possible: 2 };
  const items = D.items.filter((x) => BY[x.body]).sort((a, b) => order[a.status] - order[b.status]);
  const n = (s) => items.filter((x) => x.status === s).length;
  const wcount = (x) => x.wards?.length || (x.wardsSplit ? Object.values(x.wardsSplit).reduce((a, n) => a + n, 0) : 0) || x.wardsApprox || 0;
  const wardsDecl = items.filter((x) => x.status === "declared").reduce((a, x) => a + wcount(x), 0);
  const wardsLikely = items.filter((x) => x.status === "likely").reduce((a, x) => a + wcount(x), 0);
  document.getElementById("uoSum").innerHTML = `
    <div><b>${items.filter((x) => x.status === "declared" && x.head).length}</b><span>Chairpersons declared unopposed</span></div>
    <div><b>${window.AP_UNOPPOSED.wardsTotal || wardsDecl}</b><span>wards declared unopposed</span></div>
    ${window.AP_UNOPPOSED.totals ? `<div><b>${window.AP_UNOPPOSED.totals.zptc.total}</b><span>ZPTC seats unopposed</span></div><div><b>${window.AP_UNOPPOSED.totals.mptc.total.toLocaleString("en-IN")}</b><span>MPTC seats unopposed</span></div>` : ""}
    ${n("likely") ? `<div><b>${items.filter((x) => x.status === "likely" && x.head).length} · ${wardsLikely}+</b><span>head posts · wards reported, not yet confirmed</span></div>` : ""}
    ${n("possible") ? `<div><b>${n("possible")}</b><span>towns where YSRCP filed few or no nominations</span></div>` : ""}
    <div><b>${items.filter((x) => x.status === "declared" && !x.head).length}</b><span>more bodies with some wards unopposed</span></div>`;
  if (D.reviewNote) document.getElementById("uoSum").insertAdjacentHTML("afterend", `<p class="uo-note">${esc(D.reviewNote)}</p>`);
  grid.innerHTML = items.map((x) => {
    const b = BY[x.body], [en, te] = ST[x.status];
    const wards = x.wards ? `Wards ${x.wards.join(", ")}` : x.wardsSplit ? `${Object.values(x.wardsSplit).reduce((a, n) => a + n, 0)} wards` : x.wardsApprox ? `about ${x.wardsApprox} wards` : "";
    return `<article class="card uo uo-${x.status}" data-id="${b.id}">
      <header><span class="uo-st">${en} <small lang="te">${te}</small></span>${x.party ? `<span class="uo-p">${logo(x.party)}</span>` : ""}</header>
      <h3>${esc(b.name)} <small lang="te">${esc(TE.bodies[b.id] || "")}</small></h3>
      <p class="muted small">${TYPE[b.type]} · ${esc(b.district)} · ${b.wards} wards${wards ? ` · <b>${esc(wards)}</b>` : ""}</p>
      ${x.wardsSplit ? `<p class="uo-split">${Object.entries(x.wardsSplit).map(([p, n]) => `<span>${logo(p)}<b>${n}</b></span>`).join("")}</p>` : ""}
      ${REV.has(b.id) ? `<p class="uo-rev">Under SEC review <small lang="te">ఎస్‌ఈసీ సమీక్షలో</small></p>` : ""}
      ${x.head ? `<p class="uo-head">${logo(x.head.party)}<span><b>${esc(x.head.name)}</b> · ${b.type === "C" ? "Mayor" : "Chairperson"} — ${x.status === "declared" ? "elected unopposed" : "only candidate left"}</span></p>` : ""}
      <p class="uo-t">${esc(x.text)}</p>
      <p class="uo-te" lang="te">${esc(x.te || "")}</p>
      <p class="uo-src small">${x.src.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join(" · ")}</p>
    </article>`;
  }).join("");
})();
