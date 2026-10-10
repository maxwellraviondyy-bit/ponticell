import { NextResponse } from "next/server";
export async function GET() {
  const groqKey = process.env.GROQ_API_KEY || "";
  const orKey = process.env.OPENROUTER_API_KEY || "";
  const result = { groqTest: null, orTest: null };

  if (groqKey) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
        body: JSON.stringify({ model: "openai/gpt-oss-20b", messages: [{ role: "user", content: "Halo" }], max_tokens: 10 }),
        signal: AbortSignal.timeout(8000),
      });
      const text = await r.text();
      result.groqTest = r.ok ? { ok: true, reply: JSON.parse(text)?.choices?.[0]?.message?.content } : { ok: false, status: r.status, error: text.slice(0,200) };
    } catch(e) { result.groqTest = { ok: false, error: e.message }; }
  }

  if (orKey) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${orKey}`, "HTTP-Referer": "https://ponticell.vercel.app" },
        body: JSON.stringify({ model: "google/gemma-3-4b-it:free", messages: [{ role: "user", content: "Halo" }], max_tokens: 10 }),
        signal: AbortSignal.timeout(8000),
      });
      const text = await r.text();
      result.orTest = r.ok ? { ok: true, reply: JSON.parse(text)?.choices?.[0]?.message?.content } : { ok: false, status: r.status, error: text.slice(0,200) };
    } catch(e) { result.orTest = { ok: false, error: e.message }; }
  }

  return NextResponse.json(result);
}
