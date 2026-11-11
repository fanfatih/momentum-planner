import type {
  AdminAccount,
  AppState,
  BudgetItem,
  BudgetPayment,
  ChecklistTemplate,
  Guest,
  PromoCard,
  Settings,
  Track,
  Vendor,
  Venue,
  Wedding,
  WeddingVendor,
} from "./types";

export const VENDOR_CATEGORIES = [
  "Catering",
  "Dokumentasi",
  "MUA",
  "Dekorasi",
  "Busana",
  "Hiburan",
  "Lainnya",
] as const;

export const BUDGET_SUGGESTIONS = [
  "Venue",
  "Catering",
  "Dokumentasi",
  "MUA",
  "Dekorasi",
  "Busana",
  "Undangan",
  "Seserahan dan mahar",
  "Lain-lain",
];

export const TRACK_NOTES: Record<Track, string> = {
  muslim:
    "Mengacu pada PMA Nomor 30 Tahun 2024 tentang Pencatatan Pernikahan. Syarat bisa berbeda per KUA, jadi konfirmasi ke KUA tempat akad sebelum mendaftar.",
  nonmuslim:
    "Mengacu pada persyaratan Disdukcapil yang dirangkum media (Sleman dan Pontianak), belum diverifikasi untuk Bogor. Konfirmasi ke Disdukcapil domisili sebelum menyiapkan berkas.",
};

export const TRACK_LABEL: Record<Track, string> = {
  muslim: "Muslim, lewat KUA",
  nonmuslim: "Non-Muslim, lewat Catatan Sipil",
};

type T = ChecklistTemplate;
const adm = (
  id: string,
  track: Track,
  group: string,
  order: number,
  title: string,
  hint?: string,
): T => ({ id, kind: "administrasi", track, group, order, title, hint });
const evt = (
  id: string,
  group: string,
  order: number,
  title: string,
  hint?: string,
  promo?: T["promo"],
): T => ({ id, kind: "acara", track: "semua", group, order, title, hint, promo });

