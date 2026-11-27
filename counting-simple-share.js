// Adds design and size choices to the share-image dialog on the plain results page.
(() => {
  const opts = (window.apShareOpts = { fmt: "square", tpl: "map", tdp: false, shiva: false, demo: window.CD.DEMO });
  const box = document.createElement("div"); box.className = "ps-opts";
  const pick = (key, list) => `<div class="ps-row" data-key="${key}">${list.map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${opts[key] === v}">${t}</button>`).join("")}</div>`;
  box.innerHTML = `<p>సైజు</p>${pick("fmt", [["square", "WhatsApp · చతురస్రం"], ["wide", "X · Facebook"], ["story", "Status · Story"]])}<div id="psTpl"><p>డిజైన్</p>${pick("tpl", [["map", "పటం"], ["victory", "విజయం"], ["scoreboard", "స్కోర్‌బోర్డ్"], ["breaking", "బ్రేకింగ్"], ["frontpage", "పత్రిక"], ["versus", "పోటీ"]])}</div>`;
  document.querySelector(".pshare .ps-lang").before(box);
  box.addEventListener("click", (e) => {
    const b = e.target.closest("[data-v]"); if (!b) return;
    opts[b.parentElement.dataset.key] = b.dataset.v;
    b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    window.apShareRedraw();
  });
  // the overall image has one design, so hide the design choice for it
  document.addEventListener("click", (e) => { const s = e.target.closest("[data-share]"); if (s) document.querySelector("#psTpl").hidden = !window.CD.BODIES.some((b) => b.id === s.dataset.share); }, true);
})();
