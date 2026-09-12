import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const wa = searchParams.get("wa")?.replace(/[^0-9]/g, "") || "";

  if (!wa || wa.length < 9) {
    return NextResponse.json([]);
  }

  // Match berbagai format: 08xx, 628xx, 8xx
  const formats = [wa, "0" + wa.slice(2), "62" + wa.slice(1), wa.replace(/^0/, "62"), wa.replace(/^62/, "0")];
  const unique = [...new Set(formats)];

  const rows = await sql`
    SELECT * FROM pesanan 
    WHERE whatsapp = ANY(${unique})
    ORDER BY created_at DESC
  `;

  return NextResponse.json(rows);
}
