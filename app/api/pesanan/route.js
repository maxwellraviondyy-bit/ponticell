import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM pesanan ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(req) {
  const sql = getDb();
  const b = await req.json();
  await sql`
    INSERT INTO pesanan (id, nama, whatsapp, alamat, kota, produk_id, produk_nama, produk_harga, catatan, status, created_at)
    VALUES (${Date.now()}, ${b.nama}, ${b.whatsapp}, ${b.alamat}, ${b.kota}, ${b.produk_id}, ${b.produk_nama}, ${b.produk_harga}, ${b.catatan||""}, ${"pending"}, ${new Date().toISOString()})
  `;
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const sql = getDb();
  const { id, status } = await req.json();
  await sql`UPDATE pesanan SET status=${status} WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}
