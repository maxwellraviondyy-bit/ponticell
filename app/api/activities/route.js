import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM activities ORDER BY time DESC`;
  return NextResponse.json(rows);
}

export async function POST(req) {
  const sql = getDb();
  const b = await req.json();
  await sql`
    INSERT INTO activities (id,time,type,item,branch,qty,notes,sold_at_branch_name,is_cod,cancelled,cancelled_at,cancelled_by,edited_by)
    VALUES (${b.id},${b.time},${b.type},${b.item},${b.branch},${b.qty},${b.notes},${b.sold_at_branch_name||null},${b.is_cod||false},${b.cancelled||false},${b.cancelled_at||null},${b.cancelled_by||null},${b.edited_by||null})
  `;
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const sql = getDb();
  const b = await req.json();
  await sql`
    UPDATE activities SET
      cancelled=${b.cancelled}, cancelled_at=${b.cancelled_at||null}, cancelled_by=${b.cancelled_by||null}
    WHERE id=${b.id}
  `;
  return NextResponse.json({ ok: true });
}
