# Momentum Planner

Planner pernikahan berbentuk PWA untuk Momentum by Luna, dengan panel admin untuk Mahesa Weddings dan Momentum.

Status saat ini: **mode demo**. Semua fitur v1 berjalan dengan data yang disimpan di browser (localStorage). Login Google dan database Supabase belum tersambung.

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Untuk build produksi: `npm run build` lalu `npm run start`.

## Mencoba tiap role

Halaman `/masuk` menyediakan pintu masuk demo:

| Pintu | Yang terbuka |
| --- | --- |
| Pengantin wanita, Pengantin pria | Proyek contoh yang sama (kode `MOM-DEMO`) |
| Buat proyek baru | Onboarding dari proyek kosong |
| Gabung ke proyek pasangan | Masuk ke proyek lain lewat kode |
| Admin Mahesa | Proyek yang tertaut ke Mahesa, katalog venue dan vendor |
| Admin Momentum | Proyek dengan paket WCC |
| Super Admin | Semua proyek, katalog, kartu promo, ceklis default, akun dan kontak |

Semua role memakai penyimpanan browser yang sama, jadi alur lintas role bisa dicoba di satu perangkat: pengantin mengajukan paket, admin menautkan, pengantin melihat bagian yang terkunci.

## Yang masih berupa contoh

- Nomor WhatsApp dan email admin Mahesa (`6280000000000`, `admin.mahesa@contoh.id`). Ganti di panel Super Admin, menu **Akun dan kontak**.
- Venue, vendor, tamu, dan angka budget bawaan. Semuanya berlabel "Data contoh" dan bisa dihapus dari panel admin.
- Isi ceklis Catatan Sipil merujuk rangkuman media untuk Sleman dan Pontianak, belum diverifikasi ke Disdukcapil Bogor.

## Struktur

```
src/app/(couple)      layar pengantin: mulai, beranda, ceklis, vendor, budget, tamu
src/app/admin         panel admin: proyek, katalog, promo, ceklis default, akun
src/app/masuk         halaman masuk dan pintu demo
src/components        komponen UI, logo, kartu promo, kerangka halaman
src/lib/store.ts      state aplikasi dan semua aksi (lapisan yang nanti diganti Supabase)
src/lib/seed.ts       data contoh dan ceklis default
supabase/migrations   skema database dan aturan akses (RLS)
supabase/tests        uji aturan akses dengan PGlite
tests/e2e             uji klik seluruh aplikasi dengan Playwright
anti-slop             laporan Delivery Gate
```

## Uji

```bash
npm run test:rls        # 40 skenario akses per role pada skema Supabase
node tests/e2e/run.js   # uji klik, butuh server di port 3100 dan Playwright
node tests/e2e/headings.js
```

## Langkah berikutnya

1. Jalankan `supabase/migrations/0001_init.sql` di proyek Supabase, lalu isi `admin_invites` dengan email admin.
2. Aktifkan login Google di Supabase Auth dan sambungkan `src/lib/store.ts` ke database.
3. Deploy, lalu ganti kontak contoh dan isi katalog venue serta vendor asli.

## Deploy

Proyek ini terhubung ke Vercel. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di Settings > Environment Variables (lihat `.env.example`).
