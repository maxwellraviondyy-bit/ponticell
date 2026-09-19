import { getDb } from "@/lib/db";
import LandingClient from "./LandingClient";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const sql = getDb();

  try {
    const [hp, tablet, testimoni, konten, salesData] = await Promise.all([
      sql`SELECT id, brand, model, ram, storage, color, condition, sell_price, COALESCE(original_price, 0) as original_price, photos, stocks, notes FROM inventory WHERE type = 'hp' ORDER BY created_at DESC`,
      sql`SELECT id, brand, model, ram, storage, color, condition, sell_price, COALESCE(original_price, 0) as original_price, photos, stocks, notes FROM inventory WHERE type = 'tablet' ORDER BY created_at DESC`,
      sql`SELECT * FROM testimoni ORDER BY created_at DESC LIMIT 10`,
      sql`SELECT * FROM konten ORDER BY kategori, urutan`,
      sql`SELECT item_id, COUNT(*) as sold_count FROM sales_log GROUP BY item_id`,
    ]);

    const soldMap = {};
    salesData.forEach(s => { soldMap[s.item_id] = Number(s.sold_count); });

    const parseItem = (r) => ({
      ...r,
      photos: typeof r.photos === "string" ? JSON.parse(r.photos) : (r.photos || []),
      stocks: typeof r.stocks === "string" ? JSON.parse(r.stocks) : (r.stocks || {}),
      sold_count: soldMap[r.id] || 0,
    });

    const hpList = hp.map(parseItem).filter(i => Object.values(i.stocks).reduce((s,v)=>s+v,0) > 0);
    const tabletList = tablet.map(parseItem).filter(i => Object.values(i.stocks).reduce((s,v)=>s+v,0) > 0);

    const allItems = [...hpList, ...tabletList];
    const topSoldIds = new Set(
      [...allItems].sort((a,b) => b.sold_count - a.sold_count)
        .filter(i => i.sold_count > 0).slice(0, 3).map(i => i.id)
    );

    const bannerDesktop = [
      ...konten.filter(k => k.kategori === "banner_desktop").sort((a,b) => a.urutan - b.urutan),
      ...konten.filter(k => k.kategori === "banner").sort((a,b) => a.urutan - b.urutan),
    ].map(k => k.nilai);

    const bannersMobile = konten
      .filter(k => k.kategori === "banner_mobile")
      .sort((a,b) => a.urutan - b.urutan)
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
        topSoldIds={[...topSoldIds]}
        infoNama={getInfo("info_nama") || "PontiCell"}
        infoTagline={getInfo("info_tagline") || "Toko HP & Tablet Terpercaya di Pontianak"}
        infoWa={getInfo("info_wa") || "6283808484969"}
      />
    );
  } catch (error) {
    console.error("HomePage error:", error);
    // Fallback: try without original_price
    const [hp, tablet, testimoni, konten] = await Promise.all([
      sql`SELECT id, brand, model, ram, storage, color, condition, sell_price, 0 as original_price, photos, stocks, notes FROM inventory WHERE type = 'hp' ORDER BY created_at DESC`,
      sql`SELECT id, brand, model, ram, storage, color, condition, sell_price, 0 as original_price, photos, stocks, notes FROM inventory WHERE type = 'tablet' ORDER BY created_at DESC`,
      sql`SELECT * FROM testimoni ORDER BY created_at DESC LIMIT 10`,
      sql`SELECT * FROM konten ORDER BY kategori, urutan`,
    ]);

    const parseItem = (r) => ({
      ...r,
      photos: typeof r.photos === "string" ? JSON.parse(r.photos) : (r.photos || []),
      stocks: typeof r.stocks === "string" ? JSON.parse(r.stocks) : (r.stocks || {}),
      sold_count: 0,
    });

    const hpList = hp.map(parseItem).filter(i => Object.values(i.stocks).reduce((s,v)=>s+v,0) > 0);
    const tabletList = tablet.map(parseItem).filter(i => Object.values(i.stocks).reduce((s,v)=>s+v,0) > 0);

    const bannerDesktop = [
      ...konten.filter(k => k.kategori === "banner_desktop").sort((a,b) => a.urutan - b.urutan),
      ...konten.filter(k => k.kategori === "banner").sort((a,b) => a.urutan - b.urutan),
    ].map(k => k.nilai);

    const bannersMobile = konten
      .filter(k => k.kategori === "banner_mobile")
      .sort((a,b) => a.urutan - b.urutan)
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
}
