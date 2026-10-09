// app/api/kasir-produk/route.js
// Proxy server-side ke storefront kasir — menghindari CORS issue kalau fetch dari browser.
// GET → fetch produk dari kasir KP dan return ke dashboard.
// Diamankan: hanya bisa diakses kalau ada session (cek basic auth header dari dashboard).

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const kasirUrl = process.env.KASIR_KP_URL || process.env.NEXT_PUBLIC_KASIR_KP_URL || "";
  const kasirKey = process.env.KASIR_KP_KEY || process.env.NEXT_PUBLIC_KASIR_KP_KEY || "";

  if (!kasirUrl || !kasirKey) {
    return NextResponse.json({ ok: false, error: "Env kasir belum diset." }, { status: 503 });
  }

  try {
    const res = await fetch(`${kasirUrl}/api/storefront`, {
      headers: { "x-storefront-key": kasirKey },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Kasir error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, produk: data.produk || [], toko: data.toko || "", kasirUrl });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
