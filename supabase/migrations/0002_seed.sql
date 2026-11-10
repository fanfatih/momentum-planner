-- Data awal: ceklis default, kartu promo, kontak organisasi, dan undangan admin.
-- Nomor dan email Mahesa masih contoh. Ganti lewat panel Super Admin.

insert into public.checklist_templates (kind, track, group_name, sort_order, title, hint, promo_trigger) values
  ('administrasi', 'muslim', 'Dokumen dasar', 10, 'Surat pengantar nikah dari desa atau kelurahan tempat tinggal', null, null),
  ('administrasi', 'muslim', 'Dokumen dasar', 11, 'Fotokopi akta kelahiran', null, null),
  ('administrasi', 'muslim', 'Dokumen dasar', 12, 'Fotokopi KTP', null, null),
  ('administrasi', 'muslim', 'Dokumen dasar', 13, 'Fotokopi Kartu Keluarga', null, null),
  ('administrasi', 'muslim', 'Dokumen dasar', 14, 'Pas foto sesuai ketentuan', 'Ukuran dan jumlah dicek ke KUA.', null),
  ('administrasi', 'muslim', 'Dokumen dasar', 15, 'Surat keterangan sehat dari fasilitas pelayanan kesehatan', null, null),
  ('administrasi', 'muslim', 'Dokumen dasar', 16, 'Persetujuan calon pengantin', null, null),
  ('administrasi', 'muslim', 'Kondisi khusus', 20, 'Menikah di luar kecamatan tempat tinggal: surat rekomendasi nikah dari KUA setempat', null, null),
  ('administrasi', 'muslim', 'Kondisi khusus', 21, 'Usia di bawah 21 tahun: izin tertulis orang tua atau wali', null, null),
  ('administrasi', 'muslim', 'Kondisi khusus', 22, 'Belum 19 tahun saat akad: dispensasi kawin dari pengadilan', null, null),
  ('administrasi', 'muslim', 'Kondisi khusus', 23, 'Anggota TNI atau Polri: surat izin atasan atau kesatuan', null, null),
  ('administrasi', 'muslim', 'Kondisi khusus', 24, 'Duda atau janda cerai: akta cerai', null, null),
  ('administrasi', 'muslim', 'Kondisi khusus', 25, 'Duda atau janda ditinggal meninggal: akta kematian', null, null),
  ('administrasi', 'muslim', 'Pendaftaran', 30, 'Daftar kehendak nikah, langsung ke KUA atau online lewat SIMKAH', null, null),
  ('administrasi', 'muslim', 'Pendaftaran', 31, 'Lengkapi data dan dokumen sesuai arahan petugas KUA', null, null),
  ('administrasi', 'muslim', 'Pendaftaran', 32, 'Ikut bimbingan perkawinan (Binwin)', null, null),
  ('administrasi', 'muslim', 'Biaya dan waktu', 40, 'Pastikan lokasi akad', 'Akad di kantor KUA pada hari dan jam kerja gratis. Di luar kantor atau di luar jam kerja dikenai Rp600 ribu (PNBP).', null),
  ('administrasi', 'muslim', 'Biaya dan waktu', 41, 'Tanyakan batas waktu pendaftaran sebelum akad ke KUA setempat', null, null),
  ('administrasi', 'nonmuslim', 'Dokumen', 10, 'Surat keterangan perkawinan dari pemuka agama atau pendeta', 'Untuk penghayat kepercayaan: surat perkawinan dari pemuka penghayat.', null),
  ('administrasi', 'nonmuslim', 'Dokumen', 11, 'Formulir pencatatan perkawinan', null, null),
  ('administrasi', 'nonmuslim', 'Dokumen', 12, 'Fotokopi akta kelahiran suami dan istri (dilegalisir)', null, null),
  ('administrasi', 'nonmuslim', 'Dokumen', 13, 'Fotokopi KK dan KTP-el suami dan istri', null, null),
  ('administrasi', 'nonmuslim', 'Dokumen', 14, 'Pas foto berdampingan 4x6, 4 lembar', null, null),
  ('administrasi', 'nonmuslim', 'Dokumen', 15, 'Fotokopi KTP-el dua orang saksi', null, null),
  ('administrasi', 'nonmuslim', 'Pendaftaran', 30, 'Konfirmasi syarat terbaru ke Disdukcapil domisili', null, null),
  ('administrasi', 'nonmuslim', 'Pendaftaran', 31, 'Serahkan berkas ke Disdukcapil dan tanda tangan register', null, null),
  ('administrasi', 'nonmuslim', 'Pendaftaran', 32, 'Ambil kutipan akta perkawinan', 'Sumber yang dirujuk menyebut layanan sekitar lima hari setelah tanda tangan register.', null),
  ('acara', null, '9 sampai 12 bulan sebelum', 10, 'Tentukan tanggal akad dan resepsi bersama dua keluarga', null, null),
  ('acara', null, '9 sampai 12 bulan sebelum', 11, 'Tentukan garis besar budget', null, null),
  ('acara', null, '9 sampai 12 bulan sebelum', 12, 'Perkirakan jumlah tamu', null, null),
  ('acara', null, '9 sampai 12 bulan sebelum', 13, 'Survei dan booking venue', 'Lihat tab Vendor lalu pilih Venue untuk direktori.', null),
  ('acara', null, '6 sampai 8 bulan sebelum', 20, 'Pilih WO atau vendor besar', 'Catering, dokumentasi, dan MUA biasanya perlu dikunci paling awal.', 'ceklis-wo'),
  ('acara', null, '6 sampai 8 bulan sebelum', 21, 'Pilih tim dokumentasi foto dan video', null, 'ceklis-dokumentasi'),
  ('acara', null, '6 sampai 8 bulan sebelum', 22, 'Pilih busana pengantin', null, null),
  ('acara', null, '3 sampai 5 bulan sebelum', 30, 'Finalisasi daftar tamu', null, null),
  ('acara', null, '3 sampai 5 bulan sebelum', 31, 'Siapkan seserahan dan mahar', null, null),
  ('acara', null, '3 sampai 5 bulan sebelum', 32, 'Desain undangan', null, null),
  ('acara', null, '3 sampai 5 bulan sebelum', 33, 'Tasting menu catering', null, null),
  ('acara', null, '1 sampai 2 bulan sebelum', 40, 'Sebar undangan', null, null),
  ('acara', null, '1 sampai 2 bulan sebelum', 41, 'Fitting busana', null, null),
  ('acara', null, '1 sampai 2 bulan sebelum', 42, 'Konfirmasi semua vendor', null, null),
  ('acara', null, '1 sampai 2 bulan sebelum', 43, 'Susun rundown acara', null, null),
  ('acara', null, 'H-7 sampai H-1', 50, 'Gladi atau geladi bersih', null, null),
  ('acara', null, 'H-7 sampai H-1', 51, 'Cek perlengkapan hari H', null, null),
  ('acara', null, 'H-7 sampai H-1', 52, 'Siapkan amplop dan jadwal pembayaran vendor', null, null),
  ('acara', null, 'Setelah acara', 60, 'Ambil buku nikah atau akta perkawinan', null, null),
  ('acara', null, 'Setelah acara', 61, 'Pelunasan semua vendor', null, null),
  ('acara', null, 'Setelah acara', 62, 'Minta hasil dokumentasi ke vendor', null, null);

