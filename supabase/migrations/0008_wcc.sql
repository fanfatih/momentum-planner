-- Landing page WCC: paket, add-on, jadwal, portofolio, tim, dan pengaturan.
-- Tabel ditutup untuk publik. Landing page hanya membaca lewat dua fungsi:
--   wcc_public()  isi halaman (tanpa data klien)
--   wcc_busy()    jam yang sudah terpakai, tanpa nama atau catatan

create function public.is_wcc_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role in ('super_admin', 'admin_momentum') from public.profiles where id = auth.uid()), false)
$$;
revoke execute on function public.is_wcc_admin() from public, anon;
grant execute on function public.is_wcc_admin() to authenticated;

-- Foto portofolio dan tim disimpan di folder wcc/ pada bucket invitation-media, boleh ditulis admin WCC.
create or replace function public.can_write_media(p_name text) returns boolean
language sql stable set search_path = '' as $$
  select case
    when split_part(p_name, '/', 1) = 'wcc' then public.is_wcc_admin()
    when split_part(p_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_member(split_part(p_name, '/', 1)::uuid) and public.is_premium(split_part(p_name, '/', 1)::uuid)
    else false
  end;
$$;

create table public.wcc_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 60),
  hours int not null check (hours between 1 and 24),
  price int not null check (price >= 0),
  features text[] not null default '{}',
  highlight boolean not null default false,
  active boolean not null default true,
  sort int not null default 0
);

create table public.wcc_addons (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 80),
  price int not null check (price >= 0),
  -- 'per_jam': harga dikali jumlah jam dan menambah durasi acara. 'sekali': satu kali.
  unit text not null default 'sekali' check (unit in ('sekali', 'per_jam')),
  note text not null default '',
  active boolean not null default true,
  sort int not null default 0
);

create table public.wcc_bookings (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  label text not null default '' check (length(label) <= 120),
  source text not null default 'wa' check (source in ('wa', 'web', 'lain')),
  status text not null default 'pasti' check (status in ('pasti', 'tentatif')),
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index on public.wcc_bookings (date);

create table public.wcc_portfolio (
  id uuid primary key default gen_random_uuid(),
  title text not null default '' check (length(title) <= 80),
  thumb_url text not null,
  link_url text not null check (link_url ~ '^https://'),
  sort int not null default 0
);

create table public.wcc_team (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 60),
  role text not null default '' check (length(role) <= 60),
  bio text not null default '' check (length(bio) <= 300),
  photo_url text not null default '',
  sort int not null default 0
);

create table public.wcc_settings (
  id int primary key check (id = 1),
  tagline text not null default '',
  ig_url text not null default '',
  free_enabled boolean not null default true,
  free_text text not null default '',
  free_rules text[] not null default '{}',
  promo_enabled boolean not null default false,
  promo_text text not null default '',
  terms text[] not null default '{}',
  faq jsonb not null default '[]'
);

alter table public.wcc_packages enable row level security;
alter table public.wcc_addons enable row level security;
alter table public.wcc_bookings enable row level security;
alter table public.wcc_portfolio enable row level security;
alter table public.wcc_team enable row level security;
alter table public.wcc_settings enable row level security;

create policy wcc_packages_staff on public.wcc_packages for all to authenticated using (public.is_wcc_admin()) with check (public.is_wcc_admin());
create policy wcc_addons_staff on public.wcc_addons for all to authenticated using (public.is_wcc_admin()) with check (public.is_wcc_admin());
create policy wcc_bookings_staff on public.wcc_bookings for all to authenticated using (public.is_wcc_admin()) with check (public.is_wcc_admin());
create policy wcc_portfolio_staff on public.wcc_portfolio for all to authenticated using (public.is_wcc_admin()) with check (public.is_wcc_admin());
create policy wcc_team_staff on public.wcc_team for all to authenticated using (public.is_wcc_admin()) with check (public.is_wcc_admin());
create policy wcc_settings_staff on public.wcc_settings for all to authenticated using (public.is_wcc_admin()) with check (public.is_wcc_admin());

create function public.wcc_public() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'wa', coalesce((select wa from public.organizations where id = 'momentum'), ''),
    'settings', (select to_jsonb(s) - 'id' from public.wcc_settings s where s.id = 1),
    'packages', coalesce((select jsonb_agg(to_jsonb(p) - 'active' order by p.sort, p.price) from public.wcc_packages p where p.active), '[]'::jsonb),
    'addons', coalesce((select jsonb_agg(to_jsonb(a) - 'active' order by a.sort, a.price) from public.wcc_addons a where a.active), '[]'::jsonb),
    'portfolio', coalesce((select jsonb_agg(to_jsonb(f) order by f.sort) from public.wcc_portfolio f), '[]'::jsonb),
    'team', coalesce((select jsonb_agg(to_jsonb(t) order by t.sort) from public.wcc_team t), '[]'::jsonb)
  )
