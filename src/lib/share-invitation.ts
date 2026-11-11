import { coupleLabel, waLink } from "./format";
import type { Guest, Invitation, Wedding } from "./types";

/** Link personal: nama tamu ikut di alamat, jadi undangan menyapa "Kepada Yth." sesuai nama itu. */
export function guestLink(origin: string, slug: string, guestName: string): string {
  return `${origin}/u/${slug}?to=${encodeURIComponent(guestName.trim())}`;
}

export function defaultInviteMessage(wedding: Wedding, guest: Guest, link: string): string {
  return [
    `Halo ${guest.name},`,
    "",
    `Kami ${coupleLabel(wedding.brideName, wedding.groomName)} mengundang Anda ke pernikahan kami. Detail acara dan konfirmasi kehadiran ada di undangan digital berikut:`,
    link,
    "",
    "Merupakan kebahagiaan bagi kami bila Anda berkenan hadir. Terima kasih.",
  ].join("\n");
}

/** Tanpa nomor, WhatsApp membuka pilihan kontak, jadi tamu tanpa nomor tetap bisa dikirimi. */
export function inviteWaUrl(guest: Guest, text: string): string {
  return waLink(guest.wa, text);
}

export function canSendInvitation(wedding: Wedding, invitation: Invitation | undefined): invitation is Invitation {
  return wedding.plan === "premium" && !!invitation?.published;
}
