import { getDb } from "@/lib/db";
import ProductClient from "./ProductClient";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }) {
  const { id } = await params;
  const sql = getDb();

  const rows = await sql`SELECT * FROM inventory WHERE id=${id} LIMIT 1`;
  if (!rows.length) return notFound();

  const r = rows[0];
  const product = {
    ...r,
    photos: typeof r.photos === "string" ? JSON.parse(r.photos) : (r.photos || []),
    stocks: typeof r.stocks === "string" ? JSON.parse(r.stocks) : (r.stocks || {}),
  };

  const related = await sql`
    SELECT id, brand, model, ram, storage, color, condition, sell_price, photos, stocks
    FROM inventory WHERE type=${product.type} AND id != ${id}
    ORDER BY created_at DESC LIMIT 6
  `;
  const relatedList = related.map(r => ({
    ...r,
    photos: typeof r.photos === "string" ? JSON.parse(r.photos) : (r.photos || []),
    stocks: typeof r.stocks === "string" ? JSON.parse(r.stocks) : (r.stocks || {}),
  })).filter(i => Object.values(i.stocks).reduce((s,v)=>s+v,0) > 0);

  return <ProductClient product={product} related={relatedList} />;
}
