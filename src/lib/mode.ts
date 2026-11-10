/**
 * Mode data. Kalau URL dan anon key Supabase terisi saat build, aplikasi memakai database dan login Google.
 * Kalau kosong, aplikasi berjalan sebagai demo dengan data di localStorage.
 * Nilai NEXT_PUBLIC_* harus ditulis persis seperti ini supaya Next.js menyisipkannya ke bundel browser.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const REMOTE = SUPABASE_URL !== "" && SUPABASE_KEY !== "";
