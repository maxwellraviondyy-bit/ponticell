import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req) {
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

    // Produk dari kasir — format lebih kaya untuk konteks AI
    const kasirProduk = kasirRes.produk || [];
    const productList = kasirProduk.map(p => {
      const harga = Number(p.harga_jual || 0);
      const hargaFmt = harga >= 1000000
        ? (harga / 1000000).toFixed(1).replace(".0","") + " juta"
        : Math.round(harga / 1000) + "rb";
      const ram = p.ram ? `RAM${p.ram}` : "";
      const rom = p.rom ? `/${p.rom}` : "";
      const cond = p.kondisi === "Baru" ? "Baru" : "Second";
      const stok = p.stok ? (Number(p.stok) <= 2 ? ` ⚠️STOK ${p.stok}` : "") : "";
      return `• ${p.nama}${ram ? ` ${ram}${rom}` : ""} [${cond}] Rp${hargaFmt}${stok}`;
    }).join("\n");

    const gayaInstruksi = {
      santai: "Bahasa Indonesia ramah, santai, akrab. Boleh 'kamu/aku'. Sesekali emoji.",
      formal: "Bahasa Indonesia formal profesional. Pakai 'Anda/Saya'.",
      gaul:   "Bahasa gaul kekinian, energik, tapi tetap sopan. Bebas emoji.",
    }[gayaBahasa] || "Bahasa Indonesia ramah.";

    // ─── SYSTEM PROMPT SALES CLOSER ─────────────────────────────────────────
    const systemPrompt = `Kamu adalah ${namaBot} — sales specialist handal PontiCell, toko HP & tablet di Pontianak.
Tugasmu BUKAN hanya menjawab pertanyaan. Tugasmu adalah MENUTUP PENJUALAN (closing) setiap percakapan.

GAYA: ${gayaInstruksi}

═══ STOK TERSEDIA ═══
${productList || "Hubungi kami untuk info stok terkini."}

${promo ? `═══ PROMO & KEUNGGULAN ═══\n${promo}\n` : ""}
${instruksi ? `═══ INSTRUKSI KHUSUS ═══\n${instruksi}\n` : ""}
${larangan ? `═══ DILARANG ═══\n${larangan}\n` : ""}

═══ PANDUAN SALES CLOSING ═══

FASE 1 — KENALI KEBUTUHAN:
- Jika customer menyebut budget → langsung rekomendasikan 2-3 produk dari stok yang cocok
- Jika customer menyebut kebutuhan (gaming, kamera, kerja) → rekomendasikan berdasarkan spesifikasi yang relevan
- Jika tidak ada produk yang pas → rekomendasikan yang paling mendekati + jelaskan kenapa masih worth it

FASE 2 — BANGUN KEYAKINAN:
- Sebutkan kondisi produk (Baru/Second) dengan jelas
- Jika stok ⚠️ → buat urgensi: "stok tinggal sedikit, bisa habis hari ini"
- Bandingkan value: "dibanding beli online, di sini bisa cek langsung + garansi toko"
- Jika ada promo → selalu sebut sebagai alasan untuk beli sekarang

FASE 3 — TANGANI KEBERATAN:
- Harga mahal → "Bisa nego sedikit, langsung WA aja biar bisa diskusi harga terbaik"
- Ragu kondisi → "Second kami sudah dicek teknisi, bisa test di tempat sebelum beli"
- Mau pikir-pikir → "Stok terbatas, sayang kalau keduluan yang lain — mau saya sisihkan dulu?"

FASE 4 — CLOSING (WAJIB di setiap respons setelah fase 1):
SELALU akhiri dengan ajakan WA yang spesifik. Format:
"👉 Langsung chat WA sekarang: wa.me/${waNumber}?text=Halo+mau+tanya+soal+[NAMA_PRODUK]"
Ganti [NAMA_PRODUK] dengan produk yang dibahas. Jika belum tahu produk → gunakan "HP+yang+cocok+buat+saya"

ATURAN PENTING:
- Maksimal 180 kata per respons
- Jangan sebut produk yang tidak ada di stok
- Selalu spesifik (sebut nama produk, harga, kondisi)
- Jangan pernah bilang "tergantung kebutuhan" tanpa langsung memberikan rekomendasi konkret
- Jika ditanya hal di luar produk → alihkan ke produk + WA
- Pada pesan ke-3 customer, tingkatkan urgensi dan dorong closing lebih kuat`;

    // ─── HANDLE __init__ ─────────────────────────────────────────────────────
    if (message === "__init__") {
      return NextResponse.json({
        reply: pesanWillcome || `Halo! 👋 Saya ${namaBot}, siap bantu kamu dapetin HP terbaik sesuai budget!\n\nMau cari HP apa hari ini? Kasih tau budget atau kebutuhannya ya! 😊`,
        botName: namaBot,
        greeting: pesanWillcome || `Halo! 👋 Saya ${namaBot}, siap bantu kamu dapetin HP terbaik sesuai budget!\n\nMau cari HP apa hari ini? Kasih tau budget atau kebutuhannya ya! 😊`,
        waNumber,
      });
    }

    // ─── BUILD MESSAGES ──────────────────────────────────────────────────────
    // Batasi history ke 6 pesan — lebih banyak konteks untuk closing yang lebih baik
    const recentHistory = history.slice(-6);
    const messages = [
      { role: "system", content: systemPrompt },
      ...recentHistory.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        max_tokens: 400,
        temperature: 0.65, // sedikit lebih rendah = lebih konsisten dan fokus
      }),
    });

    let reply = "";

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("Groq error:", groqRes.status, err);

      // Fallback ke Anthropic API kalau Groq gagal
      const anthropicKey = process.env.ANTHROPIC_API_KEY || "";
      if (anthropicKey) {
        try {
          const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": anthropicKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 400,
              system: messages[0].content,
              messages: messages.slice(1),
            }),
          });
          if (claudeRes.ok) {
            const cd = await claudeRes.json();
            reply = cd.content?.[0]?.text || "";
          }
        } catch (e) {
          console.error("Claude fallback error:", e);
        }
      }

      if (!reply) {
        return NextResponse.json({
          reply: `Maaf, koneksi bermasalah. Langsung aja chat WA kami ya! 👉 wa.me/${waNumber}`,
          botName: namaBot,
          waNumber,
        });
      }
    } else {
      const data = await groqRes.json();
      reply = data.choices?.[0]?.message?.content || "Maaf, tidak ada jawaban.";
    }

    // Hapus thinking tags dari model reasoning jika ada
    reply = reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // ─── CARI PRODUK YANG RELEVAN UNTUK DITAMPILKAN DI CHAT ──────────────────
    // Deteksi nama produk yang disebut di pesan user — harus spesifik, bukan hanya brand
    const msgLower = message.toLowerCase();
    // Ambil semua kata dari pesan user yang panjangnya >= 3, kecuali kata umum
    const stopWords = new Set(["ada","yang","mana","apa","bisa","mau","cari","ingin","tolong","halo","hai","harga","berapa","stok","masih","untuk","sama","dengan","atau","dan","ini","itu","saja","dong","deh","kak","pak","bu"]);
    const words = msgLower.split(/\s+/).filter(w => w.length >= 3 && !stopWords.has(w));

    // Brand-brand yang kalau disebut sendiri sudah cukup spesifik (1 kata = boleh tampil)
    const brandSpesifik = new Set(["iphone","ipad","samsung","xiaomi","realme","oppo","vivo","infinix","tecno","redmi","poco","nubia","nokia","sony","asus","huawei","honor","motorola","itel"]);
    const adaBrandSpesifik = words.some(w => brandSpesifik.has(w));

    // Hitung skor kecocokan — produk dengan lebih banyak kata yang cocok = lebih relevan
    const scored = kasirProduk.map(p => {
      const namaProduk = (p.nama || "").toLowerCase();
      const matchCount = words.filter(w => namaProduk.includes(w)).length;
      return { p, matchCount };
    }).filter(x => adaBrandSpesifik ? x.matchCount >= 1 : x.matchCount >= 2)
      .sort((a, b) => b.matchCount - a.matchCount);

    const produkSorot = scored.slice(0, 3).map(({ p }) => ({
      id: p.id,
      nama: p.nama,
      harga: Number(p.harga_jual || 0),
      kondisi: p.kondisi || "Baru",
      stok: Number(p.stok || 0),
      foto: p.foto || null,
      ram: p.ram || null,
      rom: p.rom || null,
    }));

    return NextResponse.json({ reply, botName: namaBot, greeting: pesanWillcome, waNumber, produkSorot: produkSorot.length > 0 ? produkSorot : undefined });

  } catch(e) {
    console.error("Chat error:", e);
    return NextResponse.json({ reply: "Error: " + e.message, botName: "Asisten PontiCell", waNumber: "6283808484969" });
  }
}
