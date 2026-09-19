import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  const banners = await sql`SELECT id, kategori, kunci, LEFT(nilai, 50) as nilai_preview, urutan, created_at FROM konten WHERE kategori LIKE 'banner%' ORDER BY created_at DESC LIMIT 20`;
  const tableInfo = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'konten'`;
  const constraints = await sql`SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'konten'`;
  return NextResponse.json({ banners, columns: tableInfo, constraints });
}
