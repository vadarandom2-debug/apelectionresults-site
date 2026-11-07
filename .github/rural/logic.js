// Pure logic for the results agent: no network, no Deno APIs, so node can test it (scripts/test-agent.js).
// Imported by index.ts.

// NDA = the Kutami (TDP + JSP + BJP) as one number, for pages that don't split the alliance by party.
export const PARTIES = ["TDP", "JSP", "BJP", "NDA", "YSRCP", "INC", "LEFT", "OTH"];
import { DISTRICTS, MANDALS } from "./zp.js";
// Statewide ZPTC / MPTC, plus each Zilla Parishad's: "zptc", "mptc", "zptc:kadapa", "mptc:kadapa", …
export const RURAL_TOTAL = { zptc: 659, mptc: 9829, ...Object.fromEntries(DISTRICTS.flatMap(([id, , , z, m]) => [["zptc:" + id, z], ["mptc:" + id, m]])) };
export const RURAL_KEYS = Object.keys(RURAL_TOTAL);
export const MANDAL_IDS = new Set(MANDALS.map(([d, m]) => d + "/" + m));

// Sources we never read. Checked in code here and by a check constraint in supabase/agent.sql.
export const BLOCKED = ["sakshi"];
export const isBlocked = (url) => {
  try { const h = new URL(url).hostname.toLowerCase(); return BLOCKED.some((b) => h.includes(b)); }
  catch { return true; }
};
export const domainOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };

