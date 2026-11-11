// Insights tab: Kutami vs YSRCP head to head, the alliance partners' shares, split verdicts (head post to one side,
// ward majority to the other), the Anantapur story, rebels who won, and the district picture. Inline SVG / CSS only.
(() => {
  const { BODIES, rec, bName, pName, nf, side, esc, TE } = window.CD, { COL, MAYORS, TOWNS } = window.CD_simple, $ = (s) => document.querySelector(s);
  const BY = Object.fromEntries(BODIES.map((b) => [b.id, b])), KC = COL.TDP, YC = COL.YSRCP, OC = COL.OTH;
  const sideCol = { K: KC, Y: YC, O: OC }, sideName = { K: "కూటమి", Y: "వైఎస్సార్‌సీపీ", O: "ఇతరులు" };
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  const AC_ALIAS = { yelamanchili: [32], gooty: [150], nidadavolu: [55], jangareddygudem: [67], gollaprolu: [37], samalkot: [39], yeleswaram: [36], vuyyuru: [78], kondapalli: [82], betamcherla: [141], dachepalli: [100], gurazala: [100], piduguralla: [100], chimakurthi: [107], buchireddypalem: [116], naidupeta: [121], puttur: [170], akividu: [60], pulivendula: [129], yerraguntla: [131] };
  const nk = (x) => String(x).toLowerCase().replace(/\(.*\)/, "").replace(/[^a-z]/g, "").replace(/^greater/, "");
  function acsOf(b) {
    const AC = window.GE_AC || []; if (AC_ALIAS[b.id]) return AC.filter((a) => AC_ALIAS[b.id].includes(a.no));
    const k = nk(b.name), d = b.district.toLowerCase().slice(0, 4);
    return AC.filter((a) => { const n = nk(a.n); return (n.startsWith(k) || k.startsWith(n)) && (a.nd || a.d).toLowerCase().slice(0, 4) === d; }).concat([]).filter((a, i, l) => l.length < 6 || i < 6);
  }
  // 2024: alliance (TDP+JSP+BJP) and YSRCP vote %, averaged over the town's constituencies (top two candidates only)
  function y2024(b) {
    const acs = acsOf(b); if (!acs.length) return null; let k = 0, y = 0;
    for (const a of acs) { const r = a.y["2024"]; for (const [p, pc] of [[r[0], r[2]], [r[4], r[6]]]) { if (side(p) === "K") k += pc; else if (p === "YSRCP") y += pc; } }
    return { k: k / acs.length, y: y / acs.length, ac: acs.map((a) => a.n).join(", "), win: acs.map((a) => a.y["2024"][0]) };
  }

  function facts() {
    const f = { heads: { K: 0, Y: 0, O: 0 }, headsC: { K: 0, Y: 0, O: 0 }, wards: { K: 0, Y: 0, O: 0 }, part: {}, partHeads: {}, split: [], dist: {}, yBest: [] };
    for (const b of BODIES) {
      const r = rec(b), h = r.head, ws = { K: 0, Y: 0, O: 0 };
      for (const [p, n] of Object.entries(r.wards || {})) { ws[side(p)] += n; f.wards[side(p)] += n; if (side(p) === "K") f.part[p] = (f.part[p] || 0) + n; }
      const d = (f.dist[b.district] ||= { K: 0, Y: 0, O: 0 }); for (const k in ws) d[k] += ws[k];
      if (h && h.status === "won") { const s = side(h.party); f.heads[s]++; if (b.type === "C") f.headsC[s]++; if (s === "K") f.partHeads[h.party] = (f.partHeads[h.party] || 0) + 1; }
      const tot = ws.K + ws.Y + ws.O, maj = ws.K > ws.Y && ws.K > ws.O ? "K" : ws.Y > ws.K && ws.Y > ws.O ? "Y" : "O";
      if (h && tot && ws.K !== ws.Y && side(h.party) !== maj) f.split.push({ b, h, ws, maj });
      if (tot && ws.Y) f.yBest.push({ b, n: ws.Y, of: tot });
    }
    f.yBest.sort((a, c) => c.n / c.of - a.n / a.of);
    // per party: wards, share, head posts, best town; and town-level 2024 vs 2026
    const allW = Object.values(f.wards).reduce((a, n) => a + n, 0) || 1;
    f.party = ["TDP", "JSP", "BJP", "YSRCP", "OTH"].map((p) => {
      let w = 0, heads = 0, best = null; for (const b of BODIES) { const r = rec(b), n = p === "OTH" ? (r.wards?.OTH || 0) + (r.wards?.LEFT || 0) + (r.wards?.INC || 0) : r.wards?.[p] || 0, tot = Object.values(r.wards || {}).reduce((a, x) => a + x, 0); w += n; if (r.head?.status === "won" && (p === "OTH" ? side(r.head.party) === "O" : r.head.party === p)) heads++; if (tot && n && (!best || n / tot > best.s)) best = { b, s: n / tot }; }
      return { p, w, share: (w / allW) * 100, heads, best, v24: p === "OTH" ? (window.GE_VOTES?.A2024 ? window.GE_VOTES.A2024.OTH + window.GE_VOTES.A2024.INC + window.GE_VOTES.A2024.LEFT : 0) : window.GE_VOTES?.A2024?.[p] || 0, s24: (window.GE_AC || []).filter((a) => (p === "OTH" ? side(a.y["2024"][0]) === "O" : a.y["2024"][0] === p)).length };
    });
    f.cmp = [];
    for (const b of BODIES) { const r = rec(b), tot = Object.values(r.wards || {}).reduce((a, x) => a + x, 0), v = y2024(b); if (!tot || !v) continue; const k = ["TDP", "JSP", "BJP", "NDA"].reduce((a, p) => a + (r.wards?.[p] || 0), 0); f.cmp.push({ b, v, k26: (k / tot) * 100, y26: ((r.wards?.YSRCP || 0) / tot) * 100 }); }
    f.cmp.forEach((c) => (c.dy = c.y26 - c.v.y));
    f.flip = { YK: 0, KK: 0, YY: 0, KY: 0, n: 0 };
    for (const b of BODIES) { const was = window.AP_2021?.[b.id]?.[1], h = rec(b).head; if (!was || !h || h.status !== "won") continue; const k = (side(was) === "Y" ? "Y" : "K") + (side(h.party) === "Y" ? "Y" : "K"); if (k in f.flip) { f.flip[k]++; f.flip.n++; } }
    f.big = BODIES.map((b) => ({ b, h: rec(b).head })).filter(({ h }) => h?.status === "won" && h.margin && !h.unopposed).sort((a, c) => c.h.margin - a.h.margin).slice(0, 8);
    return f;
  }

  // big head-to-head bar: two colours meeting where the share splits
  const versus = (t, k, y, o, unit) => `<div class="iv"><p class="iv-t">${t}</p><div class="iv-bar"><b style="flex:${k};background:${KC}"></b><b style="flex:${o};background:${OC}"></b><b style="flex:${y};background:${YC}"></b></div>
    <div class="iv-n"><span style="color:#8a6a00">కూటమి <b>${nf(k)}</b> <small>${pct(k, k + y + o)}%</small></span><span>ఇతరులు ${nf(o)}</span><span style="color:${YC}"><small>${pct(y, k + y + o)}%</small> <b>${nf(y)}</b> వైసీపీ</span></div><p class="iv-u">${unit}</p></div>`;

  // alliance share: one donut per partner split
  function partners(part) {
    const ps = ["TDP", "JSP", "BJP"], tot = ps.reduce((a, p) => a + (part[p] || 0), 0) || 1, C = 2 * Math.PI * 60; let at = 0;
    const segs = ps.map((p) => { const L = ((part[p] || 0) / tot) * C, s = `<circle r="60" cx="80" cy="80" fill="none" stroke="${COL[p]}" stroke-width="30" stroke-dasharray="${L} ${C}" stroke-dashoffset="${-at}" transform="rotate(-90 80 80)"/>`; at += L; return s; }).join("");
    return `<div class="ip"><svg viewBox="0 0 160 160">${segs}<text x="80" y="78" text-anchor="middle" class="big">${nf(tot)}</text><text x="80" y="98" text-anchor="middle" class="sm">కూటమి వార్డులు</text></svg>
      <ul>${ps.map((p) => `<li><i style="background:${COL[p]}"></i><b>${pName(p)}</b> ${nf(part[p] || 0)} <small>${pct(part[p] || 0, tot)}%</small></li>`).join("")}</ul></div>`;
  }

  // women heads: every (W)/Women-reserved post plus women who won open seats (by name, 4 Nov 2026)
  const WOMEN_OPEN = ["tadipatri", "chittoor", "yemmiganur", "tiruvuru", "ongole", "madakasira", "badvel"];
  function women() {
    const all = BODIES.filter((b) => rec(b).head?.status === "won"), isW = (b) => /W/.test(b.res) || WOMEN_OPEN.includes(b.id);
    const w = all.filter(isW), C = all.filter((b) => b.type === "C"), byP = {};
    for (const b of w) { const s = side(rec(b).head.party); byP[s] = (byP[s] || 0) + 1; }
    return { all, w, res: w.filter((b) => /W/.test(b.res)).length, open: w.filter((b) => !/W/.test(b.res)), C: C.length, wC: C.filter(isW).length, byP, isW };
  }
  function womenCard() {
    const x = women(), n = x.all.length, k = x.w.length, P = pct(k, n), WC = "#c2185b";
    const cells = [...x.all].sort((a, b) => x.isW(b) - x.isW(a) || (/W/.test(b.res) - /W/.test(a.res))).map((b) => `<i title="${esc(bName(b))}" style="background:${x.isW(b) ? (/W/.test(b.res) ? WC : "#f06292") : "#dcdcd4"}"></i>`).join("");
    return `<section class="ic wm"><p class="ik">మహిళా శక్తి</p><h3>పుర పీఠాల్లో సగానికి పైగా మహిళలే</h3>
      <div class="wm-top"><div class="wm-big"><b>${P}%</b><span>${n} మేయర్, చైర్‌పర్సన్ పదవుల్లో <em>${k}</em> మహిళలు</span></div><div class="wm-grid">${cells}</div></div>
      <p class="db-k"><span><i style="background:${WC}"></i>మహిళా రిజర్వ్ (${x.res})</span><span><i style="background:#f06292"></i>జనరల్/బీసీ సీటులో గెలిచిన మహిళ (${x.open.length})</span><span><i style="background:#dcdcd4"></i>పురుషులు (${n - k})</span></p>
      <div class="vs"><div><b>${x.wC}/${x.C}</b><span>కార్పొరేషన్ మేయర్లు మహిళలు</span></div><div><b>${x.byP.K || 0}</b><span>కూటమి మహిళా అధ్యక్షులు</span></div><div><b>${x.byP.Y || 0}</b><span>వైసీపీ మహిళా అధ్యక్షులు</span></div></div>
      <p class="in">50% రిజర్వేషన్ ద్వారా ${x.res} పదవులు మహిళలకు దక్కగా, మరో ${x.open.length} మంది — ${x.open.map((b) => esc(bName(b))).join(", ")} — మహిళా రిజర్వేషన్ లేని సీట్లలోనూ గెలిచారు. చట్టం ఇచ్చిన సగం వాటాను దాటి మహిళలు ${P}% పీఠాలు సాధించారు.</p></section>`;
  }

  function render() {
    const el = $("#ins"); if (!el) return;
    const f = facts(), an = BY.anantapur && rec(BY.anantapur), aw = an?.wards || {};
    const aK = ["TDP", "JSP", "BJP", "NDA"].reduce((a, p) => a + (aw[p] || 0), 0), aY = aw.YSRCP || 0, aO = (aw.OTH || 0) + (aw.LEFT || 0) + (aw.INC || 0);
    const R = window.AP_REBELS || [], rebBy = R.reduce((o, r) => ((o[r[2]] = (o[r[2]] || 0) + 1), o), {}), rmax = Math.max(1, ...Object.values(rebBy));
    const dists = Object.entries(f.dist).filter(([, d]) => d.K + d.Y + d.O).sort((a, c) => (c[1].Y / (c[1].K + c[1].Y + c[1].O)) - (a[1].Y / (a[1].K + a[1].Y + a[1].O)));
    el.innerHTML = `
      <section class="ic hero"><p class="ik">ఒక్క మాటలో</p><h2>కూటమి క్లీన్ స్వీప్ — ${f.heads.K + f.heads.Y + f.heads.O} పదవుల్లో ${f.heads.K} కూటమివి</h2>
        <p>${nf(f.heads.K + f.heads.Y + f.heads.O)} మేయర్, చైర్‌పర్సన్ పదవుల్లో కూటమి ${f.heads.K}, వైఎస్సార్‌సీపీ ${f.heads.Y}, ఇతరులు ${f.heads.O}. 13 కార్పొరేషన్లలో 12 కూటమివి; వైసీపీకి దక్కిన ఏకైక మేయర్ అనంతపురం.</p></section>
      <section class="ic">${versus("మేయర్ + చైర్‌పర్సన్ పదవులు", f.heads.K, f.heads.Y, f.heads.O, "గెలిచిన పదవులు")}${versus("వార్డులు, డివిజన్లు", f.wards.K, f.wards.Y, f.wards.O, "గెలిచిన స్థానాలు")}</section>
      ${womenCard()}
      <section class="ic"><h3>పార్టీల వారీ పనితీరు <small>2026 పుర ఫలితాలు vs 2024 అసెంబ్లీ</small></h3><div class="pp">${f.party.map((x) => `<div style="--c:${COL[x.p]}"><b>${pName(x.p)}</b>
          <div class="pp-n"><span><em>${nf(x.w)}</em> వార్డులు</span><span><em>${x.heads}</em> పదవులు</span></div>
          <div class="pp-bars"><span>2026 వార్డుల వాటా</span><u><i style="width:${Math.min(100, x.share)}%"></i></u><small>${x.share.toFixed(1)}%</small><span>2024 అసెంబ్లీ ఓట్లు</span><u><i class="o" style="width:${Math.min(100, x.v24)}%"></i></u><small>${x.v24.toFixed(1)}%</small></div>
          <p>2024లో ${x.s24} అసెంబ్లీ సీట్లు${x.best ? ` · బలమైన పట్టణం: ${esc(bName(x.best.b))} (${Math.round(x.best.s * 100)}%)` : ""}</p></div>`).join("")}</div>
        <p class="in">${(() => { const P = Object.fromEntries(f.party.map((x) => [x.p, x])); return `టీడీపీ 2024లో ${P.TDP.v24.toFixed(0)}% ఓట్లతో ఉంటే, 2026 పుర వార్డుల్లో ${P.TDP.share.toFixed(0)}% గెలుచుకుంది. జనసేన ${P.JSP.v24.toFixed(1)}% ఓట్ల పార్టీ అయినా ${P.JSP.share.toFixed(1)}% వార్డులు, ${P.JSP.heads} పదవులు సాధించింది — పోటీ చేసిన చోట్ల బలంగా నిలిచింది. వైసీపీ 2024లో ${P.YSRCP.v24.toFixed(0)}% ఓట్లు తెచ్చుకున్నా పుర వార్డుల్లో ${P.YSRCP.share.toFixed(0)}%కే పరిమితమైంది.`; })()}</p>
        <p class="in">గమనిక: 2026 సంఖ్య గెలిచిన వార్డుల వాటా, 2024 సంఖ్య అసెంబ్లీ ఓట్ల శాతం — ఇవి నేరుగా ఒకే కొలత కావు, ధోరణిని చూపుతాయి.</p></section>
      <section class="ic"><h3>అదే ప్రాంతాల్లో 2024 vs 2026 <small>ప్రతి పట్టణం: 2024 అసెంబ్లీలో వైసీపీ ఓట్ల % → 2026లో వైసీపీ గెలిచిన వార్డుల %</small></h3>
        ${(() => { const c = f.cmp, down = c.filter((x) => x.dy < 0).length, sorted = [...c].sort((a, b2) => b2.dy - a.dy), show = [...sorted.slice(0, 6), ...sorted.slice(-6)];
          return `<div class="vs"><div><b>${down}</b><span>పట్టణాల్లో వైసీపీ 2024 కంటే వెనకబడింది</span></div><div><b>${c.length - down}</b><span>పట్టణాల్లో 2024 కంటే మెరుగు</span></div></div>
          <div class="db"><p class="db-k"><span><i class="o"></i>2024 వైసీపీ ఓట్లు</span><span><i></i>2026 వైసీపీ వార్డులు</span></p>${show.map((x, i) => `${i === 6 ? `<p class="db-sep">అత్యధికంగా పడిపోయినవి</p>` : i === 0 ? `<p class="db-sep">వైసీపీ నిలదొక్కుకున్నవి</p>` : ""}<div class="db-r"><span>${esc(bName(x.b))}</span><div class="db-t"><i class="o" style="left:${x.v.y}%"></i><i style="left:${x.y26}%"></i><b style="left:${Math.min(x.v.y, x.y26)}%;width:${Math.abs(x.dy)}%;background:${x.dy < 0 ? "#c4122f" : "#128c4b"}"></b></div><em style="color:${x.dy < 0 ? "#c4122f" : "#128c4b"}">${x.dy > 0 ? "+" : ""}${x.dy.toFixed(0)}</em></div>`).join("")}</div>
          <p class="in">${c.length} పట్టణాలను వాటి 2024 అసెంబ్లీ నియోజకవర్గాలతో పోల్చాం. 2024లో వైసీపీ గెలిచిన 11 అసెంబ్లీ సీట్లలోని పట్టణాలు — పులివెందుల, దర్శి, బద్వేల్, రాజంపేట, పుంగనూరు — అన్నీ ఈసారి కూటమివే; వీటిలో చాలాచోట్ల వైసీపీ అభ్యర్థులే బరిలో లేక వార్డులు ఏకగ్రీవమయ్యాయి. నందికొట్కూరు, బేతంచెర్ల, నంద్యాల వంటి కర్నూలు-నంద్యాల పట్టణాల్లో మాత్రం వైసీపీ 2024 కంటే మెరుగ్గా నిలిచింది.</p>`; })()}</section>
      <section class="ic"><h3>కూటమిలో ఎవరి వాటా ఎంత?</h3>${partners(f.part)}
        <p class="in">పదవుల్లో: ${["TDP", "JSP", "BJP"].map((p) => `${pName(p)} <b>${f.partHeads[p] || 0}</b>`).join(" · ")}. టీడీపీ వెన్నెముక; జనసేన గోదావరి జిల్లాల్లో, బీజేపీ కొన్ని రాయలసీమ పట్టణాల్లో బలం చూపాయి.</p></section>
      <section class="ic story"><p class="ik">ప్రత్యేక కథనం</p><h3>అనంతపురం: వార్డులు కూటమికి, మేయర్ వైసీపీకి — ఎందుకు?</h3>
        <div class="ss"><div><span>వార్డులు</span><div class="iv-bar"><b style="flex:${aK};background:${KC}"></b><b style="flex:${aO};background:${OC}"></b><b style="flex:${aY};background:${YC}"></b></div><small>కూటమి ${aK} · ఇతరులు ${aO} · వైసీపీ ${aY}</small></div>
        <div><span>మేయర్</span><div class="iv-bar"><b style="flex:1;background:${YC}"></b></div><small>వైసీపీ — చిట్లూరు రమేష్ గౌడ్</small></div></div>
        <ol><li><b>అభ్యర్థి టీడీపీ కాదు, బీజేపీ.</b> మేయర్ సీటును టీడీపీ ఆశించినా, సీట్ల సర్దుబాటులో చివరి నిమిషంలో బీజేపీకి వెళ్లింది (కోట్ల అజేష్ బాబు). క్షేత్రస్థాయి టీడీపీ శ్రేణుల్లో ఉత్సాహం తగ్గిందన్న విశ్లేషణ.</li>
        <li><b>ఓటర్లు రెండు బ్యాలెట్లు వేరుగా వేశారు.</b> ఈసారి మేయర్‌ను ప్రజలే నేరుగా ఎన్నుకున్నారు. వార్డులో తమ కార్పొరేటర్‌కు కూటమికి, మేయర్‌కు వైసీపీకి ఓటు వేసిన స్ప్లిట్ ఓటింగ్ ఫలితం ఇది.</li>
        <li><b>మైనారిటీ ఓట్లు.</b> బీజేపీ గుర్తుపై మైనారిటీ ఓటర్లు దూరమయ్యారని, ఆ ఓట్లు వైసీపీకి చేరాయని కథనాలు.</li>
        <li><b>బీసీ అభ్యర్థి, స్థానిక బలం.</b> బీసీ (జనరల్) రిజర్వ్ సీటులో వైసీపీ స్థానికంగా పేరున్న రమేష్ గౌడ్‌ను నిలిపింది.</li>
        <li><b>కూటమిలో సమన్వయ లోపం, ఘర్షణలు.</b> బీజేపీ మేనిఫెస్టోను వైసీపీ ప్రచారాస్త్రం చేసుకోవడం, ప్రచారంలో ఘర్షణలు కూటమికి నష్టం చేశాయని విశ్లేషణ. డివిజన్ 57లో టీడీపీ రెబల్ కూడా గెలిచారు.</li></ol>
        <p class="in">పాఠం: నేరుగా ఎన్నికయ్యే మేయర్ పదవికి వార్డుల మెజారిటీ సరిపోదు — అభ్యర్థి, పార్టీ గుర్తు కీలకం.</p></section>
      <section class="ic"><h3>స్ప్లిట్ తీర్పులు <small>పదవి ఒకరికి, వార్డుల మెజారిటీ మరొకరికి</small></h3>
        ${f.split.map(({ b, h, ws }) => `<div class="sp"><b>${esc(bName(b))}</b><span class="tg" style="background:${sideCol[side(h.party)]}">పదవి: ${pName(h.party)}</span><div class="iv-bar sm"><b style="flex:${ws.K};background:${KC}"></b><b style="flex:${ws.O};background:${OC}"></b><b style="flex:${ws.Y};background:${YC}"></b></div><small>వార్డులు: కూటమి ${ws.K} · వైసీపీ ${ws.Y} · ఇతరులు ${ws.O}</small></div>`).join("") || `<p class="in">ఏవీ లేవు</p>`}</section>
      <section class="ic"><h3>గెలిచిన రెబల్స్ <small>సొంత పార్టీ అభ్యర్థిపై పోటీ చేసి గెలిచినవారు</small></h3>
        <div class="rb">${Object.entries(rebBy).sort((a, c) => c[1] - a[1]).map(([p, n]) => `<div><span>${pName(p)} రెబల్స్</span><i style="width:${(n / rmax) * 100}%;background:${COL[p]}"></i><b>${n}</b></div>`).join("")}</div>
        <div class="rl">${R.map(([id, no, p, n, post]) => `<div style="--c:${COL[p]}"><b>${esc(n)}</b><span>${esc(bName(BY[id]))} · ${post ? "చైర్‌పర్సన్" : (BY[id].type === "C" ? "డివిజన్ " : "వార్డు ") + no}</span><em>${pName(p)} రెబల్</em></div>`).join("")}</div>
        <p class="in">టీడీపీ రెబల్స్ ${rebBy.TDP || 0}, జనసేన ${rebBy.JSP || 0}, వైసీపీ ${rebBy.YSRCP || 0}, బీజేపీ ${rebBy.BJP || 0}. ఆదోని చైర్‌పర్సన్ పదవిని జనసేన రెబల్ స్వప్న నాయకర్, నెల్లిమర్ల చైర్‌పర్సన్ పదవిని టీడీపీ రెబల్ లెంక అప్పలనాయుడు గెలుచుకున్నారు. పిఠాపురంలో రెండు వైపులా రెబల్స్ గెలిచారు.</p></section>
      <section class="ic"><h3>2021 → 2026: ఎంత మారింది? <small>${f.flip.n} పట్టణాల్లో 2021 విజేతతో పోలిక</small></h3>
        <div class="fl"><div style="--c:${YC}"><b>${f.flip.YK}</b><span>వైసీపీ నుంచి కూటమికి</span></div><div style="--c:${KC}"><b>${f.flip.KK}</b><span>కూటమి (టీడీపీ) నిలుపుకుంది</span></div><div style="--c:${YC}"><b>${f.flip.YY}</b><span>వైసీపీ నిలుపుకుంది</span></div><div style="--c:${KC}"><b>${f.flip.KY}</b><span>కూటమి నుంచి వైసీపీకి</span></div></div>
        <p class="in">2021లో దాదాపు అన్ని పుర పీఠాలు వైసీపీవి. ఐదేళ్లలో పట్టణ ఓటరు పూర్తిగా వైపు మార్చాడు.</p></section>
      <section class="ic"><h3>అతిపెద్ద మెజారిటీలు <small>మేయర్ / చైర్‌పర్సన్ గెలుపు తేడా</small></h3><div class="ds">${f.big.map(({ b, h }) => `<div><span>${esc(bName(b))}</span><div class="iv-bar sm"><b style="flex:${h.margin};background:${COL[h.party] || OC}"></b><b style="flex:${f.big[0].h.margin - h.margin};background:#e3e3dc"></b></div><em>${nf(h.margin)}${h.marginPlus ? "+" : ""}</em></div>`).join("")}</div></section>
      <section class="ic"><h3>జిల్లాల వారీ: వైసీపీ ఎక్కడ నిలిచింది?</h3><div class="ds">${dists.map(([d, x]) => { const t = x.K + x.Y + x.O; return `<div><span>${esc(TE.districts?.[d] || d)}</span><div class="iv-bar sm"><b style="flex:${x.K};background:${KC}"></b><b style="flex:${x.O};background:${OC}"></b><b style="flex:${x.Y};background:${YC}"></b></div><em>${pct(x.Y, t)}%</em></div>`; }).join("")}</div>
        <p class="in">కుడివైపు శాతం = ఆ జిల్లా వార్డుల్లో వైసీపీ వాటా. పైన ఉన్నవి వైసీపీకి బలమైనవి.</p></section>
      <section class="ic news"><p class="ik">నేటి వార్తల్లో · 4 నవంబర్</p><h3>ఫలితాల తర్వాత ఏం జరుగుతోంది?</h3><ul>
        <li><b>వైసీపీ రిగ్గింగ్ ఆరోపణలు:</b> నామినేషన్ల నుంచి లెక్కింపు వరకు అక్రమాలు జరిగాయని, పోలింగ్ శాతాన్ని తారుమారు చేశారని జగన్ ఆరోపించారు. 3 నవంబర్ "బ్లాక్ డే" అని వైసీపీ నేతలు అన్నారు. ఈ ఆరోపణలు ఇంకా నిర్ధారణ కాలేదు.</li>
        <li><b>కూటమి స్పందన:</b> ఇది సంబరాలకు కాదు, సేవ చేయడానికి ఇచ్చిన తీర్పు అని, రెండున్నరేళ్ల పాలనకు ప్రజల ఆశీర్వాదమని లోకేశ్ అన్నారు.</li>
        <li><b>పెద్ద నగరాల్లో వైసీపీ కనుమరుగు:</b> విశాఖ, విజయవాడ, గుంటూరుల్లో వైసీపీ రెండంకెల డివిజన్లకే పరిమితమైంది. కుప్పంలో 32కి 32 కూటమివే.</li>
        <li><b>కడప కోటకు బీటలు:</b> వైఎస్ కుటుంబ సొంత జిల్లా కడపలోనూ కార్పొరేషన్, మున్సిపాలిటీలన్నీ కూటమివే; పులివెందులలోనూ టీడీపీ చైర్‌పర్సన్.</li>
        <li><b>తుపాను మధ్య లెక్కింపు:</b> మురసు తుపాను వర్షాల వల్ల కొన్నిచోట్ల లెక్కింపు ఆలస్యమైంది; విజయవాడ, ఒంగోలు ఫలితాలు అర్ధరాత్రి దాటాక వచ్చాయి.</li>
        <li><b>తర్వాత ఏంటి:</b> డిప్యూటీ మేయర్, వైస్ చైర్‌పర్సన్ ఎన్నికలు 5–6 నవంబర్‌న కొత్త వార్డు సభ్యుల ద్వారా. ఎంపీటీసీ, జడ్పీటీసీ పోలింగ్ 5 నవంబర్, లెక్కింపు 7 నవంబర్.</li></ul></section>
      <section class="ic"><h3>వైసీపీ బలమైన పట్టణాలు</h3><div class="ds">${f.yBest.slice(0, 10).map(({ b, n, of }) => `<div><span>${esc(bName(b))}</span><div class="iv-bar sm"><b style="flex:${n};background:${YC}"></b><b style="flex:${of - n};background:#e3e3dc"></b></div><em>${n}/${of}</em></div>`).join("")}</div></section>`;
  }
  window.CD_insights = render;
  document.addEventListener("click", (e) => { if (e.target.closest('[data-tab="insights"]')) setTimeout(render, 0); });
  setInterval(() => { if (!$("#tab-insights")?.hidden) render(); }, 60000);
  render();
})();
