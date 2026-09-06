import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM inventory ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(req) {
  const sql = getDb();
  const b = await req.json();
  await sql`
    INSERT INTO inventory (id,type,brand,model,ram,storage,color,imei,condition,buy_price,sell_price,notes,photos,stocks,created_at)
    VALUES (${b.id},${b.type},${b.brand},${b.model},${b.ram},${b.storage},${b.color},${b.imei},${b.condition},${b.buy_price},${b.sell_price},${b.notes},${JSON.stringify(b.photos)},${JSON.stringify(b.stocks)},${b.created_at||new Date().toISOString()})
  `;
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const sql = getDb();
  const b = await req.json();
  await sql`
    UPDATE inventory SET
      brand=${b.brand}, model=${b.model}, ram=${b.ram}, storage=${b.storage},
      color=${b.color}, imei=${b.imei}, condition=${b.condition},
      buy_price=${b.buy_price}, sell_price=${b.sell_price},
      notes=${b.notes}, photos=${JSON.stringify(b.photos)},
      stocks=${b.stocks !== undefined ? JSON.stringify(b.stocks) : sql`stocks`}
    WHERE id=${b.id}
  `;
  return NextResponse.json({ ok: true });
}

export async function PATCH(req) {
  // Only update stocks
  const sql = getDb();
  const { id, stocks } = await req.json();
  await sql`UPDATE inventory SET stocks=${JSON.stringify(stocks)} WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const sql = getDb();
  const { id } = await req.json();
  await sql`DELETE FROM inventory WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}
