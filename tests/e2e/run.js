const { chromium } = require('playwright');
const BASE = 'http://localhost:3100';
const results = [];
const errors = [];
const log = (ok, name, extra = '') => { results.push({ ok, name, extra }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  -> ' + extra : ''}`); };
const step = async (name, fn) => { try { const r = await fn(); log(r !== false, name, typeof r === 'string' ? r : ''); } catch (e) { log(false, name, e.message.split('\n')[0].slice(0, 140)); } };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await ctx.route(/wa\.me|google\.com\/maps/, (r) => r.abort());
  const page = await ctx.newPage();
  ctx.on('page', async (p) => { if (p !== page) await p.close().catch(() => {}); });
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::ERR/.test(m.text())) errors.push(m.text() + ' @ ' + (m.location().url || page.url())); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.setDefaultTimeout(6000);

  const shot = (n) => page.screenshot({ path: `tests/e2e/shots/${n}.png`, fullPage: true });
  const nav = (label) => page.getByRole('navigation', { name: 'Menu utama' }).getByRole('link', { name: label }).click();
  const btn = (name, exact = true) => page.getByRole('button', { name, exact });
  const dialog = () => page.locator('dialog[open]');
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const clipped = () => page.evaluate(() => [...document.querySelectorAll('body *')].filter((el) => { const c = getComputedStyle(el); return c.overflowX !== 'visible' && c.textOverflow !== 'ellipsis' && !el.classList.contains('sr-only') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1; }).map((el) => `${el.tagName}.${(el.className || '').toString().slice(0, 40)} ${el.scrollWidth}>${el.clientWidth}`));
  const enter = async (label, url) => { await page.goto(BASE + '/masuk'); await btn(label).click(); await page.waitForURL('**' + url); };

  // A. Masuk
  await page.goto(BASE + '/masuk');
  await btn('Pengantin wanita').waitFor();
  await step('masuk: judul halaman', async () => (await page.title()).includes('Momentum Planner'));
  await step('masuk: tombol Google nonaktif berlabel', async () => await btn('Masuk dengan Google').isDisabled());
  await step('masuk: tanpa overflow horizontal', async () => (await overflow()) <= 0);
  await page.waitForTimeout(900); await shot('01-masuk');
  await step('masuk: kode kosong -> validasi', async () => { await btn('Gabung ke proyek pasangan').click(); return await page.getByText('Isi kode dari pasanganmu dulu.').isVisible(); });
  await step('masuk: kode salah -> pesan error', async () => { await page.getByLabel('Kode dari pasangan').fill('MOM-ZZZZ'); await btn('Gabung ke proyek pasangan').click(); return await page.getByText('Kode ini tidak ditemukan').isVisible(); });
  await step('masuk: pengantin wanita -> /beranda', async () => { await btn('Pengantin wanita').click(); await page.waitForURL('**/beranda'); });

  // B. Beranda
  await step('beranda: nama pasangan dan hitung mundur', async () => { await page.getByRole('heading', { name: 'Aulia & Raka' }).waitFor(); return await page.getByText('hari menuju akad').isVisible(); });
  await page.waitForTimeout(700);
  await shot('02-beranda');
  await step('beranda: CTA promo membuka sheet, Escape menutup', async () => {
    await btn('Ajukan Paket Mahesa').click(); await dialog().waitFor();
    const href = await dialog().getByRole('link', { name: 'Kirim lewat WhatsApp' }).getAttribute('href');
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    return (await dialog().count()) === 0 && href.startsWith('https://wa.me/6280000000000?text=') ? 'href wa.me ok' : false;
  });
  await step('beranda: popup melayang di atas menu bawah', async () => {
    const pop = page.getByRole('complementary', { name: 'Iklan Mahesa Weddings' });
    const [a, n] = await Promise.all([pop.boundingBox(), page.getByRole('navigation', { name: 'Menu utama' }).boundingBox()]);
    return a.y + a.height <= n.y + 0.5 ? 'tidak menimpa menu' : false;
  });
  await step('beranda: tutup popup Mahesa -> popup WCC muncul beberapa detik kemudian', async () => { await btn('Tutup iklan ini').click(); await page.getByRole('heading', { name: 'Hari-H jadi reels' }).waitFor({ timeout: 12000 }); });
  await step('beranda: centang "tidak tampil hari ini" menyembunyikan, tetap hilang setelah muat ulang', async () => {
    await page.getByLabel('Jangan tampilkan lagi hari ini').check(); await page.waitForTimeout(900);
    const gone = (await page.getByRole('heading', { name: 'Hari-H jadi reels' }).count()) === 0;
    await page.reload(); await page.waitForTimeout(2600);
    return gone && (await page.getByRole('heading', { name: 'Hari-H jadi reels' }).count()) === 0;
  });
  await step('beranda: centang item ceklis mengubah hitungan', async () => {
    const before = await page.getByText(/dari \d+ selesai/).first().textContent();
    await page.getByRole('checkbox').first().click(); await page.waitForTimeout(150);
    const after = await page.getByText(/dari \d+ selesai/).first().textContent();
    return before !== after ? `${before} -> ${after}` : false;
  });
  await step('beranda: baris ringkasan Budget -> /budget', async () => { await page.getByRole('link', { name: /Budget/ }).first().click(); await page.waitForURL('**/budget'); });

  // C. Ceklis
  await step('nav bawah: Ceklis', async () => { await nav('Ceklis'); await page.waitForURL('**/ceklis'); return (await page.getByRole('link', { name: 'Ceklis' }).getAttribute('aria-current')) === 'page'; });
  await step('ceklis: centang item', async () => { const c = page.getByRole('checkbox', { checked: false }).first(); const label = await c.getAttribute('aria-label'); await c.click(); return (await page.getByRole('checkbox', { name: label }).getAttribute('aria-checked')) === 'true'; });
  await step('ceklis: buka detail, simpan catatan', async () => {
    await btn('Fotokopi akta kelahiran', false).first().click(); await dialog().waitFor();
    await dialog().getByLabel('Catatan (opsional)').fill('Bawa aslinya'); await dialog().getByRole('button', { name: 'Simpan item' }).click();
    await page.waitForTimeout(200); return await page.getByText('Ada catatan').first().isVisible();
  });
  await step('ceklis: tambah item kosong -> validasi, lalu tersimpan', async () => {
    await btn('Tambah item sendiri').click(); await dialog().waitFor();
    await dialog().getByRole('button', { name: 'Tambah ke ceklis' }).click();
    const err = await dialog().getByText('Isi nama itemnya.').isVisible();
    await dialog().getByLabel('Nama item').fill('Pesan suvenir uji'); await dialog().getByRole('button', { name: 'Tambah ke ceklis' }).click();
    await page.waitForTimeout(200); return err && await page.getByText('Pesan suvenir uji').isVisible();
  });
  await step('ceklis: sembunyikan item -> chip item tersembunyi', async () => {
    await page.getByRole('button', { name: /Kondisi khusus/ }).click(); await page.waitForTimeout(150);
    await btn('Anggota TNI atau Polri', false).first().click(); await dialog().waitFor();
    await dialog().getByRole('button', { name: /Hapus dari daftar/ }).click(); await page.waitForTimeout(200);
    return await btn('Lihat 1 item tersembunyi').isVisible();
  });
  await step('ceklis: tombol hapus di baris menyembunyikan item default, bisa ditampilkan lagi', async () => {
    await btn('Lihat 1 item tersembunyi').click();
    await page.getByRole('button', { name: /^Tampilkan lagi: / }).first().click(); await page.waitForTimeout(200);
    const before = (await page.getByRole('button', { name: /^Hapus dari daftar: / }).count());
    await page.getByRole('button', { name: /^Hapus dari daftar: / }).first().click(); await page.waitForTimeout(200);
    return before > 0 && await page.getByText(/Lihat 1 item tersembunyi|Sembunyikan lagi/).first().isVisible();
  });
  await step('ceklis: grup Kondisi khusus tertutup, bisa dibuka dan ditutup', async () => {
    await page.reload(); await page.waitForTimeout(800);
    const head = page.getByRole('button', { name: /Kondisi khusus/ });
    const closed = (await head.getAttribute('aria-expanded')) === 'false' && (await page.getByText('Duda atau janda cerai').count()) === 0;
    await head.click(); await page.waitForTimeout(150);
    const opened = await page.getByText('Duda atau janda cerai: akta cerai').first().isVisible();
    await head.click();
    return closed && opened;
  });
  await step('ceklis: tab Persiapan acara + popup WO', async () => { await btn('Persiapan acara').click(); await page.getByRole('heading', { name: 'Belum punya WO?' }).waitFor(); });
  await page.waitForTimeout(500);
  await shot('03-ceklis');
  await step('ceklis: ajukan paket Mahesa dari popup', async () => {
    await btn('Ajukan Paket Mahesa').click(); await dialog().waitFor();
    await dialog().getByRole('link', { name: 'Kirim lewat WhatsApp' }).click(); await page.waitForTimeout(300);
    return (await page.getByRole('heading', { name: 'Belum punya WO?' }).count()) === 0;
  });

  // D. Vendor dan venue
  await step('nav bawah: Vendor', async () => { await nav('Vendor'); await page.waitForURL('**/vendor'); });
  await step('vendor: simpan rekomendasi', async () => { await page.locator('li', { hasText: 'Catering Contoh B' }).getByRole('button', { name: 'Simpan', exact: true }).click(); await page.waitForTimeout(150); return await page.locator('li', { hasText: 'Catering Contoh B' }).getByText('Tersimpan').isVisible(); });
  await step('vendor: ubah status Deal dan tambah ke budget', async () => {
    await page.getByRole('button', { name: /Catering Contoh B/ }).first().click(); await dialog().waitFor();
    await dialog().getByRole('button', { name: 'Deal', exact: true }).click();
    await dialog().getByRole('button', { name: 'Tambahkan ke budget' }).click(); await page.waitForTimeout(200);
    return await page.getByRole('button', { name: /Catering Contoh B.*Deal/ }).isVisible();
  });
  await step('vendor: tambah vendor sendiri (validasi + simpan)', async () => {
    await btn('Tambah vendor sendiri').click(); await dialog().waitFor();
    await dialog().getByRole('button', { name: 'Simpan sebagai kandidat' }).click();
    const err = await dialog().getByText('Isi nama vendornya.').isVisible();
    await dialog().getByLabel('Nama vendor').fill('MUA Uji'); await dialog().getByRole('button', { name: 'Simpan sebagai kandidat' }).click();
    await page.waitForTimeout(200); return err && await page.getByRole('button', { name: /MUA Uji/ }).isVisible();
  });
  await page.waitForTimeout(400);
  await shot('04-vendor');
  await step('venue: tab Venue menampilkan 4 kartu', async () => { await btn('Venue').click(); await page.waitForTimeout(500); return (await page.getByRole('link', { name: 'Google Maps' }).count()) === 4; });
  await step('venue: tautan WhatsApp dan Maps valid', async () => {
    const wa = await page.getByRole('link', { name: 'WhatsApp' }).first().getAttribute('href');
    const maps = await page.getByRole('link', { name: 'Google Maps' }).first().getAttribute('href');
    return wa.startsWith('https://wa.me/') && maps.startsWith('https://www.google.com/maps/search/');
  });
  await step('venue: filter kota Depok -> 1', async () => { await page.getByLabel('Kota').selectOption('Depok'); return (await page.getByRole('link', { name: 'Google Maps' }).count()) === 1; });
  await step('venue: filter tanpa hasil -> empty state + hapus filter', async () => {
    await btn('Sampai 200').click(); const empty = await page.getByText('Tidak ada venue yang cocok').isVisible();
    await btn('Hapus semua filter').click(); return empty && (await page.getByRole('link', { name: 'Google Maps' }).count()) === 4;
  });
  await step('venue: favorit + filter Favorit saja', async () => {
    const heart = page.getByRole('button', { name: /Simpan Gedung Contoh Satu ke favorit/ }); await heart.click();
    const pressed = await page.getByRole('button', { name: /Hapus Gedung Contoh Satu dari favorit/ }).getAttribute('aria-pressed');
    await page.getByLabel('Tampilkan favorit saja').check(); const n = await page.getByRole('link', { name: 'Google Maps' }).count();
    return pressed === 'true' && n === 1;
  });
  await page.waitForTimeout(400);
  await shot('05-venue');

  // E. Budget
  await step('nav bawah: Budget, pos dari vendor deal ada', async () => { await nav('Budget'); await page.waitForURL('**/budget'); return await page.getByRole('button', { name: /Catering: Catering Contoh B/ }).isVisible(); });
  await step('budget: isi rencana dan aktual -> tag lebih dari rencana', async () => {
    await page.getByRole('button', { name: /Catering: Catering Contoh B/ }).click(); await dialog().waitFor();
    await dialog().getByLabel('Rencana').fill('5000000'); await dialog().getByLabel('Aktual').fill('6000000');
    await dialog().getByRole('button', { name: 'Simpan perubahan' }).click(); await page.waitForTimeout(200);
    return await page.getByText(/Lebih Rp\s?1\.000\.000 dari rencana/).isVisible();
  });
  await step('budget: catat pembayaran oleh pengantin pria -> muncul di riwayat dan ringkasan', async () => {
    await page.getByRole('button', { name: /Catering: Catering Contoh B/ }).click(); await dialog().waitFor();
    await dialog().getByRole('button', { name: 'Catat pembayaran' }).click();
    await dialog().getByRole('button', { name: 'Raka', exact: true }).click();
    await dialog().getByRole('button', { name: 'Simpan', exact: true }).click(); const err = await dialog().getByText('Isi jumlah pembayaran.').isVisible();
    await dialog().getByLabel('Jumlah dibayar').fill('1000000'); await dialog().getByLabel('Catatan (opsional)').fill('DP uji');
    await dialog().getByRole('button', { name: 'Simpan', exact: true }).click(); await page.waitForTimeout(200);
    const row = await dialog().getByText(/dibayar Raka · DP uji/).isVisible();
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    const summary = await page.getByLabel('Ringkasan budget').getByText('Rp 5.000.000', { exact: false }).first().isVisible();
    return err && row && summary;
  });
  await step('budget: sisa total terhitung benar', async () => {
    // Venue 32jt-10jt = 22jt, Catering B 6jt-1jt = 5jt -> 27jt
    const t = await page.getByLabel('Ringkasan budget').locator('p').nth(1).textContent(); return /27\.000\.000/.test(t) ? t.trim() : false;
  });
  await step('budget: riwayat pembayaran tampil di halaman, hapus pembayaran mengembalikan sisa', async () => {
    const listed = await page.getByRole('heading', { name: 'Riwayat pembayaran' }).first().isVisible();
    await page.getByRole('button', { name: /Catering: Catering Contoh B/ }).first().click(); await dialog().waitFor();
    await dialog().getByRole('button', { name: /^Hapus pembayaran/ }).click(); await page.waitForTimeout(200);
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    const t = await page.getByLabel('Ringkasan budget').locator('p').nth(1).textContent();
    return listed && /28\.000\.000/.test(t);
  });
  await step('budget: tambah pos kosong -> validasi, lalu simpan dan sheet lanjut ke riwayat', async () => {
    await btn('Tambah pos budget').click(); await dialog().waitFor();
    await dialog().getByRole('button', { name: 'Tambah pos budget' }).click(); const err = await dialog().getByText('Isi nama pos budgetnya.').isVisible();
    await dialog().getByLabel('Pos budget').fill('Dekorasi uji'); await dialog().getByRole('button', { name: 'Tambah pos budget' }).click();
    await page.waitForTimeout(250);
    const stays = await dialog().getByRole('heading', { name: 'Riwayat pembayaran' }).isVisible();
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    return err && stays && await page.getByRole('button', { name: /Dekorasi uji/ }).isVisible();
  });
  await page.waitForTimeout(400);
  await shot('06-budget');

  // F. Tamu
  await step('nav bawah: Tamu', async () => { await nav('Tamu'); await page.waitForURL('**/tamu'); return await page.getByText('10 orang dalam 4 undangan').isVisible(); });
  await step('tamu: validasi + tambah -> total 15 orang', async () => {
    await btn('Tambah').click(); await dialog().waitFor();
    await dialog().getByRole('button', { name: 'Tambah tamu' }).click(); const err = await dialog().getByText('Isi nama tamu atau keluarganya.').isVisible();
    await dialog().getByLabel('Nama tamu').fill('Keluarga Uji'); await dialog().getByLabel('Jumlah orang').fill('5');
    await dialog().getByRole('button', { name: 'Tambah tamu' }).click(); await page.waitForTimeout(200);
    return err && await page.getByText('15 orang dalam 5 undangan').isVisible();
  });
  await step('tamu: saring status Hadir -> 1 baris', async () => { await btn('Hadir (2)').click(); return (await page.locator('ul.divide-y > li').count()) === 1; });
  await step('tamu: cari tanpa hasil -> empty state + hapus filter', async () => {
    await page.getByLabel('Cari nama').fill('zzz'); const empty = await page.getByText('Tidak ada tamu yang cocok').isVisible();
    await btn('Hapus semua filter').click(); return empty && (await page.locator('ul.divide-y > li').count()) === 5;
  });
  await step('tamu: ubah lalu hapus tamu', async () => {
    await page.getByRole('button', { name: /Keluarga Uji/ }).click(); await dialog().waitFor();
    await dialog().getByRole('button', { name: 'Hapus tamu ini' }).click(); await page.waitForTimeout(200);
    return await page.getByText('10 orang dalam 4 undangan').isVisible();
  });
  await page.waitForTimeout(300);
  await shot('07-tamu');

  // G. Profil, pengajuan WCC
  await nav('Beranda'); await page.waitForURL('**/beranda');
  await step('beranda: status pengajuan Mahesa tampil, promo Mahesa hilang', async () => await page.getByRole('heading', { name: 'Pengajuan ke Mahesa Weddings sudah dicatat' }).isVisible() && (await btn('Ajukan Paket Mahesa').count()) === 0);
  await step('beranda: profil -> validasi nama kosong, simpan kota', async () => {
    await btn('Buka profil proyek').click(); await dialog().waitFor();
    await dialog().getByLabel('Nama pengantin pria').fill(''); await dialog().getByRole('button', { name: 'Simpan profil' }).click();
    const err = await dialog().getByText('Isi nama pengantin pria.').isVisible();
    await dialog().getByLabel('Nama pengantin pria').fill('Raka'); await dialog().getByLabel('Kota acara').fill('Bogor Tengah');
    await dialog().getByRole('button', { name: 'Simpan profil' }).click(); await page.waitForTimeout(200);
    return err && await page.getByText('Bogor Tengah').isVisible();
  });
  await step('beranda: keluar -> /masuk', async () => { await btn('Buka profil proyek').click(); await dialog().getByRole('button', { name: 'Keluar dari akun' }).click(); await page.waitForURL('**/masuk'); });
  await step('guard: /beranda tanpa sesi dialihkan ke /masuk', async () => { await page.goto(BASE + '/beranda'); await page.waitForURL('**/masuk'); });

  // I. Admin Mahesa (layar lebar)
  await page.setViewportSize({ width: 1280, height: 860 });
  await btn('Admin Mahesa', false).click(); await page.waitForURL('**/admin');
  await step('admin Mahesa: pengajuan masuk berisi 2 proyek', async () => { await page.getByRole('heading', { name: 'Pengajuan paket masuk' }).waitFor(); return (await btn('Tautkan proyek').count()) === 2; });
  await step('admin Mahesa: tabel hanya proyek tertaut Mahesa', async () => (await page.locator('tbody tr').count()) === 1);
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'tests/e2e/shots/08-admin-mahesa.png', fullPage: true });
  await step('admin Mahesa: tautkan Aulia & Raka -> masuk tabel', async () => { await page.locator('li', { hasText: 'Aulia & Raka' }).getByRole('button', { name: 'Tautkan proyek' }).click(); await page.waitForTimeout(200); return (await page.locator('tbody tr').count()) === 2; });
  await step('admin Mahesa: buka detail proyek', async () => { await page.locator('tbody').getByRole('link', { name: 'Aulia & Raka' }).click(); await page.waitForURL('**/admin/proyek/w1'); return await page.getByRole('heading', { name: 'Rundown hari H' }).isVisible(); });
  await step('admin Mahesa: rundown kosong -> validasi, lalu tambah', async () => {
    const form = page.locator('section', { hasText: 'Rundown hari H' });
    await form.getByRole('button', { name: 'Tambah', exact: true }).click(); const err = await form.getByText('Isi jam dan nama acaranya.').isVisible();
    await form.getByLabel('Jam').fill('09:00'); await form.getByLabel('Acara').fill('Akad nikah uji'); await form.getByRole('button', { name: 'Tambah', exact: true }).click();
    await page.waitForTimeout(150); return err && await form.getByText('Akad nikah uji').isVisible();
  });
  await step('admin Mahesa: tambah vendor kelolaan dari katalog', async () => {
    const sec = page.locator('section', { hasText: 'Vendor proyek' });
    await sec.getByLabel('Sumber vendor').selectOption({ label: 'Fotografi Contoh A (Dokumentasi)' }); await sec.getByRole('button', { name: 'Tambah vendor' }).click();
    await page.waitForTimeout(150); return await sec.getByText('Dokumentasi, dikelola Mahesa').isVisible();
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'tests/e2e/shots/09-admin-detail.png', fullPage: true });
  await step('admin Mahesa: katalog -> tambah venue, lalu hapus dengan konfirmasi', async () => {
    await page.getByRole('navigation', { name: 'Menu admin' }).getByRole('link', { name: 'Katalog' }).click(); await page.waitForURL('**/admin/katalog');
    await btn('Tambah venue').click(); await dialog().waitFor();
    await dialog().getByRole('button', { name: 'Tambah venue' }).click(); const err = await dialog().getByText('Isi nama venue.').isVisible();
    await dialog().getByLabel('Nama venue').fill('Venue Uji'); await dialog().getByLabel('Kota').fill('Kota Bogor'); await dialog().getByRole('button', { name: 'Tambah venue' }).click();
    await page.waitForTimeout(200); const added = await page.locator('tbody').getByText('Venue Uji').isVisible();
    await btn('Hapus Venue Uji').first().click(); await dialog().waitFor(); await dialog().getByRole('button', { name: 'Hapus', exact: true }).click();
    await page.waitForTimeout(200); return err && added && (await page.locator('tbody').getByText('Venue Uji').count()) === 0;
  });
  await page.screenshot({ path: 'tests/e2e/shots/10-admin-katalog.png', fullPage: true });
  await step('admin Mahesa: /admin/promo ditolak', async () => { await page.goto(BASE + '/admin/promo'); return await page.getByText('Menu ini bukan untuk role kamu').isVisible(); });
  await step('admin Mahesa: menu tidak memuat Kartu promo', async () => (await page.getByRole('navigation', { name: 'Menu admin' }).getByRole('link').count()) === 2);
  await step('admin Mahesa: keluar', async () => { await btn('Keluar').click(); await page.waitForURL('**/masuk'); });

  // J. Pengantin melihat hasil admin
  await page.setViewportSize({ width: 390, height: 844 });
  await btn('Pengantin pria').click(); await page.waitForURL('**/beranda');
  await step('pengantin: rundown dari Mahesa tampil terkunci', async () => await page.getByText('Akad nikah uji').isVisible() && await page.getByText('Dikelola Mahesa').isVisible());
  await page.waitForTimeout(500);
  await shot('11-beranda-tertaut');
  await step('pengantin: vendor kelolaan Mahesa terkunci -> ajukan perubahan', async () => {
    await nav('Vendor'); await page.waitForURL('**/vendor');
    await page.getByRole('button', { name: /Fotografi Contoh A.*dikelola Mahesa/ }).click(); await dialog().waitFor();
    const disabled = await dialog().getByRole('button', { name: 'Tulis perubahannya dulu' }).isDisabled();
    await dialog().getByLabel('Perubahan yang diminta').fill('Ganti ke paket foto dan video');
    await dialog().getByRole('link', { name: 'Kirim lewat WhatsApp' }).click(); await page.waitForTimeout(300);
    await nav('Beranda'); await page.waitForURL('**/beranda');
    return disabled && await page.locator('main').getByText('Menunggu konfirmasi', { exact: true }).isVisible();
  });
  await btn('Buka profil proyek').click(); await dialog().getByRole('button', { name: 'Keluar dari akun' }).click(); await page.waitForURL('**/masuk');

  // K. Admin Mahesa menyetujui (layar HP, lewat menu)
  await btn('Admin Mahesa', false).click(); await page.waitForURL('**/admin');
  await step('admin di HP: tanpa overflow, daftar jadi kartu', async () => (await overflow()) <= 0 && await page.locator('ul[aria-label="Daftar proyek pernikahan"]').isVisible());
  await shot('12-admin-hp');
  await step('admin di HP: tombol Menu membuka navigasi', async () => { await btn('Menu').click(); await dialog().waitFor(); const n = await dialog().getByRole('link').count(); await page.keyboard.press('Escape'); return n === 2; });
  await step('admin Mahesa: setujui permintaan perubahan', async () => {
    await page.goto(BASE + '/admin/proyek/w1'); await btn('Setujui perubahan').click(); await page.waitForTimeout(150);
    return await page.locator('main').getByText('Disetujui', { exact: true }).isVisible();
  });
  await btn('Menu').click(); await dialog().getByRole('button', { name: 'Keluar' }).click(); await page.waitForURL('**/masuk');

  // L. Admin Momentum
  await page.setViewportSize({ width: 1280, height: 860 });
  await btn('Admin Momentum', false).click(); await page.waitForURL('**/admin');
  await step('admin Momentum: hanya 1 proyek tertaut, 1 pengajuan', async () => (await page.locator('tbody tr').count()) === 1 && (await btn('Tautkan proyek').count()) === 1);
  await step('admin Momentum: proyek Mahesa ditolak', async () => { await page.goto(BASE + '/admin/proyek/w2'); return await page.getByText('Menu ini bukan untuk role kamu').isVisible(); });
  await step('admin Momentum: form WCC validasi tautan, lalu simpan', async () => {
    await page.goto(BASE + '/admin/proyek/w3'); await page.getByLabel('Status editing').selectOption('editing');
    await page.getByLabel('Tautan hasil video').fill('drive.google.com/x'); await btn('Simpan data WCC').click();
    const err = await page.getByText('Tautan harus diawali https://').isVisible();
    await page.getByLabel('Tautan hasil video').fill('https://example.com/hasil'); await btn('Simpan data WCC').click();
    await page.waitForTimeout(150); return err && (await page.getByText('Tautan harus diawali https://').count()) === 0;
  });
  await step('admin Momentum: /admin/katalog ditolak', async () => { await page.goto(BASE + '/admin/katalog'); return await page.getByText('Menu ini bukan untuk role kamu').isVisible(); });
  await btn('Keluar').click(); await page.waitForURL('**/masuk');

  // M. Super Admin
  await btn('Super Admin', false).click(); await page.waitForURL('**/admin');
  await step('super admin: melihat semua 4 proyek', async () => (await page.locator('tbody tr').count()) === 4);
  await step('super admin: ubah tautan organisasi di detail', async () => { await page.goto(BASE + '/admin/proyek/w4'); await page.getByLabel('Tautan ke Mahesa Weddings').selectOption('aktif'); await page.waitForTimeout(150); return await page.getByRole('heading', { name: 'Rundown hari H' }).isVisible(); });
  await step('super admin: ubah kartu promo', async () => {
    await page.goto(BASE + '/admin/promo'); await btn('Ubah kartu Hari-H jadi reels').click(); await dialog().waitFor();
    await dialog().getByLabel('Judul').fill('Hari-H jadi reels uji'); await dialog().getByRole('button', { name: 'Simpan perubahan' }).click();
    await page.waitForTimeout(200); return await page.locator('tbody').getByText('Hari-H jadi reels uji').isVisible();
  });
  await page.screenshot({ path: 'tests/e2e/shots/13-admin-promo.png', fullPage: true });
  await step('super admin: tambah item ceklis default (validasi + simpan)', async () => {
    await page.goto(BASE + '/admin/ceklis'); await btn('Tambah item').click(); await dialog().waitFor();
    await dialog().getByRole('button', { name: 'Tambah item default' }).click(); const err = await dialog().getByText('Isi judul item.').isVisible();
    await dialog().getByLabel('Judul item').fill('Item default uji'); await dialog().getByLabel('Kelompok').fill('Dokumen dasar'); await dialog().getByLabel('Urutan').fill('5');
    await dialog().getByRole('button', { name: 'Tambah item default' }).click(); await page.waitForTimeout(200);
    return err && await page.locator('tbody').getByText('Item default uji').isVisible();
  });
  await page.screenshot({ path: 'tests/e2e/shots/14-admin-ceklis.png', fullPage: true });
  await step('super admin: ganti nomor Mahesa -> peringatan nomor contoh hilang', async () => {
    await page.goto(BASE + '/admin/akun'); const warned = await page.getByText('masih nomor contoh').isVisible();
    await page.getByLabel('WhatsApp admin Mahesa').fill('081234567890'); await btn('Simpan kontak').click(); await page.waitForTimeout(200);
    return warned && (await page.getByText('masih nomor contoh').count()) === 0;
  });
  await step('super admin: akun admin validasi email, lalu tambah', async () => {
    await btn('Tambah akun admin').click(); await dialog().waitFor();
    await dialog().getByLabel('Nama').fill('Admin Uji'); await dialog().getByLabel('Email Google').fill('bukan-email'); await dialog().getByRole('button', { name: 'Tambah akun admin' }).click();
    const err = await dialog().getByText('Isi email Google yang valid.').isVisible();
    await dialog().getByLabel('Email Google').fill('uji@contoh.id'); await dialog().getByRole('button', { name: 'Tambah akun admin' }).click();
    await page.waitForTimeout(200); return err && await page.locator('tbody').getByText('uji@contoh.id').isVisible();
  });
  await page.screenshot({ path: 'tests/e2e/shots/15-admin-akun.png', fullPage: true });
  await btn('Keluar').click(); await page.waitForURL('**/masuk');

  // N. Pasangan baru, item default baru ikut tampil
  await page.setViewportSize({ width: 390, height: 844 });
  await step('pasangan baru: buat proyek -> /mulai', async () => { await btn('Buat proyek baru').click(); await page.waitForURL('**/mulai'); });
  await step('mulai: validasi nama, jalur, lalu selesai', async () => {
    await btn('Lanjut').click(); const e1 = await page.getByText('Isi nama pengantin wanita.').isVisible();
    await page.getByLabel('Nama pengantin wanita').fill('Sinta'); await page.getByLabel('Nama pengantin pria').fill('Bima'); await btn('Lanjut').click();
    await btn('Lanjut').click(); const e2 = await page.getByText('Pilih salah satu jalur dulu.').isVisible();
    await page.getByRole('radio', { name: /Non-Muslim/ }).check(); await btn('Lanjut').click();
    await btn('Simpan dan buat proyek').click(); await page.getByText('Kode pasangan').waitFor();
    return e1 && e2;
  });
  await shot('16-mulai-kode');
  await step('mulai: lanjut ke beranda dengan tanggal kosong', async () => { await page.getByRole('link', { name: 'Lanjut ke beranda' }).click(); await page.waitForURL('**/beranda'); return await page.getByText('Tanggal akad belum diisi').isVisible(); });
  await page.waitForTimeout(500);
  await shot('17-beranda-kosong');
  await step('pasangan baru: ceklis jalur Catatan Sipil + item default baru', async () => { await nav('Ceklis'); await page.waitForURL('**/ceklis'); return await page.getByText('Formulir pencatatan perkawinan').isVisible() && await page.getByText('Item default uji').isVisible() && (await page.getByText('Fotokopi KTP', { exact: true }).count()) === 0; });
  await step('pasangan baru: empty state budget, tamu, vendor', async () => {
    await nav('Budget'); await page.waitForURL('**/budget'); await page.getByText('Belum ada pos budget').waitFor();
    await nav('Tamu'); await page.waitForURL('**/tamu'); await page.getByText('Daftar tamu masih kosong').waitFor();
    await nav('Vendor'); await page.waitForURL('**/vendor'); await page.getByText('Belum ada vendor disimpan').waitFor();
    return true;
  });
  await page.waitForTimeout(400);
  await shot('18-vendor-kosong');

  // O. Overflow dan target sentuh di berbagai lebar
  const couplePages = ['/beranda', '/ceklis', '/vendor', '/budget', '/tamu'];
  for (const w of [320, 360, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width: w, height: 800 });
    for (const p of couplePages) { await page.goto(BASE + p); await page.waitForTimeout(350); const o = await overflow(); if (o > 0) log(false, `overflow ${p} @${w}`, `${o}px`); const c = await clipped(); if (c.length) log(false, `terpotong ${p} @${w}`, c.join(' | ').slice(0, 200)); }
  }
  log(!results.some((r) => !r.ok && /^(overflow|terpotong) \/(beranda|ceklis|vendor|budget|tamu)/.test(r.name)), 'pengantin: tanpa overflow dan tanpa konten terpotong di 6 lebar, 320 sampai 1440 (5 halaman)');
  await page.setViewportSize({ width: 360, height: 780 });
  const small = [];
  for (const p of couplePages) {
    await page.goto(BASE + p); await page.waitForTimeout(1000);
    const bad = await page.evaluate(() => [...document.querySelectorAll('button, a[href], select, input:not([type=hidden])')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.height < 43.9 || r.width < 43.9); }).map((el) => `${el.tagName}:${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}:${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`));
    if (bad.length) small.push(`${p}: ${bad.join(' | ')}`);
  }
  log(small.length === 0, 'pengantin: semua target sentuh minimal 44px', small.join(' ;; ').slice(0, 400));
  await shot('19-beranda-360');
  await page.goto(BASE + '/masuk'); await page.getByRole('button', { name: /Keluar|Pengantin wanita/ }).first().waitFor();

  // Admin di berbagai lebar
  await page.setViewportSize({ width: 1280, height: 860 }); await btn('Super Admin', false).click(); await page.waitForURL('**/admin');
  const adminPages = ['/admin', '/admin/proyek/w2', '/admin/katalog', '/admin/promo', '/admin/ceklis', '/admin/akun'];
  let adminOk = true;
  for (const w of [320, 360, 430, 768, 900, 1024, 1280, 1440]) {
    await page.setViewportSize({ width: w, height: 800 });
    for (const p of adminPages) { await page.goto(BASE + p); await page.waitForTimeout(350); const o = await overflow(); if (o > 0) { adminOk = false; log(false, `overflow ${p} @${w}`, `${o}px`); } const c = await clipped(); if (c.length) { adminOk = false; log(false, `terpotong ${p} @${w}`, c.join(' | ').slice(0, 200)); } }
  }
  log(adminOk, 'admin: tanpa overflow dan tanpa konten terpotong di 8 lebar, 320 sampai 1440 (6 halaman)');
  await page.setViewportSize({ width: 768, height: 900 }); await page.goto(BASE + '/admin'); await page.waitForTimeout(400);
  await page.screenshot({ path: 'tests/e2e/shots/20-admin-768.png', fullPage: true });
  await page.setViewportSize({ width: 1024, height: 900 }); await page.goto(BASE + '/admin/katalog'); await page.waitForTimeout(600);
  await page.screenshot({ path: 'tests/e2e/shots/21-admin-1024.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto(BASE + '/admin/katalog'); await page.waitForTimeout(600);
  await page.screenshot({ path: 'tests/e2e/shots/22-admin-1440.png', fullPage: true });

  // P. Keyboard
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(BASE + '/admin/akun'); await page.waitForTimeout(400);
  await step('keyboard: Tab memberi fokus terlihat', async () => { await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); const s = await page.evaluate(() => { const el = document.activeElement; const c = getComputedStyle(el); return `${el.tagName} ${c.outlineStyle} ${c.outlineWidth}`; }); return /solid 3px/.test(s) ? s : false; });
  await step('keyboard: Enter membuka dialog, fokus masuk ke dialog, Escape menutup', async () => {
    await page.getByRole('button', { name: 'Tambah akun admin' }).focus(); await page.keyboard.press('Enter'); await dialog().waitFor();
    const inside = await page.evaluate(() => !!document.activeElement.closest('dialog')); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    return inside && (await dialog().count()) === 0;
  });

  // Q. Manifest dan halaman offline
  await step('PWA: manifest dan ikon terlayani', async () => { const m = await page.request.get(BASE + '/manifest.webmanifest'); const j = await m.json(); const i = await page.request.get(BASE + j.icons[1].src); const o = await page.request.get(BASE + '/offline.html'); const sw = await page.request.get(BASE + '/sw.js'); return m.ok() && i.ok() && o.ok() && sw.ok() && j.name === 'Momentum Planner'; });
  await step('404: halaman tidak ditemukan punya jalan kembali', async () => { await page.goto(BASE + '/tidak-ada'); return await page.getByRole('link', { name: 'Kembali ke awal' }).isVisible(); });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length} lulus, ${failed.length} gagal`);
  console.log('console errors:', errors.length ? errors.slice(0, 10) : 'tidak ada');
})();
