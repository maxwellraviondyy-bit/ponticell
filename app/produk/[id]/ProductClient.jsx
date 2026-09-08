"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const WA_NUMBER = "6283808484969";
const formatRp = (n) => "Rp " + Number(n).toLocaleString("id-ID");

const G = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0",
  blue: "#1565C0", blueLight: "#1E88E5", blueDark: "#0D47A1",
  blueAccent: "#E3F2FD", white: "#FFFFFF",
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

  // Auto slideshow
  useEffect(() => {
    if (photos.length <= 1 || !autoPlay) return;
    const t = setInterval(() => setActivePhoto(i => (i + 1) % photos.length), 2500);
    return () => clearInterval(t);
  }, [photos.length, autoPlay]);

  const handleOrder = async () => {
    if (!form.nama || !form.whatsapp || !form.alamat || !form.kota) {
      alert("Lengkapi semua field yang wajib diisi!");
      return;
    }
    setSending(true);
    try {
      await fetch("/api/pesanan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: form.nama, whatsapp: form.whatsapp,
          alamat: form.alamat, kota: form.kota, catatan: form.catatan,
          produk_id: product.id,
          produk_nama: `${product.brand} ${product.model} ${product.ram}/${product.storage}`,
          produk_harga: product.sell_price,
        }),
      });
      const msg = encodeURIComponent(
        `🛒 *PESANAN BARU - PontiCell*\n\n👤 Nama: ${form.nama}\n📱 WA: ${form.whatsapp}\n📦 Produk: ${product.brand} ${product.model}\n💾 Spek: ${product.ram}/${product.storage} · ${product.color}\n💰 Harga: ${formatRp(product.sell_price)}\n📍 Alamat: ${form.alamat}, ${form.kota}\n📝 Catatan: ${form.catatan || "-"}`
      );
      window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
      setSent(true);
      setShowOrder(false);
    } catch (e) { alert("Gagal kirim: " + e.message); }
    setSending(false);
  };

  const input = {
    width: "100%", padding: "11px 14px", background: G.grayLight,
    border: `1px solid ${G.border}`, borderRadius: 10, color: G.text,
    fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 10,
  };

  return (
    <div style={{ background: G.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${G.border}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.push("/")} style={{ background: G.grayLight, border: `1px solid ${G.border}`, color: G.gray, cursor: "pointer", fontSize: 16, padding: "6px 12px", borderRadius: 8, fontFamily: "inherit" }}>←</button>
        <Link href="/" style={{ fontSize: 15, fontWeight: 900, color: G.blue, textDecoration: "none" }}>PontiCell</Link>
        <span style={{ fontSize: 13, color: G.gray }}>/ {product.brand} {product.model}</span>
      </nav>

      {/* Main Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: typeof window !== "undefined" && window.innerWidth > 768 ? "1fr 1fr" : "1fr", gap: 40, marginBottom: 48 }}>

          {/* ── Foto Kiri ── */}
          <div>
            {/* Main Photo */}
            <div style={{ borderRadius: 16, overflow: "hidden", background: G.white, border: `1px solid ${G.border}`, aspectRatio: "1", maxHeight: 480, marginBottom: 10, position: "relative", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
              onMouseEnter={() => setAutoPlay(false)} onMouseLeave={() => setAutoPlay(true)}>
              {photos[activePhoto]
                ? <img src={photos[activePhoto]} alt={product.model} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>📱</div>
              }
              {/* Condition badge */}
              <div style={{ position: "absolute", top: 12, left: 12, background: product.condition === "Baru" ? "#E8F5E9" : "#FFF8E1", borderRadius: 8, padding: "4px 12px", fontSize: 11, color: product.condition === "Baru" ? "#2E7D32" : "#F57F17", fontWeight: 700 }}>
                {product.condition}
              </div>
              {/* Photo count */}
              {photos.length > 1 && (
                <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.5)", borderRadius: 8, padding: "3px 10px", fontSize: 11, color: "#fff" }}>
                  {activePhoto + 1}/{photos.length}
                </div>
              )}
            </div>

            {/* Dots */}
            {photos.length > 1 && (
              <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10 }}>
                {photos.map((_, i) => (
                  <div key={i} onClick={() => { setActivePhoto(i); setAutoPlay(false); }}
                    style={{ width: activePhoto === i ? 20 : 7, height: 7, borderRadius: 4, background: activePhoto === i ? G.blue : G.border, cursor: "pointer", transition: "all 0.3s" }} />
                ))}
              </div>
            )}

            {/* Thumbnails */}
            {photos.length > 1 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {photos.map((p, i) => (
                  <div key={i} onClick={() => { setActivePhoto(i); setAutoPlay(false); }}
                    style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", cursor: "pointer", border: `2px solid ${activePhoto === i ? G.blue : G.border}`, transition: "border 0.2s" }}>
                    <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Info Kanan ── */}
          <div>
            {/* Brand */}
            <div style={{ fontSize: 11, color: G.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{product.brand}</div>

            {/* Nama Produk */}
            <h1 style={{ fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 900, color: G.text, margin: "0 0 10px", lineHeight: 1.2 }}>{product.model}</h1>

            {/* Harga */}
            <div style={{ fontSize: 32, fontWeight: 900, color: G.blue, marginBottom: 4 }}>{formatRp(product.sell_price)}</div>
            <div style={{ fontSize: 13, color: totalStok > 0 ? "#2E7D32" : "#C62828", fontWeight: 600, marginBottom: 20 }}>
              {totalStok > 0 ? `✅ Stok tersedia (${totalStok} unit)` : "❌ Stok habis"}
            </div>

            {/* Spesifikasi */}
            <div style={{ background: G.grayLight, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: G.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Spesifikasi</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                {[
                  { label: "RAM", value: product.ram !== "-" ? product.ram + " GB" : "-" },
                  { label: "Storage", value: product.storage },
                  { label: "Warna", value: product.color },
                  { label: "Kondisi", value: product.condition },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 11, color: G.gray }}>{s.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: G.text }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stok per Cabang */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: G.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Stok Cabang</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(product.stocks || {}).map(([branch, qty]) => (
                  <div key={branch} style={{ background: qty > 0 ? G.blueAccent : G.grayLight, border: `1px solid ${qty > 0 ? G.blue : G.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: qty > 0 ? G.blue : G.gray }}>
                    {branch}: {qty}
                  </div>
                ))}
              </div>
            </div>

            {/* Catatan */}
            {product.notes && (
              <div style={{ background: G.blueAccent, border: `1px solid ${G.blue}33`, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: G.gray, marginBottom: 20 }}>
                📝 {product.notes}
              </div>
            )}

            {/* Tombol */}
            {totalStok > 0 && !sent && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => setShowOrder(true)}
                  style={{ width: "100%", padding: "15px", background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, border: "none", borderRadius: 12, color: G.white, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 4px 16px rgba(21,101,192,0.3)` }}>
                  🛒 Pesan Sekarang
                </button>
                <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20PontiCell,%20saya%20tertarik%20dengan%20${encodeURIComponent(product.brand + ' ' + product.model + ' ' + product.ram + '/' + product.storage)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ width: "100%", padding: "15px", background: G.white, border: `1.5px solid ${G.blue}`, borderRadius: 12, color: G.blue, fontSize: 15, fontWeight: 800, textDecoration: "none", textAlign: "center", display: "block", boxSizing: "border-box" }}>
                  💬 Tanya via WhatsApp
                </a>
              </div>
            )}

            {sent && (
              <div style={{ background: "#E8F5E9", border: "1px solid #4CAF50", borderRadius: 12, padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#2E7D32" }}>Pesanan terkirim!</div>
                <div style={{ fontSize: 12, color: G.gray, marginTop: 4 }}>Admin akan segera menghubungi via WhatsApp</div>
              </div>
            )}

            {/* Share */}
            <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: G.gray }}>Bagikan:</span>
              <a href={`https://wa.me/?text=${encodeURIComponent('Cek produk ini di PontiCell: ' + product.brand + ' ' + product.model + ' ' + formatRp(product.sell_price) + ' - https://ponticell.vercel.app/produk/' + product.id)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ background: "#25D366", color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* ── Produk Serupa ── */}
        {related.length > 0 && (
          <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 36 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: G.text, marginBottom: 20 }}>Produk Serupa</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {related.map(p => (
                <Link key={p.id} href={`/produk/${p.id}`}
                  style={{ background: G.white, borderRadius: 12, border: `1px solid ${G.border}`, overflow: "hidden", textDecoration: "none", display: "block", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = G.blue; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.transform = "none"; }}>
                  <div style={{ aspectRatio: "1", background: G.grayLight }}>
                    {p.photos?.[0]
                      ? <img src={p.photos[0]} alt={p.model} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📱</div>}
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: G.blue, fontWeight: 700, marginBottom: 2 }}>{p.brand}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: G.text, marginBottom: 4 }}>{p.model}</div>
                    <div style={{ fontSize: 11, color: G.gray, marginBottom: 6 }}>{p.ram !== "-" ? `${p.ram} / ` : ""}{p.storage}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: G.blue }}>{formatRp(p.sell_price)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Order */}
      {showOrder && !sent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setShowOrder(false)}>
          <div style={{ background: G.white, borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: G.border, borderRadius: 2, margin: "0 auto 20px" }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: G.text, marginBottom: 4 }}>Form Pesanan</div>
            <div style={{ fontSize: 13, color: G.blue, fontWeight: 600, marginBottom: 20 }}>{product.brand} {product.model} · {formatRp(product.sell_price)}</div>
            <input style={input} placeholder="Nama lengkap *" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} />
            <input style={input} placeholder="Nomor WhatsApp *" type="tel" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
            <input style={input} placeholder="Alamat lengkap *" value={form.alamat} onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))} />
            <input style={input} placeholder="Kota / Kecamatan *" value={form.kota} onChange={e => setForm(f => ({ ...f, kota: e.target.value }))} />
            <textarea style={{ ...input, height: 80, resize: "vertical", marginBottom: 20 }} placeholder="Catatan (opsional)" value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} />
            <button onClick={handleOrder} disabled={sending}
              style={{ width: "100%", padding: "14px", background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, border: "none", borderRadius: 12, color: G.white, fontSize: 15, fontWeight: 800, cursor: sending ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: sending ? 0.7 : 1 }}>
              {sending ? "⏳ Mengirim..." : "✅ Konfirmasi Pesanan"}
            </button>
            <div style={{ fontSize: 11, color: G.gray, textAlign: "center", marginTop: 10 }}>
              Setelah konfirmasi, WhatsApp akan terbuka untuk notifikasi ke admin
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
