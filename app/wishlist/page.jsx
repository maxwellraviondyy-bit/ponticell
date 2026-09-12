"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const formatRp = (n) => "Rp " + Number(n).toLocaleString("id-ID");

const G = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E8EDF2",
  blue: "#1565C0", blueLight: "#1E88E5",
  blueAccent: "#EBF3FF", white: "#FFFFFF",
  gray: "#64748B", grayLight: "#F1F5F9", text: "#0F172A",
  red: "#EF4444", redLight: "#FEE2E2",
};

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ponticell_wishlist") || "[]");
      setItems(saved);
    } catch { setItems([]); }
    setLoading(false);
  }, []);

  const removeItem = (id) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    localStorage.setItem("ponticell_wishlist", JSON.stringify(updated));
  };

  const clearAll = () => {
    if (!confirm("Hapus semua wishlist?")) return;
    setItems([]);
    localStorage.removeItem("ponticell_wishlist");
  };

  return (
    <div style={{ background: G.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: G.text }}>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${G.border}`, padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: G.gray, cursor: "pointer", fontSize: 20, padding: 4 }}>←</button>
          <Link href="/" style={{ fontSize: 16, fontWeight: 900, color: G.blue, textDecoration: "none" }}>PontiCell</Link>
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: G.text }}>❤️ Wishlist</div>
        {items.length > 0 && (
          <button onClick={clearAll} style={{ background: "none", border: "none", color: G.red, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Hapus Semua</button>
        )}
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: G.gray }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Memuat wishlist...</div>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🤍</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: G.text, marginBottom: 8 }}>Wishlist Kosong</div>
            <div style={{ fontSize: 14, color: G.gray, marginBottom: 28 }}>Belum ada produk yang disimpan. Tekan ❤️ di produk untuk menyimpannya.</div>
            <Link href="/" style={{ display: "inline-block", padding: "12px 28px", background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, color: G.white, borderRadius: 12, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
              🛍️ Lihat Produk
            </Link>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, color: G.gray, marginBottom: 24 }}>{items.length} produk tersimpan</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {items.map(item => (
                <div key={item.id} style={{ background: G.white, borderRadius: 16, border: `1px solid ${G.border}`, overflow: "hidden", position: "relative", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  {/* Hapus button */}
                  <button onClick={() => removeItem(item.id)}
                    style={{ position: "absolute", top: 10, right: 10, zIndex: 10, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                    ❤️
                  </button>

                  <Link href={`/produk/${item.id}`} style={{ textDecoration: "none", display: "block" }}>
                    {/* Foto */}
                    <div style={{ aspectRatio: "1", background: G.grayLight, overflow: "hidden" }}>
                      {item.photos?.[0]
                        ? <img src={item.photos[0]} alt={item.model} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📱</div>}
                    </div>

                    {/* Info */}
                    <div style={{ padding: "12px 14px 16px" }}>
                      <div style={{ fontSize: 10, color: G.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{item.brand}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 4, lineHeight: 1.3 }}>{item.model}</div>
                      <div style={{ fontSize: 11, color: G.gray, marginBottom: 8 }}>{item.ram !== "-" ? `${item.ram} / ` : ""}{item.storage} · {item.color}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: G.blue }}>{formatRp(item.sell_price)}</div>

                      {/* Kondisi badge */}
                      <div style={{ marginTop: 8, display: "inline-block", background: item.condition === "Baru" ? "#E8F5E9" : "#FFF8E1", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: item.condition === "Baru" ? "#2E7D32" : "#E65100", fontWeight: 700 }}>
                        {item.condition}
                      </div>
                    </div>
                  </Link>

                  {/* Tombol Pesan */}
                  <div style={{ padding: "0 14px 14px" }}>
                    <Link href={`/produk/${item.id}`}
                      style={{ display: "block", padding: "10px", background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, color: G.white, borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
                      🛒 Lihat Produk
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
