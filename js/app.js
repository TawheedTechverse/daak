/* Daak — page wiring: splash, language, stamp maker, letter. */
(() => {
  "use strict";
  const D = window.DaakData, S = window.DaakStamp, L = window.DaakLetter, toBijoy = window.toBijoy, bnD = D.toBnDigits;
  const $ = id => document.getElementById(id);
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  D.TEMPLATES.forEach(([id, en, bn]) => { D.UI.en["tpl_" + id] = en; D.UI.bn["tpl_" + id] = bn; });

  let lang = store.get("daak-lang") === "bn" ? "bn" : "en";
  const dhaka = D.DISTRICTS.findIndex(d => d[0] === "Dhaka");
  const st = { template: "classic", photo: S.makeSample(), sample: true, district: dhaka, value: 3, caption: 4, custom: false, capEn: "", capBn: "",
    bnFont: "auto", enFont: "auto", colour: "terracotta", postmark: false, zoom: 1, posY: 0, ink: 1.1, height: 1350 };
  const lt = { lang: lang, langTouched: false, sealSrc: "same", sealPhoto: null, msgTouched: false, page: 0 };

  /* ---------- i18n ---------- */
  const tr = key => (D.UI[lang][key] != null ? D.UI[lang][key] : D.UI.en[key]);
  // Bangla UI uses the Li ANSI fonts: show converted text, keep real Unicode for screen readers.
  function setText(el, str) {
    if (lang === "bn") el.innerHTML = `<span aria-hidden="true">${esc(toBijoy(str))}</span><span class="sr">${esc(str)}</span>`;
    else el.textContent = str;
  }
  function say(el, key) { if (!key) { el.textContent = ""; el.removeAttribute("data-t"); return; } el.dataset.t = key; setText(el, tr(key)); }

  function option(sel, value, text, selected) { const o = document.createElement("option"); o.value = value; o.textContent = text; if (selected) o.selected = true; sel.appendChild(o); }
  function buildSelects() {
    const bn = lang === "bn";
    const fill = (id, items) => { const s = $(id); s.innerHTML = ""; items.forEach(a => option(s, ...a)); };
    fill("district", D.DISTRICTS.map((d, i) => [i, bn ? d[1] : d[0], i === st.district]));
    fill("value", D.VALUES.map(([n, u], i) => [i, u === "tk" ? (bn ? "৳" + bnD(n) + " টাকা" : "Tk " + n) : (bn ? bnD(n) + " পয়সা" : n + " poisha"), i === st.value]));
    fill("caption", [...D.CAPTIONS.map((c, i) => [i, bn ? c[1] : c[0], !st.custom && i === st.caption]), ["custom", tr("customCaption"), st.custom]]);
    fill("bnFont", Object.entries(D.BN_FONTS).map(([k, v]) => [k, v.label[bn ? 1 : 0], k === st.bnFont]));
    fill("enFont", Object.entries(D.EN_FONTS).map(([k, v]) => [k, v.label[bn ? 1 : 0], k === st.enFont]));
    fill("colour", Object.entries(D.COLOURS).map(([k, v]) => [k, bn ? v[2] : v[1], k === st.colour]));
  }
  function applyLang() {
    document.body.classList.toggle("bn", lang === "bn");
    document.documentElement.lang = lang === "bn" ? "bn" : "en";
    document.querySelectorAll("[data-t]").forEach(el => setText(el, tr(el.dataset.t)));
    document.querySelectorAll("[data-ph]").forEach(el => { el.placeholder = tr(el.dataset.ph); });
    document.querySelectorAll(".lang button").forEach(b => b.setAttribute("aria-pressed", b.dataset.l === lang));
    buildSelects();
    if (!lt.langTouched) setLetterLang(lang, false);
  }
  document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => { lang = b.dataset.l; store.set("daak-lang", lang); applyLang(); }));

  /* ---------- stamp maker ---------- */
  const cv = $("cv");
  function opts(extra) {
    const o = { template: st.template, photo: st.photo, zoom: st.zoom, posY: st.posY, ink: st.ink, district: st.district, value: D.VALUES[st.value],
      caption: st.custom ? 0 : st.caption, bnFont: st.bnFont, enFont: st.enFont, colour: st.colour, postmark: st.postmark, height: st.height };
    if (st.custom) { o.capEn = st.capEn || " "; o.capBn = st.capBn || " "; }
    return Object.assign(o, extra);
  }
  let queued = false;
  function render() { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; S.render(cv, opts()); letterDirty = true; }); }

  // template gallery with live thumbnails
  const thumbs = {};
  D.TEMPLATES.forEach(([id]) => {
    const b = document.createElement("button"); b.type = "button"; b.dataset.tpl = id; b.setAttribute("aria-pressed", id === st.template);
    const c = document.createElement("canvas"); c.width = 210; c.height = 265; thumbs[id] = c;
    const s = document.createElement("span"); s.dataset.t = "tpl_" + id; s.textContent = D.UI.en["tpl_" + id];
    b.append(c, s); $("gallery").appendChild(b);
  });
  $("gallery").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return; st.template = b.dataset.tpl;
    $("gallery").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b));
    $("colourWrap").hidden = st.template !== "classic"; render();
  });
  let thumbJob = 0, thumbTimer = 0;
  function refreshThumbs(delay = 500) {
    clearTimeout(thumbTimer);
    thumbTimer = setTimeout(() => {
      const job = ++thumbJob, ids = D.TEMPLATES.map(t => t[0]); let i = 0;
      const step = () => {
        if (job !== thumbJob || i >= ids.length) return;
        const id = ids[i++], c = thumbs[id], x = c.getContext("2d");
        x.clearRect(0, 0, c.width, c.height); x.drawImage(S.stamp(opts({ template: id, postmark: false })), 0, 0, c.width, c.height);
        setTimeout(step, 10);
      };
      step();
    }, delay);
  }

  $("district").addEventListener("change", e => { st.district = +e.target.value; render(); refreshThumbs(); });
  $("value").addEventListener("change", e => { st.value = +e.target.value; render(); refreshThumbs(); });
  $("caption").addEventListener("change", e => {
    st.custom = e.target.value === "custom"; if (!st.custom) st.caption = +e.target.value;
    $("customCap").hidden = !st.custom;
    if (st.custom && !st.capEn && !st.capBn) { const c = D.CAPTIONS[st.caption]; st.capEn = $("capEn").value = c[0]; st.capBn = $("capBn").value = c[1]; }
    render(); refreshThumbs();
  });
  $("capEn").addEventListener("input", e => { st.capEn = e.target.value; render(); refreshThumbs(900); });
  $("capBn").addEventListener("input", e => { st.capBn = e.target.value; render(); refreshThumbs(900); });
  ["bnFont", "enFont", "colour"].forEach(id => $(id).addEventListener("change", e => { st[id] = e.target.value; render(); refreshThumbs(); }));
  $("postmark").addEventListener("change", e => { st.postmark = e.target.checked; render(); });
  ["zoom", "posY", "ink"].forEach(id => $(id).addEventListener("input", e => { st[id] = parseFloat(e.target.value); render(); refreshThumbs(900); }));
  $("sizeSeg").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return; st.height = +b.dataset.h;
    $("sizeSeg").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); render();
  });
  $("stampForm").addEventListener("submit", e => e.preventDefault());
  $("letterForm").addEventListener("submit", e => e.preventDefault());

  function loadPhoto(file, done, statusEl) {
    if (!file) return;
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const max = 1600, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); done(c);
    };
    img.onerror = () => { URL.revokeObjectURL(url); say(statusEl, "photoErr"); };
    img.src = url;
  }
  $("photo").addEventListener("change", e => {
    const f = e.target.files[0];
    loadPhoto(f, c => {
      st.photo = c; st.sample = false; const n = $("photoNote"); n.removeAttribute("data-t"); n.textContent = f.name;
      say($("stampStatus"), ""); render(); refreshThumbs(50);
    }, $("stampStatus"));
  });

  /* ---------- saving & sharing ---------- */
  const inArtifact = !!(window.claude && window.claude.use);
  let dl = null; if (inArtifact) window.claude.use("downloads").then(d => { dl = d; }).catch(() => {});
  const canShareFiles = (() => { try { return !inArtifact && !!(navigator.canShare && navigator.canShare({ files: [new File(["x"], "x.png", { type: "image/png" })] })); } catch (e) { return false; } })();
  $("shareImg").hidden = !canShareFiles; $("sharePdf").hidden = !canShareFiles;

  async function saveBlob(blob, name, statusEl) {
    if (dl) {
      try { await dl.save({ filename: name, data: blob }); say(statusEl, "saved"); }
      catch (err) { if (!err || err.code !== "declined") { statusEl.removeAttribute("data-t"); statusEl.textContent = (err && err.message) || "Save failed"; } }
      return;
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000); say(statusEl, "saved");
  }
  async function shareBlob(blob, name, text, statusEl) {
    const file = new File([blob], name, { type: blob.type });
    try { await navigator.share({ files: [file], text }); }
    catch (err) { if (err && err.name === "AbortError") return; say(statusEl, "shareNo"); saveBlob(blob, name, statusEl); }
  }
  const toBlob = (c, type, q) => new Promise(r => c.toBlob(r, type, q));
  const slug = () => D.DISTRICTS[st.district][0].toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const caption = () => { const d = D.DISTRICTS[st.district]; return lang === "bn" ? `আমার ডাকটিকিট 📮 ${d[1]} #DaakBD #ডাক` : `My Daak stamp 📮 ${d[0]}, Bangladesh #DaakBD`; };
  async function fullPicture(type, q) { const c = document.createElement("canvas"); S.render(c, opts()); return toBlob(c, type, q); }

  $("savePng").addEventListener("click", async () => saveBlob(await fullPicture("image/png"), `daak-${st.template}-${slug()}.png`, $("stampStatus")));
  $("saveJpg").addEventListener("click", async () => saveBlob(await fullPicture("image/jpeg", 0.92), `daak-${st.template}-${slug()}.jpg`, $("stampStatus")));
  $("saveSticker").addEventListener("click", async () => {
    const b = await toBlob(S.sticker(opts()), "image/webp", 0.95);
    const webp = b && b.type === "image/webp";
    saveBlob(webp ? b : await toBlob(S.sticker(opts()), "image/png"), `daak-sticker-${slug()}.${webp ? "webp" : "png"}`, $("stampStatus"));
  });
  $("shareImg").addEventListener("click", async () => shareBlob(await fullPicture("image/png"), `daak-${slug()}.png`, caption(), $("stampStatus")));

  /* ---------- tabs ---------- */
  function showTab(which) {
    const letter = which === "letter";
    $("viewStamp").hidden = letter; $("viewLetter").hidden = !letter;
    $("tabStamp").setAttribute("aria-selected", !letter); $("tabLetter").setAttribute("aria-selected", letter);
    if (letter) renderLetter(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  $("tabStamp").addEventListener("click", () => showTab("stamp"));
  $("tabLetter").addEventListener("click", () => showTab("letter"));
  $("toLetter").addEventListener("click", () => showTab("letter"));
  $("home").addEventListener("click", e => { e.preventDefault(); showTab("stamp"); });

  /* ---------- letter ---------- */
  let letterDirty = true, pageCanvases = [], letterTimer = 0;
  function setLetterLang(l, touched) {
    lt.lang = l; if (touched) lt.langTouched = true;
    $("letterLang").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.ll === l));
    const m = $("message"); m.style.fontFamily = l === "bn" ? "Atma, 'Hind Siliguri', sans-serif" : "Caveat, Raleway, cursive"; m.style.fontSize = l === "bn" ? "17px" : "21px";
    if (!lt.msgTouched) m.value = D.UI[l].defMsg;
    scheduleLetter();
  }
  $("letterLang").addEventListener("click", e => { const b = e.target.closest("button"); if (b) setLetterLang(b.dataset.ll, true); });
  $("message").addEventListener("input", () => { lt.msgTouched = true; scheduleLetter(); });
  ["sName", "sAddr", "rName", "rAddr"].forEach(id => $(id).addEventListener("input", scheduleLetter));
  document.querySelectorAll('input[name="sealSrc"]').forEach(r => r.addEventListener("change", e => {
    lt.sealSrc = e.target.value; if (lt.sealSrc === "other" && !lt.sealPhoto) $("sealPhoto").click(); scheduleLetter();
  }));
  $("sealPhoto").addEventListener("change", e => loadPhoto(e.target.files[0], c => { lt.sealPhoto = c; scheduleLetter(); }, $("letterStatus")));

  function scheduleLetter() { letterDirty = true; clearTimeout(letterTimer); letterTimer = setTimeout(() => renderLetter(false), 350); }
  function letterOpts() {
    const stamp = S.stamp(opts({ postmark: false }));
    const m = $("miniStamp").getContext("2d"); m.clearRect(0, 0, 84, 106); m.drawImage(stamp, 0, 0, 84, 106);
    return { lang: lt.lang, message: $("message").value, stamp, district: D.DISTRICTS[st.district][0],
      sealPhoto: lt.sealSrc === "other" && lt.sealPhoto ? lt.sealPhoto : st.photo,
      sender: { name: $("sName").value.trim(), addr: $("sAddr").value.trim() }, receiver: { name: $("rName").value.trim(), addr: $("rAddr").value.trim() } };
  }
  function renderLetter(force) {
    if ($("viewLetter").hidden && !force) return;
    if (!letterDirty && pageCanvases.length) return;
    pageCanvases = L.pages(letterOpts()); letterDirty = false;
    const box = $("pages"), keep = lt.page; box.innerHTML = ""; $("dots").innerHTML = "";
    pageCanvases.forEach((c, i) => {
      c.setAttribute("role", "img"); c.setAttribute("aria-label", `Page ${i + 1} of ${pageCanvases.length}`); box.appendChild(c);
      const d = document.createElement("button"); d.type = "button"; d.setAttribute("aria-label", `Page ${i + 1}`);
      d.addEventListener("click", () => box.scrollTo({ left: i * box.clientWidth + i * 12, behavior: "smooth" })); $("dots").appendChild(d);
    });
    lt.page = Math.min(keep, pageCanvases.length - 1); box.scrollLeft = lt.page * (box.clientWidth + 12); markDot();
  }
  function markDot() { [...$("dots").children].forEach((d, i) => d.setAttribute("aria-current", i === lt.page)); }
  $("pages").addEventListener("scroll", () => { const b = $("pages"); const i = Math.round(b.scrollLeft / (b.clientWidth + 12)); if (i !== lt.page) { lt.page = i; markDot(); } }, { passive: true });

  async function makePdf() {
    if (letterDirty || !pageCanvases.length) renderLetter(true);
    await new Promise(r => setTimeout(r, 30));
    return L.pdf(pageCanvases);
  }
  const pdfName = () => `daak-chithi-${slug()}.pdf`;
  function playPostAnim() {
    const ov = $("pdfAnim"), letter = ov.querySelector(".pdf-anim-letter");
    letter.style.animation = "none"; void letter.offsetWidth; letter.style.animation = "";
    ov.classList.add("on"); ov.setAttribute("aria-hidden", "false");
    return new Promise(r => setTimeout(r, 1800));
  }
  function stopPostAnim() { const ov = $("pdfAnim"); ov.classList.remove("on"); ov.setAttribute("aria-hidden", "true"); }
  $("savePdf").addEventListener("click", async () => {
    const b = $("savePdf"); b.disabled = true; say($("letterStatus"), "working");
    try {
      const [blob] = await Promise.all([makePdf(), playPostAnim()]);
      await saveBlob(blob, pdfName(), $("letterStatus"));
    } finally { b.disabled = false; stopPostAnim(); }
  });
  $("sharePdf").addEventListener("click", async () => {
    const b = $("sharePdf"); b.disabled = true;
    try {
      const [blob] = await Promise.all([makePdf(), playPostAnim()]);
      await shareBlob(blob, pdfName(), caption(), $("letterStatus"));
    } finally { b.disabled = false; stopPostAnim(); }
  });

  /* ---------- splash ---------- */
  function splash() {
    const sp = $("splash"), reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const p = $("spPaper"), x = p.getContext("2d"), w = p.width, h = p.height;
    x.fillStyle = "#f4ecd9"; x.fillRect(0, 0, w, h); S.noise(x, w, h, "#8a7a5a", 1800, 3);
    x.strokeStyle = "rgba(22,63,55,.08)"; for (let r = 4; r < 700; r += 4) { x.beginPath(); x.arc(w / 2, h * 0.46, r, 0, Math.PI * 2); x.stroke(); }
    x.strokeStyle = "#163f37"; x.lineWidth = 4; x.strokeRect(44, 44, w - 88, h - 88); x.lineWidth = 1.5; x.strokeRect(58, 58, w - 116, h - 116);
    S.punch(p, 17);
    $("spYear").textContent = new Date().getFullYear();
    const sub = $("spSub");
    const setSubBn = () => { sub.style.fontFamily = "var(--bn-ui)"; sub.style.letterSpacing = "0"; sub.style.fontSize = "18px"; sub.style.textTransform = "none"; sub.innerHTML = `<span aria-hidden="true">${esc(toBijoy("পুরনো চিঠির খোঁজে"))}</span><span class="sr">পুরনো চিঠির খোঁজে</span>`; };
    const setSubEn = () => { sub.style.fontFamily = ""; sub.style.letterSpacing = ""; sub.style.fontSize = ""; sub.style.textTransform = ""; sub.textContent = "In search of old letters"; };
    if (reduce) setSubEn(); else setSubBn();
    const bnEl = $("spBn"), enEl = $("spEn"), timers = [];
    const at = (t, fn) => timers.push(setTimeout(fn, t));
    let t = reduce ? 0 : 950;
    ["ড", "ডা", "ডাক"].forEach(s => { at(t, () => { bnEl.textContent = toBijoy(s); bnEl.classList.add("caret"); }); t += reduce ? 0 : 280; });
    t += reduce ? 0 : 220; at(t, () => bnEl.classList.remove("caret"));
    ["D", "DA", "DAA", "DAAK"].forEach(s => { at(t, () => { enEl.textContent = s; enEl.classList.add("caret"); }); t += reduce ? 0 : 150; });
    const onTime = t + 120;
    at(onTime, () => { enEl.classList.remove("caret"); $("spMark").classList.add("on"); sub.classList.add("on"); });
    let closeTime = t + (reduce ? 1200 : 1500);
    if (!reduce) {
      const offTime = onTime + 1700, enTime = offTime + 550;
      at(offTime, () => sub.classList.remove("on"));
      at(enTime, () => { setSubEn(); sub.classList.add("on"); });
      closeTime = enTime + 1300;
    }
    let closed = false;
    const close = () => { if (closed) return; closed = true; timers.forEach(clearTimeout); sp.classList.add("out"); document.body.style.overflow = ""; setTimeout(() => sp.remove(), 700); };
    document.body.style.overflow = "hidden";
    at(closeTime, close);
    $("spSkip").addEventListener("click", close); sp.addEventListener("click", e => { if (e.target === sp) close(); });
  }

  /* ---------- background music ---------- */
  function music() {
    const VIDEO_ID = "6F0VIc6gG6Y";
    const btn = $("musicToggle");
    let player = null, ready = false, enabled = store.get("daak-music") !== "off";
    const setIcon = on => { btn.textContent = on ? "🔊" : "🔈"; btn.setAttribute("aria-pressed", String(on)); btn.setAttribute("aria-label", on ? "Mute background music" : "Play background music"); };
    setIcon(false);
    // browsers never allow unmuted autoplay with no user action at all, so it starts muted and
    // loops silently; the moment the visitor taps/clicks/types anywhere (skipping the splash counts),
    // that's a real gesture and we use it to switch the sound on automatically — no need to find the button
    const GESTURES = ["pointerdown", "keydown", "touchstart"];
    const tryUnmute = () => {
      if (!ready || !enabled) return;
      player.unMute(); player.playVideo(); setIcon(true);
      GESTURES.forEach(ev => document.removeEventListener(ev, tryUnmute));
    };
    GESTURES.forEach(ev => document.addEventListener(ev, tryUnmute, { passive: true }));
    window.onYouTubeIframeAPIReady = () => {
      player = new YT.Player("ytAudio", {
        videoId: VIDEO_ID,
        // try real sound-on autoplay right from the splash — some browsers allow it once this
        // site has been played before; if it gets blocked, fall back to muted + the gesture
        // listener above, which turns sound on at the first tap/click/key anywhere (including
        // the splash's own Skip button or tapping the splash to dismiss it)
        playerVars: { autoplay: 1, loop: 1, playlist: VIDEO_ID, controls: 0, disablekb: 1, modestbranding: 1, playsinline: 1, mute: enabled ? 0 : 1 },
        events: {
          onReady: () => {
            ready = true; player.setVolume(55); player.playVideo();
            setTimeout(() => {
              const on = enabled && !player.isMuted() && player.getPlayerState() === YT.PlayerState.PLAYING;
              if (on) { setIcon(true); GESTURES.forEach(ev => document.removeEventListener(ev, tryUnmute)); }
              else { player.mute(); player.playVideo(); setIcon(false); }
            }, 500);
          }
        }
      });
    };
    const tag = document.createElement("script"); tag.src = "https://www.youtube.com/iframe_api"; document.head.appendChild(tag);
    btn.addEventListener("click", () => {
      if (!ready) return;
      const on = btn.getAttribute("aria-pressed") === "true";
      if (on) { player.mute(); enabled = false; store.set("daak-music", "off"); setIcon(false); }
      else { enabled = true; store.set("daak-music", "on"); tryUnmute(); }
    });
  }

  /* ---------- hurricane lamp: dark mode toggle ---------- */
  function lamp() {
    const btn = $("lampToggle");
    const apply = theme => { document.documentElement.setAttribute("data-theme", theme); btn.setAttribute("aria-pressed", String(theme === "dark")); btn.setAttribute("aria-label", theme === "dark" ? "Blow out the hurricane lamp (switch to light mode)" : "Light the hurricane lamp (switch to dark mode)"); };
    const saved = store.get("daak-theme");
    apply(saved === "dark" || saved === "light" ? saved : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
    btn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next); store.set("daak-theme", next);
    });
  }

  /* ---------- start ---------- */
  $("logoBn").textContent = toBijoy("ডাক");
  $("postmark").checked = st.postmark;
  applyLang();
  splash();
  music();
  lamp();
  render(); refreshThumbs(0);
  const faces = ['400 20px "Li Alinur Nanggala"', '400 20px "Li Chayana Teesta"', '800 20px Raleway', '700 20px Raleway', '600 20px Raleway', '500 20px "Hind Siliguri"', '600 20px "Hind Siliguri"',
    '700 20px "Hind Siliguri"', '900 20px "Big Shoulders Display"', '400 20px "Archivo Black"', '500 20px Fraunces', '600 20px Fraunces', '400 20px Galada', '400 20px "Tiro Bangla"', '500 20px Atma', '500 20px Caveat', '700 20px Caveat'];
  Promise.all(faces.map(f => document.fonts.load(f, "Aবা").catch(() => {}))).then(() => { render(); refreshThumbs(0); letterDirty = true; renderLetter(false); });
})();
