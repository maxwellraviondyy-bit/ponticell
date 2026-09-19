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
  
  // For info_, robot_, brand_ keys: upsert by kunci (these are unique settings)
  // For banner_desktop_, banner_mobile_: always insert new (each upload is unique)
  const isUnique = b.kunci.startsWith("info_") || b.kunci.startsWith("robot_") || b.kunci.startsWith("brand_") || b.kunci.startsWith("cabang_");
  
  if (isUnique) {
    // Upsert - update if exists, insert if not
    const existing = await sql`SELECT id FROM konten WHERE kunci = ${b.kunci} LIMIT 1`;
    if (existing.length > 0) {
      await sql`UPDATE konten SET nilai = ${b.nilai}, urutan = ${b.urutan || 0} WHERE kunci = ${b.kunci}`;
    } else {
      await sql`INSERT INTO konten (id, kategori, kunci, nilai, urutan, created_at) VALUES (${Date.now()}, ${b.kategori}, ${b.kunci}, ${b.nilai}, ${b.urutan || 0}, ${new Date().toISOString()})`;
    }
  } else {
    // Always insert new (for banners)
    await sql`INSERT INTO konten (id, kategori, kunci, nilai, urutan, created_at) VALUES (${Date.now()}, ${b.kategori}, ${b.kunci}, ${b.nilai}, ${b.urutan || 0}, ${new Date().toISOString()})`;
  }
  
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const sql = getDb();
  const { id } = await req.json();
  await sql`DELETE FROM konten WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}
