// app/api/produk-meta/route.js
// Menyimpan foto & deskripsi tambahan untuk produk yang stoknya dari kasir.
// GET  → ambil semua meta (atau filter by kasir_url)
// POST → simpan/update meta (upsert by kasir_url + kasir_id)

import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const kasirUrl = searchParams.get("kasir_url");

  const rows = kasirUrl
    ? await sql`SELECT * FROM kasir_produk_meta WHERE kasir_url = ${kasirUrl} ORDER BY kasir_id`
    : await sql`SELECT * FROM kasir_produk_meta ORDER BY kasir_url, kasir_id`;

  return NextResponse.json(rows);
}

export async function POST(req) {
  const sql = getDb();
  const { kasir_url, kasir_id, photos, deskripsi } = await req.json();

  if (!kasir_url || !kasir_id) {
    return NextResponse.json({ error: "kasir_url dan kasir_id wajib diisi." }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO kasir_produk_meta (kasir_url, kasir_id, photos, deskripsi, updated_at)
    VALUES (${kasir_url}, ${kasir_id}, ${JSON.stringify(photos || [])}, ${deskripsi || ""}, ${new Date().toISOString()})
    ON CONFLICT (kasir_url, kasir_id) DO UPDATE SET
      photos = EXCLUDED.photos,
      deskripsi = EXCLUDED.deskripsi,
      updated_at = EXCLUDED.updated_at
    RETURNING *
  `;

  return NextResponse.json({ ok: true, meta: rows[0] });
}
