"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const formatRp = (n) => "Rp " + Number(n).toLocaleString("id-ID");
const formatTgl = (d) => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

const G = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E8EDF2",
  blue: "#1565C0", blueLight: "#1E88E5",
  blueAccent: "#EBF3FF", white: "#FFFFFF",
  gray: "#64748B", grayLight: "#F1F5F9", text: "#0F172A",
};

const STATUS = {
  pending:    { label: "Menunggu Konfirmasi", color: "#F97316", bg: "#FFF7ED", icon: "⏳", desc: "Pesanan kamu sudah masuk, menunggu konfirmasi dari admin." },
  diproses:   { label: "Sedang Diproses",     color: "#3B82F6", bg: "#EFF6FF", icon: "🔄", desc: "Admin sedang memproses pesanan kamu." },
  selesai:    { label: "Selesai",              color: "#10B981", bg: "#ECFDF5", icon: "✅", desc: "Pesanan sudah selesai. Terima kasih telah berbelanja di PontiCell!" },
  dibatalkan: { label: "Dibatalkan",           color: "#EF4444", bg: "#FEF2F2", icon: "❌", desc: "Pesanan dibatalkan. Hubungi admin untuk informasi lebih lanjut." },
};

export default function CekPesananPage() {
  const router = useRouter();
  const [wa, setWa] = useState("");
  const [pesanan, setPesanan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const cekPesanan = async () => {
    const clean = wa.replace(/[^0-9]/g, "");
    if (clean.length < 9) { setError("Masukkan nomor WhatsApp yang valid"); return; }
    setLoading(true); setError(""); setSearched(false);
    try {
      const res = await fetch(`/api/pesanan/cek?wa=${clean}`);
      const data = await res.json();
      setPesanan(data);
      setSearched(true);
    } catch(e) { setError("Gagal mengambil data. Coba lagi."); }
    setLoading(false);
  };

  return (
    <div style={{ background: G.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: G.text }}>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${G.border}`, padding: "0 20px", height: 56, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: G.gray, cursor: "pointer", fontSize: 20, padding: 4 }}>←</button>
        <Link href="/" style={{ fontSize: 16, fontWeight: 900, color: G.blue, textDecoration: "none" }}>PontiCell</Link>
        <span style={{ color: G.border }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: G.text }}>Cek Pesanan</span>
      </nav>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: G.text, marginBottom: 8 }}>Cek Status Pesanan</div>
          <div style={{ fontSize: 14, color: G.gray }}>Masukkan nomor WhatsApp yang kamu gunakan saat memesan</div>
        </div>

        {/* Input */}
        <div style={{ background: G.white, borderRadius: 20, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", marginBottom: 28 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: G.gray, display: "block", marginBottom: 8 }}>Nomor WhatsApp</label>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="tel"
              placeholder="Contoh: 08123456789"
              value={wa}
              onChange={e => setWa(e.target.value)}
              onKeyDown={e => e.key === "Enter" && cekPesanan()}
              style={{ flex: 1, padding: "13px 16px", background: G.grayLight, border: `1.5px solid ${error ? "#EF4444" : G.border}`, borderRadius: 12, color: G.text, fontSize: 15, fontFamily: "inherit", outline: "none" }}
            />
            <button onClick={cekPesanan} disabled={loading}
              style={{ padding: "13px 20px", background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, border: "none", borderRadius: 12, color: G.white, fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1, whiteSpace: "nowrap" }}>
              {loading ? "⏳" : "🔍 Cek"}
            </button>
          </div>
          {error && <div style={{ fontSize: 12, color: "#EF4444", marginTop: 8 }}>{error}</div>}
        </div>

        {/* Hasil */}
        {searched && (
          <>
            {pesanan?.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: G.white, borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: G.text, marginBottom: 6 }}>Pesanan Tidak Ditemukan</div>
                <div style={{ fontSize: 13, color: G.gray }}>Pastikan nomor WhatsApp yang dimasukkan sama dengan saat memesan.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: G.text }}>{pesanan.length} pesanan ditemukan</div>
                {pesanan.map(p => {
                  const s = STATUS[p.status] || STATUS.pending;
                  const noNota = "PCL-" + String(p.id).slice(-6);
                  return (
                    <div key={p.id} style={{ background: G.white, borderRadius: 20, border: `1px solid ${G.border}`, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                      {/* Status bar */}
                      <div style={{ background: s.bg, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${G.border}` }}>
                        <span style={{ fontSize: 24 }}>{s.icon}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.label}</div>
                          <div style={{ fontSize: 11, color: G.gray, marginTop: 2 }}>{s.desc}</div>
                        </div>
                      </div>

                      <div style={{ padding: "16px 20px" }}>
                        {/* No Nota & Tanggal */}
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 6 }}>
                          <div>
                            <div style={{ fontSize: 10, color: G.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>No. Pesanan</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: G.text }}>{noNota}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 10, color: G.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Tanggal</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: G.gray }}>{formatTgl(p.created_at)}</div>
                          </div>
                        </div>

                        {/* Produk */}
                        <div style={{ background: G.grayLight, borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
                          <div style={{ fontSize: 10, color: G.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Produk</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: G.text, marginBottom: 4 }}>{p.produk_nama}</div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: G.blue }}>{formatRp(p.produk_harga)}</div>
                        </div>

                        {/* Alamat */}
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 10, color: G.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Alamat Pengiriman</div>
                          <div style={{ fontSize: 13, color: G.text, lineHeight: 1.5 }}>{p.alamat}, {p.kota}</div>
                        </div>

                        {/* Catatan */}
                        {p.catatan && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 10, color: G.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Catatan</div>
                            <div style={{ fontSize: 13, color: G.gray }}>{p.catatan}</div>
                          </div>
                        )}

                        {/* Timeline */}
                        <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 14 }}>
                          <div style={{ fontSize: 10, color: G.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Timeline</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                            {[
                              { key: "pending",    label: "Pesanan Masuk",       icon: "📥" },
                              { key: "diproses",   label: "Sedang Diproses",      icon: "🔄" },
                              { key: "selesai",    label: "Pesanan Selesai",      icon: "✅" },
                            ].map((step, idx) => {
                              const statuses = ["pending", "diproses", "selesai", "dibatalkan"];
                              const currentIdx = statuses.indexOf(p.status);
                              const stepIdx = statuses.indexOf(step.key);
                              const isDone = p.status !== "dibatalkan" ? currentIdx >= stepIdx : step.key === "pending";
                              const isCurrent = p.status === step.key;
                              return (
                                <div key={step.key} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: isDone ? G.blue : G.grayLight, border: `2px solid ${isDone ? G.blue : G.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>
                                      {isDone ? <span style={{ color: G.white, fontSize: 11 }}>✓</span> : <span style={{ color: G.gray, fontSize: 12 }}>{step.icon}</span>}
                                    </div>
                                    {idx < 2 && <div style={{ width: 2, height: 20, background: isDone && currentIdx > stepIdx ? G.blue : G.border }} />}
                                  </div>
                                  <div style={{ paddingTop: 4, paddingBottom: idx < 2 ? 16 : 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? G.blue : isDone ? G.text : G.gray }}>{step.label}</div>
                                    {isCurrent && <div style={{ fontSize: 11, color: G.gray, marginTop: 2 }}>{formatTgl(p.created_at)}</div>}
                                  </div>
                                </div>
                              );
                            })}
                            {p.status === "dibatalkan" && (
                              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 4 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FEF2F2", border: "2px solid #EF4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>
                                  <span style={{ color: "#EF4444" }}>✕</span>
                                </div>
                                <div style={{ paddingTop: 4 }}>
                                  <div style={{ fontSize: 13, fontWeight: 800, color: "#EF4444" }}>Pesanan Dibatalkan</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hubungi Admin */}
                        {p.status !== "selesai" && p.status !== "dibatalkan" && (
                          <a href={`https://wa.me/6283808484969?text=Halo%20PontiCell,%20saya%20ingin%20menanyakan%20status%20pesanan%20saya%20dengan%20nomor%20${noNota}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ display: "block", marginTop: 16, padding: "12px", background: "#25D366", borderRadius: 12, color: G.white, fontWeight: 700, fontSize: 13, textDecoration: "none", textAlign: "center" }}>
                            💬 Tanya Status ke Admin
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