$$;

create function public.wcc_busy(p_from date, p_to date) returns table (date date, start_time time, end_time time)
language sql stable security definer set search_path = '' as $$
  select b.date, b.start_time, b.end_time
  from public.wcc_bookings b
  where b.date between p_from and least(p_to, p_from + 120)
  order by b.date, b.start_time
$$;

revoke execute on function public.wcc_public() from public;
revoke execute on function public.wcc_busy(date, date) from public;
grant execute on function public.wcc_public() to anon, authenticated;
grant execute on function public.wcc_busy(date, date) to anon, authenticated;

-- Isi awal sesuai pricelist yang sudah disepakati.
insert into public.wcc_settings (id, tagline, ig_url, free_text, free_rules, promo_text, terms, faq) values (
  1,
  'Momen kecil, jadi cerita yang timeless.',
  'https://www.instagram.com/momentumbyluna/',
  'Setiap bulan, satu pasangan mendapat Paket Intimate gratis.',
  array['Ikuti Instagram @momentumbyluna', 'Tag calon pasanganmu di postingan giveaway', 'Bagikan postingan giveaway ke story', 'Tanggal acara maksimal 6 bulan ke depan, di area Kota Bogor', 'Pemenang diundi live di Instagram tiap akhir bulan'],
  'Promo launching: Paket Intimate 199K untuk 5 klien pertama. Hasilnya boleh kami posting di Instagram Momentum.',
  array['DP 30% untuk mengunci tanggal, pelunasan maksimal H-1', 'Transport gratis di Kota Bogor. Kab. Bogor atau Depok +50K, Jakarta, Bekasi, atau Tangerang +100K, lebih jauh sesuai jarak', 'Semua paket memakai mic dan lighting', 'File dikirim lewat Google Drive, hasil maksimal H+3', 'Klien Mahesa Weddings mendapat diskon 10% atau gratis 1 add-on'],
  '[{"q":"Bagaimana cara booking?","a":"Pilih paket, tanggal, dan jam di halaman ini, lalu kirim lewat WhatsApp. Tanggal baru terkunci setelah DP 30% diterima."},{"q":"Kapan hasilnya jadi?","a":"Maksimal H+3 setelah acara. Ingin lebih cepat? Ada add-on express edit H+1 dan same-day edit."},{"q":"Apakah ada biaya transport?","a":"Kota Bogor gratis. Di luar itu ada tambahan sesuai zona, tertera di syarat booking."},{"q":"Bagaimana jika acara lebih lama dari paket?","a":"Tambah jam lewat add-on, atau pilih paket dengan durasi lebih panjang."}]'::jsonb
);

insert into public.wcc_packages (name, hours, price, features, highlight, sort) values
  ('Intimate', 3, 250000, array['5 IG story real-time', '1 highlight reel 30–60 detik', '2 video TikTok/Reels trend', 'Unlimited shoot'], false, 1),
  ('Signature', 5, 350000, array['10 IG story real-time', '2 highlight reel', '3 video trend', '1 video behind the scene 15–30 detik', 'Unlimited shoot'], true, 2),
  ('Timeless', 8, 500000, array['15 IG story real-time', '3 highlight reel', '5 video trend', '1 video behind the scene', '1 cinematic recap 60–90 detik', 'Akad dan resepsi boleh beda jam', 'Unlimited shoot'], false, 3);

insert into public.wcc_addons (name, price, unit, note, sort) values
  ('Same-day edit', 100000, 'sekali', 'Video diputar di resepsi', 1),
  ('Express edit H+1', 50000, 'sekali', 'Hasil jadi sehari setelah acara', 2),
  ('Tambah video trend', 35000, 'sekali', 'Per video', 3),
  ('Tambah highlight reel', 50000, 'sekali', 'Per video', 4),
  ('Tambah jam', 40000, 'per_jam', 'Menambah durasi acara', 5),
  ('Kru tambahan', 100000, 'sekali', '', 6),
  ('Raw footage', 30000, 'sekali', 'Dikirim lewat Google Drive', 7),
  ('Akad dan resepsi beda hari', 75000, 'sekali', '', 8);
