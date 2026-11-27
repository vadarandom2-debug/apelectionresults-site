// Admin "Share image": render a mayor / chairperson seat result as a PNG card branded @shiva4tdp.
(() => {
  const BODIES = window.AP_BODIES, CAND = window.AP_CANDIDATES || { bodies: {}, ndaSeat: {} };
  const COL = { TDP: "#d4a000", JSP: "#c4122f", BJP: "#f28c00", NDA: "#d4a000", YSRCP: "#1d5fc4", INC: "#16936a", LEFT: "#6a3d9a", OTH: "#8a93a6" };
  const PNAME = { TDP: "Telugu Desam", JSP: "Jana Sena", BJP: "BJP", NDA: "Kutami (NDA)", YSRCP: "YSR Congress", INC: "Congress", LEFT: "CPI / CPI(M)", OTH: "Independent / other" };
  const LOGO = { TDP: "tdp", JSP: "jsp", BJP: "bjp", YSRCP: "ysrcp", INC: "inc", LEFT: "left" };
  const ORDER = ["TDP", "JSP", "BJP", "NDA", "YSRCP", "INC", "LEFT", "OTH"];
  const TYPE = { C: "Municipal Corporation", M: "Municipality", NP: "Nagar Panchayat" };
  const HANDLE = "@shiva4tdp";
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
  const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
  const st = { id: "greater-visakhapatnam", fmt: "wide", demo: false, lang: "te", tpl: "versus", font: "Ramabhadra", shiva: true, tdp: true };
  // Telugu display fonts (Google Fonts). w: the font has real weights; s: size tweak for fonts that run small.
  const FONTS = [
    ["Ramabhadra"], ["NTR"], ["Mandali"], ["Gidugu"], ["Suravaram"], ["Tenali Ramakrishna"], ["Sree Krushnadevaraya"], ["Mallanna"],
    ["Timmana"], ["Ponnala"], ["Dhurjati"], ["Gurajada"], ["Peddana"], ["Ramaraja"], ["Lakki Reddy"], ["Suranna"], ["Ravi Prakash"],
    ["Sirivennela"], ["Anek Telugu", 1], ["Noto Sans Telugu", 1], ["Noto Serif Telugu", 1], ["Hind Guntur", 1], ["Chathura", 1, 1.3],
  ].map(([name, w, s]) => ({ name, w: !!w, s: s || 1 }));
  const FONT = () => FONTS.find((f) => f.name === st.font) || FONTS[0];
  let fontsLinked = false;
  function linkFonts() {
    if (fontsLinked) return; fontsLinked = true;
    const fam = FONTS.filter((f) => f.name !== "Ramabhadra").map((f) => "family=" + f.name.replace(/ /g, "+") + (f.w ? ":wght@400;600;800" : "")).join("&");
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = `https://fonts.googleapis.com/css2?${fam}&display=swap`; document.head.appendChild(l);
  }
  // Live results: the same Supabase data the public site shows, refreshed every 30 s while this tab is open.
  let LIVE = null, liveKey = "";
  async function refreshLive() {
    const S = await window.SUPA?.ready; if (!S?.client) return false;
    const [res, c] = await Promise.all([S.loadResults(), S.client.from("candidates").select("body_id,party,name,name_te,note,status").order("id")]);
    if (c?.data?.length) {
      const g = {}; c.data.forEach((x) => { (g[x.body_id] ||= []).push([x.party, x.name, x.note || "", x.status === "reported" ? "reported" : ""]); if (x.name_te && window.AP_TE) window.AP_TE.names[x.name] = x.name_te; });
      CAND.bodies = g;
    }
    if (!res) return false;
    const key = JSON.stringify([res, c?.data?.length]); const changed = key !== liveKey; liveKey = key; LIVE = res;
    return changed;
  }
  const SIZES = { wide: [1200, 675], square: [1080, 1080], story: [1080, 1920] };
  const imgs = {};

  const loadImg = (src) => imgs[src] || (imgs[src] = new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));

  // contenders for the head post: announced / reported names (+ the Kutami partner if not yet named)
  function contenders(b) {
    const out = [];
    (CAND.bodies[b.id] || []).forEach(([p, n, , s]) => { if (!out.some((c) => c.p === p)) out.push({ p, n, reported: s === "reported" }); });
    const nda = CAND.ndaSeat[b.id]; if (nda && !out.some((c) => c.p === nda)) out.push({ p: nda, n: "" });
    return out;
  }

  // simulated record for the preview — never saved anywhere
  function demoRecord(b) {
    let seed = [...b.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const cs = contenders(b).length ? contenders(b) : [{ p: "TDP", n: "" }, { p: "YSRCP", n: "" }];
    const w = {}; cs.forEach((c) => (w[c.p] = 0.5 + rnd())); w.OTH = 0.15;
    const declared = Math.round(b.wards * (0.45 + rnd() * 0.4)), wards = {}, leads = {};
    const pick = () => { let x = rnd() * sum(w); for (const [k, v] of Object.entries(w)) if ((x -= v) <= 0) return k; return "OTH"; };
    for (let i = 0; i < declared; i++) { const p = pick(); wards[p] = (wards[p] || 0) + 1; }
    for (let i = 0; i < Math.round((b.wards - declared) * 0.6); i++) { const p = pick(); leads[p] = (leads[p] || 0) + 1; }
    const top = cs.map((c) => c.p).sort((a, c) => (wards[c] || 0) - (wards[a] || 0))[0];
    const tc = cs.find((c) => c.p === top);
    return { declared, wards, leads, turnout: +(55 + rnd() * 20).toFixed(1), head: { party: top, name: tc?.n || "", status: "leading", margin: Math.round(800 + rnd() * 9000) } };
  }

  // ---------- canvas helpers ----------
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  let AVATAR = null;
  function drawBrand(ctx, x, y, s) {
    if (AVATAR) {
      ctx.save(); ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s / 2, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(AVATAR, x, y, s, s); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s / 2, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = "#F5C400"; ctx.stroke(); ctx.restore();
      return;
    }
    ctx.save();
    ctx.fillStyle = "#111827"; rr(ctx, x, y, s, s, s * 0.23); ctx.fill();
    ctx.fillStyle = "#F5C400"; rr(ctx, x + s * 0.077, y + s * 0.077, s * 0.846, s * 0.846, s * 0.17); ctx.fill();
    ctx.fillStyle = "#111827"; ctx.font = `900 ${s * 0.66}px "Inter Tight", Arial Black, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText("S", x + s * 0.5, y + s * 0.74);
    const cx = x + s * 0.8, cy = y + s * 0.8, r = s * 0.17;
    ctx.fillStyle = "#C4122F"; ctx.strokeStyle = "#F5C400"; ctx.lineWidth = s * 0.04; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = s * 0.045; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(cx - r * 0.45, cy); ctx.lineTo(cx - r * 0.1, cy + r * 0.35); ctx.lineTo(cx + r * 0.5, cy - r * 0.35); ctx.stroke();
    ctx.restore();
  }

  // ---------- language ----------
  const TE = window.AP_TE || { parties: {}, types: {}, res: {}, districts: {}, bodies: {}, names: {} };
  const L = {
    te: {
      top: (post) => `ఆంధ్రప్రదేశ్ స్థానిక సంస్థల ఎన్నికలు 2026 · ${post}`, mayor: "మేయర్", chair: "చైర్‌పర్సన్",
      pill: { AWAITING: "ఫలితం కోసం ఎదురుచూపు", COUNTING: "● లైవ్ · ఓట్ల లెక్కింపు", RESULT: "✓ ఫలితం ప్రకటన" },
      body: (b) => TE.bodies[b.id] || b.name,
      sub: (b, post) => `${TE.types[b.type]} · ${TE.districts[b.district] || b.district} జిల్లా · ${b.wards} ${b.type === "C" ? "డివిజన్లు" : "వార్డులు"} · ${post} రిజర్వేషన్: ${TE.res[b.res] || b.res}`,
      cands: (post) => `${post} అభ్యర్థులు`, none: "అభ్యర్థులను ఇంకా ప్రకటించలేదు",
      pname: (p) => (TE.parties[p] || [p, p])[1], pshort: (p) => (TE.parties[p] || [p])[0],
      name: (n) => TE.names[n] || n, unnamed: (p) => `${(TE.parties[p] || [p])[0]} అభ్యర్థి`, reported: " · కథనాల ప్రకారం",
      lead: "ఆధిక్యం", won: "విజయం", by: (m) => `${m} ఓట్లు`,
      wardsT: (b) => (b.type === "C" ? "కౌన్సిల్ డివిజన్లు" : "కౌన్సిల్ వార్డులు"), declared: "ప్రకటించినవి", more: (n) => ` · మరో ${n} ఆధిక్యంలో`,
      majority: (n) => `మెజారిటీ ${n}`, countStart: "లెక్కింపు 3 నవంబర్, ఉదయం 8 గంటలకు",
      tag: "ఏపీ ఎన్నికల అప్‌డేట్స్", updated: (w) => `నవీకరణ: ${w}`, srcReal: "రాష్ట్ర ఎన్నికల సంఘం ప్రకటించిన ఫలితాలు", srcDemo: "నమూనా చిత్రం — ఇవి నిజమైన ఫలితాలు కావు",
      wm1: "డెమో · నిజం కాదు", wm2: "నమూనా ఫలితాలు",
    },
    en: {
      top: (post) => `AP LOCAL BODY ELECTIONS 2026 · ${post.toUpperCase()}`, mayor: "Mayor", chair: "Chairperson",
      pill: { AWAITING: "AWAITING RESULT", COUNTING: "● LIVE · COUNTING", RESULT: "✓ RESULT DECLARED" },
      body: (b) => b.name,
      sub: (b, post) => `${TYPE[b.type]} · ${b.district} district · ${b.wards} wards · ${post}: ${b.res}`,
      cands: (post) => `${post.toUpperCase()} CANDIDATES`, none: "Candidates not yet announced",
      pname: (p) => PNAME[p], pshort: (p) => p, name: (n) => n, unnamed: (p) => `${PNAME[p]} candidate`, reported: " · reported",
      lead: "LEADING", won: "WON", by: (m) => `by ${m}`,
      wardsT: () => "COUNCIL WARDS", declared: "declared", more: (n) => ` · ${n} more leading`,
      majority: (n) => `majority ${n}`, countStart: "Counting begins 3 Nov, 8 AM",
      tag: "AP ELECTION UPDATES", updated: (w) => `Updated ${w} IST`, srcReal: "As declared by the State Election Commission, AP", srcDemo: "Simulated preview — not an actual result",
      wm1: "DEMO · NOT REAL", wm2: "SIMULATED RESULTS",
    },
  };
  // fonts: Telugu text uses Ramabhadra (single weight); English keeps Inter Tight / JetBrains Mono
  const F = (w, size, mono = false) => (st.lang === "te" ? (() => { const f = FONT(); return `${f.w ? Math.min(800, w) + " " : ""}${Math.round(size * (size < 22 ? 1.22 : 1.08) * f.s)}px "${f.name}", "Ramabhadra", "Noto Sans Telugu", sans-serif`; })() : mono ? `${w} ${size}px "JetBrains Mono", monospace` : `${w} ${size}px "Inter Tight", Arial, sans-serif`);
  const spaced = (ctx, px) => (ctx.letterSpacing = st.lang === "te" ? "0px" : px + "px");
  function fitF(ctx, text, max, size, w = 800) { let s = size; do { ctx.font = F(w, s); s -= 1; } while (ctx.measureText(text).width > max && s > 12); }

  async function render() {
    const real = LIVE ? LIVE.bodies?.[st.id] : (window.getAdminResults?.() || {}).bodies?.[st.id];
    document.querySelector(".tpl-pick")?.classList.toggle("off", st.id === STATE); // the statewide card has its own design
    const out = await paint($("#shareCanvas"), real); if (out) finishUI(...out);
  }
  // Draws the current settings (st) onto canvas cv. Used by the admin tab and, through SHARE_DRAW, by the public site.
  async function paint(cv, real) {
    if (st.id === STATE) return paintState(cv);
    const b = BODIES.find((x) => x.id === st.id); if (!b) return null;
    const T = L[st.lang], te = st.lang === "te";
    const [W0, H0] = SIZES[st.fmt], wide = st.fmt === "wide";
    const r = st.demo ? demoRecord(b) : real;
    cv.width = W0 * 2; cv.height = H0 * 2;
    const ctx = cv.getContext("2d"); ctx.setTransform(2, 0, 0, 2, 0, 0);
    await Promise.all([document.fonts.load('800 40px "Inter Tight"'), document.fonts.load('700 30px "JetBrains Mono"'), document.fonts.load('40px "Ramabhadra"', "తెలుగు"), document.fonts.load(`${FONT().w ? "800 " : ""}40px "${FONT().name}"`, "తెలుగు ఫలితాలు")]);
    const TDP_LOGO = await loadImg("assets/parties/tdp.png");
    const logos = {}; await Promise.all(ORDER.map(async (p) => { if (LOGO[p]) logos[p] = await loadImg(`assets/parties/${LOGO[p]}.png`); }));
    AVATAR = await loadImg("assets/brand/shiva4tdp-avatar.jpg");
    const head = r?.head, post = b.type === "C" ? T.mayor : T.chair;
    const status = !r ? "AWAITING" : head?.status === "won" ? "RESULT" : "COUNTING";
    const pad = 48;
    const upd = st.updated || LIVE?.updated;
    const when = new Date(!st.demo && upd ? upd : Date.now()).toLocaleString(te ? "te-IN" : "en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

    // ---- new templates: prepare shared data and hand off ----
    if (st.tpl !== "classic" && window.SHARE_TPL?.[st.tpl]) {
      const cs = contenders(b); if (head && !cs.some((c) => c.p === head.party)) cs.unshift({ p: head.party, n: head.name });
      cs.sort((a, c) => (head && c.p === head.party) - (head && a.p === head.party));
      const PILL = { AWAITING: ["#eef0f3", "#5b6475"], COUNTING: ["#fde8e8", "#c4122f"], RESULT: ["#dff5e8", "#0d6b3d"] };
      const D = {
        W0, H0, te, T, b, r, post, title: T.body(b), sub: T.sub(b, post), when, k: { wide: 1, square: 1.05, story: 1.15 }[st.fmt],
        src: st.demo ? T.srcDemo : T.srcReal, F, fmt, COL, ORDER, logos, avatar: AVATAR, shiva: st.shiva, tdp: st.tdp, tdpLogo: TDP_LOGO, site: st.site,
        pshort: (p) => (te ? T.pshort(p) : p), margin: head?.margin || 0,
        cands: cs.map((c) => { const isHead = !!(head && c.p === head.party), raw = (isHead && head.name) || c.n; return { p: c.p, isHead, won: isHead && head.status === "won", reported: c.reported, name: raw ? T.name(raw) : T.unnamed(c.p), partyName: T.pname(c.p) }; }),
        dec: r?.declared || 0, total: b.wards, wards: r?.wards || {}, leads: r?.leads || {}, need: Math.floor(b.wards / 2) + 1,
        rows: ORDER.filter((p) => r?.wards?.[p] || r?.leads?.[p]).sort((a, c) => (r.wards[c] || 0) - (r.wards[a] || 0)),
        pill: (ctx, x, y, k, dark, align = "right") => {
          const t = T.pill[status], [bg, fg] = dark && status === "AWAITING" ? ["rgba(255,255,255,.14)", "#fff"] : PILL[status];
          ctx.font = F(800, 18 * k); const w = ctx.measureText(t).width + 36 * k, x0 = align === "right" ? x - w : x;
          ctx.fillStyle = bg; rr(ctx, x0, y, w, 42 * k, 21 * k); ctx.fill(); ctx.fillStyle = fg; ctx.textAlign = "center"; ctx.fillText(t, x0 + w / 2, y + 28 * k); ctx.textAlign = "left";
        },
      };
      ctx.textBaseline = "alphabetic"; ctx.letterSpacing = "0px";
      window.SHARE_TPL[st.tpl](ctx, D);
      watermark(ctx, W0, H0, wide, te, T);
      return [b, r, real];
    }

    // background
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W0, H0);
    const g = ctx.createRadialGradient(W0 * 0.95, -40, 10, W0 * 0.95, -40, W0 * 0.7);
    g.addColorStop(0, "rgba(212,160,0,0.20)"); g.addColorStop(1, "rgba(212,160,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W0, H0);
    ctx.fillStyle = head ? COL[head.party] : "#cfd3da"; ctx.fillRect(0, 0, W0, 10);

    // header
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    const pill = { AWAITING: ["#eef0f3", "#5b6475"], COUNTING: ["#fde8e8", "#c4122f"], RESULT: ["#dff5e8", "#0d6b3d"] }[status], ptxt = T.pill[status];
    ctx.font = F(800, 18); const pw = ctx.measureText(ptxt).width + 36;
    ctx.fillStyle = pill[0]; rr(ctx, W0 - pad - pw, 34, pw, 42, 21); ctx.fill();
    ctx.fillStyle = pill[1]; ctx.textAlign = "center"; ctx.fillText(ptxt, W0 - pad - pw / 2, 62); ctx.textAlign = "left";
    ctx.fillStyle = "#b97800"; spaced(ctx, 3); fitF(ctx, T.top(post), W0 - pad * 2 - pw - 20, 19, 700); ctx.fillText(T.top(post), pad, 62); spaced(ctx, 0);
    const title = T.body(b);
    ctx.fillStyle = "#111827"; fitF(ctx, title, W0 - pad * 2, wide ? 58 : 64); ctx.fillText(title, pad, wide ? 130 : 142);
    ctx.fillStyle = "#5b6475"; fitF(ctx, T.sub(b, post), W0 - pad * 2, te ? 21 : 23, 500); ctx.fillText(T.sub(b, post), pad, wide ? 168 : 186);

    // candidates
    const cs = contenders(b); if (head && !cs.some((c) => c.p === head.party)) cs.unshift({ p: head.party, n: head.name });
    cs.sort((a, c) => (head && c.p === head.party) - (head && a.p === head.party));
    const colW = wide ? 640 : W0 - pad * 2, rowH = wide ? 104 : 118;
    let y = wide ? 198 : 224;
    ctx.fillStyle = "#5b6475"; ctx.font = F(700, 15); spaced(ctx, 2); ctx.fillText(T.cands(post), pad, y + 6); spaced(ctx, 0); y += 22;
    for (const c of cs.slice(0, wide ? 3 : 4)) {
      const isHead = head && c.p === head.party, raw = (isHead && head.name) || c.n, name = raw ? T.name(raw) : T.unnamed(c.p);
      ctx.fillStyle = isHead ? `${COL[c.p]}1f` : "#f7f7f4"; rr(ctx, pad, y, colW, rowH - 14, 18); ctx.fill();
      if (isHead) { ctx.strokeStyle = COL[c.p]; ctx.lineWidth = 3; rr(ctx, pad, y, colW, rowH - 14, 18); ctx.stroke(); }
      const ls = rowH - 38; ctx.fillStyle = "#fff"; rr(ctx, pad + 12, y + 12, ls, ls, 12); ctx.fill();
      ctx.strokeStyle = COL[c.p]; ctx.lineWidth = 2.5; rr(ctx, pad + 12, y + 12, ls, ls, 12); ctx.stroke();
      if (logos[c.p]) { const im = logos[c.p], k = Math.min((ls - 10) / im.width, (ls - 10) / im.height); ctx.drawImage(im, pad + 12 + (ls - im.width * k) / 2, y + 12 + (ls - im.height * k) / 2, im.width * k, im.height * k); }
      else { ctx.fillStyle = "#5b6475"; ctx.font = F(800, 16); ctx.textAlign = "center"; ctx.fillText("IND", pad + 12 + ls / 2, y + 12 + ls / 2 + 6); ctx.textAlign = "left"; }
      const tx = pad + ls + 30, badgeW = isHead ? 200 : 0, mid = y + (rowH - 14) / 2;
      ctx.fillStyle = "#111827"; fitF(ctx, name, colW - ls - 60 - badgeW, wide ? 30 : 34); ctx.fillText(name, tx, mid - 2);
      ctx.fillStyle = "#5b6475"; ctx.font = F(600, 19); ctx.fillText(T.pname(c.p) + (c.reported ? T.reported : ""), tx, mid + 26);
      if (isHead) {
        const won = head.status === "won", bx = pad + colW - badgeW - 14, by = y + 16;
        ctx.fillStyle = won ? "#0d6b3d" : COL[c.p]; rr(ctx, bx, by, badgeW, rowH - 46, 14); ctx.fill();
        ctx.fillStyle = !won && (c.p === "TDP" || c.p === "BJP") ? "#111827" : "#fff"; ctx.textAlign = "center";
        ctx.font = F(900, te ? 24 : 22); ctx.fillText(won ? T.won : T.lead, bx + badgeW / 2, by + 31);
        if (head.margin) { ctx.font = F(700, 17, true); ctx.fillText(T.by(fmt(head.margin)), bx + badgeW / 2, by + 56); }
        ctx.textAlign = "left";
      }
      y += rowH;
    }
    if (!cs.length) { ctx.fillStyle = "#5b6475"; ctx.font = F(600, 24); ctx.fillText(T.none, pad, y + 40); }

    // wards panel
    const px = wide ? pad + colW + 32 : pad, py = wide ? 212 : y + 6, pw2 = wide ? W0 - px - pad : W0 - pad * 2, ph = wide ? 368 : Math.max(250, H0 - 78 - 34 - py);
    ctx.fillStyle = "#f7f7f4"; rr(ctx, px, py, pw2, ph, 20); ctx.fill();
    ctx.fillStyle = "#5b6475"; ctx.font = F(700, 15); spaced(ctx, 2); ctx.fillText(T.wardsT(b), px + 22, py + 36); spaced(ctx, 0);
    const dec = r?.declared || 0, led = sum(r?.leads);
    ctx.fillStyle = "#111827"; ctx.font = `700 46px "JetBrains Mono", monospace`; ctx.fillText(`${dec}/${b.wards}`, px + 22, py + 92);
    ctx.fillStyle = "#5b6475"; ctx.font = F(500, 18); ctx.fillText(T.declared + (led ? T.more(led) : ""), px + 22, py + 120);
    const bx0 = px + 22, bw = pw2 - 44; let bx = bx0;
    ctx.fillStyle = "#e4e6eb"; rr(ctx, bx0, py + 140, bw, 22, 11); ctx.fill();
    ctx.save(); rr(ctx, bx0, py + 140, bw, 22, 11); ctx.clip();
    ORDER.forEach((p) => { const n = r?.wards?.[p] || 0; if (!n) return; const w = (bw * n) / b.wards; ctx.fillStyle = COL[p]; ctx.fillRect(bx, py + 140, w - 2, 22); bx += w; });
    ctx.restore();
    const need = Math.floor(b.wards / 2) + 1, mx = bx0 + (bw * need) / b.wards;
    ctx.fillStyle = "#111827"; ctx.fillRect(mx - 1, py + 134, 2, 34);
    ctx.font = F(600, 13); ctx.textAlign = "center"; ctx.fillText(T.majority(need), mx, py + 188); ctx.textAlign = "left";
    const rows = ORDER.filter((p) => r?.wards?.[p] || r?.leads?.[p]).sort((a, c) => (r.wards[c] || 0) - (r.wards[a] || 0)).slice(0, 4);
    rows.forEach((p, i) => {
      const yy = py + 224 + i * 34; if (yy > py + ph - 12) return;
      ctx.fillStyle = COL[p]; rr(ctx, px + 22, yy - 14, 16, 16, 4); ctx.fill();
      ctx.fillStyle = "#111827"; ctx.font = F(600, 19); ctx.fillText(te ? T.pshort(p) : PNAME[p], px + 48, yy);
      ctx.textAlign = "right"; ctx.font = F(700, 19, true);
      ctx.fillText(`${r.wards[p] || 0}${r.leads?.[p] ? ` +${r.leads[p]}` : ""}`, px + pw2 - 22, yy); ctx.textAlign = "left";
    });
    if (!r) { ctx.fillStyle = "#5b6475"; ctx.font = F(600, 20); ctx.fillText(T.countStart, px + 22, py + 234); }

    // footer: brand stays in Latin (it's the X handle)
    const fy = H0 - 78;
    ctx.fillStyle = "#e7e7e1"; ctx.fillRect(pad, fy - 16, W0 - pad * 2, 1.5);
    let bx2 = pad;
    if (st.shiva) {
      drawBrand(ctx, pad, fy, 56);
      ctx.fillStyle = "#111827"; ctx.font = '900 30px "Inter Tight", Arial'; ctx.fillText("@shiva", pad + 72, fy + 30);
      let hx = pad + 72 + ctx.measureText("@shiva").width; ctx.fillStyle = "#C99A00"; ctx.fillText("4", hx, fy + 30); hx += ctx.measureText("4").width;
      ctx.fillStyle = "#111827"; ctx.fillText("tdp", hx, fy + 30); hx += ctx.measureText("tdp").width;
      ctx.fillStyle = "#5b6475"; ctx.font = F(600, 14); spaced(ctx, 2); ctx.fillText(T.tag, pad + 73, fy + 53); const tagEnd = pad + 73 + ctx.measureText(T.tag).width; spaced(ctx, 0);
      bx2 = Math.max(hx, tagEnd) + 18;
    }
    window.SHARE_UTIL?.tdpMark(ctx, { tdp: st.tdp, tdpLogo: TDP_LOGO }, bx2, fy, 56);

    watermark(ctx, W0, H0, wide, te, T);
    return [b, r, real];
  }

  // ---------- statewide card: all 100 bodies added up ----------
  const STATE = "__state";
  function aggregate() {
    const src = st.demo ? Object.fromEntries(BODIES.map((b) => [b.id, demoRecord(b)])) : st.records ? st.records : LIVE ? LIVE.bodies || {} : (window.getAdminResults?.() || {}).bodies || {};
    const A = { wards: {}, leads: {}, headW: {}, headL: {}, declared: 0, total: BODIES.reduce((a, b) => a + b.wards, 0), heads: BODIES.length, reporting: 0 };
    for (const b of BODIES) {
      const r = src[b.id]; if (!r) continue;
      if (r.declared || sum(r.leads) || r.head) A.reporting++;
      A.declared += r.declared || 0;
      for (const [p, n] of Object.entries(r.wards || {})) A.wards[p] = (A.wards[p] || 0) + n;
      for (const [p, n] of Object.entries(r.leads || {})) A.leads[p] = (A.leads[p] || 0) + n;
      if (r.head?.party) { const t = r.head.status === "won" ? A.headW : A.headL; t[r.head.party] = (t[r.head.party] || 0) + 1; }
    }
    return A;
  }
  async function paintState(cv) {
    const T = L[st.lang], te = st.lang === "te", [W0, H0] = SIZES[st.fmt], wide = st.fmt === "wide";
    cv.width = W0 * 2; cv.height = H0 * 2;
    const ctx = cv.getContext("2d"); ctx.setTransform(2, 0, 0, 2, 0, 0);
    await Promise.all([document.fonts.load('800 40px "Inter Tight"'), document.fonts.load('700 30px "JetBrains Mono"'), document.fonts.load('40px "Ramabhadra"', "తెలుగు"), document.fonts.load(`${FONT().w ? "800 " : ""}40px "${FONT().name}"`, "తెలుగు ఫలితాలు")]);
    const logos = {}; await Promise.all(ORDER.map(async (p) => { if (LOGO[p]) logos[p] = await loadImg(`assets/parties/${LOGO[p]}.png`); }));
    AVATAR = await loadImg("assets/brand/shiva4tdp-avatar.jpg"); const TDP_LOGO = await loadImg("assets/parties/tdp.png");
    const A = aggregate(), anyRes = A.reporting > 0, allWon = sum(A.headW) === A.heads;
    const status = !anyRes ? "AWAITING" : allWon ? "RESULT" : "COUNTING";
    const PILL = { AWAITING: ["#eef0f3", "#5b6475"], COUNTING: ["#fde8e8", "#c4122f"], RESULT: ["#dff5e8", "#0d6b3d"] };
    const D = {
      W0, H0, te, T, F, fmt, COL, ORDER, logos, avatar: AVATAR, shiva: st.shiva, tdp: st.tdp, site: st.site, tdpLogo: TDP_LOGO, k: { wide: 1, square: 1.05, story: 1.15 }[st.fmt], agg: A,
      pshort: (p) => (te ? T.pshort(p) : p),
      pill: (c, x, y, k, dark) => { const t = T.pill[status], [bg, fg] = dark && status === "AWAITING" ? ["rgba(255,255,255,.14)", "#fff"] : PILL[status]; c.font = F(800, 18 * k); const w = c.measureText(t).width + 36 * k; c.fillStyle = bg; rr(c, x - w, y, w, 42 * k, 21 * k); c.fill(); c.fillStyle = fg; c.textAlign = "center"; c.fillText(t, x - w / 2, y + 28 * k); c.textAlign = "left"; },
    };
    ctx.textBaseline = "alphabetic"; ctx.letterSpacing = "0px";
    window.SHARE_TPL.statewide(ctx, D);
    watermark(ctx, W0, H0, wide, te, T);
    return [STATE, A, anyRes];
  }
  function stateCaption(A) {
    const KUT = ["TDP", "JSP", "BJP"], s = (o, ps) => ps.reduce((a, p) => a + (o[p] || 0), 0);
    const k = s(A.headW, KUT) + s(A.headL, KUT), y = (A.headW.YSRCP || 0) + (A.headL.YSRCP || 0), tag = `\n#APLocalBodyElections #APMunicipalElections ${HANDLE}`;
    if (st.lang === "te") return (st.demo ? "[డెమో – నమూనా, నిజమైన ఫలితాలు కావు] " : "") + (A.reporting ? `ఏపీ పురపాలక ఎన్నికలు: 100 మేయర్/చైర్‌పర్సన్ పదవుల్లో కూటమి ${k}, వైఎస్సార్‌సీపీ ${y} (గెలుపు + ఆధిక్యం). వార్డులు: ${A.declared}/${A.total} ప్రకటించారు.` : "ఏపీ పురపాలక ఎన్నికలు: ఓట్ల లెక్కింపు 3 నవంబర్ ఉదయం 8 గంటలకు.") + tag;
    return (st.demo ? "[DEMO – simulated, not real] " : "") + (A.reporting ? `AP civic polls: of 100 Mayor/Chairperson posts, Kutami ${k}, YSRCP ${y} (won + leading). Wards declared: ${A.declared}/${A.total}.` : "AP civic polls: counting begins 3 Nov, 8 AM.") + tag;
  }

  // demo watermark (on every template)
  function watermark(ctx, W0, H0, wide, te, T) {
    // demo watermark — makes a preview impossible to pass off as a real result
    if (st.demo) {
      ctx.save(); ctx.translate(W0 / 2, H0 / 2); ctx.rotate(-Math.PI / 9);
      ctx.fillStyle = "rgba(196,18,47,0.16)"; ctx.textAlign = "center";
      ctx.font = te ? `${wide ? 96 : 104}px "Ramabhadra"` : `900 ${wide ? 92 : 100}px "Inter Tight", Arial Black`; ctx.fillText(T.wm1, 0, -20);
      ctx.font = te ? `${wide ? 64 : 70}px "Ramabhadra"` : `900 ${wide ? 60 : 66}px "Inter Tight", Arial Black`; ctx.fillText(T.wm2, 0, 64);
      ctx.restore();
      ctx.fillStyle = "#c4122f"; ctx.fillRect(0, 0, W0, 10);
    }
  }
  // admin: caption + note under the controls
  function finishUI(b, r, real) {
    $("#shareCaption").value = b === STATE ? stateCaption(r) : caption(b, r);
    const at = LIVE?.updated ? new Date(LIVE.updated).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "";
    $("#shareNote").innerHTML = st.demo ? "Demo preview: simulated numbers with a DEMO watermark. Untick “Demo data” to share real results."
      : LIVE ? `<span class="live-dot"></span> Live from the site${at ? " · results updated " + at : ""} · refreshes every 30 s${real ? "" : " · no result for this seat yet, so it shows “Awaiting result”"}`
      : real ? "Using the results in your admin draft (Supabase not connected)." : "No results for this body yet — the card shows “Awaiting result”.";
  }

  function caption(b, r) {
    const h = r?.head, tag = `\n#APLocalBodyElections #${b.name.replace(/[^A-Za-z]/g, "")} ${HANDLE}`;
    let t;
    if (st.lang === "te") {
      const T = L.te, post = b.type === "C" ? T.mayor : T.chair;
      t = `${T.body(b)} ${post} పోరు`;
      if (!r) t += `: ఓట్ల లెక్కింపు 3 నవంబర్ ఉదయం 8 గంటలకు ప్రారంభం.`;
      else {
        if (h) { const n = h.name ? T.name(h.name) : T.unnamed(h.party); t += `: ${n} (${T.pshort(h.party)}) ${h.margin ? `${fmt(h.margin)} ఓట్ల ` : ""}${h.status === "won" ? "మెజారిటీతో విజయం" : "ఆధిక్యంలో ఉన్నారు"}.`; }
        const parts = ORDER.filter((p) => r.wards?.[p]).sort((a, c) => r.wards[c] - r.wards[a]).map((p) => `${T.pshort(p)} ${r.wards[p]}`);
        if (parts.length) t += ` ${b.type === "C" ? "డివిజన్లు" : "వార్డులు"}: ${parts.join(", ")} (${b.wards}లో ${r.declared} ప్రకటించారు).`;
      }
      return (st.demo ? "[డెమో – నమూనా, నిజమైన ఫలితాలు కావు] " : "") + t + tag;
    }
    const post = b.type === "C" ? "Mayor" : "Chairperson";
    t = `${b.name} ${post} race`;
    if (!r) t += ": counting begins 3 Nov, 8 AM.";
    else {
      if (h) t += `: ${h.name || PNAME[h.party] + " candidate"} (${h.party}) ${h.status === "won" ? "WINS" : "leading"}${h.margin ? ` by ${fmt(h.margin)} votes` : ""}.`;
      const parts = ORDER.filter((p) => r.wards?.[p]).sort((a, c) => r.wards[c] - r.wards[a]).map((p) => `${p} ${r.wards[p]}`);
      if (parts.length) t += ` Wards: ${parts.join(", ")} (${r.declared}/${b.wards} declared).`;
    }
    return (st.demo ? "[DEMO – simulated, not real] " : "") + t + tag;
  }

  const blob = () => new Promise((res) => $("#shareCanvas").toBlob(res, "image/png"));
  async function download() {
    const a = document.createElement("a"); a.href = URL.createObjectURL(await blob());
    a.download = `${st.id}-${st.demo ? "DEMO-" : ""}${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "")}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function copyImg() {
    try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob() })]); flash("Image copied — paste it into your post"); }
    catch { flash("Your browser blocked copying images — use Download instead"); }
  }
  const flash = (m) => { const t = $("#toast"); t.textContent = m; t.className = "toast"; t.hidden = false; setTimeout(() => (t.hidden = true), 3500); };

  function init() {
    $("#shareBody").innerHTML = `<optgroup label="Statewide"><option value="${STATE}">★ Overall · all 100 bodies</option></optgroup>` + ["C", "M", "NP"].map((t) => `<optgroup label="${TYPE[t]}s">${BODIES.filter((b) => b.type === t).sort((a, c) => a.name.localeCompare(c.name)).map((b) => `<option value="${b.id}" ${b.id === st.id ? "selected" : ""}>${b.name}</option>`).join("")}</optgroup>`).join("");
    $("#shareBody").onchange = (e) => { st.id = e.target.value; syncMode(); render(); };
    const syncMode = () => document.querySelectorAll("[data-smode]").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.smode === "state") === (st.id === STATE))));
    let lastSeat = "greater-visakhapatnam";
    document.querySelectorAll("[data-smode]").forEach((b) => (b.onclick = () => {
      if (b.dataset.smode === "state") { if (st.id !== STATE) lastSeat = st.id; st.id = STATE; } else st.id = st.id === STATE ? lastSeat : st.id;
      $("#shareBody").value = st.id; syncMode(); render();
    }));
    syncMode();
    $("#shareFmt").onchange = (e) => { st.fmt = e.target.value; render(); };
    $("#shareDemo").onchange = (e) => { st.demo = e.target.checked; render(); };
    $("#shareLang").onchange = (e) => { st.lang = e.target.value; $("#fontPick").hidden = st.lang !== "te"; render(); };
    $("#shareShiva").onchange = (e) => { st.shiva = e.target.checked; render(); };
    $("#shareTdp").onchange = (e) => { st.tdp = e.target.checked; render(); };
    linkFonts();
    $("#fontPick").innerHTML = FONTS.map((f) => `<button type="button" data-font="${f.name}" aria-pressed="${f.name === st.font}" title="${f.name}"><b style="font-family:'${f.name}',sans-serif;${f.w ? "font-weight:700;" : ""}${f.s !== 1 ? `font-size:${Math.round(20 * f.s)}px;` : ""}">విజయం</b><small>${f.name}</small></button>`).join("");
    $("#fontPick").onclick = (e) => { const b = e.target.closest("[data-font]"); if (!b) return; st.font = b.dataset.font; document.querySelectorAll("[data-font]").forEach((x) => x.setAttribute("aria-pressed", x === b)); render(); };
    document.querySelectorAll("[data-tpl]").forEach((b) => (b.onclick = () => { st.tpl = b.dataset.tpl; document.querySelectorAll("[data-tpl]").forEach((x) => x.setAttribute("aria-pressed", x === b)); render(); }));
    $("#shareDl").onclick = download; $("#shareCopy").onclick = copyImg;
    $("#shareCopyTxt").onclick = async () => { try { await navigator.clipboard.writeText($("#shareCaption").value); flash("Caption copied"); } catch { flash("Select the caption and copy it"); } };
    $("#shareX").onclick = () => window.open("https://x.com/intent/post?text=" + encodeURIComponent($("#shareCaption").value), "_blank", "noopener");
  }
  let started = false;
  let poll = null;
  async function onTab() {
    clearInterval(poll);
    if (location.hash !== "#share") return;
    if (!started) { init(); started = true; }
    render(); if (await refreshLive()) render();
    poll = setInterval(async () => { if (location.hash === "#share" && !document.hidden && (await refreshLive())) render(); }, 30000);
  }
  // Public site: draw a seat card from given results. o: { id, fmt, lang, tpl, font, record, updated, site, shiva, tdp }
  window.SHARE_DRAW = async (cv, o) => {
    const saved = { ...st };
    Object.assign(st, { demo: false, shiva: false, tdp: false, site: false, updated: null, records: null }, o);
    try { return await paint(cv, o.record || null); } finally { Object.keys(st).forEach((k) => delete st[k]); Object.assign(st, saved); }
  };
  if (!document.getElementById("shareCanvas")) return; // the admin share tab only exists on admin.html
  window.addEventListener("hashchange", onTab);
  onTab();
})();
