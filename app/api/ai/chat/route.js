import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req) {
  const { message, history = [] } = await req.json();
  const sql = getDb();

  // Ambil semua produk dari database
  const products = await sql`
    SELECT brand, model, ram, storage, color, condition, sell_price, stocks, type
    FROM inventory
    ORDER BY created_at DESC
  `;

  const parseStocks = (s) => typeof s === "string" ? JSON.parse(s) : (s || {});
  const availableProducts = products
    .map(p => ({ ...p, stocks: parseStocks(p.stocks) }))
    .filter(p => Object.values(p.stocks).reduce((s, v) => s + v, 0) > 0);

  const productList = availableProducts.map(p =>
    `- ${p.brand} ${p.model} | RAM: ${p.ram} | Storage: ${p.storage} | Warna: ${p.color} | Kondisi: ${p.condition} | Harga: Rp ${Number(p.sell_price).toLocaleString("id-ID")} | Tipe: ${p.type}`
  ).join("\n");

  const systemPrompt = `Kamu adalah asisten toko PontiCell, toko HP dan Tablet terpercaya di Pontianak. Tugasmu membantu pembeli memilih produk yang tepat.

STOK PRODUK TERSEDIA SAAT INI:
${productList || "Stok sedang kosong."}

PANDUAN:
- Jawab dalam Bahasa Indonesia yang ramah dan santai
- Rekomendasikan produk berdasarkan kebutuhan pembeli (budget, kegunaan, preferensi)
- Jika ditanya harga, sebutkan dengan format "Rp XX.XXX.XXX"
- Jika tidak ada produk yang cocok, sarankan produk terdekat
- Selalu akhiri dengan ajakan untuk chat WhatsApp ke 6283808484969 jika ingin pesan
- Jawaban singkat, padat, dan to the point (maksimal 150 kata)
- Jangan sebut produk yang tidak ada di stok`;

  const messages = [
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: "user", content: message }
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: systemPrompt,
      messages,
    }),
  });

  const data = await response.json();
  const reply = data.content?.[0]?.text || "Maaf, saya tidak bisa menjawab saat ini. Silakan chat langsung ke WhatsApp kami.";

  return NextResponse.json({ reply });
}
