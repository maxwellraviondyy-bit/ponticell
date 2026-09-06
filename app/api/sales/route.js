import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM sales_log ORDER BY sold_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(req) {
  const sql = getDb();
  const b = await req.json();
  await sql`
    INSERT INTO sales_log (id,item_id,type,brand,model,ram,storage,color,condition,imei,buy_price,sell_price,original_sell_price,profit,notes,photos,stock_branch,sold_branch,sold_qty,is_cod,sold_at)
    VALUES (${b.id},${b.item_id},${b.type},${b.brand},${b.model},${b.ram},${b.storage},${b.color},${b.condition},${b.imei},${b.buy_price},${b.sell_price},${b.original_sell_price},${b.profit},${b.notes},${JSON.stringify(b.photos||[])},${b.stock_branch},${b.sold_branch},${b.sold_qty},${b.is_cod},${b.sold_at})
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const sql = getDb();
  const { id } = await req.json();
  await sql`DELETE FROM sales_log WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}
