import { getDb } from "@/lib/db";
import LandingClient from "./LandingClient";

export const dynamic = 'force-dynamic';

// --- FOTO LIBRARY (fallback otomatis kalau tidak ada foto di meta) ------------
// Source: GSMArena CDN - foto produk HP populer di Indonesia
const FOTO_LIB = {
  // Samsung
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
  // Xiaomi / Redmi / Poco
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
  // OPPO
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
  // Realme
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
  // Vivo
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
  // Infinix
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
  // iPhone / iPad
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
  // --- Tambahan model dari kasir ---
  // Infinix tambahan
  "infinix smart 20":    "https://fdn.gsmarena.com/imgroot/reviews/24/infinix-smart-20/highres/gsmarena_001.jpg",
  "infinix smart 9":     "https://fdn.gsmarena.com/imgroot/reviews/24/infinix-smart-9/highres/gsmarena_001.jpg",
  "infinix smart 6":     "https://fdn.gsmarena.com/imgroot/reviews/22/infinix-smart-6/highres/gsmarena_001.jpg",
  "infinix hot 12":      "https://fdn.gsmarena.com/imgroot/reviews/22/infinix-hot-12/highres/gsmarena_001.jpg",
  "infinix note 50 pro": "https://fdn.gsmarena.com/imgroot/reviews/25/infinix-note-50-pro/highres/gsmarena_001.jpg",
  "infinix note 50":     "https://fdn.gsmarena.com/imgroot/reviews/25/infinix-note-50/highres/gsmarena_001.jpg",
  "infinix zero 40 5g":  "https://fdn.gsmarena.com/imgroot/reviews/24/infinix-zero-40-5g/highres/gsmarena_001.jpg",
  // Realme tambahan
  "realme p3 pro":       "https://fdn.gsmarena.com/imgroot/reviews/25/realme-p3-pro/highres/gsmarena_001.jpg",
  "realme p3":           "https://fdn.gsmarena.com/imgroot/reviews/25/realme-p3/highres/gsmarena_001.jpg",
  "realme p2 pro":       "https://fdn.gsmarena.com/imgroot/reviews/24/realme-p2-pro/highres/gsmarena_001.jpg",
  "realme p1 pro":       "https://fdn.gsmarena.com/imgroot/reviews/24/realme-p1-pro/highres/gsmarena_001.jpg",
  "realme p1":           "https://fdn.gsmarena.com/imgroot/reviews/24/realme-p1/highres/gsmarena_001.jpg",
  "realme p4x":          "https://fdn.gsmarena.com/imgroot/reviews/25/realme-p4x/highres/gsmarena_001.jpg",
  "realme p4 pro":       "https://fdn.gsmarena.com/imgroot/reviews/25/realme-p4-pro/highres/gsmarena_001.jpg",
  "realme p4":           "https://fdn.gsmarena.com/imgroot/reviews/25/realme-p4/highres/gsmarena_001.jpg",
  "realme narzo 70 pro": "https://fdn.gsmarena.com/imgroot/reviews/24/realme-narzo-70-pro/highres/gsmarena_001.jpg",
  "realme narzo 70":     "https://fdn.gsmarena.com/imgroot/reviews/24/realme-narzo-70/highres/gsmarena_001.jpg",
  "realme narzo 60 pro": "https://fdn.gsmarena.com/imgroot/reviews/23/realme-narzo-60-pro/highres/gsmarena_001.jpg",
  "realme narzo 60":     "https://fdn.gsmarena.com/imgroot/reviews/23/realme-narzo-60/highres/gsmarena_001.jpg",
  "realme narzo 50":     "https://fdn.gsmarena.com/imgroot/reviews/22/realme-narzo-50/highres/gsmarena_001.jpg",
  "realme c75":          "https://fdn.gsmarena.com/imgroot/reviews/25/realme-c75/highres/gsmarena_001.jpg",
  "realme c61":          "https://fdn.gsmarena.com/imgroot/reviews/24/realme-c61/highres/gsmarena_001.jpg",
  // Vivo tambahan
  "vivo y29s":           "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-y29s/highres/gsmarena_001.jpg",
  "vivo y29":            "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-y29/highres/gsmarena_001.jpg",
  "vivo y28s":           "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-y28s/highres/gsmarena_001.jpg",
  "vivo y28":            "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-y28/highres/gsmarena_001.jpg",
  "vivo y27s":           "https://fdn.gsmarena.com/imgroot/reviews/23/vivo-y27s/highres/gsmarena_001.jpg",
  "vivo y27":            "https://fdn.gsmarena.com/imgroot/reviews/23/vivo-y27/highres/gsmarena_001.jpg",
  "vivo y20s":           "https://fdn.gsmarena.com/imgroot/reviews/21/vivo-y20s/highres/gsmarena_001.jpg",
  "vivo y20":            "https://fdn.gsmarena.com/imgroot/reviews/20/vivo-y20/highres/gsmarena_001.jpg",
  "vivo y19s":           "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-y19s/highres/gsmarena_001.jpg",
  "vivo y19":            "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-y19/highres/gsmarena_001.jpg",
  "vivo y18s":           "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-y18s/highres/gsmarena_001.jpg",
  "vivo y18":            "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-y18/highres/gsmarena_001.jpg",
  "vivo y17s":           "https://fdn.gsmarena.com/imgroot/reviews/23/vivo-y17s/highres/gsmarena_001.jpg",
  "vivo y03s":           "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-y03s/highres/gsmarena_001.jpg",
  "vivo y03":            "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-y03/highres/gsmarena_001.jpg",
  "vivo t3x":            "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-t3x/highres/gsmarena_001.jpg",
  "vivo t3":             "https://fdn.gsmarena.com/imgroot/reviews/24/vivo-t3/highres/gsmarena_001.jpg",
  // POCO tambahan
  "poco c81 pro":        "https://fdn.gsmarena.com/imgroot/reviews/25/xiaomi-poco-c81-pro/highres/gsmarena_001.jpg",
  "poco c81":            "https://fdn.gsmarena.com/imgroot/reviews/25/xiaomi-poco-c81/highres/gsmarena_001.jpg",
  "poco c75":            "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-poco-c75/highres/gsmarena_001.jpg",
  "poco c71":            "https://fdn.gsmarena.com/imgroot/reviews/25/xiaomi-poco-c71/highres/gsmarena_001.jpg",
  "poco c65":            "https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-poco-c65/highres/gsmarena_001.jpg",
  "poco f6 pro":         "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-poco-f6-pro/highres/gsmarena_001.jpg",
  "poco f6":             "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-poco-f6/highres/gsmarena_001.jpg",
  // Xiaomi tambahan
  "xiaomi 15 ultra":     "https://fdn.gsmarena.com/imgroot/reviews/25/xiaomi-15-ultra/highres/gsmarena_001.jpg",
  "xiaomi 15":           "https://fdn.gsmarena.com/imgroot/reviews/25/xiaomi-15/highres/gsmarena_001.jpg",
  "xiaomi redmi note 14 pro+": "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-redmi-note-14-pro-plus/highres/gsmarena_001.jpg",
  "redmi note 14 pro+":  "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-redmi-note-14-pro-plus/highres/gsmarena_001.jpg",
  "redmi note 14 pro":   "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-redmi-note-14-pro/highres/gsmarena_001.jpg",
  "redmi note 14":       "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-redmi-note-14/highres/gsmarena_001.jpg",
  "redmi 14c":           "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-redmi-14c/highres/gsmarena_001.jpg",
  "redmi 14":            "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-redmi-14/highres/gsmarena_001.jpg",
  "redmi a4":            "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-redmi-a4/highres/gsmarena_001.jpg",
  "redmi a3":            "https://fdn.gsmarena.com/imgroot/reviews/24/xiaomi-redmi-a3/highres/gsmarena_001.jpg",
  "redmi a2+":           "https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-redmi-a2-plus/highres/gsmarena_001.jpg",
  "redmi a2":            "https://fdn.gsmarena.com/imgroot/reviews/23/xiaomi-redmi-a2/highres/gsmarena_001.jpg",
  // Samsung tambahan
  "samsung a06":         "https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-a06/highres/gsmarena_001.jpg",
  "samsung a26":         "https://fdn.gsmarena.com/imgroot/reviews/25/samsung-galaxy-a26/highres/gsmarena_001.jpg",
  "samsung a36":         "https://fdn.gsmarena.com/imgroot/reviews/25/samsung-galaxy-a36/highres/gsmarena_001.jpg",
  "samsung m35":         "https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-m35/highres/gsmarena_001.jpg",
  "samsung m34":         "https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-m34/highres/gsmarena_001.jpg",
  "samsung f15":         "https://fdn.gsmarena.com/imgroot/reviews/24/samsung-galaxy-f15/highres/gsmarena_001.jpg",
  "samsung f14":         "https://fdn.gsmarena.com/imgroot/reviews/23/samsung-galaxy-f14/highres/gsmarena_001.jpg",
  // OPPO tambahan
  "oppo a60":            "https://fdn.gsmarena.com/imgroot/reviews/24/oppo-a60/highres/gsmarena_001.jpg",
  "oppo a59":            "https://fdn.gsmarena.com/imgroot/reviews/24/oppo-a59/highres/gsmarena_001.jpg",
  "oppo a55":            "https://fdn.gsmarena.com/imgroot/reviews/21/oppo-a55/highres/gsmarena_001.jpg",
  "oppo a54":            "https://fdn.gsmarena.com/imgroot/reviews/21/oppo-a54/highres/gsmarena_001.jpg",
  "oppo find x8 pro":    "https://fdn.gsmarena.com/imgroot/reviews/24/oppo-find-x8-pro/highres/gsmarena_001.jpg",
  "oppo find x8":        "https://fdn.gsmarena.com/imgroot/reviews/24/oppo-find-x8/highres/gsmarena_001.jpg",
  // Motorola
  "motorola edge 50 pro": "https://fdn.gsmarena.com/imgroot/reviews/24/motorola-edge-50-pro/highres/gsmarena_001.jpg",
  "motorola edge 50":    "https://fdn.gsmarena.com/imgroot/reviews/24/motorola-edge-50/highres/gsmarena_001.jpg",
  "motorola edge 40 pro":"https://fdn.gsmarena.com/imgroot/reviews/23/motorola-edge-40-pro/highres/gsmarena_001.jpg",
  "motorola edge 40":    "https://fdn.gsmarena.com/imgroot/reviews/23/motorola-edge-40/highres/gsmarena_001.jpg",
  "motorola g85":        "https://fdn.gsmarena.com/imgroot/reviews/24/motorola-moto-g85/highres/gsmarena_001.jpg",
  "motorola g84":        "https://fdn.gsmarena.com/imgroot/reviews/23/motorola-moto-g84/highres/gsmarena_001.jpg",
  "motorola g75":        "https://fdn.gsmarena.com/imgroot/reviews/24/motorola-moto-g75/highres/gsmarena_001.jpg",
  "motorola g64":        "https://fdn.gsmarena.com/imgroot/reviews/24/motorola-moto-g64/highres/gsmarena_001.jpg",
  "motorola g54":        "https://fdn.gsmarena.com/imgroot/reviews/23/motorola-moto-g54/highres/gsmarena_001.jpg",
  "motorola g34":        "https://fdn.gsmarena.com/imgroot/reviews/23/motorola-moto-g34/highres/gsmarena_001.jpg",
  // Nokia tambahan
  "nokia g42":           "https://fdn.gsmarena.com/imgroot/reviews/23/nokia-g42/highres/gsmarena_001.jpg",
  "nokia g22":           "https://fdn.gsmarena.com/imgroot/reviews/23/nokia-g22/highres/gsmarena_001.jpg",
  "nokia c32":           "https://fdn.gsmarena.com/imgroot/reviews/23/nokia-c32/highres/gsmarena_001.jpg",
  "nokia c22":           "https://fdn.gsmarena.com/imgroot/reviews/23/nokia-c22/highres/gsmarena_001.jpg",
};

