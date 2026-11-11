import { REMOTE } from "./mode";
import { sb } from "./supabase";

export interface WccPackage {
  id: string;
  name: string;
  hours: number;
  price: number;
  features: string[];
  highlight: boolean;
  active: boolean;
  sort: number;
}

export interface WccAddon {
  id: string;
  name: string;
  price: number;
  unit: "sekali" | "per_jam";
  note: string;
  active: boolean;
  sort: number;
}

export interface WccBooking {
  id: string;
  date: string;
  /** "HH:MM" atau "HH:MM:SS" dari database. */
  start_time: string;
  end_time: string;
  label: string;
  source: "wa" | "web" | "lain";
  status: "pasti" | "tentatif";
}

export interface WccPortfolioItem {
  id: string;
  title: string;
  thumb_url: string;
  link_url: string;
  sort: number;
}

export interface WccMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo_url: string;
  sort: number;
}

export interface WccSettings {
  tagline: string;
  ig_url: string;
  free_enabled: boolean;
  free_text: string;
  free_rules: string[];
  promo_enabled: boolean;
  promo_text: string;
  terms: string[];
  faq: { q: string; a: string }[];
}

export interface WccBusy {
  date: string;
  start_time: string;
  end_time: string;
}

export interface WccPublic {
  wa: string;
  settings: WccSettings;
  packages: WccPackage[];
  addons: WccAddon[];
  portfolio: WccPortfolioItem[];
  team: WccMember[];
}

export interface WccAdminData {
  settings: WccSettings;
  packages: WccPackage[];
  addons: WccAddon[];
  bookings: WccBooking[];
  portfolio: WccPortfolioItem[];
  team: WccMember[];
}

export type WccKey = "packages" | "addons" | "bookings" | "portfolio" | "team";

const TABLE: Record<WccKey, string> = {
  packages: "wcc_packages",
  addons: "wcc_addons",
  bookings: "wcc_bookings",
  portfolio: "wcc_portfolio",
  team: "wcc_team",
};

const DEMO_KEY = "momentum-wcc-demo-v1";
const DEMO_WA = "6285892928162";

const pkg = (n: number, name: string, hours: number, price: number, features: string[], highlight = false): WccPackage => ({
  id: `demo-pkg-${n}`,
  name,
  hours,
  price,
  features,
  highlight,
  active: true,
  sort: n,
});
const addon = (n: number, name: string, price: number, unit: WccAddon["unit"], note = ""): WccAddon => ({ id: `demo-add-${n}`, name, price, unit, note, active: true, sort: n });

