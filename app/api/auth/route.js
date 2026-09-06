import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  const sql = getDb();
  const { username, password } = await req.json();
  const rows = await sql`
    SELECT username, role, name, branch FROM users
    WHERE username=${username.trim().toLowerCase()}
    AND password=${password}
    LIMIT 1
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  return NextResponse.json(rows[0]);
}