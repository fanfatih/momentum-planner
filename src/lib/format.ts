import { REMOTE } from "./mode";
const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export const formatRp = (n: number) => rupiah.format(n);

export function parseMoney(input: string): number {
  const digits = input.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function parseIso(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}

export function formatDate(iso: string | null, fallback = "Belum diisi"): string {
  if (!iso) return fallback;
  const [y, m, d] = parseIso(iso);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatShortDate(iso: string | null): string {
  if (!iso) return "-";
  const [y, m, d] = parseIso(iso);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function daysUntil(iso: string | null, now: Date = new Date()): number | null {
  if (!iso) return null;
  const [y, m, d] = parseIso(iso);
  const target = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86_400_000);
}

/** Ubah 08xx atau +62xx menjadi 62xx untuk tautan wa.me. */
export function toWaNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export function waLink(number: string, text: string): string {
  return `https://wa.me/${toWaNumber(number)}?text=${encodeURIComponent(text)}`;
}

export function mapsLink(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function isDummyWa(number: string): boolean {
  return toWaNumber(number).startsWith("62800000");
}

export function displayWa(number: string): string {
  const n = toWaNumber(number);
  if (!n) return "-";
  return `0${n.slice(2)}`;
}

export function coupleLabel(bride: string, groom: string): string {
  const names = [bride.trim(), groom.trim()].filter(Boolean);
  return names.length ? names.join(" & ") : "Pasangan baru";
}

export function uid(prefix: string): string {
  // Mode database memakai UUID penuh karena kolom id di Postgres bertipe uuid.
  if (REMOTE && typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

export function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `MOM-${out}`;
}

export function priceRange(min: number | null, max: number | null): string {
  if (min && max) return `${formatRp(min)} sampai ${formatRp(max)}`;
  if (min) return `Mulai ${formatRp(min)}`;
  if (max) return `Hingga ${formatRp(max)}`;
  return "Harga belum diisi";
}

/** Ubah nama jadi alamat url: huruf kecil, angka, dan tanda hubung. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}
