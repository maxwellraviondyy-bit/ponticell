import { NextResponse } from "next/server";

// Debug v3 - cek Groq key validity + test berbagai model
export async function GET() {
  const groqKey = process.env.GROQ_API_KEY || "";
  const orKey = process.env.OPENROUTER_API_KEY || "";

  const result = {
    env: {
      groqKey: groqKey ? `ada (${groqKey.length} chars, starts: ${groqKey.slice(0,8)}...)` : "TIDAK ADA",
      orKey: orKey ? `ada (${orKey.length} chars, starts: ${orKey.slice(0,10)}...)` : "TIDAK ADA",
    },
    groqModelsAvailable: null,
    groqTest: null,
    orTest: null,
  };

  // Cek daftar model Groq yang tersedia dengan key ini
  if (groqKey) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { "Authorization": `Bearer ${groqKey}` },
      });
      if (r.ok) {
        const d = await r.json();
        result.groqModelsAvailable = d.data?.map(m => m.id).slice(0, 10);
      } else {
        const t = await r.text();
        result.groqModelsAvailable = `ERROR ${r.status}: ${t.slice(0,200)}`;
      }
    } catch(e) {
      result.groqModelsAvailable = `CATCH: ${e.message}`;
    }
  }

  // Test Groq llama-3.3-70b-versatile (pasti ada)
  if (groqKey) {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: "Jawab satu kata: Halo" }],
          max_tokens: 10,
        }),
        signal: ctrl.signal,
      });
      const text = await r.text();
      if (r.ok) {
        const d = JSON.parse(text);
        result.groqTest = { model: "llama-3.3-70b-versatile", status: r.status, ok: true, reply: d?.choices?.[0]?.message?.content };
      } else {
        result.groqTest = { model: "llama-3.3-70b-versatile", status: r.status, ok: false, error: text.slice(0, 300) };
      }
    } catch (e) {
      result.groqTest = { ok: false, error: e.message };
    }
  }

  // Test OpenRouter - coba beberapa model gratis
  if (orKey) {
    const orModels = [
      "meta-llama/llama-3.2-3b-instruct:free",
      "google/gemma-3-4b-it:free",
      "mistralai/mistral-7b-instruct:free",
    ];
    for (const model of orModels) {
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
            model,
            messages: [{ role: "user", content: "Jawab satu kata: Halo" }],
            max_tokens: 10,
          }),
          signal: ctrl.signal,
        });
        const text = await r.text();
        if (r.ok) {
          const d = JSON.parse(text);
          result.orTest = { model, status: r.status, ok: true, reply: d?.choices?.[0]?.message?.content };
          break;
        } else {
          result.orTest = { model, status: r.status, ok: false, error: text.slice(0, 200) };
        }
      } catch (e) {
        result.orTest = { model, ok: false, error: e.message };
      }
    }
  }

  return NextResponse.json(result, { status: 200 });
}
