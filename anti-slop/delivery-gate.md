# Delivery Gate: Momentum Planner v1 (mode demo)

Tanggal: 10 November 2026. Mode antislop: DURING.

Design Read: planner pernikahan PWA untuk pasangan Gen Z Indonesia dan admin vendor, gaya editorial hangat dari moodboard Momentum by Luna, dial ENERGY 2 / RHYTHM 2 / MOTION 2.

Bukti berasal dari tiga rangkaian uji yang dijalankan pada build produksi (`next build` lalu `next start`):

- `tests/e2e/run.js`: 77 dari 77 lulus, di Chromium.
- `tests/e2e/headings.js`: 19 dari 19 halaman lulus.
- `supabase/tests/rls.test.mjs`: 40 dari 40 skenario akses lulus.

## Blok 1: Hard Gate

| Aturan | Status | Bukti |
| --- | --- | --- |
| R-02 em dash | PASS | Pemindaian seluruh `src`, `public`, `supabase`: nol em dash dan en dash. |
| R-03 mobile | PASS | Nol overflow horizontal dan nol konten terpotong di 320, 360, 430, 768, 1024, 1440 (5 layar pengantin) dan 8 lebar untuk 6 layar admin. Semua target sentuh di layar pengantin minimal 44px. |
| R-17 angka | PASS | Hitung mundur, progres, total budget, dan jumlah tamu dihitung dari data. Angka bawaan berlabel "Data contoh". Rp600 ribu bersumber dari artikel yang dirujuk di dokumen rancangan. |
| R-18 testimoni | PASS | Tidak ada testimoni. |
| R-23 aset | PASS | Logo dan monogram dari file SVG pemilik. Tidak ada avatar atau foto buatan. Venue tanpa foto tampil tanpa gambar. |
| R-24 navigasi | PASS | 5 tab bawah dan menu admin per role, semua tujuan ada. Menu yang bukan hak role tidak ditampilkan, dan URL langsung menampilkan layar "bukan untuk role kamu". |
| R-25 kontras | PASS | 19 pasangan warna dihitung, terendah 5,05:1 untuk teks dan 3,62:1 untuk garis kontrol. |
| R-26 kontrol hidup | PASS | Lihat rekaman klik di bawah. "Masuk dengan Google" nonaktif dengan label alasan yang terlihat. |
| R-27 state | PASS | Loading saat memuat penyimpanan, empty state per daftar (pertama kali dan hasil saringan dibedakan), error saat data rusak, gagal simpan, dan `error.tsx`. |
| R-28 FAQ | PASS | Tidak ada FAQ. |
| R-32 keyboard | PASS | Tab memberi outline 3px, Enter membuka dialog, fokus masuk ke dialog, Escape menutup. |
| R-33 patch script | PASS | Semua fitur ditulis di source. |
| R-34 tema | PASS | Hanya tema terang, tanpa toggle. |
| R-35 verifikasi | PASS | Build dijalankan, console bersih kecuali 404 yang sengaja diuji. |
| R-36 klaim | PASS, satu catatan | Tidak ada klaim keamanan atau performa. Kalimat promo "tiap bulan satu pasangan mendapat paket WCC gratis" berasal dari rencana pemilik dan perlu dikonfirmasi sebelum rilis. |
| R-37 arah desain | PASS | Arah dari moodboard dan dokumen rancangan yang disetujui. |
| R-38 konten nyata | PASS | Semua data bawaan berlabel contoh. Nomor dan email Mahesa ditandai contoh, dengan peringatan di sheet dan di panel admin. |
| R-39 semantik | PASS | `lang="id"`, judul unik per rute, satu `h1` tanpa loncatan level di 19 halaman, satu `main`, label terlihat di semua field, ikon dekoratif `aria-hidden`, tombol ikon punya `aria-label`, `cursor: pointer` di base layer, animasi mengikuti `prefers-reduced-motion`, tanpa loop. Zoom tidak diblokir. |
| R-40 performa | PASS | Satu-satunya gambar konten (foto venue) punya `width`, `height`, dan `aspect-ratio`. Tidak ada skrip pihak ketiga. Lighthouse dan Web Vitals: tidak diukur. |

### Rekaman klik (R-35)

