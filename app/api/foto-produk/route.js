// app/api/foto-produk/route.js
// GET  ? ambil foto untuk produk (by kasir_id atau nama)
// POST ? simpan/update foto produk (admin only)
// PUT  ? auto-seed foto semua produk dari kasir (admin only)

import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/apiAuth";
import { NextResponse } from "next/server";

// --- DATABASE INIT ------------------------------------------------------------
async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS foto_produk (
      id          BIGINT PRIMARY KEY,
      kasir_id    TEXT NOT NULL,
      kasir_url   TEXT NOT NULL DEFAULT '',
      nama        TEXT NOT NULL,
      foto_url    TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      UNIQUE(kasir_id, kasir_url)
    )
  `;
}

// --- FOTO DATABASE (model HP populer Indonesia) -------------------------------
// Pattern: keyword (lowercase) ? URL foto resmi
const FOTO_DB = {
  // --- SAMSUNG ---
  "samsung a57":      "https://fdn.gsmarena.com/imgroot/news/21/09/samsung-galaxy-a57-5g-official/-476x476w/gsmarena_001.jpg",
  "samsung a56":      "https://fdn.gsmarena.com/imgroot/reviews/25/samsung-galaxy-a56/highres/gsmarena_001.jpg",
  "samsung a55":      "https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-a55/highres/gsmarena_001.jpg",
  "samsung a54":      "https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-a54/highres/gsmarena_001.jpg",
  "samsung a35":      "https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-a35/highres/gsmarena_001.jpg",
  "samsung a25":      "https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-a25/highres/gsmarena_001.jpg",
  "samsung a16":      "https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-a16/highres/gsmarena_001.jpg",
  "samsung a15":      "https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-a15/highres/gsmarena_001.jpg",
  "samsung a14":      "https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-a14/highres/gsmarena_001.jpg",
  "samsung a13":      "https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-a13/highres/gsmarena_001.jpg",
  "samsung a07":      "https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-a07/highres/gsmarena_001.jpg",
  "samsung a04s":     "https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-a04s/highres/gsmarena_001.jpg",
  "samsung a04":      "https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-a04/highres/gsmarena_001.jpg",
  "samsung a05s":     "https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-a05s/highres/gsmarena_001.jpg",
  "samsung a05":      "https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-a05/highres/gsmarena_001.jpg",
  "samsung a03s":     "https://fdn.gsmarena.com/imgroot/reviews/21/samsung-galaxy-a03s/highres/gsmarena_001.jpg",
  "samsung a03":      "https://fdn.gsmarena.com/imgroot/reviews/21/samsung-galaxy-a03/highres/gsmarena_001.jpg",
  "samsung m15":      "https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-m15/highres/gsmarena_001.jpg",
  "samsung m14":      "https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-m14/highres/gsmarena_001.jpg",
  "samsung s24 ultra":"https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-s24-ultra/highres/gsmarena_001.jpg",
  "samsung s24+":     "https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-s24-plus/highres/gsmarena_001.jpg",
  "samsung s24":      "https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-s24/highres/gsmarena_001.jpg",
  "samsung s23 ultra":"https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-s23-ultra/highres/gsmarena_001.jpg",
  "samsung s23":      "https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-s23/highres/gsmarena_001.jpg",
  "samsung s22 ultra":"https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-s22-ultra/highres/gsmarena_001.jpg",
  "samsung s22":      "https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-s22/highres/gsmarena_001.jpg",
  "samsung s21 ultra":"https://fdn.gsmarena.com/imgroot/reviews/21/samsung-galaxy-s21-ultra/highres/gsmarena_001.jpg",
  "samsung s21":      "https://fdn.gsmarena.com/imgroot/reviews/21/samsung-galaxy-s21/highres/gsmarena_001.jpg",
  "samsung s20 ultra":"https://fdn.gsmarena.com/imgroot/reviews/20/samsung-galaxy-s20-ultra/highres/gsmarena_001.jpg",
  "samsung s20":      "https://fdn.gsmarena.com/imgroot/reviews/20/samsung-galaxy-s20/highres/gsmarena_001.jpg",
  "samsung z fold5":  "https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-z-fold5/highres/gsmarena_001.jpg",
  "samsung z fold4":  "https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-z-fold4/highres/gsmarena_001.jpg",
  "samsung z flip5":  "https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-z-flip5/highres/gsmarena_001.jpg",
  "samsung z flip4":  "https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-z-flip4/highres/gsmarena_001.jpg",
  "samsung tab a9+":  "https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-tab-a9-plus/highres/gsmarena_001.jpg",
  "samsung tab a9":   "https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-tab-a9/highres/gsmarena_001.jpg",
  "samsung tab a8":   "https://fdn.gsmarena.com/imgroot/reviews/22/samsung-galaxy-tab-a8/highres/gsmarena_001.jpg",
  "samsung tab s9":   "https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-tab-s9/highres/gsmarena_001.jpg",

  // --- XIAOMI / REDMI / POCO ---
  "xiaomi 14":        "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-14/highres/gsmarena_001.jpg",
  "xiaomi 13":        "https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-13/highres/gsmarena_001.jpg",
  "xiaomi 12":        "https://fdn.gsmarena.com/imgroot/reviews/22/xiaomi-12/highres/gsmarena_001.jpg",
  "redmi note 13 pro+":"https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-redmi-note-13-pro-plus/highres/gsmarena_001.jpg",
  "redmi note 13 pro":"https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-redmi-note-13-pro/highres/gsmarena_001.jpg",
  "redmi note 13":    "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-redmi-note-13/highres/gsmarena_001.jpg",
  "redmi note 12 pro":"https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-redmi-note-12-pro/highres/gsmarena_001.jpg",
  "redmi note 12":    "https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-redmi-note-12/highres/gsmarena_001.jpg",
  "redmi note 11":    "https://fdn.gsmarena.com/imgroot/reviews/22/xiaomi-redmi-note-11/highres/gsmarena_001.jpg",
  "redmi note 10":    "https://fdn.gsmarena.com/imgroot/reviews/21/xiaomi-redmi-note-10/highres/gsmarena_001.jpg",
  "redmi 13c":        "https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-redmi-13c/highres/gsmarena_001.jpg",
  "redmi 13":         "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-redmi-13/highres/gsmarena_001.jpg",
  "redmi 12c":        "https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-redmi-12c/highres/gsmarena_001.jpg",
  "redmi 12":         "https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-redmi-12/highres/gsmarena_001.jpg",
  "redmi 10c":        "https://fdn.gsmarena.com/imgroot/reviews/22/xiaomi-redmi-10c/highres/gsmarena_001.jpg",
  "redmi 10":         "https://fdn.gsmarena.com/imgroot/reviews/21/xiaomi-redmi-10/highres/gsmarena_001.jpg",
  "poco x6 pro":      "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-poco-x6-pro/highres/gsmarena_001.jpg",
  "poco x6":          "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-poco-x6/highres/gsmarena_001.jpg",
  "poco x5 pro":      "https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-poco-x5-pro/highres/gsmarena_001.jpg",
  "poco x5":          "https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-poco-x5/highres/gsmarena_001.jpg",
  "poco m6 pro":      "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-poco-m6-pro/highres/gsmarena_001.jpg",
  "poco m6":          "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-poco-m6/highres/gsmarena_001.jpg",
  "poco m5s":         "https://fdn.gsmarena.com/imgroot/reviews/22/xiaomi-poco-m5s/highres/gsmarena_001.jpg",
  "poco m5":          "https://fdn.gsmarena.com/imgroot/reviews/22/xiaomi-poco-m5/highres/gsmarena_001.jpg",
  "poco c65":         "https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-poco-c65/highres/gsmarena_001.jpg",
  "poco c55":         "https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-poco-c55/highres/gsmarena_001.jpg",
  "poco c51":         "https://fdn.gsmarena.com/imgroot/reviews/22/xiaomi-poco-c51/highres/gsmarena_001.jpg",
  "poco c40":         "https://fdn.gsmarena.com/imgroot/reviews/22/xiaomi-poco-c40/highres/gsmarena_001.jpg",

  // --- OPPO ---
  "oppo reno12 pro":  "https://fdn.gsmarena.com/imgroot/reviews/24/oppo-reno12-pro/highres/gsmarena_001.jpg",
  "oppo reno12":      "https://fdn.gsmarena.com/imgroot/reviews/24/oppo-reno12/highres/gsmarena_001.jpg",
  "oppo reno11 pro":  "https://fdn.gsmarena.com/imgroot/reviews/24/oppo-reno11-pro/highres/gsmarena_001.jpg",
  "oppo reno11":      "https://fdn.gsmarena.com/imgroot/reviews/24/oppo-reno11/highres/gsmarena_001.jpg",
  "oppo reno10 pro":  "https://fdn.gsmarena.com/imgroot/reviews/23/oppo-reno10-pro/highres/gsmarena_001.jpg",
  "oppo reno10":      "https://fdn.gsmarena.com/imgroot/reviews/23/oppo-reno10/highres/gsmarena_001.jpg",
  "oppo reno8 pro":   "https://fdn.gsmarena.com/imgroot/reviews/22/oppo-reno8-pro/highres/gsmarena_001.jpg",
  "oppo reno8":       "https://fdn.gsmarena.com/imgroot/reviews/22/oppo-reno8/highres/gsmarena_001.jpg",
  "oppo a3 pro":      "https://fdn.gsmarena.com/imgroot/reviews/24/oppo-a3-pro/highres/gsmarena_001.jpg",
  "oppo a3":          "https://fdn.gsmarena.com/imgroot/reviews/24/oppo-a3/highres/gsmarena_001.jpg",
  "oppo a79":         "https://fdn.gsmarena.com/imgroot/reviews/23/oppo-a79/highres/gsmarena_001.jpg",
  "oppo a78":         "https://fdn.gsmarena.com/imgroot/reviews/23/oppo-a78/highres/gsmarena_001.jpg",
  "oppo a77s":        "https://fdn.gsmarena.com/imgroot/reviews/22/oppo-a77s/highres/gsmarena_001.jpg",
  "oppo a58":         "https://fdn.gsmarena.com/imgroot/reviews/23/oppo-a58/highres/gsmarena_001.jpg",
  "oppo a57s":        "https://fdn.gsmarena.com/imgroot/reviews/22/oppo-a57s/highres/gsmarena_001.jpg",
  "oppo a57":         "https://fdn.gsmarena.com/imgroot/reviews/22/oppo-a57/highres/gsmarena_001.jpg",
  "oppo a38":         "https://fdn.gsmarena.com/imgroot/reviews/23/oppo-a38/highres/gsmarena_001.jpg",
  "oppo a18":         "https://fdn.gsmarena.com/imgroot/reviews/23/oppo-a18/highres/gsmarena_001.jpg",
  "oppo a17k":        "https://fdn.gsmarena.com/imgroot/reviews/22/oppo-a17k/highres/gsmarena_001.jpg",
  "oppo a17":         "https://fdn.gsmarena.com/imgroot/reviews/22/oppo-a17/highres/gsmarena_001.jpg",

  // --- REALME ---
  "realme gt6":       "https://fdn.gsmarena.com/imgroot/reviews/24/realme-gt6/highres/gsmarena_001.jpg",
  "realme gt neo6":   "https://fdn.gsmarena.com/imgroot/reviews/24/realme-gt-neo6/highres/gsmarena_001.jpg",
  "realme 13 pro+":   "https://fdn.gsmarena.com/imgroot/reviews/24/realme-13-pro-plus/highres/gsmarena_001.jpg",
  "realme 13 pro":    "https://fdn.gsmarena.com/imgroot/reviews/24/realme-13-pro/highres/gsmarena_001.jpg",
  "realme 13":        "https://fdn.gsmarena.com/imgroot/reviews/24/realme-13/highres/gsmarena_001.jpg",
  "realme 12 pro+":   "https://fdn.gsmarena.com/imgroot/reviews/24/realme-12-pro-plus/highres/gsmarena_001.jpg",
  "realme 12 pro":    "https://fdn.gsmarena.com/imgroot/reviews/24/realme-12-pro/highres/gsmarena_001.jpg",
  "realme 12":        "https://fdn.gsmarena.com/imgroot/reviews/24/realme-12/highres/gsmarena_001.jpg",
  "realme 11 pro+":   "https://fdn.gsmarena.com/imgroot/reviews/23/realme-11-pro-plus/highres/gsmarena_001.jpg",
  "realme 11 pro":    "https://fdn.gsmarena.com/imgroot/reviews/23/realme-11-pro/highres/gsmarena_001.jpg",
  "realme 11":        "https://fdn.gsmarena.com/imgroot/reviews/23/realme-11/highres/gsmarena_001.jpg",
  "realme c67":       "https://fdn.gsmarena.com/imgroot/reviews/24/realme-c67/highres/gsmarena_001.jpg",
  "realme c65":       "https://fdn.gsmarena.com/imgroot/reviews/24/realme-c65/highres/gsmarena_001.jpg",
  "realme c63":       "https://fdn.gsmarena.com/imgroot/reviews/24/realme-c63/highres/gsmarena_001.jpg",
  "realme c55":       "https://fdn.gsmarena.com/imgroot/reviews/23/realme-c55/highres/gsmarena_001.jpg",
  "realme c53":       "https://fdn.gsmarena.com/imgroot/reviews/23/realme-c53/highres/gsmarena_001.jpg",
  "realme c51":       "https://fdn.gsmarena.com/imgroot/reviews/23/realme-c51/highres/gsmarena_001.jpg",
  "realme c35":       "https://fdn.gsmarena.com/imgroot/reviews/22/realme-c35/highres/gsmarena_001.jpg",
  "realme c33":       "https://fdn.gsmarena.com/imgroot/reviews/22/realme-c33/highres/gsmarena_001.jpg",
  "realme c31":       "https://fdn.gsmarena.com/imgroot/reviews/22/realme-c31/highres/gsmarena_001.jpg",

  // --- VIVO ---
  "vivo v40 pro":     "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-v40-pro/highres/gsmarena_001.jpg",
  "vivo v40":         "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-v40/highres/gsmarena_001.jpg",
  "vivo v30 pro":     "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-v30-pro/highres/gsmarena_001.jpg",
  "vivo v30":         "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-v30/highres/gsmarena_001.jpg",
  "vivo v29 pro":     "https://fdn.gsmarena.com/imgroot/reviews/23/vivo-v29-pro/highres/gsmarena_001.jpg",
  "vivo v29":         "https://fdn.gsmarena.com/imgroot/reviews/23/vivo-v29/highres/gsmarena_001.jpg",
  "vivo v27 pro":     "https://fdn.gsmarena.com/imgroot/reviews/23/vivo-v27-pro/highres/gsmarena_001.jpg",
  "vivo v27":         "https://fdn.gsmarena.com/imgroot/reviews/23/vivo-v27/highres/gsmarena_001.jpg",
  "vivo y200 pro":    "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-y200-pro/highres/gsmarena_001.jpg",
  "vivo y200":        "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-y200/highres/gsmarena_001.jpg",
  "vivo y100":        "https://fdn.gsmarena.com/imgroot/reviews/23/vivo-y100/highres/gsmarena_001.jpg",
  "vivo y36":         "https://fdn.gsmarena.com/imgroot/reviews/23/vivo-y36/highres/gsmarena_001.jpg",
  "vivo y35":         "https://fdn.gsmarena.com/imgroot/reviews/22/vivo-y35/highres/gsmarena_001.jpg",
  "vivo y22s":        "https://fdn.gsmarena.com/imgroot/reviews/22/vivo-y22s/highres/gsmarena_001.jpg",
  "vivo y22":         "https://fdn.gsmarena.com/imgroot/reviews/22/vivo-y22/highres/gsmarena_001.jpg",
  "vivo y16":         "https://fdn.gsmarena.com/imgroot/reviews/22/vivo-y16/highres/gsmarena_001.jpg",
  "vivo y15s":        "https://fdn.gsmarena.com/imgroot/reviews/21/vivo-y15s/highres/gsmarena_001.jpg",

  // --- INFINIX ---
  "infinix hot 50 pro+": "https://fdn.gsmarena.com/imgroot/reviews/24/infinix-hot-50-pro-plus/highres/gsmarena_001.jpg",
  "infinix hot 50 pro":  "https://fdn.gsmarena.com/imgroot/reviews/24/infinix-hot-50-pro/highres/gsmarena_001.jpg",
  "infinix hot 50":      "https://fdn.gsmarena.com/imgroot/reviews/24/infinix-hot-50/highres/gsmarena_001.jpg",
  "infinix hot 40 pro":  "https://fdn.gsmarena.com/imgroot/reviews/23/infinix-hot-40-pro/highres/gsmarena_001.jpg",
  "infinix hot 40":      "https://fdn.gsmarena.com/imgroot/reviews/23/infinix-hot-40/highres/gsmarena_001.jpg",
  "infinix hot 30":      "https://fdn.gsmarena.com/imgroot/reviews/23/infinix-hot-30/highres/gsmarena_001.jpg",
  "infinix hot 20s":     "https://fdn.gsmarena.com/imgroot/reviews/22/infinix-hot-20s/highres/gsmarena_001.jpg",
  "infinix hot 20":      "https://fdn.gsmarena.com/imgroot/reviews/22/infinix-hot-20/highres/gsmarena_001.jpg",
  "infinix note 40 pro": "https://fdn.gsmarena.com/imgroot/reviews/24/infinix-note-40-pro/highres/gsmarena_001.jpg",
  "infinix note 40":     "https://fdn.gsmarena.com/imgroot/reviews/24/infinix-note-40/highres/gsmarena_001.jpg",
  "infinix note 30 pro": "https://fdn.gsmarena.com/imgroot/reviews/23/infinix-note-30-pro/highres/gsmarena_001.jpg",
  "infinix note 30":     "https://fdn.gsmarena.com/imgroot/reviews/23/infinix-note-30/highres/gsmarena_001.jpg",
  "infinix smart 8 pro": "https://fdn.gsmarena.com/imgroot/reviews/24/infinix-smart-8-pro/highres/gsmarena_001.jpg",
  "infinix smart 8":     "https://fdn.gsmarena.com/imgroot/reviews/23/infinix-smart-8/highres/gsmarena_001.jpg",
  "infinix smart 7":     "https://fdn.gsmarena.com/imgroot/reviews/23/infinix-smart-7/highres/gsmarena_001.jpg",
  "infinix zero 40":     "https://fdn.gsmarena.com/imgroot/reviews/24/infinix-zero-40/highres/gsmarena_001.jpg",
  "infinix zero 30":     "https://fdn.gsmarena.com/imgroot/reviews/23/infinix-zero-30/highres/gsmarena_001.jpg",

  // --- IPHONE ---
  "iphone 16 pro max":  "https://fdn.gsmarena.com/imgroot/reviews/24/apple-iphone-16-pro-max/highres/gsmarena_001.jpg",
  "iphone 16 pro":      "https://fdn.gsmarena.com/imgroot/reviews/24/apple-iphone-16-pro/highres/gsmarena_001.jpg",
  "iphone 16 plus":     "https://fdn.gsmarena.com/imgroot/reviews/24/apple-iphone-16-plus/highres/gsmarena_001.jpg",
  "iphone 16":          "https://fdn.gsmarena.com/imgroot/reviews/24/apple-iphone-16/highres/gsmarena_001.jpg",
  "iphone 15 pro max":  "https://fdn.gsmarena.com/imgroot/reviews/23/apple-iphone-15-pro-max/highres/gsmarena_001.jpg",
  "iphone 15 pro":      "https://fdn.gsmarena.com/imgroot/reviews/23/apple-iphone-15-pro/highres/gsmarena_001.jpg",
  "iphone 15 plus":     "https://fdn.gsmarena.com/imgroot/reviews/23/apple-iphone-15-plus/highres/gsmarena_001.jpg",
  "iphone 15":          "https://fdn.gsmarena.com/imgroot/reviews/23/apple-iphone-15/highres/gsmarena_001.jpg",
  "iphone 14 pro max":  "https://fdn.gsmarena.com/imgroot/reviews/22/apple-iphone-14-pro-max/highres/gsmarena_001.jpg",
  "iphone 14 pro":      "https://fdn.gsmarena.com/imgroot/reviews/22/apple-iphone-14-pro/highres/gsmarena_001.jpg",
  "iphone 14 plus":     "https://fdn.gsmarena.com/imgroot/reviews/22/apple-iphone-14-plus/highres/gsmarena_001.jpg",
  "iphone 14":          "https://fdn.gsmarena.com/imgroot/reviews/22/apple-iphone-14/highres/gsmarena_001.jpg",
  "iphone 13 pro max":  "https://fdn.gsmarena.com/imgroot/reviews/21/apple-iphone-13-pro-max/highres/gsmarena_001.jpg",
  "iphone 13 pro":      "https://fdn.gsmarena.com/imgroot/reviews/21/apple-iphone-13-pro/highres/gsmarena_001.jpg",
  "iphone 13 mini":     "https://fdn.gsmarena.com/imgroot/reviews/21/apple-iphone-13-mini/highres/gsmarena_001.jpg",
  "iphone 13":          "https://fdn.gsmarena.com/imgroot/reviews/21/apple-iphone-13/highres/gsmarena_001.jpg",
  "iphone 12 pro max":  "https://fdn.gsmarena.com/imgroot/reviews/20/apple-iphone-12-pro-max/highres/gsmarena_001.jpg",
  "iphone 12 pro":      "https://fdn.gsmarena.com/imgroot/reviews/20/apple-iphone-12-pro/highres/gsmarena_001.jpg",
  "iphone 12 mini":     "https://fdn.gsmarena.com/imgroot/reviews/20/apple-iphone-12-mini/highres/gsmarena_001.jpg",
  "iphone 12":          "https://fdn.gsmarena.com/imgroot/reviews/20/apple-iphone-12/highres/gsmarena_001.jpg",
  "iphone 11 pro max":  "https://fdn.gsmarena.com/imgroot/reviews/19/apple-iphone-11-pro-max/highres/gsmarena_001.jpg",
  "iphone 11 pro":      "https://fdn.gsmarena.com/imgroot/reviews/19/apple-iphone-11-pro/highres/gsmarena_001.jpg",
  "iphone 11":          "https://fdn.gsmarena.com/imgroot/reviews/19/apple-iphone-11/highres/gsmarena_001.jpg",
  "iphone se":          "https://fdn.gsmarena.com/imgroot/reviews/22/apple-iphone-se-2022/highres/gsmarena_001.jpg",
  "ipad pro":           "https://fdn.gsmarena.com/imgroot/reviews/24/apple-ipad-pro-13-2024/highres/gsmarena_001.jpg",
  "ipad air":           "https://fdn.gsmarena.com/imgroot/reviews/24/apple-ipad-air-11-2024/highres/gsmarena_001.jpg",
  "ipad mini":          "https://fdn.gsmarena.com/imgroot/reviews/24/apple-ipad-mini-7/highres/gsmarena_001.jpg",
  "ipad":               "https://fdn.gsmarena.com/imgroot/reviews/24/apple-ipad-10-2/highres/gsmarena_001.jpg",
};

// --- FUNGSI MATCH FOTO --------------------------------------------------------
function cariFoto(namaProduk) {
  if (!namaProduk) return null;
  const nama = namaProduk.toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s+]/g, "")
    .trim();

  // Coba exact match dulu (longest key wins)
  const sortedKeys = Object.keys(FOTO_DB).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (nama.includes(key)) return FOTO_DB[key];
  }
  return null;
}

// --- GET: ambil foto satu produk ---------------------------------------------
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const nama = searchParams.get("nama") || "";
  const kasirId = searchParams.get("kasir_id") || "";

  if (!nama && !kasirId) {
    return NextResponse.json({ error: "Butuh parameter nama atau kasir_id" }, { status: 400 });
  }

  const sql = getDb();
  await ensureTable(sql);

  // Cari di DB dulu
  if (kasirId) {
    const rows = await sql`SELECT * FROM foto_produk WHERE kasir_id = ${kasirId} LIMIT 1`;
    if (rows.length > 0) return NextResponse.json({ foto_url: rows[0].foto_url, source: "db" });
  }

  // Fallback: cari dari FOTO_DB berdasarkan nama
  const fotoUrl = cariFoto(nama);
  if (fotoUrl) return NextResponse.json({ foto_url: fotoUrl, source: "library" });

  return NextResponse.json({ foto_url: null, source: "not_found" });
}

// --- POST: simpan foto manual -------------------------------------------------
export async function POST(req) {
  const err = requireAdmin(req); if (err) return err;
  const sql = getDb();
  await ensureTable(sql);

  const { kasir_id, kasir_url = "", nama, foto_url } = await req.json();
  if (!kasir_id || !nama || !foto_url) {
    return NextResponse.json({ error: "kasir_id, nama, foto_url wajib" }, { status: 400 });
  }

  await sql`
    INSERT INTO foto_produk (id, kasir_id, kasir_url, nama, foto_url, updated_at)
    VALUES (${Date.now()}, ${kasir_id}, ${kasir_url}, ${nama}, ${foto_url}, ${new Date().toISOString()})
    ON CONFLICT (kasir_id, kasir_url) DO UPDATE SET
      nama = EXCLUDED.nama,
      foto_url = EXCLUDED.foto_url,
      updated_at = EXCLUDED.updated_at
  `;

  return NextResponse.json({ ok: true });
}

// --- PUT: auto-seed foto dari kasir storefront --------------------------------
export async function PUT(req) {
  const err = requireAdmin(req); if (err) return err;
  const sql = getDb();
  await ensureTable(sql);

  const kasirUrl = process.env.KASIR_KP_URL || process.env.NEXT_PUBLIC_KASIR_KP_URL || "";
  const kasirKey = process.env.KASIR_KP_KEY || process.env.NEXT_PUBLIC_KASIR_KP_KEY || "";

  if (!kasirUrl || !kasirKey) {
    return NextResponse.json({ error: "KASIR_KP_URL / KASIR_KP_KEY belum diset" }, { status: 503 });
  }

  const kasirRes = await fetch(`${kasirUrl}/api/storefront`, {
    headers: { "x-storefront-key": kasirKey },
    cache: "no-store",
  }).then(r => r.json()).catch(() => null);

  if (!kasirRes?.produk) {
    return NextResponse.json({ error: "Gagal fetch produk dari kasir" }, { status: 502 });
  }

  const produk = kasirRes.produk;
  let seeded = 0, skipped = 0, notFound = 0;

  for (const p of produk) {
    const fotoUrl = cariFoto(p.nama);
    if (!fotoUrl) { notFound++; continue; }

    await sql`
      INSERT INTO foto_produk (id, kasir_id, kasir_url, nama, foto_url, updated_at)
      VALUES (${Date.now() + seeded}, ${String(p.id)}, ${kasirUrl}, ${p.nama}, ${fotoUrl}, ${new Date().toISOString()})
      ON CONFLICT (kasir_id, kasir_url) DO UPDATE SET
        foto_url = EXCLUDED.foto_url,
        updated_at = EXCLUDED.updated_at
    `;
    seeded++;
  }

  return NextResponse.json({
    ok: true,
    total: produk.length,
    seeded,
    skipped,
    notFound,
    message: `${seeded} produk berhasil diseed, ${notFound} tidak ditemukan fotonya`,
  });
}

