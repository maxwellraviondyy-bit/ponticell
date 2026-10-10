// lib/apiAuth.js — helper untuk cek admin key di server-side API routes
// Cara pakai: const err = requireAdmin(req); if (err) return err;

import { NextResponse } from "next/server";

const ADMIN_KEY = process.env.ADMIN_API_KEY || "";

/**
 * Cek apakah request punya header x-admin-key yang benar.
 * Kalau tidak ada ADMIN_API_KEY di env, endpoint tetap terlindungi
 * (tidak ada key yang valid = semua ditolak).
 * Return: null kalau OK, NextResponse 401 kalau ditolak.
 */
export function requireAdmin(req) {
  if (!ADMIN_KEY) {
    // Env belum diset — tolak semua untuk keamanan
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }
  const key = req.headers.get("x-admin-key") || "";
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null; // OK
}
