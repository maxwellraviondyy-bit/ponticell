import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // env vars yang diawali NEXT_PUBLIC_ otomatis tersedia di browser.
  // Tapi supaya bisa dibaca di Server Component (page.js) tanpa prefix,
  // kita expose juga versi server-nya lewat env di sini.
  // Nilai aslinya diset di Vercel environment variables.
  env: {
    // Server-side (page.js): KASIR_KP_URL dan KASIR_KP_KEY
    // Client-side (App.jsx tab foto-produk): NEXT_PUBLIC_KASIR_KP_URL
    // Keduanya diset di Vercel → Settings → Environment Variables
  },
};

export default nextConfig;
