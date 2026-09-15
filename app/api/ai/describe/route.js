import { NextResponse } from "next/server";

export async function POST(req) {
  const { brand, model, ram, storage, color, condition, sell_price, type } = await req.json();

  const messages = [
    {
      role: "system",
      content: "Kamu adalah copywriter toko HP. Buat deskripsi produk singkat 2-3 kalimat dalam Bahasa Indonesia yang menarik dan persuasif. Jangan cantumkan harga."
    },
    {
      role: "user",
      content: `Buat deskripsi untuk: ${brand} ${model}, Tipe: ${type === "hp" ? "Smartphone" : "Tablet"}, RAM: ${ram}, Storage: ${storage}, Warna: ${color}, Kondisi: ${condition}`
    }
  ];

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages,
      max_tokens: 200,
      temperature: 0.8,
    }),
  });

  const data = await response.json();
  const description = data.choices?.[0]?.message?.content || "";
  return NextResponse.json({ description });
}
