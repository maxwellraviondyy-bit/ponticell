export const metadata = {
  title: "PontiCell - Toko HP & Tablet Pontianak",
  description: "Toko HP dan Tablet terpercaya di Pontianak. Stok lengkap, harga terjangkau, garansi toko.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#0A0A0A" }}>
        {children}
      </body>
    </html>
  );
}
