import { getDb } from "@/lib/db";
import ProductClient from "./ProductClient";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

// Kasir sources — sama persis dengan page.js utama
const KASIR_SOURCES = [
  { url: process.env.KASIR_KP_URL || "", key: process.env.KASIR_KP_KEY || "", label: "KP" },
];

// Fetch semua produk dari kasir, kembalikan flat array dengan label
async function fetchAllKasirProduk() {
  const results = await Promise.all(
    KASIR_SOURCES.map(async (kasir) => {
      if (!kasir.url || !kasir.key) return [];
      try {
        const res = await fetch(`${kasir.url}/api/storefront`, {
          headers: { "x-storefront-key": kasir.key },
          cache: "no-store",
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.produk || []).map(p => ({ ...p, _kasir_label: kasir.label, _kasir_url: kasir.url, _toko_nama: data.toko || kasir.label }));
      } catch { return []; }
    })
  );
  return results.flat();
}

// Normalisasi brand — sama dengan page.js utama
const BRAND_MAP = {
  "motorola": "Motorola", "moto": "Motorola", "motopad": "Motorola",
  "apple": "Apple", "iphone": "Apple", "ipad": "Apple",
  "xiaomi": "Xiaomi", "redmi": "Redmi", "poco": "Poco",
  "samsung": "Samsung", "realme": "Realme",
  "oppo": "OPPO", "reno": "OPPO", "find": "OPPO",
  "vivo": "Vivo", "oneplus": "OnePlus",
  "huawei": "Huawei", "honor": "Honor",
  "infinix": "Infinix", "tecno": "Tecno",
  "nubia": "Nubia", "zte": "Nubia",
  "asus": "Asus", "zenfone": "Asus", "rog": "Asus",
  "nokia": "Nokia", "sony": "Sony", "xperia": "Sony",
  "google": "Google", "pixel": "Google",
};

function normalizeBrand(rawBrand) {
  const normalized = BRAND_MAP[rawBrand.toLowerCase()];
  if (normalized) return normalized;
  if (/\d/.test(rawBrand)) return "Lainnya";
  return rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1).toLowerCase();
}

