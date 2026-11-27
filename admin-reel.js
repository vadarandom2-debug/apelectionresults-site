// Admin → Reel → X: repost a saved Instagram reel to X with its caption and a credit line.
// The video is never fetched from Instagram (their terms don't allow automated downloading): save the reel on
// your phone first, then choose the file here. Nothing is uploaded to our server — the file stays on your device.
(() => {
  const $ = (s) => document.querySelector(s);
  if (!$("#rlVideo")) return;
  const LIMIT = 280, LINK_LEN = 23; // X counts every link as 23 characters
  const st = { file: null, url: "", cap: "", credit: true, tags: true };
  const flash = (m) => { const t = $("#toast"); t.textContent = m; t.className = "toast"; t.hidden = false; clearTimeout(flash.h); flash.h = setTimeout(() => (t.hidden = true), 3800); };

  const handleOf = (u) => { const m = String(u).match(/instagram\.com\/([A-Za-z0-9._]+)\/(?:reel|p)\//); return m ? m[1] : ""; };
  const validReel = (u) => /^https?:\/\/(www\.)?instagram\.com\/([A-Za-z0-9._]+\/)?(reel|reels|p)\/[A-Za-z0-9_-]+/i.test(u.trim());
  // X length: links count as 23, everything else per character (close enough for Telugu)
  const xLen = (t) => [...t.replace(/https?:\/\/\S+/g, "x".repeat(LINK_LEN))].length;

  function build() {
    const h = handleOf(st.url), tail = [];
    if (st.credit && st.url) tail.push(`🎥 ${h ? "@" + h + " " : ""}via Instagram`);
    if (st.tags) tail.push("#APElections @shiva4tdp");
    const tailTxt = tail.length ? "\n\n" + tail.join("\n") : "";
    let body = st.cap.trim();
    const room = LIMIT - xLen(tailTxt);
    if (xLen(body) > room) { while (body && xLen(body + "…") > room) body = [...body].slice(0, -1).join(""); body = body.trimEnd() + "…"; }
    return body + tailTxt;
  }
  function render() {
    const t = build(), n = xLen(t);
    $("#rlOut").value = t;
    $("#rlCount").textContent = `${n} / ${LIMIT}`;
    $("#rlCount").classList.toggle("over", n > LIMIT);
    $("#rlFull").hidden = xLen(st.cap) <= LIMIT - 40;
    $("#rlUrlOk").textContent = !st.url ? "" : validReel(st.url) ? `✓ Instagram reel${handleOf(st.url) ? " by @" + handleOf(st.url) : ""}` : "This doesn't look like an Instagram reel link";
    $("#rlUrlOk").className = "small " + (st.url && !validReel(st.url) ? "bad" : "mut");
  }
  function setFile(f) {
    if (!f) return;
    if (!f.type.startsWith("video/")) return flash("Please choose a video file (the saved reel)");
    if (f.size > 512 * 1024 * 1024) flash("Large file: X accepts videos up to 512 MB and 2 min 20 s on most accounts");
    st.file = f; const v = $("#rlVideo"); v.src = URL.createObjectURL(f); v.hidden = false;
    $("#rlFileInfo").textContent = `${f.name} · ${(f.size / 1048576).toFixed(1)} MB`;
    v.onloadedmetadata = () => { if (v.duration > 140) flash(`Video is ${Math.round(v.duration)} s — X allows 140 s on free accounts; trim it first`); };
  }

  document.addEventListener("input", (e) => {
    if (e.target.id === "rlUrl") { st.url = e.target.value.trim(); render(); }
    if (e.target.id === "rlCap") { st.cap = e.target.value; render(); }
    if (e.target.id === "rlOut") $("#rlCount").textContent = `${xLen(e.target.value)} / ${LIMIT}`;
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "rlFile") setFile(e.target.files[0]);
    if (e.target.id === "rlCredit") { st.credit = e.target.checked; render(); }
    if (e.target.id === "rlTags") { st.tags = e.target.checked; render(); }
  });
  const drop = $("#rlDrop");
  ["dragover", "dragenter"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("over")));
  drop.addEventListener("drop", (e) => { e.preventDefault(); setFile(e.dataTransfer.files[0]); });

  document.addEventListener("click", async (e) => {
    const id = e.target.closest("button")?.id; if (!id?.startsWith("rl")) return;
    const text = $("#rlOut").value;
    if (id === "rlPasteUrl" || id === "rlPasteCap") {
      try { const t = await navigator.clipboard.readText(); const f = id === "rlPasteUrl" ? "rlUrl" : "rlCap"; $("#" + f).value = t; $("#" + f).dispatchEvent(new Event("input", { bubbles: true })); }
      catch { flash("Your browser blocked pasting — long-press the box and paste"); }
    }
    if (id === "rlOpenIg") { if (validReel(st.url)) window.open(st.url, "_blank", "noopener"); else flash("Paste the reel link first"); }
    if (id === "rlShare") {
      if (!st.file) return flash("Add the saved reel video first");
      const data = { files: [st.file], text };
      if (navigator.canShare?.(data)) { try { await navigator.share(data); } catch {} }
      else { try { await navigator.clipboard.writeText(text); } catch {} window.open("https://x.com/compose/post", "_blank", "noopener"); flash("Caption copied — X opened: paste it and attach the video from your files"); }
    }
    if (id === "rlX") { window.open("https://x.com/intent/post?text=" + encodeURIComponent(text), "_blank", "noopener"); if (st.file) flash("Now attach the video in X (📷 → choose the saved reel)"); }
    if (id === "rlCopy") { try { await navigator.clipboard.writeText(text); flash("Caption copied"); } catch { flash("Select the caption and copy it"); } }
    if (id === "rlFull") { $("#rlOut").value = [st.cap.trim(), st.credit && st.url ? `🎥 via Instagram ${st.url}` : ""].filter(Boolean).join("\n\n"); flash("Full caption for X Premium (up to 25,000 characters)"); $("#rlCount").textContent = `${xLen($("#rlOut").value)} chars`; }
    if (id === "rlClear") { st.file = null; st.url = st.cap = ""; ["rlUrl", "rlCap"].forEach((f) => ($("#" + f).value = "")); $("#rlFile").value = ""; $("#rlVideo").hidden = true; $("#rlFileInfo").textContent = "No video yet"; render(); }
  });
  if (!navigator.canShare) $("#rlShare").textContent = "Open X & copy caption";
  render();
})();
