import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req) {
  try {
    const { message, history = [] } = await req.json();
    const sql = getDb();

    // Fetch products and robot settings in parallel
    const [products, robotSettings] = await Promise.all([
      sql`SELECT brand, model, ram, storage, color, condition, sell_price, stocks, type FROM inventory ORDER BY created_at DESC`,
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

    // Parse products
    const parseStocks = (s) => typeof s === "string" ? JSON.parse(s) : (s || {});
    const availableProducts = products
      .map(p => ({ ...p, stocks: parseStocks(p.stocks) }))
      .filter(p => Object.values(p.stocks).reduce((s, v) => s + v, 0) > 0);

    const productList = availableProducts.map(p =>
      `- ${p.brand} ${p.model} | RAM: ${p.ram} | Storage: ${p.storage} | Warna: ${p.color} | Kondisi: ${p.condition} | Harga: Rp ${Number(p.sell_price).toLocaleString("id-ID")}`
    ).join("\n");

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

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message }
    ];

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages,
        max_tokens: 500,
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
