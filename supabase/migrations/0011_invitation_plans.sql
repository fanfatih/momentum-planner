-- Harga paket undangan digital (standar dan eksklusif). Diatur admin Momentum atau Super Admin.
-- Halaman katalog publik membacanya lewat invitation_plans_public().

create table public.invitation_plans (
  id text primary key check (id in ('standar', 'eksklusif')),
  name text not null check (length(btrim(name)) between 1 and 40),
  price int not null check (price >= 0),
  old_price int check (old_price is null or old_price > price),
  blurb text not null default '',
  features text[] not null default '{}'
);

alter table public.invitation_plans enable row level security;
create policy invitation_plans_staff on public.invitation_plans for all to authenticated
  using (public.is_wcc_admin()) with check (public.is_wcc_admin());

create function public.invitation_plans_public() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'wa', coalesce((select wa from public.organizations where id = 'momentum'), ''),
    'plans', coalesce((select jsonb_agg(to_jsonb(p) order by case p.id when 'standar' then 1 else 2 end) from public.invitation_plans p), '[]'::jsonb)
  )
$$;
revoke execute on function public.invitation_plans_public() from public;
grant execute on function public.invitation_plans_public() to anon, authenticated;

insert into public.invitation_plans (id, name, price, old_price, blurb, features) values
  ('standar', 'Standar', 99000, 129000, 'Pilih satu tema standar, isi sendiri, dan bagikan lewat WhatsApp.',
    array['Satu link undangan dengan alamat sendiri', 'Link personal per tamu, nama tamu tampil di undangan', 'RSVP dan ucapan dari tamu', 'Galeri foto dan musik latar', 'Seksi bisa dinyalakan atau dimatikan: dresscode, siaran langsung, kisah cinta, alamat kado', 'Peta lokasi dan amplop digital']),
  ('eksklusif', 'Eksklusif', 149000, 299000, 'Desain khusus dengan ilustrasi dan animasi lebih kaya. Jumlah pemakai tiap tema dibatasi.',
    array['Semua fitur paket Standar', 'Desain dan animasi khusus', 'Jumlah pemakai tiap tema dibatasi']);