export const DEFAULT_TEMPLATES: ChecklistTemplate[] = [
  adm("k-01", "muslim", "Dokumen dasar", 10, "Surat pengantar nikah dari desa atau kelurahan tempat tinggal"),
  adm("k-02", "muslim", "Dokumen dasar", 11, "Fotokopi akta kelahiran"),
  adm("k-03", "muslim", "Dokumen dasar", 12, "Fotokopi KTP"),
  adm("k-04", "muslim", "Dokumen dasar", 13, "Fotokopi Kartu Keluarga"),
  adm("k-05", "muslim", "Dokumen dasar", 14, "Pas foto sesuai ketentuan", "Ukuran dan jumlah dicek ke KUA."),
  adm("k-06", "muslim", "Dokumen dasar", 15, "Surat keterangan sehat dari fasilitas pelayanan kesehatan"),
  adm("k-07", "muslim", "Dokumen dasar", 16, "Persetujuan calon pengantin"),
  adm("k-08", "muslim", "Kondisi khusus", 20, "Menikah di luar kecamatan tempat tinggal: surat rekomendasi nikah dari KUA setempat"),
  adm("k-09", "muslim", "Kondisi khusus", 21, "Usia di bawah 21 tahun: izin tertulis orang tua atau wali"),
  adm("k-10", "muslim", "Kondisi khusus", 22, "Belum 19 tahun saat akad: dispensasi kawin dari pengadilan"),
  adm("k-11", "muslim", "Kondisi khusus", 23, "Anggota TNI atau Polri: surat izin atasan atau kesatuan"),
  adm("k-12", "muslim", "Kondisi khusus", 24, "Duda atau janda cerai: akta cerai"),
  adm("k-13", "muslim", "Kondisi khusus", 25, "Duda atau janda ditinggal meninggal: akta kematian"),
  adm("k-14", "muslim", "Pendaftaran", 30, "Daftar kehendak nikah, langsung ke KUA atau online lewat SIMKAH"),
  adm("k-15", "muslim", "Pendaftaran", 31, "Lengkapi data dan dokumen sesuai arahan petugas KUA"),
  adm("k-16", "muslim", "Pendaftaran", 32, "Ikut bimbingan perkawinan (Binwin)"),
  adm("k-17", "muslim", "Biaya dan waktu", 40, "Pastikan lokasi akad", "Akad di kantor KUA pada hari dan jam kerja gratis. Di luar kantor atau di luar jam kerja dikenai Rp600 ribu (PNBP)."),
  adm("k-18", "muslim", "Biaya dan waktu", 41, "Tanyakan batas waktu pendaftaran sebelum akad ke KUA setempat"),

  adm("s-01", "nonmuslim", "Dokumen", 10, "Surat keterangan perkawinan dari pemuka agama atau pendeta", "Untuk penghayat kepercayaan: surat perkawinan dari pemuka penghayat."),
  adm("s-02", "nonmuslim", "Dokumen", 11, "Formulir pencatatan perkawinan"),
  adm("s-03", "nonmuslim", "Dokumen", 12, "Fotokopi akta kelahiran suami dan istri (dilegalisir)"),
  adm("s-04", "nonmuslim", "Dokumen", 13, "Fotokopi KK dan KTP-el suami dan istri"),
  adm("s-05", "nonmuslim", "Dokumen", 14, "Pas foto berdampingan 4x6, 4 lembar"),
  adm("s-06", "nonmuslim", "Dokumen", 15, "Fotokopi KTP-el dua orang saksi"),
  adm("s-07", "nonmuslim", "Pendaftaran", 30, "Konfirmasi syarat terbaru ke Disdukcapil domisili"),
  adm("s-08", "nonmuslim", "Pendaftaran", 31, "Serahkan berkas ke Disdukcapil dan tanda tangan register"),
  adm("s-09", "nonmuslim", "Pendaftaran", 32, "Ambil kutipan akta perkawinan", "Sumber yang dirujuk menyebut layanan sekitar lima hari setelah tanda tangan register."),

  evt("a-01", "9 sampai 12 bulan sebelum", 10, "Tentukan tanggal akad dan resepsi bersama dua keluarga"),
  evt("a-02", "9 sampai 12 bulan sebelum", 11, "Tentukan garis besar budget"),
  evt("a-03", "9 sampai 12 bulan sebelum", 12, "Perkirakan jumlah tamu"),
  evt("a-04", "9 sampai 12 bulan sebelum", 13, "Survei dan booking venue", "Lihat tab Vendor lalu pilih Venue untuk direktori."),
  evt("a-05", "6 sampai 8 bulan sebelum", 20, "Pilih WO atau vendor besar", "Catering, dokumentasi, dan MUA biasanya perlu dikunci paling awal.", "ceklis-wo"),
  evt("a-06", "6 sampai 8 bulan sebelum", 21, "Pilih tim dokumentasi foto dan video", undefined, "ceklis-dokumentasi"),
  evt("a-07", "6 sampai 8 bulan sebelum", 22, "Pilih busana pengantin"),
  evt("a-08", "3 sampai 5 bulan sebelum", 30, "Finalisasi daftar tamu"),
  evt("a-09", "3 sampai 5 bulan sebelum", 31, "Siapkan seserahan dan mahar"),
  evt("a-10", "3 sampai 5 bulan sebelum", 32, "Desain undangan"),
  evt("a-11", "3 sampai 5 bulan sebelum", 33, "Tasting menu catering"),
  evt("a-12", "1 sampai 2 bulan sebelum", 40, "Sebar undangan"),
  evt("a-13", "1 sampai 2 bulan sebelum", 41, "Fitting busana"),
  evt("a-14", "1 sampai 2 bulan sebelum", 42, "Konfirmasi semua vendor"),
  evt("a-15", "1 sampai 2 bulan sebelum", 43, "Susun rundown acara"),
  evt("a-16", "H-7 sampai H-1", 50, "Gladi atau geladi bersih"),
  evt("a-17", "H-7 sampai H-1", 51, "Cek perlengkapan hari H"),
  evt("a-18", "H-7 sampai H-1", 52, "Siapkan amplop dan jadwal pembayaran vendor"),
  evt("a-19", "Setelah acara", 60, "Ambil buku nikah atau akta perkawinan"),
  evt("a-20", "Setelah acara", 61, "Pelunasan semua vendor"),
  evt("a-21", "Setelah acara", 62, "Minta hasil dokumentasi ke vendor"),
];

export const DEFAULT_SETTINGS: Settings = {
  mahesaWa: "6280000000000",
  mahesaEmail: "admin.mahesa@contoh.id",
  momentumWa: "6285892928162",
  momentumEmail: "momentumbyluna2026@gmail.com",
};

