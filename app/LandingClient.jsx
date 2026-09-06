"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const WA_NUMBER = "6283808484969";
const formatRp = (n) => "Rp " + Number(n).toLocaleString("id-ID");

const G = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  blue: "#1565C0",
  blueLight: "#1E88E5",
  blueDark: "#0D47A1",
  blueAccent: "#E3F2FD",
  white: "#FFFFFF",
  gray: "#64748B",
  grayLight: "#F1F5F9",
  text: "#0F172A",
  textMuted: "#64748B",
};

const BRAND_ICONS = {
  Samsung: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/200px-Samsung_Logo.svg.png",
  Xiaomi: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Xiaomi_logo.svg/200px-Xiaomi_logo.svg.png",
  Oppo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/OPPO_LOGO_2019.svg/200px-OPPO_LOGO_2019.svg.png",
  Vivo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Vivo_logo_2019.svg/200px-Vivo_logo_2019.svg.png",
  Realme: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Realme_logo.svg/200px-Realme_logo.svg.png",
  Apple: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/100px-Apple_logo_black.svg.png",
  Infinix: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Infinix_Mobility_logo.svg/200px-Infinix_Mobility_logo.svg.png",
  Tecno: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Tecno_Mobile_logo.svg/200px-Tecno_Mobile_logo.svg.png",
};

