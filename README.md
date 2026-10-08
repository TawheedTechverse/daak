# Daak (ডাক) — Bangladeshi stamp & letter maker

A fun web app: upload a photo, turn it into a Bangladeshi postage stamp, then send it on a letter as a 16:9 PDF. Everything runs in the browser. There is no server, no API key, and photos never leave the device.

Run it: open `index.html`, or `npx serve .` and open the link. Deploy: push the folder to GitHub and import it in Vercel (static site, no build step).

## Pages

1. **Stamp maker / ডাকটিকিট.** Live preview, photo upload, ten templates with live thumbnails, and dropdowns for district (all 64), value (taka / poisha), caption, Bangla lettering, English lettering and ink colour. There's an optional postmark and zoom, position and ink sliders. It saves as **PNG**, **JPG** or a **512×512 transparent WebP sticker**, in post (4:5) or story (9:16) size, and can share on phones.
2. **Letter / চিঠি.** Pick the letter language (বাংলা / English) and choose a seal photo (the stamp photo or a different one). Write the message, sender and receiver. It builds a PDF:
   - Page 1: envelope back with a bronze medallion seal made from the photo.
   - Middle pages: the letter on ruled paper in handwriting (Atma for Bangla, Caveat for English). It splits onto more pages automatically.
   - Last page: envelope front with airmail border, Sender/প্রেরক and Receiver/প্রাপক (Name, Address), and the stamp attached top-right with a postmark.

The **ENG / বাংলা** toggle switches the whole interface. English uses Raleway everywhere; Bangla uses Li Chayana Teesta (text) and Li Alinur Nanggala (headings, logo, splash). The splash sticks a stamp on the page and types ডাক, then DAAK.

## Files

| Path | What it does |
|---|---|
| `index.html` | Markup for the splash, header, both pages |
| `css/style.css` | Styles, light/dark theme, splash animation |
| `js/bijoy.js` | `toBijoy()`: Unicode Bangla → Bijoy ANSI (see note below) |
| `js/data.js` | Districts, values, captions, colours, fonts, templates, all UI text (EN + BN) |
| `js/engine.js` | `DaakStamp`: the ten stamp templates, photo effects, sticker, sample photo |
| `js/letter.js` | `DaakLetter`: envelope, seal, letter pages, PDF |
| `js/app.js` | Wires the page together |
| `fonts/` | Self-hosted fonts + `fonts.css` |
| `vendor/jspdf.umd.min.js` | jsPDF 2.5.1 for the PDF |

## Important: the Li fonts are ANSI (Bijoy) fonts

`Li Alinur Nanggala 402 ANSI` and `Li Chayana Teesta ANSI` have **no Unicode Bangla characters**. Their Bangla letters sit on Latin code points (Bijoy layout). Typing normal Bangla in them shows boxes or English letters. So:

- Every Bangla string drawn in these fonts goes through `toBijoy()` first (UI labels, splash, logo, stamp lettering, letter labels).
- In Bangla mode the page shows the converted text visually and keeps the real Unicode in a hidden span, so screen readers and copy/search still work.
- Input boxes, dropdowns and typed messages use Hind Siliguri / Atma (Unicode), because what people type is Unicode.
- If you get the **Unicode versions** of these Li fonts later, drop them in `fonts/`, set `ansi: false` for them in `js/data.js`, and stop converting in `app.js` (`setText`) and `letter.js` (`label`).

The converter covers common conjuncts, reph, ya/ra/ba-phala and kar reordering. A rare conjunct that isn't in its table shows with a visible hasanta; add it to `CONJ` in `bijoy.js`.

## Adding a template

Add an entry to `T` in `js/engine.js`: `{ bg, tag, bn, en, draw(ctx, w, h, o) }`. The stamp is 840×1060; keep content 46px in from the edge so the perforations don't cut it. Then add `[id, "English name", "বাংলা নাম"]` to `TEMPLATES` in `data.js`.

## Engine API

```js
DaakStamp.render(canvas, opts)   // full share picture (1080 × 1350 or 1920)
DaakStamp.stamp(opts)            // stamp only, transparent perforations, 840×1060
DaakStamp.sticker(opts)          // 512×512 transparent
DaakLetter.pages(letterOpts)     // array of 1600×900 canvases
DaakLetter.pdf(canvases)         // PDF Blob
```
`opts`: `{ photo, template, district (index), value: [n, "tk"|"p"], caption (index) or capEn/capBn, bnFont, enFont, colour, postmark, zoom, posY, ink, height }`.
