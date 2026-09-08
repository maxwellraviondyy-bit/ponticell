import { getDb } from "@/lib/db";
import ProductClient from "./ProductClient";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const sql = getDb();
  const rows = await sql`SELECT brand, model, ram, storage, color, condition, sell_price, photos FROM inventory WHERE id=${id} LIMIT 1`;
  if (!rows.length) return {};

  const p = rows[0];
  const photos = typeof p.photos === "string" ? JSON.parse(p.photos) : (p.photos || []);
  const title = `${p.brand} ${p.model} ${p.ram}/${p.storage} - PontiCell Pontianak`;
  const description = `Jual ${p.brand} ${p.model} ${p.ram}/${p.storage} warna ${p.color}, kondisi ${p.condition}. Harga Rp ${Number(p.sell_price).toLocaleString("id-ID")}. Beli di PontiCell Pontianak, garansi toko.`;

  return {
    title,
    description,
    keywords: `${p.brand} ${p.model} Pontianak, jual ${p.brand} Pontianak, ${p.brand} ${p.model} second, HP ${p.brand} Pontianak`,
    openGraph: {
      title,
      description,
      images: photos[0] ? [{ url: photos[0], width: 800, height: 800, alt: `${p.brand} ${p.model}` }] : [],
      type: "website",
    },
    alternates: { canonical: `https://ponticell.vercel.app/produk/${id}` },
  };
}

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

  // JSON-LD structured data untuk produk
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${product.brand} ${product.model}`,
    "description": `${product.brand} ${product.model} RAM ${product.ram} Storage ${product.storage} warna ${product.color}, kondisi ${product.condition}`,
    "brand": { "@type": "Brand", "name": product.brand },
    "offers": {
      "@type": "Offer",
      "price": product.sell_price,
      "priceCurrency": "IDR",
      "availability": "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": "PontiCell" }
    },
    "image": product.photos?.[0] || "",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductClient product={product} related={relatedList} />
    </>
  );
}