insert into public.promo_cards (target, trigger, title, body, cta) values
  ('mahesa', 'beranda', 'Rencanakan bareng Mahesa Weddings', 'Wedding organizer dan planner di Bogor. Setelah deal, admin Mahesa ikut mengelola vendor dan rundown proyekmu di aplikasi ini.', 'Ajukan Paket Mahesa'),
  ('wcc', 'beranda', 'Hari-H jadi reels', 'Paket wedding content creator dari Momentum by Luna. Tiap bulan, satu pasangan mendapat paket WCC gratis.', 'Tanya Paket WCC'),
  ('mahesa', 'ceklis-wo', 'Belum punya WO?', 'Admin Mahesa bisa membantu memilih vendor dan menyusun rundown.', 'Ajukan Paket Mahesa'),
  ('wcc', 'ceklis-dokumentasi', 'Cari dokumentasi video?', 'Momentum by Luna membuat reels pernikahan, dengan opsi same-day edit.', 'Tanya Paket WCC');

update public.organizations set wa = '6280000000000', email = 'admin.mahesa@contoh.id' where id = 'mahesa';
update public.organizations set email = 'momentumbyluna2026@gmail.com' where id = 'momentum';

insert into public.admin_invites (email, name, role, org_id) values
  ('iniluthfan06@gmail.com', 'Luthfan', 'super_admin', null),
  ('momentumbyluna2026@gmail.com', 'Admin Momentum', 'admin_momentum', 'momentum');

-- Fungsi bantu hanya untuk dipanggil dari aturan akses dan aplikasi yang sudah login.
revoke execute on function public.my_role(), public.my_org(), public.is_super(), public.is_member(uuid),
  public.is_linked_admin(uuid, text), public.can_read_wedding(uuid), public.create_wedding(text, text),
  public.join_wedding(text, text) from public, anon;
revoke execute on function public.handle_new_user(), public.protect_profile_role() from public, anon, authenticated;
