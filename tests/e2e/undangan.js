const { chromium } = require('playwright');
const BASE = 'http://localhost:3100';
let pass = 0, fail = 0;
const step = async (name, fn) => { try { const r = await fn(); if (r === false) throw new Error('false'); pass++; console.log('PASS ', name); } catch (e) { fail++; console.log('FAIL ', name, '->', e.message.split('\n')[0].slice(0, 160)); } };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/wa\.me/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.setDefaultTimeout(6000);
  const btn = (name) => page.getByRole('button', { name, exact: true });

  // Katalog publik, tanpa login
  await page.goto(BASE + '/katalog');
  await page.getByRole('heading', { name: 'Tema Standar' }).waitFor();
  await step('katalog: harga standar dan eksklusif dengan coretan', async () => {
    const std = page.locator('article:has(h3:text-is("Standar"))');
    const eks = page.locator('article:has(h3:text-is("Eksklusif"))');
    return (await std.locator('s').innerText()).includes('129.000') && (await std.getByText('Hemat 23%').isVisible()) && (await eks.locator('s').innerText()).includes('299.000') && (await eks.getByText('Hemat 50%').isVisible());
  });
  await step('katalog: 5 tema, tiap tema punya Pratinjau dan Tertarik ke WhatsApp', async () => {
    const n = await page.locator('[data-theme-id]').count();
    const href = await page.locator('[data-theme-id="blush"]').getByRole('link', { name: /Tertarik/ }).getAttribute('href');
    const t = decodeURIComponent(href.split('text=')[1]);
    return n === 5 && href.startsWith('https://wa.me/6285892928162?text=') && t.includes('Blush Oval') && t.includes('Standar');
  });
  await step('katalog: pratinjau tema menampilkan seksi lengkap (dresscode, siaran, kisah, kado)', async () => {
    await page.goto(BASE + '/katalog/blush');
    for (const h of ['Dresscode', 'Siaran langsung', 'Kisah cinta', 'Alamat kado']) await page.getByRole('heading', { name: h, exact: true }).waitFor({ state: 'attached' });
    return (await page.getByText('Ini contoh isi.').count()) === 1;
  });
  await step('katalog: tema tidak dikenal menampilkan pesan', async () => {
    await page.goto(BASE + '/katalog/tidak-ada');
    return page.getByRole('heading', { name: 'Tema tidak ditemukan' }).isVisible();
  });

  // Admin mengatur harga
  await page.goto(BASE + '/masuk');
  await page.getByRole('button', { name: 'Admin Momentum', exact: false }).click();
  await page.waitForURL('**/admin');
  await page.setViewportSize({ width: 1280, height: 900 });
  await step('admin: harga coret harus lebih besar dari harga jual', async () => {
    await page.goto(BASE + '/admin/paket-undangan');
    const f = page.getByRole('form', { name: 'Paket Standar' });
    await f.getByLabel('Harga coret (Rp)').fill('50000');
    await f.getByRole('button', { name: 'Simpan paket Standar' }).click();
    return f.getByText('Harga coret harus lebih besar dari harga jual.').isVisible();
  });
  await step('admin: ubah harga standar, katalog ikut berubah', async () => {
    const f = page.getByRole('form', { name: 'Paket Standar' });
    await f.getByLabel('Harga jual (Rp)').fill('89000');
    await f.getByLabel('Harga coret (Rp)').fill('119000');
    await f.getByRole('button', { name: 'Simpan paket Standar' }).click();
    await page.waitForTimeout(300);
    await page.goto(BASE + '/katalog');
    const std = page.locator('article:has(h3:text-is("Standar"))');
    return (await std.locator('s').innerText()).includes('119.000') && (await std.innerText()).includes('89.000');
  });

  // Pasangan baru memilih undangan saja
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + '/masuk');
  await step('mode: pasangan baru memilih Undangan digital saja, langkah lebih pendek', async () => {
    await btn('Buat proyek baru').click(); await page.waitForURL('**/mulai');
    await page.getByRole('radio', { name: /Undangan digital saja/ }).check(); await btn('Lanjut').click();
    const three = await page.getByText('Langkah 2 dari 3').isVisible();
    await page.getByLabel('Nama pengantin wanita').fill('Nadia'); await page.getByLabel('Nama pengantin pria').fill('Dimas'); await btn('Lanjut').click();
    await btn('Simpan dan buat proyek').click(); await page.getByText('Kode pasangan').waitFor();
    return three;
  });
  await step('mode: lanjut ke undangan, menu hanya Undangan dan Tamu, /beranda dialihkan', async () => {
    await page.getByRole('link', { name: 'Lanjut ke undangan' }).click(); await page.waitForURL('**/undangan');
    const links = await page.getByRole('navigation', { name: 'Menu utama' }).getByRole('link').allInnerTexts();
    await page.goto(BASE + '/beranda'); await page.waitForURL('**/undangan');
    return links.join(',') === 'Undangan,Tamu';
  });
  await step('mode: paket belum aktif menampilkan tautan ke katalog', async () => page.getByRole('link', { name: 'Lihat katalog dan harga' }).isVisible());
  await step('mode: Aktifkan planner membuka langkah jalur, lalu beranda', async () => {
    await btn('Profil').click();
    await page.getByRole('button', { name: 'Aktifkan planner' }).click(); await page.waitForURL('**/mulai');
    await page.getByRole('radio', { name: /Non-Muslim/ }).check(); await btn('Simpan dan buat proyek').click();
    await page.getByRole('link', { name: 'Lanjut ke beranda' }).click(); await page.waitForURL('**/beranda');
    return (await page.getByRole('navigation', { name: 'Menu utama' }).getByRole('link').count()) === 5;
  });

  // Saklar seksi di editor
  await page.goto(BASE + '/masuk'); await page.getByRole('button', { name: 'Super Admin', exact: false }).click(); await page.waitForURL('**/admin');
  await page.goto(BASE + '/admin/proyek/w1');
  await page.getByRole('group', { name: 'Paket proyek' }).getByRole('button', { name: 'Premium' }).click(); await page.waitForTimeout(200);
  await page.goto(BASE + '/masuk'); await btn('Pengantin wanita').click(); await page.waitForURL('**/beranda');
  await step('editor: seksi baru mati secara bawaan, dresscode menyala membuka isiannya', async () => {
    await page.goto(BASE + '/undangan'); await page.getByRole('heading', { name: 'Alamat undangan' }).waitFor();
    const isOn = await page.getByLabel('Tampilkan Dresscode').isChecked(); const fields = await page.getByLabel('Pesan dresscode').count();
    const off = !isOn && fields === 0;
    await page.getByLabel('Tampilkan Dresscode').check();
    await page.getByLabel('Pesan dresscode').fill('Warna earth tone.');
    await page.getByRole('button', { name: 'Tambah warna' }).click();
    return off && (await page.getByLabel('Warna 1', { exact: true }).count()) === 1;
  });
  await step('editor: kisah cinta, siaran langsung, dan alamat kado', async () => {
    await page.getByLabel('Tampilkan Kisah cinta').check();
    await page.getByRole('button', { name: 'Tambah cerita' }).click();
    await page.getByLabel('Waktu 1').fill('2021'); await page.getByLabel('Cerita 1').fill('Kami bertemu di kampus.');
    await page.getByLabel('Tampilkan Siaran langsung').check();
    await page.getByLabel('Link siaran').fill('https://youtube.com/live/abc');
    await page.getByLabel('Tampilkan Alamat kado').check();
    await page.getByLabel('Alamat lengkap').fill('Jl. Melati 5, Bogor');
    await page.getByLabel('Tampilkan Hitung mundur').uncheck();
    await page.getByLabel(/Aktifkan undangan/).check();
    await btn('Simpan isi undangan').click();
    return page.getByText('Isi undangan disimpan.').isVisible();
  });
  await step('editor: link siaran tanpa https ditolak', async () => {
    await page.getByLabel('Link siaran').fill('youtube.com/live/abc');
    await btn('Simpan isi undangan').click();
    const bad = await page.getByText('Link siaran harus diawali https://').isVisible();
    await page.getByLabel('Link siaran').fill('https://youtube.com/live/abc');
    await btn('Simpan isi undangan').click();
    return bad;
  });
  await step('undangan publik: seksi yang menyala tampil, hitung mundur yang dimatikan hilang', async () => {
    const slug = await page.getByLabel('Nama di alamat').inputValue();
    await page.goto(BASE + '/u/' + slug);
    for (const h of ['Dresscode', 'Siaran langsung', 'Kisah cinta', 'Alamat kado']) await page.getByRole('heading', { name: h, exact: true }).waitFor({ state: 'attached' });
    const live = await page.getByRole('link', { name: /Tonton siaran langsung/ }).getAttribute('href');
    return live === 'https://youtube.com/live/abc' && (await page.getByText(/hari lagi menuju hari bahagia/).count()) === 0;
  });
  await step('undangan publik: RSVP dimatikan menghilangkan konfirmasi dan ucapan', async () => {
    await page.goto(BASE + '/undangan'); await page.getByLabel('Tampilkan Konfirmasi dan ucapan').uncheck();
    await btn('Simpan isi undangan').click(); await page.getByText('Isi undangan disimpan.').waitFor();
    const slug = await page.getByLabel('Nama di alamat').inputValue();
    await page.goto(BASE + '/u/' + slug); await page.getByRole('heading', { name: 'Dresscode', exact: true }).waitFor({ state: 'attached' });
    return (await page.getByRole('heading', { name: 'Konfirmasi kehadiran' }).count()) === 0 && (await page.getByRole('heading', { name: 'Ucapan', exact: true }).count()) === 0;
  });
  await step('tanpa overflow horizontal: katalog dan pratinjau di 320 dan 1280', async () => {
    for (const w of [320, 1280]) {
      await page.setViewportSize({ width: w, height: 800 });
      for (const p of ['/katalog', '/katalog/malam']) { await page.goto(BASE + p); await page.waitForTimeout(300); if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) return `overflow ${p} @${w}`; }
    }
  });
  await browser.close();
  console.log(`\n${pass} lulus, ${fail} gagal`, errors.length ? errors : '');
  process.exit(fail ? 1 : 0);
})();
