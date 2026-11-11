-- Paket proyek (gratis atau premium) dan isi undangan digital.
-- Paket hanya bisa diubah Super Admin, setelah pembayaran dikonfirmasi lewat WhatsApp.

alter table public.weddings
  add column plan text not null default 'gratis' check (plan in ('gratis', 'premium'));

create function public.protect_wedding_plan() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.plan is distinct from old.plan and auth.uid() is not null and not public.is_super() then
    raise exception 'Hanya Super Admin yang boleh mengubah paket proyek.';
  end if;
  return new;
end;
$$;

create trigger weddings_protect_plan before update on public.weddings
  for each row execute function public.protect_wedding_plan();

create function public.is_premium(w uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.weddings where id = w and plan = 'premium');
$$;

create table public.invitations (
  wedding_id uuid primary key references public.weddings (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 40),
  theme text not null default 'klasik',
  published boolean not null default false,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.invitations enable row level security;

create policy invitations_read on public.invitations for select to authenticated
  using (public.can_read_wedding(wedding_id));
create policy invitations_write on public.invitations for all to authenticated
  using (public.is_member(wedding_id) and public.is_premium(wedding_id))
  with check (public.is_member(wedding_id) and public.is_premium(wedding_id));

-- Cek alamat undangan lintas proyek tanpa membuka isi undangan orang lain.
create function public.slug_available(p_slug text, p_wedding uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.invitations where slug = p_slug and wedding_id <> p_wedding);
$$;

revoke execute on function public.protect_wedding_plan() from public, anon, authenticated;
revoke execute on function public.is_premium(uuid) from public, anon;
revoke execute on function public.slug_available(text, uuid) from public, anon;
