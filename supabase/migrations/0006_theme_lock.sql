-- Tema undangan dikunci setelah dipilih pasangan. Hanya Super Admin yang bisa mengganti atau membuka kunci,
-- misalnya setelah pasangan membeli tema tambahan lewat WhatsApp.

alter table public.invitations add column theme_locked boolean not null default false;

update public.invitations set theme = 'blush' where theme = 'klasik';
alter table public.invitations alter column theme set default 'blush';

create function public.protect_invitation_theme() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and old.theme_locked and auth.uid() is not null and not public.is_super() then
    if new.theme is distinct from old.theme or new.theme_locked is not true then
      raise exception 'Tema undangan sudah dikunci. Hubungi admin untuk mengganti tema.';
    end if;
  end if;
  return new;
end;
$$;

create trigger invitations_protect_theme before update on public.invitations
  for each row execute function public.protect_invitation_theme();

create function public.admin_set_invitation_theme(p_wedding uuid, p_theme text, p_locked boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_super() then
    raise exception 'Hanya Super Admin yang boleh mengganti tema.';
  end if;
  if length(btrim(coalesce(p_theme, ''))) not between 1 and 40 then
    raise exception 'Nama tema tidak valid.';
  end if;
  update public.invitations set theme = p_theme, theme_locked = p_locked, updated_at = now() where wedding_id = p_wedding;
  if not found then
    raise exception 'Pasangan belum membuat undangan.';
  end if;
end;
$$;

revoke execute on function public.protect_invitation_theme() from public, anon, authenticated;
revoke execute on function public.admin_set_invitation_theme(uuid, text, boolean) from public, anon;
grant execute on function public.admin_set_invitation_theme(uuid, text, boolean) to authenticated;
