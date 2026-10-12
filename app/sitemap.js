export const dynamic = 'force-dynamic';

// Kasir sources — sama dengan page.js utama
const KASIR_SOURCES = [
  { url: process.env.KASIR_KP_URL || "", key: process.env.KASIR_KP_KEY || "", label: "KP" },
];

export default async function sitemap() {
  let productUrls = [];

  try {
    const results = await Promise.all(
      KASIR_SOURCES.map(async (kasir) => {
        if (!kasir.url || !kasir.key) return [];
        const res = await fetch(`${kasir.url}/api/storefront`, {
          headers: { "x-storefront-key": kasir.key },
          cache: "no-store",
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.produk || [])
          .filter(p => (p.stok || 0) > 0)
          .map(p => ({
            url: `https://ponticell.vercel.app/produk/${kasir.label}_${p.id}`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.8,
          }));
      })
    );
    productUrls = results.flat();
  } catch (e) {}

  return [
    { url: "https://ponticell.vercel.app", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: "https://ponticell.vercel.app/tentang", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...productUrls,
  ];
}
