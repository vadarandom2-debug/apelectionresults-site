// Home "epic" hero: a living hex map of all 175 assembly seats that replays 2014 → 2019 → 2024
// and settles on 2026, the local-body polls (13 mayor races pinned on the map).
(() => {
  const svg = document.getElementById("epicMap"); if (!svg) return;
  const { esc, logo, tip } = window.GECharts;
  const AC = window.GE_AC, SCHEDULE = window.AP_SCHEDULE || [], PARTIES = window.AP_PARTY_INFO || [];
  const NS = "http://www.w3.org/2000/svg";
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const col = (p) => `var(--${["TDP", "JSP", "BJP", "NDA", "YSRCP", "INC", "LEFT"].includes(p) ? p : "OTH"})`;

  // ---------- layout: district centres (lat, lon) projected, then each seat takes the nearest free hex ----------
  const CENTRE = {
    Srikakulam: [18.35, 84.0], Vizianagaram: [18.25, 83.35], Visakhapatnam: [17.75, 82.75], "East Godavari": [17.05, 82.05],
    "West Godavari": [16.75, 81.25], Krishna: [16.45, 80.75], Guntur: [16.15, 80.15], Prakasam: [15.45, 79.65], Nellore: [14.45, 79.65],
    Kadapa: [14.6, 78.65], Kurnool: [15.65, 78.1], Anantapur: [14.55, 77.45], Chittoor: [13.5, 78.95],
  };
  const S = 10, K = 40, HW = Math.sqrt(3) * S;
  const proj = (la, lo) => [(lo - 77) * K * 0.96, (19 - la) * K];
  const cells = [];
  for (let r = -5; r < 70; r++) for (let q = -40; q < 90; q++) cells.push({ x: HW * (q + r / 2), y: 1.5 * S * r, key: q + "," + r });
  const used = new Set(), seats = [], byD = {};
  AC.forEach((a) => (byD[a.d] = byD[a.d] || []).push(a));
  const ds = Object.keys(byD), next = Object.fromEntries(ds.map((d) => [d, 0]));
  for (let left = AC.length; left;) for (const d of ds) {
    if (next[d] >= byD[d].length) continue;
    const a = byD[d][next[d]++], [cx, cy] = proj(...CENTRE[d]);
    let best = null, bd = Infinity;
    for (const c of cells) { if (used.has(c.key)) continue; const dd = (c.x - cx) ** 2 + (c.y - cy) ** 2; if (dd < bd) { bd = dd; best = c; } }
    used.add(best.key); seats.push({ a, x: best.x, y: best.y }); left--;
  }
  const minX = Math.min(...seats.map((s) => s.x)) - 30, minY = Math.min(...seats.map((s) => s.y)) - 30;
  const maxX = Math.max(...seats.map((s) => s.x)) + 30, maxY = Math.max(...seats.map((s) => s.y)) + 30;
  svg.setAttribute("viewBox", `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);

  // ---------- draw ----------
  const hexPath = (x, y, s) => Array.from({ length: 6 }, (_, i) => { const t = Math.PI / 180 * (60 * i - 30); return `${(x + s * Math.cos(t)).toFixed(1)},${(y + s * Math.sin(t)).toFixed(1)}`; }).join(" ");
  const acTip = (a) => `<b>${esc(a.n)}</b> <span class="mut">${esc(a.d)}</span>` + ["2014", "2019", "2024"].map((y) => { const r = a.y[y]; return `<div class="tr"><i style="background:${col(r[0])}"></i>${y} · ${esc(r[1])}<span>${r[0]}</span></div>`; }).join("");
  const xSpan = maxX - minX;
  const g = document.createElementNS(NS, "g"); g.setAttribute("class", "hexes");
  g.innerHTML = seats.map((s, i) => `<polygon class="hx" points="${hexPath(s.x, s.y, S * 0.93)}" data-ac="${s.a.no}" ${tip(acTip(s.a))} style="transition-delay:${REDUCED ? 0 : Math.round(((s.x - minX) / xSpan) * 900 + (i % 7) * 18)}ms"></polygon>`).join("");
  svg.appendChild(g);
  // 2026: the 13 corporations voting for a mayor
  const CITY = [["Visakhapatnam", 17.69, 83.22, "greater-visakhapatnam"], ["Vizianagaram", 18.11, 83.40, "vizianagaram"], ["Eluru", 16.71, 81.10, "eluru"],
    ["Vijayawada", 16.51, 80.65, "vijayawada"], ["Machilipatnam", 16.19, 81.14, "machilipatnam"], ["Guntur", 16.30, 80.44, "guntur"], ["Ongole", 15.50, 80.05, "ongole"],
    ["Nellore", 14.44, 79.99, "nellore"], ["Tirupati", 13.63, 79.42, "tirupati"], ["Chittoor", 13.22, 79.10, "chittoor"], ["Kadapa", 14.47, 78.82, "kadapa"],
    ["Kurnool", 15.83, 78.04, "kurnool"], ["Anantapur", 14.68, 77.60, "anantapur"]];
  const pins = document.createElementNS(NS, "g"); pins.setAttribute("class", "pins");
  // label placement so the delta cities don't collide: [dx, dy, anchor]
  const LBL = { Vijayawada: [-9, -7, "end"], Guntur: [-9, 13, "end"], Machilipatnam: [9, 14, "start"], Eluru: [9, -8, "start"], Kadapa: [-9, 4, "end"], Chittoor: [-9, 12, "end"], Visakhapatnam: [9, 12, "start"] };
  pins.innerHTML = CITY.map(([n, la, lo, id], i) => { const [x, y] = proj(la, lo), [dx, dy, an] = LBL[n] || [9, -8, "start"]; return `<g class="pin" data-id="${id}" style="--d:${i * 70}ms" ${tip(`<b>${esc(n)}</b><div class="mut">Mayor race · polls 1 Nov</div>`)}><circle class="pulse" cx="${x}" cy="${y}" r="9"/><circle class="dot" cx="${x}" cy="${y}" r="5.5"/><text x="${x + dx}" y="${y + dy}" text-anchor="${an}">${esc(n)}</text></g>`; }).join("");
  svg.appendChild(pins);

  // ---------- states ----------
  const STATES = {
    2014: { win: "TDP", n: 102, of: 175, ally: "TDP–BJP 106", cm: "N. Chandrababu Naidu", cap: "2014 · TDP forms the first government of the new state" },
    2019: { win: "YSRCP", n: 151, of: 175, ally: "Biggest mandate in AP history", cm: "Y. S. Jagan Mohan Reddy", cap: "2019 · A YSRCP wave sweeps 151 of 175 seats" },
    2024: { win: "TDP", n: 164, of: 175, ally: "Kutami: TDP 135 · JSP 21 · BJP 8", cm: "N. Chandrababu Naidu", cap: "2024 · Kutami wins 164; YSRCP falls to 11" },
    2026: { cap: "2026 · Next verdict: 13 mayor races on 1 November. Tap a city." },
  };
  const ORDER = ["2014", "2019", "2024", "2026"];
  let cur = null, timer = null;
  document.getElementById("epicTime").innerHTML = ORDER.map((y) => `<button role="tab" data-ey="${y}" aria-selected="false">${y === "2026" ? '<i class="live-dot"></i>2026' : y}</button>`).join("") + `<button class="replay" data-replay aria-label="Replay the story">↻ Replay</button>`;

  function countTo(el, n) {
    if (REDUCED) { el.textContent = n; return; }
    const from = +el.dataset.v || 0, t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 900), e = 1 - (1 - k) ** 3; el.textContent = Math.round(from + (n - from) * e); if (k < 1) requestAnimationFrame(step); else el.dataset.v = n; };
    requestAnimationFrame(step);
  }
  function countdown() {
    const now = Date.now(), poll = SCHEDULE.find((s) => s.id === "ulb-poll"), t = poll ? new Date(poll.at).getTime() : now;
    if (now >= t) return `<b class="cd-big">Polling has begun</b>`;
    const d = Math.floor((t - now) / 864e5), h = Math.floor(((t - now) % 864e5) / 36e5);
    return `<b class="cd-big num">${d}<small>d</small> ${h}<small>h</small></b><span>to urban polling · 1 Nov, 7 AM</span>`;
  }
  function show(y) {
    cur = y;
    document.querySelectorAll("[data-ey]").forEach((b) => b.setAttribute("aria-selected", b.dataset.ey === y));
    svg.classList.toggle("future", y === "2026");
    svg.querySelectorAll(".hx").forEach((h) => { const a = AC.find((x) => x.no === +h.dataset.ac); h.style.fill = y === "2026" ? "" : col(a.y[y][0]); });
    const s = STATES[y], stat = document.getElementById("epicStat");
    document.getElementById("epicCap").textContent = s.cap;
    if (y === "2026") {
      stat.innerHTML = `<div class="es-live"><span class="es-k">2026 local body polls</span>${countdown()}<span class="es-sub">100 urban bodies · 3,942 wards · 13 mayors · counting 3 Nov</span></div>`;
    } else {
      stat.innerHTML = `<div class="es-row">${logo(s.win, "lg")}<div><span class="es-k">${y} Assembly verdict</span><b class="es-n num" style="color:${col(s.win)}"><span data-count>0</span><small>/${s.of}</small></b><span class="es-sub">${esc(s.ally)} · CM ${esc(s.cm)}</span></div></div>`;
      countTo(stat.querySelector("[data-count]"), s.n);
    }
  }
  function play() {
    clearTimeout(timer);
    if (REDUCED) return show("2026");
    let i = 0; const stepT = () => { show(ORDER[i]); if (++i < ORDER.length) timer = setTimeout(stepT, 2600); };
    stepT();
  }
  document.getElementById("epicTime").addEventListener("click", (e) => {
    if (e.target.closest("[data-replay]")) return play();
    const b = e.target.closest("[data-ey]"); if (b) { clearTimeout(timer); show(b.dataset.ey); }
  });
  // stop the autoplay once the user interacts with the map
  svg.addEventListener("pointerdown", () => clearTimeout(timer));
  setInterval(() => cur === "2026" && show("2026"), 60000);

  // ---------- leaders strip ----------
  const faces = PARTIES.flatMap((p) => p.leaders.filter((l) => l[2]).map((l) => ({ p: p.id, n: l[0], role: l[1].split(" · ")[0], photo: l[2], h: l[3] })));
  const item = (f) => `<figure style="--pc:var(--${f.p})"><img src="assets/leaders/${f.photo}.jpg?v=2" alt="${esc(f.n)}" loading="lazy" /><figcaption><b>${esc(f.n)}</b><span>${esc(f.p)} · ${f.h ? `<a href="https://x.com/${encodeURIComponent(f.h)}" target="_blank" rel="noopener">@${esc(f.h)}</a>` : esc(f.role)}</span></figcaption></figure>`;
  document.getElementById("epicFaces").innerHTML = faces.map(item).join("") + faces.map(item).join("");

  // play the story each time the Overview tab is opened
  let shown = false;
  document.addEventListener("tabshow", (e) => { if (e.detail === "overview") { play(); shown = true; } else clearTimeout(timer); });
  if (!document.querySelector('[data-panel="overview"]')?.hidden && !shown) play();
})();
