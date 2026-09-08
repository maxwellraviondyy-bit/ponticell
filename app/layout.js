export const metadata = {
  title: "PontiCell - Toko HP & Tablet Terpercaya di Pontianak",
  description: "Beli HP dan Tablet original berkualitas di PontiCell Pontianak. Stok lengkap Samsung, Xiaomi, Oppo, Vivo, iPhone dan lainnya. Garansi toko, harga terjangkau, 4 cabang di Pontianak.",
  keywords: "toko HP Pontianak, jual HP Pontianak, toko tablet Pontianak, Samsung Pontianak, Xiaomi Pontianak, iPhone Pontianak, HP murah Pontianak, PontiCell",
  authors: [{ name: "PontiCell by.Max" }],
  creator: "PontiCell",
  publisher: "PontiCell",
  metadataBase: new URL("https://ponticell.vercel.app"),
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://ponticell.vercel.app",
    siteName: "PontiCell",
    title: "PontiCell - Toko HP & Tablet Terpercaya di Pontianak",
    description: "Beli HP dan Tablet original berkualitas di PontiCell Pontianak. Stok lengkap, garansi toko, harga terjangkau.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "PontiCell Toko HP Pontianak" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PontiCell - Toko HP & Tablet Pontianak",
    description: "Beli HP dan Tablet original di PontiCell Pontianak. Garansi toko, harga terjangkau.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  verification: {
    google: "", // isi nanti setelah daftar Google Search Console
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="geo.region" content="ID-KB" />
        <meta name="geo.placename" content="Pontianak" />
        <link rel="canonical" href="https://ponticell.vercel.app" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          "name": "PontiCell",
          "description": "Toko HP dan Tablet terpercaya di Pontianak",
          "url": "https://ponticell.vercel.app",
          "telephone": "+6283808484969",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Pontianak",
            "addressRegion": "Kalimantan Barat",
            "addressCountry": "ID"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": -0.0263,
            "longitude": 109.3425
          },
          "openingHours": "Mo-Su 08:00-21:00",
          "priceRange": "$$",
          "image": "https://ponticell.vercel.app/og-image.png"
        })}} />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#F8FAFC" }}>
        {children}
      </body>
    </html>
  );
}
