// Public site: "Share" on a Mayor card or a body's detail panel → a square State-map image (Anek Telugu) with
// the site address, which visitors can save, copy or send. Uses the admin renderer via window.SHARE_DRAW.
(() => {
  const $ = (s) => document.querySelector(s);
  const BY = Object.fromEntries((window.AP_BODIES || []).map((b) => [b.id, b]));
  let cur = null, lang = "te", busy = false;

  const dlg = document.createElement("dialog");
  dlg.className = "pshare"; dlg.setAttribute("aria-label", "Share this result as an image");
  dlg.innerHTML = `<div class="ps-head"><b id="psTitle">Share</b><button type="button" class="ps-x" id="psClose" aria-label="Close">×</button></div>
    <div class="ps-canvas"><canvas id="psCanvas" aria-label="Result image"></canvas><div class="ps-load" id="psLoad">Making the image…</div></div>
    <div class="ps-lang" role="group" aria-label="Language"><button type="button" data-pslang="te" aria-pressed="true" lang="te">తెలుగు</button><button type="button" data-pslang="en" aria-pressed="false">English</button></div>
    <div class="ps-btns">
      <button type="button" class="btn" id="psShare">Share…</button>
      <button type="button" class="btn ghost" id="psSave">Save image</button>
      <button type="button" class="btn ghost" id="psCopy">Copy image</button>
    </div>
    <p class="ps-msg" id="psMsg" role="status"></p>`;
  document.body.appendChild(dlg);
  if (!navigator.canShare) $("#psShare").hidden = true;

  const msg = (t) => { $("#psMsg").textContent = t; clearTimeout(msg.h); msg.h = setTimeout(() => ($("#psMsg").textContent = ""), 4000); };
  const blob = () => new Promise((res) => $("#psCanvas").toBlob(res, "image/png"));
  const fileName = () => `${cur === STATE ? "ap-overall-results" : cur}-${lang === "te" ? "telugu" : "english"}-apelectionresults.png`;

  async function draw() {
    if (!cur || busy || !window.SHARE_DRAW) return;
    busy = true; $("#psLoad").hidden = false;
    const R = window.apResults?.() || { bodies: {} }, o = window.apShareOpts || {}; // counting-simple.html sets design, size and demo
    try {
      if (window.apShareCustom?.[cur]) await window.apShareCustom[cur].draw($("#psCanvas"), { ...o, lang });
      else if (cur === STATE) await window.SHARE_DRAW($("#psCanvas"), { id: STATE, fmt: o.fmt || "square", demo: !!o.demo, tdp: !!o.tdp, shiva: !!o.shiva, lang, font: "Anek Telugu", site: true, records: R.bodies || {}, updated: R.updated || null });
      else await window.SHARE_DRAW($("#psCanvas"), { id: cur, fmt: o.fmt || "square", tpl: o.tpl || "map", demo: !!o.demo, tdp: !!o.tdp, shiva: !!o.shiva, lang, font: "Anek Telugu", site: true, record: R.bodies?.[cur] || null, updated: R.updated || null });
    } catch (e) { msg("Couldn't make the image — please try again."); console.warn(e); }
    busy = false; $("#psLoad").hidden = true;
  }
  const STATE = "__state";
  window.apShareRedraw = draw;
  function open(id) {
    const custom = window.apShareCustom?.[id];
    if (!BY[id] && id !== STATE && !custom) return;
    cur = id; $("#psTitle").textContent = custom ? `Share · ${custom.title}` : id === STATE ? "Share · Overall results" : `Share · ${BY[id].name}`;
    dlg.showModal(); draw();
  }

  document.addEventListener("click", async (e) => {
    const s = e.target.closest("[data-share]");
    if (s) { e.preventDefault(); return open(s.dataset.share); }
    const l = e.target.closest("[data-pslang]");
    if (l) { lang = l.dataset.pslang; document.querySelectorAll("[data-pslang]").forEach((x) => x.setAttribute("aria-pressed", x === l)); return draw(); }
    if (e.target.id === "psClose" || e.target === dlg) return dlg.close();
    if (e.target.id === "psSave") {
      const a = document.createElement("a"); a.href = URL.createObjectURL(await blob()); a.download = fileName(); a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000); return msg("Image saved");
    }
    if (e.target.id === "psCopy") {
      try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob() })]); msg("Image copied — paste it into WhatsApp, X or anywhere"); }
      catch { msg("Your browser can't copy images — use Save image instead"); }
      return;
    }
    if (e.target.id === "psShare") {
      const f = new File([await blob()], fileName(), { type: "image/png" });
      const nm = window.apShareCustom?.[cur]?.title || (cur === STATE ? "AP overall results" : BY[cur].name), data = { files: [f], title: `${nm} · AP local body elections 2026`, text: `${nm} · apelectionresults.com` };
      if (navigator.canShare?.(data)) { try { await navigator.share(data); } catch {} }
      else msg("Sharing isn't supported here — use Save image instead");
    }
  });
})();
