"use client";
import React, { useState, useEffect, useRef } from "react";
import { Smartphone, Tablet, Star, BarChart3, Tag, ClipboardList, Wallet } from "lucide-react";

const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
const CLOUDINARY_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  formData.append("folder", "stokhp");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (data.secure_url) return data.secure_url;
  throw new Error("Upload gagal: " + (data.error?.message || "Unknown error"));
};


// ── API helpers ─────────────────────────────────────────────
const api = {
  get: (path) => fetch(path).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
  post: (path, body) => fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
  put: (path, body) => fetch(path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
  patch: (path, body) => fetch(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
  del: (path, body) => fetch(path, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
};
const BRANCHES = [
  { id: "KP", name: "Cabang KP", city: "Pontianak", color: "#C9A227" },
  { id: "SJ", name: "Cabang Jawi", city: "Pontianak", color: "#0EA5E9" },
  { id: "KB", name: "Cabang Kobar", city: "Pontianak", color: "#8B5CF6" },
  { id: "JJ", name: "Cabang Jeruju", city: "Pontianak", color: "#10B981" },
];

const BRANDS_HP = ["Semua", "Samsung", "iPhone", "Xiaomi", "OPPO", "Vivo", "Realme", "Infinix", "Tecno", "Itel", "Lainnya"];
const BRANDS_TABLET = ["Semua", "Samsung", "iPad", "Xiaomi", "Lenovo", "Huawei", "OPPO", "Realme", "Lainnya"];
const ACTIVITY_TYPES = ["Stok Masuk", "Terjual", "Transfer Antar Cabang", "Retur"];
const CONDITIONS = ["Baru", "Second Mulus", "Second Wajar"];

const formatRupiah = (n) => "Rp " + (parseInt(n) || 0).toLocaleString("id-ID");
const formatCurrencyInput = (val) => {
  const num = val.replace(/\D/g, "");
  if (!num) return "";
  return parseInt(num).toLocaleString("id-ID");
};
const parseCurrencyInput = (val) => {
  return val.replace(/\D/g, "");
};

const getStockStatus = (qty) => {
  if (qty === 0) return { label: "Habis", color: "#EF4444", bg: "#FEE2E2", border: "#FECACA" };
  if (qty <= 2) return { label: "Kritis", color: "#F97316", bg: "#FFF7ED", border: "#FED7AA" };
  if (qty <= 5) return { label: "Aman", color: "#EAB308", bg: "#FEFCE8", border: "#FEF08A" };
  return { label: "Banyak", color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" };
};

const getConditionColor = (cond) => {
  if (cond === "Baru") return { color: "#10B981", bg: "#ECFDF5" };
  if (cond === "Second Mulus") return { color: "#0EA5E9", bg: "#F0F9FF" };
  if (cond === "Second Wajar") return { color: "#F97316", bg: "#FFF7ED" };
  return { color: "#64748B", bg: "#F1F5F9" };
};

const emptyStocks = () => ({ KP: 0, SJ: 0, KB: 0, JJ: 0 });

// Helper: hash password dengan SHA-256 (Web Crypto API)
const hashPassword = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
};

// Helper: cek apakah user boleh edit cabang tertentu
const canEditBranch = (user, branchId) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.branch === branchId;
};

// Get local date string YYYY-MM-DD (fixes UTC+7 timezone bug)
const toLocalDateStr = (isoStr) => {
  const d = new Date(isoStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};
const toLocalMonthStr = (isoStr) => toLocalDateStr(isoStr).slice(0, 7);
const toLocalYearStr = (isoStr) => toLocalDateStr(isoStr).slice(0, 4);
const todayLocalStr = () => toLocalDateStr(new Date().toISOString());
const thisMonthLocalStr = () => toLocalMonthStr(new Date().toISOString());
const thisYearLocalStr = () => toLocalYearStr(new Date().toISOString());

export default function App() {
  const [inventory, setInventory] = useState([]);
  const [salesLog, setSalesLog] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try { const s = sessionStorage.getItem("stokhp-user"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(() => {
    try { return parseInt(localStorage.getItem("ponticell_login_attempts") || "0"); } catch { return 0; }
  });
  const [loginLockedUntil, setLoginLockedUntil] = useState(() => {
    try { const v = localStorage.getItem("ponticell_login_locked_until"); return v ? parseInt(v) : null; } catch { return null; }
  });
  const [liveTapCount, setLiveTapCount] = useState(0);
  const liveTapTimer = React.useRef(null);
  const [photoViewer, setPhotoViewer] = useState(null);
  const [photoZoom, setPhotoZoom] = useState(1);

  const [activeTab, setActiveTab] = useState("hp");
  const [productType, setProductType] = useState("hp");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedBrand, setSelectedBrand] = useState("Semua");
  const [selectedRam, setSelectedRam] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(null);
  const [modalData, setModalData] = useState({});
  const [viewItem, setViewItem] = useState(null);
  const [viewSoldItem, setViewSoldItem] = useState(null);
  const [viewPhotoIndex, setViewPhotoIndex] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [pulse, setPulse] = useState(false);
  const [financePeriod, setFinancePeriod] = useState("today");
  const [financeBranch, setFinanceBranch] = useState("ALL");
  const [financeCustomDate, setFinanceCustomDate] = useState("");
  const [financeCustomMonth, setFinanceCustomMonth] = useState("");
  const [financeCustomYear, setFinanceCustomYear] = useState("");
  const [financeUnlocked, setFinanceUnlocked] = useState(false);
  const [financePinInput, setFinancePinInput] = useState("");
  const [financePinError, setFinancePinError] = useState(false);
  const [financePinHash, setFinancePinHash] = useState(""); // diambil dari Supabase
  const [showSetPinModal, setShowSetPinModal] = useState(false);
  const [setPinStep, setSetPinStep] = useState(1);
  const [setPinInput, setSetPinInput] = useState("");
  const [setPinFirst, setSetPinFirst] = useState("");
  const [setPinError, setSetPinError] = useState("");
  const [actPeriod, setActPeriod] = useState("all");
  const [actType, setActType] = useState("Semua");
  const [actBranch, setActBranch] = useState("ALL");
  const [actCustomDate, setActCustomDate] = useState("");
  const [actCustomMonth, setActCustomMonth] = useState("");
  const [actCustomYear, setActCustomYear] = useState("");
  const photoRefs = [useRef(null), useRef(null), useRef(null)];
  const editPhotoRefs = [useRef(null), useRef(null), useRef(null)];
  const [testimoni, setTestimoni] = useState([]);
  const [testiItems, setTestiItems] = useState([]);
  const testiFileRef = useRef(null);
  const [konten, setKonten] = useState([]);
  const [kontenUploading, setKontenUploading] = useState(false);
  const [pesanan, setPesanan] = useState([]);

  // DB helpers
  const dbToItem = (r) => ({ id: r.id, type: r.type, brand: r.brand, model: r.model, ram: r.ram, storage: r.storage, color: r.color, condition: r.condition, imei: r.imei, buyPrice: r.buy_price, sellPrice: r.sell_price, notes: r.notes, photos: r.photos || [], stocks: r.stocks || emptyStocks(), createdAt: r.created_at });
  const dbToSalesLog = (r) => ({ id: r.id, itemId: r.item_id, type: r.type, brand: r.brand, model: r.model, ram: r.ram, storage: r.storage, color: r.color, condition: r.condition, imei: r.imei, buyPrice: r.buy_price, sellPrice: r.sell_price, originalSellPrice: r.original_sell_price, profit: r.profit, notes: r.notes, photos: r.photos || [], photo: r.photo, stockBranch: r.stock_branch, soldBranch: r.sold_branch, soldQty: r.sold_qty, isCOD: r.is_cod, soldAt: r.sold_at });
  const dbToActivity = (r) => ({ id: r.id, time: r.time, type: r.type, item: r.item, branch: r.branch, qty: r.qty, notes: r.notes, soldAtBranchName: r.sold_at_branch_name, isCOD: r.is_cod, cancelled: r.cancelled, cancelledAt: r.cancelled_at, editedBy: r.edited_by, cancelledBy: r.cancelled_by });

  const loadAllData = async (retryCount = 0) => {
    try {
      const [inv, sales, acts, testis, pinSetting, kontenData, pesananData] = await Promise.all([
        api.get("/api/inventory"),
        api.get("/api/sales"),
        api.get("/api/activities"),
        api.get("/api/testimoni"),
        api.get("/api/settings?key=finance_pin"),
        api.get("/api/konten"),
        api.get("/api/pesanan"),
      ]);
      setInventory(inv.map(dbToItem));
      setSalesLog(sales.map(dbToSalesLog));
      setActivities(acts.map(dbToActivity));
      setTestimoni(testis);
      if (kontenData) setKonten(kontenData);
      if (pesananData) setPesanan(pesananData);
      if (pinSetting?.value) setFinancePinHash(pinSetting.value);
    } catch(e) {
      console.error("Load error:", e);
      if (retryCount < 3) {
        setTimeout(() => loadAllData(retryCount + 1), 2000);
        return;
      }
    }
    setLoading(false);
    setPulse(true); setLastUpdate(new Date());
    setTimeout(() => setPulse(false), 800);
  };

  useEffect(() => {
    loadAllData();
    // Realtime sync every 10 seconds
    const interval = setInterval(() => loadAllData(), 60000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps




const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_DURATION_MS = 60 * 60 * 1000; // 60 menit

const handleLogin = async () => {
  setLoginError("");

  // Cek apakah sedang terkunci
  if (loginLockedUntil && Date.now() < loginLockedUntil) {
    const sisaDetik = Math.ceil((loginLockedUntil - Date.now()) / 1000);
    const menit = Math.floor(sisaDetik / 60);
    const detik = sisaDetik % 60;
    setLoginError(`Login diblokir. Coba lagi dalam ${menit}:${String(detik).padStart(2, "0")} menit.`);
    return;
  }

  try {
    const hashed = await hashPassword(loginPassword);
    const data = await api.post("/api/auth", { username: loginUsername.trim().toLowerCase(), password: hashed }).catch(() => null);
    const error = !data ? { message: "Invalid credentials" } : null;

    if (error || !data) {
      const newAttempts = loginAttempts + 1;
      setLoginPassword("");

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCK_DURATION_MS;
        setLoginLockedUntil(lockedUntil);
        setLoginAttempts(0);
        setLoginError(`Login diblokir 60 menit karena ${MAX_LOGIN_ATTEMPTS}x percobaan gagal.`);
      } else {
        setLoginAttempts(newAttempts);
        const sisa = MAX_LOGIN_ATTEMPTS - newAttempts;
        setLoginError(`Username atau password salah! Sisa percobaan: ${sisa}x`);
      }
      return;
    }

    // Login berhasil — reset counter
    setLoginAttempts(0);
    setLoginLockedUntil(null);
    const user = { username: data.username, role: data.role, name: data.name, branch: data.branch };
    sessionStorage.setItem("stokhp-user", JSON.stringify(user));
    setCurrentUser(user);
    setLoginPassword("");
    setShowLoginModal(false);
    setActiveTab("dashboard");
  } catch (e) {
    setLoginError("Terjadi kesalahan, coba lagi.");
    setLoginPassword("");
  }
};

  const handleLogout = () => {
  if (window.confirm("Yakin ingin keluar?")) {
    sessionStorage.removeItem("stokhp-user");
    setCurrentUser(null);
    setLoginUsername("");
    setLoginPassword("");
    setActiveTab("hp");
    setProductType("hp");
    setSelectedBranch("ALL");
    setSelectedBrand("Semua");
    setSearchQuery("");
    setFinanceUnlocked(false);
    setFinancePinInput("");
  }
};

  const handleSavePin = async (pinPlain) => {
    try {
      const hashed = await hashPassword(pinPlain);
      await api.post("/api/settings", { key: "finance_pin", value: hashed });
      setFinancePinHash(hashed);
      setShowSetPinModal(false);
      setSetPinStep(1); setSetPinInput(""); setSetPinFirst(""); setSetPinError("");
      alert("✅ PIN Finance berhasil disimpan!");
    } catch (e) {
      alert("Gagal simpan PIN: " + e.message);
    }
  };

  const BRANDS = productType === "hp" ? BRANDS_HP : BRANDS_TABLET;

  // Only show items that are READY (have stock) for selected branch
  const readyInventory = inventory.filter((item) => {
    if (item.type !== productType) return false;
    const branchStock = selectedBranch === "ALL"
      ? Object.values(item.stocks || {}).reduce((s, v) => s + v, 0)
      : (item.stocks?.[selectedBranch] || 0);
    if (branchStock <= 0) return false;
    const matchBrand = selectedBrand === "Semua" || item.brand === selectedBrand;
    const matchSearch = searchQuery === "" ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchBrand && matchSearch;
  });

  const soldInventory = salesLog.filter((item) => item.type === productType);

  const totalStockByBranch = (bid) => inventory.reduce((s, i) => s + (i.stocks?.[bid] || 0), 0);
  const totalValueByBranch = (bid) => inventory.reduce((s, i) => s + (i.stocks?.[bid] || 0) * (i.buyPrice || 0), 0);
  const criticalItems = inventory.filter((item) => {
    const total = Object.values(item.stocks || {}).reduce((s, v) => s + v, 0);
    return total > 0 && Object.values(item.stocks || {}).some((s) => s > 0 && s <= 2);
  });
  const totalAllStock = BRANCHES.reduce((s, b) => s + totalStockByBranch(b.id), 0);
  // eslint-disable-next-line no-unused-vars
  const totalAllValue = BRANCHES.reduce((s, b) => s + totalValueByBranch(b.id), 0);

  const handlePhotoUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    // Show preview sementara pakai Base64
    const reader = new FileReader();
    reader.onload = (ev) => {
      setModalData((prev) => {
        const photos = [...(prev.photos || [null, null, null])];
        photos[index] = ev.target.result; // preview sementara
        return { ...prev, photos };
      });
    };
    reader.readAsDataURL(file);
    // Upload ke Cloudinary
    setSyncing(true);
    try {
      const url = await uploadToCloudinary(file);
      setModalData((prev) => {
        const photos = [...(prev.photos || [null, null, null])];
        photos[index] = url; // ganti dengan URL Cloudinary
        return { ...prev, photos };
      });
    } catch(e) {
      alert("Gagal upload foto: " + e.message);
      // Reset foto kalau gagal
      setModalData((prev) => {
        const photos = [...(prev.photos || [null, null, null])];
        photos[index] = null;
        return { ...prev, photos };
      });
    }
    setSyncing(false);
  };

  const handleAddProduct = async () => {
    const { brand, model, ram, storage, color, condition, buyPrice, sellPrice, notes, photos, imei, initialBranch, initialQty } = modalData;
    if (!brand || !model) return alert("Brand dan Model wajib diisi!");
    // Staff: paksa pakai cabang sendiri
    const finalInitBranch = (currentUser?.role !== "admin" && currentUser?.branch) ? currentUser.branch : initialBranch;
    if (!finalInitBranch) return alert("Pilih cabang stok masuk!");
    if (!canEditBranch(currentUser, finalInitBranch)) return alert("Anda hanya bisa menambah produk untuk cabang Anda sendiri!");
    const qty = parseInt(initialQty) || 0;
    if (qty <= 0) return alert("Jumlah stok harus lebih dari 0!");
    const stocks = emptyStocks();
    stocks[finalInitBranch] = qty;
    const id = Date.now();
    const branch = BRANCHES.find((b) => b.id === finalInitBranch);
    setSyncing(true);
    try {
      await api.post("/api/inventory", { id, type: productType, brand, model, ram: ram||"-", storage: storage||"-", color: color||"-", imei: imei||"-", condition: condition||"Second Wajar", buy_price: parseInt(buyPrice)||0, sell_price: parseInt(sellPrice)||0, notes: notes||"", photos: (photos||[]).filter(Boolean), stocks });
      await api.post("/api/activities", { id: Date.now(), time: new Date().toISOString(), type: "Stok Masuk", item: `${brand} ${model}`, branch: branch?.name, qty, notes: "Produk baru ditambahkan", is_cod: false, cancelled: false, edited_by: currentUser?.name || "Guest" });
      await loadAllData();
    } catch(e) { alert("Gagal simpan: " + e.message); }
    setSyncing(false);
    setShowModal(null); setModalData({});
  };

  const handleEditProduct = async () => {
    const { id, brand, model, ram, storage, color, condition, buyPrice, sellPrice, notes, photos, imei } = modalData;
    if (!brand || !model) return alert("Brand dan Model wajib diisi!");
    setSyncing(true);
    try {
      await api.put("/api/inventory", { id, brand, model, ram: ram||"-", storage: storage||"-", color: color||"-", imei: imei||"-", condition, buy_price: parseInt(buyPrice)||0, sell_price: parseInt(sellPrice)||0, notes, photos: (photos||[]).filter(Boolean) });
      await loadAllData();
    } catch(e) { alert("Gagal update: " + e.message); }
    setSyncing(false);
    setShowModal(null); setModalData({});
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Yakin ingin menghapus produk ini?")) return;
    setSyncing(true);
    try {
      await api.del("/api/inventory", { id });
      await loadAllData();
    } catch(e) { alert("Gagal hapus: " + e.message); }
    setSyncing(false);
    setViewItem(null);
  };

  const handleUpdateStock = async () => {
    const { itemId, branchId, type, qty, notes } = modalData;
    const amount = parseInt(qty) || 0;
    if (!itemId || !type || amount <= 0) return alert("Semua field wajib diisi!");
    // Staff: auto-use their own branch
    const finalBranchId = (currentUser?.role !== "admin" && currentUser?.branch) ? currentUser.branch : branchId;
    if (!finalBranchId) return alert("Pilih cabang terlebih dahulu!");
    if (!canEditBranch(currentUser, finalBranchId)) return alert("Anda hanya bisa mengedit stok cabang Anda sendiri!");

    const stockBranchId = finalBranchId;
    const soldAtBranchId = (type === "Terjual") ? (modalData.soldAtBranch || finalBranchId) : null;
    const isCOD = (type === "Terjual") ? (modalData.isCOD || false) : false;
    const targetBranch = modalData.targetBranch;
    const notesVal = notes || "";
    const actualSellPrice = (type === "Terjual" && modalData.actualSellPrice) ? parseInt(modalData.actualSellPrice) : null;
    const stockBranchObj = BRANCHES.find(b => b.id === stockBranchId);
    const soldAtBranchObj = BRANCHES.find(b => b.id === soldAtBranchId);
    const targetItem = inventory.find((i) => i.id === itemId);
    if (!targetItem) return;

    const newStocks = { ...targetItem.stocks };
    if (type === "Stok Masuk" || type === "Retur") {
      newStocks[stockBranchId] = (newStocks[stockBranchId] || 0) + amount;
    } else if (type === "Terjual") {
      newStocks[stockBranchId] = Math.max(0, (newStocks[stockBranchId] || 0) - amount);
    } else if (type === "Transfer Antar Cabang" && targetBranch) {
      newStocks[stockBranchId] = Math.max(0, (newStocks[stockBranchId] || 0) - amount);
      newStocks[targetBranch] = (newStocks[targetBranch] || 0) + amount;
    }

    const totalLeft = Object.values(newStocks).reduce((s, v) => s + v, 0);
    const isSoldOut = type === "Terjual" && totalLeft === 0;

    setSyncing(true);
    try {
      if (isSoldOut) {
        await api.del("/api/inventory", { id: itemId });
      } else {
        await api.patch("/api/inventory", { id: itemId, stocks: newStocks });
      }
      if (type === "Terjual") {
        const finalSellPrice = actualSellPrice || targetItem.sellPrice || 0;
        const finalProfit = finalSellPrice - (targetItem.buyPrice || 0);
        await api.post("/api/sales", { id: Date.now(), item_id: itemId, type: targetItem.type||"hp", brand: targetItem.brand, model: targetItem.model, ram: targetItem.ram||"-", storage: targetItem.storage, color: targetItem.color||"-", condition: targetItem.condition, imei: targetItem.imei||"-", buy_price: targetItem.buyPrice||0, sell_price: finalSellPrice, original_sell_price: targetItem.sellPrice||0, profit: finalProfit, notes: notesVal, photos: targetItem.photos||[], stock_branch: stockBranchId, sold_branch: soldAtBranchId, sold_qty: amount, is_cod: isCOD, sold_at: new Date().toISOString() });
      }
      const actNotes = (type === "Terjual" && actualSellPrice) ? `${notesVal ? notesVal + " · " : ""}Harga: ${formatRupiah(actualSellPrice)}` : notesVal;
      await api.post("/api/activities", { id: Date.now(), time: new Date().toISOString(), type, item: `${targetItem.brand} ${targetItem.model}`, branch: stockBranchObj?.name||stockBranchId, qty: amount, notes: actNotes, sold_at_branch_name: (type==="Terjual")?(soldAtBranchObj?.name||stockBranchObj?.name):null, is_cod: isCOD, cancelled: false, edited_by: currentUser?.name || "Guest" });
      await loadAllData();
    } catch(e) { alert("Gagal update stok: " + e.message); }
    setSyncing(false);
    setShowModal(null); setModalData({});
  };

  const handleRestoreFromSold = async (soldId) => {
    if (!window.confirm("Kembalikan transaksi ini? Produk akan ditambah kembali ke stok aktif.")) return;
    const item = salesLog.find(i => i.id === soldId);
    if (!item) { alert("Data tidak ditemukan."); return; }
    const restoreBranch = item.stockBranch || item.soldBranch || "KP";
    const restoreQty = item.soldQty || 1;
    const restoreBranchName = BRANCHES.find(b => b.id === restoreBranch)?.name || restoreBranch;
    setSyncing(true);
    try {
      const existing = inventory.find(i => i.id === item.itemId);
      if (existing) {
        const newStocks = { ...existing.stocks };
        newStocks[restoreBranch] = (newStocks[restoreBranch] || 0) + restoreQty;
        // Gunakan originalSellPrice jika ada, fallback ke harga inventory saat ini
        const restoreSellPrice = (item.originalSellPrice && item.originalSellPrice > 0)
          ? item.originalSellPrice
          : existing.sellPrice || 0;
        await api.put("/api/inventory", { id: existing.id, stocks: newStocks, sell_price: restoreSellPrice });
      } else {
        const stocks = emptyStocks();
        stocks[restoreBranch] = restoreQty;
        const restoreSellPrice = (item.originalSellPrice && item.originalSellPrice > 0)
          ? item.originalSellPrice
          : item.sellPrice || 0;
        await api.post("/api/inventory", { id: item.itemId || Date.now(), type: item.type||"hp", brand: item.brand, model: item.model, ram: item.ram||"-", storage: item.storage, color: item.color||"-", imei: item.imei||"-", condition: item.condition, buy_price: item.buyPrice||0, sell_price: restoreSellPrice, notes: item.notes||"", photos: item.photos||[], stocks });
      }
      await api.del("/api/sales", { id: soldId });
      await api.post("/api/activities", { id: Date.now(), time: new Date().toISOString(), type: "Retur", item: `${item.brand} ${item.model}`, branch: restoreBranchName, qty: restoreQty, notes: `↩ Dikembalikan ke stok · Batalkan transaksi terjual ${item.soldAt ? new Date(item.soldAt).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}) : ""}`, is_cod: false, cancelled: false, edited_by: currentUser?.name || "Guest" });
      await loadAllData();
    } catch(e) { alert("Gagal kembalikan: " + e.message); }
    setSyncing(false);
    setViewSoldItem(null);
  };

  const handleDeleteActivity = async (actId) => {
    if (!window.confirm("Batalkan transaksi ini? Transaksi akan ditandai dibatalkan dan tetap tersimpan sebagai jejak.")) return;
    setSyncing(true);
    try {
      await api.put("/api/activities", { id: actId, cancelled: true, cancelled_at: new Date().toISOString(), cancelled_by: currentUser?.name || "Guest" });
      await loadAllData();
    } catch(e) { alert("Gagal batalkan: " + e.message); }
    setSyncing(false);
  };

  const handleSimpanTestimoni = async () => {
    const siap = testiItems.filter(i => i.url && i.keterangan.trim());
    if (siap.length === 0) return alert("Belum ada foto siap disimpan. Pastikan foto sudah terupload dan keterangan sudah diisi!");
    setSyncing(true);
    try {
      const rows = siap.map(i => ({ foto: i.url, keterangan: i.keterangan.trim(), created_at: new Date().toISOString() }));
      await api.post("/api/testimoni", rows);
      setTestiItems([]);
      await loadAllData();
    } catch(e) { alert("Gagal simpan: " + e.message); }
    setSyncing(false);
  };

  const handleHapusTestimoni = async (id) => {
    if (!window.confirm("Hapus testimoni ini?")) return;
    setSyncing(true);
    try {
      await api.del("/api/testimoni", { id });
      await loadAllData();
    } catch(e) { alert("Gagal hapus: " + e.message); }
    setSyncing(false);
  };

  const handleTestiFotoChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    // Tambah semua file ke list dengan status uploading
    const newItems = files.map(file => ({ preview: URL.createObjectURL(file), url: null, keterangan: "", uploading: true, file }));
    setTestiItems(prev => [...prev, ...newItems]);
    // Upload masing-masing ke Cloudinary
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const url = await uploadToCloudinary(file);
        setTestiItems(prev => {
          const updated = [...prev];
          // Cari item yang masih uploading dengan file yang sama (by preview)
          const idx = updated.findIndex(it => it.file === file);
          if (idx !== -1) updated[idx] = { ...updated[idx], url, uploading: false };
          return updated;
        });
      } catch(err) {
        setTestiItems(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(it => it.file === file);
          if (idx !== -1) updated[idx] = { ...updated[idx], uploading: false, error: true };
          return updated;
        });
      }
    }
    e.target.value = "";
  };

  const c = {
    app: { fontFamily: "'Sora', sans-serif", background: "#F8FAFC", minHeight: "100vh", color: "#1E293B" },
    header: { background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
    liveDot: { width: 7, height: 7, borderRadius: "50%", background: pulse ? "#C9A227" : "#E8C158", boxShadow: pulse ? "0 0 10px #C9A227" : "none", transition: "all 0.3s" },
    nav: { display: "flex", gap: 2, padding: "8px 12px", background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", overflowX: "auto" },
    navBtn: (active) => ({ padding: "10px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'Sora', sans-serif", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6, background: active ? "#C9A227" : "transparent", color: active ? "#fff" : "#64748B" }),
    main: { padding: "14px", maxWidth: 1100, margin: "0 auto" },
    sectionTitle: { fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 },
    card: () => ({ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }),
    input: { width: "100%", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: "#1E293B", fontSize: 13, fontFamily: "'Sora', sans-serif", outline: "none", boxSizing: "border-box", marginBottom: 12 },
    label: { fontSize: 11, color: "#64748B", marginBottom: 5, display: "block", fontWeight: 600 },
    btn: (v) => ({ padding: "10px 16px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Sora', sans-serif", background: v === "primary" ? "#C9A227" : v === "success" ? "#10B981" : v === "danger" ? "#EF4444" : v === "blue" ? "#0EA5E9" : v === "purple" ? "#8B5CF6" : "#F1F5F9", color: v === "ghost" ? "#64748B" : "#fff", whiteSpace: "nowrap" }),
    modal: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 },
    modalBox: { background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 20, padding: 24, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
    badge: (color, bg, border) => ({ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color, background: bg, border: `1px solid ${border || bg}` }),
  };

  // --- PRODUCT CARD component ---
  const ProductCard = ({ item, onClick }) => {
    const photos = (item.photos && item.photos.filter(Boolean).length > 0) ? item.photos.filter(Boolean) : item.photo ? [item.photo] : [];
    const branchStock = selectedBranch === "ALL"
      ? Object.values(item.stocks || {}).reduce((s, v) => s + v, 0)
      : (item.stocks?.[selectedBranch] || 0);
    const st = getStockStatus(branchStock);
    const cond = getConditionColor(item.condition);
    return (
      <div style={{ ...c.card(), cursor: "pointer", overflow: "hidden", padding: 10, display: "flex", flexDirection: "column", height: "100%" }} onClick={onClick}>
        <div style={{ width: "100%", aspectRatio: "1/1", background: "#F1F5F9", borderRadius: 8, marginBottom: 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          {photos[0]
            ? <img src={photos[0]} alt={item.model} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }}
                onClick={e => { e.stopPropagation(); setPhotoViewer({ photos, index: 0 }); setPhotoZoom(1); }} />
            : <div style={{ textAlign: "center", color: "#CBD5E1" }}><div style={{ fontSize: 24 }}>{item.type === "tablet" ? "📟" : "📱"}</div><div style={{ fontSize: 10, marginTop: 2 }}>Belum ada foto</div></div>
          }
          {photos.length > 1 && <div style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 8 }}>+{photos.length - 1}</div>}
          <div style={{ position: "absolute", top: 4, right: 4 }}>
            <span style={{ ...c.badge(st.color, st.bg, st.border), fontSize: 9, padding: "2px 5px" }}>{branchStock}</span>
          </div>
        </div>
        <div style={{ marginBottom: 6, marginTop: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35, marginBottom: 5 }}>{item.model}</div>
          <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 6 }}>{item.brand}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 6 }}>
          <div style={{ background: "#FBF3DD", borderRadius: 6, padding: "4px 6px" }}>
            <div style={{ fontSize: 8, color: "#C9A227", fontWeight: 600, marginBottom: 1 }}>RAM</div>
            <div style={{ fontSize: 10, color: "#1E293B", fontWeight: 700 }}>{item.ram && item.ram !== "-" ? item.ram : "-"}</div>
          </div>
          <div style={{ background: "#F0F9FF", borderRadius: 6, padding: "4px 6px" }}>
            <div style={{ fontSize: 8, color: "#0EA5E9", fontWeight: 600, marginBottom: 1 }}>Penyimpanan</div>
            <div style={{ fontSize: 10, color: "#1E293B", fontWeight: 700 }}>{item.storage && item.storage !== "-" ? item.storage : "-"}</div>
          </div>
          <div style={{ background: cond.bg, borderRadius: 6, padding: "4px 6px" }}>
            <div style={{ fontSize: 8, color: cond.color, fontWeight: 600, marginBottom: 1 }}>Kondisi</div>
            <div style={{ fontSize: 10, color: "#1E293B", fontWeight: 700 }}>{item.condition || "Second Wajar"}</div>
          </div>
          <div style={{ background: "#F1F5F9", borderRadius: 6, padding: "4px 6px" }}>
            <div style={{ fontSize: 8, color: "#64748B", fontWeight: 600, marginBottom: 1 }}>Warna</div>
            <div style={{ fontSize: 10, color: "#1E293B", fontWeight: 700 }}>{item.color && item.color !== "-" ? item.color : "-"}</div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 6, marginTop: "auto" }}>
          <div style={{ fontSize: 9, color: "#94A3B8" }}>Harga Jual</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>{formatRupiah(item.sellPrice)}</div>
          {currentUser && <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>Modal: {formatRupiah(item.buyPrice)}</div>}
        </div>
        {currentUser && selectedBranch === "ALL" && (
          <div style={{ display: "flex", gap: 3, marginTop: 6, flexWrap: "wrap" }}>
            {BRANCHES.map((b) => {
              const bst = getStockStatus(item.stocks?.[b.id] || 0);
              return <span key={b.id} style={{ fontSize: 9, fontWeight: 600, color: bst.color, background: bst.bg, padding: "1px 5px", borderRadius: 8 }}>{b.id}:{item.stocks?.[b.id] || 0}</span>;
            })}
          </div>
        )}
        {!currentUser && (
          <button
            onClick={e => {
              e.stopPropagation();
              const nama = `${item.brand} ${item.model}${item.ram && item.ram !== "-" ? " " + item.ram : ""}${item.storage && item.storage !== "-" ? "/" + item.storage : ""}${item.condition ? " (" + item.condition + ")" : ""}`;
              const pesan = `Halo, saya ingin membeli HP ${nama} seharga ${formatRupiah(item.sellPrice)}`;
              window.open(`https://wa.me/6283808484969?text=${encodeURIComponent(pesan)}`, "_blank");
            }}
            style={{ width: "100%", marginTop: 8, padding: "8px", background: "#C9A227", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Sora', sans-serif" }}
          >
            Beli Sekarang
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={c.app}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ===== LOGIN MODAL ===== */}
      {showLoginModal && (
        <div style={c.modal} onClick={() => setShowLoginModal(false)}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div style={{ width: 56, height: 56, background: "linear-gradient(135deg, #E8C158, #C9A227)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 12px" }}>🔐</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1E293B" }}>Login Staff</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>Masuk untuk mengedit data</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 5, display: "block" }}>Username</label>
              <input style={{ width: "100%", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "11px 14px", color: "#1E293B", fontSize: 13, fontFamily: "'Sora', sans-serif", outline: "none", boxSizing: "border-box" }}
                placeholder="Masukkan username" value={loginUsername}
                onChange={e => { setLoginUsername(e.target.value); setLoginError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                autoCapitalize="none" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 5, display: "block" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input style={{ width: "100%", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "11px 40px 11px 14px", color: "#1E293B", fontSize: 13, fontFamily: "'Sora', sans-serif", outline: "none", boxSizing: "border-box" }}
                  type={showPassword ? "text" : "password"} placeholder="Masukkan password" value={loginPassword}
                  onChange={e => { setLoginPassword(e.target.value); setLoginError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()} />
                <button onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#94A3B8" }}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            {loginError && <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8, padding: "7px 12px", marginBottom: 12, fontSize: 12, color: "#EF4444", textAlign: "center" }}>❌ {loginError}</div>}
            <button
              style={{ width: "100%", padding: "12px", background: loginLockedUntil && Date.now() < loginLockedUntil ? "#94A3B8" : "linear-gradient(135deg, #E8C158, #C9A227)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: loginLockedUntil && Date.now() < loginLockedUntil ? "not-allowed" : "pointer", fontFamily: "'Sora', sans-serif" }}
              onClick={handleLogin}>
              {loginLockedUntil && Date.now() < loginLockedUntil ? "🔒 Login Diblokir" : "Masuk"}
            </button>
            <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "#CBD5E1" }}>Hubungi pemilik toko untuk akun</div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ fontSize: 48 }}>📱</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1E293B" }}>PontiCell <span style={{ fontSize: 11, fontWeight: 500, color: "#94A3B8" }}>by.Max</span></div>
          <div style={{ fontSize: 13, color: "#94A3B8" }}>Memuat data dari server...</div>
          <div style={{ width: 36, height: 36, border: "3px solid #E2E8F0", borderTop: "3px solid #C9A227", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @media (min-width: 768px) {
              .product-grid { grid-template-columns: repeat(5, 1fr) !important; }
            }
          `}</style>
        </div>
      )}

      {/* HEADER */}
      <div style={c.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="https://res.cloudinary.com/dom8pseei/image/upload/v1781459321/logo-ponticell_wqazo4.jpg" alt="PontiCell" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #E8C158, #C9A227)", borderRadius: 10, display: "none", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📱</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1E293B" }}>PontiCell <span style={{ fontSize: 11, fontWeight: 500, color: "#94A3B8" }}>by.Max</span></div>
            <div style={{ fontSize: 10, color: "#94A3B8" }}>Pontianak</div>
          </div>
        </div>
        {currentUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ background: "#FBF3DD", color: "#C9A227", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>● {currentUser.role === "admin" ? "Admin" : "Staff"}</span>
              <span>{currentUser.name}</span>
            </div>
            <button onClick={handleLogout} style={{ background: "#F1F5F9", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 600, color: "#64748B", cursor: "pointer", fontFamily: "'Sora', sans-serif" }}>Keluar</button>
          </div>
        ) : (
          <div style={{ width: 32 }} />
        )}
      </div>

      {/* LIVE indicator - pojok kanan atas */}
      <div
        style={{ position: "fixed", top: 10, right: 12, zIndex: 200, display:"flex", alignItems:"center", gap:5, background:"#FBF3DD", padding:"4px 10px", borderRadius:20, border:"1px solid #EAD9A8", cursor:"default", userSelect:"none", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
        onClick={() => {
          if (currentUser) return;
          const newCount = liveTapCount + 1;
          setLiveTapCount(newCount);
          if (liveTapTimer.current) clearTimeout(liveTapTimer.current);
          if (newCount >= 5) {
            setLiveTapCount(0);
            setShowLoginModal(true);
            setLoginUsername(""); setLoginPassword(""); setLoginError("");
          } else {
            liveTapTimer.current = setTimeout(() => setLiveTapCount(0), 2000);
          }
        }}
      >
        <div style={c.liveDot} />
        <span style={{ fontSize: 9, color: "#C9A227", fontWeight: 700 }}>{syncing ? "⏳" : `LIVE · ${lastUpdate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`}</span>
      </div>
      

      {/* NAV */}
      <div style={c.nav}>
        {[
          ...(currentUser ? [["dashboard", <BarChart3 size={16} />, "Dashboard"]] : []),
          ["hp", <Smartphone size={16} />, "HP"],
          ["tablet", <Tablet size={16} />, "Tablet"],
          ["testimoni", <Star size={16} />, "Testimoni"],
          ...(currentUser ? [
            ["pesanan", <span style={{fontSize:14}}>📋</span>, "Pesanan"],
            ["terjual", <Tag size={16} />, "Terjual"],
            ...(currentUser.role === "admin" ? [
              ["aktivitas", <ClipboardList size={16} />, "Aktivitas"],
              ["finance", <Wallet size={16} />, "Finance"],
              ["konten", <span style={{fontSize:14}}>🖼️</span>, "Konten"],
            ] : []),
          ] : []),
        ].map(([tab, icon, label]) => (
          <button key={tab} style={c.navBtn(activeTab === tab)} onClick={() => {
            setActiveTab(tab);
            if (tab === "hp") { setProductType("hp"); }
            if (tab === "tablet") { setProductType("tablet"); }
            if (tab !== "finance") setFinanceUnlocked(false);
            setFinancePinInput(""); setFinancePinError(false);
          }}>{icon}{label}</button>
        ))}
      </div>

      <div style={c.main}>

        {/* ===== DASHBOARD ===== */}
        {activeTab === "dashboard" && (
          <>
            <div style={c.sectionTitle}>Ringkasan 4 Cabang</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
              {BRANCHES.map((branch) => (
                <div key={branch.id} style={{ ...c.card(), borderTop: `3px solid ${branch.color}`, padding: 14, cursor: "pointer" }}
                  onClick={() => { setActiveTab("hp"); setProductType("hp"); setSelectedBranch(branch.id); setSelectedBrand("Semua"); setSearchQuery(""); }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.10)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.04)"}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{branch.name}</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 10 }}>📍 {branch.city}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>Total Stok</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: branch.color }}>{totalStockByBranch(branch.id)}<span style={{ fontSize: 11 }}> unit</span></div>

                  <div style={{ fontSize: 10, color: branch.color, marginTop: 6, opacity: 0.8 }}>Lihat stok →</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Total Semua Stok", value: `${totalAllStock} unit`, icon: "📦", color: "#0EA5E9" },
                { label: "Produk Aktif HP", value: `${inventory.filter(i=>i.type==="hp" && Object.values(i.stocks||{}).reduce((s,v)=>s+v,0)>0).length} model`, icon: "📱", color: "#8B5CF6", onClick: () => { setActiveTab("hp"); setProductType("hp"); setSelectedBranch("ALL"); setSelectedBrand("Semua"); setSearchQuery(""); } },
                { label: "Produk Aktif Tablet", value: `${inventory.filter(i=>i.type==="tablet" && Object.values(i.stocks||{}).reduce((s,v)=>s+v,0)>0).length} model`, icon: "📟", color: "#10B981", onClick: () => { setActiveTab("tablet"); setProductType("tablet"); setSelectedBranch("ALL"); setSelectedBrand("Semua"); setSearchQuery(""); } },
              ].map((item) => (
                <div key={item.label} style={{ ...c.card(), padding: 14, cursor: item.onClick ? "pointer" : "default" }}
                  onClick={item.onClick}
                  onMouseEnter={e => { if(item.onClick) e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.10)"; }}
                  onMouseLeave={e => { if(item.onClick) e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.04)"; }}
                >
                  <div style={{ fontSize: 18, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: item.color }}>{item.value}</div>
                  {item.onClick && <div style={{ fontSize: 10, color: item.color, marginTop: 4, opacity: 0.7 }}>Lihat semua →</div>}
                </div>
              ))}
            </div>

            {criticalItems.length > 0 && (
              <div style={{ background: "#FFF5F5", border: "1px solid #FECACA", borderRadius: 12, padding: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#EF4444", marginBottom: 10 }}>⚠️ Stok Kritis</div>
                {criticalItems.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #FEE2E2", fontSize: 12 }}>
                    <span style={{ color: "#374151" }}>{item.brand} {item.model}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {BRANCHES.map((b) => (item.stocks?.[b.id] || 0) <= 2 && (item.stocks?.[b.id] || 0) > 0 && (
                        <span key={b.id} style={{ color: "#F97316", fontWeight: 700, fontSize: 11 }}>{b.id}:{item.stocks[b.id]}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={c.sectionTitle}>Stok Per Cabang</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {BRANCHES.map((branch) => (
                <div key={branch.id} style={c.card()}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #F1F5F9" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: branch.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{branch.name}</span>
                  </div>
                  {inventory.filter(i => (i.stocks?.[branch.id] || 0) > 0).sort((a, b) => (b.stocks?.[branch.id] || 0) - (a.stocks?.[branch.id] || 0)).slice(0, 5).map((item) => {
                    const st = getStockStatus(item.stocks?.[branch.id] || 0);
                    return (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #F8FAFC" }}>
                        <span style={{ fontSize: 11, color: "#374151" }}>{item.type === "tablet" ? "📟" : "📱"} {item.brand} {item.model.split(" ").slice(-1)}</span>
                        <span style={c.badge(st.color, st.bg, st.border)}>{item.stocks[branch.id]}</span>
                      </div>
                    );
                  })}
                  {inventory.filter(i => (i.stocks?.[branch.id] || 0) > 0).length === 0 && (
                    <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: 8 }}>Stok kosong</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===== HP / TABLET TAB ===== */}
        {(activeTab === "hp" || activeTab === "tablet") && (
          <>
            {/* Branch filter buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <button
                style={{ ...c.btn(selectedBranch === "ALL" ? "primary" : "ghost"), fontSize: 12, padding: "7px 14px" }}
                onClick={() => setSelectedBranch("ALL")}
              >{currentUser ? "Semua Cabang" : "Semua Produk"}</button>
              {currentUser && BRANCHES.map((b) => (
                <button key={b.id}
                  style={{ padding: "7px 14px", borderRadius: 10, border: selectedBranch === b.id ? `2px solid ${b.color}` : "2px solid #E2E8F0", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Sora', sans-serif", background: selectedBranch === b.id ? b.color + "18" : "#fff", color: selectedBranch === b.id ? b.color : "#64748B" }}
                  onClick={() => setSelectedBranch(b.id)}
                >{b.name}</button>
              ))}
            </div>

            {/* Search + brand filter */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <input style={{ ...c.input, flex: 1, minWidth: 140, marginBottom: 0 }} placeholder={`🔍 Cari ${activeTab === "tablet" ? "tablet" : "HP"}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <select style={{ ...c.input, marginBottom: 0, minWidth: 110 }} value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
                {BRANDS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>

            {currentUser && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button style={c.btn("primary")} onClick={() => { setShowModal("addProduct"); setModalData({}); }}>+ Tambah {activeTab === "tablet" ? "Tablet" : "HP"}</button>
                <button style={c.btn("blue")} onClick={() => {
                  setShowModal("updateStock");
                  setModalData(currentUser?.role !== "admin" && currentUser?.branch ? { branchId: currentUser.branch } : {});
                }}>✏️ Update Stok</button>
              </div>
            )}


            {readyInventory.length === 0 ? (
              <div style={{ ...c.card(), textAlign: "center", padding: 50 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>{activeTab === "tablet" ? "📟" : "📱"}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                  {selectedBranch === "ALL" ? `Tidak ada ${activeTab === "tablet" ? "tablet" : "HP"} ready` : `Tidak ada stok di ${BRANCHES.find(b=>b.id===selectedBranch)?.name}`}
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>Tambah produk atau pilih cabang lain</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: window.innerWidth >= 768 ? "repeat(5, 1fr)" : "repeat(2, 1fr)", gap: 28, rowGap: 28 }}>
                {readyInventory.map((item) => (
                  <ProductCard key={item.id} item={item} onClick={() => { setViewItem(item); setViewPhotoIndex(0); }} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== PESANAN ===== */}
        {activeTab === "pesanan" && (() => {
          const statusColor = { pending: "#F97316", diproses: "#3B82F6", selesai: "#10B981", dibatalkan: "#EF4444" };
          const statusLabel = { pending: "⏳ Pending", diproses: "🔄 Diproses", selesai: "✅ Selesai", dibatalkan: "❌ Dibatalkan" };

          const updateStatus = async (id, status) => {
            setSyncing(true);
            try {
              await api.put("/api/pesanan", { id, status });
              await loadAllData();
            } catch(e) { alert("Gagal update: " + e.message); }
            setSyncing(false);
          };

          const pendingCount = pesanan.filter(p => p.status === "pending").length;

          return (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={c.sectionTitle}>Pesanan Masuk</div>
                  <div style={{ fontSize: 13, color: "#64748B" }}>{pesanan.length} total · {pendingCount} pending</div>
                </div>
                {pendingCount > 0 && (
                  <div style={{ background: "#FFF7ED", border: "1px solid #F97316", borderRadius: 10, padding: "8px 16px", fontSize: 13, color: "#F97316", fontWeight: 700 }}>
                    🔔 {pendingCount} pesanan baru!
                  </div>
                )}
              </div>

              {pesanan.length === 0 && (
                <div style={{ ...c.card(), textAlign: "center", padding: 60, color: "#CBD5E1" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#94A3B8" }}>Belum ada pesanan</div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pesanan.map(p => (
                  <div key={p.id} style={{ ...c.card(), borderLeft: "4px solid " + (statusColor[p.status] || "#E2E8F0") }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{ background: statusColor[p.status] + "20", color: statusColor[p.status], borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                            {statusLabel[p.status] || p.status}
                          </span>
                          <span style={{ fontSize: 11, color: "#94A3B8" }}>
                            {p.created_at ? new Date(p.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>

                        <div style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", marginBottom: 4 }}>{p.produk_nama}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#FF6B35", marginBottom: 10 }}>
                          Rp {Number(p.produk_harga).toLocaleString("id-ID")}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 12, color: "#64748B" }}>
                          <div>👤 <b>{p.nama}</b></div>
                          <div>📱 {p.whatsapp}</div>
                          <div style={{ gridColumn: "1/-1" }}>📍 {p.alamat}, {p.kota}</div>
                          {p.catatan && <div style={{ gridColumn: "1/-1" }}>📝 {p.catatan}</div>}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
                        <a href={"https://wa.me/" + p.whatsapp.replace(/[^0-9]/g, "") + "?text=" + encodeURIComponent("Halo " + p.nama + ", pesanan " + p.produk_nama + " sudah kami terima!")}
                          target="_blank" rel="noopener noreferrer"
                          style={{ ...c.btn("primary"), textDecoration: "none", textAlign: "center", fontSize: 12, padding: "8px 12px" }}>
                          💬 Hubungi WA
                        </a>
                        <select
                          style={{ ...c.input, marginBottom: 0, fontSize: 12, padding: "8px 10px" }}
                          value={p.status}
                          onChange={e => updateStatus(p.id, e.target.value)}>
                          <option value="pending">⏳ Pending</option>
                          <option value="diproses">🔄 Diproses</option>
                          <option value="selesai">✅ Selesai</option>
                          <option value="dibatalkan">❌ Dibatalkan</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ===== TERJUAL ===== */}
        {activeTab === "terjual" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button style={{ ...c.btn(productType === "hp" ? "primary" : "ghost"), fontSize: 12 }} onClick={() => setProductType("hp")}>📱 HP Terjual</button>
              <button style={{ ...c.btn(productType === "tablet" ? "purple" : "ghost"), fontSize: 12 }} onClick={() => setProductType("tablet")}>📟 Tablet Terjual</button>
            </div>

            {soldInventory.length === 0 ? (
              <div style={{ ...c.card(), textAlign: "center", padding: 50 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🏷️</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Belum ada yang terjual</div>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>Produk yang stoknya habis terjual akan muncul di sini</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 28, rowGap: 28 }}>
                {soldInventory.map((item) => {
                  const photos = (item.photos && item.photos.filter(Boolean).length > 0) ? item.photos.filter(Boolean) : item.photo ? [item.photo] : [];
                  const cond = getConditionColor(item.condition);
                  const soldBranchName = BRANCHES.find(b => b.id === item.soldBranch)?.name || item.soldBranch;
                  const soldBranch = BRANCHES.find(b => b.id === item.soldBranch);
                  return (
                    <div key={item.id} style={{ ...c.card(), overflow: "hidden", cursor: "pointer" }}
                      onClick={() => setViewSoldItem(item)}>
                      {/* Photo */}
                      <div style={{ width: "100%", height: 150, background: "#F1F5F9", borderRadius: 10, marginBottom: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        {photos[0]
                          ? <img src={photos[0]} alt={item.model} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ textAlign: "center", color: "#CBD5E1" }}><div style={{ fontSize: 28 }}>{item.type === "tablet" ? "📟" : "📱"}</div></div>
                        }
                        <div style={{ position: "absolute", top: 6, left: 6, background: "#10B981", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 10 }}>✅ TERJUAL</div>
                        <div style={{ position: "absolute", top: 6, right: 6, background: soldBranch?.color || "#64748B", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 10 }}>{item.isCOD ? "🛵 COD" : soldBranchName}</div>
                      </div>

                      {/* Info */}
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{item.model}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 8 }}>
                        {item.brand}{item.ram && item.ram !== "-" ? " · " + item.ram : ""} · {item.storage}
                      </div>

                      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                        <span style={c.badge(cond.color, cond.bg, cond.bg)}>{item.condition}</span>
                        <span style={c.badge("#8B5CF6", "#EDE9FE", "#DDD6FE")}>{item.soldQty} unit</span>
                      </div>

                      {/* Date & branch */}
                      <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2 }}>📦 Stok dari: <strong>{BRANCHES.find(b=>b.id===item.stockBranch)?.name || soldBranchName}</strong></div>
                        {item.soldBranch !== item.stockBranch && <div style={{ fontSize: 11, color: "#64748B", marginBottom: 2 }}>{item.isCOD ? "🛵 COD ke" : "📍 Terjual di"}: <strong>{soldBranchName}</strong></div>}
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>🕒 {new Date(item.soldAt).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · {new Date(item.soldAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>

                      {/* Price */}
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #F1F5F9", paddingTop: 10, marginBottom: 10 }}>
                        <div><div style={{ fontSize: 10, color: "#94A3B8" }}>Harga Jual</div><div style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>{formatRupiah(item.sellPrice)}</div></div>
                        {currentUser && <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: "#94A3B8" }}>Profit</div><div style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>{formatRupiah((item.sellPrice || 0) - (item.buyPrice || 0))}</div></div>}
                      </div>
                      <div style={{ textAlign: "center", fontSize: 11, color: "#94A3B8", paddingTop: 4, borderTop: "1px solid #F1F5F9" }}>👆 Tap untuk lihat detail & kembalikan stok</div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ===== AKTIVITAS ===== */}
        {activeTab === "aktivitas" && !currentUser && (
          <div style={{ ...c.card(), textAlign: "center", padding: 50 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Akses Terbatas</div>
            <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 20 }}>Login untuk melihat riwayat aktivitas</div>
            <button style={c.btn("primary")} onClick={() => { setShowLoginModal(true); setLoginUsername(""); setLoginPassword(""); setLoginError(""); }}>🔐 Login Sekarang</button>
          </div>
        )}
        {activeTab === "aktivitas" && currentUser && (() => {
          const actAvailYears = [...new Set(activities.filter(a=>a.time).map(a=>toLocalYearStr(a.time)))].sort((a,b)=>b-a);
          const actAvailMonths = [...new Set(activities.filter(a=>a.time).map(a=>toLocalMonthStr(a.time)))].sort((a,b)=>b.localeCompare(a));

          const matchActPeriod = (act) => {
            if (!act.time) return false;
            const localDate = toLocalDateStr(act.time);
            const localMonth = toLocalMonthStr(act.time);
            const localYear = toLocalYearStr(act.time);
            if (actPeriod === "today") return localDate === todayLocalStr();
            if (actPeriod === "month") return localMonth === thisMonthLocalStr();
            if (actPeriod === "year") return localYear === thisYearLocalStr();
            if (actPeriod === "custom_date") return localDate === actCustomDate;
            if (actPeriod === "custom_month") return localMonth === (actCustomMonth || thisMonthLocalStr());
            if (actPeriod === "custom_year") return localYear === (actCustomYear || thisYearLocalStr());
            return true;
          };

          const filteredAct = activities.filter(act => {
            const matchPeriod = matchActPeriod(act);
            const matchType = actType === "Semua" || act.type === actType;
            const matchBranch = actBranch === "ALL" || act.branch === BRANCHES.find(b=>b.id===actBranch)?.name;
            return matchPeriod && matchType && matchBranch;
          });

          const typeColors = { "Terjual": "#EF4444", "Stok Masuk": "#10B981", "Transfer Antar Cabang": "#F59E0B", "Retur": "#8B5CF6" };
          const typeIcons = { "Terjual": "🏷️", "Stok Masuk": "📦", "Transfer Antar Cabang": "🔄", "Retur": "↩️" };

          return (
            <>
              {/* Period filter */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {[["all","Semua"],["today","Hari Ini"],["month","Bulan Ini"],["year","Tahun Ini"],["custom_date","Pilih Tanggal"],["custom_month","Pilih Bulan"],["custom_year","Pilih Tahun"]].map(([val,label]) => (
                  <button key={val}
                    style={{ ...c.btn(actPeriod === val ? "primary" : "ghost"), fontSize: 11, padding: "6px 12px" }}
                    onClick={() => setActPeriod(val)}>{label}</button>
                ))}
              </div>

              {actPeriod === "custom_date" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={c.label}>Pilih Tanggal</label>
                  <input type="date" style={{ ...c.input, maxWidth: 200, marginBottom: 0 }}
                    value={actCustomDate || todayLocalStr()}
                    onChange={e => setActCustomDate(e.target.value)} />
                </div>
              )}
              {actPeriod === "custom_month" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={c.label}>Pilih Bulan</label>
                  <select style={{ ...c.input, maxWidth: 220, marginBottom: 0 }}
                    value={actCustomMonth || thisMonthLocalStr()}
                    onChange={e => setActCustomMonth(e.target.value)}>
                    {actAvailMonths.length > 0 ? actAvailMonths.map(m => (
                      <option key={m} value={m}>{new Date(m+"-01").toLocaleDateString("id-ID",{month:"long",year:"numeric"})}</option>
                    )) : <option value={thisMonthLocalStr()}>{new Date(thisMonthLocalStr()+"-01").toLocaleDateString("id-ID",{month:"long",year:"numeric"})}</option>}
                  </select>
                </div>
              )}
              {actPeriod === "custom_year" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={c.label}>Pilih Tahun</label>
                  <select style={{ ...c.input, maxWidth: 200, marginBottom: 0 }}
                    value={actCustomYear || thisYearLocalStr()}
                    onChange={e => setActCustomYear(e.target.value)}>
                    {actAvailYears.length > 0 ? actAvailYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    )) : <option value={thisYearLocalStr()}>{thisYearLocalStr()}</option>}
                  </select>
                </div>
              )}

              {/* Type + Branch filter */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {["Semua", "Stok Masuk", "Terjual", "Transfer Antar Cabang", "Retur"].map(t => (
                  <button key={t}
                    style={{ padding: "6px 12px", borderRadius: 8, border: actType === t ? `2px solid ${typeColors[t]||"#C9A227"}` : "2px solid #E2E8F0", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "'Sora', sans-serif", background: actType === t ? (typeColors[t]||"#C9A227")+"18" : "#fff", color: actType === t ? (typeColors[t]||"#C9A227") : "#64748B" }}
                    onClick={() => setActType(t)}>{t === "Semua" ? "Semua Jenis" : (typeIcons[t]||"") + " " + t}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <button style={{ ...c.btn(actBranch === "ALL" ? "blue" : "ghost"), fontSize: 11, padding: "6px 12px" }} onClick={() => setActBranch("ALL")}>Semua Cabang</button>
                {BRANCHES.map(b => (
                  <button key={b.id}
                    style={{ padding: "6px 12px", borderRadius: 8, border: actBranch === b.id ? `2px solid ${b.color}` : "2px solid #E2E8F0", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "'Sora', sans-serif", background: actBranch === b.id ? b.color+"18" : "#fff", color: actBranch === b.id ? b.color : "#64748B" }}
                    onClick={() => setActBranch(b.id)}>{b.name}</button>
                ))}
              </div>

              {/* Summary counts */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {Object.entries(typeColors).map(([type, color]) => {
                  const count = filteredAct.filter(a => a.type === type).length;
                  return (
                    <div key={type} style={{ background: color+"12", border: `1px solid ${color}33`, borderRadius: 10, padding: "6px 14px", fontSize: 12 }}>
                      <span style={{ color }}>{typeIcons[type]} {type}</span>
                      <span style={{ fontWeight: 800, color, marginLeft: 6 }}>{count}x</span>
                    </div>
                  );
                })}
                <div style={{ background: "#F1F5F9", borderRadius: 10, padding: "6px 14px", fontSize: 12, color: "#64748B" }}>
                  Total <strong>{filteredAct.length}</strong> transaksi
                </div>
              </div>

              {filteredAct.length === 0 ? (
                <div style={{ ...c.card(), textAlign: "center", padding: 50 }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                  <div style={{ fontSize: 13, color: "#94A3B8" }}>Tidak ada transaksi ditemukan.</div>
                </div>
              ) : (
                <div style={c.card()}>
                  {filteredAct.map((act, idx) => {
                    const color = typeColors[act.type] || "#94A3B8";
                    const icon = typeIcons[act.type] || "•";
                    return (
                      <div key={act.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: idx < filteredAct.length-1 ? "1px solid #F1F5F9" : "none", alignItems: "flex-start", background: act.cancelled ? "#F8F8F8" : "transparent", borderRadius: act.cancelled ? 8 : 0, opacity: act.cancelled ? 0.7 : 1 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: act.cancelled ? "#E2E8F0" : color+"15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{act.cancelled ? "🚫" : icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: act.cancelled ? "#94A3B8" : color, textDecoration: act.cancelled ? "line-through" : "none" }}>{act.type}</span>
                              {act.cancelled && <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#94A3B8", padding: "1px 7px", borderRadius: 10 }}>DIBATALKAN</span>}
                            </div>
                            <span style={{ fontSize: 10, color: "#94A3B8" }}>{new Date(act.time).toLocaleString("id-ID", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}</span>
                          </div>
                          <div style={{ fontSize: 12, color: act.cancelled ? "#94A3B8" : "#374151" }}><strong>{act.item}</strong></div>
                          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                            📦 Stok dari: <strong>{act.branch}</strong>
                          </div>
                          {act.type === "Terjual" && (
                            <div style={{ fontSize: 11, marginTop: 2, color: "#94A3B8" }}>
                              {act.isCOD
                                ? <span>🛵 COD ke: <strong>{act.soldAtBranchName || act.branch}</strong></span>
                                : <span>📍 Terjual di: <strong>{act.soldAtBranchName || act.branch}</strong></span>
                              }
                              <span> · <strong>{act.qty} unit</strong></span>
                            </div>
                          )}
                          {act.type !== "Terjual" && (
                            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                              · <strong>{act.qty} unit</strong>
                            </div>
                          )}
                          {act.notes && (() => {
                            // Pisahkan harga terjual dari catatan biasa
                            const parts = act.notes.split(" · ");
                            const hargaPart = parts.find(p => p.startsWith("Harga:"));
                            const catatanPart = parts.filter(p => !p.startsWith("Harga:")).join(" · ");
                            return (
                              <>
                                {hargaPart && (
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981", marginTop: 3, background: "#ECFDF5", border: "1px solid #BBF7D0", borderRadius: 6, padding: "3px 8px", display: "inline-block" }}>
                                    💰 {hargaPart}
                                  </div>
                                )}
                                {catatanPart && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>📝 {catatanPart}</div>}
                              </>
                            );
                          })()}
                          <div style={{ fontSize: 10, color: "#CBD5E1", marginTop: 4 }}>
                            👤 {act.editedBy || "—"}
                          </div>
                          {act.cancelled && act.cancelledAt && (
                            <div style={{ fontSize: 10, color: "#EF4444", marginTop: 2 }}>
                              🚫 Dibatalkan oleh: <strong>{act.cancelledBy || "—"}</strong> · {new Date(act.cancelledAt).toLocaleString("id-ID", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                            </div>
                          )}
                        </div>
                        {!act.cancelled && (
                          <button
                            onClick={() => handleDeleteActivity(act.id)}
                            style={{ background: "none", border: "1px solid #FECACA", borderRadius: 8, cursor: "pointer", padding: "4px 8px", fontSize: 12, color: "#EF4444", flexShrink: 0, marginTop: 2 }}
                            title="Batalkan transaksi ini"
                          >🗑️</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

        {/* ===== FINANCE ===== */}
        {activeTab === "finance" && !currentUser && (
          <div style={{ ...c.card(), textAlign: "center", padding: 50 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Akses Terbatas</div>
            <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 20 }}>Login untuk melihat laporan keuangan</div>
            <button style={c.btn("primary")} onClick={() => { setShowLoginModal(true); setLoginUsername(""); setLoginPassword(""); setLoginError(""); }}>🔐 Login Sekarang</button>
          </div>
        )}
        {activeTab === "finance" && currentUser && !financeUnlocked && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <div style={{ ...c.card(), maxWidth: 320, width: "100%", textAlign: "center", padding: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Menu Finance Terkunci</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 24 }}>Masukkan PIN untuk mengakses laporan keuangan</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: financePinInput.length > i ? "#C9A227" : "#E2E8F0", transition: "all 0.2s" }} />
                ))}
              </div>
              {financePinError && <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 12 }}>❌ PIN salah, coba lagi</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((num, idx) => (
                  <button key={idx}
                    style={{ padding: "16px 0", borderRadius: 12, border: "1px solid #E2E8F0", background: num === "" ? "transparent" : "#F8FAFC", cursor: num === "" ? "default" : "pointer", fontSize: 18, fontWeight: 700, color: "#1E293B", fontFamily: "'Sora', sans-serif" }}
                    onClick={() => {
                      if (num === "" ) return;
                      if (num === "⌫") {
                        setFinancePinInput(p => p.slice(0,-1));
                        setFinancePinError(false);
                      } else {
                        const newPin = financePinInput + num;
                        setFinancePinInput(newPin);
                        setFinancePinError(false);
                        if (newPin.length === 4) {
                          if (!financePinHash) {
                            setFinanceUnlocked(true);
                            setFinancePinInput("");
                            return;
                          }
                          hashPassword(newPin).then(hashed => {
                            if (hashed === financePinHash) {
                              setFinanceUnlocked(true);
                              setFinancePinInput("");
                            } else {
                              setFinancePinError(true);
                              setTimeout(() => setFinancePinInput(""), 600);
                            }
                          });
                        }
                      }
                    }}
                  >{num}</button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#CBD5E1" }}>Hubungi pemilik toko untuk PIN</div>
            </div>
          </div>
        )}

        {activeTab === "finance" && currentUser && financeUnlocked && (() => {
          const availableYears = [...new Set(salesLog.filter(i=>i.soldAt).map(i => toLocalYearStr(i.soldAt)))].sort((a,b)=>b-a);
          const availableMonths = [...new Set(salesLog.filter(i=>i.soldAt).map(i => toLocalMonthStr(i.soldAt)))].sort((a,b)=>b.localeCompare(a));

          const matchPeriod = (item) => {            if (!item.soldAt) return false;
            const localDate = toLocalDateStr(item.soldAt);
            const localMonth = toLocalMonthStr(item.soldAt);
            const localYear = toLocalYearStr(item.soldAt);
            if (financePeriod === "today") return localDate === todayLocalStr();
            if (financePeriod === "month") return localMonth === thisMonthLocalStr();
            if (financePeriod === "year") return localYear === thisYearLocalStr();
            if (financePeriod === "custom_month") return localMonth === (financeCustomMonth || thisMonthLocalStr());
            if (financePeriod === "custom_year") return localYear === (financeCustomYear || thisYearLocalStr());
            if (financePeriod === "custom_date") return localDate === financeCustomDate;
            return true;
          };

          const filterSold = salesLog.filter(item => matchPeriod(item) && (financeBranch === "ALL" || item.soldBranch === financeBranch));

          const totalRevenue = filterSold.reduce((s, i) => s + (i.sellPrice || 0), 0);
          const totalModal = filterSold.reduce((s, i) => s + (i.buyPrice || 0), 0);
          const totalProfit = totalRevenue - totalModal;
          const totalModalStok = financeBranch === "ALL"
            ? inventory.reduce((s, i) => s + Object.values(i.stocks||{}).reduce((a,v)=>a+v,0) * (i.buyPrice||0), 0)
            : inventory.reduce((s, i) => s + (i.stocks?.[financeBranch]||0) * (i.buyPrice||0), 0);

          const branchStats = BRANCHES.map(b => {
            const items = salesLog.filter(i => matchPeriod(i) && i.soldBranch === b.id);
            const rev = items.reduce((s, i) => s + (i.sellPrice || 0), 0);
            const mod = items.reduce((s, i) => s + (i.buyPrice || 0), 0);
            return { ...b, items: items.length, revenue: rev, modal: mod, profit: rev - mod };
          });

          return (
            <>
              {/* Finance header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
                <div style={{ fontSize:15, fontWeight:800, color:"#1E293B" }}>💰 Laporan Finance</div>
                <div style={{ display:"flex", gap:8 }}>
                  {currentUser?.role === "admin" && (
                    <button style={{ ...c.btn("blue"), fontSize:11, padding:"6px 12px" }}
                      onClick={() => { setShowSetPinModal(true); setSetPinStep(1); setSetPinInput(""); setSetPinFirst(""); setSetPinError(""); }}>
                      🔑 {financePinHash ? "Ubah PIN" : "Set PIN"}
                    </button>
                  )}
                  <button style={{ ...c.btn("ghost"), fontSize:11, padding:"6px 12px" }}
                    onClick={() => { setFinanceUnlocked(false); setFinancePinInput(""); }}>
                    🔒 Kunci
                  </button>
                </div>
              </div>

              {/* Period filter */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {[["today","Hari Ini"],["month","Bulan Ini"],["year","Tahun Ini"],["custom_date","Pilih Tanggal"],["custom_month","Pilih Bulan"],["custom_year","Pilih Tahun"],["all","Semua"]].map(([val, label]) => (
                  <button key={val}
                    style={{ ...c.btn(financePeriod === val ? "primary" : "ghost"), fontSize: 11, padding: "6px 12px" }}
                    onClick={() => setFinancePeriod(val)}>{label}</button>
                ))}
              </div>

              {/* Custom date picker */}
              {financePeriod === "custom_date" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={c.label}>Pilih Tanggal</label>
                  <input type="date" style={{ ...c.input, maxWidth: 200, marginBottom: 0 }}
                    value={financeCustomDate || todayLocalStr()}
                    onChange={e => setFinanceCustomDate(e.target.value)} />
                </div>
              )}
              {financePeriod === "custom_month" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={c.label}>Pilih Bulan</label>
                  <select style={{ ...c.input, maxWidth: 200, marginBottom: 0 }}
                    value={financeCustomMonth || thisMonthLocalStr()}
                    onChange={e => setFinanceCustomMonth(e.target.value)}>
                    {availableMonths.length > 0 ? availableMonths.map(m => (
                      <option key={m} value={m}>{new Date(m+"-01").toLocaleDateString("id-ID",{month:"long",year:"numeric"})}</option>
                    )) : <option value={thisMonthLocalStr()}>{new Date(thisMonthLocalStr()+"-01").toLocaleDateString("id-ID",{month:"long",year:"numeric"})}</option>}
                  </select>
                </div>
              )}
              {financePeriod === "custom_year" && (
                <div style={{ marginBottom: 12 }}>
                  <label style={c.label}>Pilih Tahun</label>
                  <select style={{ ...c.input, maxWidth: 200, marginBottom: 0 }}
                    value={financeCustomYear || thisYearLocalStr()}
                    onChange={e => setFinanceCustomYear(e.target.value)}>
                    {availableYears.length > 0 ? availableYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    )) : <option value={thisYearLocalStr()}>{thisYearLocalStr()}</option>}
                  </select>
                </div>
              )}

              {/* Branch filter */}
              <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                <button style={{ ...c.btn(financeBranch === "ALL" ? "blue" : "ghost"), fontSize: 12, padding: "7px 14px" }} onClick={() => setFinanceBranch("ALL")}>Semua Cabang</button>
                {BRANCHES.map(b => (
                  <button key={b.id}
                    style={{ padding: "7px 14px", borderRadius: 10, border: financeBranch === b.id ? `2px solid ${b.color}` : "2px solid #E2E8F0", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'Sora', sans-serif", background: financeBranch === b.id ? b.color + "18" : "#fff", color: financeBranch === b.id ? b.color : "#64748B" }}
                    onClick={() => setFinanceBranch(b.id)}>{b.name}</button>
                ))}
              </div>

              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total Penjualan", value: formatRupiah(totalRevenue), icon: "💵", color: "#0EA5E9" },
                  { label: "Total Modal", value: formatRupiah(totalModal), icon: "📦", color: "#F97316" },
                  { label: "Total Profit", value: formatRupiah(totalProfit), icon: "💰", color: totalProfit >= 0 ? "#10B981" : "#EF4444" },
                  { label: "Unit Terjual", value: `${filterSold.length} unit`, icon: "🏷️", color: "#8B5CF6" },
                  { label: "Modal HP di Stok", value: formatRupiah(totalModalStok), icon: "🏪", color: "#F59E0B" },
                ].map(item => (
                  <div key={item.label} style={{ ...c.card(), padding: 14, borderTop: `3px solid ${item.color}` }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Per branch breakdown */}
              <div style={c.sectionTitle}>Performa Per Cabang</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
                {branchStats.map(b => (
                  <div key={b.id} style={{ ...c.card(), borderTop: `3px solid ${b.color}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: b.color }} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{b.name}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "#8B5CF6" }}>{b.items} unit</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "#94A3B8" }}>Penjualan</span>
                        <span style={{ fontWeight: 700, color: "#0EA5E9" }}>{formatRupiah(b.revenue)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "#94A3B8" }}>Modal</span>
                        <span style={{ fontWeight: 700, color: "#F97316" }}>{formatRupiah(b.modal)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderTop: "1px solid #F1F5F9", paddingTop: 8 }}>
                        <span style={{ fontWeight: 700 }}>Profit</span>
                        <span style={{ fontWeight: 800, color: b.profit >= 0 ? "#10B981" : "#EF4444" }}>{formatRupiah(b.profit)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sold items list */}
              {filterSold.length > 0 && (
                <>
                  <div style={c.sectionTitle}>Detail Penjualan</div>
                  <div style={c.card()}>
                    {filterSold.map((item, idx) => {
                      const profit = (item.sellPrice || 0) - (item.buyPrice || 0);
                      const branchName = BRANCHES.find(b => b.id === item.soldBranch)?.name || item.soldBranch;
                      return (
                        <div key={item.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: idx < filterSold.length - 1 ? "1px solid #F1F5F9" : "none", alignItems: "center" }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: "#F1F5F9", overflow: "hidden", flexShrink: 0 }}>
                            {item.photos?.[0] || item.photo
                              ? <img src={item.photos?.[0] || item.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📱</div>
                            }
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{item.brand} {item.model}</div>
                            <div style={{ fontSize: 11, color: "#94A3B8" }}>📍 {branchName} · {new Date(item.soldAt).toLocaleDateString("id-ID")}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>{formatRupiah(item.sellPrice)}</div>
                            <div style={{ fontSize: 11, color: profit >= 0 ? "#F59E0B" : "#EF4444", fontWeight: 600 }}>+{formatRupiah(profit)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {filterSold.length === 0 && (
                <div style={{ ...c.card(), textAlign: "center", padding: 50 }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>💰</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Belum ada penjualan</div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>Data akan muncul setelah ada HP/Tablet terjual</div>
                </div>
              )}
            </>
          );
        })()}
        {/* ===== KONTEN CMS ===== */}
        {activeTab === "konten" && currentUser?.role === "admin" && (() => {
          const banners = konten.filter(k => k.kategori === "banner").sort((a,b) => a.urutan - b.urutan);
          const brandItems = konten.filter(k => k.kategori === "brand");
          const cabangItems = konten.filter(k => k.kategori === "cabang");
          const infoItems = konten.filter(k => k.kategori === "info");
          const getInfo = (kunci) => infoItems.find(item => item.kunci === kunci)?.nilai || "";

          const uploadKonten = async (file, kategori, kunci, urutan) => {
            setKontenUploading(true);
            try {
              const url = await uploadToCloudinary(file);
              await api.post("/api/konten", { kategori, kunci, nilai: url, urutan: urutan || 0 });
              await loadAllData();
            } catch(e) { alert("Gagal upload: " + e.message); }
            setKontenUploading(false);
          };

          const simpanInfo = async (kunci, nilai) => {
            setSyncing(true);
            try {
              await api.post("/api/konten", { kategori: "info", kunci, nilai, urutan: 0 });
              await loadAllData();
              alert("Tersimpan!");
            } catch(e) { alert("Gagal: " + e.message); }
            setSyncing(false);
          };

          const hapusKonten = async (id) => {
            if (!window.confirm("Hapus item ini?")) return;
            setSyncing(true);
            try {
              await api.del("/api/konten", { id });
              await loadAllData();
            } catch(e) { alert("Gagal hapus: " + e.message); }
            setSyncing(false);
          };

          const CABANG_LIST = ["KP", "Jawi", "Kobar", "Jeruju"];
          const BRAND_LIST = ["Samsung", "Xiaomi", "Oppo", "Vivo", "Realme", "Apple", "Infinix", "Tecno", "Itel", "Advan"];

          return (
            <div>
              <div style={c.sectionTitle}>Manajemen Konten</div>
              <div style={{ fontSize: 13, color: "#64748B", marginBottom: 24 }}>Upload dan kelola konten visual landing page</div>

              <div style={{ ...c.card(), marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Info Toko</div>
                {[
                  { label: "Nama Toko", kunci: "info_nama", ph: "PontiCell" },
                  { label: "Tagline", kunci: "info_tagline", ph: "Toko HP & Tablet Terpercaya" },
                  { label: "Nomor WhatsApp", kunci: "info_wa", ph: "6283808484969" },
                ].map(f => (
                  <div key={f.kunci} style={{ marginBottom: 12 }}>
                    <label style={c.label}>{f.label}</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input style={{ ...c.input, marginBottom: 0, flex: 1 }} placeholder={f.ph} defaultValue={getInfo(f.kunci)} id={"konten_" + f.kunci} />
                      <button style={c.btn("primary")} onClick={() => { const v = document.getElementById("konten_" + f.kunci).value; if (v) simpanInfo(f.kunci, v); }}>Simpan</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...c.card(), marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Banner Hero (Slideshow)</div>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>Ukuran ideal 1920x600px. Bisa upload banyak banner.</div>
                {kontenUploading && <div style={{ fontSize: 12, color: "#F97316", marginBottom: 10 }}>Mengupload...</div>}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {banners.map((b, i) => (
                    <div key={b.id} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid #E2E8F0" }}>
                      <img src={b.nilai} alt={"banner"} style={{ width: "100%", height: 110, objectFit: "cover" }} />
                      <button onClick={() => hapusKonten(b.id)} style={{ position: "absolute", top: 6, right: 6, background: "rgba(239,68,68,0.9)", border: "none", borderRadius: 6, color: "#fff", fontSize: 11, padding: "3px 8px", cursor: "pointer" }}>Hapus</button>
                    </div>
                  ))}
                  <label style={{ borderRadius: 10, border: "2px dashed #E2E8F0", height: 110, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 4 }}>
                    <span style={{ fontSize: 28 }}>+</span>
                    <span style={{ fontSize: 11, color: "#64748B" }}>Tambah Banner</span>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) uploadKonten(f, "banner", "banner_" + Date.now(), banners.length); e.target.value = ""; }} />
                  </label>
                </div>
              </div>

              <div style={{ ...c.card(), marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Logo Brand</div>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>Tampil di section Brand Populer. PNG transparan lebih bagus.</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                  {BRAND_LIST.map(brand => {
                    const existing = brandItems.find(b => b.kunci === "brand_" + brand.toLowerCase());
                    return (
                      <div key={brand} style={{ border: "1px solid #E2E8F0", borderRadius: 10, padding: 12, textAlign: "center" }}>
                        {existing
                          ? <img src={existing.nilai} alt={brand} style={{ height: 36, objectFit: "contain", marginBottom: 6, display: "block", margin: "0 auto 6px" }} />
                          : <div style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 6 }}>🏷️</div>}
                        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{brand}</div>
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          <label style={{ ...c.btn("ghost"), fontSize: 10, padding: "4px 10px", cursor: "pointer", display: "inline-block" }}>
                            {existing ? "Ganti" : "Upload"}
                            <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) uploadKonten(f, "brand", "brand_" + brand.toLowerCase(), 0); e.target.value = ""; }} />
                          </label>
                          {existing && <button onClick={() => hapusKonten(existing.id)} style={{ background: "none", border: "none", color: "#EF4444", fontSize: 13, cursor: "pointer" }}>🗑️</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ ...c.card(), marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Foto Cabang</div>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>Foto tiap cabang untuk ditampilkan di landing page.</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {CABANG_LIST.map(cabang => {
                    const existing = cabangItems.find(item => item.kunci === "cabang_" + cabang.toLowerCase());
                    return (
                      <div key={cabang} style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                        {existing
                          ? <div style={{ position: "relative" }}>
                              <img src={existing.nilai} alt={cabang} style={{ width: "100%", height: 120, objectFit: "cover" }} />
                              <button onClick={() => hapusKonten(existing.id)} style={{ position: "absolute", top: 6, right: 6, background: "rgba(239,68,68,0.9)", border: "none", borderRadius: 6, color: "#fff", fontSize: 11, padding: "3px 8px", cursor: "pointer" }}>Hapus</button>
                            </div>
                          : <div style={{ height: 120, background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🏪</div>}
                        <div style={{ padding: "10px 12px" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Cabang {cabang}</div>
                          <label style={{ ...c.btn("ghost"), fontSize: 11, padding: "5px 12px", cursor: "pointer", display: "inline-block" }}>
                            {existing ? "Ganti Foto" : "Upload Foto"}
                            <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) uploadKonten(f, "cabang", "cabang_" + cabang.toLowerCase(), 0); e.target.value = ""; }} />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ===== TESTIMONI ===== */}
        {activeTab === "testimoni" && (
          <div>
            <div style={c.sectionTitle}>Testimoni Pelanggan</div>

            {/* Form upload - hanya untuk yang login */}
            {currentUser && (
              <div style={{ ...c.card(), marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 12 }}>📷 Upload Testimoni Baru</div>

                {/* Tombol pilih banyak foto */}
                <div
                  onClick={() => testiFileRef.current?.click()}
                  style={{ width: "100%", padding: "18px", background: "#F8FAFC", border: "2px dashed #E2E8F0", borderRadius: 12, marginBottom: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 6 }}
                >
                  <div style={{ fontSize: 28 }}>📷</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Tap untuk pilih foto</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>Bisa pilih banyak foto sekaligus</div>
                </div>
                <input ref={testiFileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleTestiFotoChange} />

                {/* Preview list foto yang dipilih */}
                {testiItems.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
                    {testiItems.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#F8FAFC", borderRadius: 12, padding: 10, border: "1px solid #E2E8F0" }}>
                        {/* Thumbnail */}
                        <div style={{ width: 70, height: 70, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#E2E8F0", position: "relative" }}>
                          <img src={item.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: item.uploading ? 0.4 : 1 }} />
                          {item.uploading && (
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <div style={{ width: 20, height: 20, border: "2px solid #E2E8F0", borderTop: "2px solid #C9A227", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                            </div>
                          )}
                          {item.error && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>❌</div>}
                          {item.url && !item.uploading && <div style={{ position: "absolute", bottom: 3, right: 3, fontSize: 12 }}>✅</div>}
                        </div>
                        {/* Keterangan + hapus */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                          <textarea
                            style={{ ...c.input, height: 60, resize: "none", marginBottom: 0, fontSize: 12 }}
                            placeholder="Keterangan foto (nama pembeli, produk, dll)..."
                            value={item.keterangan}
                            onChange={e => setTestiItems(prev => prev.map((it, i) => i === idx ? { ...it, keterangan: e.target.value } : it))}
                          />
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: 10, color: item.uploading ? "#F97316" : item.error ? "#EF4444" : item.url ? "#10B981" : "#94A3B8" }}>
                              {item.uploading ? "⏳ Uploading..." : item.error ? "❌ Gagal upload" : item.url ? "✅ Siap disimpan" : ""}
                            </div>
                            <button onClick={() => setTestiItems(prev => prev.filter((_, i) => i !== idx))}
                              style={{ background: "none", border: "none", color: "#EF4444", fontSize: 12, cursor: "pointer", padding: "2px 6px" }}>🗑️ Hapus</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {testiItems.length > 0 && (
                  <button
                    style={{ ...c.btn("primary"), width: "100%" }}
                    onClick={handleSimpanTestimoni}
                    disabled={syncing || testiItems.some(i => i.uploading)}
                  >
                    {testiItems.some(i => i.uploading)
                      ? `⏳ Mengupload ${testiItems.filter(i => i.uploading).length} foto...`
                      : `💾 Simpan ${testiItems.filter(i => i.url && i.keterangan.trim()).length} Testimoni`
                    }
                  </button>
                )}
              </div>
            )}

            {/* List testimoni */}
            {testimoni.length === 0 && (
              <div style={{ ...c.card(), textAlign: "center", padding: 50, color: "#CBD5E1" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>⭐</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#94A3B8" }}>Belum ada testimoni</div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {testimoni.map((t) => (
                <div key={t.id} style={{ ...c.card(), overflow: "hidden", padding: 0 }}>
                  {/* Foto */}
                  <div
                    style={{ width: "100%", height: 220, background: "#F1F5F9", overflow: "hidden", cursor: "zoom-in" }}
                    onClick={() => { setPhotoViewer({ photos: [t.foto], index: 0 }); setPhotoZoom(1); }}
                  >
                    <img src={t.foto} alt="testimoni" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>

                  {/* Keterangan */}
                  <div style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{t.keterangan}</div>
                      <div style={{ fontSize: 10, color: "#CBD5E1", marginTop: 6 }}>
                        {t.created_at ? new Date(t.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : ""}
                      </div>
                    </div>
                    {currentUser && (
                      <button
                        onClick={() => handleHapusTestimoni(t.id)}
                        style={{ background: "#FEE2E2", border: "none", borderRadius: 8, color: "#EF4444", fontSize: 13, padding: "4px 8px", cursor: "pointer", flexShrink: 0 }}
                      >🗑️</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



      </div>

      {/* ===== MODAL DETAIL PRODUK ===== */}
      {viewItem && (
        <div style={c.modal} onClick={() => setViewItem(null)}>
          <div style={{ ...c.modalBox, maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{viewItem.brand} {viewItem.model}</div>
              <button style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94A3B8" }} onClick={() => setViewItem(null)}>✕</button>
            </div>
            {(() => {
              const photos = (viewItem.photos && viewItem.photos.filter(Boolean).length > 0) ? viewItem.photos.filter(Boolean) : viewItem.photo ? [viewItem.photo] : [];
              return photos.length > 0 ? (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ width: "100%", height: 200, background: "#F1F5F9", borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <img src={photos[viewPhotoIndex]} alt={viewItem.model} style={{ width: "100%", height: "100%", objectFit: "contain", cursor: "zoom-in" }}
                      onClick={() => { setPhotoViewer({ photos, index: viewPhotoIndex }); setPhotoZoom(1); }} />
                    {photos.length > 1 && viewPhotoIndex > 0 && (
                      <button onClick={() => setViewPhotoIndex(i => i - 1)} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 16 }}>‹</button>
                    )}
                    {photos.length > 1 && viewPhotoIndex < photos.length - 1 && (
                      <button onClick={() => setViewPhotoIndex(i => i + 1)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 16 }}>›</button>
                    )}
                  </div>
                  {photos.length > 1 && (
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      {photos.map((p, i) => (
                        <div key={i} onClick={() => setViewPhotoIndex(i)} style={{ width: 50, height: 50, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: viewPhotoIndex === i ? "2px solid #C9A227" : "2px solid #E2E8F0" }}>
                          <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ width: "100%", height: 160, background: "#F1F5F9", borderRadius: 12, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ textAlign: "center", color: "#CBD5E1" }}><div style={{ fontSize: 36 }}>📷</div><div style={{ fontSize: 11, marginTop: 4 }}>Belum ada foto</div></div>
                </div>
              );
            })()}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[["RAM", viewItem.ram || "-"], ["Storage", viewItem.storage], ["Warna", viewItem.color], ["Kondisi", viewItem.condition], [currentUser ? "Harga Modal" : null, currentUser ? formatRupiah(viewItem.buyPrice) : null], ["Harga Jual", formatRupiah(viewItem.sellPrice)], ...(viewItem.imei && viewItem.imei !== "-" ? [["IMEI", viewItem.imei]] : [])].map(([label, val]) => (
                <div key={label} style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>
            {viewItem.notes && <div style={{ background: "#FFFBEB", border: "1px solid #FEF08A", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 12, color: "#92400E" }}>📝 {viewItem.notes}</div>}
            {currentUser && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 8 }}>STOK PER CABANG</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                  {BRANCHES.map((b) => {
                    const st = getStockStatus(viewItem.stocks?.[b.id] || 0);
                    return (
                      <div key={b.id} style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12 }}>{b.name}</span>
                        <span style={c.badge(st.color, st.bg, st.border)}>{viewItem.stocks?.[b.id] || 0}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {currentUser ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...c.btn("blue"), flex: 1 }} onClick={() => {
                  const photos = viewItem.photos?.length > 0 ? [...viewItem.photos, null, null].slice(0,3) : [viewItem.photo || null, null, null];
                  setModalData({ ...viewItem, photos, ram: viewItem.ram || '', imei: viewItem.imei || '' });
                  setShowModal("editProduct"); setViewItem(null);
                }}>✏️ Edit</button>
                <button style={{ ...c.btn("primary"), flex: 1 }} onClick={() => { setModalData({ itemId: viewItem.id }); setShowModal("updateStock"); setViewItem(null); }}>📦 Update Stok</button>
                <button style={c.btn("danger")} onClick={() => handleDeleteProduct(viewItem.id)}>🗑️</button>
              </div>
            ) : (null)}
          </div>
        </div>
      )}

      {/* ===== MODAL TAMBAH PRODUK ===== */}
      {showModal === "addProduct" && (
        <div style={c.modal} onClick={() => setShowModal(null)}>
          <div style={c.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>{productType === "tablet" ? "📟 Tambah Tablet Baru" : "📱 Tambah HP Baru"}</div>
            <div style={{ marginBottom: 12 }}>
              <label style={c.label}>Foto (maks. 3 foto)</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i}>
                    <div onClick={() => photoRefs[i].current.click()} style={{ height: 85, background: "#F8FAFC", border: "2px dashed #E2E8F0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", position: "relative" }}>
                      {modalData.photos?.[i]
                        ? <img src={modalData.photos[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ textAlign: "center", color: "#94A3B8" }}><div style={{ fontSize: 18 }}>📷</div><div style={{ fontSize: 10 }}>Foto {i+1}</div></div>
                      }
                      {modalData.photos?.[i] && (
                        <div onClick={(e) => { e.stopPropagation(); setModalData(prev => { const p = [...(prev.photos||[])]; p[i]=null; return {...prev, photos:p}; }); }} style={{ position: "absolute", top: 3, right: 3, background: "#EF4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, cursor: "pointer" }}>✕</div>
                      )}
                    </div>
                    <input ref={photoRefs[i]} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handlePhotoUpload(e, i)} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={c.label}>Brand *</label>
                <select style={c.input} value={modalData.brand || ""} onChange={(e) => setModalData({ ...modalData, brand: e.target.value })}>
                  <option value="">-- Pilih --</option>
                  {BRANDS.filter(b => b !== "Semua").map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div><label style={c.label}>Storage</label><input style={c.input} placeholder="256GB" value={modalData.storage || ""} onChange={(e) => setModalData({ ...modalData, storage: e.target.value })} /></div>
            </div>
            <label style={c.label}>Model *</label>
            <input style={c.input} placeholder={productType === "tablet" ? "Contoh: Galaxy Tab S9" : "Contoh: Galaxy S23 Ultra"} value={modalData.model || ""} onChange={(e) => setModalData({ ...modalData, model: e.target.value })} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={c.label}>RAM</label><input style={c.input} placeholder="8GB" value={modalData.ram || ""} onChange={(e) => setModalData({ ...modalData, ram: e.target.value })} /></div>
              <div><label style={c.label}>Warna</label><input style={c.input} placeholder="Phantom Black" value={modalData.color || ""} onChange={(e) => setModalData({ ...modalData, color: e.target.value })} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={c.label}>Kondisi</label>
                <select style={c.input} value={modalData.condition || "Second Wajar"} onChange={(e) => setModalData({ ...modalData, condition: e.target.value })}>
                  {CONDITIONS.map((co) => <option key={co}>{co}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={c.label}>Harga Modal (Rp)</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#94A3B8", fontWeight:600 }}>Rp</span>
                  <input style={{ ...c.input, paddingLeft:34 }} type="text" inputMode="numeric" placeholder="3.000.000"
                    value={modalData.buyPrice ? formatCurrencyInput(String(modalData.buyPrice)) : ""}
                    onChange={(e) => setModalData({ ...modalData, buyPrice: parseCurrencyInput(e.target.value) })} />
                </div>
              </div>
              <div>
                <label style={c.label}>Harga Jual (Rp)</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#94A3B8", fontWeight:600 }}>Rp</span>
                  <input style={{ ...c.input, paddingLeft:34 }} type="text" inputMode="numeric" placeholder="3.500.000"
                    value={modalData.sellPrice ? formatCurrencyInput(String(modalData.sellPrice)) : ""}
                    onChange={(e) => setModalData({ ...modalData, sellPrice: parseCurrencyInput(e.target.value) })} />
                </div>
              </div>
            </div>
            <label style={c.label}>Komisi</label>
            <input style={c.input} placeholder="Contoh: 5%" value={modalData.notes || ""} onChange={(e) => setModalData({ ...modalData, notes: e.target.value })} />
            <label style={c.label}>IMEI <span style={{ color: "#94A3B8", fontWeight: 400 }}>(opsional)</span></label>
            <input style={c.input} placeholder="Contoh: 358765012345678" value={modalData.imei || ""} onChange={(e) => setModalData({ ...modalData, imei: e.target.value })} maxLength={20} />
            <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <label style={{ ...c.label, color: "#0369A1", marginBottom: 10 }}>📍 Stok Masuk ke Cabang *</label>
              {currentUser?.role !== "admin" && currentUser?.branch ? (
                <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, padding:"10px 14px", marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:16 }}>🏪</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#166534" }}>{BRANCHES.find(b => b.id === currentUser.branch)?.name}</div>
                    <div style={{ fontSize:11, color:"#64748B" }}>Stok masuk ke cabang Anda</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  {BRANCHES.map((branch) => (
                    <div key={branch.id} onClick={() => setModalData({ ...modalData, initialBranch: branch.id })}
                      style={{ padding: "10px 8px", borderRadius: 10, cursor: "pointer", textAlign: "center", border: modalData.initialBranch === branch.id ? `2px solid ${branch.color}` : "2px solid #E2E8F0", background: modalData.initialBranch === branch.id ? branch.color + "15" : "#fff" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: modalData.initialBranch === branch.id ? branch.color : "#374151" }}>{branch.name}</div>
                    </div>
                  ))}
                </div>
              )}
              <label style={c.label}>Jumlah Unit *</label>
              <input style={{ ...c.input, marginBottom: 0 }} type="number" min="1" placeholder="Contoh: 1" value={modalData.initialQty || ""} onChange={(e) => setModalData({ ...modalData, initialQty: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...c.btn("primary"), flex: 1 }} onClick={handleAddProduct}>Simpan</button>
              <button style={{ ...c.btn("ghost"), flex: 1 }} onClick={() => setShowModal(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL EDIT PRODUK ===== */}
      {showModal === "editProduct" && (
        <div style={c.modal} onClick={() => setShowModal(null)}>
          <div style={c.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>✏️ Edit Produk</div>
            <div style={{ marginBottom: 12 }}>
              <label style={c.label}>Foto (maks. 3 foto)</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i}>
                    <div onClick={() => editPhotoRefs[i].current.click()} style={{ height: 85, background: "#F8FAFC", border: "2px dashed #E2E8F0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", position: "relative" }}>
                      {modalData.photos?.[i]
                        ? <img src={modalData.photos[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ textAlign: "center", color: "#94A3B8" }}><div style={{ fontSize: 18 }}>📷</div><div style={{ fontSize: 10 }}>Foto {i+1}</div></div>
                      }
                      {modalData.photos?.[i] && (
                        <div onClick={(e) => { e.stopPropagation(); setModalData(prev => { const p = [...(prev.photos||[])]; p[i]=null; return {...prev, photos:p}; }); }} style={{ position: "absolute", top: 3, right: 3, background: "#EF4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, cursor: "pointer" }}>✕</div>
                      )}
                    </div>
                    <input ref={editPhotoRefs[i]} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handlePhotoUpload(e, i)} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={c.label}>Brand *</label>
                <select style={c.input} value={modalData.brand || ""} onChange={(e) => setModalData({ ...modalData, brand: e.target.value })}>
                  <option value="">-- Pilih --</option>
                  {(modalData.type === "tablet" ? BRANDS_TABLET : BRANDS_HP).filter(b => b !== "Semua").map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div><label style={c.label}>Storage</label><input style={c.input} value={modalData.storage || ""} onChange={(e) => setModalData({ ...modalData, storage: e.target.value })} /></div>
            </div>
            <label style={c.label}>Model *</label>
            <input style={c.input} value={modalData.model || ""} onChange={(e) => setModalData({ ...modalData, model: e.target.value })} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={c.label}>RAM</label><input style={c.input} placeholder="8GB" value={modalData.ram || ""} onChange={(e) => setModalData({ ...modalData, ram: e.target.value })} /></div>
              <div><label style={c.label}>Warna</label><input style={c.input} value={modalData.color || ""} onChange={(e) => setModalData({ ...modalData, color: e.target.value })} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={c.label}>Kondisi</label>
                <select style={c.input} value={modalData.condition || "Second Wajar"} onChange={(e) => setModalData({ ...modalData, condition: e.target.value })}>
                  {CONDITIONS.map((co) => <option key={co}>{co}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={c.label}>Harga Modal (Rp)</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#94A3B8", fontWeight:600 }}>Rp</span>
                  <input style={{ ...c.input, paddingLeft:34 }} type="text" inputMode="numeric" placeholder="3.000.000"
                    value={modalData.buyPrice ? formatCurrencyInput(String(modalData.buyPrice)) : ""}
                    onChange={(e) => setModalData({ ...modalData, buyPrice: parseCurrencyInput(e.target.value) })} />
                </div>
              </div>
              <div>
                <label style={c.label}>Harga Jual (Rp)</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#94A3B8", fontWeight:600 }}>Rp</span>
                  <input style={{ ...c.input, paddingLeft:34 }} type="text" inputMode="numeric" placeholder="3.500.000"
                    value={modalData.sellPrice ? formatCurrencyInput(String(modalData.sellPrice)) : ""}
                    onChange={(e) => setModalData({ ...modalData, sellPrice: parseCurrencyInput(e.target.value) })} />
                </div>
              </div>
            </div>
            <label style={c.label}>Catatan Kondisi</label>
            <input style={c.input} value={modalData.notes || ""} onChange={(e) => setModalData({ ...modalData, notes: e.target.value })} />
            <label style={c.label}>IMEI <span style={{ color: "#94A3B8", fontWeight: 400 }}>(opsional)</span></label>
            <input style={c.input} placeholder="Contoh: 358765012345678" value={modalData.imei || ""} onChange={(e) => setModalData({ ...modalData, imei: e.target.value })} maxLength={20} />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...c.btn("blue"), flex: 1 }} onClick={handleEditProduct}>Simpan</button>
              <button style={{ ...c.btn("ghost"), flex: 1 }} onClick={() => setShowModal(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL UPDATE STOK ===== */}
      {showModal === "updateStock" && (
        <div style={c.modal} onClick={() => setShowModal(null)}>
          <div style={c.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>📦 Update Stok</div>

            <label style={c.label}>Pilih Produk</label>
            <select style={c.input} value={modalData.itemId || ""} onChange={(e) => setModalData({ ...modalData, itemId: parseInt(e.target.value) })}>
              <option value="">-- Pilih Produk --</option>
              {inventory.map((item) => <option key={item.id} value={item.id}>{item.type === "tablet" ? "📟" : "📱"} {item.brand} {item.model} ({item.ram && item.ram !== "-" ? item.ram+"/" : ""}{item.storage})</option>)}
            </select>

            <label style={c.label}>Jenis Transaksi</label>
            <select style={c.input} value={modalData.type || ""} onChange={(e) => setModalData({ ...modalData, type: e.target.value })}>
              <option value="">-- Pilih Jenis --</option>
              {ACTIVITY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>

            {/* Stok source branch - shown for all types */}
            <label style={c.label}>
              {(modalData.type === "Terjual" || modalData.type === "Terjual COD") ? "Ambil Stok dari Cabang" : modalData.type === "Transfer Antar Cabang" ? "Cabang Asal (Pengirim)" : "Cabang"}
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {(currentUser?.role !== "admin" && currentUser?.branch
                ? BRANCHES.filter(b => b.id === currentUser.branch)
                : BRANCHES
              ).map((b) => {
                const itemStok = modalData.itemId ? (inventory.find(i=>i.id===modalData.itemId)?.stocks?.[b.id] || 0) : 0;
                return (
                  <div key={b.id}
                    onClick={() => { if (itemStok > 0 || modalData.type === "Stok Masuk" || modalData.type === "Retur") setModalData({ ...modalData, branchId: b.id }); }}
                    style={{ padding: "10px 10px", borderRadius: 10, cursor: (itemStok > 0 || modalData.type === "Stok Masuk" || modalData.type === "Retur") ? "pointer" : "not-allowed", border: modalData.branchId === b.id ? `2px solid ${b.color}` : "2px solid #E2E8F0", background: modalData.branchId === b.id ? b.color+"15" : (itemStok === 0 && modalData.type === "Terjual") ? "#F8FAFC" : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: (itemStok === 0 && modalData.type === "Terjual") ? 0.45 : 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: modalData.branchId === b.id ? b.color : (itemStok === 0 && modalData.type === "Terjual") ? "#94A3B8" : "#374151" }}>{b.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: itemStok > 0 ? "#10B981" : "#94A3B8", background: itemStok > 0 ? "#ECFDF5" : "#F1F5F9", padding: "1px 7px", borderRadius: 10 }}>{itemStok} unit</span>
                  </div>
                );
              })}
            </div>

            {/* Peringatan stok habis */}
            {modalData.type === "Terjual" && (() => {
              const effectiveBranch = (currentUser?.role !== "admin" && currentUser?.branch) ? currentUser.branch : modalData.branchId;
              const selectedStock = (modalData.itemId && effectiveBranch)
                ? (inventory.find(i => i.id === modalData.itemId)?.stocks?.[effectiveBranch] || 0)
                : null;
              if (selectedStock === null) return null;
              if (selectedStock === 0) return (
                <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:12, padding:"12px 14px", marginBottom:12, textAlign:"center" }}>
                  <div style={{ fontSize:20, marginBottom:6 }}>📦</div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#DC2626" }}>Stok Habis!</div>
                  <div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>Tidak bisa melakukan transaksi — stok di cabang ini 0 unit</div>
                </div>
              );
              return null;
            })()}

            {/* For Terjual / Terjual COD - show where it was sold */}
            {modalData.type === "Terjual" && (() => {
              const effectiveBranch = (currentUser?.role !== "admin" && currentUser?.branch) ? currentUser.branch : modalData.branchId;
              const selectedStock = (modalData.itemId && effectiveBranch)
                ? (inventory.find(i => i.id === modalData.itemId)?.stocks?.[effectiveBranch] || 0)
                : 1;
              return selectedStock > 0;
            })() && (
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <label style={{ ...c.label, color: "#166534", marginBottom: 8 }}>📍 Terjual di Cabang Mana?</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {BRANCHES.map((b) => (
                    <div key={b.id} onClick={() => setModalData({ ...modalData, soldAtBranch: b.id, isCOD: false })}
                      style={{ padding: "8px 10px", borderRadius: 10, cursor: "pointer", textAlign: "center", border: modalData.soldAtBranch === b.id && !modalData.isCOD ? `2px solid ${b.color}` : "2px solid #E2E8F0", background: modalData.soldAtBranch === b.id && !modalData.isCOD ? b.color+"15" : "#fff" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: modalData.soldAtBranch === b.id && !modalData.isCOD ? b.color : "#374151" }}>{b.name}</span>
                    </div>
                  ))}
                  {/* COD option */}
                  <div onClick={() => setModalData({ ...modalData, isCOD: true, soldAtBranch: modalData.branchId })}
                    style={{ padding: "8px 10px", borderRadius: 10, cursor: "pointer", textAlign: "center", border: modalData.isCOD ? "2px solid #F97316" : "2px solid #E2E8F0", background: modalData.isCOD ? "#FFF7ED" : "#fff", gridColumn: "1 / -1" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: modalData.isCOD ? "#F97316" : "#374151" }}>🛵 COD (Diantar ke Customer)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Peringatan stok habis untuk Transfer */}
            {modalData.type === "Transfer Antar Cabang" && (() => {
              const effectiveBranch = (currentUser?.role !== "admin" && currentUser?.branch) ? currentUser.branch : modalData.branchId;
              const selectedStock = (modalData.itemId && effectiveBranch)
                ? (inventory.find(i => i.id === modalData.itemId)?.stocks?.[effectiveBranch] || 0)
                : null;
              if (selectedStock === null) return null;
              if (selectedStock === 0) return (
                <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:12, padding:"12px 14px", marginBottom:12, textAlign:"center" }}>
                  <div style={{ fontSize:20, marginBottom:6 }}>📦</div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#DC2626" }}>Stok Habis!</div>
                  <div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>Tidak bisa transfer — stok di cabang ini 0 unit</div>
                </div>
              );
              return null;
            })()}

            {/* Transfer target branch */}
            {modalData.type === "Transfer Antar Cabang" && (() => {
              const effectiveBranch = (currentUser?.role !== "admin" && currentUser?.branch) ? currentUser.branch : modalData.branchId;
              const selectedStock = (modalData.itemId && effectiveBranch)
                ? (inventory.find(i => i.id === modalData.itemId)?.stocks?.[effectiveBranch] || 0)
                : 1;
              return selectedStock > 0;
            })() && (
              <>
                <label style={c.label}>Cabang Tujuan (Penerima)</label>
                <select style={c.input} value={modalData.targetBranch || ""} onChange={(e) => setModalData({ ...modalData, targetBranch: e.target.value })}>
                  <option value="">-- Pilih Cabang Tujuan --</option>
                  {BRANCHES.filter(b => b.id !== modalData.branchId).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </>
            )}

            {(() => {
              // Cek stok untuk Terjual dan Transfer
              const needsStockCheck = modalData.type === "Terjual" || modalData.type === "Transfer Antar Cabang";
              if (!needsStockCheck) return true;
              const eb = (currentUser?.role !== "admin" && currentUser?.branch) ? currentUser.branch : modalData.branchId;
              if (!eb || !modalData.itemId) return true;
              return (inventory.find(i => i.id === modalData.itemId)?.stocks?.[eb] || 0) > 0;
            })() && (
              <>
                <label style={c.label}>Jumlah Unit</label>
                <input style={c.input} type="number" min="1" placeholder="Contoh: 1" value={modalData.qty || ""} onChange={(e) => setModalData({ ...modalData, qty: e.target.value })} />

                {modalData.type === "Terjual" && (
                  <>
                    <label style={c.label}>Harga Terjual (Rp)</label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#94A3B8", fontWeight:600 }}>Rp</span>
                      <input style={{ ...c.input, paddingLeft:34 }} type="text" inputMode="numeric" placeholder="1.500.000"
                        value={modalData.actualSellPrice ? formatCurrencyInput(String(modalData.actualSellPrice)) : ""}
                        onChange={(e) => setModalData({ ...modalData, actualSellPrice: parseCurrencyInput(e.target.value) })} />
                    </div>
                    {modalData.actualSellPrice && parseInt(modalData.actualSellPrice) > 0 && (() => {
                      const item = inventory.find(i => i.id === modalData.itemId);
                      const profit = parseInt(modalData.actualSellPrice) - (item?.buyPrice || 0);
                      return (
                        <div style={{ background: profit >= 0 ? "#ECFDF5" : "#FEE2E2", border: `1px solid ${profit >= 0 ? "#BBF7D0" : "#FECACA"}`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12 }}>
                          <span style={{ color: "#64748B" }}>Modal: <strong>{formatRupiah(item?.buyPrice||0)}</strong></span>
                          <span style={{ margin: "0 8px", color: "#CBD5E1" }}>·</span>
                          <span style={{ color: profit >= 0 ? "#10B981" : "#EF4444", fontWeight: 700 }}>
                            {profit >= 0 ? "Profit" : "Rugi"}: {formatRupiah(Math.abs(profit))}
                          </span>
                        </div>
                      );
                    })()}
                  </>
                )}

                <label style={c.label}>Catatan (opsional)</label>
                <input style={c.input} placeholder="Contoh: Terjual ke customer Bu Ani..." value={modalData.notes || ""} onChange={(e) => setModalData({ ...modalData, notes: e.target.value })} />
              </>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              {(() => {
                const needsStockCheck = modalData.type === "Terjual" || modalData.type === "Transfer Antar Cabang";
                if (!needsStockCheck) return true;
                const eb = (currentUser?.role !== "admin" && currentUser?.branch) ? currentUser.branch : modalData.branchId;
                if (!eb || !modalData.itemId) return true;
                return (inventory.find(i => i.id === modalData.itemId)?.stocks?.[eb] || 0) > 0;
              })() && (
                <button style={{ ...c.btn("primary"), flex: 1 }} onClick={handleUpdateStock}>Simpan</button>
              )}
              <button style={{ ...c.btn("ghost"), flex: 1 }} onClick={() => setShowModal(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}
      {/* ===== MODAL DETAIL TERJUAL ===== */}
      {viewSoldItem && (
        <div style={c.modal} onClick={() => setViewSoldItem(null)}>
          <div style={{ ...c.modalBox, maxWidth: 480 }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Detail Transaksi Terjual</div>
              <button style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94A3B8" }} onClick={() => setViewSoldItem(null)}>✕</button>
            </div>

            {/* Photo */}
            {(() => {
              const photos = (viewSoldItem.photos && viewSoldItem.photos.filter(Boolean).length > 0) ? viewSoldItem.photos.filter(Boolean) : viewSoldItem.photo ? [viewSoldItem.photo] : [];
              return photos.length > 0 ? (
                <div style={{ width: "100%", height: 180, background: "#F1F5F9", borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
                  <img src={photos[0]} alt={viewSoldItem.model} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ) : (
                <div style={{ width: "100%", height: 100, background: "#F1F5F9", borderRadius: 12, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 36, color: "#CBD5E1" }}>{viewSoldItem.type === "tablet" ? "📟" : "📱"}</div>
                </div>
              );
            })()}

            {/* Product name */}
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{viewSoldItem.brand} {viewSoldItem.model}</div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: viewSoldItem.imei && viewSoldItem.imei !== "-" ? 4 : 14 }}>
              {viewSoldItem.ram && viewSoldItem.ram !== "-" ? viewSoldItem.ram + " · " : ""}{viewSoldItem.storage} · {viewSoldItem.condition}
            </div>
            {viewSoldItem.imei && viewSoldItem.imei !== "-" && (
              <div style={{ fontSize: 11, background: "#F1F5F9", borderRadius: 8, padding: "5px 10px", marginBottom: 14, color: "#64748B", fontFamily: "monospace" }}>
                📱 IMEI: <strong style={{ color: "#1E293B" }}>{viewSoldItem.imei}</strong>
              </div>
            )}

            {/* Transaction info */}
            <div style={{ background: viewSoldItem.isCOD ? "#FFF7ED" : "#F0FDF4", border: `1px solid ${viewSoldItem.isCOD ? "#FED7AA" : "#BBF7D0"}`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: viewSoldItem.isCOD ? "#EA580C" : "#166534", marginBottom: 8 }}>
                {viewSoldItem.isCOD ? "🛵 Transaksi COD" : "🏪 Transaksi di Cabang"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: "#fff", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 2 }}>📦 Stok dari</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{BRANCHES.find(b=>b.id===viewSoldItem.stockBranch)?.name || BRANCHES.find(b=>b.id===viewSoldItem.soldBranch)?.name || "-"}</div>
                </div>
                <div style={{ background: "#fff", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 2 }}>{viewSoldItem.isCOD ? "🛵 Dikirim ke" : "📍 Terjual di"}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{BRANCHES.find(b=>b.id===viewSoldItem.soldBranch)?.name || "-"}</div>
                </div>
                <div style={{ background: "#fff", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 2 }}>📦 Jumlah</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{viewSoldItem.soldQty} unit</div>
                </div>
                <div style={{ background: "#fff", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 2 }}>🕒 Tanggal</div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{new Date(viewSoldItem.soldAt).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })}</div>
                </div>
              </div>
            </div>

            {/* Financial detail */}
            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 10 }}>DETAIL KEUANGAN</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#64748B" }}>Harga Modal</span>
                  <span style={{ fontWeight: 700, color: "#F97316" }}>{currentUser ? formatRupiah(viewSoldItem.buyPrice) : "••••••"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#64748B" }}>Harga Terjual</span>
                  <span style={{ fontWeight: 700, color: "#0EA5E9" }}>{formatRupiah(viewSoldItem.sellPrice)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, borderTop: "1px solid #E2E8F0", paddingTop: 8 }}>
                  <span style={{ fontWeight: 700 }}>Profit</span>
                  <span style={{ fontWeight: 800, color: viewSoldItem.profit >= 0 ? "#10B981" : "#EF4444" }}>{currentUser ? formatRupiah(viewSoldItem.profit) : "••••••"}</span>
                </div>
              </div>
            </div>

            {viewSoldItem.notes && (
              <div style={{ background: "#FFFBEB", border: "1px solid #FEF08A", borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 12, color: "#92400E" }}>📝 {viewSoldItem.notes}</div>
            )}

            {/* Restore button */}
            {currentUser ? (
              <button style={{ ...c.btn("ghost"), width: "100%", border: "2px solid #E2E8F0", marginBottom: 0 }}
                onClick={() => handleRestoreFromSold(viewSoldItem.id)}>↩ Kembalikan ke Stok Aktif (Batalkan Transaksi)</button>
            ) : (
              <div style={{ background: "#FFFBEB", border: "1px solid #FEF08A", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#92400E", textAlign: "center" }}>
                👁️ Login untuk mengelola transaksi ini
              </div>
            )}
          </div>
        </div>
      )}
      {/* ===== MODAL SET / UBAH PIN FINANCE ===== */}
      {showSetPinModal && (
        <div style={c.modal} onClick={() => setShowSetPinModal(false)}>
          <div style={{ background:"#fff", borderRadius:24, padding:28, width:"100%", maxWidth:320, boxShadow:"0 20px 60px rgba(0,0,0,0.15)", textAlign:"center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:40, marginBottom:10 }}>🔑</div>
            <div style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>
              {setPinStep === 1 ? (financePinHash ? "Ubah PIN Finance" : "Set PIN Finance") : "Konfirmasi PIN Baru"}
            </div>
            <div style={{ fontSize:12, color:"#94A3B8", marginBottom:20 }}>
              {setPinStep === 1 ? "Masukkan PIN baru (4 digit)" : "Ketik ulang PIN yang sama"}
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:16 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:14, height:14, borderRadius:"50%", background: setPinInput.length > i ? "#0EA5E9" : "#E2E8F0", transition:"all 0.2s" }} />
              ))}
            </div>
            {setPinError && <div style={{ fontSize:12, color:"#EF4444", marginBottom:10 }}>❌ {setPinError}</div>}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10, marginBottom:16 }}>
              {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((num, idx) => (
                <button key={idx}
                  style={{ padding:"16px 0", borderRadius:12, border:"1px solid #E2E8F0", background: num==="" ? "transparent" : "#F8FAFC", cursor: num==="" ? "default" : "pointer", fontSize:18, fontWeight:700, color:"#1E293B", fontFamily:"'Sora', sans-serif" }}
                  onClick={() => {
                    if (num === "") return;
                    if (num === "⌫") {
                      setSetPinInput(p => p.slice(0,-1));
                      setSetPinError("");
                    } else {
                      const newVal = setPinInput + num;
                      setSetPinInput(newVal);
                      setSetPinError("");
                      if (newVal.length === 4) {
                        if (setPinStep === 1) {
                          setSetPinFirst(newVal);
                          setSetPinInput("");
                          setSetPinStep(2);
                        } else {
                          if (newVal === setPinFirst) {
                            handleSavePin(newVal);
                          } else {
                            setSetPinError("PIN tidak cocok, ulangi dari awal");
                            setSetPinInput("");
                            setSetPinFirst("");
                            setSetPinStep(1);
                          }
                        }
                      }
                    }
                  }}>
                  {num}
                </button>
              ))}
            </div>
            <button style={{ ...c.btn("ghost"), width:"100%" }} onClick={() => setShowSetPinModal(false)}>Batal</button>
          </div>
        </div>
      )}

      {/* ===== PHOTO VIEWER ===== */}
      {photoViewer && (
        <div
          style={{ position:"fixed", inset:0, background:"#000", zIndex:10000, display:"flex", flexDirection:"column", touchAction:"none" }}
          onClick={() => { if (photoZoom <= 1) { setPhotoViewer(null); setPhotoZoom(1); } }}
          ref={el => {
            if (!el) return;
            let lastDist = null;
            let lastZoom = 1;
            el.addEventListener("touchstart", e => {
              if (e.touches.length === 2) {
                lastDist = Math.hypot(
                  e.touches[0].clientX - e.touches[1].clientX,
                  e.touches[0].clientY - e.touches[1].clientY
                );
                lastZoom = photoZoom;
              }
            }, { passive: true });
            el.addEventListener("touchmove", e => {
              if (e.touches.length === 2) {
                e.preventDefault();
                const dist = Math.hypot(
                  e.touches[0].clientX - e.touches[1].clientX,
                  e.touches[0].clientY - e.touches[1].clientY
                );
                if (lastDist) {
                  const newZoom = Math.min(Math.max(lastZoom * (dist / lastDist), 1), 5);
                  setPhotoZoom(newZoom);
                }
              }
            }, { passive: false });
            el.addEventListener("touchend", e => {
              if (e.touches.length < 2) lastDist = null;
            }, { passive: true });
          }}
        >
          {/* Close button */}
          <div style={{ position:"absolute", top:0, left:0, right:0, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", zIndex:2, background:"linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)" }}>
            <button onClick={() => { setPhotoViewer(null); setPhotoZoom(1); }}
              style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:20, padding:"6px 14px", fontSize:13, cursor:"pointer", backdropFilter:"blur(4px)", fontFamily:"inherit" }}>
              ✕ Tutup
            </button>
            {photoViewer.photos.length > 1 && (
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>
                {photoViewer.index + 1} / {photoViewer.photos.length}
              </div>
            )}
          </div>

          {/* Main image */}
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}
            onClick={e => e.stopPropagation()}>
            <img
              src={photoViewer.photos[photoViewer.index]}
              alt="zoom"
              style={{
                transform: `scale(${photoZoom})`,
                transformOrigin: "center center",
                transition: photoZoom === 1 ? "transform 0.2s" : "none",
                maxWidth: "100vw",
                maxHeight: "85vh",
                objectFit: "contain",
                userSelect: "none",
                WebkitUserSelect: "none",
                cursor: photoZoom > 1 ? "grab" : "default",
              }}
              onDoubleClick={() => setPhotoZoom(z => z > 1 ? 1 : 2.5)}
              draggable={false}
            />
          </div>

          {/* Thumbnails */}
          {photoViewer.photos.length > 1 && (
            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"12px 16px", display:"flex", justifyContent:"center", gap:8, background:"linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}
              onClick={e => e.stopPropagation()}>
              {photoViewer.photos.map((p, i) => (
                <div key={i} onClick={() => { setPhotoViewer(v => ({...v, index:i})); setPhotoZoom(1); }}
                  style={{ width:44, height:44, borderRadius:8, overflow:"hidden", cursor:"pointer", border: photoViewer.index===i ? "2px solid #C9A227" : "2px solid rgba(255,255,255,0.3)", flexShrink:0 }}>
                  <img src={p} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                </div>
              ))}
            </div>
          )}

          {/* Hint */}
          {photoZoom <= 1 && (
            <div style={{ position:"absolute", bottom: photoViewer.photos.length > 1 ? 72 : 16, left:0, right:0, textAlign:"center", color:"rgba(255,255,255,0.35)", fontSize:11, pointerEvents:"none" }}>
              Cubit 2 jari untuk zoom · Tap 2x untuk perbesar · Tap untuk tutup
            </div>
          )}
        </div>
      )}
    </div>
  );
}
