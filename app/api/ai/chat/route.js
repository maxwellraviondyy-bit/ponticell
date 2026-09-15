import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req) {
  try {
    const { message, history = [] } = await req.json();
    const sql = getDb();

    const products = await sql`
      SELECT brand, model, ram, storage, color, condition, sell_price, stocks, type
      FROM inventory ORDER BY created_at DESC
    `;

    const parseStocks = (s) => typeof s === "string" ? JSON.parse(s) : (s || {});
    const availableProducts = products
      .map(p => ({ ...p, stocks: parseStocks(p.stocks) }))
      .filter(p => Object.values(p.stocks).reduce((s, v) => s + v, 0) > 0);

    const productList = availableProducts.map(p =>
      `- ${p.brand} ${p.model} | RAM: ${p.ram} | Storage: ${p.storage} | Kondisi: ${p.condition} | Harga: Rp ${Number(p.sell_price).toLocaleString("id-ID")}`
    ).join("\n");

    const systemPrompt = `Kamu adalah asisten toko PontiCell di Pontianak. Bantu pembeli pilih HP/Tablet.
STOK: ${productList || "Kosong."}
Jawab singkat bahasa Indonesia, ramah, max 150 kata. Akhiri dengan ajakan WA ke 6283808484969.`;

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
        model: "llama3-70b-8192",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("Groq error:", groqRes.status, err);
      return NextResponse.json({ reply: `Error ${groqRes.status}: ${err}` });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || "Tidak ada jawaban.";
    return NextResponse.json({ reply });

  } catch(e) {
    console.error("Chat error:", e);
    return NextResponse.json({ reply: "Error: " + e.message });
  }
}
