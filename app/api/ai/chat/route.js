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
        ? fetch(`${kasirUrl}/api/storefront`, { headers: { "x-storefront-key": kasirKey }, cache: "no-store" }).then(r => r.json()).catch(() => ({ produk: [] }))
        : Promise.resolve({ produk: [] }),
      sql`SELECT kunci, nilai FROM konten WHERE kategori = 'robot'`,
    ]);

    // Parse robot settings
    const settings = {};
    robotSettings.forEach(r => { settings[r.kunci] = r.nilai; });

    const namaBot = settings.robot_nama || "Asisten PontiCell";
    const gayaBahasa = settings.robot_gaya || "santai";
    const pesanWillcome = settings.robot_salam || "";
    const instruksi = settings.robot_instruksi || "";
    const promo = settings.robot_promo || "";
    const larangan = settings.robot_larangan || "";

    // Produk dari kasir — format ringkas supaya tidak melebihi rate limit token
    const kasirProduk = kasirRes.produk || [];
    const productList = kasirProduk.map(p => {
      const harga = Math.round(Number(p.harga_jual) / 1000) + "rb";
      const ram = p.ram ? `${p.ram}` : "";
      const rom = p.rom ? `/${p.rom}` : "";
      const cond = p.kondisi === "Baru" ? "B" : "Bks";
      return `${p.nama}${ram ? ` ${ram}${rom}` : ""} ${cond} ${harga}`;
    }).join(", ");

    // Build system prompt from settings
    const gayaInstruksi = {
      santai: "Gunakan bahasa Indonesia yang ramah, santai, dan bersahabat. Boleh pakai kata 'kamu', 'aku'.",
      formal: "Gunakan bahasa Indonesia yang formal dan profesional. Pakai 'Anda' dan 'Saya'.",
      gaul: "Gunakan bahasa gaul yang kekinian tapi tetap sopan. Boleh pakai emoji sesekali.",
    }[gayaBahasa] || "Gunakan bahasa Indonesia yang ramah.";

    const systemPrompt = `Kamu adalah ${namaBot}, asisten toko PontiCell di Pontianak.

GAYA BAHASA: ${gayaInstruksi}

PRODUK TERSEDIA:
${productList || "Stok sedang kosong."}

${promo ? `PROMO & KEUNGGULAN TOKO:\n${promo}\n` : ""}
${instruksi ? `INSTRUKSI KHUSUS:\n${instruksi}\n` : ""}
${larangan ? `YANG TIDAK BOLEH DIJAWAB/DILAKUKAN:\n${larangan}\n` : ""}

ATURAN UMUM:
- Jawab singkat dan padat (maksimal 150 kata)
- Rekomendasikan produk yang sesuai kebutuhan dan budget pembeli
- Jika tidak ada produk yang cocok, sarankan yang terdekat
- Selalu akhiri dengan ajakan chat WhatsApp ke 6283808484969
- Jangan sebut produk yang tidak ada di stok`;

    // Batasi history ke 4 pesan terakhir supaya tidak over token limit
    const recentHistory = history.slice(-4);
    const messages = [
      { role: "system", content: systemPrompt },
      ...recentHistory.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message }
    ];

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("Groq error:", groqRes.status, err);
      return NextResponse.json({ reply: "Maaf, saya sedang tidak bisa menjawab. Silakan chat WhatsApp kami di 6283808484969.", botName: namaBot });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || "Maaf, tidak ada jawaban.";
    return NextResponse.json({ reply, botName: namaBot, greeting: pesanWillcome });

  } catch(e) {
    console.error("Chat error:", e);
    return NextResponse.json({ reply: "Error: " + e.message, botName: "Asisten PontiCell" });
  }
}
