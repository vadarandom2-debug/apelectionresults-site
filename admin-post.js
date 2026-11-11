// Admin → Post maker: type a headline (Telugu or English), add a photo if you have one, pick one of 20 templates
// and 20 fonts, choose the platform size, then share in one click. Templates live in post-templates.js.
(() => {
  const $ = (s) => document.querySelector(s);
  if (!$("#pmCanvas")) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const FONTS = [
    ["Ramabhadra"], ["NTR"], ["Mandali"], ["Gidugu"], ["Suravaram"], ["Tenali Ramakrishna"], ["Sree Krushnadevaraya"], ["Mallanna"],
    ["Timmana"], ["Ponnala"], ["Dhurjati"], ["Gurajada"], ["Peddana"], ["Ramaraja"], ["Lakki Reddy"], ["Suranna"], ["Ravi Prakash"],
    ["Anek Telugu", 1], ["Noto Sans Telugu", 1], ["Hind Guntur", 1],
  ].map(([name, w]) => ({ name, w: !!w }));
  const SIZES = [["x", "X / Twitter", 1200, 675], ["fb", "Facebook", 1200, 630], ["ig", "Instagram", 1080, 1080], ["igp", "Insta portrait", 1080, 1350], ["story", "Story / Status", 1080, 1920]];
  const DRAFT = "ap-post-draft";
  const st = { head: "", sub: "", kick: "", tpl: "breaking", font: "Ramabhadra", size: "x", shiva: true, site: true, tdp: false, photo: null };
  try { Object.assign(st, JSON.parse(localStorage.getItem(DRAFT) || "{}"), { photo: null }); } catch {}
  const save = () => { try { const { photo, ...rest } = st; localStorage.setItem(DRAFT, JSON.stringify(rest)); } catch {} };
  const imgs = {}, loadImg = (src) => imgs[src] || (imgs[src] = new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }));
  const te = () => /[ఀ-౿]/.test(st.head + st.sub + st.kick);
  const FONT = () => FONTS.find((f) => f.name === st.font) || FONTS[0];
  const F = (w, size) => `${FONT().w ? Math.min(800, w) + " " : ""}${Math.round(size)}px "${FONT().name}", "Inter Tight", sans-serif`;

  // fonts: one stylesheet for all 20 (files download only when a font is used)
  const fam = FONTS.map((f) => "family=" + f.name.replace(/ /g, "+") + (f.w ? ":wght@400;600;800" : "")).join("&");
  const link = document.createElement("link"); link.rel = "stylesheet"; link.href = `https://fonts.googleapis.com/css2?${fam}&display=swap`; document.head.appendChild(link);

  async function params(W, H) {
    const [avatar, tdpLogo] = await Promise.all([loadImg("assets/brand/shiva4tdp-avatar.jpg"), loadImg("assets/parties/tdp.png")]);
    const isTe = te(), k = Math.sqrt(W * H) / 900;
    const D = { shiva: st.shiva, site: st.site, tdp: st.tdp, avatar, tdpLogo, F, te: isTe, T: { tag: isTe ? "ఏపీ ఎన్నికల అప్‌డేట్స్" : "AP ELECTION UPDATES" } };
    // room for the news text: measured at body size, capped so the headline always keeps space
    let subR = 0;
    if (st.sub) {
      const m = document.createElement("canvas").getContext("2d"), size = 24 * k, w = W - 120 * k; m.font = F(500, size); let lines = 0;
      for (const para of st.sub.split(/\n/)) { let line = "", n = 1; for (const word of para.split(/\s+/).filter(Boolean)) { const t = line ? line + " " + word : word; if (m.measureText(t).width > w && line) { n++; line = word; } else line = t; } lines += n; }
      subR = Math.min(lines * size * 1.38 + 8 * k, H * (H / W > 1.15 ? 0.62 : 0.56));
      // a long headline gets the room it needs first; the news text takes what is left (min 18%)
      if ((st.head || "").length > 80) {
        const hs = 40 * k; m.font = F(800, hs); let hl = 1, line = "";
        for (const word of st.head.split(/\s+/).filter(Boolean)) { const t = line ? line + " " + word : word; if (m.measureText(t).width > w && line) { hl++; line = word; } else line = t; }
        subR = Math.max(H * 0.18, Math.min(subR, H * 0.72 - hl * hs * 1.22));
      }
    }
    return {
      W, H, k, te: isTe, subR, head: st.head || (isTe ? "మీ శీర్షిక ఇక్కడ టైప్ చేయండి" : "Type your headline here"), sub: st.sub, kick: st.kick, photo: st.photo, F,
      brand: (c, x, y, dark, kk) => (st.shiva || st.site || st.tdp) && window.SHARE_UTIL?.brand(c, D, x, y, kk, dark),
    };
  }
  async function paint(cv, tplId, W, H, scale = 1) {
    const P = await params(W, H), t = window.POST_TPL.find((x) => x.id === tplId) || window.POST_TPL[0];
    cv.width = Math.round(W * scale); cv.height = Math.round(H * scale);
    const c = cv.getContext("2d"); c.setTransform(scale, 0, 0, scale, 0, 0); c.textBaseline = "alphabetic"; c.letterSpacing = "0px";
    c.fillStyle = "#fff"; c.fillRect(0, 0, W, H);
    try { t.draw(c, P); } catch (e) { console.warn(t.id, e); }
  }
  const dims = () => { const s = SIZES.find((x) => x[0] === st.size) || SIZES[0]; return [s[2], s[3]]; };
  async function render() {
    const [W, H] = dims();
    await document.fonts.load(`${FONT().w ? "800 " : ""}40px "${FONT().name}"`, (st.head || "తెలుగు") + " AP");
    await paint($("#pmCanvas"), st.tpl, W, H, 2);
    $("#pmCaption").value = caption();
    clearTimeout(render.t); render.t = setTimeout(thumbs, 250);
  }
  async function thumbs() {
    const [W, H] = dims(), sc = 220 / W;
    for (const cv of document.querySelectorAll("#pmTpls canvas")) await paint(cv, cv.dataset.t, W, H, sc);
  }
  function caption() {
    const t = [st.head, st.sub].filter(Boolean).join("\n");
    return `${t}\n\n${te() ? "#ఏపీఎన్నికలు " : ""}#APElections #APLocalBodyElections @shiva4tdp\napelectionresults.com`;
  }

  // ---------- UI ----------
  $("#pmTpls").innerHTML = window.POST_TPL.map((t, i) => `<button type="button" data-pmt="${t.id}" aria-pressed="${t.id === st.tpl}"><canvas data-t="${t.id}"></canvas><span>${i + 1}. ${esc(t.name)}</span></button>`).join("");
  $("#pmFonts").innerHTML = FONTS.map((f) => `<button type="button" data-pmf="${esc(f.name)}" aria-pressed="${f.name === st.font}" title="${esc(f.name)}"><b style="font-family:'${f.name}',sans-serif;${f.w ? "font-weight:700;" : ""}">వార్త</b><small>${esc(f.name)}</small></button>`).join("");
  $("#pmSizes").innerHTML = SIZES.map(([id, name, w, h]) => `<button type="button" data-pms="${id}" aria-pressed="${id === st.size}"><b>${name}</b><small>${w}×${h}</small></button>`).join("");
  $("#pmHead").value = st.head; $("#pmSub").value = st.sub; $("#pmKick").value = st.kick;
  $("#pmShiva").checked = st.shiva; $("#pmSite").checked = st.site; $("#pmTdp").checked = st.tdp;
  let tm;
  document.addEventListener("input", (e) => {
    const id = e.target.id; if (!["pmHead", "pmSub", "pmKick"].includes(id)) return;
    st[{ pmHead: "head", pmSub: "sub", pmKick: "kick" }[id]] = e.target.value; save();
    clearTimeout(tm); tm = setTimeout(render, 150);
  });
  document.addEventListener("change", (e) => {
    const id = e.target.id;
    if (id === "pmShiva" || id === "pmSite" || id === "pmTdp") { st[{ pmShiva: "shiva", pmSite: "site", pmTdp: "tdp" }[id]] = e.target.checked; save(); render(); }
    if (id === "pmFile" && e.target.files[0]) setPhoto(e.target.files[0]);
  });
  function setPhoto(file) {
    if (!file?.type?.startsWith("image/")) return;
    const r = new FileReader(); r.onload = () => { const i = new Image(); i.onload = () => { st.photo = i; $("#pmPhotoState").textContent = "Photo added"; $("#pmNoPhoto").hidden = false; render(); }; i.src = r.result; }; r.readAsDataURL(file);
  }
  document.addEventListener("paste", (e) => { if (location.hash !== "#post") return; const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith("image/")); if (f) { e.preventDefault(); setPhoto(f); } });
  const drop = $("#pmDrop");
  ["dragover", "dragenter"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("over")));
  drop.addEventListener("drop", (e) => { e.preventDefault(); setPhoto(e.dataTransfer.files[0]); });

  const flash = (m) => { const t = $("#toast"); t.textContent = m; t.className = "toast"; t.hidden = false; clearTimeout(flash.h); flash.h = setTimeout(() => (t.hidden = true), 3500); };
  const blob = () => new Promise((r) => $("#pmCanvas").toBlob(r, "image/png"));
  const fname = () => `ap-post-${st.tpl}-${st.size}-${new Date().toISOString().slice(0, 16).replace(/[:T-]/g, "")}.png`;
  document.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-pmt],[data-pmf],[data-pms]");
    if (t) {
      if (t.dataset.pmt) st.tpl = t.dataset.pmt; if (t.dataset.pmf) st.font = t.dataset.pmf; if (t.dataset.pms) st.size = t.dataset.pms;
      const attr = t.dataset.pmt ? "pmt" : t.dataset.pmf ? "pmf" : "pms";
      document.querySelectorAll(`[data-${attr}]`).forEach((x) => x.setAttribute("aria-pressed", x === t)); save(); return render();
    }
    const id = e.target.closest("button")?.id; if (!id) return;
    if (id === "pmNoPhoto") { st.photo = null; $("#pmFile").value = ""; $("#pmPhotoState").textContent = "No photo — templates use a design background"; e.target.hidden = true; render(); }
    if (id === "pmShare") {
      const f = new File([await blob()], fname(), { type: "image/png" }), data = { files: [f], text: caption() };
      if (navigator.canShare?.(data)) { try { await navigator.share(data); } catch {} } else flash("This browser can't share files — use Download, then post it");
    }
    if (id === "pmDl") { const a = document.createElement("a"); a.href = URL.createObjectURL(await blob()); a.download = fname(); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
    if (id === "pmCopy") { try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob() })]); flash("Image copied — paste it into your post"); } catch { flash("Copy blocked by the browser — use Download"); } }
    if (id === "pmX") window.open("https://x.com/intent/post?text=" + encodeURIComponent(caption()), "_blank", "noopener");
    if (id === "pmFb") { try { await navigator.clipboard.writeText(caption()); } catch {} window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent("https://apelectionresults.com/"), "_blank", "noopener"); flash("Caption copied — add the downloaded image to your Facebook post"); }
    if (id === "pmWa") window.open("https://wa.me/?text=" + encodeURIComponent(caption()), "_blank", "noopener");
    if (id === "pmCapCopy") { try { await navigator.clipboard.writeText($("#pmCaption").value); flash("Caption copied"); } catch {} }
    if (id === "pmClear") { st.head = st.sub = st.kick = ""; $("#pmHead").value = $("#pmSub").value = $("#pmKick").value = ""; save(); render(); }
  });
  if (!navigator.canShare) $("#pmShare").title = "Works on phones; on a computer use Download";
  const onTab = () => { if (location.hash === "#post") render(); };
  window.addEventListener("hashchange", onTab); onTab();
})();