// Konversi produk kasir ke format ProductClient
function kasirToProduct(p, meta) {
  const namaParts = (p.nama || "").trim().split(" ");
  const brand = normalizeBrand(namaParts[0] || "");
  const model = namaParts.slice(1).join(" ") || p.nama || "";
  const photos = Array.isArray(meta?.photos) ? meta.photos : (meta?.photos ? JSON.parse(meta.photos) : []);

  return {
    id: `${p._kasir_label}_${p.id}`,
    _kasir_id: p.id,
    _kasir_url: p._kasir_url,
    _kasir_label: p._kasir_label,
    _toko_nama: p._toko_nama,
    brand,
    model,
    ram: p.ram || "-",
    storage: p.rom || "-",
    color: "-",
    condition: p.kondisi || (p.kategori === "hp_baru" ? "Baru" : "Bekas"),
    sell_price: p.harga_jual || 0,
    original_price: 0,
    photos,
    stocks: { [p._kasir_label]: p.stok || 0 },
    notes: meta?.deskripsi || "",
    sold_count: 0,
    type: "hp",
  };
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  // id format: "KP_123" — ambil label dan kasir_id
  const [label, kasirId] = id.split("_");
  if (!label || !kasirId) return {};

  const kasir = KASIR_SOURCES.find(k => k.label === label);
  if (!kasir || !kasir.url) return {};

  try {
    const res = await fetch(`${kasir.url}/api/storefront`, {
      headers: { "x-storefront-key": kasir.key },
      cache: "no-store",
    });
    if (!res.ok) return {};
    const data = await res.json();
    const p = (data.produk || []).find(p => String(p.id) === String(kasirId));
    if (!p) return {};

    const namaParts = (p.nama || "").trim().split(" ");
    const brand = normalizeBrand(namaParts[0] || "");
    const model = namaParts.slice(1).join(" ") || p.nama || "";
    const ram = p.ram || "";
    const rom = p.rom || "";
    const kondisi = p.kondisi || "Bekas";

    const sql = getDb();
    const metaRows = await sql`SELECT photos FROM kasir_produk_meta WHERE kasir_url=${kasir.url} AND kasir_id=${kasirId} LIMIT 1`;
    const meta = metaRows[0] || {};
    const photos = Array.isArray(meta.photos) ? meta.photos : (meta.photos ? JSON.parse(meta.photos) : []);

    const title = `${brand} ${model}${ram ? " " + ram : ""}${rom ? "/" + rom : ""} - PontiCell Pontianak`;
    const description = `Jual ${brand} ${model}${ram ? " RAM " + ram : ""}${rom ? " Storage " + rom : ""}, kondisi ${kondisi}. Harga Rp ${Number(p.harga_jual).toLocaleString("id-ID")}. Beli di PontiCell Pontianak, garansi toko.`;

    return {
      title,
      description,
      keywords: `${brand} ${model} Pontianak, jual ${brand} Pontianak, ${brand} ${model} ${kondisi.toLowerCase()}, HP ${brand} Pontianak`,
      openGraph: {
        title,
        description,
        images: photos[0] ? [{ url: photos[0], width: 800, height: 800, alt: `${brand} ${model}` }] : [],
        type: "website",
      },
      alternates: { canonical: `https://ponticell.vercel.app/produk/${id}` },
    };
  } catch { return {}; }
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  // id format: "KP_123"
  const underscoreIdx = id.indexOf("_");
  if (underscoreIdx === -1) return notFound();
  const label = id.slice(0, underscoreIdx);
  const kasirId = id.slice(underscoreIdx + 1);

  const kasir = KASIR_SOURCES.find(k => k.label === label);
  if (!kasir || !kasir.url) return notFound();

  const sql = getDb();

  // Fetch produk kasir + meta dari DB secara paralel
  const [kasirRes, metaRows] = await Promise.all([
    fetch(`${kasir.url}/api/storefront`, {
      headers: { "x-storefront-key": kasir.key },
      cache: "no-store",
    }).then(r => r.json()).catch(() => ({ produk: [] })),
    sql`SELECT * FROM kasir_produk_meta WHERE kasir_url=${kasir.url} AND kasir_id=${kasirId} LIMIT 1`,
  ]);

  const allProduk = kasirRes.produk || [];
  const kasirProduk = allProduk.find(p => String(p.id) === String(kasirId));
  if (!kasirProduk) return notFound();

  kasirProduk._kasir_label = kasir.label;
  kasirProduk._kasir_url = kasir.url;
  kasirProduk._toko_nama = kasirRes.toko || kasir.label;

  const meta = metaRows[0] || null;
  const product = kasirToProduct(kasirProduk, meta);

  // Produk serupa: brand sama, bukan produk ini, stok > 0
  const TABLET_KEYWORDS = ["tab", "pad", "ipad", "fold", "flip", "mediapad"];
  const isTablet = (p) => `${p.brand} ${p.model}`.toLowerCase().split(" ").some(w => TABLET_KEYWORDS.includes(w));
  const productIsTablet = isTablet(product);

  // Ambil meta untuk semua produk serupa
  const metaAllRows = await sql`SELECT * FROM kasir_produk_meta WHERE kasir_url=${kasir.url}`;
  const metaMap = {};
  for (const m of metaAllRows) metaMap[String(m.kasir_id)] = m;

  const related = allProduk
    .filter(p => String(p.id) !== String(kasirId) && (p.stok || 0) > 0)
    .map(p => {
      p._kasir_label = kasir.label;
      p._kasir_url = kasir.url;
      p._toko_nama = kasirRes.toko || kasir.label;
      return kasirToProduct(p, metaMap[String(p.id)] || null);
    })
    .filter(p => isTablet(p) === productIsTablet) // serupa tipe
    .filter(p => p.brand === product.brand)        // serupa brand
    .slice(0, 6);

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${product.brand} ${product.model}`,
    "description": `${product.brand} ${product.model} RAM ${product.ram} Storage ${product.storage}, kondisi ${product.condition}`,
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
      <ProductClient product={product} related={related} />
    </>
  );
}
