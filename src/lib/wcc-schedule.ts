/**
 * Aturan jadwal Momentum WCC. Semua jam dihitung dalam menit sejak 00.00 WIB.
 * Setiap booking menempati [mulai, selesai + jeda). Antar dua booking selalu ada jeda minimal 1 jam,
 * tetapi acara boleh berakhir tepat di jam tutup tanpa memikirkan jeda sesudahnya.
 */

export const OPEN_MIN = 6 * 60;
export const CLOSE_MIN = 23 * 60;
export const BUFFER_MIN = 60;
export const STEP_MIN = 30;

export interface Slot {
  /** Menit sejak 00.00. */
  start: number;
  end: number;
}

export type DayStatus = "kosong" | "sebagian" | "penuh";

export const toMin = (hhmm: string): number => {
  const m = /^(\d{1,2})[:.](\d{2})/.exec(hhmm.trim());
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
};

export const fmtMin = (min: number): string => `${String(Math.floor(min / 60)).padStart(2, "0")}.${String(min % 60).padStart(2, "0")}`;

export const fmtRange = (s: Slot) => `${fmtMin(s.start)}–${fmtMin(s.end)}`;

const overlaps = (a: Slot, b: Slot) => a.start < b.end + BUFFER_MIN && b.start < a.end + BUFFER_MIN;

/** Booking lain yang bentrok dengan rentang baru. "overlap": jamnya tumpang tindih. "jeda": jamnya tidak tumpang tindih tetapi kurang dari 1 jam. */
export function conflicts(existing: Slot[], next: Slot): { slot: Slot; kind: "overlap" | "jeda" }[] {
  return existing
    .filter((b) => overlaps(b, next))
    .map((b) => ({ slot: b, kind: b.start < next.end && next.start < b.end ? ("overlap" as const) : ("jeda" as const) }));
}

/** Jam mulai yang masih bisa dipesan untuk durasi tertentu, setiap 30 menit dalam jam operasional. */
export function availableStarts(existing: Slot[], durationMin: number): number[] {
  const out: number[] = [];
  for (let s = OPEN_MIN; s + durationMin <= CLOSE_MIN; s += STEP_MIN) {
    if (!conflicts(existing, { start: s, end: s + durationMin }).length) out.push(s);
  }
  return out;
}

/** Kosong: tidak ada booking. Penuh: tidak ada jam mulai yang muat untuk durasi ini. Selain itu sebagian. */
export function dayStatus(existing: Slot[], durationMin: number): DayStatus {
  if (!existing.length) return availableStarts(existing, durationMin).length ? "kosong" : "penuh";
  return availableStarts(existing, durationMin).length ? "sebagian" : "penuh";
}

/** Celah kosong terpanjang pada hari itu (menit), untuk teks bantu di kalender. */
export function longestGap(existing: Slot[]): number {
  let best = 0;
  let cursor = OPEN_MIN;
  const sorted = [...existing].sort((a, b) => a.start - b.start);
  for (const b of sorted) {
    best = Math.max(best, b.start - cursor);
    cursor = Math.max(cursor, b.end + BUFFER_MIN);
  }
  return Math.max(best, CLOSE_MIN - cursor);
}