export default function LandingClient({ hp, tablet, testimoni }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("hp");
  const [search, setSearch] = useState("");
  const [navSearch, setNavSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Semua");
  const [selectedRam, setSelectedRam] = useState("Semua");
  const [showNavSearch, setShowNavSearch] = useState(false);
  const [navSuggestions, setNavSuggestions] = useState([]);
  const searchRef = useRef(null);

  const allProducts = [...hp, ...tablet];
  const products = activeTab === "hp" ? hp : tablet;
  const brands = ["Semua", ...Array.from(new Set(products.map(p => p.brand))).sort()];
  const rams = ["Semua", ...Array.from(new Set(
    products.filter(p => p.ram && p.ram !== "-").map(p => p.ram)
  )).sort((a,b) => parseInt(a) - parseInt(b))];

  // Brand popular dari semua produk
  const brandCounts = {};
  allProducts.forEach(p => { brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1; });
  const popularBrands = Object.entries(brandCounts).sort((a,b) => b[1]-a[1]).slice(0, 8).map(([b]) => b);

  // Nav search suggestions
  useEffect(() => {
    if (navSearch.length < 2) { setNavSuggestions([]); return; }
    const q = navSearch.toLowerCase();
    const results = allProducts.filter(p =>
      p.model.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    ).slice(0, 5);
    setNavSuggestions(results);
  }, [navSearch]);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.model.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    const matchBrand = selectedBrand === "Semua" || p.brand === selectedBrand;
    const matchRam = selectedRam === "Semua" || p.ram === selectedRam;
    return matchSearch && matchBrand && matchRam;
  });

  const totalStok = allProducts.length;

  const handleBrandClick = (brand) => {
    setSelectedBrand(brand);
    const type = hp.some(p => p.brand === brand) ? "hp" : "tablet";
    setActiveTab(type);
    document.getElementById("produk-section").scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ background: G.bg, minHeight: "100vh", color: G.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${G.border}`, padding: "0 20px", height: 64, display: "flex", alignItems: "center", gap: 16 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }} onClick={() => router.push("/")} className="cursor-pointer">
          <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer" }}>📱</div>
          <div style={{ cursor: "pointer" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: G.blue, letterSpacing: "-0.5px", lineHeight: 1 }}>PontiCell</div>
            <div style={{ fontSize: 9, color: G.gray }}>by.Max · Pontianak</div>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ flex: 1, position: "relative", maxWidth: 480 }}>
          <div style={{ display: "flex", alignItems: "center", background: G.grayLight, border: `1px solid ${G.border}`, borderRadius: 10, padding: "0 14px", height: 40, gap: 8 }}>
            <span style={{ fontSize: 14, color: G.gray }}>🔍</span>
            <input
              ref={searchRef}
              style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: G.text, fontFamily: "inherit" }}
              placeholder="Cari HP, Tablet, brand..."
              value={navSearch}
              onChange={e => setNavSearch(e.target.value)}
              onFocus={() => setShowNavSearch(true)}
              onBlur={() => setTimeout(() => setShowNavSearch(false), 200)}
            />
            {navSearch && <span style={{ cursor: "pointer", color: G.gray, fontSize: 12 }} onClick={() => setNavSearch("")}>✕</span>}
          </div>

          {/* Suggestions dropdown */}
          {showNavSearch && navSuggestions.length > 0 && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: G.white, borderRadius: 12, border: `1px solid ${G.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", overflow: "hidden", zIndex: 100 }}>
              {navSuggestions.map(p => (
                <div key={p.id} onClick={() => router.push(`/produk/${p.id}`)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${G.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = G.grayLight}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", background: G.grayLight, flexShrink: 0 }}>
                    {p.photos?.[0] ? <img src={p.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>📱</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: G.text }}>{p.brand} {p.model}</div>
                    <div style={{ fontSize: 11, color: G.blue, fontWeight: 700 }}>{formatRp(p.sell_price)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WA Button */}
        <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20PontiCell`} target="_blank" rel="noopener noreferrer"
          style={{ background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, color: G.white, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" }}>
          💬 WA
        </a>
      </nav>

      {/* Hero */}
      <div style={{ minHeight: "100vh", paddingTop: 64, background: `linear-gradient(160deg, #0D47A1 0%, #1565C0 50%, #1E88E5 100%)`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center", padding: "80px 24px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "15%", left: "5%", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
          {["✅ Garansi Toko", "📍 4 Cabang Pontianak", "💯 Produk Original", "🚀 Respon Cepat"].map(b => (
            <span key={b} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)" }}>{b}</span>
          ))}
        </div>

        <h1 style={{ fontSize: "clamp(32px, 6vw, 64px)", fontWeight: 900, color: G.white, lineHeight: 1.1, margin: "0 0 16px" }}>
          Toko HP & Tablet<br /><span style={{ color: "#90CAF9" }}>Terpercaya</span> di Pontianak
        </h1>
        <p style={{ fontSize: "clamp(14px, 2vw, 18px)", color: "rgba(255,255,255,0.75)", marginBottom: 40, maxWidth: 500 }}>
          {totalStok}+ produk tersedia · Harga terbaik · Stok selalu update
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button style={{ background: G.white, color: G.blue, border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
            onClick={() => document.getElementById("produk-section").scrollIntoView({ behavior: "smooth" })}>
            🛍️ Lihat Produk
          </button>
          <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20PontiCell`} target="_blank" rel="noopener noreferrer"
            style={{ background: "rgba(255,255,255,0.15)", color: G.white, border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 800, textDecoration: "none", backdropFilter: "blur(4px)" }}>
            💬 WhatsApp
          </a>
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 60, flexWrap: "wrap", justifyContent: "center" }}>
          {[{ label: "Produk", value: totalStok + "+" }, { label: "Cabang", value: "4" }, { label: "Garansi", value: "✓" }, { label: "Respon", value: "< 5 Mnt" }].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 16, padding: "20px 24px", textAlign: "center", minWidth: 90, backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: G.white, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Popular */}
      {popularBrands.length > 0 && (
        <div style={{ background: G.white, padding: "48px 24px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: G.text, marginBottom: 20, textAlign: "center" }}>Brand Populer</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              {popularBrands.map(brand => (
                <button key={brand} onClick={() => handleBrandClick(brand)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 20px", background: G.grayLight, border: `1px solid ${G.border}`, borderRadius: 14, cursor: "pointer", fontFamily: "inherit", minWidth: 80, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = G.blue; e.currentTarget.style.background = G.blueAccent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.background = G.grayLight; }}>
                  {BRAND_ICONS[brand]
                    ? <img src={BRAND_ICONS[brand]} alt={brand} style={{ height: 28, objectFit: "contain", maxWidth: 70 }} />
                    : <div style={{ fontSize: 22, fontWeight: 800, color: G.blue }}>{brand[0]}</div>
                  }
                  <div style={{ fontSize: 11, fontWeight: 700, color: G.text }}>{brand}</div>
                  <div style={{ fontSize: 10, color: G.gray }}>{brandCounts[brand]} produk</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Produk Section */}
      <div id="produk-section" style={{ padding: "60px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: "clamp(20px, 4vw, 32px)", fontWeight: 800, color: G.text }}>Semua Produk</div>
            <div style={{ fontSize: 13, color: G.gray, marginTop: 2 }}>{filtered.length} produk tersedia</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ padding: "10px 14px", background: G.white, border: `1px solid ${G.border}`, borderRadius: 10, color: G.text, fontSize: 13, fontFamily: "inherit", outline: "none", width: 200, boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}
              placeholder="🔍 Cari produk..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[["hp", `📱 HP (${hp.length})`], ["tablet", `📟 Tablet (${tablet.length})`]].map(([t, l]) => (
            <button key={t} onClick={() => { setActiveTab(t); setSelectedBrand("Semua"); setSelectedRam("Semua"); }}
              style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: activeTab === t ? `linear-gradient(135deg, ${G.blue}, ${G.blueLight})` : G.white, color: activeTab === t ? G.white : G.gray, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: activeTab === t ? `0 4px 16px rgba(21,101,192,0.3)` : "0 2px 6px rgba(0,0,0,0.06)", transition: "all 0.2s" }}>
              {l}
            </button>
          ))}
        </div>

        {/* Filter Brand */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          {brands.map(b => (
            <button key={b} onClick={() => setSelectedBrand(b)}
              style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${selectedBrand === b ? G.blue : G.border}`, background: selectedBrand === b ? G.blueAccent : G.white, color: selectedBrand === b ? G.blue : G.gray, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
              {b}
            </button>
          ))}
        </div>

        {/* Filter RAM */}
        {rams.length > 2 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: G.gray, fontWeight: 700 }}>RAM:</span>
            {rams.map(r => (
              <button key={r} onClick={() => setSelectedRam(r)}
                style={{ padding: "4px 12px", borderRadius: 16, border: `1px solid ${selectedRam === r ? G.blue : G.border}`, background: selectedRam === r ? G.blueAccent : G.white, color: selectedRam === r ? G.blue : G.gray, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => router.push(`/produk/${p.id}`)}
                style={{ background: G.white, borderRadius: 14, border: `1px solid ${G.border}`, overflow: "hidden", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = G.blue; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px rgba(21,101,192,0.12)`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}>
                {/* Foto */}
                <div style={{ width: "100%", aspectRatio: "1", background: "#F8F9FA", overflow: "hidden", position: "relative" }}>
                  {p.photos?.[0]
                    ? <img src={p.photos[0]} alt={p.model} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📱</div>
                  }
                  <div style={{ position: "absolute", top: 8, left: 8, background: p.condition === "Baru" ? "#E8F5E9" : "#FFF8E1", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: p.condition === "Baru" ? "#2E7D32" : "#F57F17", fontWeight: 700 }}>
                    {p.condition}
                  </div>
                </div>
                {/* Info */}
                <div style={{ padding: "12px 12px 14px" }}>
                  <div style={{ fontSize: 10, color: G.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>{p.brand}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: G.text, marginBottom: 4, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.model}</div>
                  <div style={{ fontSize: 11, color: G.gray, marginBottom: 8 }}>{p.ram !== "-" ? `${p.ram} / ` : ""}{p.storage}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: G.blue }}>{formatRp(p.sell_price)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Testimoni */}
      {testimoni.length > 0 && (
        <div style={{ background: G.white, padding: "64px 24px", borderTop: `1px solid ${G.border}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ fontSize: "clamp(20px, 4vw, 32px)", fontWeight: 800, color: G.text, textAlign: "center", marginBottom: 6 }}>Testimoni Pelanggan</div>
            <div style={{ fontSize: 13, color: G.gray, textAlign: "center", marginBottom: 36 }}>Apa kata mereka setelah belanja di PontiCell</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {testimoni.map(t => (
                <div key={t.id} style={{ background: G.bg, borderRadius: 14, border: `1px solid ${G.border}`, overflow: "hidden" }}>
                  <div style={{ height: 190, overflow: "hidden" }}>
                    <img src={t.foto} alt="testimoni" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 13, color: G.text, lineHeight: 1.5, fontStyle: "italic" }}>"{t.keterangan}"</div>
                    <div style={{ fontSize: 10, color: G.gray, marginTop: 8 }}>{new Date(t.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cabang */}
      <div style={{ padding: "64px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ fontSize: "clamp(20px, 4vw, 32px)", fontWeight: 800, color: G.text, textAlign: "center", marginBottom: 6 }}>Lokasi Cabang</div>
        <div style={{ fontSize: 13, color: G.gray, textAlign: "center", marginBottom: 36 }}>Temukan kami di 4 lokasi di Pontianak</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {[
            { nama: "Cabang KP", lokasi: "Kota Pontianak Pusat", icon: "🏪" },
            { nama: "Cabang Jawi", lokasi: "Pontianak Selatan", icon: "🏬" },
            { nama: "Cabang Kobar", lokasi: "Kotabaru", icon: "🏢" },
            { nama: "Cabang Jeruju", lokasi: "Pontianak Barat", icon: "🏪" },
          ].map(c => (
            <div key={c.nama} style={{ background: G.white, borderRadius: 14, border: `1px solid ${G.border}`, padding: "24px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 4 }}>{c.nama}</div>
              <div style={{ fontSize: 12, color: G.gray, marginBottom: 14 }}>{c.lokasi}</div>
              <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20PontiCell,%20saya%20ingin%20tanya%20stok%20di%20${c.nama}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-block", padding: "7px 16px", background: G.blueAccent, border: `1px solid ${G.blue}`, color: G.blue, borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                💬 Tanya Stok
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: `linear-gradient(135deg, ${G.blueDark}, ${G.blue})`, padding: "56px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: G.white, marginBottom: 8 }}>Siap Beli HP Impianmu?</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 24 }}>Chat kami sekarang dan dapatkan penawaran terbaik</div>
        <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20PontiCell,%20saya%20mau%20order%20HP`} target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-block", padding: "14px 32px", background: G.white, color: G.blue, borderRadius: 12, fontSize: 15, fontWeight: 800, textDecoration: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          💬 Chat WhatsApp Sekarang
        </a>
      </div>

      {/* Footer */}
      <div style={{ background: G.blueDark, padding: "36px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: G.white, marginBottom: 4 }}>PontiCell</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>by.Max · Toko HP & Tablet Terpercaya di Pontianak</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>© 2026 PontiCell. All rights reserved.</div>
      </div>
    </div>
  );
}
