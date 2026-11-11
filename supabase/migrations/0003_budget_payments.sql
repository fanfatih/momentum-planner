-- Riwayat pembayaran vendor: siapa yang membayar, kapan, dan berapa.
-- Kolom budget_items.paid dijaga oleh trigger supaya dua pasangan yang mencatat bersamaan tidak saling menimpa.

alter table public.budget_items add constraint budget_items_id_wedding_key unique (id, wedding_id);

create table public.budget_payments (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  budget_id uuid not null,
  amount bigint not null check (amount > 0),
  paid_on date not null default current_date,
  payer text not null check (payer in ('bride', 'groom')),
  note text not null default '',
  created_at timestamptz not null default now(),
  foreign key (budget_id, wedding_id) references public.budget_items (id, wedding_id) on delete cascade
);

create index on public.budget_payments (wedding_id);
create index on public.budget_payments (budget_id);

alter table public.budget_payments enable row level security;

create policy budget_payments_read on public.budget_payments for select to authenticated
  using (public.can_read_wedding(wedding_id));
create policy budget_payments_write on public.budget_payments for all to authenticated
  using (public.is_member(wedding_id)) with check (public.is_member(wedding_id));

create function public.sync_budget_paid() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.budget_items set paid = paid + new.amount where id = new.budget_id;
  elsif tg_op = 'DELETE' then
    -- Pos yang ikut terhapus (cascade) sudah tidak ada, update ini tidak mengubah apa pun.
    update public.budget_items set paid = greatest(paid - old.amount, 0) where id = old.budget_id;
  else
    update public.budget_items set paid = greatest(paid - old.amount + new.amount, 0) where id = new.budget_id;
  end if;
  return null;
end $$;

create trigger budget_payments_sync after insert or update of amount or delete on public.budget_payments
  for each row execute function public.sync_budget_paid();

revoke execute on function public.sync_budget_paid() from public, anon, authenticated;
