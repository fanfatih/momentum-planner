const { chromium } = require('playwright');
const BASE = 'http://localhost:3100';
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const audit = async (path) => {
    await p.goto(BASE + path); await p.waitForTimeout(700);
    const r = await p.evaluate(() => {
      const hs = [...document.querySelectorAll('h1,h2,h3,h4')].filter((h) => !h.closest('dialog')).map((h) => Number(h.tagName[1]));
      let skip = false; for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) skip = true;
      return { h1: hs.filter((x) => x === 1).length, first: hs[0], seq: hs.join(''), skip, lang: document.documentElement.lang, title: document.title, main: document.querySelectorAll('main').length };
    });
    const ok = r.h1 === 1 && r.first === 1 && !r.skip && r.lang === "id" && r.main === 1 && (r.title.includes(" | Momentum Planner") || path === "/tidak-ada");
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${path.padEnd(22)} h1=${r.h1} urutan=${r.seq} main=${r.main} title="${r.title}"`);
  };
  await audit('/masuk');
  await p.goto(BASE + '/masuk'); await p.getByRole('button', { name: 'Pengantin wanita', exact: true }).click(); await p.waitForURL('**/beranda');
  for (const x of ['/beranda', '/ceklis', '/vendor', '/budget', '/tamu']) await audit(x);
  await p.goto(BASE + '/vendor'); await p.getByRole('button', { name: 'Venue', exact: true }).click(); await p.waitForTimeout(500);
  const venue = await p.evaluate(() => [...document.querySelectorAll('h1,h2,h3')].map((h) => h.tagName[1]).join(''));
  console.log(`${/^1(2+)$/.test(venue) ? 'PASS' : 'FAIL'}  /vendor (tab Venue)     urutan=${venue}`);
  await p.goto(BASE + '/masuk'); await p.getByRole('button', { name: /Admin Momentum/ }).click(); await p.waitForURL('**/admin');
  for (const x of ['/admin', '/admin/proyek/w3', '/admin/katalog', '/admin/proyek/w2']) await audit(x);
  await p.goto(BASE + '/masuk'); await p.getByRole('button', { name: /Super Admin/ }).click(); await p.waitForURL('**/admin');
  for (const x of ['/admin', '/admin/proyek/w2', '/admin/katalog', '/admin/promo', '/admin/ceklis', '/admin/akun', '/admin/proyek/tidak-ada']) await audit(x);
  await audit('/tidak-ada');
  await b.close();
})();
