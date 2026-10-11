import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// --- RATE LIMITER SEDERHANA (in-memory, reset tiap 60 detik) -----------------
const rateLimitMap = new Map(); // ip ? { count, resetAt }
const RATE_LIMIT = 30;         // max 30 request per IP per menit
const RATE_WINDOW = 60_000;    // 60 detik

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false; // OK
  }
  if (entry.count >= RATE_LIMIT) return true; // kena limit
  entry.count++;
  return false; // OK
}

export async function POST(req) {
  // Rate limit per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (checkRateLimit(ip)) {
    return NextResponse.json({ reply: "Terlalu banyak pertanyaan. Coba lagi dalam 1 menit ya! ??", botName: "Asisten PontiCell" }, { status: 429 });
  }

  try {
    const { message, history = [] } = await req.json();
    const sql = getDb();

    // Fetch robot settings dari Ponticell DB + produk dari kasir secara paralel
    const kasirUrl = process.env.KASIR_KP_URL || process.env.NEXT_PUBLIC_KASIR_KP_URL || "";
    const kasirKey = process.env.KASIR_KP_KEY || process.env.NEXT_PUBLIC_KASIR_KP_KEY || "";

    const [kasirRes, robotSettings] = await Promise.all([
      kasirUrl && kasirKey
        ? fetch(`${kasirUrl}/api/storefront`, { headers: { "x-storefront-key": kasirKey }, cache: "no-store" })
            .then(r => r.json()).catch(() => ({ produk: [] }))
        : Promise.resolve({ produk: [] }),
      sql`SELECT kunci, nilai FROM konten WHERE kategori = 'robot'`,
    ]);

    // Parse robot settings
    const settings = {};
    robotSettings.forEach(r => { settings[r.kunci] = r.nilai; });

    const namaBot    = settings.robot_nama      || "Asisten PontiCell";
    const gayaBahasa = settings.robot_gaya      || "santai";
    const pesanWillcome = settings.robot_salam  || "";
    const instruksi  = settings.robot_instruksi || "";
    const promo      = settings.robot_promo     || "";
    const larangan   = settings.robot_larangan  || "";
    const waNumber   = settings.robot_wa        || "6283808484969";

    // Produk dari kasir -- format lebih kaya untuk konteks AI
    const kasirProduk = kasirRes.produk || [];
    const productList = kasirProduk.map(p => {
      const harga = Number(p.harga_jual || 0);
      const hargaFmt = harga >= 1000000
        ? (harga / 1000000).toFixed(1).replace(".0","") + " juta"
        : Math.round(harga / 1000) + "rb";
      const ram = p.ram ? `RAM${p.ram}` : "";
      const rom = p.rom ? `/${p.rom}` : "";
      const cond = p.kondisi === "Baru" ? "Baru" : "Second";
      const stok = p.stok ? (Number(p.stok) <= 2 ? ` ??STOK ${p.stok}` : "") : "";
      return `* ${p.nama}${ram ? ` ${ram}${rom}` : ""} [${cond}] Rp${hargaFmt}${stok}`;
    }).join("\n");

    const gayaInstruksi = {
      santai: "Bahasa Indonesia ramah, santai, akrab. Boleh 'kamu/aku'. Sesekali emoji.",
      formal: "Bahasa Indonesia formal profesional. Pakai 'Anda/Saya'.",
      gaul:   "Bahasa gaul kekinian, energik, tapi tetap sopan. Bebas emoji.",
    }[gayaBahasa] || "Bahasa Indonesia ramah.";

    // --- SYSTEM PROMPT SALES CLOSER -----------------------------------------
    const systemPrompt = `Kamu adalah ${namaBot} -- sales specialist handal PontiCell, toko HP & tablet di Pontianak.
Tugasmu BUKAN hanya menjawab pertanyaan. Tugasmu adalah MENUTUP PENJUALAN (closing) setiap percakapan.

GAYA: ${gayaInstruksi}

--- STOK TERSEDIA ---
${productList || "Hubungi kami untuk info stok terkini."}

${promo ? `--- PROMO & KEUNGGULAN ---\n${promo}\n` : ""}
${instruksi ? `--- INSTRUKSI KHUSUS ---\n${instruksi}\n` : ""}
${larangan ? `--- DILARANG ---\n${larangan}\n` : ""}

--- PANDUAN SALES CLOSING ---

FASE 1 -- KENALI KEBUTUHAN:
- Jika customer menyebut budget ? langsung rekomendasikan 2-3 produk dari stok yang cocok
- Jika customer menyebut kebutuhan (gaming, kamera, kerja) ? rekomendasikan berdasarkan spesifikasi yang relevan
- Jika tidak ada produk yang pas ? rekomendasikan yang paling mendekati + jelaskan kenapa masih worth it

FASE 2 -- BANGUN KEYAKINAN:
- Sebutkan kondisi produk (Baru/Second) dengan jelas
- Jika stok ?? ? buat urgensi: "stok tinggal sedikit, bisa habis hari ini"
- Bandingkan value: "dibanding beli online, di sini bisa cek langsung + garansi toko"
- Jika ada promo ? selalu sebut sebagai alasan untuk beli sekarang

FASE 3 -- TANGANI KEBERATAN:
- Harga mahal ? "Bisa nego sedikit, langsung WA aja biar bisa diskusi harga terbaik"
- Ragu kondisi ? "Second kami sudah dicek teknisi, bisa test di tempat sebelum beli"
- Mau pikir-pikir ? "Stok terbatas, sayang kalau keduluan yang lain -- mau saya sisihkan dulu?"

FASE 4 -- CLOSING (WAJIB di setiap respons setelah fase 1):
SELALU akhiri dengan ajakan WA yang spesifik. Format:
"?? Langsung chat WA sekarang: wa.me/${waNumber}?text=Halo+mau+tanya+soal+[NAMA_PRODUK]"
Ganti [NAMA_PRODUK] dengan produk yang dibahas. Jika belum tahu produk ? gunakan "HP+yang+cocok+buat+saya"

ATURAN PENTING:
- Maksimal 180 kata per respons
- Jangan sebut produk yang tidak ada di stok
- Selalu spesifik (sebut nama produk, harga, kondisi)
- Jangan pernah bilang "tergantung kebutuhan" tanpa langsung memberikan rekomendasi konkret
- Jika ditanya hal di luar produk ? alihkan ke produk + WA
- Pada pesan ke-3 customer, tingkatkan urgensi dan dorong closing lebih kuat`;

    // --- HANDLE __init__ -----------------------------------------------------
    if (message === "__init__") {
      return NextResponse.json({
        reply: pesanWillcome || `Halo! ?? Saya ${namaBot}, siap bantu kamu dapetin HP terbaik sesuai budget!\n\nMau cari HP apa hari ini? Kasih tau budget atau kebutuhannya ya! ??`,
        botName: namaBot,
        greeting: pesanWillcome || `Halo! ?? Saya ${namaBot}, siap bantu kamu dapetin HP terbaik sesuai budget!\n\nMau cari HP apa hari ini? Kasih tau budget atau kebutuhannya ya! ??`,
        waNumber,
      });
    }

    // --- BUILD MESSAGES ------------------------------------------------------
    // Batasi history ke 6 pesan
    const recentHistory = history.slice(-6);
    const messages = [
      ...recentHistory.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    let reply = "";

    // --- PRIMARY: OPENROUTER -------------------------------------------------
    // OpenRouter lebih reliable, pakai sebagai primary
    const orKey = process.env.OPENROUTER_API_KEY || "";
    if (orKey) {
      // Coba beberapa model OpenRouter secara berurutan
      const orModels = [
        "google/gemma-3-4b-it",
        "meta-llama/llama-3.2-3b-instruct:free",
        "qwen/qwen-2.5-7b-instruct:free",
      ];
      for (const model of orModels) {
        if (reply) break;
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 8000);
          const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${orKey}`,
              "HTTP-Referer": "https://ponticell.vercel.app",
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "system", content: systemPrompt }, ...messages],
              max_tokens: 350,
              temperature: 0.65,
            }),
            signal: ctrl.signal,
          });
          clearTimeout(timer);
          if (orRes.ok) {
            const d = await orRes.json();
            reply = d?.choices?.[0]?.message?.content || "";
            if (reply) { console.log("OpenRouter OK:", model); break; }
          } else {
            const t = await orRes.text();
            console.error(`OpenRouter ${model} error:`, orRes.status, t.slice(0,100));
          }
        } catch(e) { console.error(`OpenRouter ${model} catch:`, e.message); }
      }
    }

    // --- FALLBACK: GROQ ------------------------------------------------------
    if (!reply) {
      const groqKey = process.env.GROQ_API_KEY || "";
      if (groqKey) {
        const groqModels = [
          "openai/gpt-oss-20b",
          "openai/gpt-oss-120b",
          "qwen/qwen3.8-27b",
        ];
        const tryGroq = (model) => new Promise((resolve) => {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 7000);
          fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
            body: JSON.stringify({
              model,
              messages: [{ role: "system", content: systemPrompt }, ...messages],
              max_tokens: 350,
              temperature: 0.65,
            }),
            signal: ctrl.signal,
          })
            .then(r => {
              if (r.ok) return r.json();
              return r.text().then(t => { console.error(`Groq ${model} HTTP ${r.status}:`, t.slice(0,150)); return null; });
            })
            .then(d => { clearTimeout(timer); resolve(d?.choices?.[0]?.message?.content || null); })
            .catch((e) => { clearTimeout(timer); console.error(`Groq ${model} catch:`, e?.message); resolve(null); });
        });

        const results = await Promise.allSettled(groqModels.map(tryGroq));
        for (const r of results) {
          if (r.status === "fulfilled" && r.value) { reply = r.value; console.log("Groq OK"); break; }
        }
        if (!reply) console.error("Groq: semua model gagal");
      }
    }

    // --- KALAU SEMUA GAGAL ----------------------------------------------------
    if (!reply) {
      return NextResponse.json({
        reply: `Halo! Saya ${namaBot} ?? Ada yang bisa saya bantu? Untuk info stok dan harga terbaru, langsung chat WA kami ya!\n\n?? wa.me/${waNumber}`,
        botName: namaBot,
        waNumber,
      });
    }

    // Hapus thinking tags dari model reasoning jika ada
    reply = reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // --- CARI PRODUK YANG RELEVAN UNTUK DITAMPILKAN DI CHAT ------------------
    const msgLower = message.toLowerCase();
    const stopWords = new Set(["ada","yang","mana","apa","bisa","mau","cari","ingin","tolong","halo","hai","harga","berapa","stok","masih","untuk","sama","dengan","atau","dan","ini","itu","saja","dong","deh","kak","pak","bu"]);
    const words = msgLower.split(/\s+/).filter(w => w.length >= 3 && !stopWords.has(w));

    // Deteksi budget dari pesan (contoh: "3 juta", "3jt", "3rb", "1.5 juta", "500rb")
    let budgetMax = null;
    const budgetMatch = msgLower.match(/(\d+(?:[.,]\d+)?)\s*(juta|jt|jt-an|jutaan)/i);
    const budgetRbMatch = msgLower.match(/(\d+(?:[.,]\d+)?)\s*(ribu|rb|k)\b/i);
    if (budgetMatch) {
      budgetMax = parseFloat(budgetMatch[1].replace(",",".")) * 1_000_000;
    } else if (budgetRbMatch) {
      budgetMax = parseFloat(budgetRbMatch[1].replace(",",".")) * 1_000;
    }
    // Toleransi 15% di atas budget (biar produk yang "hampir" sesuai masih muncul)
    const budgetCeiling = budgetMax ? budgetMax * 1.15 : null;

    // Brand-brand yang kalau disebut sendiri sudah cukup spesifik (1 kata = boleh tampil)
    const brandSpesifik = new Set(["iphone","ipad","samsung","xiaomi","realme","oppo","vivo","infinix","tecno","redmi","poco","nubia","nokia","sony","asus","huawei","honor","motorola","itel"]);
    const adaBrandSpesifik = words.some(w => brandSpesifik.has(w));

    // Hitung skor kecocokan + filter budget
    const scored = kasirProduk.map(p => {
      const namaProduk = (p.nama || "").toLowerCase();
      const matchCount = words.filter(w => namaProduk.includes(w)).length;
      const hargaProduk = Number(p.harga_jual || 0);
      return { p, matchCount, hargaProduk };
    }).filter(x => {
      // Filter nama: minimal 1 kata cocok jika brand spesifik, 2 jika tidak
      const namaOk = adaBrandSpesifik ? x.matchCount >= 1 : x.matchCount >= 2;
      // Filter budget: jika ada budget di pesan, hanya tampilkan yang harganya <= ceiling
      const budgetOk = budgetCeiling ? x.hargaProduk <= budgetCeiling : true;
      return namaOk && budgetOk;
    }).sort((a, b) => b.matchCount - a.matchCount || a.hargaProduk - b.hargaProduk);

    // Foto library -- fallback otomatis jika produk tidak punya foto
    const FOTO_LIB = {
      "samsung a57":"https://fdn.gsmarena.com/imgroot/news/21/09/samsung-galaxy-a57-5g-official/-476x476w/gsmarena_001.jpg",
      "samsung a56":"https://fdn.gsmarena.com/imgroot/reviews/25/samsung-galaxy-a56/highres/gsmarena_001.jpg",
      "samsung a55":"https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-a55/highres/gsmarena_001.jpg",
      "samsung a54":"https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-a54/highres/gsmarena_001.jpg",
      "samsung a35":"https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-a35/highres/gsmarena_001.jpg",
      "samsung a25":"https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-a25/highres/gsmarena_001.jpg",
      "samsung a16":"https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-a16/highres/gsmarena_001.jpg",
      "samsung a15":"https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-a15/highres/gsmarena_001.jpg",
      "samsung a14":"https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-a14/highres/gsmarena_001.jpg",
      "samsung a13":"https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-a13/highres/gsmarena_001.jpg",
      "samsung a07":"https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-a07/highres/gsmarena_001.jpg",
      "samsung a04s":"https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-a04s/highres/gsmarena_001.jpg",
      "samsung a04":"https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-a04/highres/gsmarena_001.jpg",
      "samsung a05s":"https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-a05s/highres/gsmarena_001.jpg",
      "samsung a05":"https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-a05/highres/gsmarena_001.jpg",
      "samsung a03s":"https://fdn.gsmarena.com/imgroot/reviews/21/samsung-galaxy-a03s/highres/gsmarena_001.jpg",
      "samsung a03":"https://fdn.gsmarena.com/imgroot/reviews/21/samsung-galaxy-a03/highres/gsmarena_001.jpg",
      "samsung m15":"https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-m15/highres/gsmarena_001.jpg",
      "samsung m14":"https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-m14/highres/gsmarena_001.jpg",
      "samsung s24 ultra":"https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-s24-ultra/highres/gsmarena_001.jpg",
      "samsung s24":"https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-s24/highres/gsmarena_001.jpg",
      "samsung s23 ultra":"https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-s23-ultra/highres/gsmarena_001.jpg",
      "samsung s23":"https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-s23/highres/gsmarena_001.jpg",
      "samsung s22 ultra":"https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-s22-ultra/highres/gsmarena_001.jpg",
      "samsung s22":"https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-s22/highres/gsmarena_001.jpg",
      "samsung s21 ultra":"https://fdn.gsmarena.com/imgroot/reviews/21/samsung-galaxy-s21-ultra/highres/gsmarena_001.jpg",
      "samsung s21":"https://fdn.gsmarena.com/imgroot/reviews/21/samsung-galaxy-s21/highres/gsmarena_001.jpg",
      "samsung z fold5":"https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-z-fold5/highres/gsmarena_001.jpg",
      "samsung z fold4":"https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-z-fold4/highres/gsmarena_001.jpg",
      "samsung z flip5":"https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-z-flip5/highres/gsmarena_001.jpg",
      "samsung z flip4":"https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-z-flip4/highres/gsmarena_001.jpg",
      "samsung tab a9+":"https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-tab-a9-plus/highres/gsmarena_001.jpg",
      "samsung tab a9":"https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-tab-a9/highres/gsmarena_001.jpg",
      "samsung tab a8":"https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-tab-a8/highres/gsmarena_001.jpg",
      "redmi note 13 pro+":"https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-redmi-note-13-pro-plus/highres/gsmarena_001.jpg",
      "redmi note 13 pro":"https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-redmi-note-13-pro/highres/gsmarena_001.jpg",
      "redmi note 13":"https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-redmi-note-13/highres/gsmarena_001.jpg",
      "redmi note 12 pro":"https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-redmi-note-12-pro/highres/gsmarena_001.jpg",
      "redmi note 12":"https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-redmi-note-12/highres/gsmarena_001.jpg",
      "redmi note 11":"https://fdn.gsmarena.com/imgroot/reviews/22/xiaomi-redmi-note-11/highres/gsmarena_001.jpg",
      "redmi 13c":"https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-redmi-13c/highres/gsmarena_001.jpg",
      "redmi 13":"https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-redmi-13/highres/gsmarena_001.jpg",
      "redmi 12c":"https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-redmi-12c/highres/gsmarena_001.jpg",
      "redmi 12":"https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-redmi-12/highres/gsmarena_001.jpg",
      "poco x6 pro":"https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-poco-x6-pro/highres/gsmarena_001.jpg",
      "poco x6":"https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-poco-x6/highres/gsmarena_001.jpg",
      "poco x5 pro":"https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-poco-x5-pro/highres/gsmarena_001.jpg",
      "poco x5":"https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-poco-x5/highres/gsmarena_001.jpg",
      "poco m6 pro":"https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-poco-m6-pro/highres/gsmarena_001.jpg",
      "poco m6":"https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-poco-m6/highres/gsmarena_001.jpg",
      "poco m5s":"https://fdn.gsmarena.com/imgroot/reviews/22/xiaomi-poco-m5s/highres/gsmarena_001.jpg",
      "poco m5":"https://fdn.gsmarena.com/imgroot/reviews/22/xiaomi-poco-m5/highres/gsmarena_001.jpg",
      "poco c65":"https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-poco-c65/highres/gsmarena_001.jpg",
      "poco c55":"https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-poco-c55/highres/gsmarena_001.jpg",
      "oppo reno12 pro":"https://fdn.gsmarena.com/imgroot/reviews/24/oppo-reno12-pro/highres/gsmarena_001.jpg",
      "oppo reno12":"https://fdn.gsmarena.com/imgroot/reviews/24/oppo-reno12/highres/gsmarena_001.jpg",
      "oppo reno11 pro":"https://fdn.gsmarena.com/imgroot/reviews/24/oppo-reno11-pro/highres/gsmarena_001.jpg",
      "oppo reno11":"https://fdn.gsmarena.com/imgroot/reviews/24/oppo-reno11/highres/gsmarena_001.jpg",
      "oppo reno10 pro":"https://fdn.gsmarena.com/imgroot/reviews/23/oppo-reno10-pro/highres/gsmarena_001.jpg",
      "oppo reno10":"https://fdn.gsmarena.com/imgroot/reviews/23/oppo-reno10/highres/gsmarena_001.jpg",
      "oppo reno8 pro":"https://fdn.gsmarena.com/imgroot/reviews/22/oppo-reno8-pro/highres/gsmarena_001.jpg",
      "oppo reno8":"https://fdn.gsmarena.com/imgroot/reviews/22/oppo-reno8/highres/gsmarena_001.jpg",
      "oppo a79":"https://fdn.gsmarena.com/imgroot/reviews/23/oppo-a79/highres/gsmarena_001.jpg",
      "oppo a78":"https://fdn.gsmarena.com/imgroot/reviews/23/oppo-a78/highres/gsmarena_001.jpg",
      "oppo a58":"https://fdn.gsmarena.com/imgroot/reviews/23/oppo-a58/highres/gsmarena_001.jpg",
      "oppo a57s":"https://fdn.gsmarena.com/imgroot/reviews/22/oppo-a57s/highres/gsmarena_001.jpg",
      "oppo a57":"https://fdn.gsmarena.com/imgroot/reviews/22/oppo-a57/highres/gsmarena_001.jpg",
      "oppo a38":"https://fdn.gsmarena.com/imgroot/reviews/23/oppo-a38/highres/gsmarena_001.jpg",
      "oppo a18":"https://fdn.gsmarena.com/imgroot/reviews/23/oppo-a18/highres/gsmarena_001.jpg",
      "oppo a17":"https://fdn.gsmarena.com/imgroot/reviews/22/oppo-a17/highres/gsmarena_001.jpg",
      "realme 13 pro+":"https://fdn.gsmarena.com/imgroot/reviews/24/realme-13-pro-plus/highres/gsmarena_001.jpg",
      "realme 13 pro":"https://fdn.gsmarena.com/imgroot/reviews/24/realme-13-pro/highres/gsmarena_001.jpg",
      "realme 13":"https://fdn.gsmarena.com/imgroot/reviews/24/realme-13/highres/gsmarena_001.jpg",
      "realme 12 pro+":"https://fdn.gsmarena.com/imgroot/reviews/24/realme-12-pro-plus/highres/gsmarena_001.jpg",
      "realme 12 pro":"https://fdn.gsmarena.com/imgroot/reviews/24/realme-12-pro/highres/gsmarena_001.jpg",
      "realme 12":"https://fdn.gsmarena.com/imgroot/reviews/24/realme-12/highres/gsmarena_001.jpg",
      "realme 11 pro+":"https://fdn.gsmarena.com/imgroot/reviews/23/realme-11-pro-plus/highres/gsmarena_001.jpg",
      "realme 11 pro":"https://fdn.gsmarena.com/imgroot/reviews/23/realme-11-pro/highres/gsmarena_001.jpg",
      "realme 11":"https://fdn.gsmarena.com/imgroot/reviews/23/realme-11/highres/gsmarena_001.jpg",
      "realme c67":"https://fdn.gsmarena.com/imgroot/reviews/24/realme-c67/highres/gsmarena_001.jpg",
      "realme c65":"https://fdn.gsmarena.com/imgroot/reviews/24/realme-c65/highres/gsmarena_001.jpg",
      "realme c55":"https://fdn.gsmarena.com/imgroot/reviews/23/realme-c55/highres/gsmarena_001.jpg",
      "realme c53":"https://fdn.gsmarena.com/imgroot/reviews/23/realme-c53/highres/gsmarena_001.jpg",
      "realme c51":"https://fdn.gsmarena.com/imgroot/reviews/23/realme-c51/highres/gsmarena_001.jpg",
      "realme c35":"https://fdn.gsmarena.com/imgroot/reviews/22/realme-c35/highres/gsmarena_001.jpg",
      "vivo v40 pro":"https://fdn.gsmarena.com/imgroot/reviews/24/vivo-v40-pro/highres/gsmarena_001.jpg",
      "vivo v40":"https://fdn.gsmarena.com/imgroot/reviews/24/vivo-v40/highres/gsmarena_001.jpg",
      "vivo v30 pro":"https://fdn.gsmarena.com/imgroot/reviews/24/vivo-v30-pro/highres/gsmarena_001.jpg",
      "vivo v30":"https://fdn.gsmarena.com/imgroot/reviews/24/vivo-v30/highres/gsmarena_001.jpg",
      "vivo v29 pro":"https://fdn.gsmarena.com/imgroot/reviews/23/vivo-v29-pro/highres/gsmarena_001.jpg",
      "vivo v29":"https://fdn.gsmarena.com/imgroot/reviews/23/vivo-v29/highres/gsmarena_001.jpg",
      "vivo y200 pro":"https://fdn.gsmarena.com/imgroot/reviews/24/vivo-y200-pro/highres/gsmarena_001.jpg",
      "vivo y200":"https://fdn.gsmarena.com/imgroot/reviews/24/vivo-y200/highres/gsmarena_001.jpg",
      "vivo y100":"https://fdn.gsmarena.com/imgroot/reviews/23/vivo-y100/highres/gsmarena_001.jpg",
      "vivo y36":"https://fdn.gsmarena.com/imgroot/reviews/23/vivo-y36/highres/gsmarena_001.jpg",
      "vivo y35":"https://fdn.gsmarena.com/imgroot/reviews/22/vivo-y35/highres/gsmarena_001.jpg",
      "vivo y22":"https://fdn.gsmarena.com/imgroot/reviews/22/vivo-y22/highres/gsmarena_001.jpg",
      "vivo y16":"https://fdn.gsmarena.com/imgroot/reviews/22/vivo-y16/highres/gsmarena_001.jpg",
      "infinix hot 50 pro+":"https://fdn.gsmarena.com/imgroot/reviews/24/infinix-hot-50-pro-plus/highres/gsmarena_001.jpg",
      "infinix hot 50 pro":"https://fdn.gsmarena.com/imgroot/reviews/24/infinix-hot-50-pro/highres/gsmarena_001.jpg",
      "infinix hot 50":"https://fdn.gsmarena.com/imgroot/reviews/24/infinix-hot-50/highres/gsmarena_001.jpg",
      "infinix hot 40 pro":"https://fdn.gsmarena.com/imgroot/reviews/23/infinix-hot-40-pro/highres/gsmarena_001.jpg",
      "infinix hot 40":"https://fdn.gsmarena.com/imgroot/reviews/23/infinix-hot-40/highres/gsmarena_001.jpg",
      "infinix hot 30":"https://fdn.gsmarena.com/imgroot/reviews/23/infinix-hot-30/highres/gsmarena_001.jpg",
      "infinix hot 20s":"https://fdn.gsmarena.com/imgroot/reviews/22/infinix-hot-20s/highres/gsmarena_001.jpg",
      "infinix hot 20":"https://fdn.gsmarena.com/imgroot/reviews/22/infinix-hot-20/highres/gsmarena_001.jpg",
      "infinix note 40 pro":"https://fdn.gsmarena.com/imgroot/reviews/24/infinix-note-40-pro/highres/gsmarena_001.jpg",
      "infinix note 40":"https://fdn.gsmarena.com/imgroot/reviews/24/infinix-note-40/highres/gsmarena_001.jpg",
      "infinix note 30 pro":"https://fdn.gsmarena.com/imgroot/reviews/23/infinix-note-30-pro/highres/gsmarena_001.jpg",
      "infinix note 30":"https://fdn.gsmarena.com/imgroot/reviews/23/infinix-note-30/highres/gsmarena_001.jpg",
      "infinix smart 8 pro":"https://fdn.gsmarena.com/imgroot/reviews/24/infinix-smart-8-pro/highres/gsmarena_001.jpg",
      "infinix smart 8":"https://fdn.gsmarena.com/imgroot/reviews/23/infinix-smart-8/highres/gsmarena_001.jpg",
      "infinix smart 7":"https://fdn.gsmarena.com/imgroot/reviews/23/infinix-smart-7/highres/gsmarena_001.jpg",
      "infinix zero 40":"https://fdn.gsmarena.com/imgroot/reviews/24/infinix-zero-40/highres/gsmarena_001.jpg",
      "infinix zero 30":"https://fdn.gsmarena.com/imgroot/reviews/23/infinix-zero-30/highres/gsmarena_001.jpg",
      "iphone 16 pro max":"https://fdn.gsmarena.com/imgroot/reviews/24/apple-iphone-16-pro-max/highres/gsmarena_001.jpg",
      "iphone 16 pro":"https://fdn.gsmarena.com/imgroot/reviews/24/apple-iphone-16-pro/highres/gsmarena_001.jpg",
      "iphone 16 plus":"https://fdn.gsmarena.com/imgroot/reviews/24/apple-iphone-16-plus/highres/gsmarena_001.jpg",
      "iphone 16":"https://fdn.gsmarena.com/imgroot/reviews/24/apple-iphone-16/highres/gsmarena_001.jpg",
      "iphone 15 pro max":"https://fdn.gsmarena.com/imgroot/reviews/23/apple-iphone-15-pro-max/highres/gsmarena_001.jpg",
      "iphone 15 pro":"https://fdn.gsmarena.com/imgroot/reviews/23/apple-iphone-15-pro/highres/gsmarena_001.jpg",
      "iphone 15":"https://fdn.gsmarena.com/imgroot/reviews/23/apple-iphone-15/highres/gsmarena_001.jpg",
      "iphone 14 pro max":"https://fdn.gsmarena.com/imgroot/reviews/22/apple-iphone-14-pro-max/highres/gsmarena_001.jpg",
      "iphone 14 pro":"https://fdn.gsmarena.com/imgroot/reviews/22/apple-iphone-14-pro/highres/gsmarena_001.jpg",
      "iphone 14":"https://fdn.gsmarena.com/imgroot/reviews/22/apple-iphone-14/highres/gsmarena_001.jpg",
      "iphone 13 pro max":"https://fdn.gsmarena.com/imgroot/reviews/21/apple-iphone-13-pro-max/highres/gsmarena_001.jpg",
      "iphone 13 pro":"https://fdn.gsmarena.com/imgroot/reviews/21/apple-iphone-13-pro/highres/gsmarena_001.jpg",
      "iphone 13":"https://fdn.gsmarena.com/imgroot/reviews/21/apple-iphone-13/highres/gsmarena_001.jpg",
      "iphone 12 pro max":"https://fdn.gsmarena.com/imgroot/reviews/20/apple-iphone-12-pro-max/highres/gsmarena_001.jpg",
      "iphone 12 pro":"https://fdn.gsmarena.com/imgroot/reviews/20/apple-iphone-12-pro/highres/gsmarena_001.jpg",
      "iphone 12":"https://fdn.gsmarena.com/imgroot/reviews/20/apple-iphone-12/highres/gsmarena_001.jpg",
      "iphone 11 pro max":"https://fdn.gsmarena.com/imgroot/reviews/19/apple-iphone-11-pro-max/highres/gsmarena_001.jpg",
      "iphone 11 pro":"https://fdn.gsmarena.com/imgroot/reviews/19/apple-iphone-11-pro/highres/gsmarena_001.jpg",
      "iphone 11":"https://fdn.gsmarena.com/imgroot/reviews/19/apple-iphone-11/highres/gsmarena_001.jpg",
      "iphone se":"https://fdn.gsmarena.com/imgroot/reviews/22/apple-iphone-se-2022/highres/gsmarena_001.jpg",
      "ipad pro":"https://fdn.gsmarena.com/imgroot/reviews/24/apple-ipad-pro-13-2024/highres/gsmarena_001.jpg",
      "ipad air":"https://fdn.gsmarena.com/imgroot/reviews/24/apple-ipad-air-11-2024/highres/gsmarena_001.jpg",
      "ipad mini":"https://fdn.gsmarena.com/imgroot/reviews/24/apple-ipad-mini-7/highres/gsmarena_001.jpg",
      "ipad":"https://fdn.gsmarena.com/imgroot/reviews/24/apple-ipad-10-2/highres/gsmarena_001.jpg",
    };

    function cariFotoLib(namaProduk) {
      if (!namaProduk) return null;
      const n = namaProduk.toLowerCase().replace(/[^\w\s]/g, "").trim();
      const keys = Object.keys(FOTO_LIB).sort((a, b) => b.length - a.length);
      for (const k of keys) { if (n.includes(k)) return FOTO_LIB[k]; }
      return null;
    }

    const produkSorot = scored.slice(0, 3).map(({ p }) => ({
      id: p.id,
      nama: p.nama,
      harga: Number(p.harga_jual || 0),
      kondisi: p.kondisi || "Baru",
      stok: Number(p.stok || 0),
      foto: p.foto || cariFotoLib(p.nama) || null,
      ram: p.ram || null,
      rom: p.rom || null,
    }));

    return NextResponse.json({ reply, botName: namaBot, greeting: pesanWillcome, waNumber, produkSorot: produkSorot.length > 0 ? produkSorot : undefined });

  } catch(e) {
    console.error("Chat error:", e);
    return NextResponse.json({ reply: "Error: " + e.message, botName: "Asisten PontiCell", waNumber: "6283808484969" });
  }
}

