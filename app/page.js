import { getDb } from "@/lib/db";
import LandingClient from "./LandingClient";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const sql = getDb();

  const hp = await sql`
    SELECT id, brand, model, ram, storage, color, condition, sell_price, photos, stocks
    FROM inventory WHERE type = 'hp' ORDER BY created_at DESC
  `;
  const tablet = await sql`
    SELECT id, brand, model, ram, storage, color, condition, sell_price, photos, stocks
    FROM inventory WHERE type = 'tablet' ORDER BY created_at DESC
  `;
  const testimoni = await sql`SELECT * FROM testimoni ORDER BY created_at DESC LIMIT 6`;

  const parseItem = (r) => ({
    ...r,
    photos: typeof r.photos === "string" ? JSON.parse(r.photos) : (r.photos || []),
    stocks: typeof r.stocks === "string" ? JSON.parse(r.stocks) : (r.stocks || {}),
  });

  const hpList = hp.map(parseItem).filter(i => Object.values(i.stocks).reduce((s,v)=>s+v,0) > 0);
  const tabletList = tablet.map(parseItem).filter(i => Object.values(i.stocks).reduce((s,v)=>s+v,0) > 0);

  return <LandingClient hp={hpList} tablet={tabletList} testimoni={testimoni} />;
}
