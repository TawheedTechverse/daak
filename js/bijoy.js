/*!
 * Unicode Bangla -> Bijoy (ANSI) converter for Li "ANSI" fonts
 * (Li Alinur Nanggala, Li Chayana Teesta). These fonts map Bangla glyphs onto
 * Latin code points, so Unicode text must be converted before it is drawn.
 * Latin letters, digits written as 0-9, and punctuation outside Bangla are
 * passed through untouched only when `keepLatin` is true (default false).
 */
(function (root) {
  "use strict";

  const CONS = "কখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়ৎ";
  const HAS = "্";

  const SINGLE = {
    "অ": "A", "আ": "Av", "ই": "B", "ঈ": "C", "উ": "D", "ঊ": "E", "ঋ": "F", "এ": "G", "ঐ": "H", "ও": "I", "ঔ": "J",
    "ক": "K", "খ": "L", "গ": "M", "ঘ": "N", "ঙ": "O", "চ": "P", "ছ": "Q", "জ": "R", "ঝ": "S", "ঞ": "T",
    "ট": "U", "ঠ": "V", "ড": "W", "ঢ": "X", "ণ": "Y", "ত": "Z", "থ": "_", "দ": "`", "ধ": "a", "ন": "b",
    "প": "c", "ফ": "d", "ব": "e", "ভ": "f", "ম": "g", "য": "h", "র": "i", "ল": "j", "শ": "k", "ষ": "l",
    "স": "m", "হ": "n", "ড়": "o", "ঢ়": "p", "য়": "q", "ৎ": "r", "ং": "s", "ঃ": "t", "ঁ": "u",
    "া": "v", "ি": "w", "ী": "x", "ু": "y", "ূ": "~", "ৃ": "…", "ে": "‡", "ৈ": "‰", "ৗ": "Š",
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
    "৳": "$", "।": "|", "্": "&"
  };

  // Conjuncts (Unicode consonant sequence -> Bijoy). Longest match wins.
  const CONJ = {
    "ক্ষ্ম": "²", "ক্ক": "°", "ক্ট": "±", "ক্ত": "³", "ক্ম": "´", "ক্র": "µ", "ক্ষ": "¶", "ক্স": "·",
    "গ্গ": "¹", "গ্দ": "º", "গ্ধ": "»", "ঙ্ক": "¼", "ঙ্গ": "½", "জ্জ": "¾", "জ্ঝ": "À", "জ্ঞ": "Á",
    "ঞ্চ": "Â", "ঞ্ছ": "Ã", "ঞ্জ": "Ä", "ঞ্ঝ": "Å", "ট্ট": "Æ", "ড্ড": "Ç", "ণ্ট": "È", "ণ্ঠ": "É",
    "ণ্ড": "Ê", "ত্ত": "Ë", "ত্থ": "Ì", "ত্র": "Î", "দ্দ": "Ï", "দ্ধ": "×", "দ্ব": "Ø", "দ্ম": "Ù",
    "ন্ঠ": "Ú", "ন্ড": "Û", "ন্ধ": "Ü", "প্ট": "Ý", "প্ত": "Þ", "প্প": "ß", "প্স": "à", "ব্জ": "á",
    "ব্দ": "â", "ব্ধ": "ã", "ভ্র": "ä", "ম্ন": "å", "ম্ফ": "æ", "ল্ক": "é", "ল্গ": "ê", "ল্ট": "ë",
    "ল্ড": "ì", "ল্প": "í", "ল্ফ": "î", "শ্চ": "ð", "শ্ছ": "ñ", "ষ্ণ": "ò", "ষ্ট": "ó", "ষ্ঠ": "ô",
    "ষ্ফ": "õ", "স্খ": "ö", "স্ট": "÷", "স্ফ": "ù", "হ্ম": "þ",
    "ন্ত": "šÍ", "স্ত": "¯Í", "ন্ত্র": "š¿", "স্থ": "¯’", "ন্থ": "š’", "স্ক": "¯‹", "স্প": "¯c", "স্ন": "¯œ",
    "স্ম": "¯§", "স্ল": "¯ø", "ন্দ": "›`", "ন্ন": "bœ", "ন্ম": "b¥", "ম্ব": "¤^", "ম্প": "¤c", "ম্ভ": "¤¢",
    "ম্ম": "¤§", "ঙ্ঘ": "•N", "ঙ্খ": "•L", "ত্ম": "Ü¥", "ল্ল": "jø", "চ্চ": "”P", "চ্ছ": "”Q", "জ্ব": "R¡",
    "দ্ভ": "™¢", "ব্ব": "eŸ", "ক্ব": "K¡", "ট্ব": "U¡", "শ্ব": "k¦", "স্ব": "¯^", "হ্ব": "nŸ", "ত্ব": "Z¡",
    "ষ্ক": "®‹", "ষ্প": "®c", "ষ্ম": "®§", "গ্ন": "Mœ", "ন্ট": "›U", "প্ল": "c­", "ক্ল": "K¬", "গ্ল": "M­",
    "ব্ল": "e­", "ম্ল": "¤­", "শ্ল": "k­", "ফ্ল": "d¬", "ত্ন": "Zœ", "দ্ঘ": "`&N"
  };
  // Consonant + u/uu/ri forms
  const SPECIAL_KAR = { "গু": "¸", "শু": "ï", "হু": "û", "হৃ": "ü", "রু": "i“", "রূ": "i‚", "ত্রু": "Î“" };
  const PRE = { "ি": "w", "ে": "‡", "ৈ": "‰" };

  const isC = ch => CONS.indexOf(ch) >= 0;
  const KEYS = Object.keys(CONJ).sort((a, b) => b.length - a.length);

  function convSeq(seq) {
    // seq: string of consonants joined by hasanta (may end with ্য / ্র phala)
    let out = "", i = 0;
    while (i < seq.length) {
      let hit = null;
      for (const k of KEYS) if (seq.startsWith(k, i)) { hit = k; break; }
      if (hit) { out += CONJ[hit]; i += hit.length; continue; }
      const ch = seq[i];
      if (ch === HAS) {
        const nx = seq[i + 1];
        if (nx === "য") { out += "¨"; i += 2; continue; }
        if (nx === "র") { out += "ª"; i += 2; continue; }
        if (nx === "ব") { out += "¡"; i += 2; continue; }
        out += "&"; i++; continue;
      }
      out += SINGLE[ch] !== undefined ? SINGLE[ch] : ch; i++;
    }
    return out;
  }

  function toBijoy(text, keepLatin) {
    const ch_ = c => String.fromCharCode(c), re_ = (...c) => new RegExp(c.map(ch_).join(""), "g");
    const s = String(text || "").normalize("NFC").replace(re_(0x9CB), ch_(0x9C7) + ch_(0x9BE)).replace(re_(0x9CC), ch_(0x9C7) + ch_(0x9D7)).replace(re_(0x9AF, 0x9BC), ch_(0x9DF)).replace(re_(0x9A1, 0x9BC), ch_(0x9DC)).replace(re_(0x9A2, 0x9BC), ch_(0x9DD)).replace(/[\u200C\u200D]/g, "");
    let out = "", i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (!isC(ch)) {
        if (SINGLE[ch] !== undefined) out += SINGLE[ch];
        else out += (keepLatin || !/[A-Za-z]/.test(ch)) ? ch : ch;
        i++; continue;
      }
      // reph: র্ + consonant
      let reph = false;
      if (ch === "র" && s[i + 1] === HAS && isC(s[i + 2])) { reph = true; i += 2; }
      // consonant cluster
      let j = i + 1;
      while (s[j] === HAS && isC(s[j + 1])) j += 2;
      let seq = s.slice(i, j);
      let k = j, pre = "", post = "";
      const kar = s[k];
      if (PRE[kar]) {
        pre = PRE[kar]; k++;
        if (kar === "ে" && s[k] === "া") { post = "v"; k++; }
        else if (kar === "ে" && s[k] === "ৗ") { post = "Š"; k++; }
      } else if (kar && "াীুূৃৗ".indexOf(kar) >= 0) {
        const sp = SPECIAL_KAR[seq + kar];
        if (sp) { seq = null; post = sp; } else post = SINGLE[kar];
        k++;
      }
      let marks = "";
      while (s[k] && "ঁংঃ".indexOf(s[k]) >= 0) { marks += SINGLE[s[k]]; k++; }
      out += pre + (seq === null ? "" : convSeq(seq)) + post + (reph ? "©" : "") + marks;
      i = k;
    }
    return out;
  }

  root.toBijoy = toBijoy;
  if (typeof module !== "undefined" && module.exports) module.exports = { toBijoy };
})(typeof window !== "undefined" ? window : globalThis);
