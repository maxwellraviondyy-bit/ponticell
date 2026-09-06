import { getDb } from "@/lib/db";
import LandingClient from "./LandingClient";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const sql = getDb();

  const [hp, tablet, testimoni, konten] = await Promise.all([
    sql`SELECT id, brand, model, ram, storage, color, condition, sell_price, photos, stocks FROM inventory WHERE type = 'hp' ORDER BY created_at DESC`,
    sql`SELECT id, brand, model, ram, storage, color, condition, sell_price, photos, stocks FROM inventory WHERE type = 'tablet' ORDER BY created_at DESC`,
    sql`SELECT * FROM testimoni ORDER BY created_at DESC LIMIT 6`,
    sql`SELECT * FROM konten ORDER BY kategori, urutan`,
  ]);

  const parseItem = (r) => ({
    ...r,
    photos: typeof r.photos === "string" ? JSON.parse(r.photos) : (r.photos || []),
    stocks: typeof r.stocks === "string" ? JSON.parse(r.stocks) : (r.stocks || {}),
  });

  const hpList = hp.map(parseItem).filter(i => Object.values(i.stocks).reduce((s,v)=>s+v,0) > 0);
  const tabletList = tablet.map(parseItem).filter(i => Object.values(i.stocks).reduce((s,v)=>s+v,0) > 0);

  // Parse konten
  const banners = konten.filter(k => k.kategori === "banner").sort((a,b) => a.urutan - b.urutan).map(k => k.nilai);
  const brandLogos = {};
  konten.filter(k => k.kategori === "brand").forEach(k => {
    const brand = k.kunci.replace("brand_", "");
    brandLogos[brand] = k.nilai;
  });
  const cabangFotos = {};
  konten.filter(k => k.kategori === "cabang").forEach(k => {
    const cabang = k.kunci.replace("cabang_", "");
    cabangFotos[cabang] = k.nilai;
  });
  const getInfo = (kunci) => konten.find(k => k.kunci === kunci)?.nilai || "";

  return (
    <LandingClient
      hp={hpList}
      tablet={tabletList}
      testimoni={testimoni}
      banners={banners}
      brandLogos={brandLogos}
      cabangFotos={cabangFotos}
      infoNama={getInfo("info_nama") || "PontiCell"}
      infoTagline={getInfo("info_tagline") || "Toko HP & Tablet Terpercaya di Pontianak"}
      infoWa={getInfo("info_wa") || "6283808484969"}
    />
  );
}