- Masuk: kode kosong memunculkan validasi, kode salah memunculkan pesan, pengantin wanita membuka `/beranda`.
- Beranda: CTA promo membuka sheet dengan tautan `wa.me` terisi, Escape menutup, tutup promo memunculkan promo berikutnya, centang ceklis mengubah hitungan, baris ringkasan membuka `/budget`.
- Ceklis: centang, simpan catatan, tambah item (validasi lalu tersimpan), sembunyikan item, promo inline, ajukan paket.
- Vendor: simpan rekomendasi, status Deal, tambah ke budget, tambah vendor sendiri.
- Venue: 4 kartu, tautan WhatsApp dan Maps valid, filter kota, empty state hasil saringan, favorit.
- Budget: isi rencana, aktual, DP; sisa total terhitung Rp27.000.000 sesuai hitungan manual; validasi pos kosong.
- Tamu: validasi, tambah, saring status, cari tanpa hasil, hapus.
- Profil: validasi nama, simpan kota, keluar. `/beranda` tanpa sesi dialihkan ke `/masuk`.
- Admin Mahesa: 2 pengajuan masuk, tautkan proyek, rundown (validasi lalu tambah), vendor kelolaan, tambah dan hapus venue dengan konfirmasi, `/admin/promo` ditolak.
- Pengantin setelah ditautkan: rundown tampil terkunci, vendor Mahesa terkunci, ajukan perubahan tercatat.
- Admin di HP: daftar jadi kartu, tombol Menu membuka navigasi, setujui permintaan.
- Admin Momentum: hanya proyek WCC, proyek Mahesa ditolak, form WCC memvalidasi tautan.
- Super Admin: 4 proyek, ubah tautan, ubah kartu promo, tambah item ceklis default, ganti nomor Mahesa (peringatan hilang), tambah akun admin.
- Pasangan baru: onboarding dengan validasi, kode pasangan, beranda tanpa tanggal, ceklis jalur Catatan Sipil, empty state budget, tamu, vendor.

## Blok 2: Purpose-Gate

| Aturan | Status | Alasan tertulis |
| --- | --- | --- |
| R-01 warna | PASS | Tanpa gradien. Semua warna dari moodboard. |
| R-04 ikon | PASS, satu catatan | Ikon digambar sendiri dan selalu didampingi label teks. Gaya garisnya tetap mirip pustaka umum; kalau mau lebih khas, perlu set ikon dari desainer. |
| R-06 tipografi | PASS | Fraunces untuk judul dan angka, DM Sans untuk isi, mengikuti "editorial serif + modern sans" di moodboard. Font asli logo belum diketahui. |
| R-07 latar | PASS | Latar polos krem, tanpa pola. |
| R-08 panah | PASS | Chevron hanya di baris yang membuka halaman atau detail. |
| R-09 badge | PASS | Tag hanya untuk status nyata: data contoh, status vendor, tamu, tautan, dan label iklan. |
| R-10 glass | PASS | Tidak dipakai. |
| R-12 shadow | PASS | Tidak ada shadow. Elevasi memakai garis tepi. |
| R-13 glow | PASS | Tidak dipakai. |
| R-14 kartu | PASS | Daftar memakai baris. Kartu hanya untuk venue, pos budget, dan promo. |
| R-19 animasi | PASS | Masuk halaman dan daftar berurutan (orientasi), sheet naik (asal konteks), centang tergambar dan progres terisi (umpan balik). Tanpa loop. |
| R-22 ilustrasi | PASS | Tidak ada ilustrasi. |

## Blok 3: Liveliness

| Butir | Status | Bukti |
| --- | --- | --- |
| Dial dinyatakan | PASS | ENERGY 2 / RHYTHM 2 / MOTION 2. |
| Sesuai dial | PASS | Beranda, ceklis, budget, dan venue punya komposisi berbeda; gerak sebatas transisi. |
| Satu titik fokus | PASS | Hitung mundur di beranda, sisa pembayaran di budget, progres di ceklis. |
| Whitespace struktural | PASS | Jarak antar bagian lebih besar dari jarak dalam bagian. |
| Satu aksen | PASS | Oranye hanya di hitung mundur dan tombol kartu promo. |
| Motif identitas | PASS | Lengkung pelaminan di halaman masuk, hitung mundur, kode pasangan, dan empty state, plus monogram M. |
| Design Read | PASS | Dinyatakan sebelum build. |

## Blok 4: Craftsmanship dan Quality Locks

| Butir | Status | Catatan |
| --- | --- | --- |
| C-1 sampai C-5 | PASS | Tiap keputusan punya alasan di tabel ini, semua kontrol hidup, tidak ada bagian pengisi. |
| R-05 layout | PASS | Bukan template landing. Layar admin dibangun dari keputusan "proyek mana yang butuh tindakan": pengajuan masuk di atas, lalu daftar. |
| R-11 radius | PASS | 8px kontrol, 10px tombol, 14px kartu, lengkung untuk motif. Tidak ada pil. |
| R-15 CTA | PASS | "Ajukan Paket Mahesa", "Tanya Paket WCC", "Tambah pos budget". |
| R-16 buzzword | PASS | Pemindaian nol hasil. |
| R-20 identitas | PASS | Palet, motif lengkung, dan logo spesifik Momentum. |
| R-21 tema | PASS | Terang saja, karena identitas brand berlatar krem. |
| R-29 palet | PASS, dengan catatan | Empat warna (merah, hijau, oranye, kuning) melebihi batas 2 sampai 3 inti plus 1 aksen. Ini palet moodboard pemilik, dan tiap warna diberi satu peran: merah aksi, hijau status selesai, oranye dan kuning khusus hitung mundur dan promo. |
| R-30 kloning | PASS | Tidak meniru produk lain. |
| R-31 alasan | PASS | Tercatat di atas. |

## Yang belum diverifikasi

- Lighthouse dan Core Web Vitals belum diukur.
- Belum diuji di perangkat fisik (iPhone Safari, Android Chrome) maupun dengan pembaca layar.
- Halaman offline dan service worker hanya dicek terlayani, belum diuji dalam keadaan benar-benar offline.
