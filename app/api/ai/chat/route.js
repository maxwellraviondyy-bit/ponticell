import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req) {
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
    `- ${p.brand} ${p.model} | RAM: ${p.ram} | Storage: ${p.storage} | Warna: ${p.color} | Kondisi: ${p.condition} | Harga: Rp ${Number(p.sell_price).toLocaleString("id-ID")} | Tipe: ${p.type}`
  ).join("\n");

  const systemPrompt = `Kamu adalah asisten toko PontiCell, toko HP dan Tablet terpercaya di Pontianak. Tugasmu membantu pembeli memilih produk yang tepat.

STOK PRODUK TERSEDIA:
${productList || "Stok sedang kosong."}

PANDUAN:
- Jawab dalam Bahasa Indonesia yang ramah dan santai
- Rekomendasikan produk berdasarkan kebutuhan pembeli
- Format harga: Rp XX.XXX.XXX
- Jika tidak ada yang cocok, sarankan yang terdekat
- Selalu akhiri dengan ajakan chat WhatsApp ke 6283808484969
- Jawaban singkat maksimal 150 kata
- Jangan sebut produk yang tidak ada di stok`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: "user", content: message }
  ];

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "Maaf, saya tidak bisa menjawab saat ini. Silakan chat ke WhatsApp kami di 6283808484969.";

  return NextResponse.json({ reply });
}
