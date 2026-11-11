// Overview tab: every local body in one place. Plain tables (no charts).
(() => {
  const { esc, nf, side, e3, COL, load, rural, urban, ZP, rid } = window.LB;
  const root = document.getElementById("ovRoot"); if (!root) return;
  const k3 = (o) => ({ K: (o.TDP || 0) + (o.JSP || 0) + (o.BJP || 0), Y: o.YSRCP || 0, O: o.O || 0 });
  const c3 = (o) => `<span class="lb-n5${o.K ? "" : " z"}" style="color:var(--TDP)">${nf(o.K)}</span><span class="lb-n5${o.Y ? "" : " z"}" style="color:var(--YSRCP)">${nf(o.Y)}</span><span class="lb-n5${o.O ? "" : " z"}" style="color:var(--OTH)">${nf(o.O)}</span>`;
  const s3 = (o) => `<span class="lb-trio"><span style="color:var(--TDP)">${nf(o.K)}</span>·<span style="color:var(--YSRCP)">${nf(o.Y)}</span>·<span style="color:var(--OTH)">${nf(o.O)}</span></span>`;

  function draw(D) {
    const U = urban(), T = U.T, R = rural(D), cols = "minmax(0,1.7fr) minmax(0,.7fr) minmax(0,.7fr) repeat(3,minmax(0,.55fr)) minmax(0,.9fr)";
    const head = (t) => { const o = k3(T.heads[t]), done = T.n[t] - T.pend[t]; return [T.n[t], done, o, T.pend[t] ? `${T.pend[t]} ఎదురుచూపు` : "పూర్తి"]; };
    const rowsA = [
      ["మేయర్లు · Mayors (Municipal Corporations)", ...head("C")],
      ["చైర్‌పర్సన్లు · Municipalities", ...head("M")],
      ["చైర్‌పర్సన్లు · Nagar Panchayats", ...head("NP")],
      ["వార్డు సభ్యులు · Urban ward members", 3942, T.decl.C + T.decl.M + T.decl.NP, { K: T.wards.C.K + T.wards.M.K + T.wards.NP.K, Y: T.wards.C.Y + T.wards.M.Y + T.wards.NP.Y, O: T.wards.C.O + T.wards.M.O + T.wards.NP.O }, null],
      ["జడ్పీటీసీ · ZPTC", R.total.zt, R.total.zd, k3(R.total.z), R.total.zt > R.total.zd ? `${R.total.zt - R.total.zd} ఎదురుచూపు` : "పూర్తి"],
      ["ఎంపీటీసీ · MPTC", R.total.mt, R.total.md, k3(R.total.m), R.total.mt > R.total.md ? `${nf(R.total.mt - R.total.md)} ఎదురుచూపు` : "పూర్తి"],
    ];
    rowsA[3][4] = rowsA[3][1] > rowsA[3][2] ? `${nf(rowsA[3][1] - rowsA[3][2])} ఎదురుచూపు` : "పూర్తి";
    const tableA = `<div class="lb-list lb-a"><div class="lb-row lb-hd" style="--cols:${cols}"><span></span><span class="lb-tot">మొత్తం</span><span class="lb-tot">తేలినవి</span><span class="lb-ph" style="color:var(--TDP)">కూటమి</span><span class="lb-ph" style="color:var(--YSRCP)">వైసీపీ</span><span class="lb-ph" style="color:var(--OTH)">ఇతరులు</span><span class="lb-tot">స్థితి</span></div>
      ${rowsA.map(([n, tot, dec, o, stat]) => `<div class="lb-row" style="--cols:${cols}"><span class="lb-name"><b>${n}</b></span><span class="lb-tot">${nf(tot)}</span><span class="lb-tot">${nf(dec)}</span>${c3(o)}<span class="lb-tot ${stat === "పూర్తి" ? "ok" : "wait"}">${stat}</span></div>`).join("")}
      <div class="lb-row" style="--cols:${cols}"><span class="lb-name"><b>గ్రామ పంచాయతీలు · Gram Panchayats</b><small>సర్పంచ్ · వార్డు సభ్యులు</small></span><span class="lb-tot">${nf(window.AP_RURAL?.gp || 13313)}</span><span class="lb-tot">—</span><span class="lb-n5 z">—</span><span class="lb-n5 z">—</span><span class="lb-n5 z">—</span><span class="lb-tot wait"><a href="#/live">26 నవంబర్ – 2 డిసెంబర్</a></span></div></div>`;
    // district by district: heads, ZPTC, MPTC
    const hd = {}; for (const b of U.rows) { const o = (hd[b.rid] ||= e3()); if (b.headWon) o[side(b.head.party)]++; }
    const dcols = "minmax(0,1.1fr) repeat(3,minmax(0,1fr))", tot = { h: e3(), z: e3(), m: e3() };
    const rowsD = ZP.districts.map(([id, , te]) => {
      const x = R.by[id], h = hd[id] || e3(), z = k3(x.z), m = k3(x.m);
      for (const k of "KYO") { tot.h[k] += h[k]; tot.z[k] += z[k]; tot.m[k] += m[k]; }
      return `<div class="lb-row" style="--cols:${dcols}"><span class="lb-name"><b>${esc(te)}</b></span>${[h, z, m].map((o) => `<span class="lb-c3">${s3(o)}</span>`).join("")}</div>`;
    }).join("");
    const tableD = `<div class="lb-list"><div class="lb-row lb-hd" style="--cols:${dcols}"><span>జిల్లా · District</span><span class="lb-c3">పట్టణ పదవులు<br><small>Urban heads</small></span><span class="lb-c3">జడ్పీటీసీ<br><small>ZPTC</small></span><span class="lb-c3">ఎంపీటీసీ<br><small>MPTC</small></span></div>${rowsD}
      <div class="lb-row lb-sum" style="--cols:${dcols}"><span class="lb-name"><b>మొత్తం · Total</b></span>${[tot.h, tot.z, tot.m].map((o) => `<span class="lb-c3">${s3(o)}</span>`).join("")}</div></div>`;
    root.innerHTML = `<div class="wrap lb"><div class="lb-top"><p class="eyebrow">Andhra Pradesh · Local bodies 2026</p><h2>అన్ని స్థానిక సంస్థలు <span class="lb-en">All local bodies at a glance</span></h2>
      <p class="muted">కూటమి (టీడీపీ + జనసేన + బీజేపీ) · వైసీపీ · ఇతరులు. వివరాలకు <a href="#/local">Local Bodies</a> ట్యాబ్, రాబోయే ఎన్నికలకు <a href="#/live">Live</a> ట్యాబ్.</p></div>
      <h3 class="lb-h">స్థానిక సంస్థల సారాంశం · Summary</h3>${tableA}
      <h3 class="lb-h">జిల్లాల వారీ · District-wise <small>కూటమి · వైసీపీ · ఇతరులు</small></h3>${tableD}</div>`;
  }
  draw({ rural: null }); load().then(draw);
})();
