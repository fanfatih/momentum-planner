import { emptyInvitationContent } from "./invitation";
import type { InvitationContent } from "./types";

/** Isi contoh untuk katalog publik. Semua seksi menyala supaya calon pengguna melihat gambaran lengkap. */
export function sampleInvitation(): InvitationContent {
  const c = emptyInvitationContent();
  c.brideFull = "Aulia Rahma";
  c.groomFull = "Raka Pratama";
  c.brideParents = "Putri dari Bapak Hasan dan Ibu Nur";
  c.groomParents = "Putra dari Bapak Darmawan dan Ibu Sari";
  c.opening = "Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di hari bahagia kami.";
  const year = new Date().getUTCFullYear() + 1;
  c.akad = { date: `${year}-04-17`, time: "08.00 WIB", place: "Masjid Raya Contoh", address: "Jl. Contoh No. 1, Kota Bogor", mapsQuery: "" };
  c.hasResepsi = true;
  c.resepsi = { date: `${year}-04-17`, time: "11.00 WIB", place: "Gedung Serbaguna Contoh", address: "Jl. Contoh No. 2, Kota Bogor", mapsQuery: "" };
  c.gifts = [{ bank: "BCA", number: "1234567890", holder: "Aulia Rahma" }];
  c.dresscode = { note: "Kami menganjurkan tamu mengenakan warna-warna berikut.", colors: ["#7d9c65", "#f1e4e1", "#b93636"] };
  c.livestream = { url: "https://www.youtube.com/", note: "" };
  c.story = [
    { when: "2021", text: "Kami berkenalan lewat teman kuliah dan mulai sering bertukar cerita." },
    { when: "2024", text: "Setelah dua keluarga bertemu, kami memutuskan untuk melangkah serius." },
    { when: "Hari ini", text: "Dengan restu keluarga, kami siap memulai hidup baru." },
  ];
  c.kado = { name: "Aulia Rahma", phone: "0812-0000-0000", address: "Jl. Contoh No. 3, Kota Bogor" };
  c.sections = { countdown: true, dresscode: true, livestream: true, story: true, galeri: true, amplop: true, kado: true, rsvp: true };
  return c;
}
