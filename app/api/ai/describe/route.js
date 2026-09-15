import { NextResponse } from "next/server";

export async function POST(req) {
  const { brand, model, ram, storage, color, condition, sell_price, type } = await req.json();

  const prompt = `Buatkan deskripsi produk singkat untuk toko HP di Pontianak.

Produk: ${brand} ${model}
Tipe: ${type === "hp" ? "Smartphone" : "Tablet"}
RAM: ${ram}
Storage: ${storage}
Warna: ${color}
Kondisi: ${condition}
Harga: Rp ${Number(sell_price).toLocaleString("id-ID")}

Buat deskripsi 2-3 kalimat yang menarik, informatif, dan persuasif dalam Bahasa Indonesia. 
Fokus pada keunggulan produk dan cocok untuk siapa. Jangan tambahkan harga dalam deskripsi.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const description = data.content?.[0]?.text || "";

  return NextResponse.json({ description });
}
