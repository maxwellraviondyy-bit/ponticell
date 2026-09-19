import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  try {
    await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS original_price bigint DEFAULT 0`;
    return NextResponse.json({ ok: true, message: "Migration done: original_price column added" });
  } catch(e) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
