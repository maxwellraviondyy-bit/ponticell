export const dynamic = 'force-dynamic';

export default async function sitemap() {
  let productUrls = [];
  
  try {
    const { getDb } = await import("@/lib/db");
    const sql = getDb();
    const products = await sql`SELECT id, created_at FROM inventory ORDER BY created_at DESC`;
    productUrls = products.map(p => ({
      url: `https://ponticell.vercel.app/produk/${p.id}`,
      lastModified: p.created_at ? new Date(p.created_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch(e) {}

  return [
    { url: "https://ponticell.vercel.app", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...productUrls,
  ];
}