// Cari foto dari library berdasarkan nama produk (longest key match dulu)
function cariFotoLib(namaProduk) {
  if (!namaProduk) return null;
  const nama = namaProduk.toLowerCase().replace(/[^\w\s+]/g, "").replace(/\s+/g, " ").trim();
  const keys = Object.keys(FOTO_LIB).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (nama.includes(k)) return FOTO_LIB[k];
  }
  return null;
}

// Daftar kasir yang terhubung ke Ponticell.
// Tambah baris baru di sini kalau ada cabang baru -- tidak perlu ubah kode lain.
const KASIR_SOURCES = [
  {
    url: process.env.KASIR_KP_URL || "",
    key: process.env.KASIR_KP_KEY || "",
    label: "KP",
  },
  // Contoh menambah cabang berikutnya:
  // { url: process.env.KASIR_SJ_URL || "", key: process.env.KASIR_SJ_KEY || "", label: "SJ" },
];

// Fetch stok dari satu kasir. Kalau gagal (kasir down, env belum diset),
// kembalikan array kosong -- landing page tetap tampil meski satu kasir error.
async function fetchKasirStok(kasir) {
  if (!kasir.url || !kasir.key) return [];
  try {
    const res = await fetch(new Request(`${kasir.url}/api/storefront`, {
      headers: { "x-storefront-key": kasir.key },
      cache: "no-store",
    }));
    if (!res.ok) return [];
    const data = await res.json();
    return (data.produk || []).map((p) => ({
      ...p,
      _kasir_url: kasir.url,
      _kasir_label: kasir.label,
      _toko_nama: data.toko || kasir.label,
    }));
  } catch {
    return [];
  }
}

