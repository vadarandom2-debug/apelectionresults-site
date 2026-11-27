// Follower form: district → mandal → panchayat, who won, majority. Sends one row to the gp_reports table (pending until an admin approves).
// Localhost only: add ?mock to try the form without a database (nothing is sent).
(() => {
  const ZP = window.AP_ZP, $ = (s) => document.querySelector(s), esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const URL_ = window.SUPABASE_URL, KEY = window.SUPABASE_ANON_KEY, q = new URLSearchParams(location.search);
  const MOCK = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && q.has("mock");
  const SIDE = { K: "కూటమి మద్దతు", Y: "వైసీపీ మద్దతు", O: "ఇతరులు · స్వతంత్రులు" };
  const mTe = (d, m, en) => ZP.te?.[`${d}/${m}`] || en;
  // a mandal's results can be sent only on its polling and counting day and the next day (India time); the database enforces the same rule
  const DAYS = { 1: ["2026-11-26", "2026-11-27", "26 నవంబర్"], 2: ["2026-11-29", "2026-11-30", "29 నవంబర్"], 3: ["2026-12-02", "2026-12-03", "2 డిసెంబర్"] };
  const ist = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const isOpen = (ph) => MOCK || (DAYS[ph] && ist() >= DAYS[ph][0] && ist() <= DAYS[ph][1]);
  const closedMsg = (ph) => (ist() < DAYS[ph][0] ? `ఈ మండలం దశ ${ph} (${DAYS[ph][2]}). ఫలితాల రోజు ఉదయం నుంచి పంపవచ్చు.` : `ఈ మండలం దశ ${ph} (${DAYS[ph][2]}) ఫలితాలు పంపే గడువు ముగిసింది.`) + ` Results can be sent only on the poll day and the day after.`;
  if (MOCK) $(".gr").insertAdjacentHTML("afterbegin", `<p class="gr-mock">TEST MODE · localhost only · nothing is sent</p>`);

  // fields
  $("#grDist").innerHTML = `<option value="">— జిల్లా ఎంచుకోండి —</option>` + ZP.districts.map(([id, name, te]) => `<option value="${esc(id)}">${esc(te)} · ${esc(name)}</option>`).join("");
  // every gram panchayat in the state (official list, data/gp-list.json): district -> mandal -> panchayat dropdowns
  let LIST = null, GP = null;
  fetch("data/gp-list.json?v=20261122210000").then((r) => (r.ok ? r.json() : null)).then((j) => { LIST = j; fillMandals(); }).catch(() => {});
  const mandalsOf = (d) => [...(ZP.mandals[d] || []).map(([id, name]) => [id, name, mTe(d, id, name)]), ...Object.entries(LIST?.xm || {}).filter(([k]) => k.startsWith(d + "/")).map(([k, [en, te]]) => [k.split("/")[1], en, te])];
  const fillMandals = () => { const d = $("#grDist").value; $("#grMandal").innerHTML = `<option value="">— మండలం ఎంచుకోండి —</option>` + mandalsOf(d).map(([id, name, te]) => `<option value="${esc(id)}">${esc(te)} · ${esc(name)}</option>`).join(""); fillNames(); };
  $("#grDist").addEventListener("change", fillMandals);
  const OTHER = "__other";
  function fillNames() {
    const d = $("#grDist").value, m = $("#grMandal").value, list = LIST?.d?.[d]?.[m] || [], sel = $("#grPanchSel");
    sel.innerHTML = `<option value="">— పంచాయతీ ఎంచుకోండి${list.length ? ` (${list.length})` : ""} —</option>` + list.map(([en, te]) => `<option value="${esc(en)}">${esc(te || en)}${te && te !== en ? " · " + esc(en) : ""}</option>`).join("") + `<option value="${OTHER}">జాబితాలో లేదు — పేరు రాయండి</option>`;
    if (d && m && !list.length) sel.value = OTHER; showTxt();
    const ph = LIST?.ph?.[d + "/" + m]; if (ph) $("#grPhase").value = String(ph); $("#grPhase").disabled = !!ph; // the mandal's polling day, from the SEC notifications
    const shut = !!ph && !isOpen(ph); sel.disabled = shut; $("#grGo").disabled = shut; $("#grPanch").disabled = shut;
    const s = $("#grShut"); s.textContent = shut ? closedMsg(ph) : ""; s.hidden = !shut; err("");
  }
  const showTxt = () => { $("#grPanchTxt").hidden = $("#grPanchSel").value !== OTHER; };
  $("#grPanchSel").addEventListener("change", showTxt);
  const panch = () => ($("#grPanchSel").value === OTHER ? $("#grPanch").value.trim() : $("#grPanchSel").value);
  $("#grMandal").addEventListener("change", fillNames);
  $("#grName").value = localStorage.getItem("gr-name") || ""; $("#grPhone").value = localStorage.getItem("gr-phone") || "";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); $("#grPhase").value = today >= "2026-12-02" ? "3" : today >= "2026-11-29" ? "2" : "1";
  $("#grUnop").addEventListener("change", () => { $("#grMargin").disabled = $("#grUnop").checked; if ($("#grUnop").checked) $("#grMargin").value = ""; });

  function err(m) { const e = $("#grErr"); e.textContent = m; e.hidden = !m; if (m) e.scrollIntoView({ block: "center", behavior: "smooth" }); }
  async function send(row) {
    if (MOCK) { const a = JSON.parse(localStorage.getItem("gr-mock") || "[]"); a.push({ ...row, id: Date.now(), status: "pending", created_at: new Date().toISOString() }); localStorage.setItem("gr-mock", JSON.stringify(a)); return { ok: true }; }
    if (!URL_ || !KEY) return { ok: false, msg: "ఫారం ఇంకా సిద్ధంగా లేదు." };
    try {
      const r = await fetch(`${URL_}/rest/v1/gp_reports`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(row) });
      if (r.ok) return { ok: true };
      if (r.status === 401 || r.status === 403) return { ok: false, msg: "ఈ మండలం ఫలితాలు పంపే సమయం ఇది కాదు (పోలింగ్ రోజు, మరుసటి రోజు మాత్రమే)." };
      if (r.status === 404) return { ok: false, msg: "ఫారం ఇంకా సిద్ధంగా లేదు (సర్వర్ సెటప్ పూర్తి కాలేదు)." };
      return { ok: false, msg: "పంపడం కాలేదు. కాసేపటి తర్వాత మళ్లీ ప్రయత్నించండి." };
    } catch { return { ok: false, msg: "ఇంటర్నెట్ కనెక్షన్ లేదు. మళ్లీ ప్రయత్నించండి." }; }
  }
  $("#grForm").addEventListener("submit", async (e) => {
    e.preventDefault(); err("");
    const v = (id) => $(id).value.trim(), side = document.querySelector('input[name=side]:checked')?.value, unop = $("#grUnop").checked, phone = v("#grPhone").replace(/[\s-]/g, "");
    if (!isOpen(Number($("#grPhase").value))) return err(closedMsg(Number($("#grPhase").value)));
    if (v("#grWeb")) return done({ panchayat: "…" }); // a bot filled the hidden field: pretend it worked
    if (!v("#grDist") || !v("#grMandal")) return err("జిల్లా, మండలం ఎంచుకోండి.");
    if (panch().length < 2) return err("పంచాయతీని ఎంచుకోండి (లేదా పేరు రాయండి).");
    if (!side) return err("ఎవరు గెలిచారో ఎంచుకోండి.");
    const margin = unop ? 0 : Number(v("#grMargin")); if (!unop && (!/^\d+$/.test(v("#grMargin")) || margin > 200000)) return err("మెజారిటీ (ఓట్ల సంఖ్య) అంకెల్లో రాయండి, లేదా 'ఏకగ్రీవం' టిక్ చేయండి.");
    if (v("#grName").length < 2) return err("మీ పేరు రాయండి.");
    if (!/^\+?\d{10,13}$/.test(phone)) return err("సరైన ఫోన్ నంబర్ రాయండి.");
    if (Date.now() - Number(localStorage.getItem("gr-last") || 0) < 8000) return err("కొద్ది సెకన్లు ఆగి మళ్లీ పంపండి.");
    const row = { phase: Number($("#grPhase").value), district: v("#grDist"), mandal: v("#grMandal"), panchayat: panch(), side, winner: v("#grWinner") || null, margin, notes: v("#grNotes") || null, reporter: v("#grName"), phone };
    $("#grGo").disabled = true; $("#grGo").textContent = "పంపుతోంది…";
    const r = await send(row); $("#grGo").disabled = false; $("#grGo").textContent = "ఫలితం పంపండి · Send";
    if (!r.ok) return err(r.msg);
    localStorage.setItem("gr-last", String(Date.now())); localStorage.setItem("gr-name", row.reporter); localStorage.setItem("gr-phone", row.phone);
    done(row);
  });
  function done(row) {
    const d = $("#grDone"); $("#grForm").hidden = true; d.hidden = false;
    d.innerHTML = `<div class="tick">✓</div><h2>ధన్యవాదాలు!</h2><p><b>${esc(row.panchayat)}</b>${row.side ? ` — ${esc(SIDE[row.side])}${row.margin ? ` · మెజారిటీ ${row.margin}` : ""}` : ""}<br>అడ్మిన్ ధృవీకరించిన తర్వాత పంచాయతీ ఫలితాల గోడపై కనిపిస్తుంది.</p><button type="button" id="grAgain">ఇంకొక పంచాయతీ పంపండి</button>`;
    $("#grAgain").onclick = () => { d.hidden = true; $("#grForm").hidden = false; $("#grPanchSel").value = ""; showTxt(); for (const id of ["#grPanch", "#grWinner", "#grMargin", "#grNotes"]) $(id).value = ""; $("#grUnop").checked = false; $("#grMargin").disabled = false; document.querySelectorAll("input[name=side]").forEach((r) => (r.checked = false)); window.scrollTo({ top: 0, behavior: "smooth" }); };
  }
})();
