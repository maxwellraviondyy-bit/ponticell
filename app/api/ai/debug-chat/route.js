import { NextResponse } from "next/server";

// Debug v2 - test model baru
export async function GET() {
  const groqKey = process.env.GROQ_API_KEY || "";
  const orKey = process.env.OPENROUTER_API_KEY || "";

  const result = {
    env: {
      groqKey: groqKey ? `ada (${groqKey.length} chars, starts: ${groqKey.slice(0,8)}...)` : "TIDAK ADA",
      orKey: orKey ? `ada (${orKey.length} chars, starts: ${orKey.slice(0,10)}...)` : "TIDAK ADA",
    },
    groqTest: null,
    orTest: null,
    chatRouteModel: "llama-3.1-8b-instant (baru)",
  };

  // Test Groq dengan model BARU
  if (groqKey) {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: "Jawab satu kata: Halo" }],
          max_tokens: 10,
        }),
        signal: ctrl.signal,
      });
      const text = await r.text();
      if (r.ok) {
        const d = JSON.parse(text);
        result.groqTest = { status: r.status, ok: true, reply: d?.choices?.[0]?.message?.content };
      } else {
        result.groqTest = { status: r.status, ok: false, error: text.slice(0, 300) };
      }
    } catch (e) {
      result.groqTest = { ok: false, error: e.message };
    }
  }

  // Test OpenRouter model BARU
  if (orKey) {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${orKey}`,
          "HTTP-Referer": "https://ponticell.vercel.app",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.2-3b-instruct:free",
          messages: [{ role: "user", content: "Jawab satu kata: Halo" }],
          max_tokens: 10,
        }),
        signal: ctrl.signal,
      });
      const text = await r.text();
      if (r.ok) {
        const d = JSON.parse(text);
        result.orTest = { status: r.status, ok: true, reply: d?.choices?.[0]?.message?.content };
      } else {
        result.orTest = { status: r.status, ok: false, error: text.slice(0, 300) };
      }
    } catch (e) {
      result.orTest = { ok: false, error: e.message };
    }
  }

  return NextResponse.json(result, { status: 200 });
}
