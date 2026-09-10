"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const WA_NUMBER = "6283808484969";
const formatRp = (n) => "Rp " + Number(n).toLocaleString("id-ID");

const G = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E8EDF2",
  blue: "#1565C0", blueLight: "#1E88E5",
  blueAccent: "#EBF3FF", white: "#FFFFFF",
  gray: "#64748B", grayLight: "#F1F5F9", text: "#0F172A",
};

export default function ProductClient({ product, related }) {
  const router = useRouter();
  const [activePhoto, setActivePhoto] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [showOrder, setShowOrder] = useState(false);
  const [form, setForm] = useState({ nama: "", whatsapp: "", alamat: "", kota: "", catatan: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const photos = product.photos?.filter(Boolean) || [];
  const totalStok = Object.values(product.stocks || {}).reduce((s, v) => s + v, 0);

  useEffect(() => {
    if (photos.length <= 1 || !autoPlay) return;
    const t = setInterval(() => setActivePhoto(i => (i + 1) % photos.length), 2500);
    return () => clearInterval(t);
  }, [photos.length, autoPlay]);

  const handleOrder = async () => {
    if (!form.nama || !form.whatsapp || !form.alamat || !form.kota) return alert("Lengkapi semua field!");
    setSending(true);
    try {
      await fetch("/api/pesanan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: form.nama, whatsapp: form.whatsapp, alamat: form.alamat,
          kota: form.kota, catatan: form.catatan, produk_id: product.id,
          produk_nama: `${product.brand} ${product.model} ${product.ram}/${product.storage}`,
          produk_harga: product.sell_price,
        }),
      });
      const msg = encodeURIComponent(`🛒 *PESANAN BARU - PontiCell*\n\n👤 Nama: ${form.nama}\n📱 WA: ${form.whatsapp}\n📦 Produk: ${product.brand} ${product.model}\n💾 Spek: ${product.ram}/${product.storage} · ${product.color}\n💰 Harga: ${formatRp(product.sell_price)}\n📍 Alamat: ${form.alamat}, ${form.kota}\n📝 Catatan: ${form.catatan || "-"}`);
      window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
      setSent(true); setShowOrder(false);
    } catch (e) { alert("Gagal: " + e.message); }
    setSending(false);
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", background: G.grayLight,
    border: `1px solid ${G.border}`, borderRadius: 10, color: G.text,
    fontSize: 14, fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", marginBottom: 10,
  };

  return (
    <div style={{ background: G.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: G.text, paddingBottom: 24 }}>
      <style>{`
        .produk-layout { display: block; }
        .foto-col { width: 100%; }
        .info-col { width: 100%; padding: 20px; }
        .spek-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .sticky-bar { position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 12px 16px 20px; border-top: 1px solid #E8EDF2; display: flex; gap: 10px; z-index: 50; box-shadow: 0 -4px 20px rgba(0,0,0,0.08); safe-area-inset-bottom: env(safe-area-inset-bottom); }
        .related-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (min-width: 768px) {
          .produk-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
          .foto-col { }
          .info-col { padding: 0; }
          .spek-grid { grid-template-columns: repeat(4, 1fr); }
          .sticky-bar { display: none; }
          .desktop-btn { display: flex !important; }
          .related-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .sticky-bar { display: none; }
        @media (max-width: 767px) { .desktop-btn { display: flex !important; } }
        @media (min-width: 1024px) { .related-grid { grid-template-columns: repeat(5, 1fr); } }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${G.border}`, padding: "0 16px", height: 52, display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: G.gray, cursor: "pointer", fontSize: 20, padding: "4px", display: "flex", alignItems: "center" }}>←</button>
        <Link href="/" style={{ fontSize: 15, fontWeight: 900, color: G.blue, textDecoration: "none" }}>PontiCell</Link>
        <span style={{ color: G.border }}>/</span>
        <span style={{ fontSize: 12, color: G.gray, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{product.brand} {product.model}</span>
      </nav>

      {/* Layout */}
      <div className="produk-layout">

        {/* ── Foto ── */}
        <div className="foto-col">
          {/* Main Photo - full width on mobile */}
          <div style={{ background: G.white, position: "relative", overflow: "hidden", aspectRatio: "1", maxHeight: 500 }}
            onMouseEnter={() => setAutoPlay(false)} onMouseLeave={() => setAutoPlay(true)}>
            {photos[activePhoto]
              ? <img src={photos[activePhoto]} alt={product.model} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, background: G.grayLight }}>📱</div>}
            {/* Condition badge */}
            <div style={{ position: "absolute", top: 12, left: 12, background: product.condition === "Baru" ? "#E8F5E9" : "#FFF8E1", borderRadius: 8, padding: "4px 12px", fontSize: 11, color: product.condition === "Baru" ? "#2E7D32" : "#E65100", fontWeight: 700 }}>
              {product.condition}
            </div>
            {photos.length > 1 && (
              <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", borderRadius: 8, padding: "3px 10px", fontSize: 11, color: "#fff", fontWeight: 600 }}>
                {activePhoto + 1} / {photos.length}
              </div>
            )}
          </div>

          {/* Dots */}
          {photos.length > 1 && (
            <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "10px 0" }}>
              {photos.map((_, i) => (
                <div key={i} onClick={() => { setActivePhoto(i); setAutoPlay(false); }}
                  style={{ width: activePhoto === i ? 22 : 7, height: 7, borderRadius: 4, background: activePhoto === i ? G.blue : G.border, cursor: "pointer", transition: "all 0.3s" }} />
              ))}
            </div>
          )}

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div style={{ display: "flex", gap: 8, padding: "8px 16px 16px" }}>
              {photos.map((p, i) => (
                <div key={i} onClick={() => { setActivePhoto(i); setAutoPlay(false); }}
                  style={{ width: 60, height: 60, borderRadius: 10, overflow: "hidden", cursor: "pointer", border: `2.5px solid ${activePhoto === i ? G.blue : "transparent"}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", background: G.white, flexShrink: 0 }}>
                  <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className="info-col">
          {/* Brand */}
          <div style={{ fontSize: 11, color: G.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>{product.brand}</div>

          {/* Nama */}
          <h1 style={{ fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 900, color: G.text, margin: "0 0 14px", lineHeight: 1.2 }}>{product.model}</h1>

          {/* Harga */}
          <div style={{ fontSize: "clamp(24px, 6vw, 32px)", fontWeight: 900, color: G.blue, marginBottom: 6 }}>{formatRp(product.sell_price)}</div>
          <div style={{ fontSize: 13, color: totalStok > 0 ? "#2E7D32" : "#C62828", fontWeight: 600, marginBottom: 20 }}>
            {totalStok > 0 ? `✅ Stok tersedia (${totalStok} unit)` : "❌ Stok habis"}
          </div>

          {/* Spek */}
          <div className="spek-grid" style={{ marginBottom: 20 }}>
            {product.ram !== "-" && (
              <div style={{ background: G.blueAccent, border: `1px solid ${G.blue}22`, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: G.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>RAM</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: G.blue }}>{product.ram} GB</div>
              </div>
            )}
            <div style={{ background: G.grayLight, border: `1px solid ${G.border}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: G.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Storage</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: G.text }}>{product.storage}</div>
            </div>
            <div style={{ background: G.grayLight, border: `1px solid ${G.border}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: G.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Warna</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: G.text }}>{product.color}</div>
            </div>
            <div style={{ background: product.condition === "Baru" ? "#E8F5E9" : "#FFF8E1", border: `1px solid ${product.condition === "Baru" ? "#4CAF5033" : "#FF980033"}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: G.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Kondisi</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: product.condition === "Baru" ? "#2E7D32" : "#E65100" }}>{product.condition}</div>
            </div>
          </div>

          {/* Catatan */}
          {product.notes && (
            <div style={{ background: G.blueAccent, borderLeft: `3px solid ${G.blue}`, borderRadius: "0 10px 10px 0", padding: "10px 14px", fontSize: 13, color: G.gray, marginBottom: 20, lineHeight: 1.5 }}>
              {product.notes}
            </div>
          )}

          {/* Share */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: G.gray, fontWeight: 600 }}>Bagikan:</span>
            <a href={`https://wa.me/?text=${encodeURIComponent('Cek ' + product.brand + ' ' + product.model + ' ' + formatRp(product.sell_price) + ' di PontiCell 👉 https://ponticell.vercel.app/produk/' + product.id)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ background: "#25D366", color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
              🟢 WhatsApp
            </a>
          </div>

          {/* Tombol berdampingan */}
          {totalStok > 0 && !sent && (
            <div style={{ display: "flex", gap: 10 }}>
              <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20PontiCell,%20saya%20tertarik%20${encodeURIComponent(product.brand + ' ' + product.model)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: "14px 10px", background: G.white, border: `1.5px solid ${G.blue}`, borderRadius: 14, color: G.blue, fontSize: 14, fontWeight: 700, textDecoration: "none", textAlign: "center", display: "block" }}>
                💬 WhatsApp
              </a>
              <button onClick={() => setShowOrder(true)}
                style={{ flex: 2, padding: "14px 10px", background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, border: "none", borderRadius: 14, color: G.white, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 6px 20px rgba(21,101,192,0.3)` }}>
                🛒 Pesan Sekarang
              </button>
            </div>
          )}

          {sent && (
            <div style={{ background: "#E8F5E9", border: "1px solid #4CAF50", borderRadius: 14, padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#2E7D32", marginBottom: 4 }}>Pesanan Terkirim!</div>
              <div style={{ fontSize: 12, color: G.gray }}>Admin akan menghubungi via WhatsApp</div>
            </div>
          )}
        </div>
      </div>

      {/* Produk Serupa */}
      {related.length > 0 && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 32px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: G.text, marginBottom: 16 }}>Produk Serupa</div>
          <div className="related-grid">
            {related.map(p => (
              <Link key={p.id} href={`/produk/${p.id}`}
                style={{ background: G.white, borderRadius: 14, border: `1px solid ${G.border}`, overflow: "hidden", textDecoration: "none", display: "block" }}>
                <div style={{ aspectRatio: "1", background: G.grayLight }}>
                  {p.photos?.[0] ? <img src={p.photos[0]} alt={p.model} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📱</div>}
                </div>
                <div style={{ padding: "10px 12px 14px" }}>
                  <div style={{ fontSize: 10, color: G.blue, fontWeight: 700, marginBottom: 2 }}>{p.brand}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: G.text, marginBottom: 4 }}>{p.model}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: G.blue }}>{formatRp(p.sell_price)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar - mobile only */}
      {totalStok > 0 && !sent && (
        <div className="sticky-bar">
          <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20PontiCell,%20saya%20tertarik%20${encodeURIComponent(product.brand + ' ' + product.model)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, padding: "13px", background: G.white, border: `1.5px solid ${G.blue}`, borderRadius: 12, color: G.blue, fontSize: 14, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
            💬 WhatsApp
          </a>
          <button onClick={() => setShowOrder(true)}
            style={{ flex: 2, padding: "13px", background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, border: "none", borderRadius: 12, color: G.white, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
            🛒 Pesan Sekarang
          </button>
        </div>
      )}

      {/* Modal Order */}
      {showOrder && !sent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setShowOrder(false)}>
          <div style={{ background: G.white, borderRadius: "24px 24px 0 0", padding: "8px 20px 40px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: G.border, borderRadius: 2, margin: "12px auto 20px" }} />
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Form Pesanan</div>
            <div style={{ fontSize: 13, color: G.blue, fontWeight: 600, marginBottom: 20 }}>{product.brand} {product.model} · {formatRp(product.sell_price)}</div>
            {[["nama","Nama lengkap *","text"],["whatsapp","Nomor WhatsApp *","tel"],["alamat","Alamat lengkap *","text"],["kota","Kota / Kecamatan *","text"]].map(([key,ph,type]) => (
              <input key={key} type={type} style={inputStyle} placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            ))}
            <textarea style={{ ...inputStyle, height: 80, resize: "vertical", marginBottom: 20 }} placeholder="Catatan (opsional)" value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} />
            <button onClick={handleOrder} disabled={sending}
              style={{ width: "100%", padding: "15px", background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, border: "none", borderRadius: 14, color: G.white, fontSize: 15, fontWeight: 800, cursor: sending ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: sending ? 0.7 : 1 }}>
              {sending ? "⏳ Mengirim..." : "✅ Konfirmasi Pesanan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
