// Local Bodies tab: urban bodies, ZPTC and MPTC results as plain tables, by district or by assembly constituency.
(() => {
  const { esc, nf, p5, PN, COL, load, rural, acs, acExtra, urban, ZP, dTe, e5 } = window.LB;
  const root = document.getElementById("lbRoot"); if (!root) return;
  const P5 = ["TDP", "JSP", "BJP", "YSRCP", "O"], TYPE = { C: "Corporation", M: "Municipality", NP: "Nagar Panchayat" };
  const st = { tab: "zptc", view: "district", q: "", uq: "" };
  let D = null; // { rural, ac, pend }
  const th5 = () => P5.map((p) => `<span class="lb-ph" style="color:${COL[p]}">${PN[p][0]}</span>`).join("");
  const c5 = (o) => P5.map((p) => `<span class="lb-n5${o[p] ? "" : " z"}" style="color:${COL[p]}">${nf(o[p])}</span>`).join("");
  const chip = (p) => `<span class="lb-chip" style="--c:${COL[p5(p)]}">${esc(PN[p5(p)][0])}</span>`;
  const sum5 = (o) => P5.reduce((a, p) => a + o[p], 0);
  const tName = (d, m, en) => ZP.te?.[`${d}/${m}`] || en;

  // ---------- ZPTC / MPTC by district ----------
  function districtView(kind, R) {
    const isZ = kind === "zptc", T = R.total, cols = "minmax(0,1.5fr) repeat(5,minmax(0,.5fr)) minmax(0,.7fr)";
    const row = (x) => `<details class="lb-d"><summary class="lb-row" style="--cols:${cols}"><span class="lb-name"><b>${esc(x.te)}</b><small>${esc(x.name)}</small></span>${c5(isZ ? x.z : x.m)}<span class="lb-tot">${nf(isZ ? x.zd : x.md)}<small>/${nf(isZ ? x.zt : x.mt)}</small></span></summary>${isZ ? zMandals(x) : mMandals(x)}</details>`;
    return `<div class="lb-list"><div class="lb-row lb-hd" style="--cols:${cols}"><span>జిల్లా · District</span>${th5()}<span class="lb-tot">తేలినవి</span></div>
      ${R.list.map(row).join("")}
      <div class="lb-row lb-sum" style="--cols:${cols}"><span class="lb-name"><b>మొత్తం · Total</b></span>${c5(isZ ? T.z : T.m)}<span class="lb-tot">${nf(isZ ? T.zd : T.md)}<small>/${nf(isZ ? T.zt : T.mt)}</small></span></div></div>`;
  }
  function zMandals(x) {
    const M = D.rural?.mandals || {}, uo = ZP.unopposed || {};
    const rows = (ZP.mandals[x.id] || []).map(([mid, en]) => {
      const k = `${x.id}/${mid}`, z = M[k]?.z;
      return `<tr><td>${esc(tName(x.id, mid, en))}</td><td>${z ? esc(z.name || "—") : "—"}</td><td>${z ? chip(z.party) : `<span class="lb-wait">ఎదురుచూపు</span>`}</td><td>${uo[k] && z ? `<span class="lb-uo">ఏకగ్రీవం</span>` : ""}</td></tr>`;
    }).join("");
    return `<div class="lb-scroll"><table class="lb-tbl"><thead><tr><th>మండలం · Mandal</th><th>జడ్పీటీసీ విజేత · Winner</th><th>పార్టీ</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function mMandals(x) {
    const M = D.rural?.mandals || {};
    const rows = (ZP.mandals[x.id] || []).map(([mid, en]) => {
      const k = `${x.id}/${mid}`, m = M[k]?.m, o = e5(); for (const [p, n] of Object.entries(m?.won || {})) o[p5(p)] += n;
      const tot = ZP.mptcN?.[k] || 0;
      return `<tr><td>${esc(tName(x.id, mid, en))}</td>${P5.map((p) => `<td class="num${o[p] ? "" : " z"}" style="color:${COL[p]}">${o[p]}</td>`).join("")}<td class="num"><b>${m?.declared || 0}</b>${tot ? `<small>/${tot}</small>` : ""}</td></tr>`;
    }).join("");
    return `<div class="lb-scroll"><table class="lb-tbl"><thead><tr><th>మండలం · Mandal</th>${P5.map((p) => `<th style="color:${COL[p]}">${PN[p][0]}</th>`).join("")}<th>తేలినవి</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  // ---------- assembly constituency view ----------
  function acView(kind) {
    const isZ = kind === "zptc", cols = "minmax(0,1.6fr) minmax(0,1fr) repeat(5,minmax(0,.45fr)) minmax(0,.6fr)";
    return `<div class="lb-find"><input id="lbQ" type="search" value="${esc(st.q)}" placeholder="నియోజకవర్గం / జిల్లా వెతకండి · Search constituency or district" aria-label="Search" /></div>
      <div class="lb-list"><div class="lb-row lb-hd" style="--cols:${cols}"><span>నియోజకవర్గం · Constituency</span><span>జిల్లా</span>${th5()}<span class="lb-tot">మొత్తం</span></div><div id="lbAc"></div></div>`;
  }
  function acRows(kind) {
    const isZ = kind === "zptc", cols = "minmax(0,1.6fr) minmax(0,1fr) repeat(5,minmax(0,.45fr)) minmax(0,.6fr)", q = st.q.trim().toLowerCase();
    const all = acs(D), list = all.filter((a) => !q || `${a.no} ${a.en} ${a.te} ${a.ds.join(" ")} ${a.ds.map((x) => dTe[x] || "").join(" ")}`.toLowerCase().includes(q));
    const T = e5(); let tt = 0, td = 0, none = 0;
    const rows = list.map((a) => { const o = isZ ? a.z : a.m; for (const p of P5) T[p] += o[p]; tt += isZ ? a.zt : a.mt; td += sum5(o); const nn = !(isZ ? a.zt : a.mt); if (nn) none++;
      return `<div class="lb-row${nn ? " lb-none" : ""}" style="--cols:${cols}"><span class="lb-name"><b>${a.no ? a.no + ". " : ""}${esc(a.te)}</b><small>${esc(a.en)}${nn ? ` · ${isZ ? "జడ్పీటీసీ" : "ఎంపీటీసీ"} స్థానాలు లేవు` : ""}</small></span><span class="lb-dn">${esc(a.ds.map((x) => dTe[x] || x).join(" / "))}</span>${nn ? P5.map(() => `<span class="lb-n5 z">–</span>`).join("") + `<span class="lb-tot">–</span>` : c5(o) + `<span class="lb-tot">${nf(sum5(o))}<small>/${nf(isZ ? a.zt : a.mt)}</small></span>`}</div>`; }).join("");
    const ex = acExtra(D).map((e) => `${esc(e.te || e.en)} (${esc(e.en)}) — ${isZ ? `జడ్పీటీసీ ${e.z.t}` : `ఎంపీటీసీ ${e.m.t}`}`).filter(() => true);
    const note = `<p class="lb-note">${list.length === all.length ? `${list.length} నియోజకవర్గాలు` : `${list.length} / ${all.length}`}${none ? ` · వీటిలో ${none} నియోజకవర్గాల్లో ${isZ ? "జడ్పీటీసీ" : "ఎంపీటీసీ"} స్థానాలు లేవు (ఎక్కువగా పట్టణ నియోజకవర్గాలు)` : ""}.${ex.length ? ` ETV ఈ స్థానాలను అధికారిక జాబితాలో లేని పేరుతో నమోదు చేసింది, కాబట్టి పై వరుసల్లో లేవు, రాష్ట్ర/జిల్లా మొత్తాల్లో ఉన్నాయి: ${ex.join("; ")}.` : ""}</p>`;
    return (rows || `<p class="lb-empty">ఏదీ దొరకలేదు · Nothing found</p>`) + (list.length ? `<div class="lb-row lb-sum" style="--cols:${cols}"><span class="lb-name"><b>మొత్తం</b></span><span></span>${c5(T)}<span class="lb-tot">${nf(td)}<small>/${nf(tt)}</small></span></div>` : "") + note;
  }

  // ---------- urban ----------
  function urbanView(U) {
    const T = U.T, hcols = "minmax(0,1.6fr) repeat(5,minmax(0,.5fr)) minmax(0,.6fr)";
    const hrow = (n, t) => `<div class="lb-row" style="--cols:${hcols}"><span class="lb-name"><b>${n}</b></span>${c5(T.heads[t])}<span class="lb-tot">${T.pend[t] ? `<span class="lb-wait">${T.pend[t]} ఎదురుచూపు</span>` : "—"}</span></div>`;
    const all = e5(); for (const t of ["C", "M", "NP"]) for (const p of P5) all[p] += T.heads[t][p];
    const wcols = "minmax(0,1.6fr) repeat(3,minmax(0,.7fr)) minmax(0,.9fr)", W = { K: 0, Y: 0, O: 0 }; let wd = 0, wt = 0;
    const wrow = (n, t) => { for (const k in W) W[k] += T.wards[t][k]; wd += T.decl[t]; wt += T.nw[t]; const w = T.wards[t]; return `<div class="lb-row" style="--cols:${wcols}"><span class="lb-name"><b>${n}</b></span><span class="lb-n5" style="color:var(--TDP)">${nf(w.K)}</span><span class="lb-n5" style="color:var(--YSRCP)">${nf(w.Y)}</span><span class="lb-n5" style="color:var(--OTH)">${nf(w.O)}</span><span class="lb-tot">${nf(T.decl[t])}<small>/${nf(T.nw[t])}</small></span></div>`; };
    const wr = wrow("కార్పొరేషన్లు · Corporations", "C") + wrow("మున్సిపాలిటీలు · Municipalities", "M") + wrow("నగర పంచాయతీలు · Nagar Panchayats", "NP");
    const byD = {}; for (const b of U.rows) (byD[b.rid] ||= []).push(b);
    const dcols = "minmax(0,1.5fr) repeat(5,minmax(0,.5fr)) minmax(0,.7fr)";
    const q = st.uq.trim().toLowerCase();
    const dist = ZP.districts.filter(([id]) => byD[id]).map(([id, name, te]) => {
      let bs = byD[id]; if (q) bs = bs.filter((b) => `${b.name} ${b.district} ${b.head?.name || ""}`.toLowerCase().includes(q)); if (!bs.length) return "";
      const h = e5(), w = { K: 0, Y: 0, O: 0 }; for (const b of byD[id]) { if (b.headWon) h[b.hp]++; for (const k in w) w[k] += b.w[k]; }
      return `<details class="lb-d" ${q ? "open" : ""}><summary class="lb-row" style="--cols:${dcols}"><span class="lb-name"><b>${esc(te)}</b><small>${byD[id].length} bodies</small></span>${c5(h)}<span class="lb-tot">${nf(w.K)}·${nf(w.Y)}·${nf(w.O)}</span></summary>
        <div class="lb-scroll"><table class="lb-tbl"><thead><tr><th>పట్టణం · Body</th><th>రకం</th><th>మేయర్ / చైర్‌పర్సన్</th><th>పార్టీ</th><th>వార్డులు · కూటమి·వైసీపీ·ఇత</th></tr></thead><tbody>
        ${bs.map((b) => `<tr><td><b>${esc(window.AP_TE?.bodies?.[b.id] || b.name)}</b><small>${esc(b.name)}</small></td><td>${TYPE[b.type]}</td><td>${b.head?.name ? esc(b.head.name) : "—"}${b.head && !b.headWon ? ` <span class="lb-wait">ముందంజ</span>` : ""}</td><td>${b.head?.party ? chip(b.head.party) : `<span class="lb-wait">ఎదురుచూపు</span>`}</td><td class="num"><span style="color:var(--TDP)">${b.w.K}</span>·<span style="color:var(--YSRCP)">${b.w.Y}</span>·<span style="color:var(--OTH)">${b.w.O}</span><small>${b.declared}/${b.wards}</small></td></tr>`).join("")}</tbody></table></div></details>`;
    }).join("");
    return `<h3 class="lb-h">మేయర్ / చైర్‌పర్సన్ పదవులు · Heads won <small>${nf(sum5(all))} of ${U.rows.length}</small></h3>
      <div class="lb-list"><div class="lb-row lb-hd" style="--cols:${hcols}"><span></span>${th5()}<span class="lb-tot">మిగిలినవి</span></div>${hrow("కార్పొరేషన్లు · Corporations (" + T.n.C + ")", "C")}${hrow("మున్సిపాలిటీలు · Municipalities (" + T.n.M + ")", "M")}${hrow("నగర పంచాయతీలు · Nagar Panchayats (" + T.n.NP + ")", "NP")}<div class="lb-row lb-sum" style="--cols:${hcols}"><span class="lb-name"><b>మొత్తం · Total</b></span>${c5(all)}<span class="lb-tot">${U.rows.length - sum5(all) || "—"}</span></div></div>
      <h3 class="lb-h">వార్డు సభ్యులు · Ward members</h3>
      <div class="lb-list"><div class="lb-row lb-hd" style="--cols:${wcols}"><span></span><span class="lb-ph" style="color:var(--TDP)">కూటమి</span><span class="lb-ph" style="color:var(--YSRCP)">వైసీపీ</span><span class="lb-ph" style="color:var(--OTH)">ఇతరులు</span><span class="lb-tot">తేలినవి</span></div>${wr}<div class="lb-row lb-sum" style="--cols:${wcols}"><span class="lb-name"><b>మొత్తం · Total</b></span><span class="lb-n5" style="color:var(--TDP)">${nf(W.K)}</span><span class="lb-n5" style="color:var(--YSRCP)">${nf(W.Y)}</span><span class="lb-n5" style="color:var(--OTH)">${nf(W.O)}</span><span class="lb-tot">${nf(wd)}<small>/${nf(wt)}</small></span></div></div>
      <h3 class="lb-h">జిల్లాల వారీ · District-wise <small>మేయర్ / చైర్‌పర్సన్ పదవులు · వార్డులు (కూటమి·వైసీపీ·ఇతరులు)</small></h3>
      <div class="lb-find"><input id="lbUq" type="search" value="${esc(st.uq)}" placeholder="పట్టణం / జిల్లా వెతకండి · Search town or district" aria-label="Search" /></div>
      <div class="lb-list"><div class="lb-row lb-hd" style="--cols:${dcols}"><span>జిల్లా</span>${th5()}<span class="lb-tot">వార్డులు</span></div>${dist || `<p class="lb-empty">ఏదీ దొరకలేదు · Nothing found</p>`}</div>`;
  }

  // ---------- page ----------
  function summary(kind, R) {
    const isZ = kind === "zptc", o = isZ ? R.total.z : R.total.m, dec = isZ ? R.total.zd : R.total.md, tot = isZ ? R.total.zt : R.total.mt, K = o.TDP + o.JSP + o.BJP;
    return `<div class="lb-sumstrip"><div><small>కూటమి · Kutami</small><b style="color:var(--TDP)">${nf(K)}</b><i>టీడీపీ ${nf(o.TDP)} · జనసేన ${nf(o.JSP)} · బీజేపీ ${nf(o.BJP)}</i></div><div><small>వైసీపీ · YSRCP</small><b style="color:var(--YSRCP)">${nf(o.YSRCP)}</b></div><div><small>ఇతరులు · Others</small><b style="color:var(--OTH)">${nf(o.O)}</b></div><div><small>తేలినవి · Declared</small><b>${nf(dec)}</b><i>of ${nf(tot)} seats${tot > dec ? ` · ${nf(tot - dec)} ఎదురుచూపు` : ""}</i></div></div>`;
  }
  function draw() {
    const tabs = [["urban", "పట్టణాలు", "Urban"], ["zptc", "జడ్పీటీసీ", "ZPTC"], ["mptc", "ఎంపీటీసీ", "MPTC"]];
    let body = "";
    if (!D) body = `<p class="lb-empty">లోడ్ అవుతోంది… · Loading…</p>`;
    else if (st.tab === "urban") body = urbanView(urban());
    else {
      const R = rural(D), toggle = `<div class="lb-seg" role="group" aria-label="View"><button type="button" data-v="district" aria-pressed="${st.view === "district"}">జిల్లాల వారీ · District-wise</button><button type="button" data-v="ac" aria-pressed="${st.view === "ac"}">నియోజకవర్గాల వారీ · Assembly constituency-wise</button></div>`;
      body = summary(st.tab, R) + toggle + (st.view === "ac" ? acView(st.tab) : districtView(st.tab, R));
    }
    root.innerHTML = `<div class="wrap lb"><div class="lb-top"><p class="eyebrow">Andhra Pradesh · Local bodies 2026</p><h2>స్థానిక సంస్థల ఫలితాలు <span class="lb-en">Local body results</span></h2>
      <p class="muted">పట్టణ ఎన్నికల ఓట్ల లెక్కింపు 3 నవంబర్, జడ్పీటీసీ · ఎంపీటీసీ 7 నవంబర్. గ్రామ పంచాయతీ ఎన్నికలు ఇంకా జరగాల్సి ఉన్నాయి — <a href="#/live">Live tab</a> చూడండి.</p></div>
      <div class="lb-tabs" role="tablist">${tabs.map(([k, te, en]) => `<button type="button" role="tab" data-t="${k}" aria-selected="${st.tab === k}">${te} <small>${en}</small></button>`).join("")}</div><div id="lbBody">${body}</div></div>`;
    if (D && st.tab !== "urban" && st.view === "ac") { const el = document.getElementById("lbAc"); if (el) el.innerHTML = acRows(st.tab); }
  }
  root.addEventListener("click", (e) => {
    const t = e.target.closest("[data-t]"); if (t) { st.tab = t.dataset.t; draw(); return; }
    const v = e.target.closest("[data-v]"); if (v) { st.view = v.dataset.v; draw(); }
  });
  root.addEventListener("input", (e) => {
    if (e.target.id === "lbQ") { st.q = e.target.value; document.getElementById("lbAc").innerHTML = acRows(st.tab); }
    if (e.target.id === "lbUq") { st.uq = e.target.value; const pos = e.target.selectionStart; draw(); const i = document.getElementById("lbUq"); i.focus(); i.setSelectionRange(pos, pos); }
  });
  draw(); load().then((d) => { D = d; draw(); });
})();
