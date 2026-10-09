import { NextResponse } from "next/server";

// Endpoint ringan khusus AI Insight halaman detail produk.
// Tidak memuat daftar produk kasir — hanya analisis 1 produk.
// Jauh lebih hemat token dan tidak kena ITPM rate limit.
export async function POST(req) {
  try {
    const { brand, model, ram, storage, condition, price } = await req.json();

    const harga = price ? `Rp ${Number(price).toLocaleString("id-ID")}` : "";
    const spek = [ram && ram !== "-" ? `RAM ${ram}` : "", storage && storage !== "-" ? storage : ""].filter(Boolean).join("/");

    const prompt = `${brand} ${model}${spek ? " " + spek : ""} kondisi ${condition}${harga ? " harga " + harga : ""}. Cocok untuk siapa dan apa kelebihannya? Jawab 2 kalimat singkat bahasa Indonesia.`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [
          { role: "system", content: "Kamu asisten toko HP. Jawab singkat dan padat dalam bahasa Indonesia." },
          { role: "user", content: prompt },
        ],
        max_tokens: 120,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      console.error("Groq insight error:", res.status, await res.text());
      return NextResponse.json({ reply: "" });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "";
    return NextResponse.json({ reply });

  } catch (e) {
    console.error("Insight error:", e);
    return NextResponse.json({ reply: "" });
  }
}
