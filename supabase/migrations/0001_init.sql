-- Momentum Planner: skema awal dan aturan akses per role.
-- Role: couple (pengantin), admin_mahesa, admin_momentum, super_admin.

create type public.app_role as enum ('couple', 'admin_mahesa', 'admin_momentum', 'super_admin');
create type public.wedding_track as enum ('muslim', 'nonmuslim');
create type public.link_status as enum ('diajukan', 'aktif');
create type public.edit_status as enum ('belum', 'shooting', 'editing', 'selesai');
create type public.vendor_status as enum ('kandidat', 'dihubungi', 'deal');
create type public.guest_group as enum ('keluarga_pria', 'keluarga_wanita', 'teman', 'kolega');
create type public.guest_status as enum ('belum', 'diundang', 'hadir', 'tidak_hadir');
create type public.checklist_kind as enum ('administrasi', 'acara');
create type public.request_status as enum ('menunggu', 'disetujui', 'ditolak');

create table public.organizations (
  id text primary key check (id in ('mahesa', 'momentum')),
  name text not null,
  wa text not null default '',
  email text not null default ''
);

insert into public.organizations (id, name, wa) values
  ('mahesa', 'Mahesa Weddings', ''),
  ('momentum', 'Momentum by Luna', '6285892928162');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  wa text not null default '',
  role public.app_role not null default 'couple',
  org_id text references public.organizations (id),
  created_at timestamptz not null default now()
);

-- Email di tabel ini otomatis mendapat role admin saat pertama kali login Google.
create table public.admin_invites (
  email text primary key,
  name text not null default '',
  role public.app_role not null check (role <> 'couple'),
  org_id text references public.organizations (id)
);

create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  track public.wedding_track,
  bride_name text not null default '',
  groom_name text not null default '',
  akad_date date,
  city text not null default '',
  contact_wa text not null default '',
  created_at timestamptz not null default now()
);

create table public.wedding_members (
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  side text not null check (side in ('bride', 'groom')),
  primary key (wedding_id, profile_id),
  unique (wedding_id, side)
);

create table public.wedding_links (
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  org_id text not null references public.organizations (id),
  status public.link_status not null default 'diajukan',
  shoot_date date,
  edit_status public.edit_status not null default 'belum',
  result_link text not null default '',
  created_at timestamptz not null default now(),
  primary key (wedding_id, org_id)
);

create table public.rundown_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  at_time time not null,
  title text not null,
  note text not null default ''
);

create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  kind public.checklist_kind not null,
  track public.wedding_track,
  group_name text not null,
  sort_order int not null default 100,
  title text not null,
  hint text,
  promo_trigger text check (promo_trigger in ('ceklis-wo', 'ceklis-dokumentasi'))
);
comment on column public.checklist_templates.track is 'null berarti berlaku untuk semua jalur';

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  template_id uuid references public.checklist_templates (id) on delete cascade,
  title text not null default '',
  kind public.checklist_kind not null default 'acara',
  group_name text not null default '',
  done boolean not null default false,
  hidden boolean not null default false,
  due date,
  note text not null default '',
  unique (wedding_id, template_id)
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null default '',
  capacity int check (capacity is null or capacity > 0),
  price_min bigint,
  price_max bigint,
  wa text not null default '',
  maps_query text not null default '',
  photo_url text not null default '',
  note text not null default '',
  created_by_org text references public.organizations (id),
  created_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  wa text not null default '',
  price_note text not null default '',
  note text not null default '',
  created_by_org text references public.organizations (id),
  created_at timestamptz not null default now()
);

create table public.wedding_vendors (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  vendor_id uuid references public.vendors (id) on delete set null,
  name text not null,
  category text not null,
  wa text not null default '',
  status public.vendor_status not null default 'kandidat',
  note text not null default '',
  managed_by text not null default 'couple' check (managed_by in ('couple', 'mahesa'))
);

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  category text not null,
  planned bigint not null default 0 check (planned >= 0),
  actual bigint not null default 0 check (actual >= 0),
  paid bigint not null default 0 check (paid >= 0)
);

-- Kolom token disiapkan untuk tautan undangan digital per tamu di fase 2.
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  wa text not null default '',
  group_name public.guest_group not null default 'teman',
  person_count int not null default 1 check (person_count > 0),
  status public.guest_status not null default 'belum',
  token uuid not null unique default gen_random_uuid()
);

create table public.favorites (
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  venue_id uuid not null references public.venues (id) on delete cascade,
  primary key (wedding_id, venue_id)
);

create table public.promo_cards (
  id uuid primary key default gen_random_uuid(),
  target text not null check (target in ('mahesa', 'wcc')),
  trigger text not null check (trigger in ('beranda', 'ceklis-wo', 'ceklis-dokumentasi')),
  title text not null,
  body text not null,
  cta text not null,
  active boolean not null default true
);

