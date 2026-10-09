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
    const res = await fetch(new Request(`${kasir.url}/api/storefront`, {
      headers: { "x-storefront-key": kasir.key },
      cache: "no-store",
    }));
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

// Normalisasi nama brand dari kasir ke nama brand resmi.
// Key: lowercase kata pertama nama produk → Value: nama brand yang benar
const BRAND_MAP = {
  // Motorola / Motopad (Motopad adalah sub-brand tablet Motorola)
  "motorola": "Motorola",
  "moto":     "Motorola",
  "motopad":  "Motorola",
  // Apple
  "apple":  "Apple",
  "iphone": "Apple",
  "ipad":   "Apple",
  // Xiaomi / Redmi / Poco
  "xiaomi": "Xiaomi",
  "redmi":  "Redmi",
  "poco":   "Poco",
  // Samsung
  "samsung": "Samsung",
  // Realme
  "realme": "Realme",
  // OPPO
  "oppo": "OPPO",
  "reno": "OPPO",
  "find": "OPPO",
  // Vivo
  "vivo": "Vivo",
  // OnePlus
  "oneplus": "OnePlus",
  // Huawei
  "huawei": "Huawei",
  "honor":  "Honor",
  // Infinix
  "infinix": "Infinix",
  // Nubia / ZTE
  "nubia": "Nubia",
  "zte":   "Nubia",
  // Tecno
  "tecno": "Tecno",
  // Asus
  "asus":    "Asus",
  "zenfone": "Asus",
  "rog":     "Asus",
  // Nokia
  "nokia": "Nokia",
  // Sony
  "sony":   "Sony",
  "xperia": "Sony",
  // Google
  "google": "Google",
  "pixel":  "Google",
};

// Cek apakah string terlihat seperti kode model (bukan brand):
// - mengandung angka (A15, Y19s, S24+)
// - semua huruf kapital pendek (huruf besar semua kemungkinan kode model, bukan brand)
function looksLikeModelCode(str) {
  return /\d/.test(str); // ada angka = kemungkinan model, bukan brand
}

// Konversi produk dari kasir ke format yang diharapkan LandingClient.
// LandingClient mengharapkan: id, brand, model, ram, storage, color, condition,
// sell_price, original_price, photos, stocks, notes, sold_count.
function kasirProdukToLanding(p, metaMap) {
  // Parsing nama kasir: "Samsung Galaxy A15 128GB" → brand="Samsung", model="Galaxy A15"
  // Heuristik: kata pertama = brand, tapi normalisasi dulu
  const namaParts = (p.nama || "").trim().split(" ");
  const rawBrand = namaParts[0] || p.nama || "";

  // Normalisasi brand — kalau ada di peta, pakai nama resmi
  const brandNormalized = BRAND_MAP[rawBrand.toLowerCase()];

  // Kalau kata pertama terlihat seperti kode model (ada angka), atau tidak ada di peta brand
  // tapi JUGA tidak mirip brand apapun, tandai sebagai "Lainnya"
  let brand;
  if (brandNormalized) {
    brand = brandNormalized;
  } else if (looksLikeModelCode(rawBrand)) {
    // Kata pertama ada angkanya = bukan nama brand → pakai "Lainnya"
    brand = "Lainnya";
  } else {
    // Pertahankan nama asli (huruf pertama kapital)
    brand = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1).toLowerCase();
  }

  // Model: sisa kata setelah brand, tapi pertahankan nama asli dari kasir sebagai fallback pencarian
  const modelRaw = namaParts.slice(1).join(" ") || p.nama || "";
  // Simpan nama lengkap asli dari kasir di _nama_kasir untuk pencarian robot
  const model = modelRaw;

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
    _nama_kasir: p.nama || "", // nama lengkap asli dari kasir untuk pencarian robot
    ram: p.ram ? p.ram.toString().replace(/gb$/i, "").trim() : "-",
    storage: p.rom ? p.rom.toString().replace(/gb$/i, "").trim() + "GB" : "-",
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

  // Deteksi tablet dari nama produk: kata kunci yang khas tablet
  // Cek di brand + model karena nama asli kasir sudah diparsing
  const TABLET_KEYWORDS = ["tab", "pad", "ipad", "fold", "flip", "mediapad"];
  function isTablet(p) {
    const namaLengkap = `${p.brand} ${p.model}`.toLowerCase();
    return TABLET_KEYWORDS.some(k => namaLengkap.includes(k));
  }

  // Pisahkan HP dan Tablet, filter hanya yang stok > 0
  const adaStok = (p) => Object.values(p.stocks).reduce((s, v) => s + v, 0) > 0;
  const hpList = produkLanding.filter(p => adaStok(p) && !isTablet(p));
  const tabletList = produkLanding.filter(p => adaStok(p) && isTablet(p));

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
    // Simpan dengan key lowercase supaya cocok dengan lookup di LandingClient
    // yang pakai brand.toLowerCase() sebagai key
    const key = k.kunci.replace("brand_", "").toLowerCase();
    brandLogos[key] = k.nilai;
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
