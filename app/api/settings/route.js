import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const rows = await sql`SELECT value FROM settings WHERE key=${key} LIMIT 1`;
  return NextResponse.json(rows[0] || null);
}

export async function POST(req) {
  const sql = getDb();
  const { key, value } = await req.json();
  await sql`
    INSERT INTO settings (key, value) VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value
  `;
  return NextResponse.json({ ok: true });
}
