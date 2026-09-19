"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toggleWishlist, isWishlisted, getWishlistCount } from "@/lib/wishlist";
import Chatbot from "./Chatbot";

const formatRp = (n) => "Rp " + Number(n).toLocaleString("id-ID");

const G = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0",
  blue: "#1565C0", blueLight: "#1E88E5", blueDark: "#0D47A1",
  blueAccent: "#E3F2FD", white: "#FFFFFF",
  gray: "#64748B", grayLight: "#F1F5F9", text: "#0F172A",
};

export default function LandingClient({ hp, tablet, testimoni, banners = [], bannersMobile = [], brandLogos = {}, cabangFotos = {}, infoNama, infoTagline, infoWa }) {
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
  const [showAllTesti, setShowAllTesti] = useState(false);
  const [countersStarted, setCountersStarted] = useState(false);
  const [counterVals, setCounterVals] = useState({ terjual: 0, rating: 0, cabang: 0 });
  const statsRef = useRef(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlisted, setWishlisted] = useState({});
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [priceFilter, setPriceFilter] = useState([0, 0]);

  const allProducts = [...hp, ...tablet];
  const products = activeTab === "hp" ? hp : tablet;
  const brands = ["Semua", ...Array.from(new Set(products.map(p => p.brand))).sort()];
  const rams = ["Semua", ...Array.from(new Set(
    products.filter(p => p.ram && p.ram !== "-").map(p => p.ram)
  )).sort((a,b) => parseInt(a)-parseInt(b))];

  const brandCounts = {};
  allProducts.forEach(p => { brandCounts[p.brand] = (brandCounts[p.brand]||0)+1; });
  const popularBrands = Object.entries(brandCounts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([b])=>b);

  // Init price range
  useEffect(() => {
    if (allProducts.length === 0) return;
    const prices = allProducts.map(p => Number(p.sell_price));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    setPriceRange([min, max]);
    setPriceFilter([min, max]);
  }, [hp.length, tablet.length]);

  // Counter animation - start after short delay on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (countersStarted) return;
      setCountersStarted(true);
      let t = 0;
      const iv1 = setInterval(() => { t += 40; setCounterVals(v => ({ ...v, terjual: Math.min(t, 1000) })); if (t >= 1000) clearInterval(iv1); }, 15);
      let r = 0;
      const iv2 = setInterval(() => { r = parseFloat((r + 0.1).toFixed(1)); setCounterVals(v => ({ ...v, rating: Math.min(r, 4.9) })); if (r >= 4.9) clearInterval(iv2); }, 25);
      let c = 0;
      const iv3 = setInterval(() => { c += 1; setCounterVals(v => ({ ...v, cabang: Math.min(c, 5) })); if (c >= 5) clearInterval(iv3); }, 120);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Init price range from products
  useEffect(() => {
    const prods = [...hp, ...tablet];
    if (prods.length === 0) return;
    const prices = prods.map(p => Number(p.sell_price));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    setPriceRange([min, max]);
    setPriceFilter([min, max]);
  }, [hp.length, tablet.length]);

  // Init wishlist
  useEffect(() => {
    try {
      const count = getWishlistCount();
      setWishlistCount(count);
      const list = JSON.parse(localStorage.getItem("ponticell_wishlist") || "[]");
      const map = {};
      list.forEach(i => { map[i.id] = true; });
      setWishlisted(map);
    } catch {}
  }, []);

  // Banner slideshow
  useEffect(() => {
    const total = Math.max(banners.length, bannersMobile.length);
    if (total <= 1) return;
    const t = setInterval(() => setBannerIdx(i => (i+1) % total), 4000);
    return () => clearInterval(t);
  }, [banners.length, bannersMobile.length]);

  // Nav search
  useEffect(() => {
    if (navSearch.length < 2) { setNavSuggestions([]); return; }
    const q = navSearch.toLowerCase();
    setNavSuggestions(allProducts.filter(p => p.model.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)).slice(0,5));
  }, [navSearch]);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const price = Number(p.sell_price);
    const inPriceRange = priceFilter[1] === 0 || (price >= priceFilter[0] && price <= priceFilter[1]);
    return (!q || p.model.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
      && (selectedBrand === "Semua" || p.brand === selectedBrand)
      && (selectedRam === "Semua" || p.ram === selectedRam)
      && inPriceRange;
  });

  const handleWishlist = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = toggleWishlist(product);
    const map = {};
    updated.forEach(i => { map[i.id] = true; });
    setWishlisted(map);
    setWishlistCount(updated.length);
  };

  const formatRpShort = (n) => {
    if (n >= 1000000) return "Rp " + (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + " jt";
    if (n >= 1000) return "Rp " + Math.round(n / 1000) + " rb";
    return "Rp " + n;
  };

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
      <style>{`
        .product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .wa-text { display: none; }
        .banner-hero { height: 100vw; max-height: 90vh; min-height: 320px; }
        @media (min-width: 768px) { .banner-hero { height: 56vw; max-height: 80vh; min-height: 480px; } }
        .banner-desktop { display: none !important; }
        .banner-mobile { display: block !important; }
        @media (min-width: 768px) { 
          .banner-desktop { display: block !important; }
          .banner-mobile { display: none !important; }
        }
        .banner-title { font-size: clamp(28px, 8vw, 60px) !important; }
        .banner-sub { font-size: clamp(14px, 2.5vw, 20px) !important; }
        .banner-overlay { padding: 0 24px !important; }
        @media (min-width: 768px) { .banner-overlay { padding: 0 60px !important; } }
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (min-width: 480px) { .wa-text { display: inline; } }
        @media (min-width: 640px) { .product-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; } }
        @media (min-width: 1024px) { .product-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; } }
        @media (min-width: 1280px) { .product-grid { grid-template-columns: repeat(5, 1fr); gap: 18px; } }
        .testi-btn-mobile { display: none; }
        @media (max-width: 767px) {
          .testi-grid:not(.show-all) { grid-template-columns: repeat(2, 1fr) !important; }
          .testi-grid:not(.show-all) > div:nth-child(n + 5) { display: none; }
          .testi-btn-desktop { display: none; }
          .testi-btn-mobile { display: block; }
        }

        /* Fade in animations */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .fade-up { animation: fadeInUp 0.6s ease both; }
        .fade-up-1 { animation: fadeInUp 0.6s 0.1s ease both; }
        .fade-up-2 { animation: fadeInUp 0.6s 0.2s ease both; }
        .fade-up-3 { animation: fadeInUp 0.6s 0.3s ease both; }
        .fade-up-4 { animation: fadeInUp 0.6s 0.4s ease both; }
        .fade-scale { animation: fadeInScale 0.5s ease both; }

        /* Product card hover */
        .prod-card { transition: transform 0.2s ease, box-shadow 0.2s ease !important; }
        .prod-card:hover { transform: translateY(-4px) !important; box-shadow: 0 12px 32px rgba(21,101,192,0.15) !important; }
        .prod-card:active { transform: translateY(-1px) !important; }

        /* Brand card hover */
        .brand-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease !important; }
        .brand-card:hover { transform: translateY(-3px) scale(1.03) !important; box-shadow: 0 8px 24px rgba(21,101,192,0.12) !important; border-color: #1565C0 !important; }

        /* Button pulse */
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 4px 14px rgba(21,101,192,0.3); }
          50% { box-shadow: 0 8px 24px rgba(21,101,192,0.5); }
        }
        .btn-pulse { animation: btnPulse 2s infinite; }

        /* Testi card hover */
        .testi-card { transition: transform 0.2s ease, box-shadow 0.2s ease !important; }
        .testi-card:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }

        /* Stats card glow */
        .stat-card { transition: background 0.3s, transform 0.2s !important; }
        .stat-card:hover { transform: scale(1.05) !important; background: rgba(255,255,255,0.2) !important; }

        /* Trust card hover */
        .trust-card { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease !important; }
        .trust-card:hover { transform: translateY(-6px) !important; box-shadow: 0 16px 40px rgba(0,0,0,0.1) !important; }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: "#FFFFFF", padding: "0px", flexDirection: "column", display: "flex" }}>
        {/* Ticker inside navbar */}
        <div style={{ width: "100%", background: `linear-gradient(135deg, ${G.blueDark}, ${G.blue})`, overflow: "hidden", height: 30 }}>
          <style>{`
            @keyframes tickerMove {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .tk { display: inline-flex; animation: tickerMove 15s linear infinite; white-space: nowrap; align-items: center; height: 30px; }
            .tk span { font-size: 11px; color: rgba(255,255,255,0.92); font-weight: 600; padding: 0 22px; flex-shrink: 0; }
            .tk b { opacity: 0.3; font-size: 7px; flex-shrink: 0; font-weight: 400; }
          `}</style>
          <div className="tk">
            <span>🚚 Gratis Ongkir</span><b>●</b>
            <span>🔒 Transaksi Aman</span><b>●</b>
            <span>✅ Produk Original</span><b>●</b>
            <span>💬 CS Siap Bantu</span><b>●</b>
            <span>🛡️ Garansi 14 Hari</span><b>●</b>
            <span>⭐ Rating 4.9/5</span><b>●</b>
            <span>📦 1.000+ Terjual</span><b>●</b>
            <span>🏪 5+ Cabang Resmi</span><b>●</b>
            <span>🚚 Gratis Ongkir</span><b>●</b>
            <span>🔒 Transaksi Aman</span><b>●</b>
            <span>✅ Produk Original</span><b>●</b>
            <span>💬 CS Siap Bantu</span><b>●</b>
            <span>🛡️ Garansi 14 Hari</span><b>●</b>
            <span>⭐ Rating 4.9/5</span><b>●</b>
            <span>📦 1.000+ Terjual</span><b>●</b>
            <span>🏪 5+ Cabang Resmi</span><b>●</b>
          </div>
        </div>
        {/* Main nav row */}
        <div style={{ width: "100%", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", boxSizing: "border-box", borderBottom: `1px solid ${G.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, cursor: "pointer" }} onClick={() => router.push("/")}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: G.blue, lineHeight: 1 }}>{infoNama || "PontiCell"}</div>
            <div style={{ fontSize: 9, color: G.black, textAlign: "right" }}> · Pontianak</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ flex: 1, position: "relative", maxWidth: 480, minWidth: 0 }}>
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
            <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, minWidth: 240, background: G.white, borderRadius: 12, border: `1px solid ${G.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", overflow: "hidden", zIndex: 100 }}>
              {navSuggestions.map(p => (
                <Link key={p.id} href={`/produk/${p.id}`}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${G.border}`, textDecoration: "none", color: "inherit" }}
                  onMouseEnter={e => e.currentTarget.style.background = G.grayLight}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", background: G.grayLight, flexShrink: 0 }}>
                    {p.photos?.[0] ? <img src={p.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>📱</div>}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.brand} {p.model}</div>
                    <div style={{ fontSize: 11, color: G.blue, fontWeight: 700 }}>{formatRp(p.sell_price)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link href="/wishlist" style={{ position: "relative", background: wishlistCount > 0 ? "#FEE2E2" : G.grayLight, border: `1px solid ${wishlistCount > 0 ? "#EF4444" : G.border}`, borderRadius: 8, padding: "7px 12px", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 16 }}>❤️</span>
            {wishlistCount > 0 && <span style={{ fontSize: 12, fontWeight: 800, color: "#EF4444" }}>{wishlistCount}</span>}
          </Link>
          <a href={`https://wa.me/${WA}?text=Halo%20${infoNama}`} target="_blank" rel="noopener noreferrer"
            style={{ background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, color: G.white, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <span>💬</span>
            <span className="wa-text">0838-0848-4969</span>
          </a>
        </div>
        </div>
      </nav>

      {/* Hero - Banner atau gradient */}
      {/* eslint-disable-next-line */}
      {(banners.length > 0 || bannersMobile.length > 0) ? (
          <div className="banner-hero" style={{ marginTop: 82, position: "relative", overflow: "hidden" }}>

            {/* Desktop images - shown on screen >= 768px */}
            {(banners.length > 0 ? banners : bannersMobile).map((src, i) => (
              <img key={"d"+i} src={src} alt={"banner "+(i+1)} className="banner-desktop"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", opacity: i === bannerIdx ? 1 : 0, transition: "opacity 0.8s ease" }} />
            ))}

            {/* Mobile images - shown on screen < 768px */}
            {(bannersMobile.length > 0 ? bannersMobile : banners).map((src, i) => (
              <img key={"m"+i} src={src} alt={"banner mobile "+(i+1)} className="banner-mobile"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", opacity: i === bannerIdx ? 1 : 0, transition: "opacity 0.8s ease" }} />
            ))}

            {/* Overlay gradient kiri */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(13,71,161,0.8) 0%, rgba(13,71,161,0.4) 50%, rgba(13,71,161,0.1) 100%)", pointerEvents: "none" }} />

            {/* Teks overlay */}
            <div className="banner-overlay" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 40px" }}>
              <h1 className="banner-title fade-up" style={{ fontSize: "clamp(28px, 6vw, 56px)", fontWeight: 900, color: G.white, margin: "0 0 12px", maxWidth: 640, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                {infoNama || "PontiCell"}
              </h1>
              <p className="banner-sub fade-up-1" style={{ fontSize: "clamp(14px, 2.5vw, 20px)", color: "rgba(255,255,255,0.9)", margin: "0 0 28px", maxWidth: 520, lineHeight: 1.5, textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
                {infoTagline}
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="fade-up-2 btn-pulse" style={{ background: G.white, color: G.blue, border: "none", borderRadius: 12, padding: "14px 28px", fontSize: "clamp(14px, 2vw, 16px)", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
                  onClick={() => document.getElementById("produk-section").scrollIntoView({ behavior: "smooth" })}>
                  🛍️ Lihat Produk
                </button>
                <a href={`https://wa.me/${WA}`} target="_blank" rel="noopener noreferrer"
                  style={{ background: "rgba(255,255,255,0.15)", color: G.white, border: "1.5px solid rgba(255,255,255,0.6)", borderRadius: 12, padding: "14px 28px", fontSize: "clamp(14px, 2vw, 16px)", fontWeight: 800, textDecoration: "none", backdropFilter: "blur(8px)" }}>
                  💬 WhatsApp
                </a>
              </div>
            </div>

            {/* Dots indicator */}
            {(banners.length > 0 ? banners.length : bannersMobile.length) > 1 && (
              <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 10 }}>
                {Array.from({ length: banners.length > 0 ? banners.length : bannersMobile.length }).map((_, i) => (
                  <div key={i} onClick={() => setBannerIdx(i)}
                    style={{ width: i === bannerIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === bannerIdx ? G.white : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.3s" }} />
                ))}
              </div>
            )}
          </div>
      ) : (
        // Fallback gradient hero jika belum ada banner
        <div style={{ minHeight: "75vh", paddingTop: 82, background: `linear-gradient(160deg, ${G.blueDark} 0%, ${G.blue} 50%, ${G.blueLight} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center", padding: "60px 20px 40px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "15%", left: "5%", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 }}>
            {["🔒 Transaksi Aman", "✅ Produk Original & Bergaransi", "📍 Pontianak & Sekitarnya", "💬 CS Siap Membantu"].map(b => (
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

            { /* Animated counters */ }
            <div ref={statsRef} style={{ display: "contents" }}>
            {[
              { icon: "📦", v: counterVals.terjual >= 1000 ? "1.000+" : counterVals.terjual.toString(), l: "Unit Terjual" },
              { icon: "⭐", v: counterVals.rating >= 4.9 ? "4.9/5" : counterVals.rating.toFixed(1) + "/5", l: "Rating Pembeli" },
              { icon: "🏪", v: counterVals.cabang >= 5 ? "5+" : counterVals.cabang.toString(), l: "Cabang Resmi" },
              { icon: "🛡️", v: "14 Hari", l: "Garansi Toko" },
            ].map(s => (
              <div key={s.l} className="stat-card" style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "16px 20px", textAlign: "center", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.2)", minWidth: 90, cursor: "default" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: G.white, marginBottom: 2, transition: "all 0.1s" }}>{s.v}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{s.l}</div>
              </div>
            ))}
            </div>
          </div>
        </div>
      )}

      {/* Brand Popular */}
      {popularBrands.length > 0 && (
        <div style={{ background: G.white, padding: "40px 24px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: G.text, marginBottom: 6 }}>Brand Populer</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#ECFDF5", border: "1px solid #10B981", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#059669", fontWeight: 700 }}>
                ✅ Semua produk terverifikasi original
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", padding: "0 4px" }}>
              {popularBrands.map(brand => {
                const logoKey = brand.toLowerCase();
                // iPhone produk → cari logo apple
                const logoAlt = brand.toLowerCase() === "iphone" ? "apple" : brand.toLowerCase() === "apple" ? "iphone" : null;
                const logo = brandLogos[logoKey] || (logoAlt ? brandLogos[logoAlt] : null);
                return (
                  <button key={brand} onClick={() => handleBrandClick(brand)}
                    className="brand-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 18px", background: G.grayLight, border: `1px solid ${G.border}`, borderRadius: 12, cursor: "pointer", fontFamily: "inherit", minWidth: 76 }}
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
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: G.gray, fontWeight: 700 }}>RAM:</span>
            {rams.map(r => (
              <button key={r} onClick={() => setSelectedRam(r)}
                style={{ padding: "4px 12px", borderRadius: 16, border: `1px solid ${selectedRam === r ? G.blue : G.border}`, background: selectedRam === r ? G.blueAccent : G.white, color: selectedRam === r ? G.blue : G.gray, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {r === "Semua" ? "Semua" : `${r} GB`}
              </button>
            ))}
          </div>
        )}

        {/* Filter Harga */}
        {priceRange[1] > priceRange[0] && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: G.gray, fontWeight: 700 }}>HARGA</span>
              <span style={{ fontSize: 12, color: G.blue, fontWeight: 800 }}>
                {formatRpShort(priceFilter[0])} — {formatRpShort(priceFilter[1])}
              </span>
            </div>
            <div style={{ position: "relative", height: 36, display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: 0, right: 0, height: 4, background: G.border, borderRadius: 2 }} />
              <div style={{
                position: "absolute",
                left: `${((priceFilter[0]-priceRange[0])/(priceRange[1]-priceRange[0]))*100}%`,
                right: `${100-((priceFilter[1]-priceRange[0])/(priceRange[1]-priceRange[0]))*100}%`,
                height: 4, background: G.blue, borderRadius: 2
              }} />
              <input type="range" min={priceRange[0]} max={priceRange[1]}
                step={Math.round((priceRange[1]-priceRange[0])/100)}
                value={priceFilter[0]}
                onChange={e => { const v = Number(e.target.value); if (v < priceFilter[1] - 500000) setPriceFilter([v, priceFilter[1]]); }}
                style={{ position: "absolute", width: "100%", opacity: 0, cursor: "pointer", height: 36, zIndex: 3, margin: 0 }} />
              <input type="range" min={priceRange[0]} max={priceRange[1]}
                step={Math.round((priceRange[1]-priceRange[0])/100)}
                value={priceFilter[1]}
                onChange={e => { const v = Number(e.target.value); if (v > priceFilter[0] + 500000) setPriceFilter([priceFilter[0], v]); }}
                style={{ position: "absolute", width: "100%", opacity: 0, cursor: "pointer", height: 36, zIndex: 3, margin: 0 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: G.gray }}>
              <span>{formatRpShort(priceRange[0])}</span>
              <span>{formatRpShort(priceRange[1])}</span>
            </div>
            {(priceFilter[0] > priceRange[0] || priceFilter[1] < priceRange[1]) && (
              <button onClick={() => setPriceFilter([priceRange[0], priceRange[1]])}
                style={{ background: "none", border: "none", color: G.blue, fontSize: 11, cursor: "pointer", fontFamily: "inherit", marginTop: 4, padding: 0, fontWeight: 600 }}>
                ✕ Reset harga
              </button>
            )}
          </div>
        )}

        {filtered.length === 0
          ? <div style={{ textAlign: "center", padding: "80px 0", color: G.gray }}><div style={{ fontSize: 48, marginBottom: 12 }}>📭</div><div style={{ fontSize: 16, fontWeight: 600 }}>Produk tidak ditemukan</div></div>
          : (
            <div className="product-grid">
              {filtered.map(p => (
                <Link key={p.id} href={`/produk/${p.id}`}
                  className="prod-card" style={{ background: G.white, borderRadius: 14, border: `1px solid ${G.border}`, overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textDecoration: "none", display: "block" }}
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
                </Link>
              ))}
            </div>
          )}
      </div>

      {/* Section divider */}
      <div style={{ height: 3, background: `linear-gradient(to right, transparent, ${G.blue}44, transparent)` }} />

      {/* Testimoni */}
      {testimoni.length > 0 && (
        <div id="testimoni-section" style={{ background: G.white, padding: "60px 24px", borderTop: `1px solid ${G.border}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div className="fade-up" style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, color: G.text, textAlign: "center", marginBottom: 6 }}>Testimoni Pelanggan</div>
            <div style={{ fontSize: 13, color: G.gray, textAlign: "center", marginBottom: 32 }}>Apa kata mereka setelah belanja di {infoNama}</div>
            <div className={`testi-grid ${showAllTesti ? "show-all" : ""}`} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {(showAllTesti ? testimoni : testimoni.slice(0, 8)).map(t => (
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


            {testimoni.length > 8 && (
              <div className="testi-btn-desktop" style={{ textAlign: "center", marginTop: 24 }}>
                <button onClick={() => setShowAllTesti(v => !v)}
                  style={{ padding: "12px 28px", background: showAllTesti ? G.grayLight : `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, border: "none", borderRadius: 12, color: showAllTesti ? G.gray : G.white, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: showAllTesti ? "none" : "0 4px 14px rgba(21,101,192,0.3)" }}>
                  {showAllTesti ? "⬆️ Sembunyikan" : `👁️ Lihat Semua ${testimoni.length} Testimoni`}
                </button>
              </div>
            )}

            {testimoni.length > 4 && (
              <div className="testi-btn-mobile" style={{ textAlign: "center", marginTop: 24 }}>
                <button onClick={() => setShowAllTesti(v => !v)}
                  style={{ padding: "12px 28px", background: showAllTesti ? G.grayLight : `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, border: "none", borderRadius: 12, color: showAllTesti ? G.gray : G.white, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: showAllTesti ? "none" : "0 4px 14px rgba(21,101,192,0.3)" }}>
                  {showAllTesti ? "⬆️ Sembunyikan" : `👁️ Lihat Semua ${testimoni.length} Testimoni`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section divider */}
      <div style={{ height: 3, background: `linear-gradient(to right, transparent, ${G.blueLight}55, transparent)` }} />

      {/* Trust Section */}
      <div style={{ background: G.white, padding: "72px 24px", borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ display: "inline-block", background: G.blueAccent, border: `1px solid ${G.blue}33`, borderRadius: 20, padding: "5px 16px", fontSize: 12, color: G.blue, fontWeight: 700, marginBottom: 14, letterSpacing: 1, textTransform: "uppercase" }}>
              Dipercaya Sejak 2018
            </div>
            <div style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, color: G.text, marginBottom: 12, lineHeight: 1.2 }}>
              Mengapa Ribuan Orang<br />Percaya <span style={{ background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>PontiCell</span>?
            </div>
            <div style={{ fontSize: 15, color: G.gray, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              Kami bukan sekadar toko HP biasa. PontiCell hadir dengan jaringan cabang terluas di Pontianak, memastikan setiap produk yang kami jual adalah <strong style={{ color: G.text }}>100% original dan bergaransi</strong>.
            </div>
          </div>

          {/* Trust Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 52 }}>
            {[
              {
                icon: "🏪",
                title: "5+ Cabang Resmi",
                desc: "Hadir di lebih dari 5 titik strategis di Pontianak. Mudah dijangkau dari mana saja.",
                color: G.blue,
                bg: G.blueAccent,
              },
              {
                icon: "✅",
                title: "100% Produk Original",
                desc: "Setiap produk yang kami jual dijamin keasliannya. Bukan refurbished, bukan palsu.",
                color: "#059669",
                bg: "#ECFDF5",
              },
              {
                icon: "🛡️",
                title: "Garansi Toko Resmi",
                desc: "Tidak puas? Ada garansi toko yang melindungi pembelianmu. Kami bertanggung jawab penuh.",
                color: "#7C3AED",
                bg: "#EDE9FE",
              },
              {
                icon: "⚡",
                title: "Respon < 5 Menit",
                desc: "Tim kami siap melayani dengan cepat dan ramah. Tidak perlu menunggu lama.",
                color: "#D97706",
                bg: "#FEF3C7",
              },
              {
                icon: "💰",
                title: "Harga Transparan",
                desc: "Harga yang tertera adalah harga jual. Tidak ada biaya tersembunyi atau markup sepihak.",
                color: "#DC2626",
                bg: "#FEE2E2",
              },
              {
                icon: "🤝",
                title: "Ribuan Transaksi Sukses",
                desc: "Sudah melayani ribuan pelanggan puas di seluruh Pontianak dan sekitarnya.",
                color: "#0891B2",
                bg: "#E0F2FE",
              },
            ].map((item, i) => (
              <div key={i} className="trust-card" style={{ background: G.bg, borderRadius: 16, padding: "24px 20px", border: `1px solid ${G.border}` }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 14 }}>
                  {item.icon}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: G.text, marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: G.gray, lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div style={{ textAlign: "center", background: `linear-gradient(135deg, ${G.blueAccent}, #F0F9FF)`, borderRadius: 20, padding: "32px 24px", border: `1px solid ${G.blue}22` }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: G.text, marginBottom: 8 }}>
              Masih Ragu? Chat Kami Sekarang 👇
            </div>
            <div style={{ fontSize: 13, color: G.gray, marginBottom: 20 }}>
              Tim PontiCell siap membantu kamu menemukan HP terbaik sesuai kebutuhan dan budget
            </div>
            <a href={`https://wa.me/${WA}?text=Halo%20${infoNama},%20saya%20ingin%20tanya%20produk`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", background: "#25D366", color: G.white, borderRadius: 12, fontSize: 14, fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 16px rgba(37,211,102,0.35)" }}>
              💬 Chat WhatsApp Sekarang
            </a>
          </div>
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

      <Chatbot />

      {/* Footer */}
      <div style={{ background: G.blueDark, padding: "36px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: G.white, marginBottom: 4 }}>{infoNama || "PontiCell"}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}> {infoTagline}</div>
        {/* Jam Operasional */}
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 20px", marginBottom: 16, display: "inline-block" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Jam Operasional</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>Senin – Minggu · 08.00 – 21.00 WIB</div>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 12 }}>© 2026 {infoNama}. All rights reserved.</div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <Link href="/cek-pesanan" style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>📦 Cek Pesanan</Link>
          <Link href="/wishlist" style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>❤️ Wishlist</Link>
          <Link href="/tentang" style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>ℹ️ Tentang Kami</Link>
        </div>
      </div>
    </div>
  );
}
