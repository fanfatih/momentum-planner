import type { InvitationContent, InvitationEvent, Wedding } from "./types";
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
