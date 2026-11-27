// Gram panchayat (Sarpanch) results: reads ETV Bharat's tracker for each poll day and writes live/gp.json for the Panchayat page.
//   node scripts/live-gp.mjs [path to logic.js]        → prints "changed" or "same"
// ETV publishes one folder per poll day (…/2026-11-26/latest.json). The panchayat file's exact shape is only known once it exists,
// so the reader looks for a list of rows that carry district + mandal names (like the MPTC file) and normalises them; what it found is
// saved in live/gp-debug.json so a mismatch on poll day is easy to see. BASE can be overridden for tests.
import fs from "node:fs";
const logic = await import(process.argv[2] || "../supabase/functions/capture-results/logic.js");
const { ruralMandal: rm } = logic;
// ETV spellings or districts the shared mandal matcher does not resolve (checked on the 26 Nov feed): [ETV district, ETV mandal] -> our mandal id
const GP_ALIAS = { "west godavari/narsapur": "west-godavari/narasapuram", "y.s.r./rajampet": "kadapa/rajampeta", "kurnool/adoni": "kurnool/adoni-1", "spsr nellore/gudur": "nellore/gudur", "spsr nellore/kondapuram": "nellore/kondapuram", "anantapur/kalyandrug": "anantapur/kalyanadurg", "east godavari/rajahmundry rural": "east-godavari/rajamahendravaram-rural" };
const ruralMandal = (d, m) => GP_ALIAS[`${String(d || "").toLowerCase().trim()}/${String(m || "").toLowerCase().trim()}`] || rm(d, m);
const BASE = process.env.GP_BASE || "https://d1cbf5vryixueg.cloudfront.net";
const DAYS = { "2026-11-26": 1, "2026-11-29": 2, "2026-12-02": 3 }; // poll and count on the same day
const OUT = "live/gp.json", DBG = "live/gp-debug.json";
const get = async (u) => { const r = await fetch(u, { signal: AbortSignal.timeout(30000) }); if (!r.ok) return null; try { return await r.json(); } catch { return null; } };
const KUT = ["TDP", "JANASENA", "JSP", "BJP", "NDA", "KUTAMI"];
const side = (p) => { const x = String(p || "").toUpperCase().trim(); return !x ? "" : KUT.includes(x) ? "K" : x === "YSRCP" ? "Y" : "O"; };
const pty = (p) => { const x = String(p || "").toUpperCase().trim(); return x === "JANASENA" ? "JSP" : x; }; // party shown beside the side, index 10
const rowsOf = (v) => (Array.isArray(v) ? v : Array.isArray(v?.Results) ? v.Results : Array.isArray(v?.Sheet1) ? v.Sheet1 : null);
const looksLikePanchayat = (r) => r && (r.mandal_in_english || r.mandal_name) && (r.district_in_english || r.district_name);
const only = process.env.GP_DAYS ? process.env.GP_DAYS.split(",") : Object.keys(DAYS);
let prev = []; try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")).gp || []; } catch {}
const seenAt = new Map(prev.filter((g) => g[4] && g[8]).map((g) => [g[0] + "|" + g[1] + "|" + g[2], g[8]]));
const nowMin = Math.floor(Date.now() / 60000), rows = [], debug = { at: new Date().toISOString(), days: {} }, feed = {};
for (const day of only) {
  const idx = await get(`${BASE}/${day}/latest.json?_=${Date.now()}`); if (!idx) { debug.days[day] = "no folder yet"; continue; }
  const found = []; debug.days[day] = { pointers: Object.keys(idx).filter((k) => k.startsWith("pointers-by-")) };
  for (const key of debug.days[day].pointers) {
    const p = [...(idx[key] || [])].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))[0]; if (!p?.directory) continue;
    const j = await get(p.directory); if (!j) continue;
    const lists = Array.isArray(j) ? [["", j]] : Object.entries(j).map(([k, v]) => [k, rowsOf(v)]).filter(([, v]) => v);
    for (const [name, list] of lists) {
      const rs = rowsOf(list) || list; if (!rs.length || !looksLikePanchayat(rs[0])) continue;
      const unop = /ekagreevam|unopposed/i.test(key);
      found.push({ key, name, n: rs.length, unop, sample: Object.keys(rs[0]).slice(0, 14), rs, ts: p.timestamp });
    }
  }
  debug.days[day].lists = found.map(({ key, name, n, unop, sample, ts }) => ({ key, name, n, unop, sample, ts }));
  // the main list: the biggest one with a status field; unopposed lists add winners that are not in it
  const main = found.filter((f) => !f.unop && f.rs[0].status_in_english !== undefined).sort((a, b) => b.n - a.n)[0] || found.filter((f) => !f.unop).sort((a, b) => b.n - a.n)[0];
  const add = (r, unop) => {
    const id = ruralMandal(r.district_in_english || r.district_name, r.mandal_in_english || r.mandal_name); if (!id) return;
    const [d, m] = id.split("/"), name = String(r.name_in_local || r.local_name || r.name_in_english || r.name || "").trim(); if (!name) return;
    const st = unop ? "Won" : r.status_in_english, party = r.party_in_english || r.party_name_in_english || "", done = /^(Won|Lead)$/i.test(st || "") && party;
    const sd = done ? side(party) : "", k = d + "|" + m + "|" + name, cand = String(r.candidate_in_local || r.candidate_name || r.candidate_in_english || "").trim();
    const margin = Number(r.margin || r.majority || 0) || 0;
    rows.push([d, m, name, DAYS[day], sd, cand, margin, !sd ? "" : /^Lead$/i.test(st) ? "lead" : unop ? "unopposed" : "won", sd ? seenAt.get(k) || nowMin : 0, "", sd ? pty(party) : "", String(r.name_in_english || r.name || "").trim()]); // [11] = ETV English name, used to match follower reports
  };
  if (main) { feed[day] = main.ts; main.rs.forEach((r) => add(r, false)); }
  // unopposed panchayats: the winner is known before polling; fill them into the main list (or add the ones it does not have)
  for (const u of found.filter((f) => f.unop)) for (const r of u.rs) {
    const id = ruralMandal(r.district_in_english || r.district_name, r.mandal_in_english || r.mandal_name); if (!id) continue;
    const [d, m] = id.split("/"), name = String(r.name_in_local || r.local_name || r.name_in_english || r.name || "").trim(), party = r.party_in_english || r.party_name_in_english || "";
    const ex = rows.find((x) => x[3] === DAYS[day] && x[0] === d && x[1] === m && x[2] === name);
    if (!ex) { add(r, true); continue; }
    if (ex[4] && !ex[10] && party) ex[10] = pty(party);
    if (ex[4] && ex[7] === "won" && !ex[6]) ex[7] = "unopposed"; // already a winner in the main list and also on the unopposed list
    if (!ex[4] && party) { ex[4] = side(party); ex[5] = String(r.candidate_in_local || r.candidate_name || r.candidate_in_english || "").trim(); ex[7] = "unopposed"; ex[8] = seenAt.get(d + "|" + m + "|" + name) || nowMin; ex[10] = pty(party); }
  }
}
// ---------- every gram panchayat in the state (official LGD list, data/gp-list.json): shown as "awaiting" until a result arrives ----------
// A mandal that ETV's tracker lists is taken from ETV in full (its names win); every other mandal is filled from the list. Row: [..., phase from the SEC notifications (LIST.ph), 0 = not known, ..., te name at index 9]
let LIST = null; for (const p of ["data/gp-list.json", "../data/gp-list.json", "../../data/gp-list.json"]) { try { LIST = JSON.parse(fs.readFileSync(p, "utf8")); break; } catch {} }
if (LIST) {
  const covered = new Set(rows.map((r) => r[0] + "|" + r[1]));
  for (const [d, ms] of Object.entries(LIST.d)) for (const [m, names] of Object.entries(ms)) { if (covered.has(d + "|" + m)) continue; for (const [en, te] of names) rows.push([d, m, en, LIST.ph?.[d + "/" + m] || 0, "", "", 0, "", 0, te]); }
  debug.list = { total: LIST.n, rows: rows.length };
}
// ---------- follower reports approved in gp-admin.html (Supabase view gp_approved: no names or phone numbers) ----------
// An approved report fills a panchayat ETV has not declared (or adds one ETV does not list); an official ETV result is never overwritten.
async function approvedReports() {
  if (process.env.GP_REPORTS_FILE) { try { return JSON.parse(fs.readFileSync(process.env.GP_REPORTS_FILE, "utf8")); } catch { return []; } }
  if (process.env.GP_REPORTS_URL) { try { const r = await fetch(process.env.GP_REPORTS_URL); return r.ok ? await r.json() : []; } catch { return []; } }
  let cfg = ""; for (const p of ["supabase-config.js", "../supabase-config.js", "../../supabase-config.js"]) { try { cfg = fs.readFileSync(p, "utf8"); break; } catch {} }
  const U = cfg.match(/SUPABASE_URL = "([^"]+)"/)?.[1], K = cfg.match(/SUPABASE_ANON_KEY = "([^"]+)"/)?.[1]; if (!U || !K) return [];
  try { const r = await fetch(`${U}/rest/v1/gp_approved?select=*&order=approved_at.asc&limit=5000`, { headers: { apikey: K, Authorization: `Bearer ${K}` }, signal: AbortSignal.timeout(20000) }); return r.ok ? await r.json() : []; } catch { return []; }
}
const nz = (x) => String(x || "").toLowerCase().normalize("NFC").replace(/[\s\u200c\u200d.\-_,()'"]/g, "");
const lev = (a, b) => { const d = Array.from({ length: b.length + 1 }, (_, j) => j); for (let i = 1; i <= a.length; i++) { let p = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return d[b.length]; };
const HOLD = new Set(["6a0a3ca1-2655-4012-8cdb-81e3dae8f246", "75736765-c13a-4d4f-8bed-b5d19617fcea"]);
if (!process.env.GP_SKIP_REPORTS) {
  // follower reports from the form are switched off (owner, 26 Nov night: ETV only, plus the results the owner sends by hand in data/gp-overrides.json); set GP_USE_REPORTS=1 to turn them back on
  const reps = process.env.GP_USE_REPORTS ? await approvedReports() : [], st = { approved: reps.length, filled: 0, added: 0, keptOfficial: 0 };
  for (const r of reps) {
    if (!["K", "Y", "O"].includes(r.side) || !r.district || !r.mandal || !r.panchayat) continue;
    // held back: Dharmajigudem (no winner name) and Reddigudem (winner given only as "Reddy"), by report id, until the owner confirms them; a report with no winner name is never shown
    if (HOLD.has(r.id) || !String(r.winner || "").trim()) { (st.held ||= []).push(r.district + "/" + r.mandal + "/" + r.panchayat); continue; }
    // the form sends the English name from the list; ETV rows carry Telugu names, so look the Telugu spelling up in the official list too
    const n = nz(r.panchayat), same = rows.filter((x) => x[0] === r.district && x[1] === r.mandal), te = (LIST?.d?.[r.district]?.[r.mandal] || []).find(([en]) => nz(en) === n)?.[1], tn = te ? nz(te) : "";
    // exact name, else a single near match (one letter off) when neither name has a number, so "Village 1" is never taken for "Village 2"
    const near = /\d/.test(n) || n.length < 5 ? [] : same.filter((x) => !/\d/.test(x[2]) && (lev(nz(x[2]), n) <= 1 || (x[11] && lev(nz(x[11]), n) <= 1))), ex = same.find((x) => nz(x[2]) === n || (x[9] && nz(x[9]) === n) || (x[11] && nz(x[11]) === n) || (tn && nz(x[2]) === tn)) || (near.length === 1 ? near[0] : undefined) || (tn.length >= 4 ? same.filter((x) => lev(nz(x[2]), tn) <= 1).slice(0, 2).length === 1 ? same.find((x) => lev(nz(x[2]), tn) <= 1) : undefined : undefined);
    const t = Math.floor(Date.parse(r.approved_at || Date.now()) / 60000);
    // follower reports: only the Kutami side is used; YSRCP and other-side reports are never added to any count (ETV is the only source for those)
    if (r.side !== "K") { (st.held ||= []).push(r.district + "/" + r.mandal + "/" + r.panchayat + " (only Kutami follower reports are used)"); continue; }
    if (ex) { if (ex[4] && ex[7] !== "reported") { st.keptOfficial++; continue; } ex[4] = r.side; ex[5] = r.winner || ex[5] || ""; ex[6] = Number(r.margin) || 0; ex[7] = "reported"; ex[8] = t; if (!ex[3]) ex[3] = Number(r.phase) || 1; st.filled++; }
    else if (te && same.some((x) => !x[9])) { (st.unmatched ||= []).push(r.district + "/" + r.mandal + "/" + r.panchayat); } // ETV lists every panchayat of this mandal: never add a second row for a listed name
    else { rows.push([r.district, r.mandal, String(r.panchayat).trim(), Number(r.phase) || 1, r.side, r.winner || "", Number(r.margin) || 0, "reported", t]); st.added++; }
  }
  // results the owner verified by hand (data/gp-overrides.json): an ETV result wins unless the row says force
  // overrides file: the copy on the live site first (edits to it need no job restart), then the checked-out file
  // 1) the repo itself through the GitHub API (no Pages build or cache in between: a pushed edit is seen on the next loop), 2) the live site's copy
  let OVF = null;
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) { try { const r = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/contents/data/gp-overrides.json?ref=main`, { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github.raw" }, signal: AbortSignal.timeout(15000) }); if (r.ok) OVF = await r.json(); } catch {} }
  if (!OVF) try { const r = await fetch(`https://apelectionresults.com/data/gp-overrides.json?t=${Date.now()}`, { signal: AbortSignal.timeout(15000) }); if (r.ok) OVF = await r.json(); } catch {}
  if (!OVF) for (const p of ["data/gp-overrides.json", "../data/gp-overrides.json", "../../data/gp-overrides.json"]) { try { OVF = JSON.parse(fs.readFileSync(p, "utf8")); break; } catch {} }
  const OV = OVF?.rows || [];
  st.manual = 0;
  for (const o of OV) {
    const x = rows.find((y) => y[0] === o.d && y[1] === o.m && (nz(y[11]) === nz(o.en) || nz(y[2]) === nz(o.en)));
    if (!x || !["K", "Y", "O"].includes(o.side) || (x[4] && x[7] !== "reported" && !o.force)) continue;
    x[4] = o.side; x[5] = o.winner || (o.force ? x[5] : "") || ""; x[6] = Number(o.margin) || 0; x[7] = "reported"; x[8] = Math.floor(Date.now() / 60000); x[10] = o.party || x[10] || ""; st.manual++;
  }
  // majorities from news posts the owner supplied: added only to a panchayat ETV already declared, same side; never changes the winner
  const MG = OVF?.margins || [];
  st.margins = 0;
  for (const o of MG) {
    const x = rows.find((y) => y[0] === o.d && y[1] === o.m && (nz(y[11]) === nz(o.en) || nz(y[2]) === nz(o.en)));
    if (x && x[4] === o.side && x[7] !== "unopposed" && !x[6]) { x[6] = Number(o.margin) || 0; st.margins++; }
  }
  debug.reports = st;
}
fs.mkdirSync("live", { recursive: true });
fs.writeFileSync(DBG, JSON.stringify(debug));
if (!rows.length) { console.log("same (no panchayat data yet)"); process.exit(0); }
const body = JSON.stringify({ updated: new Date().toISOString(), feed, gp: rows }); let old = ""; try { old = fs.readFileSync(OUT, "utf8"); } catch {}
const strip = (s) => s.replace(/"updated":"[^"]*",/, "");
if (strip(old) === strip(body)) { console.log("same"); process.exit(0); }
fs.writeFileSync(OUT, body); console.log("changed", rows.length, "panchayats,", rows.filter((r) => r[4]).length, "declared");