const venues: Venue[] = [
  { id: "ve-1", name: "Gedung Contoh Satu", city: "Kota Bogor", capacity: 300, priceMin: 25_000_000, priceMax: 40_000_000, wa: "6280000000001", mapsQuery: "Gedung pernikahan Kota Bogor", photoUrl: "", note: "Data contoh untuk mencoba filter dan kartu venue.", sample: true },
  { id: "ve-2", name: "Aula Contoh Dua", city: "Kabupaten Bogor", capacity: 600, priceMin: 45_000_000, priceMax: 70_000_000, wa: "6280000000002", mapsQuery: "Gedung pernikahan Kabupaten Bogor", photoUrl: "", note: "Data contoh untuk mencoba filter dan kartu venue.", sample: true },
  { id: "ve-3", name: "Taman Contoh Tiga", city: "Kota Bogor", capacity: 150, priceMin: 15_000_000, priceMax: null, wa: "6280000000003", mapsQuery: "Taman acara Kota Bogor", photoUrl: "", note: "Data contoh untuk mencoba filter dan kartu venue.", sample: true },
  { id: "ve-4", name: "Ballroom Contoh Empat", city: "Depok", capacity: 900, priceMin: null, priceMax: 120_000_000, wa: "6280000000004", mapsQuery: "Ballroom pernikahan Depok", photoUrl: "", note: "Data contoh untuk mencoba filter dan kartu venue.", sample: true },
];

const vendors: Vendor[] = [
  { id: "vn-1", name: "Catering Contoh A", category: "Catering", wa: "6280000000011", priceNote: "Harga contoh", note: "Data contoh.", sample: true },
  { id: "vn-2", name: "Catering Contoh B", category: "Catering", wa: "6280000000012", priceNote: "Harga contoh", note: "Data contoh.", sample: true },
  { id: "vn-3", name: "Fotografi Contoh A", category: "Dokumentasi", wa: "6280000000013", priceNote: "Harga contoh", note: "Data contoh.", sample: true },
  { id: "vn-4", name: "Fotografi Contoh B", category: "Dokumentasi", wa: "6280000000014", priceNote: "Harga contoh", note: "Data contoh.", sample: true },
  { id: "vn-5", name: "MUA Contoh A", category: "MUA", wa: "6280000000015", priceNote: "Harga contoh", note: "Data contoh.", sample: true },
  { id: "vn-6", name: "Dekorasi Contoh A", category: "Dekorasi", wa: "6280000000016", priceNote: "Harga contoh", note: "Data contoh.", sample: true },
];

const wcc0 = { shootDate: null, status: "belum" as const, resultLink: "" };

const weddings: Wedding[] = [
  { id: "w1", code: "MOM-DEMO", track: "muslim", brideName: "Aulia", groomName: "Raka", akadDate: "2027-04-17", city: "Kota Bogor", contactWa: "6280000000101", plan: "gratis", mahesa: "none", momentum: "none", wcc: wcc0, rundown: [], sample: true },
  {
    id: "w2", code: "MOM-DUA2", track: "muslim", brideName: "Wanita B", groomName: "Pria B", akadDate: "2027-06-12", city: "Kota Bogor", contactWa: "6280000000102",
    plan: "gratis", mahesa: "aktif", momentum: "none", wcc: wcc0, sample: true,
    rundown: [
      { id: "rd-1", time: "08:00", title: "Persiapan MUA dan busana", note: "" },
      { id: "rd-2", time: "10:00", title: "Akad nikah", note: "" },
      { id: "rd-3", time: "12:00", title: "Resepsi dimulai", note: "" },
    ],
  },
  { id: "w3", code: "MOM-TIGA", track: "nonmuslim", brideName: "Wanita C", groomName: "Pria C", akadDate: "2027-08-21", city: "Kabupaten Bogor", contactWa: "6280000000103", plan: "gratis", mahesa: "none", momentum: "aktif", wcc: { shootDate: "2027-08-21", status: "belum", resultLink: "" }, rundown: [], sample: true },
  { id: "w4", code: "MOM-EMP4", track: "muslim", brideName: "Wanita D", groomName: "Pria D", akadDate: "2027-09-04", city: "Depok", contactWa: "6280000000104", plan: "gratis", mahesa: "diajukan", momentum: "diajukan", wcc: wcc0, rundown: [], sample: true },
];

