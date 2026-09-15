import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  try {
    const rows = await sql`SELECT * FROM konten WHERE kategori = 'robot' ORDER BY kunci`;
    return NextResponse.json(rows);
  } catch { return NextResponse.json([]); }
}

export async function POST(req) {
  const sql = getDb();
  const { kunci, nilai } = await req.json();
  await sql`
    INSERT INTO konten (id, kategori, kunci, nilai, urutan, created_at)
    VALUES (${Date.now()}, 'robot', ${kunci}, ${nilai}, 0, ${new Date().toISOString()})
    ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai
  `;
  return NextResponse.json({ ok: true });
}
