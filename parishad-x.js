// A more visual layer for the ZPTC / MPTC page (parishad-x.html): tug-of-war bars, the ZP Chairperson and MPP race,
// a seat mosaic of the state (every seat a dot, each district a cluster where it lies on the map) and a "just in" ticker.
// Reads everything from window.PZ (parishad.js); redrawn on every data refresh through window.PZ_fx.
(() => {
  const P = window.PZ, $ = (s) => document.querySelector(s);
  const { DIST, COL, SIDES, nf, sum, bySide, mandal, mName, pName } = P;
  const ZP = window.AP_ZP, MN = ZP.mptcN || {};
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const SYM = { K: "assets/parties/kutami.png", Y: "assets/symbols/ysrcp-fan.png" };
  const half = (n) => Math.floor(n / 2) + 1;

  // ---------- tug of war ----------
  // TV9's statewide "ahead" figure is shown only while it is recent and not below the seats already declared
  const tvFresh = (t) => { const v = P.TV9; if (!v?.mptc || !v.at) return false; const m = String(v.at).match(/^(\d{1,2}):(\d{2}) ([AP])M$/); if (!m) return false;
    let h = +m[1] % 12 + (m[3] === "P" ? 12 : 0); const ist = new Date(Date.now() + 5.5 * 3600e3), mins = ist.getUTCHours() * 60 + ist.getUTCMinutes() - (h * 60 + +m[2]);
    const s = bySide(t.seats); return mins >= 0 && mins <= 30 && v.mptc.K >= s.K && v.mptc.Y >= s.Y; };
  function tug(t, label, key) {
    const s = bySide(t.seats), l = bySide(t.leads), T = t.total, pc = (n) => (n / T) * 100;
    const kut = ["TDP", "JSP", "BJP"].map((p) => [p, t.seats[p] || 0]).filter(([, n]) => n);
    return `<div class="xt"><div class="xt-h"><b>${label}</b><span>${nf(t.declared)} / ${nf(T)} తేలాయి</span></div>
      <div class="xt-n"><div class="k"><img src="${SYM.K}" alt=""><b>${nf(s.K)}</b><span>కూటమి${l.K ? ` <em>+${nf(l.K)}</em>` : ""}</span>${!t.seats.NDA && kut.length ? `<small>${kut.map(([p, n]) => `${pName(p)} ${nf(n)}`).join(" · ")}</small>` : ""}</div>
        <div class="y"><b>${nf(s.Y)}</b><span>వైసీపీ${l.Y ? ` <em>+${nf(l.Y)}</em>` : ""}</span><img src="${SYM.Y}" alt="">${s.O ? `<small>ఇతరులు ${nf(s.O)}</small>` : ""}</div></div>
      ${key === "mptc" ? (tvFresh(t) ? `<p class="xt-tv"><b>ముందంజలో</b> (తేలినవి + ఆధిక్యం, ${esc(P.TV9.at || "")} నాటికి): <span class="k">కూటమి ${nf(P.TV9.mptc.K)}</span> · <span class="y">వైసీపీ ${nf(P.TV9.mptc.Y)}</span></p>` : `<p class="xt-tv">ఎంపీటీసీల్లో ఆధిక్యం ఇంకా అందుబాటులో లేదు: తేలిన స్థానాలు మాత్రమే</p>`) : ""}<div class="xt-bar"><i class="k" style="width:${pc(s.K)}%"></i><i class="kl" style="width:${pc(l.K)}%"></i><u></u><i class="ol" style="width:${pc(l.O)}%"></i><i class="o" style="width:${pc(s.O)}%"></i><i class="yl" style="width:${pc(l.Y)}%"></i><i class="y" style="width:${pc(s.Y)}%"></i><b class="mid"></b></div></div>`;
  }

  // ---------- who gets the chairs ----------
  // A ZP Chairperson needs a majority of that district's ZPTCs; an MPP a majority of the mandal's MPTCs.
  function race(all) {
    const zp = DIST.map((d, i) => { const t = all[i].zptc, s = bySide(t.seats), l = bySide(t.leads), need = half(t.total), side = SIDES.map(([k]) => k).find((k) => s[k] >= need);
      const ahead = SIDES.map(([k]) => k).sort((a, b) => s[b] + l[b] - (s[a] + l[a]))[0]; return { d, side, ahead: s[ahead] + l[ahead] ? ahead : null, need, have: side ? s[side] : s[ahead] || 0 }; });
    const mpp = { K: 0, Y: 0, O: 0, open: 0 };
    for (const d of DIST) for (const m of d.mandals) { if (m[2]) continue; const n = MN[d.id + "/" + m[0]]; if (!n) { mpp.open++; continue; } const s = bySide(mandal(d.id, m).m.won || {}), side = SIDES.map(([k]) => k).find((k) => s[k] >= half(n)); side ? mpp[side]++ : mpp.open++; }
    const zc = { K: 0, Y: 0, O: 0 }; zp.forEach((x) => x.side && zc[x.side]++);
    const mTot = mpp.K + mpp.Y + mpp.O + mpp.open, w = (n) => (n / mTot) * 100;
    return `<section class="xr"><h2>పీఠాలు ఎవరికి? <small>మెజారిటీ స్థానాలు గెలిస్తేనే జడ్పీ చైర్‌పర్సన్, ఎంపీపీ పదవి</small></h2>
      <div class="xr-g"><div class="xr-c"><p class="xr-k">జడ్పీ చైర్‌పర్సన్ పీఠాలు <small>28 జిల్లా పరిషత్‌లు</small></p>
        <p class="xr-big">${SIDES.map(([k, n]) => `<span style="--c:${COL[k]}"><b>${zc[k]}</b>${n}</span>`).join("")}<span><b>${28 - zc.K - zc.Y - zc.O}</b>తేలాల్సినవి</span></p>
        <div class="xr-zp">${zp.map((x) => `<button type="button" data-xd="${x.d.id}" class="${x.side ? "won" : x.ahead ? "ahead" : ""}" style="--c:${COL[x.side || x.ahead] || "#d6d6cf"}" title="${esc(x.d.name)}"><b>${esc(x.d.te)}</b><span>${x.have}/${x.need}</span></button>`).join("")}</div>
        <p class="xr-note">నిండు రంగు = మెజారిటీ ఖాయం · లేత రంగు = ఆధిక్యం · సంఖ్య = గెలిచినవి / మెజారిటీకి కావాల్సినవి</p></div>
      <div class="xr-c"><p class="xr-k">ఎంపీపీ పీఠాలు <small>${nf(mTot)} మండలాలు</small></p>
        <p class="xr-big">${SIDES.map(([k, n]) => `<span style="--c:${COL[k]}"><b>${nf(mpp[k])}</b>${n}</span>`).join("")}<span><b>${nf(mpp.open)}</b>తేలాల్సినవి</span></p>
        <div class="xr-bar">${SIDES.map(([k]) => `<i style="width:${w(mpp[k])}%;background:${COL[k]}"></i>`).join("")}</div>
        <p class="xr-note">మండలంలోని ఎంపీటీసీల్లో సగానికి పైగా గెలిచిన పక్షానికే ఎంపీపీ పీఠం (ఏకగ్రీవాలతో కలిపి)</p></div></div></section>`;
  }

  // ---------- seat mosaic: a tile map of the state ----------
  // [row, column] of each district on a 6-column grid that follows the map (north at the top, the coast on the right)
  const GRID = { "parvathipuram-manyam": [0, 4], srikakulam: [0, 5], "alluri-sitharama-raju": [1, 3], vizianagaram: [1, 4], visakhapatnam: [1, 5],
    polavaram: [2, 2], "east-godavari": [2, 3], kakinada: [2, 4], anakapalli: [2, 5], ntr: [3, 1], eluru: [3, 2], "west-godavari": [3, 3], "dr-b-r-ambedkar-konaseema": [3, 4],
    palnadu: [4, 1], guntur: [4, 2], krishna: [4, 3], kurnool: [5, 0], nandyal: [5, 1], markapuram: [5, 2], bapatla: [5, 3],
    anantapur: [6, 0], kadapa: [6, 1], prakasam: [6, 2], "sri-sathya-sai": [7, 0], annamayya: [7, 1], nellore: [7, 2], chittoor: [8, 1], tirupati: [8, 2] };
  let kind = "zptc", built = false, prev = {}, flash = {};
  function counts(a) { // dots in order: Kutami won, Kutami leading, others, YSRCP leading, YSRCP won, awaited
    const t = a[kind], s = bySide(t.seats), l = bySide(t.leads);
    return [[s.K, COL.K, 1], [l.K, COL.K, .4], [s.O, COL.O, 1], [l.O, COL.O, .4], [l.Y, COL.Y, .4], [s.Y, COL.Y, 1], [Math.max(0, t.total - s.K - s.Y - s.O - l.K - l.Y - l.O), "#3b4a66", 1]];
  }
  function mosaic(all) {
    const box = $("#xMap");
    if (!built) { box.innerHTML = DIST.map((d) => { const [r, c] = GRID[d.id] || [0, 0]; return `<button type="button" class="xm-t" data-xd="${d.id}" style="grid-row:${r + 1};grid-column:${c + 1}"><canvas></canvas><b>${esc(d.te)}</b><span></span></button>`; }).join(""); built = true; }
    const now = Date.now();
    DIST.forEach((d, i) => {
      const el = box.querySelector(`[data-xd="${d.id}"]`), cv = el.querySelector("canvas"), a = all[i], t = a[kind], cs = counts(a), n = t.total;
      const W = cv.clientWidth || 50, dpr = window.devicePixelRatio || 1, cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols), g = W / cols, H = rows * g;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + "px";
      const x = cv.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0);
      let k = 0; const r = Math.max(.6, g * (n > 100 ? .42 : .38));
      for (const [cnt, col, al] of cs) for (let j = 0; j < cnt && k < n; j++, k++) { x.globalAlpha = al; x.fillStyle = col; x.beginPath(); x.arc((k % cols + .5) * g, (Math.floor(k / cols) + .5) * g, r, 0, 7); x.fill(); }
      x.globalAlpha = 1;
      const s = bySide(t.seats), key = kind + d.id, sig = `${s.K}|${s.Y}|${s.O}`, lead = s.K > s.Y && s.K > s.O ? "K" : s.Y > s.K && s.Y > s.O ? "Y" : s.O > s.K && s.O > s.Y ? "O" : "";
      if (prev[key] && prev[key] !== sig) flash[key] = now + 8000; prev[key] = sig;
      el.classList.toggle("fresh", flash[key] > now); el.style.setProperty("--c", lead ? COL[lead] : "#3b4a66");
      el.querySelector("span").innerHTML = `<i style="color:#f5c400">${nf(s.K)}</i>·<i style="color:#7fb0ff">${nf(s.Y)}</i>${s.O ? `·<i>${nf(s.O)}</i>` : ""}<small>/${nf(n)}</small>`;
    });
  }

  // ---------- just in ----------
  let seen = null; const news = [];
  function ticker() {
    const items = [];
    for (const d of DIST) for (const m of d.mandals) { const z = mandal(d.id, m).z; if (z?.status === "won") items.push({ k: "z" + d.id + m[0], t: `<b>${esc(mName(d.id, m))}</b> <small>${esc(d.te)}</small> జడ్పీటీసీ · <i style="--c:${COL[z.party] || COL.OTH}"></i>${pName(z.party)}${z.unopposed ? " ఏకగ్రీవం" : " గెలుపు"}${z.name ? ` · ${esc(z.name)}` : ""}` }); }
    if (seen) for (const it of items) if (!seen.has(it.k)) news.unshift({ ...it, fresh: Date.now() }); // declared since the page opened
    seen = new Set(items.map((i) => i.k)); news.splice(12);
    const list = [...news.map((n) => ({ ...n, t: "⚡ " + n.t })), ...items.filter((i) => !news.some((n) => n.k === i.k))];
    const el = $("#xTick"); if (!list.length) { el.hidden = true; return; } el.hidden = false;
    const html = list.slice(0, 60).map((i) => `<span>${i.t}</span>`).join("");
    el.querySelector(".xk-in").innerHTML = html + html; el.style.setProperty("--dur", Math.max(40, list.slice(0, 60).length * 4) + "s");
  }

  function draw(S, all) {
    S ||= P.state(); all ||= DIST.map(P.district); kind = P.kind;
    $("#xTug").innerHTML = tug(S.zptc, "జడ్పీటీసీ", "zptc") + tug(S.mptc, "ఎంపీటీసీ", "mptc");
    $("#xRace").innerHTML = race(all);
    document.querySelectorAll("[data-xk]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.xk === kind));
    mosaic(all); ticker();
  }
  document.addEventListener("click", (e) => { const k = e.target.closest("[data-xk]"); if (k) { P.setKind(k.dataset.xk); } const d = e.target.closest("[data-xd]"); if (d) P.openDistrict(d.dataset.xd); });
  addEventListener("resize", () => draw());
  window.PZ_fx = draw;
  document.fonts?.ready.then(() => draw()); draw();
})();