// Normalisasi nama brand dari kasir ke nama brand resmi.
// Key: lowercase kata pertama nama produk -> Value: nama brand yang benar
const BRAND_MAP = {
  // Motorola / Motopad (Motopad adalah sub-brand tablet Motorola)
  "motorola": "Motorola",
  "moto":     "Motorola",
  "motopad":  "Motorola",
  // Apple
  "apple":  "iPhone",
  "iphone": "iPhone",
  "ipad":   "iPhone",
  // Xiaomi / Redmi / Poco
  "xiaomi": "Xiaomi",
  "redmi":  "Redmi",
  "poco":   "Poco",
  // Samsung
  "samsung": "Samsung",
  // Realme
  "realme": "Realme",
  // OPPO
  "oppo": "OPPO",
  "reno": "OPPO",
  "find": "OPPO",
  // Vivo
  "vivo": "Vivo",
  // OnePlus
  "oneplus": "OnePlus",
  // Huawei
  "huawei": "Huawei",
  "honor":  "Honor",
  // Infinix
  "infinix": "Infinix",
  // Nubia / ZTE
  "nubia": "Nubia",
  "zte":   "Nubia",
  // Tecno
  "tecno": "Tecno",
  // Asus
  "asus":    "Asus",
  "zenfone": "Asus",
  "rog":     "Asus",
  // Nokia
  "nokia": "Nokia",
  // Sony
  "sony":   "Sony",
  "xperia": "Sony",
  // Google
  "google": "Google",
  "pixel":  "Google",
};

