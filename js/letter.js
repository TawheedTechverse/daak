/* Daak — letter (চিঠি): builds 16:9 pages on canvas and packs them into a PDF.
 * Needs: bijoy.js, data.js, engine.js, and jsPDF (window.jspdf) for the PDF. */
(function (root) {
  "use strict";
  const S = root.DaakStamp, toBijoy = root.toBijoy, bnD = root.DaakData.toBnDigits;
  const W = 1600, H = 900;
  const HAND = { bn: { f: "Atma", w: 500, size: 40, line: 62 }, en: { f: "Caveat", w: 500, size: 54, line: 62 } };
  const LABELS = {
    en: { sender: "Sender", receiver: "Receiver", sub: "(Name, Address)", dear: n => `Dear ${n},`, bye: "With love,", from: "From" },
    bn: { sender: "প্রেরক", receiver: "প্রাপক", sub: "(নাম, ঠিকানা)", dear: n => `প্রিয় ${n},`, bye: "ইতি,", from: "প্রেরক" }
  };

  const hand = (x, lang, size, w) => { const h = HAND[lang]; x.font = `${w || h.w} ${size || h.size}px ${h.f}, "Hind Siliguri", cursive`; };
  function label(x, lang, text, size, color) {
    x.fillStyle = color;
    if (lang === "bn") { x.font = `${size}px "Li Chayana Teesta", "Hind Siliguri", sans-serif`; x.fillText(toBijoy(text), 0, 0); return x.measureText(toBijoy(text)).width; }
    x.font = `700 ${size * 0.82}px Raleway, sans-serif`; if ("letterSpacing" in x) x.letterSpacing = "2px"; x.fillText(text.toUpperCase(), 0, 0); const wd = x.measureText(text.toUpperCase()).width; if ("letterSpacing" in x) x.letterSpacing = "0px"; return wd;
  }
  function wrap(x, text, maxW) {
    const out = [];
    String(text || "").split(/\n/).forEach((para, pi, arr) => {
      const words = para.split(/\s+/).filter(Boolean); let line = "";
      if (!words.length) { out.push(""); return; }
      for (const wd of words) { const t = line ? line + " " + wd : wd; if (x.measureText(t).width > maxW && line) { out.push(line); line = wd; } else line = t; }
      out.push(line);
    });
    return out;
  }

  function desk(x) {
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#1d4638"); g.addColorStop(1, "#102a22"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    S.noise(x, W, H, "#ffffff", 2600, 31);
    const v = x.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 950); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.45)"); x.fillStyle = v; x.fillRect(0, 0, W, H);
  }
  function envelope(x, X, Y, w, h, stripes) {
    x.save(); x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 40; x.shadowOffsetY = 18; x.fillStyle = "#e7d2a9"; x.fillRect(X, Y, w, h); x.restore();
    x.save(); x.beginPath(); x.rect(X, Y, w, h); x.clip(); S.noise(x, W, H, "#8b6a3a", 3500, 41);
    if (stripes) {
      const sw = 34, band = 22;
      for (let i = -2, k = 0; i * sw < w + h; i++, k++) {
        x.fillStyle = k % 2 ? "#2f4fa3" : "#cf3b2a";
        [[X + i * sw, Y], [X + i * sw, Y + h - band]].forEach(([px, py]) => { x.beginPath(); x.moveTo(px, py); x.lineTo(px + sw * 0.5, py); x.lineTo(px + sw * 0.5 + band, py + band); x.lineTo(px + band, py + band); x.fill(); });
      }
      for (let j = 0, k = 0; j * sw < h; j++, k++) {
        x.fillStyle = k % 2 ? "#2f4fa3" : "#cf3b2a";
        [[X, Y + j * sw], [X + w - band, Y + j * sw]].forEach(([px, py]) => { x.beginPath(); x.moveTo(px, py); x.lineTo(px + band, py + band); x.lineTo(px + band, py + band + sw * 0.5); x.lineTo(px, py + sw * 0.5); x.fill(); });
      }
    }
    x.restore();
  }

  /* ---------- the seal ---------- */
  function seal(x, cx, cy, R, photo, ring) {
    x.save();
    // wax blob
    x.shadowColor = "rgba(40,20,5,.55)"; x.shadowBlur = 24; x.shadowOffsetY = 10;
    const r = S.rng(77); x.beginPath();
    for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, rr = R * (1.16 + (r() - 0.5) * 0.09); i ? x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : x.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    x.closePath(); const wax = x.createRadialGradient(cx - R * 0.4, cy - R * 0.4, R * 0.2, cx, cy, R * 1.2); wax.addColorStop(0, "#9a6a35"); wax.addColorStop(1, "#4d2c10"); x.fillStyle = wax; x.fill();
    x.shadowColor = "transparent";
    // metal disc
    const g = x.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, "#f2cf8f"); g.addColorStop(0.35, "#b97c3a"); g.addColorStop(0.65, "#7a4b1d"); g.addColorStop(1, "#d9a660");
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "rgba(60,32,10,.7)"; x.lineWidth = 2; for (let i = 0; i < 120; i++) { const a = i / 120 * Math.PI * 2; x.beginPath(); x.moveTo(cx + Math.cos(a) * R * 0.94, cy + Math.sin(a) * R * 0.94); x.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); x.stroke(); }
    // ring text
    x.fillStyle = "#4a2a0e"; x.font = `800 ${Math.round(R * 0.13)}px Raleway, sans-serif`; S.circleText(x, ring, cx, cy, R * 0.8);
    // portrait
    const pr = Math.round(R * 0.66), b = S.bronze(photo, pr * 2);
    x.save(); x.beginPath(); x.arc(cx, cy, pr, 0, Math.PI * 2); x.clip(); x.drawImage(b, cx - pr, cy - pr);
    const ig = x.createRadialGradient(cx, cy, pr * 0.6, cx, cy, pr); ig.addColorStop(0, "rgba(0,0,0,0)"); ig.addColorStop(1, "rgba(40,20,5,.55)"); x.fillStyle = ig; x.fillRect(cx - pr, cy - pr, pr * 2, pr * 2); x.restore();
    x.lineWidth = 5; x.strokeStyle = "#e8c07c"; x.beginPath(); x.arc(cx, cy, pr + 3, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 2; x.strokeStyle = "#5a3412"; x.beginPath(); x.arc(cx, cy, pr + 7, 0, Math.PI * 2); x.stroke();
    const shine = x.createLinearGradient(cx - R, cy - R, cx, cy); shine.addColorStop(0, "rgba(255,240,210,.35)"); shine.addColorStop(1, "rgba(255,240,210,0)"); x.fillStyle = shine; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill();
    x.restore();
  }

  /* ---------- pages ---------- */
  function pageEnvelopeBack(o) {
    const c = S.mk(W, H), x = c.getContext("2d"); desk(x);
    const X = 150, Y = 110, w = 1300, h = 680, tipY = Y + h * 0.56; envelope(x, X, Y, w, h, false);
    x.strokeStyle = "rgba(110,80,40,.35)"; x.lineWidth = 2; x.beginPath(); x.moveTo(X, Y + h); x.lineTo(X + w / 2, Y + h * 0.5); x.lineTo(X + w, Y + h); x.stroke();
    x.save(); x.shadowColor = "rgba(60,40,10,.35)"; x.shadowBlur = 18; x.shadowOffsetY = 6;
    x.fillStyle = "#eedcb6"; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + w, Y); x.lineTo(X + w / 2, tipY); x.closePath(); x.fill(); x.restore();
    x.save(); x.beginPath(); x.moveTo(X, Y); x.lineTo(X + w, Y); x.lineTo(X + w / 2, tipY); x.closePath(); x.clip(); S.noise(x, W, H, "#8b6a3a", 1800, 43); x.restore();
    const first = (o.sender.name || "DAAK").split(/\s+/)[0];
    const ring = /^[\x20-\x7E]+$/.test(first) ? ` DAAK • ${first.toUpperCase().slice(0, 14)} • ` : " DAAK • SEALED WITH LOVE • ";
    seal(x, X + w / 2, tipY - 10, 128, o.sealPhoto, ring);
    x.save(); x.translate(X + 70, Y + h - 70); hand(x, o.lang, 38); x.fillStyle = "#3a2a1a";
    if (o.sender.name) x.fillText(`${LABELS[o.lang].from}: ${o.sender.name}`, 0, 0); x.restore();
    x.save(); x.translate(X + w - 70, Y + h - 70); x.textAlign = "right"; x.fillStyle = "rgba(90,60,25,.6)"; x.font = `800 22px Raleway, sans-serif`; if ("letterSpacing" in x) x.letterSpacing = "6px"; x.fillText("DAAK", 0, 0); x.restore();
    return c;
  }

  function letterPages(o) {
    const L = LABELS[o.lang], meas = S.mk(10, 10).getContext("2d"); hand(meas, o.lang);
    const X = 170, Y = 50, w = 1260, h = 800, left = X + 150, right = X + w - 90, top = Y + 200, lh = HAND[o.lang].line;
    const rows = Math.floor((Y + h - 80 - top) / lh) + 1;
    const body = wrap(meas, o.message, right - left);
    const lines = [{ t: L.dear(o.receiver.name || "…"), indent: 0 }, ...body.map(t => ({ t, indent: 0 })), { t: "" }, { t: L.bye, indent: 420 }, { t: o.sender.name || "", indent: 460 }];
    const pages = []; for (let i = 0; i < lines.length; i += rows) pages.push(lines.slice(i, i + rows));
    return pages.map((ls, pi) => {
      const c = S.mk(W, H), x = c.getContext("2d"); desk(x);
      x.save(); x.shadowColor = "rgba(0,0,0,.45)"; x.shadowBlur = 36; x.shadowOffsetY = 14; x.fillStyle = "#fbf6ea"; x.fillRect(X, Y, w, h); x.restore();
      x.save(); x.beginPath(); x.rect(X, Y, w, h); x.clip(); S.noise(x, W, H, "#a89060", 2200, 50 + pi);
      x.strokeStyle = "rgba(60,100,180,.28)"; x.lineWidth = 1.5; for (let r = 0; r < rows; r++) { const yy = top + r * lh + 12; x.beginPath(); x.moveTo(X + 30, yy); x.lineTo(X + w - 30, yy); x.stroke(); }
      x.strokeStyle = "rgba(210,60,50,.5)"; x.beginPath(); x.moveTo(X + 120, Y); x.lineTo(X + 120, Y + h); x.stroke(); x.restore();
      x.fillStyle = "#c8382a"; x.font = `64px "Li Alinur Nanggala", "Hind Siliguri", serif`; x.fillText(toBijoy("ডাক"), X + 150, Y + 96);
      x.font = `800 18px Raleway, sans-serif`; if ("letterSpacing" in x) x.letterSpacing = "6px"; x.fillStyle = "#6b5a40"; x.fillText("DAAK", X + 154, Y + 126); if ("letterSpacing" in x) x.letterSpacing = "0px";
      x.textAlign = "right"; hand(x, o.lang, HAND[o.lang].size * 0.85); x.fillStyle = "#2a3a6a"; x.fillText(o.lang === "bn" ? bnD(o.date) : o.date, right, Y + 110); x.textAlign = "left";
      hand(x, o.lang); x.fillStyle = "#1f2f63";
      ls.forEach((ln, i) => x.fillText(ln.t, left + (ln.indent || 0), top + i * lh));
      x.textAlign = "center"; x.font = `500 20px "Hind Siliguri", sans-serif`; x.fillStyle = "#8a7a5a";
      x.fillText(o.lang === "bn" ? `${bnD(pi + 1)} / ${bnD(pages.length)}` : `${pi + 1} / ${pages.length}`, X + w / 2, Y + h - 26); x.textAlign = "left";
      return c;
    });
  }

  function pageEnvelopeFront(o) {
    const c = S.mk(W, H), x = c.getContext("2d"), L = LABELS[o.lang]; desk(x);
    const X = 150, Y = 110, w = 1300, h = 680; envelope(x, X, Y, w, h, true);
    // stamp, top right
    const sw = 210, sh = sw * S.SH / S.SW, sx = X + w - sw - 70, sy = Y + 50;
    x.save(); x.translate(sx + sw / 2, sy + sh / 2); x.rotate(0.035); x.shadowColor = "rgba(0,0,0,.3)"; x.shadowBlur = 10; x.shadowOffsetY = 4;
    x.drawImage(o.stamp, -sw / 2, -sh / 2, sw, sh); x.restore();
    // cancellation over the stamp's left edge
    const pcx = sx - 10, pcy = sy + 110, ink = "rgba(25,30,60,.75)"; x.save(); x.strokeStyle = ink; x.fillStyle = ink;
    x.lineWidth = 3; x.beginPath(); x.arc(pcx, pcy, 72, 0, Math.PI * 2); x.stroke(); x.lineWidth = 1.5; x.beginPath(); x.arc(pcx, pcy, 50, 0, Math.PI * 2); x.stroke();
    x.font = `800 15px Raleway, sans-serif`; S.circleText(x, ` ${o.district.toUpperCase()} • DAAK •`, pcx, pcy, 57);
    x.textAlign = "center"; x.font = `700 18px "Hind Siliguri", sans-serif`; x.fillText(o.date, pcx, pcy + 7);
    x.lineWidth = 3; for (let i = 0; i < 4; i++) { x.beginPath(); for (let qx = pcx + 80; qx <= sx + sw + 30; qx += 5) { const qy = pcy - 45 + i * 30 + Math.sin(qx / 22) * 6; qx === pcx + 80 ? x.moveTo(qx, qy) : x.lineTo(qx, qy); } x.stroke(); }
    x.restore();
    // sender, top left
    x.save(); x.translate(X + 80, Y + 110); const lw = label(x, o.lang, L.sender, 40, "#8a2a1f");
    x.font = `500 22px ${o.lang === "bn" ? '"Hind Siliguri"' : "Raleway"}, sans-serif`; x.fillStyle = "#8a6a4a"; x.fillText(L.sub, lw + 14, 0); x.restore();
    hand(x, o.lang, HAND[o.lang].size * 0.95); x.fillStyle = "#1f2f63"; x.fillText(o.sender.name || "", X + 80, Y + 172);
    hand(x, o.lang, HAND[o.lang].size * 0.72); wrap(x, o.sender.addr, 520).slice(0, 4).forEach((t, i) => x.fillText(t, X + 80, Y + 222 + i * 44));
    // receiver, lower right
    const rx = X + w * 0.42, ry = Y + h * 0.5;
    x.save(); x.translate(rx, ry); const rw = label(x, o.lang, L.receiver, 46, "#8a2a1f");
    x.font = `500 24px ${o.lang === "bn" ? '"Hind Siliguri"' : "Raleway"}, sans-serif`; x.fillStyle = "#8a6a4a"; x.fillText(L.sub, rw + 14, 0); x.restore();
    x.strokeStyle = "rgba(90,60,25,.35)"; x.lineWidth = 1.5; for (let i = 0; i < 4; i++) { const yy = ry + 78 + i * 58; x.beginPath(); x.moveTo(rx, yy); x.lineTo(X + w - 80, yy); x.stroke(); }
    hand(x, o.lang, HAND[o.lang].size * 1.15); x.fillStyle = "#1f2f63"; x.fillText(o.receiver.name || "", rx + 6, ry + 68);
    hand(x, o.lang, HAND[o.lang].size * 0.85); wrap(x, o.receiver.addr, X + w - 100 - rx).slice(0, 3).forEach((t, i) => x.fillText(t, rx + 6, ry + 126 + i * 58));
    return c;
  }

  /** All pages: envelope back with seal, letter pages, envelope front with stamp. */
  function pages(opts) {
    const n = new Date();
    const o = Object.assign({ lang: "en", message: "", sender: {}, receiver: {}, district: "Dhaka",
      date: [n.getDate(), n.getMonth() + 1, n.getFullYear()].map(v => String(v).padStart(2, "0")).join(".") }, opts);
    return [pageEnvelopeBack(o), ...letterPages(o), pageEnvelopeFront(o)];
  }

  /** Pack canvases into a 16:9 PDF Blob (1600×900 pt pages). */
  function pdf(canvases) {
    const { jsPDF } = root.jspdf; const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: [W, H], compress: true });
    canvases.forEach((c, i) => { if (i) doc.addPage([W, H], "landscape"); doc.addImage(c.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, W, H); });
    return doc.output("blob");
  }

  root.DaakLetter = { pages, pdf, W, H };
})(typeof window !== "undefined" ? window : globalThis);
