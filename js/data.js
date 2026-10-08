/* Daak — data: districts, values, captions, colours, lettering, UI text */
(function (root) {
  "use strict";

  // 64 districts: [English, Bangla, old English spelling or ""]
  const DISTRICTS = [
    ["Bagerhat", "বাগেরহাট", ""], ["Bandarban", "বান্দরবান", ""], ["Barguna", "বরগুনা", ""], ["Barishal", "বরিশাল", "Barisal"],
    ["Bhola", "ভোলা", ""], ["Bogura", "বগুড়া", "Bogra"], ["Brahmanbaria", "ব্রাহ্মণবাড়িয়া", ""], ["Chandpur", "চাঁদপুর", ""],
    ["Chapai Nawabganj", "চাঁপাইনবাবগঞ্জ", ""], ["Chattogram", "চট্টগ্রাম", "Chittagong"], ["Chuadanga", "চুয়াডাঙ্গা", ""],
    ["Cox's Bazar", "কক্সবাজার", ""], ["Cumilla", "কুমিল্লা", "Comilla"], ["Dhaka", "ঢাকা", "Dacca"], ["Dinajpur", "দিনাজপুর", ""],
    ["Faridpur", "ফরিদপুর", ""], ["Feni", "ফেনী", ""], ["Gaibandha", "গাইবান্ধা", ""], ["Gazipur", "গাজীপুর", ""],
    ["Gopalganj", "গোপালগঞ্জ", ""], ["Habiganj", "হবিগঞ্জ", ""], ["Jamalpur", "জামালপুর", ""], ["Jashore", "যশোর", "Jessore"],
    ["Jhalokati", "ঝালকাঠি", ""], ["Jhenaidah", "ঝিনাইদহ", ""], ["Joypurhat", "জয়পুরহাট", ""], ["Khagrachhari", "খাগড়াছড়ি", ""],
    ["Khulna", "খুলনা", ""], ["Kishoreganj", "কিশোরগঞ্জ", ""], ["Kurigram", "কুড়িগ্রাম", ""], ["Kushtia", "কুষ্টিয়া", ""],
    ["Lakshmipur", "লক্ষ্মীপুর", ""], ["Lalmonirhat", "লালমনিরহাট", ""], ["Madaripur", "মাদারীপুর", ""], ["Magura", "মাগুরা", ""],
    ["Manikganj", "মানিকগঞ্জ", ""], ["Meherpur", "মেহেরপুর", ""], ["Moulvibazar", "মৌলভীবাজার", ""], ["Munshiganj", "মুন্সিগঞ্জ", ""],
    ["Mymensingh", "ময়মনসিংহ", ""], ["Naogaon", "নওগাঁ", ""], ["Narail", "নড়াইল", ""], ["Narayanganj", "নারায়ণগঞ্জ", ""],
    ["Narsingdi", "নরসিংদী", ""], ["Natore", "নাটোর", ""], ["Netrokona", "নেত্রকোণা", ""], ["Nilphamari", "নীলফামারী", ""],
    ["Noakhali", "নোয়াখালী", ""], ["Pabna", "পাবনা", ""], ["Panchagarh", "পঞ্চগড়", ""], ["Patuakhali", "পটুয়াখালী", ""],
    ["Pirojpur", "পিরোজপুর", ""], ["Rajbari", "রাজবাড়ী", ""], ["Rajshahi", "রাজশাহী", ""], ["Rangamati", "রাঙ্গামাটি", ""],
    ["Rangpur", "রংপুর", ""], ["Satkhira", "সাতক্ষীরা", ""], ["Shariatpur", "শরীয়তপুর", ""], ["Sherpur", "শেরপুর", ""],
    ["Sirajganj", "সিরাজগঞ্জ", ""], ["Sunamganj", "সুনামগঞ্জ", ""], ["Sylhet", "সিলেট", ""], ["Tangail", "টাঙ্গাইল", ""],
    ["Thakurgaon", "ঠাকুরগাঁও", ""]
  ];

  // Coordinates for the divisional cities (used on the Air Mail band)
  const COORDS = {
    "Dhaka": [23.8103, 90.4125], "Chattogram": [22.3569, 91.7832], "Sylhet": [24.8949, 91.8687], "Khulna": [22.8456, 89.5403],
    "Rajshahi": [24.3745, 88.6042], "Barishal": [22.7010, 90.3535], "Rangpur": [25.7439, 89.2752], "Mymensingh": [24.7471, 90.4203],
    "Cox's Bazar": [21.4272, 92.0058], "Cumilla": [23.4607, 91.1809]
  };

  // Face values: [number, unit] — unit "tk" (taka) or "p" (poisha)
  const VALUES = [[1, "tk"], [2, "tk"], [5, "tk"], [10, "tk"], [20, "tk"], [50, "tk"], [100, "tk"], [20, "p"], [50, "p"], [90, "p"]];

  // Caption / theme presets: [English, Bangla]
  const CAPTIONS = [
    ["The Land of Rivers", "নদীমাতৃক বাংলাদেশ"],
    ["One cup of tea, shared with glee", "এক কাপ চা, সবাই মিলে খা"],
    ["City of Magic", "জাদুর শহর"],
    ["Old Dhaka Architecture", "পুরান ঢাকার স্থাপত্য"],
    ["Handicrafts", "হস্তশিল্প"],
    ["Monsoon Memories", "বর্ষার স্মৃতি"],
    ["Rickshaw Ride", "রিকশায় ঘোরা"],
    ["Home Sweet Home", "আমার বাড়ি"],
    ["Friends Forever", "বন্ধুত্ব চিরকাল"],
    ["Eid Mubarak", "ঈদ মোবারক"],
    ["Shubho Noboborsho", "শুভ নববর্ষ"],
    ["Golden Bengal", "সোনার বাংলা"]
  ];

  const COLOURS = {
    terracotta: ["#b5472a", "Terracotta", "পোড়ামাটি"], olive: ["#7d8a2e", "Olive", "জলপাই"], maroon: ["#7a1f2b", "Maroon", "মেরুন"],
    indigo: ["#2f3f8f", "Indigo", "নীল"], green: ["#1f6b4e", "Bottle green", "সবুজ"], ochre: ["#c98a1c", "Ochre", "হলুদ"]
  };

  // Lettering choices. ansi:true = Li font, needs Unicode→Bijoy conversion before drawing.
  const BN_FONTS = {
    auto: { label: ["Template default", "টেমপ্লেটের নিজস্ব"] },
    alinur: { f: '"Li Alinur Nanggala"', ansi: true, label: ["Alinur Nanggala", "আলিনুর নাঙ্গলা"] },
    chayana: { f: '"Li Chayana Teesta"', ansi: true, label: ["Chayana Teesta", "ছায়ানা তিস্তা"] },
    galada: { f: "Galada", label: ["Galada", "গালাদা"] },
    tiro: { f: '"Tiro Bangla"', label: ["Tiro Bangla", "তিরো বাংলা"] },
    hind: { f: '"Hind Siliguri"', w: 700, label: ["Hind Siliguri", "হিন্দ শিলিগুড়ি"] }
  };
  const EN_FONTS = {
    auto: { label: ["Template default", "টেমপ্লেটের নিজস্ব"] },
    raleway: { f: "Raleway", w: 800, label: ["Raleway", "Raleway"] },
    shoulders: { f: '"Big Shoulders Display"', w: 900, label: ["Big Shoulders", "Big Shoulders"] },
    archivo: { f: '"Archivo Black"', w: 400, label: ["Archivo Black", "Archivo Black"] },
    fraunces: { f: "Fraunces", w: 600, label: ["Fraunces", "Fraunces"] },
    caveat: { f: "Caveat", w: 700, label: ["Caveat (hand)", "Caveat (hand)"] }
  };

  const TEMPLATES = [
    ["classic", "Definitive", "চিরায়ত"], ["painted", "Commemorative", "স্মারক"], ["framed", "Gold Frame", "সোনালি ফ্রেম"],
    ["airmail", "Air Mail", "বিমান ডাক"], ["engraved", "Engraved", "খোদাই"], ["blueink", "Blue Ink", "নীল কালি"],
    ["teastall", "Tea Stall", "চায়ের দোকান"], ["dacca", "Dacca Red", "লাল ঢাকা"], ["revenue", "Revenue", "রাজস্ব"],
    ["collage", "Collage", "কোলাজ"]
  ];

  const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
  const toBnDigits = s => String(s).replace(/[0-9]/g, d => BN_DIGITS[+d]);

  // UI text. Bangla strings are Unicode; the app converts them for the Li fonts.
  const UI = {
    en: {
      tabStamp: "Stamp maker", tabLetter: "Letter",
      heroStamp: "Make your own Bangladeshi stamp", heroStampSub: "Upload a photo, pick a template, choose your district and value, then save it for your chats.",
      upload: "Upload your photo", uploadHint: "JPG or PNG. Your photo stays on your phone.", sample: "Showing a sample photo",
      templates: "Templates", details: "Stamp details", district: "District", value: "Value", caption: "Caption",
      customCaption: "Custom caption…", capEn: "Caption in English", capBn: "Caption in Bangla",
      letteringBn: "Bangla lettering", letteringEn: "English lettering", colour: "Ink colour", postmark: "Add postmark",
      photo: "Photo", zoom: "Zoom", move: "Move up / down", ink: "Ink strength", size: "Size", post: "Post 4:5", story: "Story 9:16",
      save: "Save", sticker: "Sticker", share: "Share", sendLetter: "Send it with a letter",
      heroLetter: "Write a letter", heroLetterSub: "Your stamp goes on the envelope. Write a message, add a seal, and download a 16:9 PDF to share.",
      letterLang: "Letter language", seal: "Seal photo", sealSame: "Use my stamp photo", sealOther: "Upload a different photo",
      message: "Your message", sender: "Sender", receiver: "Receiver", name: "Name", address: "Address",
      pdf: "Download PDF", sharePdf: "Share PDF", pages: "Pages", stampUsed: "Your stamp from the Stamp maker is attached.",
      msgPh: "Write your letter here…", namePh: "Name", addrPh: "House, road, area, district",
      saved: "Saved.", working: "Making your file…", shareNo: "Sharing isn't available here, so the file was saved instead.",
      photoErr: "That photo couldn't be opened. Try a JPG or PNG.", skip: "Skip", stickerNote: "Transparent WebP sticker for chats.",
      defMsg: "Hope you're doing well. I made this stamp just for you. Write back soon!", posting: "Posting your letter…"
    },
    bn: {
      tabStamp: "ডাকটিকিট", tabLetter: "চিঠি",
      heroStamp: "নিজের ডাকটিকিট বানাও", heroStampSub: "ছবি দাও, টেমপ্লেট বাছো, জেলা আর দাম ঠিক করো, তারপর সেভ করে চ্যাটে পাঠাও।",
      upload: "তোমার ছবি দাও", uploadHint: "ছবি তোমার ফোনেই থাকে।", sample: "নমুনা ছবি দেখানো হচ্ছে",
      templates: "টেমপ্লেট", details: "ডাকটিকিটের তথ্য", district: "জেলা", value: "দাম", caption: "লেখা",
      customCaption: "নিজের লেখা…", capEn: "ইংরেজি লেখা", capBn: "বাংলা লেখা",
      letteringBn: "বাংলা অক্ষর", letteringEn: "ইংরেজি অক্ষর", colour: "কালির রং", postmark: "সিলমোহর দাও",
      photo: "ছবি", zoom: "বড় করো", move: "উপরে নিচে সরাও", ink: "কালির গাঢ়তা", size: "মাপ", post: "পোস্ট", story: "স্টোরি",
      save: "সেভ", sticker: "স্টিকার", share: "শেয়ার", sendLetter: "চিঠির সাথে পাঠাও",
      heroLetter: "চিঠি লেখো", heroLetterSub: "তোমার ডাকটিকিট খামে লাগানো থাকবে। বার্তা লেখো, সিল দাও, তারপর পিডিএফ নামিয়ে শেয়ার করো।",
      letterLang: "চিঠির ভাষা", seal: "সিলের ছবি", sealSame: "ডাকটিকিটের ছবিই দাও", sealOther: "অন্য ছবি দাও",
      message: "তোমার বার্তা", sender: "প্রেরক", receiver: "প্রাপক", name: "নাম", address: "ঠিকানা",
      pdf: "পিডিএফ নামাও", sharePdf: "পিডিএফ শেয়ার", pages: "পাতা", stampUsed: "তোমার বানানো ডাকটিকিট খামে লাগানো আছে।",
      msgPh: "এখানে চিঠি লেখো…", namePh: "নাম", addrPh: "বাড়ি, রাস্তা, এলাকা, জেলা",
      saved: "সেভ হয়েছে।", working: "ফাইল তৈরি হচ্ছে…", shareNo: "এখানে শেয়ার করা যায় না, তাই ফাইলটি সেভ করা হলো।",
      photoErr: "ছবিটি খোলা যায়নি। অন্য ছবি দাও।", skip: "বাদ দাও", stickerNote: "চ্যাটের জন্য স্বচ্ছ স্টিকার।",
      defMsg: "আশা করি ভালো আছো। তোমার জন্য এই ডাকটিকিটটা বানালাম। তাড়াতাড়ি উত্তর দিও!", posting: "চিঠি পোস্ট হচ্ছে…"
    }
  };

  root.DaakData = { DISTRICTS, COORDS, VALUES, CAPTIONS, COLOURS, BN_FONTS, EN_FONTS, TEMPLATES, UI, toBnDigits };
})(typeof window !== "undefined" ? window : globalThis);