// Cek apakah string terlihat seperti kode model (bukan brand):
// - mengandung angka (A15, Y19s, S24+)
// - semua huruf kapital pendek (huruf besar semua kemungkinan kode model, bukan brand)
function looksLikeModelCode(str) {
  return /\d/.test(str); // ada angka = kemungkinan model, bukan brand
}

// Konversi produk dari kasir ke format yang diharapkan LandingClient.
// LandingClient mengharapkan: id, brand, model, ram, storage, color, condition,
// sell_price, original_price, photos, stocks, notes, sold_count.
function kasirProdukToLanding(p, metaMap) {
  // Parsing nama kasir: "Samsung Galaxy A15 128GB" -> brand="Samsung", model="Galaxy A15"
  // Heuristik: kata pertama = brand, tapi normalisasi dulu
  const namaParts = (p.nama || "").trim().split(" ");
  const rawBrand = namaParts[0] || p.nama || "";

  // Normalisasi brand -- kalau ada di peta, pakai nama resmi
  const brandNormalized = BRAND_MAP[rawBrand.toLowerCase()];

  // Kalau kata pertama terlihat seperti kode model (ada angka), atau tidak ada di peta brand
  // tapi JUGA tidak mirip brand apapun, tandai sebagai "Lainnya"
  let brand;
  if (brandNormalized) {
    brand = brandNormalized;
  } else if (looksLikeModelCode(rawBrand)) {
    // Kata pertama ada angkanya = bukan nama brand -> pakai "Lainnya"
    brand = "Lainnya";
  } else {
    // Pertahankan nama asli (huruf pertama kapital)
    brand = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1).toLowerCase();
  }

  // Model: sisa kata setelah brand, tapi pertahankan nama asli dari kasir sebagai fallback pencarian
  const modelRaw = namaParts.slice(1).join(" ") || p.nama || "";
  // Simpan nama lengkap asli dari kasir di _nama_kasir untuk pencarian robot
  const model = modelRaw;

  // Ambil foto & deskripsi dari meta Ponticell (kalau ada)
  const metaKey = `${p._kasir_url}::${p.id}`;
  const meta = metaMap[metaKey] || {};
  const photosFromMeta = Array.isArray(meta.photos) ? meta.photos : (meta.photos ? JSON.parse(meta.photos) : []);
  // Fallback: cari foto dari FOTO_LIB kalau meta tidak punya foto
  const fotoLib = photosFromMeta.length === 0 ? cariFotoLib(p.nama) : null;
  const photos = photosFromMeta.length > 0 ? photosFromMeta : (fotoLib ? [fotoLib] : []);

  return {
    id: `${p._kasir_label}_${p.id}`,  // unik antar kasir
    _kasir_id: p.id,
    _kasir_url: p._kasir_url,
    _kasir_label: p._kasir_label,
    _toko_nama: p._toko_nama,
    brand,
    model,
    _nama_kasir: p.nama || "", // nama lengkap asli dari kasir untuk pencarian robot
    ram: p.ram ? p.ram.toString().replace(/gb$/i, "").trim() : "-",
    storage: p.rom ? p.rom.toString().replace(/gb$/i, "").trim() + "GB" : "-",
    color: "-",
    condition: p.kondisi || (p.kategori === "hp_baru" ? "Baru" : "Bekas"),
    sell_price: p.harga_jual || 0,
    original_price: 0,
    photos,
    // stocks: format yang dipakai LandingClient adalah object {cabang: qty}
    // kita pakai label kasir sebagai key, total stok sebagai value
    stocks: { [p._kasir_label]: p.stok || 0 },
    notes: meta.deskripsi || "",
    sold_count: 0,
    type: p.kategori === "hp_baru" ? "hp" : "hp",
  };
}

