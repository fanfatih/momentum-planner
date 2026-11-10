import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";

const db = new PGlite();
const migration = fs.readFileSync(new URL("../migrations/0001_init.sql", import.meta.url), "utf8");

// Tiruan minimal skema auth Supabase.
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role authenticated;
`);
await db.exec(migration);
await db.exec(`
  grant usage on schema public, auth to authenticated;
  grant all on all tables in schema public to authenticated;
  grant execute on all functions in schema public to authenticated;
  insert into public.admin_invites (email, name, role, org_id) values
    ('mahesa@x.id', 'Admin Mahesa', 'admin_mahesa', 'mahesa'),
    ('momentum@x.id', 'Admin Momentum', 'admin_momentum', 'momentum'),
    ('super@x.id', 'Super', 'super_admin', null);
`);

const mk = async (email) => (await db.query("insert into auth.users (email) values ($1) returning id", [email])).rows[0].id;
const U = {};
for (const e of ["bride", "groom", "outsider", "mahesa", "momentum", "super"]) U[e] = await mk(`${e}@x.id`);

let pass = 0, fail = 0;
const as = async (who) => {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [U[who]]);
  await db.exec("set role authenticated");
};
const check = (name, ok, extra = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  -> " + extra : ""}`); };
const count = async (sql) => Number((await db.query(sql)).rows[0].n);
const denied = async (name, sql, params = []) => {
  try { const r = await db.query(sql, params); check(name, r.affectedRows === 0, `affected ${r.affectedRows}`); }
  catch (e) { check(name, true, e.message.slice(0, 60)); }
};
const allowed = async (name, sql, params = []) => {
  try { const r = await db.query(sql, params); check(name, true); return r; }
  catch (e) { check(name, false, e.message.slice(0, 90)); }
};

await db.exec("reset role");
const roles = (await db.query("select email, role, org_id from public.profiles order by email")).rows;
check("profil otomatis dibuat, role dari admin_invites", roles.length === 6 && roles.find(r => r.email === "mahesa@x.id").role === "admin_mahesa" && roles.find(r => r.email === "bride@x.id").role === "couple");

await as("bride");
const w = (await db.query("select public.create_wedding('bride', 'mom-test') as id")).rows[0].id;
check("pengantin membuat proyek", !!w);
await allowed("pengantin menambah budget", "insert into public.budget_items (wedding_id, category, planned) values ($1, 'Venue', 1000)", [w]);
await allowed("pengantin menambah tamu", "insert into public.guests (wedding_id, name) values ($1, 'Tamu')", [w]);
await denied("pengantin tidak bisa menaikkan role sendiri", "update public.profiles set role = 'super_admin' where id = $1", [U.bride]);
await denied("pengantin tidak bisa langsung mengaktifkan tautan", "insert into public.wedding_links (wedding_id, org_id, status) values ($1, 'mahesa', 'aktif')", [w]);

await as("outsider");
check("orang luar tidak melihat proyek", (await count("select count(*) n from public.weddings")) === 0);
check("orang luar tidak melihat budget", (await count("select count(*) n from public.budget_items")) === 0);
await denied("orang luar tidak bisa menyusup jadi anggota", "insert into public.wedding_members (wedding_id, profile_id, side) values ($1, $2, 'groom')", [w, U.outsider]);
await denied("orang luar tidak bisa menulis budget", "insert into public.budget_items (wedding_id, category) values ($1, 'X')", [w]);

await as("groom");
await allowed("pasangan gabung lewat kode", "select public.join_wedding('MOM-TEST', 'groom')");
check("pasangan melihat budget yang sama", (await count("select count(*) n from public.budget_items")) === 1);

await as("mahesa");
check("admin Mahesa belum melihat proyek tanpa tautan", (await count("select count(*) n from public.weddings")) === 0);

await as("bride");
await allowed("pengantin mengajukan paket (status diajukan)", "insert into public.wedding_links (wedding_id, org_id) values ($1, 'mahesa')", [w]);