create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  org_id text not null references public.organizations (id),
  section text not null,
  note text not null,
  status public.request_status not null default 'menunggu',
  created_at timestamptz not null default now()
);

create index on public.wedding_members (profile_id);
create index on public.checklist_items (wedding_id);
create index on public.wedding_vendors (wedding_id);
create index on public.budget_items (wedding_id);
create index on public.guests (wedding_id);
create index on public.rundown_items (wedding_id);
create index on public.change_requests (wedding_id);

-- Fungsi bantu. SECURITY DEFINER supaya pengecekan tidak ikut terkena RLS dan berputar tanpa henti.

create function public.my_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.my_org() returns text
language sql stable security definer set search_path = '' as $$
  select org_id from public.profiles where id = auth.uid()
$$;

create function public.is_super() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'super_admin' from public.profiles where id = auth.uid()), false)
$$;

create function public.is_member(w uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.wedding_members m where m.wedding_id = w and m.profile_id = auth.uid())
$$;

-- Admin organisasi hanya menyentuh isi proyek setelah tautannya aktif.
create function public.is_linked_admin(w uuid, org text default null) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.wedding_links l
    join public.profiles p on p.id = auth.uid()
    where l.wedding_id = w
      and l.org_id = p.org_id
      and l.status = 'aktif'
      and p.role in ('admin_mahesa', 'admin_momentum')
      and (org is null or l.org_id = org)
  )
$$;

