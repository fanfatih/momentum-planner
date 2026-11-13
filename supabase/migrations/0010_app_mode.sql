-- Pilihan pemakaian: planner lengkap atau undangan digital saja. Kosong berarti belum memilih.
alter table public.weddings add column app_mode text check (app_mode in ('planner', 'undangan'));

-- Proyek lama yang sudah memilih jalur tetap memakai planner, jadi tidak ditanya ulang.
update public.weddings set app_mode = 'planner' where track is not null;