export default async function HomePage() {
  const sql = getDb();

  // Fetch dari semua kasir dan Ponticell DB secara paralel
  const [kasirResults, testimoni, konten, metaRows] = await Promise.all([
    Promise.all(KASIR_SOURCES.map(fetchKasirStok)),
    sql`SELECT * FROM testimoni ORDER BY created_at DESC LIMIT 10`,
    sql`SELECT * FROM konten ORDER BY kategori, urutan`,
    sql`SELECT * FROM kasir_produk_meta`,
  ]);

  // Bangun lookup map: "kasir_url::kasir_id" -> meta
  const metaMap = {};
  for (const m of metaRows) {
    metaMap[`${m.kasir_url}::${m.kasir_id}`] = m;
  }

  // Gabung semua produk dari semua kasir
  const semuaProdukKasir = kasirResults.flat();
  const produkLanding = semuaProdukKasir.map((p) => kasirProdukToLanding(p, metaMap));

  // Deteksi tablet dari nama produk: kata kunci yang khas tablet
  // Cek di brand + model karena nama asli kasir sudah diparsing
  const TABLET_KEYWORDS = ["tab", "pad", "ipad", "fold", "flip", "mediapad"];
  function isTablet(p) {
    const namaLengkap = `${p.brand} ${p.model}`.toLowerCase();
    return TABLET_KEYWORDS.some(k => namaLengkap.includes(k));
  }

  // Pisahkan HP dan Tablet, filter hanya yang stok > 0
  const adaStok = (p) => Object.values(p.stocks).reduce((s, v) => s + v, 0) > 0;
  const hpList = produkLanding.filter(p => adaStok(p) && !isTablet(p));
  const tabletList = produkLanding.filter(p => adaStok(p) && isTablet(p));

  // Konten & banner dari Ponticell DB (tetap sama)
  const bannerDesktop = [
    ...konten.filter(k => k.kategori === "banner_desktop").sort((a, b) => a.urutan - b.urutan),
    ...konten.filter(k => k.kategori === "banner").sort((a, b) => a.urutan - b.urutan),
  ].map(k => k.nilai);

  const bannersMobile = konten
    .filter(k => k.kategori === "banner_mobile")
    .sort((a, b) => a.urutan - b.urutan)
    .map(k => k.nilai);

  const brandLogos = {};
  konten.filter(k => k.kategori === "brand").forEach(k => {
    // Simpan dengan key lowercase supaya cocok dengan lookup di LandingClient
    // yang pakai brand.toLowerCase() sebagai key
    const key = k.kunci.replace("brand_", "").toLowerCase();
    brandLogos[key] = k.nilai;
  });

  const getInfo = (kunci) => konten.find(k => k.kunci === kunci)?.nilai || "";

  return (
    <LandingClient
      hp={hpList}
      tablet={tabletList}
      testimoni={testimoni}
      banners={bannerDesktop}
      bannersMobile={bannersMobile}
      brandLogos={brandLogos}
      topSoldIds={[]}
      infoNama={getInfo("info_nama") || "PontiCell"}
      infoTagline={getInfo("info_tagline") || "Toko HP & Tablet Terpercaya di Pontianak"}
      infoWa={getInfo("info_wa") || "6283808484969"}
    />
  );
}
