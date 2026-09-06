import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM ref_harga ORDER BY brand ASC`;
  return NextResponse.json(rows);
}

export async function POST(req) {
  const sql = getDb();
  const b = await req.json();
  await sql`
    INSERT INTO ref_harga (id,brand,model,ram,storage,kode,created_by)
    VALUES (${b.id},${b.brand},${b.model},${b.ram},${b.storage},${b.kode},${b.created_by})
  `;
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const sql = getDb();
  const b = await req.json();
  await sql`UPDATE ref_harga SET brand=${b.brand},model=${b.model},ram=${b.ram},storage=${b.storage},kode=${b.kode} WHERE id=${b.id}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const sql = getDb();
  const { id } = await req.json();
  await sql`DELETE FROM ref_harga WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}
