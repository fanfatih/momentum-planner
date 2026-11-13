import { REMOTE } from "./mode";
import { sb } from "./supabase";

export type InvPlanId = "standar" | "eksklusif";

export interface InvPlan {
  id: InvPlanId;
  name: string;
  price: number;
  /** Harga sebelum diskon, tampil dicoret. Kosong berarti tanpa coretan. */
  old_price: number | null;
  blurb: string;
  features: string[];
}

export interface InvPlansPublic {
  wa: string;
  plans: InvPlan[];
}

const DEMO_KEY = "momentum-invplans-demo-v1";
const DEMO_WA = "6285892928162";

/** Sama dengan data awal di migrasi 0011, dipakai di mode demo. */
export const INV_PLAN_DEFAULTS: InvPlan[] = [
  {
    id: "standar",
    name: "Standar",
    price: 99000,
    old_price: 129000,
    blurb: "Pilih satu tema standar, isi sendiri, dan bagikan lewat WhatsApp.",
    features: [
      "Satu link undangan dengan alamat sendiri",
      "Link personal per tamu, nama tamu tampil di undangan",
      "RSVP dan ucapan dari tamu",
      "Galeri foto dan musik latar",
      "Seksi bisa dinyalakan atau dimatikan: dresscode, siaran langsung, kisah cinta, alamat kado",
      "Peta lokasi dan amplop digital",
    ],
  },
  {
    id: "eksklusif",
    name: "Eksklusif",
    price: 149000,
    old_price: 299000,
    blurb: "Desain khusus dengan ilustrasi dan animasi lebih kaya. Jumlah pemakai tiap tema dibatasi.",
    features: ["Semua fitur paket Standar", "Desain dan animasi khusus", "Jumlah pemakai tiap tema dibatasi"],
  },
];

function demoRead(): InvPlan[] {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as InvPlan[];
      return INV_PLAN_DEFAULTS.map((d) => saved.find((p) => p.id === d.id) ?? d);
    }
  } catch {
    /* pakai isi awal */
  }
  return structuredClone(INV_PLAN_DEFAULTS);
}

export async function invPlansPublic(): Promise<InvPlansPublic> {
  if (REMOTE && sb) {
    const { data, error } = await sb.rpc("invitation_plans_public");
    if (!error && data) return data as InvPlansPublic;
    return { wa: "", plans: [] };
  }
  return { wa: DEMO_WA, plans: demoRead() };
}

export async function invPlansLoad(): Promise<InvPlan[]> {
  if (REMOTE && sb) {
    const { data } = await sb.from("invitation_plans").select("*");
    const rows = (data as InvPlan[] | null) ?? [];
    return INV_PLAN_DEFAULTS.map((d) => rows.find((r) => r.id === d.id) ?? d);
  }
  return demoRead();
}

export async function invPlanSave(p: InvPlan): Promise<string | null> {
  if (REMOTE && sb) {
    const { error } = await sb.from("invitation_plans").upsert(p);
    return error ? "Belum tersimpan. Coba lagi." : null;
  }
  try {
    const all = demoRead().map((x) => (x.id === p.id ? p : x));
    localStorage.setItem(DEMO_KEY, JSON.stringify(all));
    return null;
  } catch {
    return "Penyimpanan browser penuh atau diblokir.";
  }
}

/** Link WhatsApp untuk tombol Tertarik. Pesanan awal dikonfirmasi manual oleh admin. */
export function interestLink(wa: string, themeName: string | null, plan: InvPlan | undefined, extra = ""): string {
  const parts = [
    `Halo Momentum by Luna, aku tertarik pakai undangan digital${themeName ? ` tema ${themeName}` : ""}${plan ? ` (paket ${plan.name})` : ""}.`,
    extra,
  ].filter(Boolean);
  return wa ? `https://wa.me/${wa}?text=${encodeURIComponent(parts.join(" "))}` : "";
}
