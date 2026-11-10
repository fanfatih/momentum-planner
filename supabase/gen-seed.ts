import { DEFAULT_TEMPLATES } from "../src/lib/seed";
import { writeFileSync } from "node:fs";

const q = (s: string | undefined) => (s === undefined ? "null" : `'${s.replace(/'/g, "''")}'`);

const tpl = DEFAULT_TEMPLATES.map(
  (t) =>
    `  (${q(t.kind)}, ${t.track === "semua" ? "null" : q(t.track)}, ${q(t.group)}, ${t.order}, ${q(t.title)}, ${q(t.hint)}, ${q(t.promo)})`,
).join(",\n");

const promos = [
  ["mahesa", "beranda", "Rencanakan bareng Mahesa Weddings", "Wedding organizer dan planner di Bogor. Setelah deal, admin Mahesa ikut mengelola vendor dan rundown proyekmu di aplikasi ini.", "Ajukan Paket Mahesa"],
  ["wcc", "beranda", "Hari-H jadi reels", "Paket wedding content creator dari Momentum by Luna. Tiap bulan, satu pasangan mendapat paket WCC gratis.", "Tanya Paket WCC"],
  ["mahesa", "ceklis-wo", "Belum punya WO?", "Admin Mahesa bisa membantu memilih vendor dan menyusun rundown.", "Ajukan Paket Mahesa"],
  ["wcc", "ceklis-dokumentasi", "Cari dokumentasi video?", "Momentum by Luna membuat reels pernikahan, dengan opsi same-day edit.", "Tanya Paket WCC"],
]
  .map((p) => `  (${p.map(q).join(", ")})`)
  .join(",\n");

const sql = `-- Data awal: ceklis default, kartu promo, kontak organisasi, dan undangan admin.
-- Nomor dan email Mahesa masih contoh. Ganti lewat panel Super Admin.

insert into public.checklist_templates (kind, track, group_name, sort_order, title, hint, promo_trigger) values
${tpl};

insert into public.promo_cards (target, trigger, title, body, cta) values
${promos};

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
`;
writeFileSync(new URL("./migrations/0002_seed.sql", import.meta.url), sql);
console.log("ok", DEFAULT_TEMPLATES.length);
