"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createSupabaseClient(url, key);
}

export function getAppUrl(path = "/") {
  if (typeof window === "undefined") return path;

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${window.location.origin}${basePath}${normalizedPath}`;
}
