import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  
  try {
    // Test original_price column
    const testOrig = await sql`SELECT original_price FROM inventory LIMIT 1`;
    
    // Test banners
    const banners = await sql`SELECT id, kategori, kunci, LEFT(nilai, 80) as url, urutan FROM konten WHERE kategori LIKE 'banner%' ORDER BY created_at DESC`;
    
    // Test full page query
    const konten = await sql`SELECT * FROM konten ORDER BY kategori, urutan`;
    const bannerDesktop = [
      ...konten.filter(k => k.kategori === "banner_desktop"),
      ...konten.filter(k => k.kategori === "banner"),
    ].map(k => k.nilai);
    const bannersMobile = konten.filter(k => k.kategori === "banner_mobile").map(k => k.nilai);
    
    return NextResponse.json({ 
      ok: true,
      original_price_exists: true,
      banners_in_db: banners,
      bannerDesktop_count: bannerDesktop.length,
      bannersMobile_count: bannersMobile.length,
      bannerDesktop_urls: bannerDesktop,
      bannersMobile_urls: bannersMobile,
    });
  } catch(e) {
    return NextResponse.json({ 
      ok: false, 
      error: e.message,
      original_price_exists: false
    });
  }
}
