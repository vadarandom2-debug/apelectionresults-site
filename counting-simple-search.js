// City search: type a Corporation / Municipality name (English or Telugu) and open its ward-by-ward sheet.
(() => {
  const { BODIES, rec, bName, pName, esc } = window.CD, { COL } = window.CD_simple, $ = (s) => document.querySelector(s);
  const q = $("#findQ"), list = $("#findList"), norm = (s) => String(s || "").toLowerCase().replace(/[\s.()-]/g, "");
  const hits = (v) => { const n = norm(v); return n ? BODIES.filter((b) => norm(b.name + bName(b) + b.district).includes(n)).slice(0, 8) : []; };
  function draw() {
    const h = hits(q.value);
    list.hidden = !q.value.trim();
    list.innerHTML = h.map((b) => { const x = rec(b).head; return `<button type="button" data-open="${b.id}"><i style="background:${x ? COL[x.party] || COL.OTH : "#d6d6cf"}"></i><b>${esc(bName(b))}</b><small>${esc(b.name)} · ${b.type === "C" ? "కార్పొరేషన్" : "మున్సిపాలిటీ"}${x ? ` · ${pName(x.party)} ${x.status === "won" ? "గెలుపు" : "ఆధిక్యం"}` : ""}</small></button>`; }).join("") || `<p>దొరకలేదు · No match</p>`;
  }
  q.addEventListener("input", draw);
  $("#find").addEventListener("submit", (e) => { e.preventDefault(); const b = hits(q.value)[0]; if (b) list.querySelector(`[data-open="${b.id}"]`)?.click(); });
  document.addEventListener("click", (e) => { if (e.target.closest("#findList [data-open]")) { list.hidden = true; q.value = ""; } else if (!e.target.closest("#find")) list.hidden = true; });
})();
