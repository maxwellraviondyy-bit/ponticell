import { getDb } from "@/lib/db";
import LandingClient from "./LandingClient";

export const dynamic = 'force-dynamic';

// Daftar kasir yang terhubung ke Ponticell.
// Tambah baris baru di sini kalau ada cabang baru — tidak perlu ubah kode lain.
const KASIR_SOURCES = [
  {
    url: process.env.KASIR_KP_URL || "",
    key: process.env.KASIR_KP_KEY || "",
    label: "KP",
  },
  // Contoh menambah cabang berikutnya:
  // { url: process.env.KASIR_SJ_URL || "", key: process.env.KASIR_SJ_KEY || "", label: "SJ" },
];

// Fetch stok dari satu kasir. Kalau gagal (kasir down, env belum diset),
// kembalikan array kosong — landing page tetap tampil meski satu kasir error.
async function fetchKasirStok(kasir) {
  if (!kasir.url || !kasir.key) return [];
  try {
    const res = await fetch(`${kasir.url}/api/storefront`, {
      headers: { "x-storefront-key": kasir.key },
      next: { revalidate: 0 }, // selalu fresh, tidak di-cache Next.js
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.produk || []).map((p) => ({
      ...p,
      _kasir_url: kasir.url,
      _kasir_label: kasir.label,
      _toko_nama: data.toko || kasir.label,
    }));
  } catch {
    return [];
  }
}

// Konversi produk dari kasir ke format yang diharapkan LandingClient.
// LandingClient mengharapkan: id, brand, model, ram, storage, color, condition,
// sell_price, original_price, photos, stocks, notes, sold_count.
function kasirProdukToLanding(p, metaMap) {
  // Parsing nama kasir: "Samsung Galaxy A15 128GB" → brand="Samsung", model="Galaxy A15"
  // Heuristik sederhana: kata pertama = brand, sisanya = model
  const namaParts = (p.nama || "").trim().split(" ");
  const brand = namaParts[0] || p.nama || "";
  const model = namaParts.slice(1).join(" ") || p.nama || "";

  // Ambil foto & deskripsi dari meta Ponticell (kalau ada)
  const metaKey = `${p._kasir_url}::${p.id}`;
  const meta = metaMap[metaKey] || {};
  const photos = Array.isArray(meta.photos) ? meta.photos : (meta.photos ? JSON.parse(meta.photos) : []);

  return {
    id: `${p._kasir_label}_${p.id}`,  // unik antar kasir
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
    // stocks: format yang dipakai LandingClient adalah object {cabang: qty}
    // kita pakai label kasir sebagai key, total stok sebagai value
    stocks: { [p._kasir_label]: p.stok || 0 },
    notes: meta.deskripsi || "",
    sold_count: 0,
    type: p.kategori === "hp_baru" ? "hp" : "hp",
  };
}

export default async function HomePage() {
  const sql = getDb();

  // Fetch dari semua kasir dan Ponticell DB secara paralel
  const [kasirResults, testimoni, konten, metaRows] = await Promise.all([
    Promise.all(KASIR_SOURCES.map(fetchKasirStok)),
    sql`SELECT * FROM testimoni ORDER BY created_at DESC LIMIT 10`,
    sql`SELECT * FROM konten ORDER BY kategori, urutan`,
    sql`SELECT * FROM kasir_produk_meta`,
  ]);

  // Bangun lookup map: "kasir_url::kasir_id" → meta
  const metaMap = {};
  for (const m of metaRows) {
    metaMap[`${m.kasir_url}::${m.kasir_id}`] = m;
  }

  // Gabung semua produk dari semua kasir
  const semuaProdukKasir = kasirResults.flat();
  const produkLanding = semuaProdukKasir.map((p) => kasirProdukToLanding(p, metaMap));

  // Semua produk dari kasir adalah HP (kasir kita memang toko HP)
  // Filter: hanya tampilkan yang stok > 0 (sudah difilter di kasir, tapi double-check)
  const hpList = produkLanding.filter(
    (p) => Object.values(p.stocks).reduce((s, v) => s + v, 0) > 0
  );
  const tabletList = []; // Tablet bisa ditambahkan nanti kalau kasir punya kategori tablet

  // Konten & banner dari Ponticell DB (tetap sama)
  const bannerDesktop = [
    ...konten.filter(k => k.kategori === "banner_desktop").sort((a, b) => a.urutan - b.urutan),
    ...konten.filter(k => k.kategori === "banner").sort((a, b) => a.urutan - b.urutan),
  ].map(k => k.nilai);

  const bannersMobile = konten
    .filter(k => k.kategori === "banner_mobile")
    .sort((a, b) => a.urutan - b.urutan)
    .map(k => k.nilai);

  const brandLogos = {};
  konten.filter(k => k.kategori === "brand").forEach(k => {
    brandLogos[k.kunci.replace("brand_", "")] = k.nilai;
  });

  const getInfo = (kunci) => konten.find(k => k.kunci === kunci)?.nilai || "";

  return (
    <LandingClient
      hp={hpList}
      tablet={tabletList}
      testimoni={testimoni}
      banners={bannerDesktop}
      bannersMobile={bannersMobile}
      brandLogos={brandLogos}
      topSoldIds={[]}
      infoNama={getInfo("info_nama") || "PontiCell"}
      infoTagline={getInfo("info_tagline") || "Toko HP & Tablet Terpercaya di Pontianak"}
      infoWa={getInfo("info_wa") || "6283808484969"}
    />
  );
}
