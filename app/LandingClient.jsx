"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const WA_NUMBER = "6283808484969";
const formatRp = (n) => "Rp " + Number(n).toLocaleString("id-ID");

const G = {
  bg: "#0A0A0A",
  card: "#141414",
  cardHover: "#1A1A1A",
  border: "#222",
  gold: "#C9A227",
  goldLight: "#E8C158",
  goldDark: "#A07D10",
  white: "#FFFFFF",
  gray: "#888",
  grayLight: "#555",
  text: "#F0F0F0",
  textMuted: "#888",
};

const styles = {
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
    background: "rgba(10,10,10,0.95)", backdropFilter: "blur(12px)",
    borderBottom: `1px solid ${G.border}`,
    padding: "0 24px", height: 64,
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  logo: { fontSize: 22, fontWeight: 900, color: G.gold, letterSpacing: "-0.5px" },
  logoSub: { fontSize: 10, color: G.gray, fontWeight: 500 },
  navBtn: {
    background: `linear-gradient(135deg, ${G.gold}, ${G.goldDark})`,
    color: "#000", border: "none", borderRadius: 8,
    padding: "8px 16px", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
  },
  hero: {
    minHeight: "100vh", paddingTop: 64,
    background: `linear-gradient(135deg, #0A0A0A 0%, #111 50%, #0A0A0A 100%)`,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexDirection: "column", textAlign: "center", padding: "80px 24px 60px",
    position: "relative", overflow: "hidden",
  },
  heroTitle: {
    fontSize: "clamp(32px, 6vw, 64px)", fontWeight: 900,
    color: G.white, lineHeight: 1.1, marginBottom: 16,
  },
  heroAccent: { color: G.gold },
  heroSub: { fontSize: "clamp(14px, 2vw, 18px)", color: G.gray, marginBottom: 40, maxWidth: 500 },
  heroBadges: { display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 48 },
  badge: {
    background: "#1A1A1A", border: `1px solid ${G.border}`,
    borderRadius: 20, padding: "6px 14px", fontSize: 12,
    color: G.gray, display: "flex", alignItems: "center", gap: 6,
  },
  ctaBtn: {
    background: `linear-gradient(135deg, ${G.gold}, ${G.goldDark})`,
    color: "#000", border: "none", borderRadius: 12,
    padding: "16px 36px", fontSize: 16, fontWeight: 800,
    cursor: "pointer", fontFamily: "inherit",
    boxShadow: `0 8px 32px rgba(201,162,39,0.3)`,
    transition: "all 0.2s",
  },
  section: { padding: "80px 24px", maxWidth: 1200, margin: "0 auto" },
  sectionTitle: {
    fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 800,
    color: G.white, marginBottom: 8,
  },
  sectionSub: { fontSize: 14, color: G.gray, marginBottom: 40 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 16,
  },
  productCard: {
    background: G.card, borderRadius: 16,
    border: `1px solid ${G.border}`,
    overflow: "hidden", cursor: "pointer",
    transition: "all 0.25s",
  },
  productImg: {
    width: "100%", aspectRatio: "1",
    background: "#1A1A1A", overflow: "hidden", position: "relative",
  },
  productInfo: { padding: "14px 14px 16px" },
  productBrand: { fontSize: 10, color: G.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  productName: { fontSize: 14, fontWeight: 700, color: G.white, marginBottom: 6, lineHeight: 1.3 },
  productSpec: { fontSize: 11, color: G.gray, marginBottom: 10 },
  productPrice: { fontSize: 16, fontWeight: 800, color: G.gold },
  tab: (active) => ({
    padding: "10px 20px", borderRadius: 10, border: "none",
    background: active ? `linear-gradient(135deg, ${G.gold}, ${G.goldDark})` : "#1A1A1A",
    color: active ? "#000" : G.gray, fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
  }),
  searchBox: {
    width: "100%", maxWidth: 400, padding: "12px 16px",
    background: "#1A1A1A", border: `1px solid ${G.border}`,
    borderRadius: 10, color: G.white, fontSize: 14, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
  },
  statCard: {
    background: G.card, border: `1px solid ${G.border}`,
    borderRadius: 16, padding: "24px", textAlign: "center",
    flex: 1, minWidth: 120,
  },
  footer: {
    background: "#080808", borderTop: `1px solid ${G.border}`,
    padding: "40px 24px", textAlign: "center",
  },
};

export default function LandingClient({ hp, tablet, testimoni }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("hp");
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Semua");
  const [selectedRam, setSelectedRam] = useState("Semua");

  const products = activeTab === "hp" ? hp : tablet;

  const brands = ["Semua", ...Array.from(new Set(products.map(p => p.brand))).sort()];
  const rams = ["Semua", ...Array.from(new Set(
    products.filter(p => p.ram && p.ram !== "-").map(p => p.ram)
  )).sort((a,b) => parseInt(a) - parseInt(b))];

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.model.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    const matchBrand = selectedBrand === "Semua" || p.brand === selectedBrand;
    const matchRam = selectedRam === "Semua" || p.ram === selectedRam;
    return matchSearch && matchBrand && matchRam;
  });

  const totalStok = [...hp, ...tablet].length;

  return (
    <div style={{ background: G.bg, minHeight: "100vh", color: G.white }}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <div>
          <div style={styles.logo}>PontiCell</div>
          <div style={styles.logoSub}>by.Max · Pontianak</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={{ background: "transparent", border: `1px solid ${G.border}`, color: G.gray, borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
            onClick={() => router.push("/dashboard")}>
            🔐 Admin
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={styles.hero}>
        {/* Background decoration */}
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, rgba(201,162,39,0.05) 0%, transparent 70%)`, pointerEvents: "none" }} />

        <div style={styles.heroBadges}>
          <span style={styles.badge}>✅ Garansi Toko</span>
          <span style={styles.badge}>📍 4 Cabang Pontianak</span>
          <span style={styles.badge}>💯 Produk Original</span>
          <span style={styles.badge}>🚀 Respon Cepat</span>
        </div>

        <h1 style={styles.heroTitle}>
          Toko HP & Tablet<br />
          <span style={styles.heroAccent}>Terpercaya</span> di Pontianak
        </h1>
        <p style={styles.heroSub}>
          {totalStok}+ produk tersedia · Harga terbaik · Stok selalu update
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button style={styles.ctaBtn}
            onClick={() => document.getElementById("produk-section").scrollIntoView({ behavior: "smooth" })}>
            🛍️ Lihat Produk
          </button>
          <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20PontiCell,%20saya%20ingin%20tanya%20stok%20HP`}
            target="_blank" rel="noopener noreferrer"
            style={{ ...styles.ctaBtn, background: "#1A1A1A", color: G.gold, border: `1px solid ${G.gold}`, textDecoration: "none", boxShadow: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            💬 WhatsApp
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, marginTop: 60, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { label: "Produk Tersedia", value: totalStok + "+" },
            { label: "Cabang", value: "4" },
            { label: "Garansi", value: "✓" },
            { label: "Respon", value: "< 5 Menit" },
          ].map(s => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ fontSize: 26, fontWeight: 900, color: G.gold, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: G.gray }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Produk Section */}
      <div id="produk-section" style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={styles.sectionTitle}>Produk Kami</div>
            <div style={styles.sectionSub}>{filtered.length} produk tersedia</div>
          </div>
          <input
            style={styles.searchBox}
            placeholder="🔍 Cari HP atau Tablet..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <button style={styles.tab(activeTab === "hp")} onClick={() => { setActiveTab("hp"); setSelectedBrand("Semua"); setSelectedRam("Semua"); }}>📱 HP ({hp.length})</button>
          <button style={styles.tab(activeTab === "tablet")} onClick={() => { setActiveTab("tablet"); setSelectedBrand("Semua"); setSelectedRam("Semua"); }}>📟 Tablet ({tablet.length})</button>
        </div>

        {/* Filter Brand */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {brands.map(b => (
            <button key={b} onClick={() => setSelectedBrand(b)}
              style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${selectedBrand === b ? G.gold : G.border}`, background: selectedBrand === b ? `rgba(201,162,39,0.15)` : "transparent", color: selectedBrand === b ? G.gold : G.gray, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
              {b}
            </button>
          ))}
        </div>

        {/* Filter RAM */}
        {rams.length > 2 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: G.gray, fontWeight: 700 }}>RAM:</span>
            {rams.map(r => (
              <button key={r} onClick={() => setSelectedRam(r)}
                style={{ padding: "4px 12px", borderRadius: 16, border: `1px solid ${selectedRam === r ? G.gold : G.border}`, background: selectedRam === r ? `rgba(201,162,39,0.15)` : "transparent", color: selectedRam === r ? G.gold : G.gray, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {r === "Semua" ? "Semua" : `${r} GB`}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: G.gray }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Produk tidak ditemukan</div>
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map(p => (
              <div key={p.id}
                style={styles.productCard}
                onClick={() => router.push(`/produk/${p.id}`)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 40px rgba(201,162,39,0.15)`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={styles.productImg}>
                  {p.photos?.[0]
                    ? <img src={p.photos[0]} alt={p.model} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📱</div>
                  }
                  <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: G.gold, fontWeight: 700 }}>
                    {p.condition}
                  </div>
                </div>
                <div style={styles.productInfo}>
                  <div style={styles.productBrand}>{p.brand}</div>
                  <div style={styles.productName}>{p.model}</div>
                  <div style={styles.productSpec}>{p.ram !== "-" ? `${p.ram} / ` : ""}{p.storage} · {p.color}</div>
                  <div style={styles.productPrice}>{formatRp(p.sell_price)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Testimoni */}
      {testimoni.length > 0 && (
        <div style={{ background: "#0D0D0D", padding: "80px 24px", borderTop: `1px solid ${G.border}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ ...styles.sectionTitle, textAlign: "center", marginBottom: 8 }}>Testimoni Pelanggan</div>
            <div style={{ ...styles.sectionSub, textAlign: "center", marginBottom: 40 }}>Apa kata mereka setelah belanja di PontiCell</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {testimoni.map(t => (
                <div key={t.id} style={{ background: G.card, borderRadius: 16, border: `1px solid ${G.border}`, overflow: "hidden" }}>
                  <div style={{ height: 200, overflow: "hidden" }}>
                    <img src={t.foto} alt="testimoni" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, color: "#CCC", lineHeight: 1.5, fontStyle: "italic" }}>"{t.keterangan}"</div>
                    <div style={{ fontSize: 10, color: G.gray, marginTop: 8 }}>
                      {new Date(t.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cabang */}
      <div style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ ...styles.sectionTitle, textAlign: "center", marginBottom: 8 }}>Lokasi Cabang</div>
        <div style={{ ...styles.sectionSub, textAlign: "center", marginBottom: 40 }}>Temukan kami di 4 lokasi di Pontianak</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {[
            { nama: "Cabang KP", lokasi: "Kota Pontianak Pusat", icon: "🏪" },
            { nama: "Cabang Jawi", lokasi: "Pontianak Selatan", icon: "🏬" },
            { nama: "Cabang Kobar", lokasi: "Kotabaru", icon: "🏢" },
            { nama: "Cabang Jeruju", lokasi: "Pontianak Barat", icon: "🏪" },
          ].map(c => (
            <div key={c.nama} style={{ background: G.card, borderRadius: 16, border: `1px solid ${G.border}`, padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{c.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: G.white, marginBottom: 4 }}>{c.nama}</div>
              <div style={{ fontSize: 12, color: G.gray, marginBottom: 16 }}>{c.lokasi}</div>
              <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20PontiCell,%20saya%20ingin%20tanya%20stok%20di%20${c.nama}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-block", padding: "8px 16px", background: "transparent", border: `1px solid ${G.gold}`, color: G.gold, borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                💬 Tanya Stok
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div style={{ background: `linear-gradient(135deg, ${G.gold}, ${G.goldDark})`, padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#000", marginBottom: 8 }}>Siap Beli HP Impianmu?</div>
        <div style={{ fontSize: 14, color: "rgba(0,0,0,0.6)", marginBottom: 28 }}>Chat kami sekarang dan dapatkan penawaran terbaik</div>
        <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20PontiCell,%20saya%20mau%20order%20HP`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-block", padding: "14px 32px", background: "#000", color: G.gold, borderRadius: 12, fontSize: 15, fontWeight: 800, textDecoration: "none" }}>
          💬 Chat WhatsApp Sekarang
        </a>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={{ fontSize: 20, fontWeight: 900, color: G.gold, marginBottom: 4 }}>PontiCell</div>
        <div style={{ fontSize: 12, color: G.gray, marginBottom: 16 }}>by.Max · Toko HP & Tablet Terpercaya di Pontianak</div>
        <div style={{ fontSize: 11, color: "#444" }}>© 2026 PontiCell. All rights reserved.</div>
      </div>
    </div>
  );
}
