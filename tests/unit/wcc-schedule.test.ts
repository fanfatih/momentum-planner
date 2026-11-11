import assert from "node:assert/strict";
import { test } from "node:test";
import { availableStarts, conflicts, dayStatus, fmtMin, longestGap, toMin } from "../../src/lib/wcc-schedule";

const h = (n: number) => n * 60;
const slot = (a: number, b: number) => ({ start: h(a), end: h(b) });

test("toMin dan fmtMin", () => {
  assert.equal(toMin("07:00"), 420);
  assert.equal(toMin("7.30"), 450);
  assert.ok(Number.isNaN(toMin("abc")));
  assert.equal(fmtMin(450), "07.30");
});

test("hari kosong: semua jam mulai muat sampai jam tutup", () => {
  const s = availableStarts([], h(3));
  assert.equal(s[0], h(6));
  assert.equal(s[s.length - 1], h(20)); // 20.00 + 3 jam = 23.00 (tepat jam tutup)
  assert.equal(dayStatus([], h(3)), "kosong");
});

test("contoh pengguna: booking 07-12, jam 13.00 sudah bisa dipesan, 12.30 belum", () => {
  const ex = [slot(7, 12)];
  const s = availableStarts(ex, h(3));
  assert.ok(!s.includes(h(12)));
  assert.ok(!s.includes(h(12) + 30));
  assert.ok(s.includes(h(13)));
  assert.ok(!s.includes(h(6) - 30));
});

test("sebelum booking: acara baru harus selesai 1 jam sebelum mulai", () => {
  const ex = [slot(10, 12)];
  // 3 jam sebelum 10.00 dengan jeda: mulai 06.00 selesai 09.00 -> pas
  assert.ok(availableStarts(ex, h(3)).includes(h(6)));
  // mulai 06.30 selesai 09.30: kurang jeda
  assert.ok(!availableStarts(ex, h(3)).includes(h(6) + 30));
});

test("acara boleh berakhir tepat jam tutup tanpa memikirkan jeda sesudahnya", () => {
  assert.ok(availableStarts([], h(5)).includes(h(18)));
  assert.ok(!availableStarts([], h(5)).includes(h(18) + 30));
});

test("status: sebagian dan penuh", () => {
  assert.equal(dayStatus([slot(7, 12)], h(3)), "sebagian");
  // 06-23 hampir penuh: tinggal celah 13.00-18.00 setelah 6-12; booking kedua 14-22 menyisakan celah 13-14
  const ex = [slot(6, 12), slot(14, 22)];
  assert.equal(dayStatus(ex, h(3)), "penuh");
  assert.equal(dayStatus(ex, h(1)), "penuh"); // 13.00-14.00 tidak muat jeda
});

test("konflik: overlap versus jeda kurang", () => {
  const ex = [slot(7, 12)];
  assert.deepEqual(conflicts(ex, slot(10, 14)).map((c) => c.kind), ["overlap"]);
  assert.deepEqual(conflicts(ex, slot(12, 15)).map((c) => c.kind), ["jeda"]);
  assert.deepEqual(conflicts(ex, slot(13, 16)), []);
  assert.deepEqual(conflicts(ex, slot(3, 6)), []);
});

test("celah terpanjang", () => {
  assert.equal(longestGap([]), h(17));
  assert.equal(longestGap([slot(7, 12)]), h(10)); // 13.00-23.00
});
