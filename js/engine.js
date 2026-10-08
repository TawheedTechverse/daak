/* Daak — stamp engine. Draws a stamp from a photo + options onto canvases.
 * Needs: bijoy.js (window.toBijoy) and data.js (window.DaakData). */
(function (root) {
  "use strict";
  const D = root.DaakData, toBijoy = root.toBijoy, bnD = D.toBnDigits;
  const SW = 840, SH = 1060, M = 46;

  /* ---------- utils ---------- */
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const spaced = (x, px) => { if ("letterSpacing" in x) x.letterSpacing = px + "px"; };

  /* ---------- lettering ---------- */
  // Bangla: set font on ctx and return the string to draw (converted for Li ANSI fonts).
  function bnFace(key) { const f = D.BN_FONTS[key]; return f && f.f ? f : D.BN_FONTS.hind; }
  function bnFit(x, key, text, max, maxW) {
    const f = bnFace(key), str = f.ansi ? toBijoy(text) : text;
    let s = max; for (; s > 12; s -= 2) { x.font = `${f.w || 400} ${s}px ${f.f}, "Hind Siliguri", sans-serif`; if (x.measureText(str).width <= maxW) break; }
    return { str, size: s };
  }
  function enFace(key) { const f = D.EN_FONTS[key]; return f && f.f ? f : D.EN_FONTS.raleway; }
  function enFit(x, key, text, max, maxW, weight) {
    const f = enFace(key); let s = max;
    for (; s > 12; s -= 2) { x.font = `${weight || f.w} ${s}px ${f.f}, Raleway, sans-serif`; if (x.measureText(text).width <= maxW) break; }
    return { str: text, size: s };
  }
  // Fixed small Bangla text (always Hind, Unicode)
  const bnSmall = (x, size, w = 500) => { x.font = `${w} ${size}px "Hind Siliguri", sans-serif`; };
  const en = (x, size, w = 600, fam = "Raleway") => { x.font = `${w} ${size}px ${fam}, Raleway, sans-serif`; };
  // Raleway has old-style figures; numbers use Hind Siliguri (lining) instead.
  const num = (x, size, w = 700) => { x.font = `${w} ${size}px "Hind Siliguri", sans-serif`; };

  /* ---------- photo processing ---------- */
  function photoCanvas(o, w, h) {
    const c = mk(w, h), x = c.getContext("2d"), img = o.photo;
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const s = Math.max(w / iw, h / ih) * o.zoom, dw = iw * s, dh = ih * s;
    x.drawImage(img, (w - dw) / 2, (h - dh) / 2 - o.posY * Math.max(0, (dh - h) / 2), dw, dh);
    return c;
  }
  function lumOf(c, k) {
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, n = c.width * c.height, L = new Float32Array(n);
    for (let i = 0; i < n; i++) L[i] = clamp(((0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255 - 0.5) * k + 0.5);
    return L;
  }
  const fromData = (img) => { const c = mk(img.width, img.height); c.getContext("2d").putImageData(img, 0, 0); return c; };

  function engrave(o, w, h, rgb, fadeTop, period = 5.5) {
    const L = lumOf(photoCanvas(o, w, h), o.ink), out = new ImageData(w, h), d = out.data;
    for (let y = 0; y < h; y++) { const m = fadeTop ? clamp(y / (h * fadeTop)) : 1;
      for (let x = 0; x < w; x++) { const i = y * w + x, t = Math.abs((((y + x * 0.18) / period) % 1) * 2 - 1);
        d[i * 4] = rgb[0]; d[i * 4 + 1] = rgb[1]; d[i * 4 + 2] = rgb[2]; d[i * 4 + 3] = clamp((t - L[i] * 1.05) / 0.14 + 0.5) * m * 255; } }
    return fromData(out);
  }
  function duotone(o, w, h, dark, light) {
    const src = photoCanvas(o, w, h), L = lumOf(src, o.ink), out = new ImageData(w, h), d = out.data, r = rng(4);
    for (let i = 0; i < w * h; i++) { const t = clamp(L[i] + (r() - 0.5) * 0.06);
      d[i * 4] = dark[0] + (light[0] - dark[0]) * t; d[i * 4 + 1] = dark[1] + (light[1] - dark[1]) * t; d[i * 4 + 2] = dark[2] + (light[2] - dark[2]) * t; d[i * 4 + 3] = 255; }
    return fromData(out);
  }
  function vivid(o, w, h, sat = 1.25, warm = 0) {
    const src = photoCanvas(o, w, h), id = src.getContext("2d").getImageData(0, 0, w, h), d = id.data, k = o.ink, r = rng(8);
    for (let i = 0; i < d.length; i += 4) { let R = d[i] / 255, G = d[i + 1] / 255, B = d[i + 2] / 255; const l = 0.299 * R + 0.587 * G + 0.114 * B;
      R = l + (R - l) * sat; G = l + (G - l) * sat; B = l + (B - l) * sat; const n = (r() - 0.5) * 0.05;
      d[i] = clamp((R - 0.5) * k + 0.5 + warm + n) * 255; d[i + 1] = clamp((G - 0.5) * k + 0.5 + n) * 255; d[i + 2] = clamp((B - 0.5) * k + 0.5 - warm + n) * 255; }
    src.getContext("2d").putImageData(id, 0, 0); return src;
  }
  function vintage(o, w, h, fadeTop) {
    const src = photoCanvas(o, w, h), id = src.getContext("2d").getImageData(0, 0, w, h), d = id.data, k = o.ink, r = rng(7);
    for (let y = 0; y < h; y++) { const m = clamp(y / (h * fadeTop));
      for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; let R = d[i] / 255, G = d[i + 1] / 255, B = d[i + 2] / 255;
        const l = 0.299 * R + 0.587 * G + 0.114 * B; R = l + (R - l) * 0.72; G = l + (G - l) * 0.72; B = l + (B - l) * 0.72;
        R = (R - 0.5) * k + 0.52; G = (G - 0.5) * k + 0.5; B = (B - 0.5) * k * 0.95 + 0.44; const n = (r() - 0.5) * 0.07;
        d[i] = clamp(R * 1.04 + 0.03 + n) * 255; d[i + 1] = clamp(G * 0.98 + 0.02 + n) * 255; d[i + 2] = clamp(B * 0.86 + n) * 255; d[i + 3] = m * 255; } }
    src.getContext("2d").putImageData(id, 0, 0); return src;
  }
  function halftone(o, w, h, rgb, cell, vignette) {
    const L = lumOf(photoCanvas(o, w, h), o.ink), out = new ImageData(w, h), d = out.data, S = Math.SQRT1_2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = (x + y) * S, v = (x - y) * S, cu = (Math.floor(u / cell) + .5) * cell, cv = (Math.floor(v / cell) + .5) * cell;
      const sx = clamp(Math.round((cu + cv) * S), 0, w - 1), sy = clamp(Math.round((cu - cv) * S), 0, h - 1);
      const rad = cell * 0.74 * Math.sqrt(1 - L[sy * w + sx]), dist = Math.hypot(u - cu, v - cv), i = (y * w + x) * 4;
      let a = clamp(rad - dist + 0.5);
      if (vignette) { const ex = (x / w - 0.5) * 2, ey = (y / h - 0.5) * 2; a *= clamp((1 - Math.hypot(ex, ey * 0.9)) * 2.2); }
      d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = a * 255; }
    return fromData(out);
  }
  function gritty(o, w, h) {
    const L = lumOf(photoCanvas(o, w, h), o.ink), out = new ImageData(w, h), d = out.data, r = rng(11);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x;
      let a = (1 - L[i]) * 1.15 + (r() - 0.5) * 0.3; a = a > 0.55 ? Math.min(1, a * 1.15) : a * 0.55; if (a < 0.1) a = 0; if (y % 4 === 0) a *= 0.75;
      d[i * 4] = 18; d[i * 4 + 1] = 17; d[i * 4 + 2] = 17; d[i * 4 + 3] = clamp(a) * 255; }
    return fromData(out);
  }
  /** Bronze medallion tone with a light emboss, for the letter seal. */
  function bronze(photo, size, ink = 1.15) {
    const o = { photo, zoom: 1, posY: 0, ink };
    const L = lumOf(photoCanvas(o, size, size), ink), out = new ImageData(size, size), d = out.data;
    const stops = [[0, [42, 22, 8]], [0.45, [128, 76, 34]], [0.75, [205, 145, 80]], [1, [250, 214, 150]]];
    const ramp = t => { for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const a = stops[i - 1], b = stops[i], f = (t - a[0]) / (b[0] - a[0]); return a[1].map((v, j) => v + (b[1][j] - v) * f); } return stops[3][1]; };
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = y * size + x, j = Math.min(size - 1, y + 1) * size + Math.min(size - 1, x + 1);
      const emb = (L[i] - L[j]) * 2.2, t = clamp(L[i] * 0.85 + 0.08 + emb * 0.5), c = ramp(t);
      d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255; }
    return fromData(out);
  }

  /* ---------- drawing helpers ---------- */
  function guilloche(x, cx, cy, color, step) { x.save(); x.strokeStyle = color; x.lineWidth = 1; for (let r = 3; r < 1000; r += step) { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke(); } x.restore(); }
  function noise(x, w, h, color, count, seed) { const r = rng(seed); x.fillStyle = color; for (let i = 0; i < count; i++) { x.globalAlpha = r() * 0.45; x.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } x.globalAlpha = 1; }
  function bird(x, cx, cy, s, tilt) { x.save(); x.translate(cx, cy); x.rotate(tilt); x.beginPath();
    x.moveTo(-s, -s * 0.15); x.quadraticCurveTo(-s * 0.45, -s * 0.55, 0, 0); x.quadraticCurveTo(s * 0.45, -s * 0.75, s * 1.1, -s * 0.35);
    x.quadraticCurveTo(s * 0.4, -s * 0.2, 0, s * 0.18); x.quadraticCurveTo(-s * 0.4, -s * 0.05, -s, -s * 0.15); x.fill(); x.restore(); }
  function circleText(x, text, cx, cy, r, start = -Math.PI / 2, span = Math.PI * 2) { x.save(); x.translate(cx, cy); x.textAlign = "center";
    for (let i = 0; i < text.length; i++) { const a = start + (i / text.length) * span; x.save(); x.rotate(a + Math.PI / 2); x.fillText(text[i], 0, -r); x.restore(); } x.restore(); }
  function rrect(x, X, Y, w, h, r) { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, w, h, r); else x.rect(X, Y, w, h); }
  function star(x, cx, cy, r) { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fill(); }
  function vtext(x, text, X, Y, rot) { x.save(); x.translate(X, Y); x.rotate(rot); x.fillText(text, 0, 0); x.restore(); }
  function punch(S, r) { const x = S.getContext("2d"), w = S.width, h = S.height; x.globalCompositeOperation = "destination-out";
    const nx = Math.round(w / (r * 2.7)), ny = Math.round(h / (r * 2.7)); x.beginPath();
    for (let i = 0; i <= nx; i++) { const px = i * w / nx; x.moveTo(px + r, 0); x.arc(px, 0, r, 0, Math.PI * 2); x.moveTo(px + r, h); x.arc(px, h, r, 0, Math.PI * 2); }
    for (let j = 1; j < ny; j++) { const py = j * h / ny; x.moveTo(r, py); x.arc(0, py, r, 0, Math.PI * 2); x.moveTo(w + r, py); x.arc(w, py, r, 0, Math.PI * 2); }
    x.fill(); x.globalCompositeOperation = "source-over"; }

  /* ---------- value text ---------- */
  function val(o) {
    const n = o.value[0], tk = o.value[1] === "tk";
    return {
      n: String(n), bn: bnD(n),
      symBn: tk ? "৳" + bnD(n) : bnD(n) + "প", symEn: tk ? "TK " + n : n + "P",
      unitBn: tk ? "টাকা" : "পয়সা", unitEn: tk ? "TAKA" : "POISHA", tk
    };
  }

  /* ---------- postmark overlay ---------- */
  function postmark(x, w, h, o, color = "rgba(30,28,40,.72)") {
    x.save(); x.strokeStyle = color; x.fillStyle = color;
    const cy = h * 0.32, px = w * 0.34, start = px + 116;
    x.lineWidth = 4; for (let i = 0; i < 5; i++) { x.beginPath(); for (let qx = start; qx <= w + 10; qx += 6) { const qy = cy - 60 + i * 30 + Math.sin(qx / 34) * 9; qx === start ? x.moveTo(qx, qy) : x.lineTo(qx, qy); } x.stroke(); }
    x.lineWidth = 4; x.beginPath(); x.arc(px, cy, 96, 0, Math.PI * 2); x.stroke(); x.lineWidth = 2; x.beginPath(); x.arc(px, cy, 64, 0, Math.PI * 2); x.stroke();
    en(x, 19, 800); circleText(x, ` ${o.dEn.toUpperCase()} • DAAK •`, px, cy, 74);
    x.textAlign = "center"; num(x, 24, 700); x.fillText(o.date, px, cy + 9); x.textAlign = "left";
    x.restore();
  }

  /* ---------- templates ---------- */
  const T = {};

  T.classic = { bg: "#141210", tag: "rgba(255,255,255,.55)", bn: "alinur", en: "raleway", draw(x, w, h, o) {
    const C = o.colour, P = "#f3ead7", v = val(o), fw = w - 2 * M - 20, fx = M + 10;
    x.fillStyle = P; x.fillRect(0, 0, w, h); noise(x, w, h, "#7a6a4a", 2200, 2);
    x.fillStyle = C; x.fillRect(fx, M + 10, fw, 118);
    x.fillStyle = P; const t = bnFit(x, o.bnFont, `${v.symBn}  বাংলাদেশ`, 96, fw - 50); x.textBaseline = "middle"; x.textAlign = "center"; x.fillText(t.str, w / 2, M + 74); x.textBaseline = "alphabetic"; x.textAlign = "left";
    const iy = M + 10 + 118 + 16, by = h - M - 10 - 112, ih = by - 16 - iy;
    x.drawImage(duotone(o, fw, ih, hex(C).map(c => c * 0.55), hex(P).map(c => c * 0.97)), fx, iy);
    x.strokeStyle = C; x.lineWidth = 4; x.strokeRect(fx + 2, iy + 2, fw - 4, ih - 4);
    x.fillStyle = "rgba(243,234,215,.92)"; en(x, 24, 800); spaced(x, 2); x.textAlign = "right"; x.fillText(o.capEn.toUpperCase(), fx + fw - 22, iy + ih - 22); spaced(x, 0); x.textAlign = "left";
    x.fillStyle = C; x.fillRect(fx, by, fw, 112);
    x.fillStyle = P; const e = enFit(x, o.enFont, "BANGLADESH", 74, fw * 0.66); x.textBaseline = "middle"; x.fillText(e.str, fx + 26, by + 60);
    x.textAlign = "right"; num(x, 76, 700); x.fillText(v.n + (v.tk ? "" : "P"), fx + fw - 26, by + 64);
    if (v.tk) { const vw = x.measureText(v.n).width; num(x, 32, 700); x.fillText("TK", fx + fw - 34 - vw, by + 64); }
    x.textAlign = "left"; x.textBaseline = "alphabetic";
  } };

  T.painted = { bg: "#1b2a33", tag: "rgba(255,255,255,.6)", bn: "hind", en: "raleway", draw(x, w, h, o) {
    const v = val(o); x.fillStyle = "#f8f7f2"; x.fillRect(0, 0, w, h);
    const ix = M + 4, iy = M + 4, iw = w - 2 * M - 8, ih = h - 2 * M - 8;
    x.drawImage(vivid(o, iw, ih, 1.3, 0.02), ix, iy);
    let g = x.createLinearGradient(0, iy, 0, iy + 190); g.addColorStop(0, "rgba(248,247,242,.85)"); g.addColorStop(1, "rgba(248,247,242,0)"); x.fillStyle = g; x.fillRect(ix, iy, iw, 190);
    g = x.createLinearGradient(0, iy + ih - 200, 0, iy + ih); g.addColorStop(0, "rgba(248,247,242,0)"); g.addColorStop(1, "rgba(248,247,242,.9)"); x.fillStyle = g; x.fillRect(ix, iy + ih - 200, iw, 200);
    x.fillStyle = "#1c1c1c"; const tv = bnFit(x, "hind", v.symBn, 70, 220); x.fillText(tv.str, ix + 24, iy + 82);
    x.fillStyle = "#e0442b"; x.textAlign = "right"; const e = enFit(x, o.enFont, "BANGLADESH", 62, iw * 0.6); x.fillText(e.str, ix + iw - 24, iy + 74);
    x.fillStyle = "#e0262b"; x.textAlign = "center"; const b = bnFit(x, o.bnFont, "বাংলাদেশ", 92, iw * 0.55); x.fillText(b.str, w / 2, iy + ih - 34);
    x.textAlign = "right"; x.fillStyle = "#1c1c1c"; const tv2 = bnFit(x, "hind", v.symBn, 70, 220); x.fillText(tv2.str, ix + iw - 22, iy + ih - 34); x.textAlign = "left";
    x.fillStyle = "#1f8fd0"; en(x, 30, 800); spaced(x, 1); const ce = o.capEn.toUpperCase(); x.save(); x.translate(ix + 46, iy + ih - 150); x.rotate(-Math.PI / 2); x.fillText(ce, 0, 0); x.restore(); spaced(x, 0);
    bnSmall(x, 30, 600); x.save(); x.translate(ix + iw - 40, iy + 130); x.rotate(Math.PI / 2); x.fillText(o.capBn, 0, 0); x.restore();
  } };

  T.framed = { bg: "#2b1f12", tag: "rgba(255,235,200,.6)", bn: "alinur", en: "raleway", draw(x, w, h, o) {
    const v = val(o), G = "#d9a23d"; x.fillStyle = "#fbf8f1"; x.fillRect(0, 0, w, h);
    x.fillStyle = G; x.fillRect(M, M, w - 2 * M, h - 2 * M); noise(x, w, h, "#7a4a10", 1400, 6);
    const ix = M + 76, iy = M + 150, iw = w - 2 * M - 112, ih = h - 2 * M - 300;
    x.fillStyle = "#111"; x.fillRect(ix - 8, iy - 8, iw + 16, ih + 16); x.drawImage(vivid(o, iw, ih, 1.2), ix, iy);
    x.fillStyle = "#111"; const b = bnFit(x, o.bnFont, "বাংলাদেশ", 104, iw * 0.66); x.fillText(b.str, ix - 8, iy - 34);
    x.textAlign = "right"; num(x, 80, 700); x.fillText(v.n, w - M - 30, iy - 58); bnSmall(x, 30, 700); x.fillText(v.unitBn, w - M - 30, iy - 24);
    const e = enFit(x, o.enFont, "BANGLADESH", 86, iw * 0.68, 900); x.textAlign = "left"; x.fillText(e.str, ix - 8, h - M - 44);
    x.textAlign = "right"; num(x, 80, 700); x.fillText(v.n, w - M - 30, h - M - 70); en(x, 26, 800); x.fillText(v.unitEn, w - M - 30, h - M - 44);
    x.textAlign = "left"; en(x, 26, 800); spaced(x, 1); x.save(); x.translate(M + 52, iy + ih - 10); x.rotate(-Math.PI / 2); x.fillText(o.capEn.toUpperCase(), 0, 0); x.restore(); spaced(x, 0);
  } };

  T.airmail = { bg: "#151515", tag: "rgba(239,229,207,.6)", bn: "hind", en: "shoulders", draw(x, w, h, o) {
    const GR = "#163f37", RD = "#cf3b2a", v = val(o);
    x.fillStyle = "#efe5cf"; x.fillRect(0, 0, w, h); noise(x, w, h, "#8a7a5a", 2600, 5);
    x.strokeStyle = "rgba(22,63,55,.5)"; x.lineWidth = 1.5; x.strokeRect(M - 8, M - 8, w - 2 * M + 16, h - 2 * M + 16);
    x.fillStyle = RD; x.fillRect(M + 8, M + 12, 16, 16);
    x.fillStyle = GR; en(x, 24, 700); x.fillText("AIR MAIL", M + 34, M + 30); const am = x.measureText("AIR MAIL  ").width; bnSmall(x, 24, 600); x.fillText("বিমান ডাক", M + 34 + am, M + 30);
    x.textAlign = "right"; x.fillStyle = RD; en(x, 34, 900, '"Big Shoulders Display"'); x.fillText(String(o.year), w - M - 6, M + 32);
    en(x, 15, 700); spaced(x, 2); x.fillText("ISSUE", w - M - 6, M + 50); spaced(x, 0); x.textAlign = "left";
    const t = enFit(x, o.enFont, "BANGLADESH", 360, w - 2 * M - 74); x.fillStyle = GR; const tb = M + 66 + t.size * 0.74; x.fillText(t.str, M, tb);
    x.save(); x.translate(w - M - 30, M + 80); x.rotate(Math.PI / 2); x.fillStyle = GR; const tb2 = bnFit(x, o.bnFont, "বাংলাদেশ", 58, t.size * 0.9); x.fillText(tb2.str, 0, 0); x.restore();
    const sunY = Math.min(tb - t.size * 0.08, h * 0.42); x.globalCompositeOperation = "multiply"; x.fillStyle = RD; x.beginPath(); x.arc(w * 0.44, sunY, 140, 0, Math.PI * 2); x.fill(); x.globalCompositeOperation = "source-over";
    const bandY = h - M - 104, py = Math.round(sunY - 30), ph = bandY - py, pw = w - 2 * M;
    x.drawImage(vintage(o, pw, ph, 0.3), M, py);
    const r = rng(9); x.fillStyle = "#24423d"; for (let i = 0; i < 4; i++) bird(x, M + 40 + r() * 220, py - 40 + r() * 120, 9 + r() * 6, (r() - 0.5) * 0.6);
    const top = py + ph * 0.42; x.fillStyle = GR; x.beginPath(); x.moveTo(M, top); x.lineTo(M + 160, top); x.lineTo(M + 220, top + 56); x.lineTo(M + 220, bandY); x.lineTo(M, bandY); x.fill();
    x.fillStyle = "#f3ead6"; en(x, 92, 700, "Fraunces"); x.fillText(v.n, M + 24, top + 128);
    en(x, 24, 700); spaced(x, 2); x.fillText("AIR MAIL", M + 26, top + 170); x.fillStyle = "#ef5a45"; x.fillText(v.unitEn, M + 26, top + 200); spaced(x, 0);
    x.save(); x.translate(M + 168, bandY - 104); x.rotate(-0.22); x.globalAlpha = 0.88; x.strokeStyle = RD; x.fillStyle = RD;
    x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 90, 0, Math.PI * 2); x.stroke(); x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 62, 0, Math.PI * 2); x.stroke();
    en(x, 16, 800); circleText(x, ` ${o.dEn.toUpperCase()} • BANGLADESH •`, 0, 0, 70);
    x.textAlign = "center"; const dk = bnFit(x, "alinur", "ডাক", 44, 100); x.fillText(dk.str, 0, 8); num(x, 17, 700); x.fillText(o.date, 0, 34); x.restore(); x.textAlign = "left";
    x.fillStyle = GR; x.fillRect(M, bandY + 14, w - 2 * M, 80);
    x.fillStyle = "#efe5cf"; rrect(x, w / 2 - 220, bandY + 24, 440, 60, 8); x.fill();
    x.strokeStyle = "rgba(239,229,207,.5)"; x.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(M + 20, bandY + 30 + i * 12); x.lineTo(w / 2 - 240, bandY + 30 + i * 12); x.moveTo(w / 2 + 240, bandY + 30 + i * 12); x.lineTo(w - M - 20, bandY + 30 + i * 12); x.stroke(); }
    const c = D.COORDS[o.dEn]; x.fillStyle = GR; x.textAlign = "center"; num(x, 21, 600); spaced(x, 1.5);
    x.fillText(c ? `${c[0].toFixed(4)}° N, ${c[1].toFixed(4)}° E` : `${o.dEn.toUpperCase()} · BANGLADESH`, w / 2, bandY + 50);
    en(x, 14, 600); spaced(x, 3); x.fillText(o.capEn.toUpperCase().slice(0, 34), w / 2, bandY + 72); spaced(x, 0); x.textAlign = "left";
  } };

  T.engraved = { bg: "#0b0b0b", tag: "rgba(255,255,255,.55)", bn: "chayana", en: "raleway", draw(x, w, h, o) {
    const v = val(o); x.fillStyle = "#f7f4ef"; x.fillRect(0, 0, w, h);
    guilloche(x, w * 0.52, h * 0.42, "rgba(70,50,50,.07)", 3.2);
    const py = Math.round(h * 0.36), ph = h - py - M - 6, pw = w - 2 * M;
    x.drawImage(engrave(o, pw, ph, [143, 29, 29], 0.32), M, py);
    x.fillStyle = "#8f1d1d"; x.fillRect(M, h - M - 10, pw, 4);
    const r = rng(3); for (let i = 0; i < 9; i++) bird(x, M + 40 + r() * (pw - 80), h * 0.17 + r() * h * 0.32, 12 + r() * 14, (r() - 0.5) * 0.8);
    x.fillStyle = "#141414"; const e = enFit(x, o.enFont, o.dEn, 92, pw - 140, 600); x.fillText(e.str, M + 18, M + 112);
    x.fillStyle = "#8f1d1d"; const b = bnFit(x, o.bnFont, o.dBn, 64, pw - 140); x.fillText(b.str, M + 20, M + 190);
    x.textAlign = "right"; const tv = bnFit(x, "hind", v.symBn, 34, 160); x.fillText(tv.str, w - M - 14, M + 46);
    num(x, 18, 500); x.fillStyle = "#555"; x.fillText(String(o.year), w - M - 14, M + 72); x.textAlign = "left";
    x.save(); x.translate(M + 14, h * 0.8); x.rotate(-Math.PI / 2); spaced(x, 4); en(x, 17, 600); x.fillStyle = "#333"; x.fillText(o.capEn.toLowerCase(), 0, 0); spaced(x, 0); x.restore();
  } };

  T.blueink = { bg: "#e9edf3", tag: "rgba(30,45,110,.6)", bn: "chayana", en: "fraunces", draw(x, w, h, o) {
    const N = "#233483", v = val(o); x.fillStyle = "#f2f0e8"; x.fillRect(0, 0, w, h);
    x.strokeStyle = N; x.lineWidth = 3; x.strokeRect(M - 16, M - 16, w - 2 * M + 32, h - 2 * M + 32); x.lineWidth = 1.5; x.strokeRect(M + 8, M + 8, w - 2 * M - 16, h - 2 * M - 16);
    x.fillStyle = N; for (let px = M; px < w - M; px += 22) { x.save(); x.translate(px + 11, M - 4); x.rotate(Math.PI / 4); x.fillRect(-4, -4, 8, 8); x.restore(); x.save(); x.translate(px + 11, h - M + 4); x.rotate(Math.PI / 4); x.fillRect(-4, -4, 8, 8); x.restore(); }
    for (let py = M; py < h - M; py += 22) { x.save(); x.translate(M - 4, py + 11); x.rotate(Math.PI / 4); x.fillRect(-4, -4, 8, 8); x.restore(); x.save(); x.translate(w - M + 4, py + 11); x.rotate(Math.PI / 4); x.fillRect(-4, -4, 8, 8); x.restore(); }
    const r = rng(17); x.strokeStyle = "rgba(35,52,131,.16)"; x.lineWidth = 2;
    for (let i = 0; i < 9; i++) { x.beginPath(); let px = M + 20 + r() * (w - 2 * M), py = M + 30; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (r() - 0.5) * 160; py += 60; x.lineTo(clamp(px, M + 20, w - M - 20), py); } x.stroke(); }
    const ix = M + 24, iy = M + 190, iw = w - 2 * M - 48, ih = h - 2 * M - 390;
    x.drawImage(engrave(o, iw, ih, [35, 52, 131], 0.18, 5), ix, iy);
    x.fillStyle = N; const b = bnFit(x, o.bnFont, o.dBn, 70, w * 0.55); x.fillText(b.str, M + 30, M + 96);
    const e = enFit(x, o.enFont, o.dEn.toUpperCase(), 30, w * 0.5, 600); x.fillText(e.str, M + 32, M + 138);
    x.textAlign = "right"; const tv = bnFit(x, "tiro", v.symBn, 76, 260); x.fillText(tv.str, w - M - 30, M + 100); x.textAlign = "left";
    const by = iy + ih + 4; x.fillStyle = N; x.fillRect(ix, by, iw, 86);
    x.fillStyle = "#f2f0e8"; const bb = bnFit(x, o.bnFont, o.dBn, 50, iw * 0.42); x.fillText(bb.str, ix + 24, by + 60); x.textAlign = "right"; x.fillText(bb.str, ix + iw - 24, by + 60); x.textAlign = "left";
    x.fillStyle = N; x.textAlign = "center"; en(x, 26, 600, "Fraunces"); spaced(x, 2); x.fillText(o.capEn.toUpperCase(), w / 2, by + 140); spaced(x, 0);
    bnSmall(x, 26, 600); x.fillText(o.capBn, w / 2, by + 182); x.textAlign = "left";
  } };

  T.teastall = { bg: "#2c3fa0", tag: "rgba(255,255,255,.7)", bn: "alinur", en: "fraunces", draw(x, w, h, o) {
    const B = "#2c3fa0", v = val(o); x.fillStyle = "#e9e0c9"; x.fillRect(0, 0, w, h); noise(x, w, h, "#8b7b55", 2400, 12);
    x.fillStyle = B; for (let px = M; px <= w - M; px += 26) { star(x, px, M, 6); star(x, px, h - M, 6); } for (let py = M + 26; py < h - M; py += 26) { star(x, M, py, 6); star(x, w - M, py, 6); }
    x.strokeStyle = B; x.lineWidth = 1.5; x.strokeRect(M + 14, M + 14, w - 2 * M - 28, h - 2 * M - 28);
    const t = bnFit(x, o.bnFont, "বাংলাদেশ", 132, w * 0.56); x.fillStyle = B; x.fillText(t.str, M + 40, M + 160);
    const tv = bnFit(x, o.bnFont, v.symBn, 96, w * 0.26); x.textAlign = "right"; x.fillText(tv.str, w - M - 40, M + 150); x.textAlign = "center";
    x.fillStyle = "#1b1b1b"; bnSmall(x, 32, 600); x.fillText(o.capBn, w / 2, M + 232);
    const ix = M + 70, iy = M + 256, iw = w - 2 * M - 140, ih = h - M - 200 - iy;
    x.drawImage(halftone(o, iw, ih, [44, 63, 160], 7, true), ix, iy);
    en(x, 26, 500, "Fraunces"); spaced(x, 1); x.fillText(o.capEn.toUpperCase().slice(0, 32), w / 2, iy + ih + 34); spaced(x, 0);
    en(x, 60, 500, "Fraunces"); const sw = x.measureText(v.symEn).width; x.textAlign = "right"; x.fillText(v.symEn, w - M - 40, h - M - 52);
    x.textAlign = "left"; const e = enFit(x, o.enFont, "BANGLADESH", 76, w - 2 * M - 120 - sw, 500); x.fillText(e.str, M + 40, h - M - 52);
  } };

  T.dacca = { bg: "#1b2433", tag: "rgba(255,255,255,.55)", bn: "alinur", en: "fraunces", draw(x, w, h, o) {
    const R = "#a10f14", P = "#ecebd8", v = val(o), old = (D.DISTRICTS.find(d => d[0] === o.dEn) || [])[2];
    x.fillStyle = P; x.fillRect(0, 0, w, h);
    x.strokeStyle = R; x.lineWidth = 2; x.strokeRect(M + 14, M + 14, w - 2 * M - 28, h - 2 * M - 28);
    x.fillStyle = R; const l1 = enFit(x, o.enFont, o.dEn.toUpperCase(), 104, w - 2 * M - 300, 500); x.fillText(l1.str, M + 40, M + 130);
    const l2 = enFit(x, o.enFont, (old || "Bangladesh").toUpperCase(), 104, w - 2 * M - 300, 500); x.fillText(l2.str, M + 40, M + 236);
    const bx = w - M - 230; x.fillRect(bx, M + 34, 196, 220);
    x.fillStyle = P; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(bx + 26, M + 70 + i * 36, 12, 0, Math.PI * 2); x.fill(); }
    const tv = bnFit(x, o.bnFont, v.symBn, 96, 140); x.textAlign = "right"; x.fillText(tv.str, bx + 182, M + 230); x.textAlign = "left";
    const ix = M + 40, iy = M + 278, iw = w - 2 * M - 80, ih = 470;
    x.drawImage(duotone(o, iw, ih, [128, 10, 16], [246, 214, 210]), ix, iy);
    const capY = iy + ih + 20, words = o.capBn.split(" "), half = Math.ceil(words.length / 2);
    x.fillStyle = R; const c1 = bnFit(x, o.bnFont, words.slice(0, half).join(" "), 90, iw * 0.44); x.fillText(c1.str, ix, capY + 86);
    if (words.length > 1) { const c2 = bnFit(x, o.bnFont, words.slice(half).join(" "), 90, iw * 0.44); x.fillText(c2.str, ix, capY + 176); }
    const rx = ix + iw * 0.5, rw = iw * 0.5; x.fillRect(rx, capY, rw, 190);
    x.fillStyle = P; en(x, 22, 800); const cw = o.capEn.toUpperCase().split(" "); let line = "", ly = capY + 40;
    for (const wd of cw) { if (x.measureText(line + wd).width > rw - 140) { x.fillText(line.trim(), rx + 20, ly); ly += 26; line = ""; } line += wd + " "; } x.fillText(line.trim(), rx + 20, ly);
    for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(rx + rw - 90 + i * 30, capY + 34, 11, 0, Math.PI * 2); x.fill(); }
    x.fillRect(rx + 20, capY + 100, rw - 40, 2); bnSmall(x, 30, 600); x.fillText(o.capBn, rx + 20, capY + 150);
  } };

  T.revenue = { bg: "#d22f1f", tag: "rgba(248,240,214,.85)", bn: "galada", en: "archivo", draw(x, w, h, o) {
    const RD = "#d22f1f", BL = "#4b63a0", v = val(o); x.fillStyle = "#f6efd0"; x.fillRect(0, 0, w, h);
    x.fillStyle = RD; const t = bnFit(x, o.bnFont, "বাংলাদেশ", 100, w * 0.52); x.fillText(t.str, M + 20, M + 100);
    en(x, 24, 400, '"Archivo Black"'); spaced(x, 1); x.fillText("POSTAGE REVENUE", M + 24, M + 142); spaced(x, 0);
    x.textAlign = "right"; en(x, 110, 400, '"Archivo Black"'); x.fillText(v.n, w - M - 18, M + 138);
    const vw = x.measureText(v.n).width; en(x, 30, 400, '"Archivo Black"'); x.fillText(v.tk ? "TK." : "P.", w - M - 28 - vw, M + 132); x.textAlign = "left";
    x.fillStyle = BL; const e = enFit(x, o.enFont, "BANGLADESH", 104, w - 2 * M - 40); x.fillText(e.str, M + 18, M + 232);
    const px = M + 16, py = M + 262, pw = w - 2 * M - 32, ph = h - M - 16 - py;
    x.save(); rrect(x, px, py, pw, ph, 14); x.clip(); x.fillStyle = RD; x.fillRect(px, py, pw, ph); x.drawImage(halftone(o, pw, ph, [75, 99, 160], 10), px, py); x.restore();
  } };

  T.collage = { bg: "#111111", tag: "rgba(255,255,255,.5)", bn: "alinur", en: "fraunces", draw(x, w, h, o) {
    const RD = "#ee2a1e", v = val(o); x.fillStyle = "#f4f2ee"; x.fillRect(0, 0, w, h); guilloche(x, w * 0.6, h * 0.62, "rgba(0,0,0,.06)", 3);
    const fx = M + 22, fy = M + 22, fw = w - 2 * M - 44, fh = h - 2 * M - 120;
    x.save(); x.beginPath(); x.rect(fx, fy, fw, fh); x.clip(); x.drawImage(gritty(o, fw, fh), fx, fy);
    const r = rng(21); x.globalCompositeOperation = "multiply"; x.fillStyle = RD;
    x.fillRect(fx + fw * 0.52, fy + fh * 0.18, fw * 0.36, fh * 0.18); x.fillRect(fx + fw * 0.06, fy + fh * 0.72, fw * 0.3, fh * 0.12);
    x.fillRect(fx + fw * 0.7, fy + fh * 0.02, fw * 0.3, fh * 0.09); x.fillRect(fx + fw * 0.4, fy + fh * 0.52, fw * 0.22, fh * 0.2);
    x.globalCompositeOperation = "source-over"; x.fillStyle = "#0e0e0e";
    const b = bnFit(x, o.bnFont, o.dBn, 230, 99999); x.fillText(b.str, fx + fw * 0.22, fy + fh * 0.25); x.fillText(b.str, fx - fw * 0.05, fy + fh * 0.93);
    for (let i = 0; i < 5; i++) { const cx = fx + r() * fw, cy = fy + r() * fh; x.fillStyle = RD; for (let j = 0; j < 26; j++) { x.globalAlpha = 0.5 + r() * 0.5; x.beginPath(); x.arc(cx + (r() - 0.5) * 120, cy + (r() - 0.5) * 120, 1 + r() * r() * 7, 0, Math.PI * 2); x.fill(); } }
    x.globalAlpha = 1; x.strokeStyle = "rgba(238,42,30,.55)"; x.lineWidth = 1.3;
    [0.33, 0.66].forEach(t => { x.beginPath(); x.moveTo(fx + fw * t, fy); x.lineTo(fx + fw * t, fy + fh); x.stroke(); });
    [0.25, 0.75].forEach(t => { x.beginPath(); x.moveTo(fx, fy + fh * t); x.lineTo(fx + fw, fy + fh * t); x.stroke(); });
    x.restore(); x.strokeStyle = RD; x.lineWidth = 2; x.strokeRect(fx - 10, fy - 10, fw + 20, fh + 20);
    const by = h - M - 36; x.fillStyle = "#141414"; const e = enFit(x, o.enFont, o.dEn.toUpperCase() + " | BANGLADESH", 44, fw - 170, 500); x.fillText(o.dEn.toUpperCase(), M + 30, by); e.str = o.dEn.toUpperCase();
    const cw = x.measureText(e.str + " ").width; x.fillStyle = RD; x.fillText("|", M + 30 + cw, by); const bw = x.measureText("| ").width;
    x.fillStyle = "#141414"; x.fillText("BANGLADESH", M + 30 + cw + bw, by);
    x.textAlign = "right"; const tv = bnFit(x, "hind", v.symBn, 44, 160); x.fillText(tv.str, w - M - 30, by); x.textAlign = "left";
  } };

  /* ---------- public API ---------- */
  function resolve(opts) {
    const o = Object.assign({ template: "classic", zoom: 1, posY: 0, ink: 1.1, district: 13, value: [10, "tk"], caption: 0, capEn: null, capBn: null,
      bnFont: "auto", enFont: "auto", colour: "terracotta", postmark: false, height: 1350, hashtag: "#DaakBD" }, opts);
    const t = T[o.template] || T.classic, d = D.DISTRICTS[o.district] || D.DISTRICTS[13], cap = D.CAPTIONS[o.caption] || D.CAPTIONS[0];
    o.dEn = d[0]; o.dBn = d[1];
    o.capEn = o.capEn != null && o.capEn !== "" ? o.capEn : cap[0]; o.capBn = o.capBn != null && o.capBn !== "" ? o.capBn : cap[1];
    o.bnFont = o.bnFont === "auto" ? t.bn : o.bnFont; o.enFont = o.enFont === "auto" ? t.en : o.enFont;
    o.colour = (D.COLOURS[o.colour] || D.COLOURS.terracotta)[0];
    const n = new Date(); o.year = o.year || n.getFullYear();
    o.date = o.date || [n.getDate(), n.getMonth() + 1, n.getFullYear() % 100].map(v => String(v).padStart(2, "0")).join(".");
    o._t = t; return o;
  }

  /** The stamp alone (perforated, transparent around the edge), 840×1060. */
  function stamp(opts) {
    const o = resolve(opts), S = mk(SW, SH), x = S.getContext("2d");
    x.textBaseline = "alphabetic"; o._t.draw(x, SW, SH, o); if (o.postmark) postmark(x, SW, SH, o); punch(S, 15); return S;
  }

  /** The full share picture: background + stamp + hashtag. */
  function render(canvas, opts) {
    const o = resolve(opts), W = 1080, H = o.height, ctx = canvas.getContext("2d"), t = o._t;
    canvas.width = W; canvas.height = H;
    ctx.fillStyle = t.bg; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, H * 0.8); g.addColorStop(0, "rgba(255,255,255,.06)"); g.addColorStop(1, "rgba(0,0,0,.3)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    noise(ctx, W, H, "#ffffff", 1500, 13);
    const S = stamp(opts), ox = (W - SW) / 2, oy = Math.round((H - SH) / 2) - 20;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 46; ctx.shadowOffsetY = 18; ctx.drawImage(S, ox, oy); ctx.restore();
    if (o.hashtag) { ctx.fillStyle = t.tag; ctx.textAlign = "center"; ctx.font = `700 26px Raleway, sans-serif`; ctx.fillText(o.hashtag, W / 2, oy + SH + (H - oy - SH) / 2 + 10); ctx.textAlign = "left"; }
    return { canvas, stamp: S };
  }

  /** 512×512 transparent sticker. */
  function sticker(opts, S) {
    S = S || stamp(opts); const c = mk(512, 512), x = c.getContext("2d"), s = Math.min(470 / SW, 470 / SH);
    x.save(); x.translate(256, 256); x.rotate(-0.05); x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 14; x.shadowOffsetY = 6;
    x.drawImage(S, -SW * s / 2, -SH * s / 2, SW * s, SH * s); x.restore(); return c;
  }

  /** Placeholder portrait so the preview never starts empty. */
  function makeSample() {
    const c = mk(800, 1000), x = c.getContext("2d");
    let g = x.createLinearGradient(0, 0, 0, 1000); g.addColorStop(0, "#f2d9b8"); g.addColorStop(0.55, "#c9dde3"); g.addColorStop(1, "#7f9aa4"); x.fillStyle = g; x.fillRect(0, 0, 800, 1000);
    x.fillStyle = "#e8a64c"; x.beginPath(); x.arc(600, 230, 110, 0, Math.PI * 2); x.fill();
    x.fillStyle = "#5f7c6a"; x.beginPath(); x.moveTo(0, 640); for (let i = 0; i <= 8; i++) x.lineTo(i * 100, 600 - Math.sin(i * 1.3) * 60); x.lineTo(800, 1000); x.lineTo(0, 1000); x.fill();
    x.fillStyle = "#3d6e86"; x.fillRect(0, 760, 800, 240);
    x.fillStyle = "#3a2a20"; x.beginPath(); x.moveTo(170, 800); x.quadraticCurveTo(400, 860, 640, 800); x.lineTo(600, 850); x.quadraticCurveTo(400, 890, 210, 850); x.fill();
    x.fillStyle = "#b8873f"; x.beginPath(); x.ellipse(400, 790, 150, 70, 0, Math.PI, 0); x.fill();
    x.strokeStyle = "#7a5524"; x.lineWidth = 4; for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(400, 790, 30 + i * 14, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); }
    x.strokeStyle = "#2b1d14"; x.lineWidth = 7; x.beginPath(); x.moveTo(540, 680); x.lineTo(660, 880); x.stroke();
    x.fillStyle = "#2b1d14"; x.beginPath(); x.arc(520, 650, 22, 0, Math.PI * 2); x.fill(); x.fillRect(506, 670, 30, 90);
    x.fillStyle = "#1f2b33"; [[140, 160], [190, 140], [230, 175]].forEach(([bx, by]) => bird(x, bx, by, 16, 0.1));
    return c;
  }

  root.DaakStamp = { stamp, render, sticker, makeSample, bronze, bnFit, enFit, postmark, punch, mk, rng, noise, circleText, SW, SH, TEMPLATES: Object.keys(T) };
})(typeof window !== "undefined" ? window : globalThis);
