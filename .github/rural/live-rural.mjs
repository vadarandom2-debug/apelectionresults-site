// ZPTC / MPTC live file without Supabase or an AI model: reads ETV Bharat's tracker, keeps each mandal's result
// (only ever moving forward) and writes live/rural.json, which the site serves as a plain file through Cloudflare.
//   node scripts/live-rural.mjs [path to logic.js]   → prints "changed" or "same"
import fs from "node:fs";
import os from "node:os";
const logic = await import(process.argv[2] || "../supabase/functions/capture-results/logic.js");
const { etvbRural, followMandals, ruralMandal, ETVB_RURAL } = logic;
const OUT = "live/rural.json";
const get = async (u) => { const r = await fetch(u, { signal: AbortSignal.timeout(30000) }); if (!r.ok) throw new Error(`HTTP ${r.status} ${u}`); return r.json(); };
// TV9 Telugu's live blog is the only source with MPTC "leading" figures (ETV Bharat marks an MPTC seat only as awaited or won).
// Its statewide lines read "MPTC: కూటమి 1992, వైసీపీ 99 స్థానాల్లో ఆధిక్యం" (declared + leading). Newest entry first; the entry's
// time is the nearest "07 Nov 2026 10:36 AM (IST)" line above it. Kept as a separate, labelled figure, never mixed into the seat sums.
const TV9 = "https://tv9telugu.com/andhra-pradesh/ap-zptc-mptc-2026-result-counting-live-updates-check-winners-from-tdp-jsp-bjp-ycp-latest-news-in-telugu-1952448.html";
const num = (v) => Number(String(v).replace(/,/g, ""));
export function parseTv9(html) {
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<\/(p|div|li|h\d)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  let at = null; const out = {};
  for (const raw of text.split("\n")) {
    const l = raw.replace(/\s+/g, " ").trim();
    const t = l.match(/^\d{1,2} \w{3} 2026 (\d{1,2}:\d{2} [AP]M) \(IST\)/); if (t) { at = t[1]; continue; }
    let m;
    if (!out.mptc && (m = l.match(/^MPTC\s*:\s*కూటమి\s*([\d,]+)\s*,\s*వైసీపీ\s*([\d,]+)/))) out.mptc = { K: num(m[1]), Y: num(m[2]), at };
    if (!out.zptcK && (m = l.match(/^ZPTC\s*:\s*కూటమి\s*([\d,]+)/))) out.zptcK = { n: num(m[1]), at };
    if (!out.zptcY && (m = l.match(/^ZPTC\s*:\s*వైసీపీ\s*([\d,]+)/))) out.zptcY = { n: num(m[1]), at };
  }
  return out.mptc ? { mptc: { K: out.mptc.K, Y: out.mptc.Y }, at: out.mptc.at, ...(out.zptcK && out.zptcY ? { zptc: { K: out.zptcK.n, Y: out.zptcY.n } } : {}) } : null;
}
// TV9 also calls single ZPTC wins in prose ("చిన్నమండెం జెడ్పీటీసీ టీడీపీ కైవశం"). Those fill a mandal only where ETV Bharat shows no
// ZPTC result yet (or still shows the same party as leading); ETV always wins when it has a declared result or a different party.
const TE = JSON.parse(fs.readFileSync(new URL("./mandal-te.json", import.meta.url), "utf8"));
const tnorm = (x) => String(x || "").normalize("NFC").replace(/[\s.‌‍()\-]/g, "");
const BYTE = {}; for (const [k, v] of Object.entries(TE)) (BYTE[tnorm(v)] ||= []).push(k);
const PARTY = (t) => { const f = [/టీడీపీ|తెదేపా/.test(t) && "TDP", /వైసీపీ|వైకాపా/.test(t) && "YSRCP", /జనసేన/.test(t) && "JSP", /బీజేపీ|భాజపా/.test(t) && "BJP", /కాంగ్రెస్/.test(t) && "INC", /స్వతంత్ర/.test(t) && "OTH"].filter(Boolean); return f.length === 1 ? f[0] : null; };
export function parseTv9Seats(html) {
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<\/(p|div|li|h\d)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  const entries = []; let cur = null;
  for (const raw of text.split("\n")) {
    const l = raw.replace(/\s+/g, " ").trim(); if (!l) continue;
    const t = l.match(/^\d{1,2} \w{3} 2026 (\d{1,2}:\d{2} [AP]M) \(IST\)/);
    if (t) { cur = { at: t[1], lines: [] }; entries.push(cur); } else if (cur && cur.lines.length < 8) cur.lines.push(l);
  }
  const out = {};
  for (const e of entries) {
    const body = e.lines.join(" ");
    if (!/(జెడ్పీటీసీ|జడ్పీటీసీ|ZPTC)/i.test(body) || !/(విజయం|కైవశం|కైవసం|గెలుపొం|గెలుపు|విజేత)/.test(body) || /(ఆధిక్యం|ముందంజ|వెనుకంజ|లీడ్|మళ్లీ|రీకౌంటింగ్)/.test(body)) continue;
    const party = PARTY(body); if (!party) continue;
    const mm = [...body.matchAll(/([ఀ-౿‌]+?)\s*(?:జెడ్పీటీసీ|జడ్పీటీసీ|ZPTC)/gi)].map((m) => m[1]);
    const ids = new Set(); for (const w of mm) for (const k of BYTE[tnorm(w)] || []) ids.add(k);
    if (ids.size !== 1) continue; // unknown or ambiguous name: skip rather than guess
    const nm = body.match(/అభ్యర్థి\s+([ఀ-౿‌ ]{3,40}?)\s+(?:విజయం|గెలుపు|గెలుపొం)/);
    const k = [...ids][0]; if (!out[k]) out[k] = { party, ...(nm ? { name: nm[1].trim() } : {}), at: e.at };
  }
  return out;
}
let tvChanged = false, seatsChanged = false, tvSeats = {};
try { tvSeats = JSON.parse(fs.readFileSync("live/tv9seats.json", "utf8")); } catch {}
if (!process.env.NO_TV9) try {
  const html = await fetch(TV9, { headers: { "User-Agent": "Mozilla/5.0 (compatible; APResultsBot/1.0; +https://apelectionresults.com)" }, signal: AbortSignal.timeout(25000) }).then((r) => (r.ok ? r.text() : ""));
  const tv = html && parseTv9(html);
  if (tv) {
    let old = null; try { old = JSON.parse(fs.readFileSync("live/tv9.json", "utf8")); } catch {}
    const same = (o) => JSON.stringify({ mptc: o.mptc, zptc: o.zptc, at: o.at }); // the figures only, not the fetch time
    if (!old || same(old) !== same(tv)) {
      fs.mkdirSync("live", { recursive: true }); fs.writeFileSync("live/tv9.json", JSON.stringify({ ...tv, source: "TV9 Telugu", fetched: new Date().toISOString() })); tvChanged = true;
    }
  }
  if (html) {
    const seen = parseTv9Seats(html), merged = { ...seen, ...tvSeats }; // a call once seen stays
    if (JSON.stringify(merged) !== JSON.stringify(tvSeats)) { tvSeats = merged; fs.mkdirSync("live", { recursive: true }); fs.writeFileSync("live/tv9seats.json", JSON.stringify(tvSeats)); seatsChanged = true; }
  }
} catch (e) { console.error("tv9:", e.message); }
const idx = await get(ETVB_RURAL + "?_=" + Date.now());
const ptr = [...(idx["pointers-by-mptc_zptc"] || [])].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))[0];
if (!ptr?.directory) throw new Error("no ZPTC / MPTC file in ETV Bharat's index");
// the per-seat file is large (~9 MB): download it only when ETV's feed has a newer one than the last run saw (FORCE=1 always does)
const PTR = os.tmpdir() + "/live-rural.ptr";
let seenPtr = ""; try { seenPtr = fs.readFileSync(PTR, "utf8"); } catch {}
if (!process.env.FORCE && !seatsChanged && seenPtr === String(ptr.timestamp) && fs.existsSync(OUT)) { console.log(tvChanged ? "changed tv9" : "same"); process.exit(0); }
const cons = await get(ptr.directory);
const { items, unmatched } = etvbRural(cons);
for (const [k, c] of Object.entries(tvSeats)) { // TV9's single-seat calls, only where ETV has nothing (or the same party as leading)
  let x = items.find((i) => i.id === k); const z = x?.z;
  if (z && (z.status === "won" || z.party !== c.party)) continue;
  if (!x) items.push(x = { id: k });
  x.z = { party: c.party, status: "won", ...(c.name || z?.name ? { name: z?.name || c.name } : {}) };
}
// seats declared by the owner from a newspaper result ETV Bharat still shows as leading or awaited; ETV's own declared result always replaces it
let OV = {}; try { OV = JSON.parse(fs.readFileSync(new URL("./zptc-overrides.json", import.meta.url), "utf8")); } catch {}
for (const [k, c] of Object.entries(OV)) {
  let x = items.find((i) => i.id === k); if (x?.z?.status === "won") continue;
  if (!x) items.push((x = { id: k }));
  x.z = { party: c.party, status: "won", ...(c.name ? { name: c.name } : {}) };
}
// MPTC winners and leaders by name, one small file per district (live/d/<district>.json), read when a district opens:
// { "<mandal id>": [[seat (Telugu), party, "won" | "leading", candidate (Telugu)], …] }
const P = { TDP: "TDP", JANASENA: "JSP", BJP: "BJP", YSRCP: "YSRCP", INC: "INC", CONGRESS: "INC", CPI: "LEFT", CPM: "LEFT", "CPI (M)": "LEFT", "CPI(M)": "LEFT" };
const byD = {};
for (const r of cons?.["Mandal Parishad"]?.Results || []) {
  const st = r.status_in_english === "Won" ? "won" : r.status_in_english === "Lead" ? "leading" : null; if (!st || !r.party_in_english) continue;
  const id = ruralMandal(r.district_in_english, r.mandal_in_english); if (!id) continue;
  const [d, m] = id.split("/");
  ((byD[d] ||= {})[m] ||= []).push([String(r.name_in_local || r.name_in_english || "").trim(), P[String(r.party_in_english).toUpperCase().trim()] || "OTH", st, String(r.candidate_in_local || r.candidate_in_english || "").trim()]);
}
let dChanged = 0;
fs.mkdirSync("live/d", { recursive: true });
for (const [d, seats] of Object.entries(byD)) {
  for (const k in seats) seats[k].sort((a, b) => a[0].localeCompare(b[0], "te"));
  const f = `live/d/${d}.json`, body = JSON.stringify(seats);
  let old = null; try { old = fs.readFileSync(f, "utf8"); } catch {}
  if (old !== body) { fs.writeFileSync(f, body); dChanged++; }
}
// Assembly constituency view: ETV tags every ZPTC and MPTC seat with its constituency, so the counts per constituency come straight
// from the same file (live/ac.json). Spelling variants inside a district are merged; the Telugu name comes from the ZPTC rows.
{
  const nk = (x) => String(x || "").toLowerCase().replace(/[^a-z]/g, "");
  const lev = (a, b) => { const d = Array.from({ length: b.length + 1 }, (_, j) => j); for (let i = 1; i <= a.length; i++) { let p = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return d[b.length]; };
  const ZFIN = Object.fromEntries(items.filter((i) => i.z).map((i) => [i.id, i.z]));
  const src = [["z", cons?.["Zilla Parishad"]?.Results || []], ["m", cons?.["Mandal Parishad"]?.Results || []]], seen = [];
  for (const [kind, rows] of src) for (const r of rows) {
    const id = ruralMandal(r.district_in_english, r.mandal_in_english || r.name_in_english), name = nk(r.parliment_in_english); if (!id || !name) continue;
    let st = r.status_in_english, party = r.party_in_english ? P[String(r.party_in_english).toUpperCase().trim()] || "OTH" : "";
    if (kind === "z") { const z = ZFIN[id]; st = z ? (z.status === "won" ? "Won" : "Lead") : "Await"; party = z?.party || ""; } // the same ZPTC result as rural.json, TV9 calls and the owner's override included
    seen.push({ kind, d: id.split("/")[0], name, en: String(r.parliment_in_english).trim(), te: kind === "z" ? String(r.parliment_local || "").trim() : "", st, party });
  }
  const freq = {}; for (const x of seen) freq[x.d + "|" + x.name] = (freq[x.d + "|" + x.name] || 0) + 1;
  const canon = {}, kept = {};
  for (const [k] of Object.entries(freq).sort((a, b) => b[1] - a[1])) { const [d, n] = k.split("|"); const hit = (kept[d] ||= []).find((c) => lev(c, n) <= 2); if (hit) canon[k] = hit; else { kept[d].push(n); canon[k] = n; } }
  const by = {}, tally = (c) => (c || (c = { t: 0, s: {}, l: {} }), c);
  for (const x of seen) {
    const key = x.d + "|" + canon[x.d + "|" + x.name], a = (by[key] ||= { d: x.d, en: {}, te: {}, z: tally(), m: tally() }), c = a[x.kind];
    a.en[x.en] = (a.en[x.en] || 0) + 1; if (x.te) a.te[x.te] = (a.te[x.te] || 0) + 1;
    c.t++; if (x.party && x.st === "Won") c.s[x.party] = (c.s[x.party] || 0) + 1; else if (x.party && x.st === "Lead") c.l[x.party] = (c.l[x.party] || 0) + 1;
  }
  const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  const title = (n) => n.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
  const acs = Object.values(by).map((a) => ({ d: a.d, en: title(top(Object.fromEntries(Object.entries(a.en).filter(([k]) => k !== k.toUpperCase()))) || top(a.en)), te: top(a.te), z: a.z, m: a.m })).sort((p, q) => p.d.localeCompare(q.d) || p.en.localeCompare(q.en));
  if (acs.length > 100) { const body = JSON.stringify({ feed: ptr.timestamp, acs }), f = "live/ac.json"; let old = ""; try { old = fs.readFileSync(f, "utf8"); } catch {} if (old !== body) { fs.writeFileSync(f, body); dChanged++; } }
}
let prev = {}; try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")).mandals || {}; } catch {}
const next = followMandals(prev, items); // follows ETV Bharat, including its corrections
if (unmatched.length) console.error("not matched:", unmatched.slice(0, 10).join(", "));
try { fs.writeFileSync(PTR, String(ptr.timestamp)); } catch {}
if (!next) { console.log(dChanged || tvChanged ? `changed ${dChanged} district files${tvChanged ? " + tv9" : ""}` : "same"); process.exit(0); }
fs.mkdirSync("live", { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: "ETV Bharat", feed: ptr.timestamp, mandals: next }));
console.log("changed", Object.keys(next).length, "mandals", tvChanged ? "+ tv9" : "");
