"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const WA_NUMBER = "6283808484969";
const formatRp = (n) => "Rp " + Number(n).toLocaleString("id-ID");

const G = {
  bg: "#F0F4FF",
  bgDark: "#1A237E",
  card: "#FFFFFF",
  border: "#E3E8F0",
  blue: "#1565C0",
  blueLight: "#1E88E5",
  blueDark: "#0D47A1",
  blueAccent: "#E3F2FD",
  white: "#FFFFFF",
  gray: "#64748B",
  grayLight: "#F8FAFC",
  text: "#1E293B",
  textMuted: "#64748B",
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
    <div style={{ background: G.bg, minHeight: "100vh", color: G.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${G.border}`, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📱</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: G.blue, letterSpacing: "-0.5px" }}>PontiCell</div>
            <div style={{ fontSize: 10, color: G.gray, fontWeight: 500 }}>by.Max · Pontianak</div>
          </div>
        </div>
        <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20PontiCell,%20saya%20ingin%20tanya%20stok%20HP`}
          target="_blank" rel="noopener noreferrer"
          style={{ background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, color: G.white, border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>
          💬 WhatsApp
        </a>
      </nav>

      {/* Hero */}
      <div style={{ minHeight: "100vh", paddingTop: 64, background: `linear-gradient(160deg, #1A237E 0%, #1565C0 50%, #1E88E5 100%)`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center", padding: "80px 24px 60px", position: "relative", overflow: "hidden" }}>
        {/* Decorations */}
        <div style={{ position: "absolute", top: "15%", left: "5%", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
          {["✅ Garansi Toko", "📍 4 Cabang Pontianak", "💯 Produk Original", "🚀 Respon Cepat"].map(b => (
            <span key={b} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)" }}>{b}</span>
          ))}
        </div>

        <h1 style={{ fontSize: "clamp(32px, 6vw, 64px)", fontWeight: 900, color: G.white, lineHeight: 1.1, marginBottom: 16, margin: "0 0 16px" }}>
          Toko HP & Tablet<br />
          <span style={{ color: "#90CAF9" }}>Terpercaya</span> di Pontianak
        </h1>
        <p style={{ fontSize: "clamp(14px, 2vw, 18px)", color: "rgba(255,255,255,0.75)", marginBottom: 40, maxWidth: 500 }}>
          {totalStok}+ produk tersedia · Harga terbaik · Stok selalu update
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button style={{ background: G.white, color: G.blue, border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
            onClick={() => document.getElementById("produk-section").scrollIntoView({ behavior: "smooth" })}>
            🛍️ Lihat Produk
          </button>
          <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20PontiCell,%20saya%20ingin%20tanya%20stok%20HP`}
            target="_blank" rel="noopener noreferrer"
            style={{ background: "rgba(255,255,255,0.15)", color: G.white, border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 800, textDecoration: "none", backdropFilter: "blur(4px)" }}>
            💬 WhatsApp
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, marginTop: 60, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { label: "Produk Tersedia", value: totalStok + "+" },
            { label: "Cabang", value: "4" },
            { label: "Garansi Toko", value: "✓" },
            { label: "Respon", value: "< 5 Mnt" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 16, padding: "20px 24px", textAlign: "center", minWidth: 100, backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: G.white, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Produk Section */}
      <div id="produk-section" style={{ padding: "80px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 800, color: G.text, marginBottom: 4 }}>Produk Kami</div>
            <div style={{ fontSize: 14, color: G.gray }}>{filtered.length} produk tersedia</div>
          </div>
          <input
            style={{ padding: "12px 16px", background: G.white, border: `1px solid ${G.border}`, borderRadius: 10, color: G.text, fontSize: 14, fontFamily: "inherit", outline: "none", width: "100%", maxWidth: 320, boxSizing: "border-box", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            placeholder="🔍 Cari HP atau Tablet..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {[["hp", `📱 HP (${hp.length})`], ["tablet", `📟 Tablet (${tablet.length})`]].map(([t, l]) => (
            <button key={t} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: activeTab === t ? `linear-gradient(135deg, ${G.blue}, ${G.blueLight})` : G.white, color: activeTab === t ? G.white : G.gray, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: activeTab === t ? "0 4px 16px rgba(21,101,192,0.3)" : "0 2px 8px rgba(0,0,0,0.06)", transition: "all 0.2s" }}
              onClick={() => { setActiveTab(t); setSelectedBrand("Semua"); setSelectedRam("Semua"); }}>
              {l}
            </button>
          ))}
        </div>

        {/* Filter Brand */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {brands.map(b => (
            <button key={b} onClick={() => setSelectedBrand(b)}
              style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${selectedBrand === b ? G.blue : G.border}`, background: selectedBrand === b ? G.blueAccent : G.white, color: selectedBrand === b ? G.blue : G.gray, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
              {b}
            </button>
          ))}
        </div>

        {/* Filter RAM */}
        {rams.length > 2 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap", alignItems: "center" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {filtered.map(p => (
              <div key={p.id}
                style={{ background: G.white, borderRadius: 16, border: `1px solid ${G.border}`, overflow: "hidden", cursor: "pointer", transition: "all 0.25s", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                onClick={() => router.push(`/produk/${p.id}`)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = G.blue; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 32px rgba(21,101,192,0.15)`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}>
                <div style={{ width: "100%", aspectRatio: "1", background: G.grayLight, overflow: "hidden", position: "relative" }}>
                  {p.photos?.[0]
                    ? <img src={p.photos[0]} alt={p.model} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📱</div>
                  }
                  <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.9)", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: G.blue, fontWeight: 700 }}>
                    {p.condition}
                  </div>
                </div>
                <div style={{ padding: "14px 14px 16px" }}>
                  <div style={{ fontSize: 10, color: G.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{p.brand}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 6, lineHeight: 1.3 }}>{p.model}</div>
                  <div style={{ fontSize: 11, color: G.gray, marginBottom: 10 }}>{p.ram !== "-" ? `${p.ram} / ` : ""}{p.storage} · {p.color}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: G.blue }}>{formatRp(p.sell_price)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Testimoni */}
      {testimoni.length > 0 && (
        <div style={{ background: G.white, padding: "80px 24px", borderTop: `1px solid ${G.border}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 800, color: G.text, textAlign: "center", marginBottom: 8 }}>Testimoni Pelanggan</div>
            <div style={{ fontSize: 14, color: G.gray, textAlign: "center", marginBottom: 40 }}>Apa kata mereka setelah belanja di PontiCell</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {testimoni.map(t => (
                <div key={t.id} style={{ background: G.grayLight, borderRadius: 16, border: `1px solid ${G.border}`, overflow: "hidden" }}>
                  <div style={{ height: 200, overflow: "hidden" }}>
                    <img src={t.foto} alt="testimoni" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, color: G.text, lineHeight: 1.5, fontStyle: "italic" }}>"{t.keterangan}"</div>
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
        <div style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 800, color: G.text, textAlign: "center", marginBottom: 8 }}>Lokasi Cabang</div>
        <div style={{ fontSize: 14, color: G.gray, textAlign: "center", marginBottom: 40 }}>Temukan kami di 4 lokasi di Pontianak</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {[
            { nama: "Cabang KP", lokasi: "Kota Pontianak Pusat", icon: "🏪" },
            { nama: "Cabang Jawi", lokasi: "Pontianak Selatan", icon: "🏬" },
            { nama: "Cabang Kobar", lokasi: "Kotabaru", icon: "🏢" },
            { nama: "Cabang Jeruju", lokasi: "Pontianak Barat", icon: "🏪" },
          ].map(c => (
            <div key={c.nama} style={{ background: G.white, borderRadius: 16, border: `1px solid ${G.border}`, padding: "24px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{c.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: G.text, marginBottom: 4 }}>{c.nama}</div>
              <div style={{ fontSize: 12, color: G.gray, marginBottom: 16 }}>{c.lokasi}</div>
              <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20PontiCell,%20saya%20ingin%20tanya%20stok%20di%20${c.nama}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-block", padding: "8px 16px", background: G.blueAccent, border: `1px solid ${G.blue}`, color: G.blue, borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                💬 Tanya Stok
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div style={{ background: `linear-gradient(135deg, ${G.blueDark}, ${G.blue})`, padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: G.white, marginBottom: 8 }}>Siap Beli HP Impianmu?</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 28 }}>Chat kami sekarang dan dapatkan penawaran terbaik</div>
        <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20PontiCell,%20saya%20mau%20order%20HP`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-block", padding: "14px 32px", background: G.white, color: G.blue, borderRadius: 12, fontSize: 15, fontWeight: 800, textDecoration: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          💬 Chat WhatsApp Sekarang
        </a>
      </div>

      {/* Footer */}
      <div style={{ background: G.blueDark, padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: G.white, marginBottom: 4 }}>PontiCell</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>by.Max · Toko HP & Tablet Terpercaya di Pontianak</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>© 2026 PontiCell. All rights reserved.</div>
      </div>
    </div>
  );
}
