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

  const prompt = `Kamu adalah analis bisnis untuk toko PontiCell di Pontianak.

DATA PENJUALAN (100 transaksi terakhir):
${salesSummary || "Belum ada data penjualan."}

STOK SAAT INI:
${invSummary || "Stok kosong."}

Pertanyaan dari pemilik toko: "${question}"

Jawab dengan analisis yang jelas, pakai poin-poin jika perlu, dan berikan rekomendasi actionable. Gunakan Bahasa Indonesia. Maksimal 200 kata.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const analysis = data.content?.[0]?.text || "Gagal menganalisis data.";

  return NextResponse.json({ analysis });
}
