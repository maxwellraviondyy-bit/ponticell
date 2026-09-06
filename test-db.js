const { neon } = require("@neondatabase/serverless");
require("dotenv").config({ path: ".env.local" });

async function test() {
  try {
    console.log("Connecting to:", process.env.DATABASE_URL?.slice(0, 40) + "...");
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT NOW()`;
    console.log("✅ Koneksi berhasil!", result[0]);
    
    // Check tables
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
    console.log("Tables:", tables.map(t => t.table_name));
  } catch (e) {
    console.error("❌ Koneksi gagal:", e.message);
  }
}

test();
