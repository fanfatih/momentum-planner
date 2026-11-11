"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { ChangeRequestSheet, ORG_NAME } from "@/components/promo";
import { PageHeader, SectionTitle } from "@/components/shell";
import {
  Button,
  buttonClass,
  Card,
  Chip,
  cx,
  EmptyState,
  IconButton,
  Reveal,
  Segmented,
  SelectField,
  Sheet,
  Tag,
  TextAreaField,
  TextField,
  toast,
} from "@/components/ui";
import { mapsLink, priceRange, waLink } from "@/lib/format";
import { useCurrentWedding } from "@/lib/guard";
import { VENDOR_STATUS } from "@/lib/labels";
import { VENDOR_CATEGORIES } from "@/lib/seed";
import { removeWeddingVendor, saveBudget, saveWeddingVendor, toggleFavorite, useApp } from "@/lib/store";
import type { VendorStatus, Wedding, WeddingVendor } from "@/lib/types";

type View = "vendor" | "venue";

const STATUS_OPTIONS = (Object.keys(VENDOR_STATUS) as VendorStatus[]).map((v) => ({
  value: v,
  label: VENDOR_STATUS[v].label,
}));

function MyVendorForm({ item, wedding, onClose }: { item: WeddingVendor; wedding: Wedding; onClose: () => void }) {
  const budget = useApp((s) => s.budget);
  const [status, setStatus] = useState<VendorStatus>(item.status);
  const [note, setNote] = useState(item.note);
  const budgetLabel = `${item.category}: ${item.name}`;
  const inBudget = budget.some((b) => b.weddingId === wedding.id && b.category === budgetLabel);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        saveWeddingVendor({ ...item, status, note: note.trim() });
        toast("Vendor diperbarui.");
        onClose();
      }}
    >
      <div>
        <p className="text-[19px] font-semibold text-ink">{item.name}</p>
        <p className="text-sm text-ink-soft">{item.category}</p>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-semibold">Status</p>
        <Segmented label="Status vendor" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
      </div>
      <TextAreaField
        label="Catatan (opsional)"
        placeholder="Contoh: paket 300 porsi, DP 30 persen"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button type="submit" block>
        Simpan perubahan
      </Button>
      {item.wa && (
        <a
          href={waLink(item.wa, `Halo ${item.name}, kami ingin tanya paket untuk acara pernikahan.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("secondary", true)}
        >
          <Icon name="chat" size={18} />
          Hubungi lewat WhatsApp
        </a>
      )}
      {status === "deal" &&
        (inBudget ? (
          <Link href="/budget" className={buttonClass("secondary", true)}>
            Sudah ada di budget, buka budget
          </Link>
        ) : (
          <Button
            variant="secondary"
            block
            icon="wallet"
            onClick={() => {
              saveWeddingVendor({ ...item, status, note: note.trim() });
              saveBudget({ weddingId: wedding.id, category: budgetLabel, planned: 0, actual: 0 });
              toast("Ditambahkan ke budget. Isi angkanya di tab Budget.");
              onClose();
            }}
          >
            Tambahkan ke budget
          </Button>
        ))}
      <Button
        variant="danger"
        block
        icon="trash"
        onClick={() => {
          removeWeddingVendor(item.id);
          toast("Vendor dihapus dari pilihan.");
          onClose();
        }}
      >
        Hapus dari pilihan
      </Button>
    </form>
  );
}

function AddVendorForm({ weddingId, onClose }: { weddingId: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(VENDOR_CATEGORIES[0]);
  const [wa, setWa] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) {
          setError("Isi nama vendornya.");
          return;
        }
        saveWeddingVendor({
          weddingId,
          catalogId: null,
          name: name.trim(),
          category,
          wa: wa.trim(),
          status: "kandidat",
          note: note.trim(),
          managedBy: "couple",
        });
        toast("Vendor ditambahkan sebagai kandidat.");
        onClose();
      }}
    >
      <TextField
        label="Nama vendor"
        value={name}
        error={error}
        onChange={(e) => {
          setName(e.target.value);
          setError("");
        }}
      />
      <SelectField label="Kategori" value={category} onChange={(e) => setCategory(e.target.value)}>
        {VENDOR_CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </SelectField>
      <TextField
        label="Nomor WhatsApp (opsional)"
        inputMode="tel"
        placeholder="08xxxxxxxxxx"
        value={wa}
        onChange={(e) => setWa(e.target.value)}
      />
      <TextAreaField label="Catatan (opsional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button type="submit" block>
        Simpan sebagai kandidat
      </Button>
    </form>
  );
}

function VendorView({ wedding }: { wedding: Wedding }) {
  const catalog = useApp((s) => s.vendors);
  const allMine = useApp((s) => s.weddingVendors);
  const [category, setCategory] = useState("Semua");
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [changeFor, setChangeFor] = useState<WeddingVendor | null>(null);

  const mine = useMemo(() => allMine.filter((v) => v.weddingId === wedding.id), [allMine, wedding.id]);
  const categories = useMemo(() => ["Semua", ...Array.from(new Set(catalog.map((v) => v.category)))], [catalog]);
  const shown = catalog.filter((v) => category === "Semua" || v.category === category);
  const open = mine.find((v) => v.id === openId) ?? null;

  return (
    <>
      <SectionTitle aside={mine.length ? `${mine.length} vendor` : undefined}>Pilihan kami</SectionTitle>
      {mine.length === 0 ? (
        <EmptyState
          icon="store"
          title="Belum ada vendor disimpan"
          body="Simpan dari rekomendasi di bawah, atau tambah vendor yang kalian temukan sendiri."
          action={
            <Button icon="plus" onClick={() => setAdding(true)}>
              Tambah vendor sendiri
            </Button>
          }
        />
      ) : (
        <>
          <Card className="mx-5 divide-y divide-line overflow-hidden">
            {mine.map((v) => {
              const locked = v.managedBy !== "couple";
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => (locked ? setChangeFor(v) : setOpenId(v.id))}
                  className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-cream-deep active:bg-line"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{v.name}</span>
                    <span className="block text-[13px] text-ink-soft">
                      {v.category}
                      {locked && v.managedBy !== "couple" ? `, dikelola ${ORG_NAME[v.managedBy]}` : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Tag tone={VENDOR_STATUS[v.status].tone}>{VENDOR_STATUS[v.status].label}</Tag>
                    <Icon name={locked ? "lock" : "chevronRight"} size={16} className="text-ink-soft" />
                  </span>
                </button>
              );
            })}
          </Card>
          <div className="px-5 pt-3">
            <Button variant="secondary" block icon="plus" onClick={() => setAdding(true)}>
              Tambah vendor sendiri
            </Button>
          </div>
        </>
      )}

      <SectionTitle>Rekomendasi</SectionTitle>
      {catalog.length === 0 ? (
        <p className="px-5 text-[15px] text-ink-soft">
          Katalog vendor masih kosong. Rekomendasi muncul di sini setelah admin menambahkannya.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 px-5">
            {categories.map((c) => (
              <Chip key={c} selected={category === c} onClick={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>
          <ul className="mt-3 space-y-3 px-5">
            {shown.map((v, i) => {
              const saved = mine.some((m) => m.catalogId === v.id);
              return (
                <Reveal as="li" key={v.id} i={i}>
                    <Card className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{v.name}</p>
                        <p className="text-[13px] text-ink-soft">
                          {v.category}
                          {v.priceNote ? `, ${v.priceNote.toLowerCase()}` : ""}
                        </p>
                        {v.sample && (
                          <div className="mt-1.5">
                            <Tag>Data contoh</Tag>
                          </div>
                        )}
                      </div>
                      {saved ? (
                        <Tag tone="leaf">
                          <Icon name="check" size={12} />
                          Tersimpan
                        </Tag>
                      ) : (
                        <Button
                          variant="secondary"
                          className="shrink-0"
                          onClick={() => {
                            saveWeddingVendor({
                              weddingId: wedding.id,
                              catalogId: v.id,
                              name: v.name,
                              category: v.category,
                              wa: v.wa,
                              status: "kandidat",
                              note: "",
                              managedBy: "couple",
                            });
                            toast(`${v.name} disimpan sebagai kandidat.`);
                          }}
                        >
                          Simpan
                        </Button>
                      )}
                    </Card>
                </Reveal>
              );
            })}
          </ul>
        </>
      )}

      <Sheet open={!!open} onClose={() => setOpenId(null)} title="Detail vendor">
        {open && <MyVendorForm key={open.id} item={open} wedding={wedding} onClose={() => setOpenId(null)} />}
      </Sheet>
      <Sheet open={adding} onClose={() => setAdding(false)} title="Tambah vendor sendiri">
        <AddVendorForm weddingId={wedding.id} onClose={() => setAdding(false)} />
      </Sheet>
      {changeFor && changeFor.managedBy !== "couple" && (
        <ChangeRequestSheet
          open
          onClose={() => setChangeFor(null)}
          wedding={wedding}
          org={changeFor.managedBy}
          section={`Vendor ${changeFor.name}`}
        />
      )}
    </>
  );
}

const CAPACITY = [
  { key: "all", label: "Semua kapasitas", test: () => true },
  { key: "s", label: "Sampai 200", test: (n: number) => n <= 200 },
  { key: "m", label: "201 sampai 500", test: (n: number) => n > 200 && n <= 500 },
  { key: "l", label: "Di atas 500", test: (n: number) => n > 500 },
] as const;

function VenueView({ wedding }: { wedding: Wedding }) {
  const venues = useApp((s) => s.venues);
  const favorites = useApp((s) => s.favorites);
  const [city, setCity] = useState("Semua kota");
  const [cap, setCap] = useState<(typeof CAPACITY)[number]["key"]>("all");
  const [favOnly, setFavOnly] = useState(false);

  const cities = useMemo(() => ["Semua kota", ...Array.from(new Set(venues.map((v) => v.city).filter(Boolean)))], [venues]);
  const isFav = (id: string) => favorites.some((f) => f.weddingId === wedding.id && f.venueId === id);
  const capTest = CAPACITY.find((c) => c.key === cap)!.test;
  const shown = venues.filter(
    (v) =>
      (city === "Semua kota" || v.city === city) &&
      (cap === "all" || (v.capacity !== null && capTest(v.capacity))) &&
      (!favOnly || isFav(v.id)),
  );
  const filtered = city !== "Semua kota" || cap !== "all" || favOnly;

  if (venues.length === 0) {
    return (
      <EmptyState
        icon="pin"
        title="Direktori venue masih kosong"
        body="Venue di Bogor dan sekitarnya muncul di sini setelah admin menambahkannya."
      />
    );
  }

  return (
    <>
      <div className="space-y-3 px-5 pt-4">
        <SelectField label="Kota" value={city} onChange={(e) => setCity(e.target.value)}>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </SelectField>
        <div role="group" aria-label="Kapasitas tamu" className="flex flex-wrap gap-2">
          {CAPACITY.map((c) => (
            <Chip key={c.key} selected={cap === c.key} onClick={() => setCap(c.key)}>
              {c.label}
            </Chip>
          ))}
        </div>
        <label className="flex min-h-11 items-center gap-3 text-[15px] text-ink">
          <input
            type="checkbox"
            className="size-5 accent-[var(--brand)]"
            checked={favOnly}
            onChange={(e) => setFavOnly(e.target.checked)}
          />
          Tampilkan favorit saja
        </label>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon="search"
          title="Tidak ada venue yang cocok"
          body={favOnly ? "Belum ada venue favorit untuk filter ini." : "Coba longgarkan filter kota atau kapasitas."}
          action={
            filtered ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setCity("Semua kota");
                  setCap("all");
                  setFavOnly(false);
                }}
              >
                Hapus semua filter
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="mt-4 space-y-3 px-5">
          {shown.map((v, i) => (
            <Reveal as="li" key={v.id} i={i}>
                <Card className="overflow-hidden">
                  {v.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.photoUrl}
                      alt={`Foto ${v.name}`}
                      width={800}
                      height={450}
                      loading="lazy"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-[19px]">{v.name}</h2>
                        <p className="mt-0.5 text-sm text-ink-soft">
                          {v.city || "Kota belum diisi"}
                          {v.capacity ? `, kapasitas ${v.capacity.toLocaleString("id-ID")} tamu` : ""}
                        </p>
                      </div>
                      <IconButton
                        icon="heart"
                        filled={isFav(v.id)}
                        aria-pressed={isFav(v.id)}
                        label={isFav(v.id) ? `Hapus ${v.name} dari favorit` : `Simpan ${v.name} ke favorit`}
                        className={cx("-mr-2 -mt-2", isFav(v.id) && "text-brand hover:text-brand-deep")}
                        onClick={() => toggleFavorite(wedding.id, v.id)}
                      />
                    </div>
                    <p className="mt-2 text-[15px] font-semibold text-ink">{priceRange(v.priceMin, v.priceMax)}</p>
                    {v.note && <p className="mt-1 text-sm text-ink-soft">{v.note}</p>}
                    {v.sample && (
                      <div className="mt-2">
                        <Tag>Data contoh</Tag>
                      </div>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {v.wa ? (
                        <a
                          href={waLink(v.wa, `Halo ${v.name}, kami ingin tanya ketersediaan dan harga venue untuk pernikahan.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={buttonClass("secondary")}
                        >
                          <Icon name="chat" size={18} />
                          WhatsApp
                        </a>
                      ) : (
                        <span className="grid min-h-11 place-items-center text-center text-[13px] text-ink-soft">
                          Kontak belum diisi
                        </span>
                      )}
                      <a
                        href={mapsLink(v.mapsQuery || `${v.name} ${v.city}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClass("secondary")}
                      >
                        <Icon name="pin" size={18} />
                        Google Maps
                      </a>
                    </div>
                  </div>
                </Card>
            </Reveal>
          ))}
        </ul>
      )}
    </>
  );
}

export default function VendorPage() {
  const wedding = useCurrentWedding();
  const [view, setView] = useState<View>("vendor");
  if (!wedding) return null;

  return (
    <>
      <PageHeader title="Vendor dan Venue" />
      <div className="px-5">
        <Segmented
          label="Jenis daftar"
          value={view}
          onChange={setView}
          options={[
            { value: "vendor", label: "Vendor" },
            { value: "venue", label: "Venue" },
          ]}
        />
      </div>
      {view === "vendor" ? <VendorView wedding={wedding} /> : <VenueView wedding={wedding} />}
    </>
  );
}
