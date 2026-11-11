const { chromium } = require('playwright');
const BASE = 'http://localhost:3100';
let pass = 0, fail = 0;
const step = async (name, fn) => { try { const r = await fn(); if (r === false) throw new Error('false'); pass++; console.log('PASS ', name); } catch (e) { fail++; console.log('FAIL ', name, '->', e.message.split('\n')[0].slice(0, 140)); } };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/wa\.me/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.setDefaultTimeout(6000);
  const target = new Date(Date.now() + 7 * 3600_000 + 3 * 86400_000).toISOString().slice(0, 10);

  await page.goto(BASE + '/masuk');
  await page.getByRole('button', { name: 'Admin Momentum', exact: false }).click();
  await page.waitForURL('**/admin');
  await step('admin WCC: menu WCC ada untuk Admin Momentum', async () => page.getByRole('navigation', { name: 'Menu admin' }).getByRole('link', { name: 'WCC' }).isVisible());
  await page.getByRole('navigation', { name: 'Menu admin' }).getByRole('link', { name: 'WCC' }).click();
  await page.waitForURL('**/admin/wcc');
  await step('admin WCC: tambah jadwal 07.00-12.00', async () => {
    await page.getByRole('button', { name: 'Tambah jadwal', exact: true }).click();
    const d = page.locator('dialog[open]');
    await d.getByLabel('Tanggal').fill(target);
    await d.getByLabel('Jam mulai').fill('07:00');
    await d.getByLabel('Jam selesai').fill('12:00');
    await d.getByLabel('Nama klien atau catatan').fill('Tes WA');
    await d.getByRole('button', { name: 'Tambah jadwal' }).click();
    await page.waitForTimeout(300);
    return (await page.locator('dialog[open]').count()) === 0;
  });
  await step('admin WCC: jadwal bentrok ditolak', async () => {
    await page.getByRole('button', { name: 'Tambah jadwal', exact: true }).click();
    const d = page.locator('dialog[open]');
    await d.getByLabel('Tanggal').fill(target);
    await d.getByLabel('Jam mulai').fill('09:00');
    await d.getByLabel('Jam selesai').fill('11:00');
    await d.getByRole('button', { name: 'Tambah jadwal' }).click();
    await page.waitForTimeout(300);
    const stillOpen = (await page.locator('dialog[open]').count()) === 1;
    await page.keyboard.press('Escape');
    return stillOpen;
  });
  await step('admin WCC: tab paket, add-on, porto, tim, teks terbuka', async () => {
    for (const [tab, h] of [['Paket', 'Paket WCC'], ['Add-on', 'Add-on'], ['Porto', 'Portofolio'], ['Tim', 'Tim'], ['Teks', 'Halaman utama']]) {
      await page.getByRole('radio', { name: tab, exact: true }).check({ force: true }).catch(() => page.getByText(tab, { exact: true }).first().click());
      await page.getByRole('heading', { name: h, exact: true }).first().waitFor();
    }
  });

  await page.goto(BASE + '/wcc');
  await page.locator('#booking').waitFor();
  await step('landing: paket dan harga tampil', async () => page.getByRole('heading', { name: 'Signature' }).first().isVisible());
  await step('landing: tanggal terisi sebagian, jam 13.00 bisa dipilih, 12.30 tidak (paket 3 jam)', async () => {
    await page.getByRole('radio', { name: /Intimate/ }).check({ force: true });
    const cell = page.locator(`[data-date="${target}"]`);
    await cell.click();
    const st = await cell.getAttribute('data-status');
    const ok13 = await page.getByRole('radio', { name: '13.00' }).count();
    const no1230 = await page.getByRole('radio', { name: '12.30' }).count();
    return st === 'sebagian' && ok13 === 1 && no1230 === 0;
  });
  await step('landing: tambah jam memperpanjang durasi dan mengurangi pilihan', async () => {
    const before = await page.getByRole('radiogroup', { name: 'Jam mulai' }).getByRole('radio').count();
    await page.getByRole('button', { name: 'Tambah Tambah jam' }).click();
    const after = await page.getByRole('radiogroup', { name: 'Jam mulai' }).getByRole('radio').count();
    return after < before;
  });
  await step('landing: kirim tanpa nama ditolak dengan pesan', async () => {
    await page.getByRole('link', { name: 'Kirim lewat WhatsApp' }).click();
    return page.getByRole('alert').filter({ hasText: 'Lengkapi dulu' }).isVisible();
  });
  await step('landing: tautan WhatsApp berisi pesanan', async () => {
    await page.getByRole('radio', { name: '13.00' }).click();
    await page.getByLabel('Nama kamu atau pasangan').fill('Aulia');
    const href = await page.getByRole('link', { name: 'Kirim lewat WhatsApp' }).getAttribute('href');
    const t = decodeURIComponent(href.split('text=')[1]);
    return href.startsWith('https://wa.me/6285892928162?text=') && t.includes('Aulia') && t.includes('13.00–17.00') && t.includes('Tambah jam 1 jam');
  });
  await step('landing: tanpa overflow di 320 dan 1280', async () => {
    for (const w of [320, 1280]) { await page.setViewportSize({ width: w, height: 800 }); if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) return false; }
  });
  await browser.close();
  console.log(`\n${pass} lulus, ${fail} gagal`, errors.length ? errors : '');
  process.exit(fail ? 1 : 0);
})();