const budget: BudgetItem[] = [
  { id: "b-1", weddingId: "w1", category: "Venue", planned: 30_000_000, actual: 32_000_000, paid: 10_000_000 },
  { id: "b-2", weddingId: "w1", category: "Catering", planned: 45_000_000, actual: 0, paid: 0 },
  { id: "b-3", weddingId: "w1", category: "Dokumentasi", planned: 12_000_000, actual: 0, paid: 0 },
];

const payments: BudgetPayment[] = [
  { id: "bp-1", weddingId: "w1", budgetId: "b-1", amount: 6_000_000, paidOn: "2026-10-05", payer: "bride", note: "DP venue" },
  { id: "bp-2", weddingId: "w1", budgetId: "b-1", amount: 4_000_000, paidOn: "2026-11-02", payer: "groom", note: "Cicilan pertama" },
];

const guests: Guest[] = [
  { id: "g-1", weddingId: "w1", name: "Tamu contoh 1", wa: "", group: "keluarga_wanita", count: 4, status: "diundang" },
  { id: "g-2", weddingId: "w1", name: "Tamu contoh 2", wa: "", group: "keluarga_pria", count: 3, status: "belum" },
  { id: "g-3", weddingId: "w1", name: "Tamu contoh 3", wa: "", group: "teman", count: 2, status: "hadir" },
  { id: "g-4", weddingId: "w1", name: "Tamu contoh 4", wa: "", group: "kolega", count: 1, status: "tidak_hadir" },
];

const weddingVendors: WeddingVendor[] = [
  { id: "wv-1", weddingId: "w1", catalogId: "vn-1", name: "Catering Contoh A", category: "Catering", wa: "6280000000011", status: "dihubungi", note: "", managedBy: "couple" },
  { id: "wv-2", weddingId: "w2", catalogId: "vn-3", name: "Fotografi Contoh A", category: "Dokumentasi", wa: "6280000000013", status: "deal", note: "Dikelola tim Mahesa.", managedBy: "mahesa" },
];

const promos: PromoCard[] = [
  { id: "p-1", target: "mahesa", trigger: "beranda", title: "Rencanakan bareng Mahesa Weddings", body: "Wedding organizer dan planner di Bogor. Setelah deal, admin Mahesa ikut mengelola vendor dan rundown proyekmu di aplikasi ini.", cta: "Ajukan Paket Mahesa", active: true },
  { id: "p-2", target: "wcc", trigger: "beranda", title: "Hari-H jadi reels", body: "Paket wedding content creator dari Momentum by Luna. Tiap bulan, satu pasangan mendapat paket WCC gratis.", cta: "Tanya Paket WCC", active: true },
  { id: "p-3", target: "mahesa", trigger: "ceklis-wo", title: "Belum punya WO?", body: "Admin Mahesa bisa membantu memilih vendor dan menyusun rundown.", cta: "Ajukan Paket Mahesa", active: true },
  { id: "p-4", target: "wcc", trigger: "ceklis-dokumentasi", title: "Cari dokumentasi video?", body: "Momentum by Luna membuat reels pernikahan, dengan opsi same-day edit.", cta: "Tanya Paket WCC", active: true },
];

const accounts: AdminAccount[] = [
  { id: "ac-1", name: "Luthfan", email: "momentumbyluna2026@gmail.com", role: "super_admin" },
  { id: "ac-2", name: "Admin Momentum", email: "momentumbyluna2026@gmail.com", role: "admin_momentum" },
  { id: "ac-3", name: "Admin Mahesa", email: "admin.mahesa@contoh.id", role: "admin_mahesa", placeholder: true },
];

export function seedState(): AppState {
  return {
    v: 1,
    session: null,
    settings: { ...DEFAULT_SETTINGS },
    weddings: structuredClone(weddings),
    templates: structuredClone(DEFAULT_TEMPLATES),
    checklist: [
      { id: "c-1", weddingId: "w1", templateId: "k-01", title: "", kind: "administrasi", group: "", done: true, hidden: false, due: "", note: "" },
      { id: "c-2", weddingId: "w1", templateId: "a-01", title: "", kind: "acara", group: "", done: true, hidden: false, due: "", note: "" },
    ],
    venues: structuredClone(venues),
    vendors: structuredClone(vendors),
    weddingVendors: structuredClone(weddingVendors),
    budget: structuredClone(budget),
    payments: structuredClone(payments),
    invitations: [],
    rsvps: [],
    guests: structuredClone(guests),
    promos: structuredClone(promos),
    dismissed: {},
    favorites: [],
    requests: [],
    accounts: structuredClone(accounts),
  };
}
