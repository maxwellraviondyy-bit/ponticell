import { NextResponse } from "next/server";

// Debug v4 - test semua model Groq yang tersedia + OpenRouter
export async function GET() {
  const groqKey = process.env.GROQ_API_KEY || "";
  const orKey = process.env.OPENROUTER_API_KEY || "";

  const result = {
    env: {
      groqKey: groqKey ? `ada (${groqKey.length} chars, starts: ${groqKey.slice(0,8)}...)` : "TIDAK ADA",
      orKey: orKey ? `ada (${orKey.length} chars, starts: ${orKey.slice(0,10)}...)` : "TIDAK ADA",
    },
    groqModelsAvailable: null,
    groqTests: [],
    orTests: [],
  };

  // Cek daftar model Groq yang tersedia
  if (groqKey) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { "Authorization": `Bearer ${groqKey}` },
      });
      if (r.ok) {
        const d = await r.json();
        result.groqModelsAvailable = d.data?.map(m => m.id);
      } else {
        const t = await r.text();
        result.groqModelsAvailable = `ERROR ${r.status}: ${t.slice(0,200)}`;
      }
    } catch(e) {
      result.groqModelsAvailable = `CATCH: ${e.message}`;
    }
  }

  // Test setiap model Groq yang bisa chat (bukan whisper/guard)
  if (groqKey && Array.isArray(result.groqModelsAvailable)) {
    const chatModels = result.groqModelsAvailable.filter(m =>
      !m.includes("whisper") && !m.includes("guard") && !m.includes("safeguard")
    ).slice(0, 5);

    for (const model of chatModels) {
      try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 6000);
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: "Jawab satu kata: Halo" }],
            max_tokens: 20,
          }),
          signal: ctrl.signal,
        });
        const text = await r.text();
        if (r.ok) {
          const d = JSON.parse(text);
          const content = d?.choices?.[0]?.message?.content;
          const finishReason = d?.choices?.[0]?.finish_reason;
          result.groqTests.push({ model, status: r.status, ok: true, reply: content, finishReason, hasContent: !!content });
        } else {
          result.groqTests.push({ model, status: r.status, ok: false, error: text.slice(0, 200) });
        }
      } catch (e) {
        result.groqTests.push({ model, ok: false, error: e.message });
      }
    }
  }

  // Test OpenRouter - coba beberapa model
  if (orKey) {
    const orModels = [
      "google/gemma-3-4b-it",
      "google/gemma-3-4b-it:free",
      "meta-llama/llama-3.2-3b-instruct:free",
      "mistralai/mistral-7b-instruct:free",
      "qwen/qwen-2.5-7b-instruct:free",
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
            max_tokens: 20,
          }),
          signal: ctrl.signal,
        });
        const text = await r.text();
        if (r.ok) {
          const d = JSON.parse(text);
          const content = d?.choices?.[0]?.message?.content;
          result.orTests.push({ model, status: r.status, ok: true, reply: content, hasContent: !!content });
          break;
        } else {
          result.orTests.push({ model, status: r.status, ok: false, error: text.slice(0, 200) });
        }
      } catch (e) {
        result.orTests.push({ model, ok: false, error: e.message });
      }
    }
  }

  return NextResponse.json(result, { status: 200 });
}
