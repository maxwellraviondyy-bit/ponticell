import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req) {
  const { question } = await req.json();
  const sql = getDb();

  const [sales, inventory] = await Promise.all([
    sql`SELECT * FROM sales_log ORDER BY date DESC LIMIT 100`,
    sql`SELECT brand, model, ram, storage, sell_price, type FROM inventory`,
  ]);

  const salesSummary = sales.map(s =>
    `${s.date} | ${s.brand} ${s.model} | ${s.ram}/${s.storage} | Rp ${Number(s.sell_price || 0).toLocaleString("id-ID")} | Cabang: ${s.branch || "-"}`
  ).join("\n");

  const invSummary = inventory.map(i =>
    `${i.brand} ${i.model} ${i.ram}/${i.storage} - Rp ${Number(i.sell_price).toLocaleString("id-ID")}`
  ).join("\n");

  const messages = [
    {
      role: "system",
      content: `Kamu adalah analis bisnis untuk toko PontiCell di Pontianak. Jawab dengan analisis jelas dan rekomendasi actionable dalam Bahasa Indonesia. Maksimal 200 kata.\n\nDATA PENJUALAN:\n${salesSummary || "Belum ada data."}\n\nSTOK:\n${invSummary || "Kosong."}`
    },
    { role: "user", content: question }
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
      max_tokens: 400,
      temperature: 0.5,
    }),
  });

  const data = await response.json();
  const analysis = data.choices?.[0]?.message?.content || "Gagal menganalisis.";
  return NextResponse.json({ analysis });
}
