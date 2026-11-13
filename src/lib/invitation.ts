import type { InvitationContent, InvitationEvent, SectionKey, StoryItem, Wedding } from "./types";
import { slugify } from "./format";

const emptyEvent = (): InvitationEvent => ({ date: "", time: "", place: "", address: "", mapsQuery: "" });

export function emptyInvitationContent(): InvitationContent {
  return {
    brideFull: "",
    groomFull: "",
    brideParents: "",
    groomParents: "",
    opening: "",
    closing: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
    akad: emptyEvent(),
    hasResepsi: true,
    resepsi: emptyEvent(),
    gifts: [],
    photos: [],
    musicUrl: "",
    musicTitle: "",
    sections: defaultSections(),
    dresscode: { note: "", colors: [] },
    livestream: { url: "", note: "" },
    story: [],
    kado: { name: "", phone: "", address: "" },
  };
}

/** Seksi lama tetap tampil seperti sebelumnya. Seksi baru mati sampai pasangan menyalakannya. */
export function defaultSections(): Record<SectionKey, boolean> {
  return { countdown: true, dresscode: false, livestream: false, story: false, galeri: true, amplop: true, kado: false, rsvp: true };
}

export const SECTION_INFO: { key: SectionKey; label: string; hint: string }[] = [
  { key: "countdown", label: "Hitung mundur", hint: "Berapa hari lagi menuju hari bahagia." },
  { key: "dresscode", label: "Dresscode", hint: "Warna pakaian yang dianjurkan untuk tamu." },
  { key: "livestream", label: "Siaran langsung", hint: "Link siaran untuk tamu yang tidak bisa hadir." },
  { key: "story", label: "Kisah cinta", hint: "Linimasa perjalanan kalian berdua." },
  { key: "galeri", label: "Galeri foto", hint: "Foto yang kamu unggah di bawah." },
  { key: "amplop", label: "Amplop digital", hint: "Nomor rekening atau e-wallet." },
  { key: "kado", label: "Alamat kado", hint: "Alamat untuk tamu yang ingin mengirim kado." },
  { key: "rsvp", label: "Konfirmasi dan ucapan", hint: "Form RSVP dan daftar ucapan tamu." },
];

export const MAX_STORY = 5;
export const MAX_COLORS = 5;
export const HEX = /^#[0-9a-fA-F]{6}$/;

export const MAX_PHOTOS = 6;

/** Isi lama yang belum punya kolom galeri atau musik tetap aman dipakai. */
export function normalizeContent(c: Partial<InvitationContent> | null | undefined): InvitationContent {
  const empty = emptyInvitationContent();
  const base = { ...empty, ...(c ?? {}) };
  const story: StoryItem[] = Array.isArray(base.story)
    ? base.story.filter((x) => x && typeof x.text === "string").map((x) => ({ when: String(x.when ?? ""), text: x.text })).slice(0, MAX_STORY)
    : [];
  return {
    ...base,
    photos: Array.isArray(base.photos) ? base.photos.filter((u) => typeof u === "string" && u).slice(0, MAX_PHOTOS) : [],
    sections: { ...empty.sections, ...(base.sections ?? {}) },
    dresscode: {
      note: String(base.dresscode?.note ?? ""),
      colors: Array.isArray(base.dresscode?.colors) ? base.dresscode.colors.filter((h) => typeof h === "string" && HEX.test(h)).slice(0, MAX_COLORS) : [],
    },
    livestream: { url: String(base.livestream?.url ?? ""), note: String(base.livestream?.note ?? "") },
    story,
    kado: { name: String(base.kado?.name ?? ""), phone: String(base.kado?.phone ?? ""), address: String(base.kado?.address ?? "") },
  };
}

/** Isi awal dari data proyek, supaya pasangan tidak mengetik ulang nama dan tanggal. */
export function contentFromWedding(w: Wedding): InvitationContent {
  const c = emptyInvitationContent();
  c.brideFull = w.brideName;
  c.groomFull = w.groomName;
  c.akad.date = w.akadDate ?? "";
  c.akad.address = w.city;
  c.resepsi.date = w.akadDate ?? "";
  c.resepsi.address = w.city;
  return c;
}

export function suggestSlug(w: Wedding): string {
  const s = slugify(`${w.brideName} ${w.groomName}`);
  return s.length >= 3 ? s : slugify(`undangan ${w.code}`);
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
