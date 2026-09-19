import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

const WA_ADMIN = "6283808484969";
const formatRp = (n) => "Rp " + Number(n).toLocaleString("id-ID");

export async function GET() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM pesanan ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(req) {
  const sql = getDb();
  const b = await req.json();
  const id = Date.now();
  const noNota = "PCL-" + String(id).slice(-6);

  await sql`
    INSERT INTO pesanan (id, nama, whatsapp, alamat, kota, produk_id, produk_nama, produk_harga, catatan, status, created_at)
    VALUES (${id}, ${b.nama}, ${b.whatsapp}, ${b.alamat}, ${b.kota}, ${b.produk_id}, ${b.produk_nama}, ${b.produk_harga}, ${b.catatan||""}, 'pending', ${new Date().toISOString()})
  `;

  // Send WA notification to admin via wa.me link (stored for reference)
  // The actual WA notification happens client-side after this response
  
  return NextResponse.json({ ok: true, id, noNota });
}

export async function PUT(req) {
  const sql = getDb();
  const { id, status } = await req.json();
  await sql`UPDATE pesanan SET status=${status} WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const sql = getDb();
  const { id } = await req.json();
  await sql`DELETE FROM pesanan WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}
