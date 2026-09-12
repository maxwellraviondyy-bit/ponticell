"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toggleWishlist, isWishlisted } from "@/lib/wishlist";

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
  const [dragStart, setDragStart] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const photos = product.photos?.filter(Boolean) || [];
  const totalStok = Object.values(product.stocks || {}).reduce((s, v) => s + v, 0);
  // Init wishlist state
  useEffect(() => {
    try { setWishlisted(isWishlisted(product.id)); } catch {}
  }, [product.id]);

  // Fix passive event listener - attach touchmove with useEffect
  useEffect(() => {
    const el = document.getElementById("photo-container");
    if (!el) return;
    const handler = (e) => e.preventDefault();
    el.addEventListener("touchmove", handler, { passive: false });
    return () => el.removeEventListener("touchmove", handler);
  }, []);

  useEffect(() => {
    if (photos.length <= 1 || !autoPlay) return;
    const t = setInterval(() => setActivePhoto(i => (i + 1) % photos.length), 2500);
    return () => clearInterval(t);
  }, [photos.length, autoPlay]);

  // Unified drag/swipe handlers
  const onDragStart = (x) => { setDragStart(x); setIsDragging(true); setAutoPlay(false); };
  const onDragEnd = (x) => {
    if (dragStart === null) return;
    const dist = dragStart - x;
    if (Math.abs(dist) > 50) {
      if (dist > 0) setActivePhoto(i => (i + 1) % photos.length);
      else setActivePhoto(i => (i - 1 + photos.length) % photos.length);
    }
    setDragStart(null); setIsDragging(false);
  };

  const handleWishlistToggle = () => {
    const updated = toggleWishlist({
      id: product.id, brand: product.brand, model: product.model,
      ram: product.ram, storage: product.storage, color: product.color,
      condition: product.condition, sell_price: product.sell_price,
      photos: product.photos,
    });
    setWishlisted(updated.some(i => i.id === product.id));
  };

  const handleOrder = async () => {
    if (!form.nama || !form.whatsapp || !form.alamat || !form.kota) return alert("Lengkapi semua field!");
    setSending(true);
    try {
      await fetch("/api/pesanan", {
        method: "POST", headers: { "Content-Type": "application/json" },
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

  const inp = { width: "100%", padding: "12px 14px", background: G.grayLight, border: `1px solid ${G.border}`, borderRadius: 10, color: G.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 10 };

  return (
    <div style={{ background: G.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: G.text }}>
      <style>{`
        .p-layout { display: block; }
        .p-foto { width: 100%; }
        .p-info { padding: 16px; box-sizing: border-box; }
        .p-spek { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
        .p-related { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (min-width: 768px) {
          .p-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; max-width: 1000px; margin: 0 auto; padding: 32px 24px; align-items: start; }
          .p-foto { min-width: 0; }
          .p-info { padding: 0; }
          .p-spek { grid-template-columns: repeat(4, 1fr); }
          .p-related { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 1024px) { .p-related { grid-template-columns: repeat(5, 1fr); } }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${G.border}`, padding: "0 16px", height: 52, display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: G.gray, cursor: "pointer", fontSize: 20, padding: 4 }}>←</button>
        <Link href="/" style={{ fontSize: 15, fontWeight: 900, color: G.blue, textDecoration: "none" }}>PontiCell</Link>
        <span style={{ color: G.border }}>/</span>
        <span style={{ fontSize: 12, color: G.gray, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{product.brand} {product.model}</span>
      </nav>

      <div className="p-layout">

        {/* ── Foto ── */}
        <div className="p-foto">
          {/* Main photo - square */}
          <div
            id="photo-container"
            style={{ position: "relative", overflow: "hidden", aspectRatio: "1/1", width: "100%", background: G.grayLight, cursor: isDragging ? "grabbing" : "grab", userSelect: "none" }}
            onMouseDown={e => onDragStart(e.clientX)}
            onMouseUp={e => onDragEnd(e.clientX)}
            onMouseLeave={() => { setDragStart(null); setIsDragging(false); setAutoPlay(true); }}
            onTouchStart={e => onDragStart(e.targetTouches[0].clientX)}
            onTouchEnd={e => onDragEnd(e.changedTouches[0].clientX)}
          >
            {photos[activePhoto]
              ? <img src={photos[activePhoto]} alt={product.model} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>📱</div>}
            <div style={{ position: "absolute", top: 12, left: 12, background: product.condition === "Baru" ? "#E8F5E9" : "#FFF8E1", borderRadius: 8, padding: "4px 12px", fontSize: 11, color: product.condition === "Baru" ? "#2E7D32" : "#E65100", fontWeight: 700 }}>
              {product.condition}
            </div>
            {photos.length > 1 && (
              <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.5)", borderRadius: 8, padding: "3px 10px", fontSize: 11, color: "#fff", fontWeight: 600 }}>
                {activePhoto + 1} / {photos.length}
              </div>
            )}
          </div>

          {/* Dots */}
          {photos.length > 1 && (
            <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "8px 0" }}>
              {photos.map((_, i) => (
                <div key={i} onClick={() => { setActivePhoto(i); setAutoPlay(false); }}
                  style={{ width: activePhoto === i ? 20 : 7, height: 7, borderRadius: 4, background: activePhoto === i ? G.blue : G.border, cursor: "pointer", transition: "all 0.3s" }} />
              ))}
            </div>
          )}

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div style={{ display: "flex", gap: 8, padding: "4px 16px 12px" }}>
              {photos.map((p, i) => (
                <div key={i} onClick={() => { setActivePhoto(i); setAutoPlay(false); }}
                  style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", cursor: "pointer", border: `2.5px solid ${activePhoto === i ? G.blue : "transparent"}`, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", flexShrink: 0 }}>
                  <img src={p} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className="p-info">
          <div style={{ fontSize: 11, color: G.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>{product.brand}</div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 900, color: G.text, margin: "0 0 8px", lineHeight: 1.2 }}>{product.model}</h1>
          <div style={{ fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 900, color: G.blue, marginBottom: 4 }}>{formatRp(product.sell_price)}</div>
          <div style={{ fontSize: 12, color: totalStok > 0 ? "#2E7D32" : "#C62828", fontWeight: 600, marginBottom: 14 }}>
            {totalStok > 0 ? `✅ Stok tersedia (${totalStok} unit)` : "❌ Stok habis"}
          </div>

          {/* Spek */}
          <div className="p-spek">
            {product.ram !== "-" && (
              <div style={{ background: G.blueAccent, border: `1px solid ${G.blue}22`, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: G.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>RAM</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: G.blue }}>{product.ram} GB</div>
              </div>
            )}
            <div style={{ background: G.grayLight, border: `1px solid ${G.border}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: G.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Storage</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: G.text }}>{product.storage}</div>
            </div>
            <div style={{ background: G.grayLight, border: `1px solid ${G.border}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: G.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Warna</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: G.text }}>{product.color}</div>
            </div>
            <div style={{ background: product.condition === "Baru" ? "#E8F5E9" : "#FFF8E1", border: `1px solid ${product.condition === "Baru" ? "#4CAF5033" : "#FF980033"}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: G.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Kondisi</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: product.condition === "Baru" ? "#2E7D32" : "#E65100" }}>{product.condition}</div>
            </div>
          </div>

          {product.notes && (
            <div style={{ background: G.blueAccent, borderLeft: `3px solid ${G.blue}`, borderRadius: "0 10px 10px 0", padding: "10px 14px", fontSize: 13, color: G.gray, marginBottom: 14, lineHeight: 1.5 }}>
              {product.notes}
            </div>
          )}

          {/* Share + Wishlist */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <button onClick={handleWishlistToggle}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: wishlisted ? "#FEE2E2" : G.grayLight, border: `1px solid ${wishlisted ? "#EF4444" : G.border}`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: wishlisted ? "#EF4444" : G.gray, transition: "all 0.2s" }}>
              {wishlisted ? "❤️ Disimpan" : "🤍 Simpan"}
            </button>
            <span style={{ fontSize: 12, color: G.gray, fontWeight: 600 }}>Bagikan:</span>
            <a href={`https://wa.me/?text=${encodeURIComponent("Cek " + product.brand + " " + product.model + " " + formatRp(product.sell_price) + " di PontiCell 👉 https://ponticell.vercel.app/produk/" + product.id)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ background: "#25D366", color: "#fff", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
              🟢 WhatsApp
            </a>
          </div>

          {/* Tombol */}
          {totalStok > 0 && !sent && (
            <div style={{ display: "flex", gap: 10 }}>
              <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20PontiCell,%20saya%20tertarik%20${encodeURIComponent(product.brand + " " + product.model)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: "14px 10px", background: G.white, border: `1.5px solid ${G.blue}`, borderRadius: 14, color: G.blue, fontSize: 14, fontWeight: 700, textDecoration: "none", textAlign: "center", display: "block", boxSizing: "border-box" }}>
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
              <div style={{ fontSize: 15, fontWeight: 800, color: "#2E7D32" }}>Pesanan Terkirim!</div>
              <div style={{ fontSize: 12, color: G.gray, marginTop: 4 }}>Admin akan menghubungi via WhatsApp</div>
            </div>
          )}
        </div>
      </div>

      {/* Produk Serupa */}
      {related.length > 0 && (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 16px 40px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: G.text, marginBottom: 16 }}>Produk Serupa</div>
          <div className="p-related">
            {related.map(p => (
              <Link key={p.id} href={`/produk/${p.id}`}
                style={{ background: G.white, borderRadius: 12, border: `1px solid ${G.border}`, overflow: "hidden", textDecoration: "none", display: "block" }}>
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
              <input key={key} type={type} style={inp} placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            ))}
            <textarea style={{ ...inp, height: 80, resize: "vertical", marginBottom: 20 }} placeholder="Catatan (opsional)" value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} />
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