create function public.can_read_wedding(w uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_member(w) or public.is_linked_admin(w) or public.is_super()
$$;

-- Profil dibuat otomatis saat user baru login. Role admin diambil dari admin_invites.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  inv public.admin_invites%rowtype;
begin
  select * into inv from public.admin_invites where lower(email) = lower(new.email);
  insert into public.profiles (id, email, full_name, role, org_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', inv.name, ''),
    coalesce(inv.role, 'couple'),
    inv.org_id
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- User biasa tidak boleh menaikkan role atau pindah organisasi lewat update profil sendiri.
create function public.protect_profile_role() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.role is distinct from old.role or new.org_id is distinct from old.org_id)
     and auth.uid() is not null
     and not public.is_super() then
    raise exception 'Hanya Super Admin yang boleh mengubah role atau organisasi.';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Membuat proyek baru sekaligus mendaftarkan pembuatnya sebagai anggota.
create function public.create_wedding(p_side text, p_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  w uuid;
begin
  if auth.uid() is null then
    raise exception 'Harus login.';
  end if;
  insert into public.weddings (code) values (upper(p_code)) returning id into w;
  insert into public.wedding_members (wedding_id, profile_id, side) values (w, auth.uid(), p_side);
  return w;
end;
$$;

-- Gabung ke proyek pasangan lewat kode. Lewat fungsi karena non-anggota tidak bisa membaca tabel weddings.
create function public.join_wedding(p_code text, p_side text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  w uuid;
begin
  if auth.uid() is null then
    raise exception 'Harus login.';
  end if;
  select id into w from public.weddings where code = upper(p_code);
  if w is null then
    raise exception 'Kode tidak ditemukan.';
  end if;
  insert into public.wedding_members (wedding_id, profile_id, side) values (w, auth.uid(), p_side);
  return w;
end;
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.admin_invites enable row level security;
alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;
alter table public.wedding_links enable row level security;
alter table public.rundown_items enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_items enable row level security;
alter table public.venues enable row level security;
alter table public.vendors enable row level security;
alter table public.wedding_vendors enable row level security;
alter table public.budget_items enable row level security;
alter table public.guests enable row level security;
alter table public.favorites enable row level security;
alter table public.promo_cards enable row level security;
alter table public.change_requests enable row level security;

-- Organisasi, katalog, template, dan kartu promo: terbaca semua user yang login.
create policy org_read on public.organizations for select to authenticated using (true);
create policy org_write on public.organizations for update to authenticated
  using (public.is_super()) with check (public.is_super());

create policy templates_read on public.checklist_templates for select to authenticated using (true);
create policy templates_write on public.checklist_templates for all to authenticated
  using (public.is_super()) with check (public.is_super());

create policy promo_read on public.promo_cards for select to authenticated using (true);
create policy promo_write on public.promo_cards for all to authenticated
  using (public.is_super()) with check (public.is_super());

create policy venues_read on public.venues for select to authenticated using (true);
create policy venues_write on public.venues for all to authenticated
  using (public.is_super() or public.my_role() = 'admin_mahesa')
  with check (public.is_super() or public.my_role() = 'admin_mahesa');

create policy vendors_read on public.vendors for select to authenticated using (true);
create policy vendors_write on public.vendors for all to authenticated
  using (public.is_super() or public.my_role() = 'admin_mahesa')
  with check (public.is_super() or public.my_role() = 'admin_mahesa');

-- Profil: baca milik sendiri, Super Admin baca semua.
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_super());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_super())
  with check (id = auth.uid() or public.is_super());

create policy invites_all on public.admin_invites for all to authenticated
  using (public.is_super()) with check (public.is_super());

-- Proyek: anggota, admin dengan tautan aktif, dan Super Admin.
-- Admin juga melihat baris proyek yang baru mengajukan ke organisasinya supaya bisa menautkan.
create policy weddings_read on public.weddings for select to authenticated
  using (
    public.can_read_wedding(id)
    or exists (
      select 1 from public.wedding_links l
      where l.wedding_id = weddings.id and l.org_id = public.my_org()
        and public.my_role() in ('admin_mahesa', 'admin_momentum')
    )
  );
create policy weddings_update on public.weddings for update to authenticated
  using (public.is_member(id) or public.is_super())
  with check (public.is_member(id) or public.is_super());
create policy weddings_delete on public.weddings for delete to authenticated using (public.is_super());

create policy members_read on public.wedding_members for select to authenticated
  using (public.can_read_wedding(wedding_id));

-- Tautan: pasangan hanya bisa mengajukan, admin organisasi dan Super Admin yang mengaktifkan.
create policy links_read on public.wedding_links for select to authenticated
  using (
    public.is_member(wedding_id)
    or public.is_super()
    or (org_id = public.my_org() and public.my_role() in ('admin_mahesa', 'admin_momentum'))
  );
create policy links_request on public.wedding_links for insert to authenticated
  with check ((public.is_member(wedding_id) and status = 'diajukan') or public.is_super());
create policy links_update on public.wedding_links for update to authenticated
  using (
    public.is_super()
    or (org_id = public.my_org() and public.my_role() in ('admin_mahesa', 'admin_momentum'))
  )
  with check (
    public.is_super()
    or (org_id = public.my_org() and public.my_role() in ('admin_mahesa', 'admin_momentum'))
  );
create policy links_delete on public.wedding_links for delete to authenticated
  using (
    public.is_super()
    or (org_id = public.my_org() and public.my_role() in ('admin_mahesa', 'admin_momentum'))
  );

-- Rundown: dibaca pasangan, ditulis hanya oleh admin Mahesa yang tertaut.
create policy rundown_read on public.rundown_items for select to authenticated
  using (public.can_read_wedding(wedding_id));
create policy rundown_write on public.rundown_items for all to authenticated
  using (public.is_super() or public.is_linked_admin(wedding_id, 'mahesa'))
  with check (public.is_super() or public.is_linked_admin(wedding_id, 'mahesa'));

-- Ceklis, budget, tamu, favorit: milik pasangan. Admin tertaut hanya membaca.
create policy checklist_read on public.checklist_items for select to authenticated
  using (public.can_read_wedding(wedding_id));
create policy checklist_write on public.checklist_items for all to authenticated
  using (public.is_member(wedding_id)) with check (public.is_member(wedding_id));

create policy budget_read on public.budget_items for select to authenticated
  using (public.can_read_wedding(wedding_id));
create policy budget_write on public.budget_items for all to authenticated
  using (public.is_member(wedding_id)) with check (public.is_member(wedding_id));

create policy guests_read on public.guests for select to authenticated
  using (public.can_read_wedding(wedding_id));
create policy guests_write on public.guests for all to authenticated
  using (public.is_member(wedding_id)) with check (public.is_member(wedding_id));

create policy favorites_read on public.favorites for select to authenticated
  using (public.can_read_wedding(wedding_id));
create policy favorites_write on public.favorites for all to authenticated
  using (public.is_member(wedding_id)) with check (public.is_member(wedding_id));

-- Vendor proyek: baris milik pasangan ditulis pasangan, baris kelolaan Mahesa terkunci untuk pasangan.
create policy wv_read on public.wedding_vendors for select to authenticated
  using (public.can_read_wedding(wedding_id));
create policy wv_write_couple on public.wedding_vendors for all to authenticated
  using (public.is_member(wedding_id) and managed_by = 'couple')
  with check (public.is_member(wedding_id) and managed_by = 'couple');
create policy wv_write_mahesa on public.wedding_vendors for all to authenticated
  using ((public.is_super() or public.is_linked_admin(wedding_id, 'mahesa')) and managed_by = 'mahesa')
  with check ((public.is_super() or public.is_linked_admin(wedding_id, 'mahesa')) and managed_by = 'mahesa');

-- Permintaan perubahan: dibuat pasangan, diputuskan admin organisasi tujuan.
create policy requests_read on public.change_requests for select to authenticated
  using (public.is_member(wedding_id) or public.is_super() or public.is_linked_admin(wedding_id, org_id));
create policy requests_create on public.change_requests for insert to authenticated
  with check (public.is_member(wedding_id) and status = 'menunggu');
create policy requests_decide on public.change_requests for update to authenticated
  using (public.is_super() or public.is_linked_admin(wedding_id, org_id))
  with check (public.is_super() or public.is_linked_admin(wedding_id, org_id));