await as("mahesa");
check("admin Mahesa melihat baris proyek yang mengajukan", (await count("select count(*) n from public.weddings")) === 1);
check("tapi belum melihat budget sebelum aktif", (await count("select count(*) n from public.budget_items")) === 0);
await allowed("admin Mahesa mengaktifkan tautan", "update public.wedding_links set status = 'aktif' where wedding_id = $1 and org_id = 'mahesa'", [w]);
check("setelah aktif, admin Mahesa membaca budget", (await count("select count(*) n from public.budget_items")) === 1);
check("setelah aktif, admin Mahesa membaca tamu", (await count("select count(*) n from public.guests")) === 1);
await denied("admin Mahesa tidak bisa menulis budget pasangan", "insert into public.budget_items (wedding_id, category) values ($1, 'X')", [w]);
await allowed("admin Mahesa mengisi rundown", "insert into public.rundown_items (wedding_id, at_time, title) values ($1, '10:00', 'Akad')", [w]);
await allowed("admin Mahesa menambah vendor kelolaan", "insert into public.wedding_vendors (wedding_id, name, category, managed_by, status) values ($1, 'Catering', 'Catering', 'mahesa', 'deal')", [w]);
await denied("admin Mahesa tidak bisa menulis kartu promo", "insert into public.promo_cards (target, trigger, title, body, cta) values ('mahesa','beranda','a','b','c')");
await allowed("admin Mahesa menambah venue ke katalog", "insert into public.venues (name) values ('Gedung')");

await as("bride");
check("pengantin membaca rundown", (await count("select count(*) n from public.rundown_items")) === 1);
await denied("pengantin tidak bisa mengubah rundown", "update public.rundown_items set title = 'X'");
await denied("pengantin tidak bisa mengubah vendor kelolaan Mahesa", "update public.wedding_vendors set status = 'kandidat' where managed_by = 'mahesa'");
await denied("pengantin tidak bisa menyamar jadi vendor kelolaan Mahesa", "insert into public.wedding_vendors (wedding_id, name, category, managed_by) values ($1, 'X', 'MUA', 'mahesa')", [w]);
await allowed("pengantin menambah vendor sendiri", "insert into public.wedding_vendors (wedding_id, name, category) values ($1, 'MUA Sendiri', 'MUA')", [w]);
await allowed("pengantin membuat permintaan perubahan", "insert into public.change_requests (wedding_id, org_id, section, note) values ($1, 'mahesa', 'Rundown', 'ganti jam')", [w]);
await denied("pengantin tidak bisa menyetujui permintaannya sendiri", "update public.change_requests set status = 'disetujui'");
await denied("pengantin tidak bisa menulis katalog venue", "insert into public.venues (name) values ('X')");

await as("mahesa");
await allowed("admin Mahesa menyetujui permintaan", "update public.change_requests set status = 'disetujui'");
check("permintaan benar berubah", (await count("select count(*) n from public.change_requests where status = 'disetujui'")) === 1);

await as("momentum");
check("admin Momentum tidak melihat proyek Mahesa", (await count("select count(*) n from public.weddings")) === 0);
check("admin Momentum tidak melihat permintaan ke Mahesa", (await count("select count(*) n from public.change_requests")) === 0);
await denied("admin Momentum tidak bisa menulis rundown", "insert into public.rundown_items (wedding_id, at_time, title) values ($1, '09:00', 'X')", [w]);

await as("super");
check("Super Admin melihat semua proyek", (await count("select count(*) n from public.weddings")) === 1);
await allowed("Super Admin menulis kartu promo", "insert into public.promo_cards (target, trigger, title, body, cta) values ('mahesa','beranda','a','b','c')");
await allowed("Super Admin mengubah role user", "update public.profiles set role = 'admin_momentum', org_id = 'momentum' where id = $1", [U.outsider]);

console.log(`\n${pass} lulus, ${fail} gagal`);
process.exit(fail ? 1 : 0);
