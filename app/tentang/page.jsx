"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const G = {
  bg: "#F8FAFC", card: "#FFFFFF", border: "#E8EDF2",
  blue: "#1565C0", blueLight: "#1E88E5", blueDark: "#0D47A1",
  blueAccent: "#EBF3FF", white: "#FFFFFF",
  gray: "#64748B", grayLight: "#F1F5F9", text: "#0F172A",
};

export default function TentangPage() {
  const router = useRouter();

  return (
    <div style={{ background: G.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: G.text }}>
      <style>{`
        .team-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .milestone { display: flex; gap: 20px; margin-bottom: 32px; }
        @media (max-width: 600px) { .milestone { flex-direction: column; gap: 8px; } }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${G.border}`, padding: "0 20px", height: 56, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: G.gray, cursor: "pointer", fontSize: 20, padding: 4 }}>←</button>
        <Link href="/" style={{ fontSize: 15, fontWeight: 900, color: G.blue, textDecoration: "none" }}>PontiCell</Link>
        <span style={{ color: G.border }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: G.text }}>Tentang Kami</span>
      </nav>

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${G.blueDark}, ${G.blue})`, padding: "64px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>Dipercaya Sejak 2018</div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, color: G.white, margin: "0 0 16px", lineHeight: 1.2 }}>Tentang PontiCell</h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
          Toko HP & Tablet terpercaya dengan jaringan terluas di Pontianak. Kami hadir untuk memudahkan masyarakat Pontianak mendapatkan gadget original berkualitas dengan harga yang jujur.
        </p>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>

        {/* Cerita */}
        <div style={{ background: G.card, borderRadius: 20, padding: "32px", border: `1px solid ${G.border}`, marginBottom: 28, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 11, color: G.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Cerita Kami</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: G.text, marginBottom: 16, margin: "0 0 16px" }}>Dari Satu Cabang, Kini Lebih dari 5 Titik di Pontianak</h2>
          <p style={{ fontSize: 14, color: G.gray, lineHeight: 1.8, marginBottom: 14 }}>
            PontiCell berdiri sejak 2018 dengan satu misi sederhana: membantu masyarakat Pontianak mendapatkan HP dan Tablet original tanpa khawatir tertipu. Berawal dari satu cabang kecil, kini kami telah berkembang menjadi jaringan toko gadget terpercaya dengan lebih dari 5 cabang yang tersebar di seluruh Pontianak.
          </p>
          <p style={{ fontSize: 14, color: G.gray, lineHeight: 1.8 }}>
            Setiap produk yang kami jual melewati proses seleksi ketat untuk memastikan keaslian dan kualitasnya. Kami percaya bahwa kepercayaan pelanggan adalah aset terbesar kami — dan itulah yang mendorong kami untuk terus berkembang melayani lebih banyak orang.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            { icon: "📦", v: "1.000+", l: "Unit Terjual", desc: "Transaksi sukses sejak 2018" },
            { icon: "🏪", v: "5+", l: "Cabang Resmi", desc: "Tersebar di Pontianak" },
            { icon: "⭐", v: "4.9/5", l: "Rating", desc: "Dari ribuan pembeli" },
            { icon: "🛡️", v: "14 Hari", l: "Garansi Toko", desc: "Jaminan kepuasan" },
          ].map(s => (
            <div key={s.l} style={{ background: G.blueAccent, borderRadius: 16, padding: "20px", textAlign: "center", border: `1px solid ${G.blue}22` }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: G.blue, marginBottom: 2 }}>{s.v}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: G.text, marginBottom: 3 }}>{s.l}</div>
              <div style={{ fontSize: 11, color: G.gray }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Visi Misi */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 28 }}>
          <div style={{ background: G.card, borderRadius: 20, padding: "28px", border: `1px solid ${G.border}` }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: G.text, marginBottom: 10 }}>Visi</div>
            <div style={{ fontSize: 14, color: G.gray, lineHeight: 1.7 }}>Menjadi toko gadget paling terpercaya dan terjangkau di Kalimantan Barat, yang membantu setiap orang mendapatkan akses ke teknologi terbaik.</div>
          </div>
          <div style={{ background: G.card, borderRadius: 20, padding: "28px", border: `1px solid ${G.border}` }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💡</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: G.text, marginBottom: 10 }}>Misi</div>
            <ul style={{ fontSize: 14, color: G.gray, lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
              <li>Menjual produk original dengan harga transparan</li>
              <li>Memberikan layanan ramah dan responsif</li>
              <li>Memperluas jangkauan ke seluruh Pontianak</li>
              <li>Memberikan garansi nyata bukan sekadar janji</li>
            </ul>
          </div>
        </div>

        {/* Nilai */}
        <div style={{ background: G.card, borderRadius: 20, padding: "32px", border: `1px solid ${G.border}`, marginBottom: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: G.text, marginBottom: 20 }}>🤝 Nilai-Nilai Kami</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { icon: "✅", title: "Kejujuran", desc: "Harga dan kondisi produk selalu kami sampaikan apa adanya." },
              { icon: "⚡", title: "Kecepatan", desc: "Respon cepat, proses mudah, produk sampai lebih awal dari ekspektasi." },
              { icon: "🔍", title: "Transparansi", desc: "Tidak ada biaya tersembunyi. Apa yang tertera adalah yang kamu bayar." },
              { icon: "💯", title: "Kualitas", desc: "Setiap produk diseleksi ketat sebelum sampai ke tangan pembeli." },
            ].map(v => (
              <div key={v.title} style={{ background: G.grayLight, borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{v.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 6 }}>{v.title}</div>
                <div style={{ fontSize: 12, color: G.gray, lineHeight: 1.6 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Kontak */}
        <div style={{ background: `linear-gradient(135deg, ${G.blueDark}, ${G.blue})`, borderRadius: 20, padding: "32px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: G.white, marginBottom: 8 }}>Ada Pertanyaan?</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 24 }}>Tim kami siap membantu kamu 7 hari seminggu</div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://wa.me/6283808484969?text=Halo%20PontiCell,%20saya%20ingin%20tahu%20lebih%20lanjut"
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#25D366", color: G.white, borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
              💬 Chat WhatsApp
            </a>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "rgba(255,255,255,0.15)", color: G.white, borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
              🛍️ Lihat Produk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
