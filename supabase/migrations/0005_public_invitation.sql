-- Halaman undangan publik: dibuka tamu tanpa login lewat fungsi khusus, bukan lewat tabel.
-- RSVP masuk lewat submit_rsvp supaya tamu tidak punya akses tulis langsung ke tabel.

create table public.invitation_rsvps (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  guest_name text not null check (length(btrim(guest_name)) between 1 and 60),
  attendance text not null check (attendance in ('hadir', 'tidak_hadir')),
  guests int not null default 1 check (guests between 1 and 10),
  message text not null default '' check (length(message) <= 300),
  created_at timestamptz not null default now()
);

create unique index invitation_rsvps_name_key on public.invitation_rsvps (wedding_id, lower(btrim(guest_name)));

alter table public.invitation_rsvps enable row level security;

create policy rsvps_read on public.invitation_rsvps for select to authenticated
  using (public.can_read_wedding(wedding_id));
create policy rsvps_delete on public.invitation_rsvps for delete to authenticated
  using (public.is_member(wedding_id));

create function public.get_public_invitation(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('slug', i.slug, 'theme', i.theme, 'content', i.content)
  from public.invitations i
  join public.weddings w on w.id = i.wedding_id
  where i.slug = p_slug and i.published and w.plan = 'premium';
$$;

create function public.submit_rsvp(p_slug text, p_name text, p_attendance text, p_guests int, p_message text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  w uuid;
begin
  select i.wedding_id into w
  from public.invitations i
  join public.weddings x on x.id = i.wedding_id
  where i.slug = p_slug and i.published and x.plan = 'premium';
  if w is null then
    raise exception 'Undangan tidak ditemukan.';
  end if;
  if length(btrim(coalesce(p_name, ''))) not between 1 and 60 then
    raise exception 'Nama wajib diisi, maksimal 60 huruf.';
  end if;
  if p_attendance not in ('hadir', 'tidak_hadir') then
    raise exception 'Pilihan kehadiran tidak dikenal.';
  end if;
  if (select count(*) from public.invitation_rsvps where wedding_id = w) >= 600 then
    raise exception 'Respons untuk undangan ini sudah penuh.';
  end if;
  insert into public.invitation_rsvps (wedding_id, guest_name, attendance, guests, message)
  values (
    w, btrim(p_name), p_attendance,
    case when p_attendance = 'hadir' then least(greatest(coalesce(p_guests, 1), 1), 10) else 1 end,
    left(coalesce(p_message, ''), 300)
  )
  on conflict (wedding_id, lower(btrim(guest_name))) do update
    set attendance = excluded.attendance, guests = excluded.guests, message = excluded.message, created_at = now();
end;
$$;

create function public.list_wishes(p_slug text)
returns table (guest_name text, attendance text, message text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select r.guest_name, r.attendance, r.message, r.created_at
  from public.invitation_rsvps r
  join public.invitations i on i.wedding_id = r.wedding_id
  join public.weddings w on w.id = r.wedding_id
  where i.slug = p_slug and i.published and w.plan = 'premium' and r.message <> ''
  order by r.created_at desc
  limit 50;
$$;

revoke execute on function public.get_public_invitation(text), public.submit_rsvp(text, text, text, int, text),
  public.list_wishes(text) from public;
grant execute on function public.get_public_invitation(text), public.submit_rsvp(text, text, text, int, text),
  public.list_wishes(text) to anon, authenticated;
