// Urban round 2 (23 bodies: poll 26 Nov, counting 30 Nov 2026): reads ETV Bharat's tracker for the counting day and writes live/ulb2.json
//   node scripts/live-ulb2.mjs        → prints "changed" or "same"
// Same file layout ETV used for the first round (folder 2026-11-03): pointers-by-division_ward (every ward / division) and
// pointers-by-mayor_chairperson (the head of each body). Output matches data/ulb-results.js: { bodies: { id: { declared, wards: {NDA, YSRCP, OTH}, leads, head } } }.
// Env: ULB2_DAYS (comma list, default 2026-11-30), ULB2_BASE (tests), ULB2_ALL=1 (map all 123 bodies, used to check the reader on round 1).
import fs from "node:fs";
const BASE = process.env.ULB2_BASE || "https://d1cbf5vryixueg.cloudfront.net", DAYS = (process.env.ULB2_DAYS || "2026-11-30").split(",");
const OUT = "live/ulb2.json", DBG = "live/ulb2-debug.json";
// the 23 bodies of round 2: [name, type (C corporation, M municipality / nagar panchayat), wards]
const R2 = [["Srikakulam", "C", 60], ["Kakinada", "C", 66], ["Rajamahendravaram", "C", 72], ["Mangalagiri-Tadepalli", "C", 62], ["Amadalavalasa", "M", 28], ["Rajam", "M", 32], ["Palakollu", "M", 44], ["Tanuku", "M", 44], ["Bhimavaram", "M", 52], ["Tadepalligudem", "M", 48], ["Chintalapudi", "M", 23], ["Tadigadapa", "M", 48], ["Gudivada", "M", 48], ["Ponnur", "M", 40], ["Bapatla", "M", 44], ["Narasaraopet", "M", 48], ["Kandukur", "M", 40], ["Podili", "M", 28], ["Gudur (Nellore)", "M", 48], ["Kavali", "M", 44], ["Alluru", "M", 23], ["Srikalahasti", "M", 44], ["B. Kothakota", "M", 23]];
let names = R2.map(([n, t, w]) => ({ n, t: t === "C" ? "C" : "M", w }));
if (process.env.ULB2_ALL) { const src = fs.readFileSync("data/bodies.js", "utf8"), m = [...src.matchAll(/\["([^"]+)", "(C|M|NP)", "[^"]*", \d+/g)]; names = [...names, ...m.map((x) => ({ n: x[1], t: x[2] === "C" ? "C" : "M" }))]; }
const id = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), nz = (s) => String(s || "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z]/g, "");
const lev = (a, b) => { const d = Array.from({ length: b.length + 1 }, (_, j) => j); for (let i = 1; i <= a.length; i++) { let p = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return d[b.length]; };
const ALIAS = { palacole: "palakollu", tadepalligudem: "tadepalligudem", gudurnellore: "gudur", mangalagiritadepalli: "mangalagiritadepalli", itchapuram: "ichchapuram" };
const byKey = new Map(names.map((x) => [nz(x.n), x]));
function body(name, type) {
  const k0 = nz(name), k = ALIAS[k0] || k0; let hit = byKey.get(k) || byKey.get(k0);
  if (!hit) { const c = [...byKey.entries()].filter(([kk, x]) => x.t === type && (kk.startsWith(k) || k.startsWith(kk)) && Math.min(kk.length, k.length) >= 5); if (c.length === 1) hit = c[0][1]; }
  if (!hit) { const c = [...byKey.entries()].filter(([kk, x]) => x.t === type).map(([kk, x]) => [lev(kk, k), x]).sort((a, b) => a[0] - b[0]); if (c.length && c[0][0] <= (process.env.ULB2_ALL ? 3 : 2) && (!c[1] || c[1][0] > c[0][0])) hit = c[0][1]; }
  return hit || null;
}
const sideOf = (p) => { const x = String(p || "").toUpperCase().trim(); return ["TDP", "JANASENA", "JSP", "BJP", "NDA", "KUTAMI"].includes(x) ? "NDA" : x === "YSRCP" ? "YSRCP" : "OTH"; };
const partyOf = (p) => { const x = String(p || "").toUpperCase().trim(); return x === "JANASENA" ? "JSP" : x; };
const get = async (u) => { try { const r = await fetch(u, { signal: AbortSignal.timeout(30000) }); if (!r.ok) return null; return await r.json(); } catch { return null; } };
const bodies = {}, dbg = { at: new Date().toISOString(), days: {}, unmatched: [] };
const rowsOf = (j) => Object.values(j || {}).flatMap((v) => (Array.isArray(v?.Results) ? v.Results : Array.isArray(v) ? v : []));
for (const day of DAYS) {
  const idx = await get(`${BASE}/${day}/latest.json?_=${Date.now()}`); if (!idx) { dbg.days[day] = "no folder yet"; continue; }
  dbg.days[day] = {}; const feed = {};
  for (const key of ["pointers-by-division_ward", "pointers-by-mayor_chairperson"]) {
    const p = [...(idx[key] || [])].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))[0]; if (!p?.directory) continue;
    const j = await get(p.directory); if (!j) continue; feed[key] = rowsOf(j); dbg.days[day][key] = { n: feed[key].length, ts: p.timestamp };
  }
  const un = new Set();
  for (const r of feed["pointers-by-division_ward"] || []) {
    const m = r.munciplaity_corporation || r.municipality_corporation || {}, typ = /DIVISION/i.test(r.name_in_english || "") ? "C" : "M", b = body(m.name_in_english, typ);
    if (!b) { un.add(m.name_in_english); continue; }
    const st = String(r.status_in_english || ""), o = (bodies[id(b.n)] ||= { declared: 0, wards: {}, leads: {} });
    if (/^Won$/i.test(st)) { o.declared++; const s = sideOf(r.party_in_english); o.wards[s] = (o.wards[s] || 0) + 1; }
    else if (/^Lead/i.test(st)) { const s = sideOf(r.party_in_english); o.leads[s] = (o.leads[s] || 0) + 1; }
  }
  for (const r of feed["pointers-by-mayor_chairperson"] || []) {
    const typ = /^(CORPORATION|CORPORATE)/i.test(r.name_in_english || "") || r.isWardDivisionWise && !r.parliment_local ? "C" : "M", b = body(r.name_in_english, typ) || body(r.name_in_english, typ === "C" ? "M" : "C");
    if (!b) { un.add(r.name_in_english); continue; }
    const st = String(r.status_in_english || "").toLowerCase(); if (!/^(won|lead)/.test(st)) continue;
    (bodies[id(b.n)] ||= { declared: 0, wards: {}, leads: {} }).head = { party: partyOf(r.party_in_english), name: String(r.candidate_in_local || r.candidate_in_english || "").trim(), status: st.startsWith("won") ? "won" : "leading" };
  }
  dbg.unmatched.push(...un);
}
for (const o of Object.values(bodies)) if (!Object.keys(o.leads).length) delete o.leads;
dbg.bodies = Object.keys(bodies).length; fs.mkdirSync("live", { recursive: true }); fs.writeFileSync(DBG, JSON.stringify(dbg));
if (!Object.keys(bodies).length) { console.log("same (no urban results yet)"); process.exit(0); }
const body_ = JSON.stringify({ updated: new Date().toISOString(), bodies }); let old = ""; try { old = fs.readFileSync(OUT, "utf8"); } catch {}
const strip = (s) => s.replace(/"updated":"[^"]*",/, "");
if (strip(old) === strip(body_)) { console.log("same"); process.exit(0); }
fs.writeFileSync(OUT, body_); console.log("changed", Object.keys(bodies).length, "bodies");
