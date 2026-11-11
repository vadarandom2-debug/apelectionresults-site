// Shared data for the Local Bodies, Overview and Live (upcoming) tabs. Plain numbers and tables, no charts.
// Rural: live/rural.json (per mandal), live/ac.json (per assembly constituency), live/pending.json (seats still awaited).
// Urban: data/ulb-results.js (saved results of the 100 municipal bodies).
(() => {
  const ZP = window.AP_ZP, BODIES = window.AP_BODIES || [], ULB = (window.AP_ULB || {}).bodies || {};
  const KUT = ["TDP", "JSP", "BJP", "NDA"];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = (n) => Number(n || 0).toLocaleString("en-IN");
  const side = (p) => (KUT.includes(p) ? "K" : p === "YSRCP" ? "Y" : "O");
  const p5 = (p) => (["TDP", "JSP", "BJP", "YSRCP"].includes(p) ? p : "O"); // the five columns shown for rural seats
  const e5 = () => ({ TDP: 0, JSP: 0, BJP: 0, YSRCP: 0, O: 0 });
  const e3 = () => ({ K: 0, Y: 0, O: 0 });
  const PN = { TDP: ["టీడీపీ", "TDP"], JSP: ["జనసేన", "JSP"], BJP: ["బీజేపీ", "BJP"], YSRCP: ["వైసీపీ", "YSRCP"], O: ["ఇతరులు", "Others"], K: ["కూటమి", "Kutami"], Y: ["వైసీపీ", "YSRCP"] };
  const COL = { TDP: "var(--TDP)", JSP: "var(--JSP)", BJP: "var(--BJP)", YSRCP: "var(--YSRCP)", O: "var(--OTH)", K: "var(--TDP)", Y: "var(--YSRCP)" };
  const get = async (u) => { try { const r = await fetch(`${u}?t=${Math.floor(Date.now() / 60000)}`, { cache: "no-store" }); return r.ok ? await r.json() : null; } catch { return null; } };
  let pending = null;
  const load = () => (pending ||= Promise.all([get("live/rural.json"), get("live/ac.json"), get("live/pending.json")]).then(([rural, ac, pend]) => ({ rural, ac, pend })));
  const dTe = Object.fromEntries((ZP?.districts || []).map(([id, name, te]) => [id, te]));
  // the urban list names districts differently from the rural list
  const RID = { Ananthapuramu: "anantapur", Konaseema: "dr-b-r-ambedkar-konaseema", "SPS Nellore": "nellore", "YSR Kadapa": "kadapa" };
  const rid = (name) => RID[name] || String(name).toLowerCase().replace(/[^a-z]+/g, "-");

  // ZPTC / MPTC by district and mandal
  function rural(d) {
    const D = {}; for (const [id, name, te, zt, mt] of ZP.districts) D[id] = { id, name, te, zt, mt, z: e5(), m: e5(), zd: 0, md: 0 };
    for (const [k, v] of Object.entries(d?.rural?.mandals || {})) {
      const x = D[k.split("/")[0]]; if (!x) continue;
      if (v.z?.status === "won") { x.z[p5(v.z.party)]++; x.zd++; }
      if (v.m) { for (const [p, n] of Object.entries(v.m.won || {})) x.m[p5(p)] += n; x.md += v.m.declared || 0; }
    }
    // seat totals as ETV Bharat counts them (the saved SEC list adds up to a few more MPTC seats)
    if (d?.ac?.acs) { for (const x of Object.values(D)) { x.zt = 0; x.mt = 0; } for (const a of d.ac.acs) { const x = D[a.d]; if (x) { x.zt += a.z.t; x.mt += a.m.t; } } }
    const list = ZP.districts.map(([id]) => D[id]), T = { z: e5(), m: e5(), zd: 0, md: 0, zt: 0, mt: 0 };
    for (const x of list) { for (const p in T.z) { T.z[p] += x.z[p]; T.m[p] += x.m[p]; } T.zd += x.zd; T.md += x.md; T.zt += x.zt; T.mt += x.mt; }
    return { list, by: D, total: T };
  }
  // assembly constituencies, from live/ac.json
  function acs(d) {
    const A = d?.ac?.acs || [], teBy = {}; for (const a of A) if (a.te) teBy[a.en] = a.te;
    const f = (c) => { const o = e5(); for (const [p, n] of Object.entries(c?.s || {})) o[p5(p)] += n; return o; };
    return A.map((a) => ({ no: a.no || 0, d: a.d, ds: a.ds || [a.d], en: a.en, te: a.te || teBy[a.en] || a.en, z: f(a.z), m: f(a.m), zt: a.z.t, mt: a.m.t, none: !(a.z.t + a.m.t) }));
  }
  // seats ETV Bharat tags to a label that is not on the official constituency list (kept in the state totals)
  const acExtra = (d) => d?.ac?.extra || [];
  // the 100 urban bodies: head (Mayor / Chairperson) and ward members by side
  function urban() {
    const rows = BODIES.map((b) => {
      const r = ULB[b.id] || {}, w = e3(); for (const [p, n] of Object.entries(r.wards || {})) w[side(p)] += n;
      const h = r.head || null, won = h && h.status === "won";
      return { ...b, rid: rid(b.district), declared: r.declared || 0, w, head: h, headWon: !!won, hp: won ? p5(h.party) : null };
    });
    const T = { heads: { C: e5(), M: e5(), NP: e5() }, wards: { C: e3(), M: e3(), NP: e3() }, n: { C: 0, M: 0, NP: 0 }, nw: { C: 0, M: 0, NP: 0 }, decl: { C: 0, M: 0, NP: 0 }, pend: { C: 0, M: 0, NP: 0 } };
    for (const b of rows) {
      T.n[b.type]++; T.nw[b.type] += b.wards; T.decl[b.type] += b.declared;
      if (b.headWon) T.heads[b.type][b.hp]++; else T.pend[b.type]++;
      for (const k in b.w) T.wards[b.type][k] += b.w[k];
    }
    return { rows, T };
  }
  window.LB = { ZP, BODIES, esc, nf, side, p5, e5, e3, PN, COL, load, rural, acs, acExtra, urban, rid, dTe, asOf: (window.AP_ULB || {}).asOf };
})();
