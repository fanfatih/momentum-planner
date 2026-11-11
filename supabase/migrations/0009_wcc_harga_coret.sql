-- Harga coret: harga normal yang dicoret saat ada promo. Kosong berarti tanpa coretan.
alter table public.wcc_packages add column old_price int check (old_price is null or old_price > price);
alter table public.wcc_addons add column old_price int check (old_price is null or old_price > price);