// ---------- page text ----------
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const entity = (m, e) => e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e.toLowerCase()] ?? m;
const decodeEntities = (s) => s.replace(/&(#\d+|#x[\da-f]+|\w+);/gi, entity);
export function htmlToText(html, max = 60000) {
  const keep = [];
  // structured data often carries the live numbers on JS-heavy pages
  html.replace(/<script[^>]*(?:application\/ld\+json|__NEXT_DATA__)[^>]*>([\s\S]*?)<\/script>/gi, (_, j) => { keep.push(j.slice(0, 15000)); return ""; });
  let t = html
    .replace(/<(script|style|noscript|svg|iframe|nav|footer)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|tr|h\d|table|section|article|br)\s*>|<br\s*\/?>/gi, "\n")
    .replace(/<\/t[dh]>/gi, " | ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#\d+|#x[\da-f]+|\w+);/gi, entity)
    .replace(/[ \t\f\v ]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
  if (keep.length) t += "\n\n[structured data]\n" + keep.join("\n");
  return t.slice(0, max);
}

// Whitespace/punctuation-insensitive form used to check that a quote really is on the page.
// Zero-width joiners (Telugu pages are full of them, often as &zwnj;) are dropped too: quotes usually leave them out.
export const norm = (s) => String(s || "").replace(/&zwn?j;/gi, "").toLowerCase().normalize("NFC").replace(/[\s|,.:;"'“”‘’()\-–—\u200c\u200d]+/g, "");

// ---------- the extraction schema (Claude structured output) ----------
export function extractionSchema(bodyIds) {
  const count = { type: "object", additionalProperties: false, required: ["party", "n"], properties: { party: { type: "string", enum: PARTIES }, n: { type: "integer" } } };
  return {
    type: "object", additionalProperties: false, required: ["observations", "postal", "mandals"],
    properties: {
      // one entry per mandal the page gives a ZPTC winner / leader or MPTC seats for; mandal_id is checked in code
      mandals: {
        type: "array",
        items: {
          type: "object", additionalProperties: false,
          required: ["mandal_id", "zptc", "mptc_won", "mptc_declared", "quote"],
          properties: {
            mandal_id: { type: "string" },
            zptc: {
              anyOf: [{ type: "null" }, {
                type: "object", additionalProperties: false, required: ["party", "name", "status"],
                properties: { party: { type: "string", enum: PARTIES }, name: { type: "string" }, status: { type: "string", enum: ["leading", "won"] } },
              }],
            },
            mptc_won: { type: "array", items: count },
            mptc_declared: { anyOf: [{ type: "integer" }, { type: "null" }] },
            quote: { type: "string" },
          },
        },
      },
      postal: {
        type: "array",
        items: {
          type: "object", additionalProperties: false,
          required: ["body_id", "votes", "total", "lead_party", "lead_by", "quote"],
          properties: {
            body_id: { type: "string", enum: [...bodyIds] },
            votes: { type: "array", items: count },
            total: { anyOf: [{ type: "integer" }, { type: "null" }] },
            lead_party: { anyOf: [{ type: "string", enum: PARTIES }, { type: "null" }] },
            lead_by: { anyOf: [{ type: "integer" }, { type: "null" }] },
            quote: { type: "string" },
          },
        },
      },
      observations: {
        type: "array",
        items: {
          type: "object", additionalProperties: false,
          required: ["body_id", "declared", "won", "leading", "head", "quote"],
          properties: {
            body_id: { type: "string", enum: [...bodyIds, ...RURAL_KEYS.map((k) => "rural-" + k)] },
            declared: { anyOf: [{ type: "integer" }, { type: "null" }] },
            won: { type: "array", items: count },
            leading: { type: "array", items: count },
            head: {
              anyOf: [{ type: "null" }, {
                type: "object", additionalProperties: false, required: ["party", "name", "status", "margin"],
                properties: { party: { type: "string", enum: PARTIES }, name: { type: "string" }, status: { type: "string", enum: ["leading", "won"] }, margin: { anyOf: [{ type: "integer" }, { type: "null" }] } },
              }],
            },
            quote: { type: "string" },
          },
        },
      },
    },
  };
}

// ---------- normalise one observation ----------
const toMap = (arr) => { const m = {}; for (const { party, n } of arr || []) if (PARTIES.includes(party) && Number.isInteger(n) && n > 0) m[party] = (m[party] || 0) + n; return m; };
const sortObj = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);

export function normalise(o) {
  const won = toMap(o.won), leads = toMap(o.leading);
  const out = { won: sortObj(won), leads: sortObj(leads) };
  out.declared = Number.isInteger(o.declared) ? o.declared : sum(won);
  if (o.head && PARTIES.includes(o.head.party)) out.head = { party: o.head.party, name: String(o.head.name || "").trim().slice(0, 120), status: o.head.status === "won" ? "won" : "leading", margin: Number.isInteger(o.head.margin) ? o.head.margin : null };
  return out;
}
// What two sources must agree on (names are compared loosely: spelling differs between papers).
export function fingerprint(obs) {
  const h = obs.head ? `${obs.head.party}:${obs.head.status}` : "-";
  return JSON.stringify([obs.declared, obs.won, obs.leads, h]);
}
const empty = (obs) => !obs.declared && !sum(obs.won) && !sum(obs.leads) && !obs.head;

// ---------- checks against the body's size and the currently published result ----------
export function validate(id, obs, body, current) {
  const issues = [];
  const rural = id.startsWith("rural-");
  const total = rural ? RURAL_TOTAL[id.slice(6)] : body?.wards;
  if (!total) return ["unknown body"];
  const won = sum(obs.won), leads = sum(obs.leads);
  if (obs.declared > total) issues.push(`declared ${obs.declared} > ${total} seats`);
  if (won > total) issues.push(`won ${won} > ${total} seats`);
  if (won + leads > total) issues.push(`won + leading ${won + leads} > ${total} seats`);
  if (won > obs.declared) issues.push(`won ${won} > declared ${obs.declared}`);
  if (obs.head && rural) issues.push("rural results have no head post");
  if (current) {
    const cw = (rural ? current.seats : current.wards) || {};
    if ((current.declared || 0) > obs.declared) issues.push(`declared went down (${current.declared} → ${obs.declared})`);
    for (const p of PARTIES) if ((cw[p] || 0) > (obs.won[p] || 0)) issues.push(`${p} won went down (${cw[p]} → ${obs.won[p] || 0})`);
    if (current.head?.status === "won" && obs.head && (obs.head.status !== "won" || obs.head.party !== current.head.party)) issues.push(`head post already declared for ${current.head.party}`);
  }
  return issues;
}

// The row the site will store if the admin approves: the current result with the observed fields applied.
export function propose(id, obs, current) {
  if (id.startsWith("rural-")) return { declared: obs.declared, seats: obs.won };
  const next = { ...(current || {}), declared: obs.declared, wards: obs.won };
  if (sum(obs.leads)) next.leads = obs.leads; else delete next.leads;
  if (obs.head) next.head = { ...obs.head, name: obs.head.name || current?.head?.name || "" };
  if (next.head && next.head.margin == null) delete next.head.margin;
  return next;
}
const sameAsCurrent = (id, obs, current) => {
  if (!current) return false;
  const cw = (id.startsWith("rural-") ? current.seats : current.wards) || {};
  return (current.declared || 0) === obs.declared && JSON.stringify(sortObj(cw)) === JSON.stringify(obs.won)
    && JSON.stringify(sortObj(current.leads || {})) === JSON.stringify(obs.leads)
    && (current.head?.party ?? null) === (obs.head?.party ?? null) && (current.head?.status ?? null) === (obs.head?.status ?? null);
};

// ---------- cross-source verification ----------
// pages: [{ source: {id, name, url, kind}, text, observations: [raw] }]
// Returns one proposal per (body, agreeing set of numbers), with the sources that confirm it.
export function crossVerify(pages, bodies, currentByBody, minConfirm = 2) {
  const BY = Object.fromEntries(bodies.map((b) => [b.id, b]));
  const groups = new Map(), dropped = [];
  for (const pg of pages) {
    const hay = norm(pg.text);
    for (const raw of pg.observations || []) {
      const id = raw.body_id;
      if (!BY[id] && !id?.startsWith("rural-")) { dropped.push({ source: pg.source.name, body_id: id, why: "unknown body" }); continue; }
      const q = norm(raw.quote);
      if (q.length < 6 || !hay.includes(q)) { dropped.push({ source: pg.source.name, body_id: id, why: "quote not found on the page" }); continue; }
      const obs = normalise(raw);
      if (empty(obs)) continue;
      const key = id + "|" + fingerprint(obs);
      const g = groups.get(key) || { body_id: id, obs, fingerprint: fingerprint(obs), sources: [] };
      if (!g.sources.some((s) => s.url === pg.source.url)) g.sources.push({ name: pg.source.name, url: pg.source.url, kind: pg.source.kind, domain: domainOf(pg.source.url), quote: String(raw.quote).slice(0, 400), head_name: obs.head?.name || null });
      groups.set(key, g);
    }
  }
  const perBody = {};
  for (const g of groups.values()) (perBody[g.body_id] ||= []).push(g);
  const out = [];
  for (const g of groups.values()) {
    const current = currentByBody[g.body_id];
    if (sameAsCurrent(g.body_id, g.obs, current)) continue;
    const domains = [...new Set(g.sources.map((s) => s.domain))];
    const official = g.sources.some((s) => s.kind === "official");
    const issues = validate(g.body_id, g.obs, BY[g.body_id], current);
    const rivals = perBody[g.body_id].filter((x) => x !== g);
    if (rivals.length) issues.push(`sources disagree: ${rivals.length + 1} different versions this run`);
    if (g.obs.head) { const names = [...new Set(g.sources.map((s) => s.head_name).filter(Boolean).map((n) => n.toLowerCase()))]; if (names.length > 1) issues.push("head candidate's name spelt differently across sources"); }
    const confidence = issues.length ? "check" : official || domains.length >= minConfirm ? "high" : "low";
    out.push({ body_id: g.body_id, observed: g.obs, proposed: propose(g.body_id, g.obs, current), fingerprint: g.fingerprint, sources: g.sources, domains, confirmations: domains.length, official, issues, confidence });
  }
  return { proposals: out, dropped };
}

// A single-source proposal that keeps appearing run after run is upgraded from low to medium.
export function rescore(p, seenRuns) {
  if (p.confidence === "low" && seenRuns >= 2) return "medium";
  return p.confidence;
}


// ---------- postal ballots ----------
// Postal ballot votes are counted first and reported as votes (not wards). They go straight to meta.postal
// (the live page's postal box) once the quote is found on the page; a body's entry only ever moves forward.
const counted = (x) => x.total || sum(x.votes) || 0;
export function postalItems(pages, bodies, at = new Date().toISOString()) {
  const BY = new Set(bodies.map((b) => b.id)), out = [], dropped = [];
  for (const pg of pages) {
    const hay = norm(pg.text);
    for (const raw of pg.postal || []) {
      const id = raw.body_id, q = norm(raw.quote);
      if (!BY.has(id)) { dropped.push({ source: pg.source.name, body_id: id, why: "postal: unknown body" }); continue; }
      if (q.length < 6 || !hay.includes(q)) { dropped.push({ source: pg.source.name, body_id: id, why: "postal: quote not found on the page" }); continue; }
      const votes = toMap(raw.votes), total = Number.isInteger(raw.total) && raw.total > 0 ? raw.total : null;
      const lead = PARTIES.includes(raw.lead_party) ? { party: raw.lead_party, ...(Number.isInteger(raw.lead_by) && raw.lead_by > 0 ? { by: raw.lead_by } : {}) } : null;
      if (total && sum(votes) > total) { dropped.push({ source: pg.source.name, body_id: id, why: `postal: votes ${sum(votes)} > total ${total}` }); continue; }
      if (!sum(votes) && !total && !lead) continue;
      out.push({ body: id, at, ...(sum(votes) ? { votes: sortObj(votes) } : {}), ...(total ? { total } : {}), ...(lead ? { lead } : {}), src: [pg.source.name, pg.source.url], quote: String(raw.quote).slice(0, 300) });
    }
  }
  return { items: out, dropped };
}
// Merge new postal items into the published list: replace a body's entry only when more votes are counted,
// or when the old entry had no numbers / no leader and the new one does. Returns null when nothing changed.
export function mergePostal(prev, fresh) {
  const by = Object.fromEntries((prev || []).map((x) => [x.body, x])); let changed = false;
  for (const x of fresh) {
    const o = by[x.body];
    const better = !o || counted(x) > counted(o) || (counted(x) === counted(o) && ((!o.votes && x.votes) || (!o.lead && x.lead)));
    if (better) { by[x.body] = x; changed = true; }
  }
  return changed ? Object.values(by) : null;
}

// ---------- Mayor / Chairperson from Eenadu's winner-list pages ----------
// Each body on those pages reads "<wards|divisions> విజేత పార్టీ <name> (మేయర్|ఛైర్పర్సన్) <candidate> [(ఆధిక్యం)] <party> వార్డు-1 …":
// "(ఆధిక్యం)" = leading, no tag = won, nothing before "వార్డు-1" = no result yet. Parsed exactly, no Claude call.
export const HEAD_PAGES = ["https://www.eenadu.net/andhra-pradesh/corporation-election-winners-list-2026",
  ...["Srikakulam", "Parvathipuram-Manyam", "Vizianagaram", "Anakapalli", "Kakinada", "Dr.-B.R.-Ambedkar-Konaseema", "East-Godavari", "West-Godavari", "Eluru",
    "Krishna", "NTR", "Guntur", "Palnadu", "Bapatla", "Prakasam", "MARKAPURAM", "SRI-POTTI-SRIRAMULU-NELLORE", "Kurnool", "Nandyal", "ANANTAPURAMU",
    "Sri-Satya-Sai", "YSR-Kadapa", "Annamayya", "Tirupati", "Chittoor"].map((d) => "https://www.eenadu.net/andhra-pradesh/municipal-election-winners-list-2026/" + d)];
const TE_PARTY = { "టీడీపీ": "TDP", "జనసేన": "JSP", "బీజేపీ": "BJP", "వైసీపీ": "YSRCP", "కాంగ్రెస్": "INC", "సీపీఐ": "LEFT", "సీపీఎం": "LEFT", "ఇతరులు": "OTH", "స్వతంత్ర": "OTH" };
const plainTe = (html) => decodeEntities(String(html).replace(/&zwn?j;/gi, "").replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/[\u200c\u200d]/g, "").replace(/\s+/g, " ");
// One entry per body: its head post (or null) and every ward with a result, as [ward no, party, "won"|"leading", candidate].
export function eenaduBodies(html) {
  const text = plainTe(html), out = [], re = /(?:వార్డులు|డివిజన్లు) విజేత పార్టీ (.+?) \((?:మేయర్|ఛైర్పర్సన్|చైర్పర్సన్|ఛైర్మన్|చైర్మన్)\)/gu;
  const marks = [...text.matchAll(re)];
  marks.forEach((m, i) => {
    const block = text.slice(m.index + m[0].length, marks[i + 1]?.index ?? text.length);
    const parts = (" " + block).split(/ (?:వార్డు|డివిజన్)-(\d+)(?!\d)/); // [head text, no, text, no, text, …]
    const entry = (seg) => {
      seg = seg.replace(/ (?:ఆంధ్రప్రదేశ్|ఏ జిల్లా|వార్డులు విజేత|డివిజన్లు విజేత)[\s\S]*$/, "").trim(); // stop at the next section
      if (!seg) return null;
      const lead = seg.match(/^(.+?) \(ఆధిక్యం\) (\S+)/), last = seg.lastIndexOf(" ");
      const [name, pt, status] = lead ? [lead[1], lead[2], "leading"] : [last > 0 ? seg.slice(0, last) : "", seg.slice(last + 1), "won"];
      return TE_PARTY[pt] ? { party: TE_PARTY[pt], name: name.trim(), status } : null;
    };
    const wards = [];
    for (let k = 1; k + 1 < parts.length; k += 2) { const e = entry(parts[k + 1]); if (e) wards.push([+parts[k], e.party, e.status, e.name]); }
    out.push({ te: m[1].trim(), head: entry(parts[0]), wards });
  });
  return out;
}
export const eenaduHeads = (html) => eenaduBodies(html).filter((b) => b.head).map(({ te, head }) => ({ te, head }));
// Match a page's Telugu body name to a body (exact, else one name ending with the other, e.g. విశాఖపట్నం ↔ గ్రేటర్ విశాఖపట్నం).
const teKey = (s) => String(s || "").replace(/[\s()\-.\u200c\u200d]/g, "");
const TE_ALIAS = { "బద్వేల్": "badvel", "యర్రగుంట్ల": "yerraguntla" }; // Eenadu's spelling differs from ours
export function matchBody(te, bodies) {
  const k = teKey(te), alias = Object.entries(TE_ALIAS).find(([t]) => k.endsWith(teKey(t)))?.[1];
  if (alias) return bodies.find((b) => b.id === alias) || null;
  const named = bodies.filter((b) => b.name_te);
  const exact = named.filter((b) => teKey(b.name_te) === k);
  if (exact.length === 1) return exact[0];
  const loose = named.filter((b) => { const t = teKey(b.name_te); return t.endsWith(k) || k.endsWith(t); });
  return loose.length === 1 ? loose[0] : null;
}
// The head post to publish, or null: never moves a declared winner back to leading or to another party.
// Vote counts and margins typed in from the channels (votes, margin, counted) are kept while the same party leads.
// A head post updated from the news channels (manualAt) isn't replaced by Eenadu's lead for 30 minutes, only by a win:
// Eenadu's winner pages can lag behind the channels.
export function nextHead(cur, head, now = Date.now()) {
  if (cur?.status === "won") return null;
  if (cur?.manualAt && now - Date.parse(cur.manualAt) < 30 * 60000 && head.status !== "won") return null;
  if (cur && cur.party === head.party && cur.status === head.status && (cur.name || "") === head.name) return null;
  if (cur && cur.party === head.party) { const { votes, margin, marginPlus, counted, runnerUp } = cur; return { ...head, ...(votes ? { votes } : {}), ...(margin != null ? { margin } : {}), ...(marginPlus ? { marginPlus } : {}), ...(counted ? { counted } : {}), ...(runnerUp ? { runnerUp } : {}) }; }
  return head;
}
// Merge a fresh ward list into the published one: a won ward is never moved back, wards missing from the page are kept.
// Returns the merged list sorted by ward number, or null when nothing changed.
export function mergeWards(prev, fresh) {
  const by = new Map((prev || []).map((w) => [w[0], w]));
  let changed = false;
  for (const w of fresh || []) {
    const o = by.get(w[0]);
    if (o?.[2] === "won" && w[2] !== "won") continue;
    if (!o || o[1] !== w[1] || o[2] !== w[2] || o[3] !== w[3]) { by.set(w[0], w); changed = true; }
  }
  return changed ? [...by.values()].sort((a, b) => a[0] - b[0]) : null;
}

// ---------- ward totals from Eenadu's results table ----------
// Rows read "<district> <body> (<declared>/<wards>) <Kutami> <YSRCP> <others>", under the headings కూటమి వైకాపా ఇతరులు.
export const TABLE_PAGE = "https://www.eenadu.net/andhra-pradesh/corporation-and-municipal-election-results-2026";
export function eenaduTable(html) {
  const text = plainTe(html), out = [];
  let from = 0;
  for (const m of text.matchAll(/\((\d+)\/(\d+)\) (\d+) (\d+) (\d+)/g)) {
    const te = text.slice(from, m.index).replace(/^.*(?:కూటమి వైకాపా ఇతరులు|ఇతరులు)/, "").trim();
    from = m.index + m[0].length;
    const [declared, wards, k, y, o] = m.slice(1).map(Number);
    if (te && k + y + o <= declared && declared <= wards) out.push({ te, declared, total: wards, won: { NDA: k, YSRCP: y, OTH: o } });
  }
  return out;
}
// The published record with this row's ward totals, or null when nothing changed or it would move backwards.
export function nextTotals(cur, row) {
  if (row.declared < (cur?.declared || 0)) return null;
  const won = Object.fromEntries(Object.entries(row.won).filter(([, n]) => n > 0));
  if (cur && cur.declared === row.declared && JSON.stringify(cur.wards || {}) === JSON.stringify(won)) return null;
  const next = { ...(cur || {}), declared: row.declared, wards: won };
  delete next.leads; // the table has no leads; older ones would be out of date
  return next;
}

// Leading wards for the summary (the public pages no longer download ward lists): counted from the ward list once the
// winner pages' stale "leading" tags are set aside (declared covers every listed ward → they're wins), and never more
// than the wards still being counted. Returns the record with updated leads, or null when they didn't change.
export function withLeads(rec, totalWards) {
  const wl = rec?.wardList; if (!wl?.length) return null;
  const sumOf = (o) => Object.values(o || {}).reduce((a, n) => a + n, 0), room = totalWards - (rec.declared || 0);
  const l = {};
  if (rec.declared < wl.length && room > 0) for (const [, p, st] of wl) if (st === "leading") l[p] = (l[p] || 0) + 1;
  const n = sumOf(l), k = n > room ? room / n : 1;
  const leads = Object.fromEntries(Object.entries(l).map(([p, v]) => [p, Math.round(v * k)]).filter(([, v]) => v));
  if (JSON.stringify(leads) === JSON.stringify(rec.leads || {})) return null;
  const next = { ...rec, leads }; if (!sumOf(leads)) delete next.leads;
  return JSON.stringify(next.leads || {}) === JSON.stringify(rec.leads || {}) ? null : next;
}

// ---------- ETV Bharat's live tracker (public JSON feed) ----------
// latest.json points to the current files: heads (mayor_chairperson), per-body totals (byMunicipalCorporation) and
// every ward (division_ward). Quirk: a body's Wards/Divisions list also repeats the bodies before it, so only its own
// last entries (one per party) count. Totals mix won and leading, so they're used only when nothing is leading.
export const ETVB_INDEX = "https://d1cbf5vryixueg.cloudfront.net/2026-11-03/latest.json";
const ETVB_PARTY = { TDP: "TDP", JANASENA: "JSP", BJP: "BJP", YSRCP: "YSRCP", INC: "INC", CONGRESS: "INC", CPI: "LEFT", CPM: "LEFT", "CPI (M)": "LEFT", "CPI(M)": "LEFT" };
const etvbParty = (p) => ETVB_PARTY[String(p || "").toUpperCase().trim()] || "OTH";
const enKey = (s) => String(s || "").toUpperCase().replace(/[^A-Z]/g, "");
const etvbBody = (te, en, bodies) => matchBody(te, bodies) || (() => { const c = bodies.filter((b) => enKey(b.name) === enKey(en)); return c.length === 1 ? c[0] : null; })();
export function etvbParse(heads, pie, wards, bodies) {
  const out = {};
  const at = (id) => (out[id] ||= {});
  for (const h of [...(heads?.Corporate?.Results || []), ...(heads?.Muncipality?.Results || [])]) {
    if (!/^(Won|Lead)$/.test(h.status_in_english)) continue;
    const b = etvbBody(h.name_in_local, h.name_in_english, bodies);
    if (b) at(b.id).head = { party: etvbParty(h.party_in_english), status: h.status_in_english === "Won" ? "won" : "leading", name: h.candidate_in_local || h.candidate_in_english || "" };
  }
  const sheet = pie?.Sheet1 || {};
  for (const r of [...(sheet.Corporation || []), ...(sheet.Municipality || [])]) {
    const b = etvbBody(r.Corporation_in_local || r.Municipality_in_local, r.Corporation || r.Municipality, bodies);
    if (!b || r.LEAD || !r.WON) continue;
    const arr = r.Divisions || r.Wards || [], k = new Set(arr.map((x) => x.name)).size, w = {};
    for (const x of arr.slice(-k)) if (x.total) w[etvbParty(x.name)] = (w[etvbParty(x.name)] || 0) + x.total;
    if (Object.values(w).reduce((a, n) => a + n, 0) === r.WON && r.WON <= b.wards) at(b.id).totals = { declared: r.WON, wards: w };
  }
  for (const r of [...(wards?.Corporate?.Results || []), ...(wards?.Muncipality?.Results || [])]) {
    if (!/^(Won|Lead)$/.test(r.status_in_english)) continue;
    const mc = r.munciplaity_corporation || {}, b = etvbBody(mc.name_in_local, mc.name_in_english, bodies), n = +String(r.name_in_english).replace(/\D/g, "");
    if (b && n) (at(b.id).wards ||= []).push([n, etvbParty(r.party_in_english), r.status_in_english === "Won" ? "won" : "leading", r.candidate_in_local || r.candidate_in_english || ""]);
  }
  return out;
}
// Second-source ward merge: adds missing wards and leading → won / party changes; a name-only difference is ignored
// (two sources spell names differently and would otherwise overwrite each other every run).
export function mergeWardsExtra(prev, fresh) {
  const by = new Map((prev || []).map((w) => [w[0], w])); let changed = false;
  for (const w of fresh || []) {
    const o = by.get(w[0]);
    if (o?.[2] === "won" && (w[2] !== "won" || o[1] === w[1])) continue;
    if (!o || o[1] !== w[1] || o[2] !== w[2]) { by.set(w[0], w); changed = true; }
  }
  return changed ? [...by.values()].sort((a, b) => a[0] - b[0]) : null;
}

// ---------- mandal results (ZPTC winner, MPTC seats) ----------
// Go straight to meta.mandals once the quote is found on the page, like postal ballots. A mandal only moves forward:
// a declared ZPTC winner is never replaced, a leader can change, MPTC seats only grow.
export function mandalItems(pages) {
  const out = [], dropped = [];
  for (const pg of pages) {
    const hay = norm(pg.text);
    for (const raw of pg.mandals || []) {
      const id = String(raw.mandal_id || ""), q = norm(raw.quote);
      if (!MANDAL_IDS.has(id)) { dropped.push({ source: pg.source.name, body_id: id, why: "mandal: unknown mandal" }); continue; }
      if (q.length < 6 || !hay.includes(q)) { dropped.push({ source: pg.source.name, body_id: id, why: "mandal: quote not found on the page" }); continue; }
      const z = raw.zptc && PARTIES.includes(raw.zptc.party) ? { party: raw.zptc.party, status: raw.zptc.status === "won" ? "won" : "leading", ...(String(raw.zptc.name || "").trim() ? { name: String(raw.zptc.name).trim().slice(0, 80) } : {}) } : null;
      const won = toMap(raw.mptc_won), declared = Math.max(Number.isInteger(raw.mptc_declared) ? raw.mptc_declared : 0, sum(won));
      if (!z && !declared) continue;
      out.push({ id, z, m: declared ? { declared, won: sortObj(won) } : null, src: pg.source.name });
    }
  }
  return { items: out, dropped };
}
// The live file follows its source: what ETV Bharat lists now replaces what it listed before (it clears test entries and
// corrects seats). If the feed looks cut short (far fewer mandals than before) the missing mandals are kept instead.
// Returns the new mandal map, or null when nothing changed.
export function followMandals(prev, fresh) {
  const now = {};
  for (const x of fresh) now[x.id] = { ...(x.z ? { z: x.z } : {}), ...(x.m ? { m: x.m } : {}) };
  const p = prev || {}, cut = Object.keys(p).length > 20 && Object.keys(now).length < Object.keys(p).length * 0.8;
  const out = cut ? { ...p, ...now } : now;
  return JSON.stringify(out) === JSON.stringify(p) ? null : out;
}
export function mergeMandals(prev, fresh) {
  const by = { ...(prev || {}) }; let changed = false;
  for (const x of fresh) {
    const o = by[x.id] || {}, n = { ...o };
    if (x.z && o.z?.status !== "won" && (x.z.status === "won" || !o.z || o.z.party !== x.z.party || (x.z.name && !o.z.name))) n.z = x.z;
    if (x.m && (x.m.declared > (o.m?.declared || 0) || (x.m.declared === (o.m?.declared || 0) && JSON.stringify(x.m.leads || {}) !== JSON.stringify(o.m?.leads || {})))) n.m = x.m;
    if (JSON.stringify(n) !== JSON.stringify(o)) { by[x.id] = n; changed = true; }
  }
  return changed ? by : null;
}

// ---------- ZPTC / MPTC from ETV Bharat's tracker (exact, no Claude) ----------
// One file lists every ZPTC (by mandal) and every MPTC seat with its district, mandal, status and winner.
// Each mandal gets its ZPTC winner / leader and its MPTC seats won and leading per party; the page adds them up by district.
export const ETVB_RURAL = "https://d1cbf5vryixueg.cloudfront.net/2026-11-07/latest.json";
const mkey = (s) => String(s || "").replace(/\(.*$/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const dkey = (s) => mkey(s).replace(/^(drbrambedkar|ysr|ys|sripottisreeramulu|sripottisriramulu)/, "").replace(/^ananthapuramu$/, "anantapur");
const lev = (a, b) => { const d = [...Array(b.length + 1).keys()]; for (let i = 1; i <= a.length; i++) { let p = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return d[b.length]; };
const D_BY = Object.fromEntries(DISTRICTS.map(([id, name]) => [dkey(name), id]));
const M_BY = {}; for (const [d, m, name] of MANDALS) (M_BY[d] ||= []).push([m, mkey(name), mkey(m)]);
// a mandal id from ETV's district and mandal names: exact name in the district, then anywhere in the state
// if the name is unique (two districts were redrawn differently), then a close spelling inside the district
// ETV lists these two under Annamayya; the SEC mandal list has them in Chittoor
const R_ALIAS = { "annamayya/rompicherla": "chittoor/rompicherla", "annamayya/pulicherla": "chittoor/pulicherla" };
export function ruralMandal(district, mandal) {
  const d = D_BY[dkey(district)], k = mkey(mandal); if (!k) return null;
  if (R_ALIAS[d + "/" + k]) return R_ALIAS[d + "/" + k];
  const L = M_BY[d] || [], hit = L.find((x) => x[1] === k || x[2] === k); if (hit) return d + "/" + hit[0];
  const any = MANDALS.filter(([, m, n]) => mkey(n) === k || mkey(m) === k); if (any.length === 1) return any[0][0] + "/" + any[0][1];
  const near = L.map((x) => [lev(x[1], k), x[0]]).sort((a, b) => a[0] - b[0]);
  return near[0] && near[0][0] <= Math.max(2, Math.floor(k.length / 5)) && (!near[1] || near[1][0] > near[0][0]) ? d + "/" + near[0][1] : null;
}
// seats shown as won before counting began were decided unopposed
export const RURAL_COUNT_AT = Date.parse("2026-11-07T08:00:00+05:30");
export function etvbRural(cons, now = Date.now()) {
  const out = {}, unmatched = new Set(), at = (id) => (out[id] ||= {});
  const st = (r) => (r.status_in_english === "Won" ? "won" : r.status_in_english === "Lead" ? "leading" : null);
  for (const r of cons?.["Zilla Parishad"]?.Results || []) {
    const s = st(r); if (!s || !r.party_in_english) continue;
    const id = ruralMandal(r.district_in_english, r.name_in_english); if (!id) { unmatched.add("ZPTC " + r.district_in_english + "/" + r.name_in_english); continue; }
    const name = String(r.candidate_in_local || r.candidate_in_english || "").trim().slice(0, 80);
    at(id).z = { party: etvbParty(r.party_in_english), status: s, ...(name ? { name } : {}), ...(s === "won" && now < RURAL_COUNT_AT ? { unopposed: true } : {}) };
  }
  for (const r of cons?.["Mandal Parishad"]?.Results || []) {
    const s = st(r); if (!s || !r.party_in_english) continue;
    const id = ruralMandal(r.district_in_english, r.mandal_in_english); if (!id) { unmatched.add("MPTC " + r.district_in_english + "/" + r.mandal_in_english); continue; }
    const m = (at(id).m ||= { declared: 0, won: {}, leads: {} }), p = etvbParty(r.party_in_english);
    if (s === "won") { m.won[p] = (m.won[p] || 0) + 1; m.declared++; } else m.leads[p] = (m.leads[p] || 0) + 1;
  }
  return { items: Object.entries(out).map(([id, x]) => ({ id, z: x.z || null, m: x.m ? { declared: x.m.declared, won: sortObj(x.m.won), ...(sum(x.m.leads) ? { leads: sortObj(x.m.leads) } : {}) } : null, src: "ETV Bharat" })), unmatched: [...unmatched] };
}
