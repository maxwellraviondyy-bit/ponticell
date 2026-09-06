import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM konten ORDER BY kategori, urutan`;
  return NextResponse.json(rows);
}

export async function POST(req) {
  const sql = getDb();
  const b = await req.json();
  await sql`
    INSERT INTO konten (id, kategori, kunci, nilai, urutan, created_at)
    VALUES (${Date.now()}, ${b.kategori}, ${b.kunci}, ${b.nilai}, ${b.urutan || 0}, ${new Date().toISOString()})
    ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai, urutan = EXCLUDED.urutan
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const sql = getDb();
  const { id } = await req.json();
  await sql`DELETE FROM konten WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}