/** Isi awal. Sama dengan data awal di migrasi 0008, dipakai di mode demo. */
export const WCC_DEFAULTS: WccAdminData = {
  settings: {
    tagline: "Momen kecil, jadi cerita yang timeless.",
    ig_url: "https://www.instagram.com/momentumbyluna/",
    free_enabled: true,
    free_text: "Setiap bulan, satu pasangan mendapat Paket Intimate gratis.",
    free_rules: [
      "Ikuti Instagram @momentumbyluna",
      "Tag calon pasanganmu di postingan giveaway",
      "Bagikan postingan giveaway ke story",
      "Tanggal acara maksimal 6 bulan ke depan, di area Kota Bogor",
      "Pemenang diundi live di Instagram tiap akhir bulan",
    ],
    promo_enabled: false,
    promo_text: "Promo launching: Paket Intimate 199K untuk 5 klien pertama. Hasilnya boleh kami posting di Instagram Momentum.",
    terms: [
      "DP 30% untuk mengunci tanggal, pelunasan maksimal H-1",
      "Transport gratis di Kota Bogor. Kab. Bogor atau Depok +50K, Jakarta, Bekasi, atau Tangerang +100K, lebih jauh sesuai jarak",
      "Semua paket memakai mic dan lighting",
      "File dikirim lewat Google Drive, hasil maksimal H+3",
      "Klien Mahesa Weddings mendapat diskon 10% atau gratis 1 add-on",
    ],
    faq: [
      { q: "Bagaimana cara booking?", a: "Pilih paket, tanggal, dan jam di halaman ini, lalu kirim lewat WhatsApp. Tanggal baru terkunci setelah DP 30% diterima." },
      { q: "Kapan hasilnya jadi?", a: "Maksimal H+3 setelah acara. Ingin lebih cepat? Ada add-on express edit H+1 dan same-day edit." },
      { q: "Apakah ada biaya transport?", a: "Kota Bogor gratis. Di luar itu ada tambahan sesuai zona, tertera di syarat booking." },
      { q: "Bagaimana jika acara lebih lama dari paket?", a: "Tambah jam lewat add-on, atau pilih paket dengan durasi lebih panjang." },
    ],
  },
  packages: [
    pkg(1, "Intimate", 3, 250000, ["5 IG story real-time", "1 highlight reel 30–60 detik", "2 video TikTok/Reels trend", "Unlimited shoot"]),
    pkg(2, "Signature", 5, 350000, ["10 IG story real-time", "2 highlight reel", "3 video trend", "1 video behind the scene 15–30 detik", "Unlimited shoot"], true),
    pkg(3, "Timeless", 8, 500000, ["15 IG story real-time", "3 highlight reel", "5 video trend", "1 video behind the scene", "1 cinematic recap 60–90 detik", "Akad dan resepsi boleh beda jam", "Unlimited shoot"]),
  ],
  addons: [
    addon(1, "Same-day edit", 100000, "sekali", "Video diputar di resepsi"),
    addon(2, "Express edit H+1", 50000, "sekali", "Hasil jadi sehari setelah acara"),
    addon(3, "Tambah video trend", 35000, "sekali", "Per video"),
    addon(4, "Tambah highlight reel", 50000, "sekali", "Per video"),
    addon(5, "Tambah jam", 40000, "per_jam", "Menambah durasi acara"),
    addon(6, "Kru tambahan", 100000, "sekali"),
    addon(7, "Raw footage", 30000, "sekali", "Dikirim lewat Google Drive"),
    addon(8, "Akad dan resepsi beda hari", 75000, "sekali"),
  ],
  bookings: [],
  portfolio: [],
  team: [],
};

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`);

function demoRead(): WccAdminData {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) return { ...WCC_DEFAULTS, ...(JSON.parse(raw) as Partial<WccAdminData>) };
  } catch {
    /* pakai isi awal */
  }
  return structuredClone(WCC_DEFAULTS);
}

function demoWrite(d: WccAdminData) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(d));
  } catch {
    /* penyimpanan penuh atau diblokir */
  }
}

const sortBy = <T extends { sort: number }>(rows: T[]) => [...rows].sort((a, b) => a.sort - b.sort);

/** Isi halaman publik. Hanya data yang memang boleh dilihat pengunjung. */
export async function wccPublic(): Promise<WccPublic> {
  if (REMOTE && sb) {
    const { data, error } = await sb.rpc("wcc_public");
    if (!error && data) return data as WccPublic;
    return { wa: "", settings: WCC_DEFAULTS.settings, packages: [], addons: [], portfolio: [], team: [] };
  }
  const d = demoRead();
  return {
    wa: DEMO_WA,
    settings: d.settings,
    packages: sortBy(d.packages.filter((p) => p.active)),
    addons: sortBy(d.addons.filter((a) => a.active)),
    portfolio: sortBy(d.portfolio),
    team: sortBy(d.team),
  };
}

/** Jam yang sudah terpakai, tanpa nama atau catatan klien. */
export async function wccBusy(from: string, to: string): Promise<WccBusy[]> {
  if (REMOTE && sb) {
    const { data } = await sb.rpc("wcc_busy", { p_from: from, p_to: to });
    return (data as WccBusy[] | null) ?? [];
  }
  return demoRead()
    .bookings.filter((b) => b.date >= from && b.date <= to)
    .map((b) => ({ date: b.date, start_time: b.start_time, end_time: b.end_time }));
}

export async function wccLoadAll(): Promise<WccAdminData> {
  if (REMOTE && sb) {
    const [settings, packages, addons, bookings, portfolio, team] = await Promise.all([
      sb.from("wcc_settings").select("*").eq("id", 1).maybeSingle(),
      sb.from(TABLE.packages).select("*").order("sort"),
      sb.from(TABLE.addons).select("*").order("sort"),
      sb.from(TABLE.bookings).select("*").order("date").order("start_time"),
      sb.from(TABLE.portfolio).select("*").order("sort"),
      sb.from(TABLE.team).select("*").order("sort"),
    ]);
    const { id: _id, ...rest } = (settings.data ?? { id: 1, ...WCC_DEFAULTS.settings }) as WccSettings & { id: number };
    void _id;
    return {
      settings: rest,
      packages: (packages.data ?? []) as WccPackage[],
      addons: (addons.data ?? []) as WccAddon[],
      bookings: (bookings.data ?? []) as WccBooking[],
      portfolio: (portfolio.data ?? []) as WccPortfolioItem[],
      team: (team.data ?? []) as WccMember[],
    };
  }
  return demoRead();
}

type RowOf<K extends WccKey> = K extends "packages" ? WccPackage : K extends "addons" ? WccAddon : K extends "bookings" ? WccBooking : K extends "portfolio" ? WccPortfolioItem : WccMember;

/** Simpan satu baris. id kosong berarti baris baru. Mengembalikan pesan galat, atau null bila berhasil. */
export async function wccSave<K extends WccKey>(key: K, row: Omit<RowOf<K>, "id"> & { id?: string }): Promise<string | null> {
  if (REMOTE && sb) {
    const payload = row.id ? row : (({ id: _drop, ...rest }) => (void _drop, rest))(row);
    const { error } = row.id ? await sb.from(TABLE[key]).upsert(payload) : await sb.from(TABLE[key]).insert(payload);
    return error ? "Belum tersimpan. Cek koneksi atau akses akunmu, lalu coba lagi." : null;
  }
  const d = demoRead();
  const list = d[key] as { id: string }[];
  const next = { ...row, id: row.id ?? newId() };
  const i = list.findIndex((r) => r.id === next.id);
  if (i >= 0) list[i] = next;
  else list.push(next);
  demoWrite(d);
  return null;
}

export async function wccRemove(key: WccKey, id: string): Promise<string | null> {
  if (REMOTE && sb) {
    const { error } = await sb.from(TABLE[key]).delete().eq("id", id);
    return error ? "Belum terhapus. Coba lagi." : null;
  }
  const d = demoRead();
  (d[key] as { id: string }[]) = (d[key] as { id: string }[]).filter((r) => r.id !== id);
  demoWrite(d);
  return null;
}

export async function wccSaveSettings(s: WccSettings): Promise<string | null> {
  if (REMOTE && sb) {
    const { error } = await sb.from("wcc_settings").upsert({ id: 1, ...s });
    return error ? "Belum tersimpan. Cek koneksi atau akses akunmu, lalu coba lagi." : null;
  }
  const d = demoRead();
  d.settings = s;
  demoWrite(d);
  return null;
}
