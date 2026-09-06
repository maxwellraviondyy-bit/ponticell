import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM testimoni ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(req) {
  const sql = getDb();
  const body = await req.json();
  const rows = Array.isArray(body) ? body : [body];
  for (const r of rows) {
    await sql`INSERT INTO testimoni (foto,keterangan,created_at) VALUES (${r.foto},${r.keterangan},${new Date().toISOString()})`;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const sql = getDb();
  const { id } = await req.json();
  await sql`DELETE FROM testimoni WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}
