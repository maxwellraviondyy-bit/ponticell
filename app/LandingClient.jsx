"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const formatRp = (n) => "Rp " + Number(n).toLocaleString("id-ID");

const G = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0",
  blue: "#1565C0", blueLight: "#1E88E5", blueDark: "#0D47A1",
  blueAccent: "#E3F2FD", white: "#FFFFFF",
  gray: "#64748B", grayLight: "#F1F5F9", text: "#0F172A",
};

export default function LandingClient({ hp, tablet, testimoni, banners = [], brandLogos = {}, cabangFotos = {}, infoNama, infoTagline, infoWa }) {
  const router = useRouter();
  const WA = infoWa || "6283808484969";
  const [activeTab, setActiveTab] = useState("hp");
  const [search, setSearch] = useState("");
  const [navSearch, setNavSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Semua");
  const [selectedRam, setSelectedRam] = useState("Semua");
  const [navSuggestions, setNavSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);

  const allProducts = [...hp, ...tablet];
  const products = activeTab === "hp" ? hp : tablet;
  const brands = ["Semua", ...Array.from(new Set(products.map(p => p.brand))).sort()];
  const rams = ["Semua", ...Array.from(new Set(
    products.filter(p => p.ram && p.ram !== "-").map(p => p.ram)
  )).sort((a,b) => parseInt(a)-parseInt(b))];

  const brandCounts = {};
  allProducts.forEach(p => { brandCounts[p.brand] = (brandCounts[p.brand]||0)+1; });
  const popularBrands = Object.entries(brandCounts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([b])=>b);

  // Banner slideshow
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setBannerIdx(i => (i+1) % banners.length), 4000);
    return () => clearInterval(t);
  }, [banners.length]);

  // Nav search
  useEffect(() => {
    if (navSearch.length < 2) { setNavSuggestions([]); return; }
    const q = navSearch.toLowerCase();
    setNavSuggestions(allProducts.filter(p => p.model.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)).slice(0,5));
  }, [navSearch]);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (!q || p.model.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
      && (selectedBrand === "Semua" || p.brand === selectedBrand)
      && (selectedRam === "Semua" || p.ram === selectedRam);
  });

  const handleBrandClick = (brand) => {
    setSelectedBrand(brand);
    setActiveTab(hp.some(p => p.brand === brand) ? "hp" : "tablet");
    document.getElementById("produk-section").scrollIntoView({ behavior: "smooth" });
  };

  const CABANG_LIST = [
    { id: "kp", nama: "Cabang KP", lokasi: "Kota Pontianak Pusat" },
    { id: "jawi", nama: "Cabang Jawi", lokasi: "Pontianak Selatan" },
    { id: "kobar", nama: "Cabang Kobar", lokasi: "Kotabaru" },
    { id: "jeruju", nama: "Cabang Jeruju", lokasi: "Pontianak Barat" },
  ];

  return (
    <div style={{ background: G.bg, minHeight: "100vh", color: G.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${G.border}`, padding: "0 20px", height: 64, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, cursor: "pointer" }} onClick={() => router.push("/")}>
          <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📱</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: G.blue, lineHeight: 1 }}>{infoNama || "PontiCell"}</div>
            <div style={{ fontSize: 9, color: G.gray }}>by.Max · Pontianak</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ flex: 1, position: "relative", maxWidth: 480 }}>
          <div style={{ display: "flex", alignItems: "center", background: G.grayLight, border: `1px solid ${G.border}`, borderRadius: 10, padding: "0 14px", height: 40, gap: 8 }}>
            <span style={{ color: G.gray }}>🔍</span>
            <input style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: G.text, fontFamily: "inherit" }}
              placeholder="Cari HP, Tablet, brand..."
              value={navSearch}
              onChange={e => setNavSearch(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 200)} />
            {navSearch && <span style={{ cursor: "pointer", color: G.gray }} onClick={() => setNavSearch("")}>✕</span>}
          </div>
          {showSuggest && navSuggestions.length > 0 && (
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
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{p.brand} {p.model}</div>
                    <div style={{ fontSize: 11, color: G.blue, fontWeight: 700 }}>{formatRp(p.sell_price)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <a href={`https://wa.me/${WA}?text=Halo%20${infoNama}`} target="_blank" rel="noopener noreferrer"
          style={{ background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, color: G.white, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
          💬 WA
        </a>
      </nav>

      {/* Hero - Banner atau gradient */}
      {banners.length > 0 ? (
        <div style={{ marginTop: 64, position: "relative", height: "55vh", minHeight: 320, overflow: "hidden" }}>
          {banners.map((src, i) => (
            <img key={i} src={src} alt={`banner ${i+1}`}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: i === bannerIdx ? 1 : 0, transition: "opacity 0.8s ease" }} />
          ))}
          {/* Overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(13,71,161,0.75) 0%, rgba(13,71,161,0.3) 60%, transparent 100%)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 40px" }}>
            <h1 style={{ fontSize: "clamp(24px, 5vw, 52px)", fontWeight: 900, color: G.white, margin: "0 0 10px", maxWidth: 600 }}>{infoNama || "PontiCell"}</h1>
            <p style={{ fontSize: "clamp(13px, 2vw, 18px)", color: "rgba(255,255,255,0.85)", margin: "0 0 24px", maxWidth: 480 }}>{infoTagline}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={{ background: G.white, color: G.blue, border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
                onClick={() => document.getElementById("produk-section").scrollIntoView({ behavior: "smooth" })}>
                🛍️ Lihat Produk
              </button>
              <a href={`https://wa.me/${WA}`} target="_blank" rel="noopener noreferrer"
                style={{ background: "rgba(255,255,255,0.2)", color: G.white, border: "1px solid rgba(255,255,255,0.4)", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 800, textDecoration: "none" }}>
                💬 WhatsApp
              </a>
            </div>
          </div>
          {/* Dots */}
          {banners.length > 1 && (
            <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
              {banners.map((_, i) => (
                <div key={i} onClick={() => setBannerIdx(i)}
                  style={{ width: i === bannerIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === bannerIdx ? G.white : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.3s" }} />
              ))}
            </div>
          )}
        </div>
      ) : (
        // Fallback gradient hero jika belum ada banner
        <div style={{ minHeight: "75vh", paddingTop: 64, background: `linear-gradient(160deg, ${G.blueDark} 0%, ${G.blue} 50%, ${G.blueLight} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center", padding: "80px 24px 60px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "15%", left: "5%", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 }}>
            {["✅ Garansi Toko", "📍 4 Cabang", "💯 Original", "🚀 Respon Cepat"].map(b => (
              <span key={b} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "rgba(255,255,255,0.9)" }}>{b}</span>
            ))}
          </div>
          <h1 style={{ fontSize: "clamp(28px, 6vw, 60px)", fontWeight: 900, color: G.white, lineHeight: 1.1, margin: "0 0 14px" }}>
            {infoNama || "PontiCell"}<br /><span style={{ color: "#90CAF9" }}>Terpercaya</span> di Pontianak
          </h1>
          <p style={{ fontSize: "clamp(13px, 2vw, 17px)", color: "rgba(255,255,255,0.75)", marginBottom: 36, maxWidth: 480 }}>{infoTagline}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button style={{ background: G.white, color: G.blue, border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
              onClick={() => document.getElementById("produk-section").scrollIntoView({ behavior: "smooth" })}>🛍️ Lihat Produk</button>
            <a href={`https://wa.me/${WA}`} target="_blank" rel="noopener noreferrer"
              style={{ background: "rgba(255,255,255,0.15)", color: G.white, border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 800, textDecoration: "none" }}>💬 WhatsApp</a>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 52, flexWrap: "wrap", justifyContent: "center" }}>
            {[{ l: "Produk", v: allProducts.length+"+" }, { l: "Cabang", v: "4" }, { l: "Garansi", v: "✓" }, { l: "Respon", v: "<5 Mnt" }].map(s => (
              <div key={s.l} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "18px 22px", textAlign: "center", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: G.white, marginBottom: 3 }}>{s.v}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brand Popular */}
      {popularBrands.length > 0 && (
        <div style={{ background: G.white, padding: "40px 24px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: G.text, marginBottom: 18, textAlign: "center" }}>Brand Populer</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              {popularBrands.map(brand => {
                const logoKey = brand.toLowerCase();
                const logo = brandLogos[logoKey];
                return (
                  <button key={brand} onClick={() => handleBrandClick(brand)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 18px", background: G.grayLight, border: `1px solid ${G.border}`, borderRadius: 12, cursor: "pointer", fontFamily: "inherit", minWidth: 76, transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = G.blue; e.currentTarget.style.background = G.blueAccent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.background = G.grayLight; }}>
                    {logo
                      ? <img src={logo} alt={brand} style={{ height: 28, objectFit: "contain", maxWidth: 70 }} />
                      : <div style={{ fontSize: 20, fontWeight: 900, color: G.blue, width: 70, textAlign: "center" }}>{brand.slice(0,3)}</div>
                    }
                    <div style={{ fontSize: 11, fontWeight: 700, color: G.text }}>{brand}</div>
                    <div style={{ fontSize: 10, color: G.gray }}>{brandCounts[brand]} produk</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Produk Section */}
      <div id="produk-section" style={{ padding: "56px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, color: G.text }}>Semua Produk</div>
            <div style={{ fontSize: 13, color: G.gray, marginTop: 2 }}>{filtered.length} produk tersedia</div>
          </div>
          <input style={{ padding: "10px 14px", background: G.white, border: `1px solid ${G.border}`, borderRadius: 10, color: G.text, fontSize: 13, fontFamily: "inherit", outline: "none", width: 200, boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}
            placeholder="🔍 Cari produk..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[["hp", `📱 HP (${hp.length})`], ["tablet", `📟 Tablet (${tablet.length})`]].map(([t, l]) => (
            <button key={t} onClick={() => { setActiveTab(t); setSelectedBrand("Semua"); setSelectedRam("Semua"); }}
              style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: activeTab === t ? `linear-gradient(135deg, ${G.blue}, ${G.blueLight})` : G.white, color: activeTab === t ? G.white : G.gray, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: activeTab === t ? `0 4px 14px rgba(21,101,192,0.3)` : "0 2px 6px rgba(0,0,0,0.06)", transition: "all 0.2s" }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          {brands.map(b => (
            <button key={b} onClick={() => setSelectedBrand(b)}
              style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${selectedBrand === b ? G.blue : G.border}`, background: selectedBrand === b ? G.blueAccent : G.white, color: selectedBrand === b ? G.blue : G.gray, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
              {b}
            </button>
          ))}
        </div>

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

        {filtered.length === 0
          ? <div style={{ textAlign: "center", padding: "80px 0", color: G.gray }}><div style={{ fontSize: 48, marginBottom: 12 }}>📭</div><div style={{ fontSize: 16, fontWeight: 600 }}>Produk tidak ditemukan</div></div>
          : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
              {filtered.map(p => (
                <div key={p.id} onClick={() => router.push(`/produk/${p.id}`)}
                  style={{ background: G.white, borderRadius: 14, border: `1px solid ${G.border}`, overflow: "hidden", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = G.blue; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px rgba(21,101,192,0.12)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}>
                  <div style={{ width: "100%", aspectRatio: "1", background: "#F8F9FA", overflow: "hidden", position: "relative" }}>
                    {p.photos?.[0]
                      ? <img src={p.photos[0]} alt={p.model} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📱</div>
                    }
                    <div style={{ position: "absolute", top: 8, left: 8, background: p.condition === "Baru" ? "#E8F5E9" : "#FFF8E1", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: p.condition === "Baru" ? "#2E7D32" : "#F57F17", fontWeight: 700 }}>
                      {p.condition}
                    </div>
                  </div>
                  <div style={{ padding: "12px 12px 14px" }}>
                    <div style={{ fontSize: 10, color: G.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>{p.brand}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: G.text, marginBottom: 4, lineHeight: 1.3 }}>{p.model}</div>
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
        <div style={{ background: G.white, padding: "60px 24px", borderTop: `1px solid ${G.border}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, color: G.text, textAlign: "center", marginBottom: 6 }}>Testimoni Pelanggan</div>
            <div style={{ fontSize: 13, color: G.gray, textAlign: "center", marginBottom: 32 }}>Apa kata mereka setelah belanja di {infoNama}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
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
      <div style={{ padding: "60px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, color: G.text, textAlign: "center", marginBottom: 6 }}>Lokasi Cabang</div>
        <div style={{ fontSize: 13, color: G.gray, textAlign: "center", marginBottom: 32 }}>Temukan kami di 4 lokasi di Pontianak</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {CABANG_LIST.map(c => {
            const foto = cabangFotos[c.id];
            return (
              <div key={c.id} style={{ background: G.white, borderRadius: 14, border: `1px solid ${G.border}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                {foto
                  ? <div style={{ height: 140, overflow: "hidden" }}><img src={foto} alt={c.nama} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
                  : <div style={{ height: 100, background: G.grayLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🏪</div>
                }
                <div style={{ padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 4 }}>{c.nama}</div>
                  <div style={{ fontSize: 12, color: G.gray, marginBottom: 12 }}>{c.lokasi}</div>
                  <a href={`https://wa.me/${WA}?text=Halo%20${infoNama},%20saya%20ingin%20tanya%20stok%20di%20${c.nama}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-block", padding: "7px 16px", background: G.blueAccent, border: `1px solid ${G.blue}`, color: G.blue, borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                    💬 Tanya Stok
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: `linear-gradient(135deg, ${G.blueDark}, ${G.blue})`, padding: "56px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: G.white, marginBottom: 8 }}>Siap Beli HP Impianmu?</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 24 }}>Chat kami sekarang dan dapatkan penawaran terbaik</div>
        <a href={`https://wa.me/${WA}?text=Halo%20${infoNama},%20saya%20mau%20order%20HP`} target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-block", padding: "14px 32px", background: G.white, color: G.blue, borderRadius: 12, fontSize: 15, fontWeight: 800, textDecoration: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          💬 Chat WhatsApp Sekarang
        </a>
      </div>

      {/* Footer */}
      <div style={{ background: G.blueDark, padding: "36px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: G.white, marginBottom: 4 }}>{infoNama || "PontiCell"}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>by.Max · {infoTagline}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>© 2026 {infoNama}. All rights reserved.</div>
      </div>
    </div>
  );
}
